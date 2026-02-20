import { useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import type { GameId } from './App'
import type { Theme } from './theme/themeStorage'
import { getArkanoidStats, recordCheckIn } from './stats/arkanoidStats'
import { getArkanoidCheckInAddress, checkInViaContract, type EIP1193Provider } from './contracts/arkanoidCheckIn'
import ArkanoidHeader from './components/ArkanoidHeader'
import './Menu.css'

export default function Menu({
  theme,
  setTheme,
  onSelect,
  onGamesClick,
}: {
  theme: Theme
  setTheme: (t: Theme) => void
  onSelect: (g: GameId) => void
  onGamesClick: () => void
}) {
  const stats = getArkanoidStats()
  const hasStats = stats.totalScore > 0 || stats.maxLevelReached > 0
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [checkInError, setCheckInError] = useState<string | null>(null)
  const hasCheckInContract = !!getArkanoidCheckInAddress()

  const handleCheckIn = async () => {
    if (!hasCheckInContract) {
      recordCheckIn()
      return
    }
    setCheckInError(null)
    setCheckInLoading(true)
    try {
      const provider = await sdk.wallet.getEthereumProvider()
      if (!provider) {
        setCheckInError('Connect wallet first (open app in Base/Farcaster)')
        return
      }
      const result = await checkInViaContract(provider as EIP1193Provider)
      const ok = result && typeof result === 'object' && (result as { ok?: boolean }).ok === true
      if (!ok) {
        const msg = result && typeof result === 'object' && 'error' in result && typeof (result as { error: string }).error === 'string'
          ? (result as { error: string }).error
          : 'Check-in failed'
        setCheckInError(msg)
        return
      }
      recordCheckIn()
    } catch (e) {
      setCheckInError(e instanceof Error ? e.message : 'Check-in failed')
    } finally {
      setCheckInLoading(false)
    }
  }

  return (
    <div className="menu">
      <button
        type="button"
        className="menu-corner menu-corner--left"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        title={theme === 'dark' ? 'Day mode' : 'Night mode'}
        aria-label={theme === 'dark' ? 'Switch to day' : 'Switch to night'}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <button
        type="button"
        className="menu-corner menu-corner--right"
        onClick={onGamesClick}
        title="Games"
        aria-label="Games"
      >
        🎮
      </button>
      <div className="menu-content">
        <ArkanoidHeader />
        {hasStats && (
          <div className="menu-stats">
            {stats.totalScore > 0 && (
              <span className="menu-stat">Total: {stats.totalScore}</span>
            )}
            {stats.maxLevelReached > 0 && (
              <span className="menu-stat">Level {stats.maxLevelReached}</span>
            )}
          </div>
        )}
        <button
          type="button"
          className="menu-play-btn"
          onClick={() => onSelect('arkanoid-levels')}
        >
          Play
        </button>
        {checkInError && (
          <p className="menu-checkin-error" role="alert">
            {checkInError}
          </p>
        )}
        <button
          type="button"
          className="menu-checkin-btn"
          disabled={checkInLoading}
          onClick={handleCheckIn}
          title="Check-in once per day (on-chain). +0.2 score per 5 days. No fee."
        >
          {checkInLoading ? 'Check-in…' : 'Check-in'}
        </button>
      </div>
    </div>
  )
}
