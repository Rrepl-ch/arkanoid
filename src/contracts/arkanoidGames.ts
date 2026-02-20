/**
 * ArkanoidGames contract: mintMinesweeper(), mintSpaceShooter().
 * Contract address: set VITE_ARKANOID_GAMES_ADDRESS in .env
 */

const ARKANOID_GAMES_ADDRESS =
  (typeof import.meta !== 'undefined' && (import.meta as { env?: { VITE_ARKANOID_GAMES_ADDRESS?: string } }).env?.VITE_ARKANOID_GAMES_ADDRESS) ||
  ''

// Selectors: first 4 bytes of keccak256("mintMinesweeper()") and keccak256("mintSpaceShooter()")
// Get exact values: cast sig "mintMinesweeper()" and cast sig "mintSpaceShooter()" (Foundry)
const SELECTORS: Record<'minesweeper' | 'space_shooter', string> = {
  minesweeper: '0x8b8a7f64',
  space_shooter: '0x4f51d0d2',
}

export type EIP1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

export function getArkanoidGamesAddress(): string {
  return ARKANOID_GAMES_ADDRESS
}

/**
 * Send mint tx for a game. Returns true if tx was sent and successful.
 * If no contract address or provider, returns false (caller can still do local mint).
 */
export async function mintGameViaContract(
  provider: EIP1193Provider,
  gameId: 'minesweeper' | 'space_shooter'
): Promise<boolean> {
  const to = getArkanoidGamesAddress()
  if (!to) return false
  const data = SELECTORS[gameId]
  if (!data) return false
  try {
    const txHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          to,
          data,
          from: undefined, // let wallet choose
        },
      ],
    })
    return typeof txHash === 'string' && txHash.length > 0
  } catch {
    return false
  }
}
