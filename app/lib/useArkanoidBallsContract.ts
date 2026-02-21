'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import {
  ARKANOID_BALLS_ADDRESS,
  ARKANOID_BALLS_ABI,
  BALL_PRICES_WEI,
} from './contracts'
import { BALLS } from './ballConfig'

const CONTRACT_DEPLOYED = ARKANOID_BALLS_ADDRESS !== '0x0000000000000000000000000000000000000000'
const BALL_COUNT = BALLS.length
const LOCAL_KEY = 'arkanoid_owned_balls'

function loadLocalOwned(): Set<number> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return new Set(Array.isArray(arr) ? arr.filter((n: unknown) => typeof n === 'number') : [])
  } catch {
    return new Set()
  }
}

function saveLocalOwned(ids: Set<number>) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify([...ids]))
  } catch { /* ignore */ }
}

export function addLocalOwned(ballId: number) {
  const s = loadLocalOwned()
  s.add(ballId)
  saveLocalOwned(s)
}

export function useOwnedBalls(): { owned: Set<number>; isLoading: boolean; refetch: () => void } {
  const { address } = useAccount()
  const [localOwned] = useState<Set<number>>(loadLocalOwned)

  const contracts = BALLS.map((_, i) => ({
    address: ARKANOID_BALLS_ADDRESS,
    abi: ARKANOID_BALLS_ABI,
    functionName: 'hasMinted' as const,
    args: [address!, i] as const,
  }))

  const { data, isLoading, refetch } = useReadContracts({
    contracts: CONTRACT_DEPLOYED && address ? contracts : [],
  })

  const owned = useMemo(() => {
    const merged = new Set<number>(localOwned)
    if (CONTRACT_DEPLOYED && address && data) {
      data.forEach((r, i) => {
        if (r.status === 'success' && r.result === true) merged.add(i)
      })
    }
    return merged
  }, [address, data, localOwned])

  return { owned, isLoading, refetch }
}

export function useMintBall(onSuccess?: (ballId: number) => void | Promise<void>) {
  const [lastBallId, setLastBallId] = useState<number>(-1)
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess && lastBallId >= 0) {
      addLocalOwned(lastBallId)
      if (onSuccess) onSuccess(lastBallId)
      reset()
      setLastBallId(-1)
    }
  }, [isSuccess, lastBallId, onSuccess, reset])

  const mint = useCallback((ballId: number) => {
    if (!CONTRACT_DEPLOYED || ballId < 0 || ballId >= BALL_COUNT) return
    setLastBallId(ballId)
    writeContract({
      address: ARKANOID_BALLS_ADDRESS,
      abi: ARKANOID_BALLS_ABI,
      functionName: 'mint',
      args: [ballId],
      value: BALL_PRICES_WEI[ballId] ?? BigInt(0),
    })
  }, [writeContract])

  return {
    mint,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    contractDeployed: CONTRACT_DEPLOYED,
  }
}
