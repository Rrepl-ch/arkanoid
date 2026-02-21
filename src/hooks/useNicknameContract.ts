'use client'

import { useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ARKANOID_NICKNAME_ADDRESS, ARKANOID_NICKNAME_ABI } from '../contracts/contracts'

const DEPLOYED = ARKANOID_NICKNAME_ADDRESS !== '0x0000000000000000000000000000000000000000'

export function useNicknameStatus() {
  const { address } = useAccount()
  const { data: hasNick, isLoading, refetch } = useReadContract({
    address: DEPLOYED && address ? ARKANOID_NICKNAME_ADDRESS : undefined,
    abi: ARKANOID_NICKNAME_ABI,
    functionName: 'hasNickname',
    args: address ? [address] : undefined,
  })

  const { data: nickname } = useReadContract({
    address: DEPLOYED && address && hasNick ? ARKANOID_NICKNAME_ADDRESS : undefined,
    abi: ARKANOID_NICKNAME_ABI,
    functionName: 'getNickname',
    args: address ? [address] : undefined,
  })

  return {
    hasNickname: !!hasNick,
    nickname: typeof nickname === 'string' ? nickname : null,
    isLoading,
    refetch,
    contractDeployed: DEPLOYED,
  }
}

export function useMintNickname(onSuccess?: () => void) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess && onSuccess) {
      onSuccess()
      reset()
    }
  }, [isSuccess, onSuccess, reset])

  const mint = (nickname: string) => {
    if (!DEPLOYED) return
    const trimmed = nickname.trim()
    if (!trimmed || trimmed.length < 2 || trimmed.length > 24) return
    writeContract({
      address: ARKANOID_NICKNAME_ADDRESS,
      abi: ARKANOID_NICKNAME_ABI,
      functionName: 'mint',
      args: [trimmed],
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
