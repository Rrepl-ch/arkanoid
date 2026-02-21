'use client'

import { useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ARKANOID_GAMES_ADDRESS, ARKANOID_GAMES_ABI } from './contracts'

const DEPLOYED = ARKANOID_GAMES_ADDRESS !== '0x0000000000000000000000000000000000000000'

export type MintableGameId = 'minesweeper' | 'space_shooter'

export function useMintGameContract(onSuccess?: () => void) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess && onSuccess) {
      onSuccess()
      reset()
    }
  }, [isSuccess, onSuccess, reset])

  const mint = (gameId: MintableGameId) => {
    if (!DEPLOYED) return
    const functionName = gameId === 'minesweeper' ? 'mintMinesweeper' : 'mintSpaceShooter'
    writeContract({
      address: ARKANOID_GAMES_ADDRESS,
      abi: ARKANOID_GAMES_ABI,
      functionName,
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
