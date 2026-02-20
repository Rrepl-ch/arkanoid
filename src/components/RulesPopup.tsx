import './RulesPopup.css'

const RULES_STORAGE_KEY = 'retro_miniapp_rules_seen'

export function getRulesSeen(): boolean {
  try {
    return localStorage.getItem(RULES_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setRulesSeen(): void {
  try {
    localStorage.setItem(RULES_STORAGE_KEY, '1')
  } catch {
    // ignore
  }
}

type Props = {
  onClose: () => void
}

export default function RulesPopup({ onClose }: Props) {
  const handleClose = () => {
    setRulesSeen()
    onClose()
  }

  return (
    <div className="rules-popup-overlay" role="dialog" aria-modal="true" aria-labelledby="rules-popup-title">
      <div className="rules-popup">
        <h2 id="rules-popup-title" className="rules-popup-title">Rules</h2>
        <div className="rules-popup-content">
          <p><strong>Arkanoid:</strong> break all bricks without losing the ball. Move your finger to move the paddle; tap to launch. Red heart — +1 life, yellow «3» — multiball.</p>
          <p><strong>Minesweeper:</strong> reveal all cells without hitting mines. Tap to reveal, long-press to flag.</p>
          <p><strong>Space Shooter:</strong> hold to shoot, move your finger to move the ship.</p>
        </div>
        <button type="button" className="rules-popup-btn" onClick={handleClose}>
          Got it
        </button>
      </div>
    </div>
  )
}
