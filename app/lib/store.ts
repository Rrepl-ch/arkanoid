// In-memory store for nickname and profile stats.

const nicknameByAddress = new Map<string, string>()
const addressByNickname = new Map<string, string>()
const profileStatsByAddress = new Map<string, string>()

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
