import type { ArkanoidStats } from './arkanoidStats'

export type LeaderboardEntry = {
  address: string
  nickname: string
  score: number
  avatar?: string | null
  updatedAt?: number
}

async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function fetchLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(`/api/leaderboard?limit=${Math.max(1, Math.min(100, limit))}`)
    if (!res.ok) return []
    const data = await safeJson<LeaderboardEntry[]>(res)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function fetchBestScore(address: string): Promise<number> {
  try {
    const res = await fetch(`/api/leaderboard?address=${encodeURIComponent(address)}`)
    if (!res.ok) return 0
    const data = await safeJson<{ best?: number }>(res)
    return Number(data?.best ?? 0) || 0
  } catch {
    return 0
  }
}

export async function submitLeaderboardEntry(payload: {
  address: string
  nickname: string
  score: number
  avatar?: string | null
}): Promise<void> {
  try {
    await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // ignore network errors
  }
}

export async function fetchProfileStats(address: string): Promise<ArkanoidStats | null> {
  try {
    const res = await fetch(`/api/profile-stats?address=${encodeURIComponent(address)}`)
    if (!res.ok) return null
    const data = await safeJson<{ stats?: ArkanoidStats | null }>(res)
    return data?.stats ?? null
  } catch {
    return null
  }
}

export async function saveProfileStats(address: string, stats: ArkanoidStats): Promise<void> {
  try {
    await fetch('/api/profile-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, stats }),
    })
  } catch {
    // ignore network errors
  }
}
