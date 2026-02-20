import type { GameId } from './App'
import type { Theme } from './theme/themeStorage'
import { getArkanoidStats, recordCheckIn } from './stats/arkanoidStats'
import { useCheckInContract } from './hooks/useCheckInContract'
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
  const { checkIn, isPending: checkInPending, error: checkInError, contractDeployed: checkInDeployed } = useCheckInContract(recordCheckIn)

  const handleCheckIn = () => {
    if (!checkInDeployed) {
      recordCheckIn()
      return
    }
    checkIn()
  }

  const checkInErrorMsg = checkInError?.message ?? null

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
        {checkInErrorMsg && (
          <p className="menu-checkin-error" role="alert">
            {checkInErrorMsg}
          </p>
        )}
        <button
          type="button"
          className="menu-checkin-btn"
          disabled={checkInPending}
          onClick={handleCheckIn}
          title="Check-in once per day (on-chain). +0.2 score per 5 days. No fee."
        >
          {checkInPending ? 'Check-in…' : 'Check-in'}
        </button>
      </div>
    </div>
  )
}
