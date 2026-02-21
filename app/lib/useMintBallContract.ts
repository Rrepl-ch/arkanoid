'use client'

import { useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import {
  ARKANOID_BALLS_ADDRESS,
  ARKANOID_BALLS_ABI,
  BALL_PRICES_WEI,
} from './contracts'

const DEPLOYED = ARKANOID_BALLS_ADDRESS !== '0x0000000000000000000000000000000000000000'

export function useMintBallContract() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) reset()
  }, [isSuccess, reset])

  const mint = (ballTypeId: number) => {
    if (!DEPLOYED || ballTypeId < 0 || ballTypeId > 11) return
    const value = BALL_PRICES_WEI[ballTypeId] ?? BigInt(0)
    writeContract({
      address: ARKANOID_BALLS_ADDRESS,
      abi: ARKANOID_BALLS_ABI,
      functionName: 'mint',
      args: [ballTypeId],
      value,
    })
  }

  return {
    mint,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    contractDeployed: DEPLOYED,
  }
}
