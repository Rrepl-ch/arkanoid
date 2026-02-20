/**
 * ArkanoidBalls contract: mint(ballType) — one function for all balls.
 * Ball types 0–8 free, 9 Emerald (0.00025 ETH), 10 Ruby (0.0005 ETH), 11 Gold (0.001 ETH).
 * Order must match site: classic, cyan, orange, pink, purple, brown, blue, lime, teal, green, red, gold.
 */

import { encodeFunctionData } from 'viem'

const ARKANOID_BALLS_ADDRESS =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_ARKANOID_BALLS_ADDRESS?: string } }).env?.VITE_ARKANOID_BALLS_ADDRESS) ||
  ''

const BALLS_ABI = [
  {
    name: 'mint',
    type: 'function',
    inputs: [{ name: 'ballType', type: 'uint8', internalType: 'uint8' }],
    stateMutability: 'payable' as const,
  },
] as const

/** Ball type order in contract (must match BALLS in ballConfig). */
export const BALL_TYPE_IDS = [
  'classic',
  'cyan',
  'orange',
  'pink',
  'purple',
  'brown',
  'blue',
  'lime',
  'teal',
  'green',
  'red',
  'gold',
] as const

export const MAX_BALL_TYPES = 12

const PRICES_WEI: Record<number, bigint> = {
  0: BigInt(0),
  1: BigInt(0),
  2: BigInt(0),
  3: BigInt(0),
  4: BigInt(0),
  5: BigInt(0),
  6: BigInt(0),
  7: BigInt(0),
  8: BigInt(0),
  9: BigInt('250000000000000'),   // 0.00025 ether
  10: BigInt('500000000000000'),  // 0.0005 ether
  11: BigInt('1000000000000000'), // 0.001 ether
}

export type EIP1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

export function getArkanoidBallsAddress(): string {
  return ARKANOID_BALLS_ADDRESS
}

/** Returns contract ball type index (0–11) for site ball id, or null if unknown. */
export function getBallTypeId(ballId: string): number | null {
  const i = BALL_TYPE_IDS.indexOf(ballId as (typeof BALL_TYPE_IDS)[number])
  return i >= 0 ? i : null
}

export type MintResult = { ok: true; txHash: string } | { ok: false; error: string }

/**
 * Send mint(ballType) tx. Free balls: value 0. Premium: value = price in wei.
 */
export async function mintBallViaContract(
  provider: EIP1193Provider,
  ballTypeId: number
): Promise<MintResult> {
  const to = getArkanoidBallsAddress()
  if (!to || ballTypeId < 0 || ballTypeId >= MAX_BALL_TYPES) {
    return { ok: false, error: 'Invalid contract or ball type' }
  }
  const value = PRICES_WEI[ballTypeId] ?? BigInt(0)
  const data = encodeFunctionData({
    abi: BALLS_ABI,
    functionName: 'mint',
    args: [ballTypeId],
  })
  try {
    const txHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          to,
          data,
          value: '0x' + value.toString(16),
          from: undefined,
        },
      ],
    })
    if (typeof txHash === 'string' && txHash.length > 0) {
      return { ok: true, txHash }
    }
    return { ok: false, error: 'No transaction hash returned' }
  } catch (err: unknown) {
    const msg =
      err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string'
        ? (err as { message: string }).message
        : String(err)
    if (/reject|denied|cancel|4001|ACTION_REJECTED/i.test(msg)) {
      return { ok: false, error: 'Transaction cancelled' }
    }
    if (/insufficient|funds|balance/i.test(msg)) {
      return { ok: false, error: 'Insufficient balance for gas or payment' }
    }
    if (/network|chain|wrong chain/i.test(msg)) {
      return { ok: false, error: 'Wrong network. Switch to Base.' }
    }
    if (msg.length > 80) return { ok: false, error: msg.slice(0, 80) + '…' }
    return { ok: false, error: msg || 'Mint failed' }
  }
}
