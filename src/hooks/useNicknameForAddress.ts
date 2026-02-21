import { useCallback, useEffect, useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { getNickname, setNickname as setNicknameStorage } from '../nicknameStorage'
async function trySetNicknameFromFarcaster(address: string): Promise<boolean> {
  try {
    const context = await sdk.context
    const username = context?.user?.username?.trim()
    if (username) {
      setNicknameStorage(address, username)
      return true
    }
  } catch {
    // ignore
  }
  return false
}

export function useNicknameForAddress(address: string | undefined) {
  const [nickname, setNicknameState] = useState<string | null>(() =>
    address ? getNickname(address) : null
  )

  const setNickname = useCallback(
    (addr: string, value: string) => {
      setNicknameStorage(addr, value)
      if (address && addr.toLowerCase() === address.toLowerCase()) {
        setNicknameState(value.trim() || null)
      }
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
    trySetNicknameFromFarcaster(address).then(() => {
      if (!cancelled) setNicknameState(getNickname(address))
    })
    return () => {
      cancelled = true
    }
  }, [address])

  const needsNickname = Boolean(address && !nickname)

  return { nickname, setNickname, needsNickname }
}
