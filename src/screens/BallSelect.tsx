import { useEffect, useState } from 'react'
import { BALLS, getBallPriceEth } from '../ball/ballConfig'
import {
  getMintedBallIds,
  mintBall,
  getSelectedBallId,
  setSelectedBallId,
  setGoldenBallOwner,
} from '../ball/ballStorage'
import { getBallTypeId } from '../contracts/arkanoidBalls'
import { useMintBallContract } from '../hooks/useMintBallContract'
import './Screen.css'
import './BallSelect.css'

export default function BallSelect() {
  const [mintedIds, setMintedIds] = useState<string[]>(() => getMintedBallIds())
  const [selected, setSelected] = useState(() => getSelectedBallId())
  const [pendingBallId, setPendingBallId] = useState<string | null>(null)
  const { mint, isPending, isSuccess, error, contractDeployed } = useMintBallContract()

  const refresh = () => {
    setMintedIds(getMintedBallIds())
    setSelected(getSelectedBallId())
  }

  useEffect(() => {
    if (isSuccess && pendingBallId) {
      const ball = BALLS.find((b) => b.id === pendingBallId)
      mintBall(pendingBallId)
      if (ball?.isGolden) setGoldenBallOwner('current-user')
      refresh()
      setSelected(pendingBallId)
      setSelectedBallId(pendingBallId)
      setPendingBallId(null)
    }
  }, [isSuccess, pendingBallId])

  const handleMint = (ballId: string) => {
    const ball = BALLS.find((b) => b.id === ballId)
    if (!ball) return
    const ballTypeId = getBallTypeId(ballId)
    if (ballTypeId === null) return
    if (!contractDeployed) return
    setPendingBallId(ballId)
    mint(ballTypeId)
  }

  const mintErrorMsg = error?.message ?? null
  const mintingBallId = isPending ? pendingBallId : null

  const handleSelect = (ballId: string) => {
    if (!mintedIds.includes(ballId)) return
    setSelected(ballId)
    setSelectedBallId(ballId)
  }

  return (
    <div className="screen screen--ball">
      <h2 className="screen-title">Ball</h2>
      <p className="screen-subtitle">Mint a ball to play. Choose your minted ball.</p>
      {!contractDeployed && (
        <p className="ball-select-error" role="alert">
          Ball contract not configured. Set VITE_ARKANOID_BALLS_ADDRESS in .env and rebuild.
        </p>
      )}
      {contractDeployed && mintErrorMsg && (
        <p className="ball-select-error" role="alert">
          {mintErrorMsg}
        </p>
      )}
      <div className="screen-content ball-grid">
        {BALLS.map((b) => {
          const isMinted = mintedIds.includes(b.id)
          const isSelected = selected === b.id
          const isLoading = mintingBallId === b.id
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
                  disabled={!contractDeployed || !!mintingBallId}
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
