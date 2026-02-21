// In-memory store (same pattern as crazy-racer).

export type LeaderboardEntry = {
  nickname: string
  score: number
  address: string
  carId: number
  timestamp: number
  avatar?: string
}

const leaderboardByAddress = new Map<string, LeaderboardEntry>()
const nicknameByAddress = new Map<string, string>()
const addressByNickname = new Map<string, string>()
const profileStatsByAddress = new Map<string, string>()
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

// Nickname (in-memory fallback)
export function getNicknameByAddress(address: string): string | null {
  return nicknameByAddress.get(address.toLowerCase()) ?? null
}

export function setNicknameByAddress(address: string, nickname: string): void {
  const addr = address.toLowerCase()
  const nickLower = nickname.trim().toLowerCase()
  const oldNick = nicknameByAddress.get(addr)
  if (oldNick) addressByNickname.delete(oldNick)
  nicknameByAddress.set(addr, nickname.trim())
  addressByNickname.set(nickLower, addr)
}

export function getAddressByNickname(nickname: string): string | null {
  return addressByNickname.get(nickname.trim().toLowerCase()) ?? null
}

// Profile stats (in-memory fallback)
export function getProfileStats(address: string): string | null {
  return profileStatsByAddress.get(address.toLowerCase()) ?? null
}

export function setProfileStats(address: string, json: string): void {
  profileStatsByAddress.set(address.toLowerCase(), json)
}
