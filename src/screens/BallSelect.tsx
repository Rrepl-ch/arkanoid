import { useState, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { BALLS, getBallPriceEth } from '../ball/ballConfig'
import { setSelectedBallId, mintBall } from '../ball/ballStorage'
import { BALL_TYPE_IDS } from '../contracts/arkanoidBalls'
import { useOwnedBalls, useMintBall } from '../hooks/useArkanoidBallsContract'
import './Screen.css'
import './BallSelect.css'

function getSelectedIndex(): number {
  try {
    const id = localStorage.getItem('arkanoid-selected-ball') || 'classic'
    const i = BALL_TYPE_IDS.indexOf(id as (typeof BALL_TYPE_IDS)[number])
    return i >= 0 ? i : 0
  } catch {
    return 0
  }
}

export default function BallSelect() {
  const { address } = useAccount()
  const [selectedBallId, setSelectedBallIdState] = useState(getSelectedIndex)
  const [mintingBallId, setMintingBallId] = useState<number | null>(null)
  const { owned: ownedBallIds, refetch: refetchOwned } = useOwnedBalls()
  const { mint, isPending: mintPending, error: mintError, contractDeployed } = useMintBall(() => {
    if (mintingBallId !== null) {
      mintBall(BALL_TYPE_IDS[mintingBallId])
    }
    refetchOwned()
    setMintingBallId(null)
  })

  const handleMint = useCallback(
    (index: number) => {
      if (!address) {
        alert('Connect wallet to mint')
        return
      }
      if (!contractDeployed) {
        alert('Ball contract not configured. Set VITE_ARKANOID_BALLS_ADDRESS in .env and rebuild.')
        return
      }
      setMintingBallId(index)
      mint(index)
    },
    [address, contractDeployed, mint]
  )

  const handleSelect = useCallback((index: number) => {
    if (!ownedBallIds.has(index)) return
    setSelectedBallIdState(index)
    setSelectedBallId(BALL_TYPE_IDS[index])
  }, [ownedBallIds])

  const mintErrorMsg = mintError?.message ?? null
  const loadingBallId = mintPending ? mintingBallId : null

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
        {BALLS.map((b, i) => {
          const isMinted = ownedBallIds.has(i)
          const isSelected = selectedBallId === i
          const isLoading = loadingBallId === i
          const priceEth = getBallPriceEth(b.id)
          return (
            <div
              key={b.id}
              className={`ball-option ${!isMinted ? 'ball-option--locked' : ''} ${isSelected ? 'ball-option--active' : ''} ${b.id === 'gold' ? 'ball-option--golden' : ''} ${b.id === 'green' ? 'ball-option--emerald' : ''} ${b.id === 'red' ? 'ball-option--ruby' : ''} ${priceEth ? 'ball-option--premium' : ''}`}
            >
              <span className="ball-preview" style={{ background: b.color }} />
              <span className="ball-name">{b.name}</span>
              {!isMinted ? (
                <button
                  type="button"
                  className="ball-mint-btn"
                  disabled={!contractDeployed || !!loadingBallId}
                  onClick={() => handleMint(i)}
                >
                  {isLoading ? 'Minting…' : priceEth ? `Mint ${priceEth} ETH` : 'Mint (free)'}
                </button>
              ) : (
                <button
                  type="button"
                  className="ball-select-btn"
                  onClick={() => handleSelect(i)}
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
