import type { IncomingMessage, ServerResponse } from 'http'
import { getLeaderboard, addLeaderboardEntry, getBestScoreByAddress } from './_lib/store'
import {
  isRedisAvailable,
  getLeaderboardRedis,
  addLeaderboardEntryRedis,
  getBestScoreByAddressRedis,
} from './_lib/leaderboard'

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(String(addr).trim())
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
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

function getRequestUrl(req: IncomingMessage): URL | null {
  try {
    const path = req.url ?? '/'
    return new URL(path, 'https://localhost')
  } catch {
    return null
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const method = req.method ?? 'GET'
    const url = getRequestUrl(req)
    if (!url) {
      return sendJson(res, 400, { error: 'Invalid request url' })
    }

    if (method === 'GET') {
      const address = url.searchParams.get('address')?.trim() ?? ''
      if (address) {
        const best = isRedisAvailable()
          ? await getBestScoreByAddressRedis(address)
          : getBestScoreByAddress(address)
        return sendJson(res, 200, { best })
      }
      const limit = Math.min(Number(url.searchParams.get('limit')) || 20, 100)
      const entries = isRedisAvailable()
        ? await getLeaderboardRedis(limit)
        : getLeaderboard(limit)
      // Frontend expects { address, nickname, score, avatar?, updatedAt? }
      const list = entries.map((e) => ({
        address: e.address,
        nickname: e.nickname,
        score: e.score,
        avatar: e.avatar ?? null,
        updatedAt: e.timestamp,
      }))
      return sendJson(res, 200, list)
    }

    if (method === 'POST') {
      const body = (await parseBody(req)) as Record<string, unknown>
      const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : ''
      const score = typeof body.score === 'number' ? Math.floor(body.score) : 0
      const address = typeof body.address === 'string' ? body.address.trim() : ''
      const avatar = typeof body.avatar === 'string' ? body.avatar : ''

      if (!address || !isValidAddress(address)) {
        return sendJson(res, 400, { error: 'Invalid wallet address' })
      }
      if (!nickname) {
        return sendJson(res, 400, { error: 'Nickname required' })
      }
      if (!Number.isFinite(score) || score < 0) {
        return sendJson(res, 400, { error: 'Invalid score' })
      }

      const entry = {
        nickname,
        score,
        address,
        carId: 0,
        avatar,
      }
      if (isRedisAvailable()) {
        await addLeaderboardEntryRedis(entry)
      } else {
        addLeaderboardEntry({ ...entry, address: address.toLowerCase() })
      }
      return sendJson(res, 200, { success: true })
    }

    res.setHeader('Allow', 'GET, POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : 'Internal error',
    })
  }
}
