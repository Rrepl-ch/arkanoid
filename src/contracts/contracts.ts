/**
 * Contract addresses and ABIs for wagmi.
 * Vite requires STATIC access to import.meta.env.VITE_* — dynamic keys are NOT replaced at build time.
 * Same pattern as crazy-racer contract.ts but with import.meta.env instead of process.env.
 */

export const ARKANOID_BALLS_ADDRESS =
  (import.meta.env.VITE_ARKANOID_BALLS_ADDRESS as `0x${string}`) || '0x0000000000000000000000000000000000000000'

export const ARKANOID_GAMES_ADDRESS =
  (import.meta.env.VITE_ARKANOID_GAMES_ADDRESS as `0x${string}`) || '0x0000000000000000000000000000000000000000'

export const ARKANOID_CHECKIN_ADDRESS =
  (import.meta.env.VITE_ARKANOID_CHECKIN_ADDRESS as `0x${string}`) || '0x0000000000000000000000000000000000000000'

/** ArkanoidBalls.sol exposes mint() + hasBall(address,uint8). */
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
    name: 'hasBall',
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
