'use client'

import { useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ARKANOID_CHECKIN_ADDRESS, ARKANOID_CHECKIN_ABI } from './contracts'

const DEPLOYED = ARKANOID_CHECKIN_ADDRESS !== '0x0000000000000000000000000000000000000000'

export function useCheckInContract(onSuccess?: () => void) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess && onSuccess) {
      onSuccess()
      reset()
    }
  }, [isSuccess, onSuccess, reset])

  const checkIn = () => {
    if (!DEPLOYED) return
    writeContract({
      address: ARKANOID_CHECKIN_ADDRESS,
      abi: ARKANOID_CHECKIN_ABI,
      functionName: 'checkIn',
    })
  }

  return {
    checkIn,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    contractDeployed: DEPLOYED,
  }
}
