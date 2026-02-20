import { useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { BALLS, getBallPriceEth } from '../ball/ballConfig'
import {
  getMintedBallIds,
  mintBall,
  getSelectedBallId,
  setSelectedBallId,
  setGoldenBallOwner,
} from '../ball/ballStorage'
import {
  getArkanoidBallsAddress,
  getBallTypeId,
  mintBallViaContract,
  type EIP1193Provider,
} from '../contracts/arkanoidBalls'
import './Screen.css'
import './BallSelect.css'

export default function BallSelect() {
  const [mintedIds, setMintedIds] = useState<string[]>(() => getMintedBallIds())
  const [selected, setSelected] = useState(() => getSelectedBallId())
  const [mintLoading, setMintLoading] = useState<string | null>(null)
  const [mintError, setMintError] = useState<string | null>(null)

  const refresh = () => {
    setMintedIds(getMintedBallIds())
    setSelected(getSelectedBallId())
  }

  const handleMint = async (ballId: string) => {
    const ball = BALLS.find((b) => b.id === ballId)
    if (!ball) return
    setMintError(null)
    const ballTypeId = getBallTypeId(ballId)
    const hasBallsContract = !!getArkanoidBallsAddress()

    if (!hasBallsContract) {
      setMintError('Ball contract not configured. Set VITE_ARKANOID_BALLS_ADDRESS in .env and rebuild.')
      return
    }
    if (ballTypeId === null) {
      setMintError('Unknown ball type')
      return
    }

    setMintLoading(ballId)
    try {
      const provider = await sdk.wallet.getEthereumProvider()
      if (!provider) {
        setMintError('Connect wallet first (open app in Base/Farcaster)')
        return
      }
      const result = await mintBallViaContract(provider as EIP1193Provider, ballTypeId)
      if (!result.ok) {
        setMintError(result.error)
        return
      }
      mintBall(ballId)
      if (ball.isGolden) setGoldenBallOwner('current-user')
      refresh()
      setSelected(ballId)
      setSelectedBallId(ballId)
    } catch (e) {
      setMintError(e instanceof Error ? e.message : 'Mint failed')
    } finally {
      setMintLoading(null)
    }
  }

  const handleSelect = (ballId: string) => {
    if (!mintedIds.includes(ballId)) return
    setSelected(ballId)
    setSelectedBallId(ballId)
  }

  return (
    <div className="screen screen--ball">
      <h2 className="screen-title">Ball</h2>
      <p className="screen-subtitle">Mint a ball to play. Choose your minted ball.</p>
      {mintError && (
        <p className="ball-select-error" role="alert">
          {mintError}
        </p>
      )}
      <div className="screen-content ball-grid">
        {BALLS.map((b) => {
          const isMinted = mintedIds.includes(b.id)
          const isSelected = selected === b.id
          const isLoading = mintLoading === b.id
          return (
            <div
              key={b.id}
              className={`ball-option ${!isMinted ? 'ball-option--locked' : ''} ${isSelected ? 'ball-option--active' : ''} ${b.id === 'gold' ? 'ball-option--golden' : ''} ${b.id === 'green' ? 'ball-option--emerald' : ''} ${b.id === 'red' ? 'ball-option--ruby' : ''} ${getBallPriceEth(b.id) ? 'ball-option--premium' : ''}`}
            >
              <span className="ball-preview" style={{ background: b.color }} />
              <span className="ball-name">{b.name}</span>
              {!isMinted ? (
                <button
                  type="button"
                  className="ball-mint-btn"
                  disabled={isLoading}
                  onClick={() => handleMint(b.id)}
                >
                  {isLoading ? 'Minting…' : getBallPriceEth(b.id) ? `Mint ${getBallPriceEth(b.id)} ETH` : 'Mint (free)'}
                </button>
              ) : (
                <button
                  type="button"
                  className="ball-select-btn"
                  onClick={() => handleSelect(b.id)}
                  disabled={isSelected}
                >
                  {isSelected ? 'Selected' : 'Select'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
