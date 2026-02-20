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
        <h2 id="rules-popup-title" className="rules-popup-title">Правила</h2>
        <div className="rules-popup-content">
          <p><strong>Arkanoid:</strong> разбей все кирпичи, не потеряв мяч. Двигай платформу пальцем, тап — старт. Сердечко — +1 жизнь, жёлтая «3» — мультибол.</p>
          <p><strong>Сапёр:</strong> открой все клетки без мин. Тап — открыть, долгое нажатие — флаг.</p>
          <p><strong>Space Shooter:</strong> зажми экран для стрельбы, двигай корабль пальцем.</p>
        </div>
        <button type="button" className="rules-popup-btn" onClick={handleClose}>
          Понятно
        </button>
      </div>
    </div>
  )
}
