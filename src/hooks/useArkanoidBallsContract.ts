'use client'

import { useEffect } from 'react'
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import {
  ARKANOID_BALLS_ADDRESS,
  ARKANOID_BALLS_ABI,
  BALL_PRICES_WEI,
} from '../contracts/contracts'
import { BALLS } from '../ball/ballConfig'
import { getMintedBallIds } from '../ball/ballStorage'
import { BALL_TYPE_IDS } from '../contracts/arkanoidBalls'

const CONTRACT_DEPLOYED = ARKANOID_BALLS_ADDRESS !== '0x0000000000000000000000000000000000000000'
const BALL_COUNT = BALLS.length

function localOwned(): Set<number> {
  const ids = getMintedBallIds()
  const set = new Set<number>()
  for (const id of ids) {
    const idx = BALL_TYPE_IDS.indexOf(id as (typeof BALL_TYPE_IDS)[number])
    if (idx >= 0) set.add(idx)
  }
  return set
}

export function useOwnedBalls(): { owned: Set<number>; isLoading: boolean; refetch: () => void } {
  const { address } = useAccount()
  const contracts = Array.from({ length: BALL_COUNT }, (_, i) => ({
    address: ARKANOID_BALLS_ADDRESS,
    abi: ARKANOID_BALLS_ABI,
    functionName: 'ownsBallType' as const,
    args: [address!, i] as const,
  }))

  const { data, isLoading, refetch } = useReadContracts({
    contracts: CONTRACT_DEPLOYED && address ? contracts : [],
  })

  const owned = new Set(localOwned())

  if (CONTRACT_DEPLOYED && address && data) {
    const anySuccess = data.some((r) => r.status === 'success')
    if (anySuccess) {
      data.forEach((r, i) => {
        if (r.status === 'success' && r.result === true) owned.add(i)
      })
    }
  }

  return { owned, isLoading, refetch }
}

export function useMintBall(onSuccess?: () => void | Promise<void>) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess && onSuccess) {
      onSuccess()
      reset()
    }
  }, [isSuccess, onSuccess, reset])

  const mint = (ballId: number) => {
    if (!CONTRACT_DEPLOYED || ballId < 0 || ballId >= BALL_COUNT) return
    writeContract({
      address: ARKANOID_BALLS_ADDRESS,
      abi: ARKANOID_BALLS_ABI,
      functionName: 'mint',
      args: [ballId],
      value: BALL_PRICES_WEI[ballId] ?? BigInt(0),
    })
  }

  return {
    mint,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    contractDeployed: CONTRACT_DEPLOYED,
  }
}
