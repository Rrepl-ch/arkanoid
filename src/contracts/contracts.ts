/**
 * Contract addresses and ABIs for wagmi (useWriteContract).
 * Same pattern as crazy-racer: env → address, full ABI for each contract.
 */

const empty = '0x0000000000000000000000000000000000000000' as const

function addr(key: string): `0x${string}` {
  const meta = typeof import.meta !== 'undefined' ? (import.meta as { env?: Record<string, string | undefined> }) : null
  if (!meta?.env) return empty as `0x${string}`
  const v = meta.env[key]
  if (typeof v !== 'string' || !v.startsWith('0x') || v.length !== 42) return empty as `0x${string}`
  return v as `0x${string}`
}

export const ARKANOID_BALLS_ADDRESS = addr('VITE_ARKANOID_BALLS_ADDRESS')
export const ARKANOID_GAMES_ADDRESS = addr('VITE_ARKANOID_GAMES_ADDRESS')
export const ARKANOID_CHECKIN_ADDRESS = addr('VITE_ARKANOID_CHECKIN_ADDRESS')

/** Same pattern as crazy-racer CRAZY_RACER_CARS_ABI: mint + ownsBallType. */
export const ARKANOID_BALLS_ABI = [
  {
    inputs: [{ internalType: 'uint8', name: 'ballType', type: 'uint8' }],
    name: 'mint',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'uint8', name: 'ballType', type: 'uint8' },
    ],
    name: 'ownsBallType',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const ARKANOID_GAMES_ABI = [
  { inputs: [], name: 'mintMinesweeper', outputs: [], stateMutability: 'nonpayable', type: 'function' as const },
  { inputs: [], name: 'mintSpaceShooter', outputs: [], stateMutability: 'nonpayable', type: 'function' as const },
] as const

export const ARKANOID_CHECKIN_ABI = [
  { inputs: [], name: 'checkIn', outputs: [], stateMutability: 'nonpayable', type: 'function' as const },
] as const

export const BALL_PRICES_WEI: Record<number, bigint> = {
  0: BigInt(0), 1: BigInt(0), 2: BigInt(0), 3: BigInt(0), 4: BigInt(0),
  5: BigInt(0), 6: BigInt(0), 7: BigInt(0), 8: BigInt(0),
  9: BigInt('250000000000000'),
  10: BigInt('500000000000000'),
  11: BigInt('1000000000000000'),
}
