/** Хранилище никнеймов по адресу кошелька. Ники уникальны (без учёта регистра). */

const STORAGE_KEY = 'retro_miniapp_nicknames'

type MapRecord = Record<string, string>

function load(): MapRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as MapRecord
  } catch {}
  return {}
}

function save(data: MapRecord): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getNickname(address: string): string | null {
  if (!address) return null
  const n = load()[address.toLowerCase()]
  return n && typeof n === 'string' ? n.trim() || null : null
}

/** Проверяет, занят ли ник другим адресом. excludeAddress — свой адрес (игнорируем). */
export function isNicknameTaken(nickname: string, excludeAddress?: string): boolean {
  const normalized = nickname.trim().toLowerCase()
  if (!normalized) return false
  const data = load()
  const exclude = excludeAddress?.toLowerCase()
  for (const [addr, n] of Object.entries(data)) {
    if (addr === exclude) continue
    if (n && String(n).trim().toLowerCase() === normalized) return true
  }
  return false
}

export function setNickname(address: string, nickname: string): void {
  const key = address.toLowerCase()
  const value = nickname.trim()
  const data = load()
  if (!value) {
    delete data[key]
  } else {
    data[key] = value
  }
  save(data)
}
