import { Redis } from '@upstash/redis'
import { withRedis, isRedisAvailable as isTcpRedisAvailable } from './redis'
import type { LeaderboardEntry } from './store'

const ENTRY_PREFIX = 'arkanoid:entry:'

const REST_URL = process.env.REDIS_REST_URL || process.env.KV_REST_API_URL
const REST_TOKEN = process.env.REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

/** Upstash (HTTP) works on Vercel. Prefer this. */
export function isUpstashAvailable(): boolean {
  return !!(REST_URL && REST_TOKEN)
}

export function getUpstashClient(): Redis {
  if (!REST_URL || !REST_TOKEN) throw new Error('Upstash Redis not configured')
  return new Redis({ url: REST_URL, token: REST_TOKEN })
}

/** True if either Upstash or TCP Redis is configured. */
export function isRedisAvailable(): boolean {
  return isUpstashAvailable() || isTcpRedisAvailable()
}

export async function getLeaderboardRedis(limit: number): Promise<LeaderboardEntry[]> {
  if (isUpstashAvailable()) {
    try {
      const redis = getUpstashClient()
      const keys = await redis.keys(`${ENTRY_PREFIX}*`)
      const entries: LeaderboardEntry[] = []
      for (const key of keys) {
        const raw = await redis.get<string>(key)
        if (!raw) continue
        try {
          const parsed = JSON.parse(raw) as LeaderboardEntry
          if (parsed && typeof parsed.address === 'string' && typeof parsed.score === 'number') {
            entries.push(parsed)
          }
        } catch {
          // skip
        }
      }
      return entries.sort((a, b) => b.score - a.score).slice(0, limit)
    } catch {
      return []
    }
  }
  if (isTcpRedisAvailable()) {
    try {
      return await withRedis(async (client) => {
        const keys = await client.keys(`${ENTRY_PREFIX}*`)
        const entries: LeaderboardEntry[] = []
        for (const key of keys) {
          const raw = await client.get(key)
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as LeaderboardEntry
              if (parsed && typeof parsed.address === 'string' && typeof parsed.score === 'number') {
                entries.push(parsed)
              }
            } catch {
              // skip
            }
          }
        }
        return entries.sort((a, b) => b.score - a.score).slice(0, limit)
      })
    } catch {
      return []
    }
  }
  return []
}

export async function addLeaderboardEntryRedis(
  entry: Omit<LeaderboardEntry, 'timestamp'> & { avatar?: string }
): Promise<void> {
  const key = `${ENTRY_PREFIX}${entry.address.toLowerCase()}`
  const newScore = Math.floor(entry.score)
  const full: LeaderboardEntry = {
    nickname: entry.nickname,
    score: newScore,
    address: entry.address,
    carId: entry.carId,
    timestamp: Date.now(),
    avatar: entry.avatar ?? '',
  }

  if (isUpstashAvailable()) {
    try {
      const redis = getUpstashClient()
      const raw = await redis.get<string>(key)
      let existing: LeaderboardEntry | null = null
      if (raw) {
        try {
          existing = JSON.parse(raw) as LeaderboardEntry
        } catch {
          // ignore
        }
      }
      if (!existing || newScore > existing.score) {
        full.avatar = entry.avatar ?? existing?.avatar ?? ''
        await redis.set(key, JSON.stringify(full))
      }
    } catch {
      // ignore
    }
    return
  }

  if (isTcpRedisAvailable()) {
    try {
      await withRedis(async (client) => {
        const raw = await client.get(key)
        let existing: LeaderboardEntry | null = null
        if (raw) {
          try {
            existing = JSON.parse(raw) as LeaderboardEntry
          } catch {
            // ignore
          }
        }
        if (!existing || newScore > existing.score) {
          full.avatar = entry.avatar ?? existing?.avatar ?? ''
          await client.set(key, JSON.stringify(full))
        }
      })
    } catch {
      // ignore
    }
  }
}

export async function getBestScoreByAddressRedis(address: string): Promise<number> {
  const key = `${ENTRY_PREFIX}${address.toLowerCase()}`

  if (isUpstashAvailable()) {
    try {
      const redis = getUpstashClient()
      const raw = await redis.get<string>(key)
      if (!raw) return 0
      const parsed = JSON.parse(raw) as LeaderboardEntry
      return typeof parsed.score === 'number' ? parsed.score : 0
    } catch {
      return 0
    }
  }

  if (isTcpRedisAvailable()) {
    try {
      return await withRedis(async (client) => {
        const raw = await client.get(key)
        if (!raw) return 0
        try {
          const parsed = JSON.parse(raw) as LeaderboardEntry
          return typeof parsed.score === 'number' ? parsed.score : 0
        } catch {
          return 0
        }
      })
    } catch {
      return 0
    }
  }

  return 0
}
