const STORAGE_KEY = 'arkanoid-stats'

export type ArkanoidStats = {
  gamesPlayed: number
  bestScore: number
  totalScore: number
  maxLevelReached: number
  checkInCount: number
  /** Set when user connects via Coinbase Wallet (for achievement). */
  connectedWithCoinbaseAt?: number
}

const defaultStats: ArkanoidStats = {
  gamesPlayed: 0,
  bestScore: 0,
  totalScore: 0,
  maxLevelReached: 0,
  checkInCount: 0,
}

export function getArkanoidStats(): ArkanoidStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultStats }
    const data = JSON.parse(raw) as Partial<ArkanoidStats>
    return {
      gamesPlayed: typeof data.gamesPlayed === 'number' ? data.gamesPlayed : 0,
      bestScore: typeof data.bestScore === 'number' ? data.bestScore : 0,
      totalScore: typeof data.totalScore === 'number' ? data.totalScore : 0,
      maxLevelReached: typeof data.maxLevelReached === 'number' ? data.maxLevelReached : 0,
      checkInCount: typeof data.checkInCount === 'number' ? data.checkInCount : 0,
      connectedWithCoinbaseAt: typeof data.connectedWithCoinbaseAt === 'number' ? data.connectedWithCoinbaseAt : undefined,
    }
  } catch {
    return { ...defaultStats }
  }
}

/** Call when a run ends (game over or exit to menu). */
export function recordArkanoidGameEnd(score: number, levelReached: number): void {
  const prev = getArkanoidStats()
  const next: ArkanoidStats = {
    ...prev,
    gamesPlayed: prev.gamesPlayed + 1,
    bestScore: Math.max(prev.bestScore, score),
    totalScore: prev.totalScore + score,
    maxLevelReached: Math.max(prev.maxLevelReached, levelReached),
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

/** Call when user successfully connects via Coinbase Wallet (for achievement). */
export function recordCoinbaseConnect(): void {
  const prev = getArkanoidStats()
  if (prev.connectedWithCoinbaseAt != null) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...prev,
      connectedWithCoinbaseAt: Date.now(),
    }))
  } catch {
    // ignore
  }
}

/** Call when completing a level but continuing (Next level). Only updates best score and max level. */
export function recordArkanoidProgress(score: number, levelReached: number): void {
  const prev = getArkanoidStats()
  const next: ArkanoidStats = {
    ...prev,
    bestScore: Math.max(prev.bestScore, score),
    maxLevelReached: Math.max(prev.maxLevelReached, levelReached),
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

/** Call when user checks in (e.g. via contract). */
export function recordCheckIn(): void {
  const prev = getArkanoidStats()
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, checkInCount: prev.checkInCount + 1 }))
  } catch {
    // ignore
  }
}
