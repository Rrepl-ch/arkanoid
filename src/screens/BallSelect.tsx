import { useState } from 'react'
import { BALLS, getBallPriceEth } from '../ball/ballConfig'
import {
  getMintedBallIds,
  mintBall,
  getSelectedBallId,
  setSelectedBallId,
  setGoldenBallOwner,
} from '../ball/ballStorage'
import './Screen.css'
import './BallSelect.css'

export default function BallSelect() {
  const [mintedIds, setMintedIds] = useState<string[]>(() => getMintedBallIds())
  const [selected, setSelected] = useState(() => getSelectedBallId())

  const refresh = () => {
    setMintedIds(getMintedBallIds())
    setSelected(getSelectedBallId())
  }

  const handleMint = (ballId: string) => {
    const ball = BALLS.find((b) => b.id === ballId)
    if (!ball) return
    const priceEth = getBallPriceEth(ballId)
    if (priceEth) {
      if (window.confirm(`${ball.name} costs ${priceEth} ETH. Payment via contract. Add for testing now?`)) {
        mintBall(ballId)
        if (ball.isGolden) setGoldenBallOwner('current-user')
        refresh()
        setSelected(ballId)
        setSelectedBallId(ballId)
      }
      return
    }
    mintBall(ballId)
    if (mintedIds.length === 0) {
      setSelected(ballId)
      setSelectedBallId(ballId)
    }
    refresh()
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
      <div className="screen-content ball-grid">
        {BALLS.map((b) => {
          const isMinted = mintedIds.includes(b.id)
          const isSelected = selected === b.id
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
                  onClick={() => handleMint(b.id)}
                >
                  {getBallPriceEth(b.id) ? `Mint ${getBallPriceEth(b.id)} ETH` : 'Mint (free)'}
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
