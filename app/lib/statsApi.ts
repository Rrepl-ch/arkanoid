import type { ArkanoidStats } from './arkanoidStats'

async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T
  } catch {
    return null
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
