const STORAGE_KEY = 'arkanoid-minted-games'

export const GAME_IDS = ['minesweeper', 'space_shooter'] as const
export type MintableGameId = (typeof GAME_IDS)[number]

export function getMintedGameIds(): MintableGameId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((x: unknown) => GAME_IDS.includes(x as MintableGameId)) : []
  } catch {
    return []
  }
}

export function mintGame(gameId: MintableGameId): void {
  const ids = getMintedGameIds()
  if (ids.includes(gameId)) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, gameId]))
  } catch {
    // ignore
  }
}

export function hasMintedGame(gameId: MintableGameId): boolean {
  return getMintedGameIds().includes(gameId)
}
