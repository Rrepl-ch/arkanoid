const STORAGE_KEY_MINTED = 'arkanoid-minted-balls'
const STORAGE_KEY_SELECTED = 'arkanoid-selected-ball'
const STORAGE_KEY_GOLDEN_OWNER = 'arkanoid-golden-ball-owner'

export function getMintedBallIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MINTED)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((x: unknown) => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function mintBall(ballId: string): void {
  const ids = getMintedBallIds()
  if (ids.includes(ballId)) return
  try {
    localStorage.setItem(STORAGE_KEY_MINTED, JSON.stringify([...ids, ballId]))
  } catch {
    // ignore
  }
}

export function getSelectedBallId(): string {
  try {
    const id = localStorage.getItem(STORAGE_KEY_SELECTED)
    return id || 'classic'
  } catch {
    return 'classic'
  }
}

export function setSelectedBallId(ballId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_SELECTED, ballId)
  } catch {
    // ignore
  }
}

export function hasMintedBall(): boolean {
  return getMintedBallIds().length > 0
}

/** Адрес владельца золотого шара (для лидерборда). Пока localStorage, позже — контракт. */
export function getGoldenBallOwner(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_GOLDEN_OWNER)
  } catch {
    return null
  }
}

export function setGoldenBallOwner(address: string | null): void {
  try {
    if (address) localStorage.setItem(STORAGE_KEY_GOLDEN_OWNER, address)
    else localStorage.removeItem(STORAGE_KEY_GOLDEN_OWNER)
  } catch {
    // ignore
  }
}
