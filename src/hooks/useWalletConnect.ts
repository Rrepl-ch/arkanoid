import { useCallback, useEffect, useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { recordCoinbaseConnect } from '../stats/arkanoidStats'
import { getNickname, setNickname as setNicknameStorage } from '../nicknameStorage'

/** Пытается подключить кошелёк через провайдер хоста (Base/Coinbase). При успехе возвращает адрес. */
async function connectWithProvider(): Promise<string | null> {
  try {
    const provider = await sdk.wallet.getEthereumProvider()
    if (!provider) return null
    const accounts = (await provider.request({
      method: 'eth_requestAccounts',
    })) as string[] | undefined
    if (accounts?.length && accounts[0]) return accounts[0]
    return null
  } catch {
    return null
  }
}

/** При подключении через Base берём ник из Farcaster. */
async function trySetNicknameFromFarcaster(address: string): Promise<boolean> {
  try {
    const context = await sdk.context
    const username = context?.user?.username?.trim()
    if (username) {
      setNicknameStorage(address, username)
      return true
    }
  } catch {}
  return false
}

export function useWalletConnect() {
  const [address, setAddress] = useState<string | null>(null)
  const [nickname, setNicknameState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const syncNicknameFromStorage = useCallback((addr: string | null) => {
    setNicknameState(addr ? getNickname(addr) : null)
  }, [])

  const setNickname = useCallback((addr: string, value: string) => {
    setNicknameStorage(addr, value)
    if (addr === address) setNicknameState(value.trim() || null)
  }, [address])

  const connect = useCallback(async () => {
    setError(null)
    setConnecting(true)
    try {
      const addr = await connectWithProvider()
      if (addr) {
        setAddress(addr)
        recordCoinbaseConnect()
        await trySetNicknameFromFarcaster(addr)
        syncNicknameFromStorage(addr)
      } else setError('Could not connect')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed')
    } finally {
      setConnecting(false)
    }
  }, [syncNicknameFromStorage])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    connectWithProvider()
      .then(async (addr) => {
        if (!cancelled && addr) {
          setAddress(addr)
          recordCoinbaseConnect()
          await trySetNicknameFromFarcaster(addr)
          syncNicknameFromStorage(addr)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (address) syncNicknameFromStorage(address)
  }, [address, syncNicknameFromStorage])

  const needsNickname = Boolean(address && !nickname)

  return { address, nickname, setNickname, needsNickname, loading, connecting, error, connect }
}
