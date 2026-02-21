import { useCallback, useEffect, useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { getNickname, setNickname as setNicknameStorage } from './nicknameStorage'
import { claimNickname, fetchNicknameForAddress } from './nicknameApi'

async function trySetNicknameFromFarcaster(address: string): Promise<string | null> {
  try {
    const context = await sdk.context
    const username = context?.user?.username?.trim()
    if (username) {
      const claimed = await claimNickname(address, username)
      if (claimed.ok) {
        setNicknameStorage(address, claimed.nickname)
        return claimed.nickname
      }
    }
  } catch {
    // ignore
  }
  return null
}

export function useNicknameForAddress(address: string | undefined) {
  const [nickname, setNicknameState] = useState<string | null>(() =>
    address ? getNickname(address) : null
  )

  const setNickname = useCallback(
    async (addr: string, value: string) => {
      const claimed = await claimNickname(addr, value)
      if (!claimed.ok) {
        // Fallback: do not block onboarding if API is temporarily unavailable.
        const local = value.trim()
        setNicknameStorage(addr, local)
        if (address && addr.toLowerCase() === address.toLowerCase()) {
          setNicknameState(local || null)
        }
        return { ok: true as const }
      }
      setNicknameStorage(addr, claimed.nickname)
      if (address && addr.toLowerCase() === address.toLowerCase()) {
        setNicknameState(claimed.nickname.trim() || null)
      }
      return { ok: true as const }
    },
    [address]
  )

  useEffect(() => {
    if (!address) {
      setNicknameState(null)
      return
    }
    setNicknameState(getNickname(address))
    let cancelled = false
    fetchNicknameForAddress(address).then((remote) => {
      if (cancelled) return
      if (remote) {
        setNicknameStorage(address, remote)
        setNicknameState(remote)
      }
    })
    trySetNicknameFromFarcaster(address).then((farcasterNick) => {
      if (!cancelled && farcasterNick) {
        setNicknameState(farcasterNick)
      }
    })
    return () => {
      cancelled = true
    }
  }, [address])

  const needsNickname = Boolean(address && !nickname)

  return { nickname, setNickname, needsNickname }
}
