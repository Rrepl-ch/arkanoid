import { getArkanoidStats } from '../stats/arkanoidStats'
import { getSelectedBallId } from '../ball/ballStorage'
import './Screen.css'
import './Leaderboard.css'

const PREMIUM_BALL_IDS = ['gold', 'red', 'green'] as const
type PremiumBallId = (typeof PREMIUM_BALL_IDS)[number]

function getPremiumLabel(ballId: string): string | null {
  const names: Record<string, string> = { gold: 'Golden ball owner', red: 'Ruby ball owner', green: 'Emerald ball owner' }
  return names[ballId] ?? null
}

export default function Leaderboard({
  currentUserNickname = null,
  currentUserAvatar = null,
  onViewProfile,
}: {
  currentUserNickname?: string | null
  /** Avatar URL (Farcaster pfp) or emoji string. */
  currentUserAvatar?: string | null
  onViewProfile?: (address: string) => void
}) {
  const stats = getArkanoidStats()
  const selectedBallId = getSelectedBallId()
  const isPremiumSelected = PREMIUM_BALL_IDS.includes(selectedBallId as PremiumBallId)
  const premiumClass = isPremiumSelected ? `leaderboard-row--${selectedBallId}` : ''
  const premiumLabel = getPremiumLabel(selectedBallId)

  const entries = [
    ...(stats.totalScore > 0 ? [{ address: 'current-user', score: stats.totalScore }] : []),
  ]

  const handleRowClick = (address: string) => {
    onViewProfile?.(address)
  }

  const renderAvatar = (entryAddress: string) => {
    const isYou = entryAddress === 'current-user'
    const avatar = isYou ? (currentUserAvatar ?? '👤') : '👤'
    if (typeof avatar === 'string' && avatar.startsWith('http')) {
      return (
        <span className="leaderboard-avatar leaderboard-avatar--pfp">
          <img src={avatar} alt="" referrerPolicy="no-referrer" className="leaderboard-avatar-img" />
        </span>
      )
    }
    return <span className="leaderboard-avatar leaderboard-avatar--emoji">{avatar}</span>
  }

  return (
    <div className="screen screen--leaderboard">
      <h2 className="screen-title">Leaderboard</h2>
      <div className="screen-content leaderboard-content">
        <p className="screen-muted">On-chain leaderboard coming soon. Your total scores will be saved on Base.</p>
        {entries.length === 0 ? (
          <div className="leaderboard-placeholder">
            <span className="leaderboard-icon">🏆</span>
            <p>No entries yet</p>
          </div>
        ) : (
          <ul className="leaderboard-list">
            {entries.map((entry, i) => {
              const isYou = entry.address === 'current-user'
              const rowPremiumClass = isYou ? premiumClass : ''
              const rowLabel = isYou && premiumLabel ? premiumLabel : null
              return (
                <li
                  key={entry.address}
                  role={onViewProfile ? 'button' : undefined}
                  tabIndex={onViewProfile ? 0 : undefined}
                  className={`leaderboard-row ${rowPremiumClass} ${onViewProfile ? 'leaderboard-row--clickable' : ''}`}
                  onClick={onViewProfile ? () => handleRowClick(entry.address) : undefined}
                  onKeyDown={onViewProfile ? (e) => e.key === 'Enter' && handleRowClick(entry.address) : undefined}
                >
                  <span className="leaderboard-rank">{i + 1}</span>
                  {renderAvatar(entry.address)}
                  <span className="leaderboard-address">{isYou ? (currentUserNickname ?? 'You') : entry.address}</span>
                  <span className="leaderboard-score">{entry.score}</span>
                  {rowLabel && (
                    <span className={`leaderboard-premium-label leaderboard-premium-label--${selectedBallId}`}>
                      {rowLabel}
                    </span>
                  )}
                  {onViewProfile && (
                    <span className="leaderboard-view-profile" aria-hidden>→</span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
