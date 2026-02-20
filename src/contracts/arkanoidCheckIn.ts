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

export type CheckInResult = { ok: true; txHash: string } | { ok: false; error: string }

function parseTxError(err: unknown): string {
  const msg =
    err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string'
      ? (err as { message: string }).message
      : String(err)
  if (/reject|denied|cancel|4001|ACTION_REJECTED/i.test(msg)) return 'Transaction cancelled'
  if (/insufficient|funds|balance/i.test(msg)) return 'Insufficient balance for gas'
  if (/network|chain|wrong chain/i.test(msg)) return 'Wrong network. Switch to Base.'
  if (msg.length > 80) return msg.slice(0, 80) + '…'
  return msg || 'Check-in failed'
}

/**
 * Send checkIn() tx. No value — transaction is signed and recorded on-chain, no funds spent.
 */
export async function checkInViaContract(provider: EIP1193Provider): Promise<CheckInResult> {
  const to = getArkanoidCheckInAddress()
  if (!to) return { ok: false, error: 'Check-in contract not configured' }
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
    if (typeof txHash === 'string' && txHash.length > 0) {
      return { ok: true, txHash }
    }
    return { ok: false, error: 'No transaction hash returned' }
  } catch (err) {
    return { ok: false, error: parseTxError(err) }
  }
}
