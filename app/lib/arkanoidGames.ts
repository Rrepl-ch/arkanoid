/**
 * ArkanoidGames contract: mintMinesweeper(), mintSpaceShooter().
 * Set NEXT_PUBLIC_ARKANOID_GAMES_ADDRESS in .env
 */

const ARKANOID_GAMES_ADDRESS = process.env.NEXT_PUBLIC_ARKANOID_GAMES_ADDRESS || ''

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

export type MintGameResult = { ok: true; txHash: string } | { ok: false; error: string }

function parseTxError(err: unknown): string {
  const msg =
    err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string'
      ? (err as { message: string }).message
      : String(err)
  if (/reject|denied|cancel|4001|ACTION_REJECTED/i.test(msg)) return 'Transaction cancelled'
  if (/insufficient|funds|balance/i.test(msg)) return 'Insufficient balance for gas'
  if (/network|chain|wrong chain/i.test(msg)) return 'Wrong network. Switch to Base.'
  if (msg.length > 80) return msg.slice(0, 80) + '…'
  return msg || 'Mint failed'
}

/**
 * Send mint tx for a game. Returns result with txHash or error message.
 */
export async function mintGameViaContract(
  provider: EIP1193Provider,
  gameId: 'minesweeper' | 'space_shooter'
): Promise<MintGameResult> {
  const to = getArkanoidGamesAddress()
  if (!to) return { ok: false, error: 'Games contract not configured' }
  const data = SELECTORS[gameId]
  if (!data) return { ok: false, error: 'Unknown game' }
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
