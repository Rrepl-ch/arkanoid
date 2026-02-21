import './ArkanoidLevelSelect.css'
import { MAX_LEVEL } from './games/arkanoidLevels'
import { getArkanoidStats } from './stats/arkanoidStats'

const LEVELS = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1)

export default function ArkanoidLevelSelect({
  onSelect,
  onBack,
}: {
  onSelect: (level: number) => void
  onBack: () => void
}) {
  const stats = getArkanoidStats()
  const unlockedUntil = Math.min(MAX_LEVEL, Math.max(1, stats.maxLevelReached + 1))

  return (
    <div className="arkanoid-levels">
      <button type="button" className="back secondary" onClick={onBack}>
        ← Back
      </button>
      <div className="arkanoid-levels-inner">
        <h2 className="arkanoid-levels-title">Arkanod</h2>
        <p className="arkanoid-levels-subtitle">Complete levels in order to unlock next</p>
        <div className="arkanoid-levels-grid">
          {LEVELS.map((n) => {
            const isLocked = n > unlockedUntil
            return (
              <button
                key={n}
                type="button"
                className={`arkanoid-level-card ${isLocked ? 'arkanoid-level-card--locked' : ''}`}
                onClick={() => !isLocked && onSelect(n)}
                disabled={isLocked}
                aria-label={isLocked ? `Level ${n} locked` : `Level ${n}`}
              >
                <span className="arkanoid-level-num">{n}</span>
                <span className="arkanoid-level-label">level</span>
                {isLocked && (
                  <span className="arkanoid-level-lock" aria-hidden>
                    🔒
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
