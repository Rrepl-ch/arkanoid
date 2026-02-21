// Redis leaderboard via Upstash REST (same logic as crazy-racer, no TCP).

import type { LeaderboardEntry } from './store'

const REST_URL = process.env.REDIS_REST_URL || process.env.KV_REST_API_URL
const REST_TOKEN = process.env.REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
const ENTRY_PREFIX = 'arkanoid:entry:'

export function isRedisAvailable(): boolean {
  return !!(REST_URL && REST_TOKEN)
}

async function restPipeline(commands: string[][]): Promise<unknown[]> {
  const url = `${String(REST_URL).replace(/\/$/, '')}/pipeline`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  })
  if (!res.ok) throw new Error(`Redis REST ${res.status}`)
  const json = (await res.json()) as unknown
  if (!Array.isArray(json)) return []
  return json.map((item: { result?: unknown; error?: string }) => {
    if (item?.error) throw new Error(String(item.error))
    return (item as { result?: unknown }).result
  })
}

export async function getLeaderboardRedis(limit: number): Promise<LeaderboardEntry[]> {
  if (!isRedisAvailable()) return []
  try {
    const [keysResult] = await restPipeline([['KEYS', `${ENTRY_PREFIX}*`]])
    const keys = Array.isArray(keysResult) ? (keysResult as string[]) : []
    if (keys.length === 0) return []
    const commands = keys.map((k) => ['GET', k] as string[])
    const results = await restPipeline(commands)
    const entries: LeaderboardEntry[] = []
    for (const raw of results) {
      if (typeof raw !== 'string') continue
      try {
        const parsed = JSON.parse(raw) as LeaderboardEntry
        if (parsed && typeof parsed.address === 'string' && typeof parsed.score === 'number') {
          entries.push(parsed)
        }
      } catch {
        // skip invalid
      }
    }
    return entries.sort((a, b) => b.score - a.score).slice(0, limit)
  } catch {
    return []
  }
}

export async function addLeaderboardEntryRedis(
  entry: Omit<LeaderboardEntry, 'timestamp'> & { avatar?: string }
): Promise<void> {
  if (!isRedisAvailable()) return
  const key = `${ENTRY_PREFIX}${entry.address.toLowerCase()}`
  try {
    const [raw] = await restPipeline([['GET', key]])
    let existing: LeaderboardEntry | null = null
    if (typeof raw === 'string') {
      try {
        existing = JSON.parse(raw) as LeaderboardEntry
      } catch {
        // ignore
      }
    }
    const newScore = Math.floor(entry.score)
    if (!existing || newScore > existing.score) {
      const full: LeaderboardEntry = {
        nickname: entry.nickname,
        score: newScore,
        address: entry.address,
        carId: entry.carId,
        timestamp: Date.now(),
        avatar: entry.avatar ?? existing?.avatar ?? '',
      }
      await restPipeline([['SET', key, JSON.stringify(full)]])
    }
  } catch {
    // ignore
  }
}

export async function getBestScoreByAddressRedis(address: string): Promise<number> {
  if (!isRedisAvailable()) return 0
  try {
    const [raw] = await restPipeline([['GET', `${ENTRY_PREFIX}${address.toLowerCase()}`]])
    if (typeof raw !== 'string') return 0
    const parsed = JSON.parse(raw) as LeaderboardEntry
    return typeof parsed?.score === 'number' ? parsed.score : 0
  } catch {
    return 0
  }
}
