import type { IncomingMessage, ServerResponse } from 'http'
import { redisExec, redisPipeline } from './_lib/redis'

type LeaderboardEntry = {
  address: string
  nickname: string
  score: number
  avatar?: string | null
  updatedAt: number
}

const LB_ZSET_KEY = 'retro:leaderboard:z'
const ENTRY_KEY = (address: string) => `retro:leaderboard:entry:${address.toLowerCase()}`

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function parseLimit(raw: string | null): number {
  const n = Number(raw ?? 20)
  if (!Number.isFinite(n) || n <= 0) return 20
  return Math.min(100, Math.floor(n))
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

function normalizeAddress(v: unknown): string {
  return typeof v === 'string' ? v.trim().toLowerCase() : ''
}

function toNum(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const method = req.method ?? 'GET'
    const url = new URL(req.url ?? '/', 'http://localhost')

    if (method === 'GET') {
      const address = normalizeAddress(url.searchParams.get('address'))
      if (address) {
        const best = await redisExec(['ZSCORE', LB_ZSET_KEY, address])
        return sendJson(res, 200, { best: toNum(best) })
      }

      const limit = parseLimit(url.searchParams.get('limit'))
      const raw = await redisExec(['ZREVRANGE', LB_ZSET_KEY, 0, limit - 1, 'WITHSCORES'])
      const flat = Array.isArray(raw) ? raw : []
      const addresses: string[] = []
      const scores: number[] = []

      for (let i = 0; i < flat.length; i += 2) {
        addresses.push(String(flat[i] ?? '').toLowerCase())
        scores.push(toNum(flat[i + 1]))
      }

      if (addresses.length === 0) return sendJson(res, 200, [])

      const keys = addresses.map((a) => ENTRY_KEY(a))
      const records = (await redisExec(['MGET', ...keys])) as unknown[] | null
      const list = addresses.map((address, i): LeaderboardEntry => {
        const rec = Array.isArray(records) ? records[i] : null
        if (typeof rec === 'string') {
          try {
            const parsed = JSON.parse(rec) as Partial<LeaderboardEntry>
            return {
              address,
              nickname: parsed.nickname && parsed.nickname.trim() ? parsed.nickname : `${address.slice(0, 6)}...${address.slice(-4)}`,
              score: scores[i],
              avatar: parsed.avatar ?? null,
              updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
            }
          } catch {
            // fall through
          }
        }
        return {
          address,
          nickname: `${address.slice(0, 6)}...${address.slice(-4)}`,
          score: scores[i],
          avatar: null,
          updatedAt: Date.now(),
        }
      })
      return sendJson(res, 200, list)
    }

    if (method === 'POST') {
      const body = (await parseBody(req)) as Record<string, unknown>
      const address = normalizeAddress(body.address)
      const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : ''
      const avatar = typeof body.avatar === 'string' ? body.avatar : null
      const score = toNum(body.score)

      if (!/^0x[a-f0-9]{40}$/i.test(address)) {
        return sendJson(res, 400, { error: 'Invalid address' })
      }
      if (!nickname) {
        return sendJson(res, 400, { error: 'Nickname required' })
      }
      if (!Number.isFinite(score) || score < 0) {
        return sendJson(res, 400, { error: 'Invalid score' })
      }

      const currentBest = toNum(await redisExec(['ZSCORE', LB_ZSET_KEY, address]))
      if (score <= currentBest) {
        return sendJson(res, 200, { success: true, updated: false, best: currentBest })
      }

      const entry: LeaderboardEntry = {
        address,
        nickname,
        score,
        avatar,
        updatedAt: Date.now(),
      }
      await redisPipeline([
        ['ZADD', LB_ZSET_KEY, score, address],
        ['SET', ENTRY_KEY(address), JSON.stringify(entry)],
      ])
      return sendJson(res, 200, { success: true, updated: true, best: score })
    }

    res.setHeader('Allow', 'GET, POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  } catch (err) {
    return sendJson(res, 500, { error: err instanceof Error ? err.message : 'Internal error' })
  }
}
