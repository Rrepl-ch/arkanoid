import './ArkanoidLevelSelect.css'
import { MAX_LEVEL } from './games/arkanoidLevels'

const LEVELS = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1)

export default function ArkanoidLevelSelect({
  onSelect,
  onBack,
}: {
  onSelect: (level: number) => void
  onBack: () => void
}) {
  return (
    <div className="arkanoid-levels">
      <button type="button" className="back secondary" onClick={onBack}>
        ← Back
      </button>
      <div className="arkanoid-levels-inner">
        <h2 className="arkanoid-levels-title">Arkanoid</h2>
        <p className="arkanoid-levels-subtitle">Select level</p>
        <div className="arkanoid-levels-grid">
        {LEVELS.map((n) => (
          <button
            key={n}
            type="button"
            className="arkanoid-level-card"
            onClick={() => onSelect(n)}
          >
            <span className="arkanoid-level-num">{n}</span>
            <span className="arkanoid-level-label">level</span>
          </button>
        ))}
        </div>
      </div>
    </div>
  )
}
