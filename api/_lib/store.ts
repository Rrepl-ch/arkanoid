// In-memory store for leaderboard (same as crazy-racer).

export type LeaderboardEntry = {
  nickname: string
  score: number
  address: string
  carId: number
  timestamp: number
  avatar?: string
}

const leaderboardByAddress = new Map<string, LeaderboardEntry>()
const MAX_LEADERBOARD = 100

export function getLeaderboard(limit = MAX_LEADERBOARD): LeaderboardEntry[] {
  return [...leaderboardByAddress.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function addLeaderboardEntry(
  entry: Omit<LeaderboardEntry, 'timestamp'> & { avatar?: string }
): void {
  const key = entry.address.toLowerCase()
  const existing = leaderboardByAddress.get(key)
  const newScore = Math.floor(entry.score)
  const avatar = entry.avatar ?? existing?.avatar ?? ''
  if (!existing || newScore > existing.score) {
    leaderboardByAddress.set(key, {
      nickname: entry.nickname,
      score: newScore,
      address: entry.address,
      carId: entry.carId,
      timestamp: Date.now(),
      avatar,
    })
  } else if (existing && (entry as { avatar?: string }).avatar !== undefined) {
    ;(existing as LeaderboardEntry).avatar = (entry as { avatar?: string }).avatar ?? ''
  }
}

export function getBestScoreByAddress(address: string): number {
  const entry = leaderboardByAddress.get(address.toLowerCase())
  return entry ? entry.score : 0
}
