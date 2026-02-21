import type { IncomingMessage, ServerResponse } from 'http'
import { redisExec, redisPipeline } from './_lib/redis'

const ADDR_KEY = (address: string) => `retro:nickname:addr:${address.toLowerCase()}`
const NAME_KEY = (normalizedNick: string) => `retro:nickname:name:${normalizedNick}`

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function normalizeAddress(v: unknown): string {
  return typeof v === 'string' ? v.trim().toLowerCase() : ''
}

function normalizeNickname(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += String(chunk)
      if (data.length > 1_000_000) reject(new Error('Payload too large'))
    })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch {
        reject(new Error('Invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

const NICK_RE = /^[a-zA-Z0-9_]{2,24}$/

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const method = req.method ?? 'GET'
    const url = new URL(req.url ?? '/', 'http://localhost')

    if (method === 'GET') {
      const address = normalizeAddress(url.searchParams.get('address'))
      if (!/^0x[a-f0-9]{40}$/i.test(address)) return sendJson(res, 400, { error: 'Invalid address' })
      const nick = await redisExec(['GET', ADDR_KEY(address)])
      return sendJson(res, 200, { nickname: typeof nick === 'string' && nick.trim() ? nick : null })
    }

    if (method === 'POST') {
      const body = (await parseBody(req)) as Record<string, unknown>
      const address = normalizeAddress(body.address)
      const nickname = normalizeNickname(body.nickname)
      if (!/^0x[a-f0-9]{40}$/i.test(address)) return sendJson(res, 400, { error: 'Invalid address' })
      if (!NICK_RE.test(nickname)) return sendJson(res, 400, { error: 'Invalid nickname' })

      const nickKey = NAME_KEY(nickname.toLowerCase())
      const [existingForNickRaw, existingForAddrRaw] = await redisPipeline([
        ['GET', nickKey],
        ['GET', ADDR_KEY(address)],
      ])
      const existingForNick = typeof existingForNickRaw === 'string' ? existingForNickRaw.toLowerCase() : null
      const existingForAddr = typeof existingForAddrRaw === 'string' ? existingForAddrRaw : null

      if (existingForNick && existingForNick !== address) {
        return sendJson(res, 409, { error: 'Nickname already taken' })
      }

      const cmds: [string, ...Array<string | number>][] = []
      if (existingForAddr && existingForAddr.toLowerCase() !== nickname.toLowerCase()) {
        cmds.push(['DEL', NAME_KEY(existingForAddr.toLowerCase())])
      }
      cmds.push(['SET', nickKey, address])
      cmds.push(['SET', ADDR_KEY(address), nickname])
      await redisPipeline(cmds)
      return sendJson(res, 200, { success: true, nickname })
    }

    res.setHeader('Allow', 'GET, POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  } catch (err) {
    return sendJson(res, 500, { error: err instanceof Error ? err.message : 'Internal error' })
  }
}
