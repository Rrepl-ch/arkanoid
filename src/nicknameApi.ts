type ClaimResult =
  | { ok: true; nickname: string }
  | { ok: false; error: string; status?: number }

export async function fetchNicknameForAddress(address: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/nickname?address=${encodeURIComponent(address)}`)
    if (!res.ok) return null
    const data = (await res.json()) as { nickname?: string | null }
    return typeof data.nickname === 'string' && data.nickname.trim() ? data.nickname.trim() : null
  } catch {
    return null
  }
}

export async function claimNickname(address: string, nickname: string): Promise<ClaimResult> {
  try {
    const res = await fetch('/api/nickname', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, nickname }),
    })
    const data = (await res.json().catch(() => ({}))) as { error?: string; nickname?: string }
    if (!res.ok) {
      return { ok: false, error: data.error ?? 'Failed to save nickname', status: res.status }
    }
    return { ok: true, nickname: data.nickname ?? nickname }
  } catch {
    return { ok: false, error: 'Network error' }
  }
}
