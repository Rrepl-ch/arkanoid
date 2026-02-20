/**
 * ArkanoidCheckIn contract: checkIn() once per day (UTC), no value.
 * Contract address: set VITE_ARKANOID_CHECKIN_ADDRESS in .env
 */

import { encodeFunctionData } from 'viem'

const ARKANOID_CHECKIN_ADDRESS =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_ARKANOID_CHECKIN_ADDRESS?: string } }).env?.VITE_ARKANOID_CHECKIN_ADDRESS) ||
  ''

const CHECKIN_ABI = [
  { name: 'checkIn', type: 'function', inputs: [], stateMutability: 'nonpayable' as const },
] as const

export type EIP1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

export function getArkanoidCheckInAddress(): string {
  return ARKANOID_CHECKIN_ADDRESS
}

/**
 * Send checkIn() tx. No value — transaction is signed and recorded on-chain, no funds spent.
 * Returns true if tx was sent successfully.
 */
export async function checkInViaContract(provider: EIP1193Provider): Promise<boolean> {
  const to = getArkanoidCheckInAddress()
  if (!to) return false
  const data = encodeFunctionData({
    abi: CHECKIN_ABI,
    functionName: 'checkIn',
  })
  try {
    const txHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          to,
          data,
          value: '0x0',
          from: undefined,
        },
      ],
    })
    return typeof txHash === 'string' && txHash.length > 0
  } catch {
    return false
  }
}
