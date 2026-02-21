import { useEffect, useState } from 'react'
import { hasMintedBall } from '../ball/ballStorage'
import { getMintedGameIds, mintGame, type MintableGameId } from '../games/gameStorage'
import { useMintGameContract } from '../hooks/useMintGameContract'
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
  const [mintingGameId, setMintingGameId] = useState<MintableGameId | null>(null)
  const minesweeperMinted = mintedGameIds.includes('minesweeper')
  const spaceShooterMinted = mintedGameIds.includes('space_shooter')

  const { mint, isSuccess, error, contractDeployed } = useMintGameContract()

  useEffect(() => {
    if (isSuccess && mintingGameId) {
      mintGame(mintingGameId)
      setMintedGameIds((prev) => (prev.includes(mintingGameId) ? prev : [...prev, mintingGameId]))
      setMintingGameId(null)
    }
  }, [isSuccess, mintingGameId])

  const handleMintGame = (gameId: MintableGameId) => {
    if (!contractDeployed) {
      mintGame(gameId)
      setMintedGameIds((prev) => (prev.includes(gameId) ? prev : [...prev, gameId]))
      return
    }
    setMintingGameId(gameId)
    mint(gameId)
  }

  const mintErrorMsg = error?.message ?? null

  return (
    <div className="screen screen--games">
      <button type="button" className="back secondary" onClick={onBack}>
        ← Back
      </button>
      <h2 className="screen-title">Games</h2>
      <p className="screen-subtitle">Mint each game to play. Arkanod requires a minted ball.</p>
      {mintErrorMsg && (
        <p className="game-select-error" role="alert">
          {mintErrorMsg}
        </p>
      )}
      <div className="game-select-list">
        <div className="game-select-card">
          <span className="game-select-icon">🧱</span>
          <span className="game-select-name">Arkanod</span>
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
              disabled={!!mintingGameId}
              onClick={() => handleMintGame('minesweeper')}
            >
              {mintingGameId === 'minesweeper' ? 'Minting…' : 'Mint (free)'}
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
              disabled={!!mintingGameId}
              onClick={() => handleMintGame('space_shooter')}
            >
              {mintingGameId === 'space_shooter' ? 'Minting…' : 'Mint (free)'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
