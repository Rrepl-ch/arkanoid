import { useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { hasMintedBall } from '../ball/ballStorage'
import { getMintedGameIds, mintGame, type MintableGameId } from '../games/gameStorage'
import { getArkanoidGamesAddress, mintGameViaContract, type EIP1193Provider } from '../contracts/arkanoidGames'
import './Screen.css'
import './GameSelect.css'

export type GameSelectAction = 'arkanoid-levels' | 'minesweeper' | 'space-shooter'

export default function GameSelect({
  onBack,
  onSelect,
}: {
  onBack: () => void
  onSelect: (action: GameSelectAction) => void
}) {
  const canPlayArkanoid = hasMintedBall()
  const [mintedGameIds, setMintedGameIds] = useState<MintableGameId[]>(() => getMintedGameIds())
  const minesweeperMinted = mintedGameIds.includes('minesweeper')
  const spaceShooterMinted = mintedGameIds.includes('space_shooter')

  const [mintLoading, setMintLoading] = useState<MintableGameId | null>(null)
  const [mintError, setMintError] = useState<string | null>(null)

  const handleMintGame = async (gameId: MintableGameId) => {
    setMintError(null)
    const hasContract = !!getArkanoidGamesAddress()
    if (!hasContract) {
      mintGame(gameId)
      setMintedGameIds((prev) => (prev.includes(gameId) ? prev : [...prev, gameId]))
      return
    }
    setMintLoading(gameId)
    try {
      const provider = await sdk.wallet.getEthereumProvider()
      if (!provider) {
        setMintError('Connect wallet first (open app in Base/Farcaster)')
        return
      }
      const result = await mintGameViaContract(provider as EIP1193Provider, gameId)
      if (!result.ok) {
        setMintError(result.error)
        return
      }
      mintGame(gameId)
      setMintedGameIds((prev) => (prev.includes(gameId) ? prev : [...prev, gameId]))
    } catch (e) {
      setMintError(e instanceof Error ? e.message : 'Mint failed')
    } finally {
      setMintLoading(null)
    }
  }

  return (
    <div className="screen screen--games">
      <button type="button" className="back secondary" onClick={onBack}>
        ← Back
      </button>
      <h2 className="screen-title">Games</h2>
      <p className="screen-subtitle">Mint each game to play. Arkanoid requires a minted ball.</p>
      {mintError && (
        <p className="game-select-error" role="alert">
          {mintError}
        </p>
      )}
      <div className="game-select-list">
        <div className="game-select-card">
          <span className="game-select-icon">🧱</span>
          <span className="game-select-name">Arkanoid</span>
          {canPlayArkanoid ? (
            <button type="button" className="game-select-play" onClick={() => onSelect('arkanoid-levels')}>
              Play
            </button>
          ) : (
            <p className="game-select-hint">Mint a ball first (Ball tab)</p>
          )}
        </div>
        <div className="game-select-card">
          <span className="game-select-icon">💣</span>
          <span className="game-select-name">Minesweeper</span>
          {minesweeperMinted ? (
            <button type="button" className="game-select-play" onClick={() => onSelect('minesweeper')}>
              Play
            </button>
          ) : (
            <button
              type="button"
              className="game-select-mint"
              disabled={mintLoading === 'minesweeper'}
              onClick={() => handleMintGame('minesweeper')}
            >
              {mintLoading === 'minesweeper' ? 'Minting…' : 'Mint (free)'}
            </button>
          )}
        </div>
        <div className="game-select-card">
          <span className="game-select-icon">🚀</span>
          <span className="game-select-name">Space Shooter</span>
          {spaceShooterMinted ? (
            <button type="button" className="game-select-play" onClick={() => onSelect('space-shooter')}>
              Play
            </button>
          ) : (
            <button
              type="button"
              className="game-select-mint"
              disabled={mintLoading === 'space_shooter'}
              onClick={() => handleMintGame('space_shooter')}
            >
              {mintLoading === 'space_shooter' ? 'Minting…' : 'Mint (free)'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
