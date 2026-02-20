import type { IncomingMessage, ServerResponse } from 'http'
import { redisExec } from './_lib/redis'

type ArkanoidStats = {
  gamesPlayed: number
  bestScore: number
  totalScore: number
  maxLevelReached: number
  checkInCount: number
  connectedWithCoinbaseAt?: number
}

const PROFILE_KEY = (address: string) => `retro:profile:${address.toLowerCase()}`

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

function normalizeAddress(v: unknown): string {
  return typeof v === 'string' ? v.trim().toLowerCase() : ''
}

function sanitizeStats(raw: Partial<ArkanoidStats> | null | undefined): ArkanoidStats {
  return {
    gamesPlayed: Number(raw?.gamesPlayed ?? 0) || 0,
    bestScore: Number(raw?.bestScore ?? 0) || 0,
    totalScore: Number(raw?.totalScore ?? 0) || 0,
    maxLevelReached: Number(raw?.maxLevelReached ?? 0) || 0,
    checkInCount: Number(raw?.checkInCount ?? 0) || 0,
    connectedWithCoinbaseAt:
      raw?.connectedWithCoinbaseAt != null && Number.isFinite(Number(raw.connectedWithCoinbaseAt))
        ? Number(raw.connectedWithCoinbaseAt)
        : undefined,
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const method = req.method ?? 'GET'
    const url = new URL(req.url ?? '/', 'http://localhost')

    if (method === 'GET') {
      const address = normalizeAddress(url.searchParams.get('address'))
      if (!/^0x[a-f0-9]{40}$/i.test(address)) {
        return sendJson(res, 400, { error: 'Invalid address' })
      }
      const raw = await redisExec(['GET', PROFILE_KEY(address)])
      if (typeof raw !== 'string') return sendJson(res, 200, { stats: null })
      try {
        return sendJson(res, 200, { stats: sanitizeStats(JSON.parse(raw) as Partial<ArkanoidStats>) })
      } catch {
        return sendJson(res, 200, { stats: null })
      }
    }

    if (method === 'POST') {
      const body = (await parseBody(req)) as Record<string, unknown>
      const address = normalizeAddress(body.address)
      const stats = sanitizeStats((body.stats ?? null) as Partial<ArkanoidStats> | null)
      if (!/^0x[a-f0-9]{40}$/i.test(address)) {
        return sendJson(res, 400, { error: 'Invalid address' })
      }
      await redisExec(['SET', PROFILE_KEY(address), JSON.stringify(stats)])
      return sendJson(res, 200, { success: true })
    }

    res.setHeader('Allow', 'GET, POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  } catch (err) {
    return sendJson(res, 500, { error: err instanceof Error ? err.message : 'Internal error' })
  }
}
