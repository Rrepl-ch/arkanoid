import { useEffect, useState } from 'react'
import { getSelectedBallId } from '../ball/ballStorage'
import { fetchLeaderboard, type LeaderboardEntry } from '../stats/statsApi'
import './Screen.css'
import './Leaderboard.css'

const PREMIUM_BALL_IDS = ['gold', 'red', 'green'] as const
type PremiumBallId = (typeof PREMIUM_BALL_IDS)[number]

function getPremiumLabel(ballId: string): string | null {
  const names: Record<string, string> = { gold: 'Golden ball owner', red: 'Ruby ball owner', green: 'Emerald ball owner' }
  return names[ballId] ?? null
}

export default function Leaderboard({
  currentAddress = null,
  currentUserNickname = null,
  currentUserAvatar = null,
  onViewProfile,
}: {
  currentAddress?: string | null
  currentUserNickname?: string | null
  currentUserAvatar?: string | null
  onViewProfile?: (address: string) => void
}) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const selectedBallId = getSelectedBallId()
  const isPremiumSelected = PREMIUM_BALL_IDS.includes(selectedBallId as PremiumBallId)
  const premiumClass = isPremiumSelected ? `leaderboard-row--${selectedBallId}` : ''
  const premiumLabel = getPremiumLabel(selectedBallId)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchLeaderboard(20)
      .then((list) => { if (!cancelled) setEntries(list) })
      .catch(() => { if (!cancelled) setEntries([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const addr = currentAddress?.toLowerCase()

  return (
    <div className="screen screen--leaderboard">
      <h2 className="screen-title">Leaderboard</h2>
      <div className="screen-content leaderboard-content">
        {loading ? (
          <div className="leaderboard-loading">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="leaderboard-placeholder">
            <span className="leaderboard-icon">🏆</span>
            <p>No scores yet. Be the first!</p>
          </div>
        ) : (
          <ul className="leaderboard-list">
            {entries.map((entry, i) => {
              const isYou = !!addr && entry.address.toLowerCase() === addr
              const rowPremiumClass = isYou ? premiumClass : ''
              const rowLabel = isYou && premiumLabel ? premiumLabel : null
              const avatar = isYou
                ? (currentUserAvatar ?? entry.avatar ?? '👤')
                : (entry.avatar ?? '👤')
              const nick = isYou
                ? (currentUserNickname ?? entry.nickname ?? 'You')
                : (entry.nickname ?? entry.address)

              return (
                <li
                  key={`${entry.address}-${i}`}
                  role={onViewProfile ? 'button' : undefined}
                  tabIndex={onViewProfile ? 0 : undefined}
                  className={`leaderboard-row ${isYou ? 'leaderboard-row-me' : ''} ${rowPremiumClass} ${onViewProfile ? 'leaderboard-row--clickable' : ''}`}
                  onClick={onViewProfile ? () => onViewProfile(entry.address) : undefined}
                  onKeyDown={onViewProfile ? (e) => (e.key === 'Enter' || e.key === ' ') && onViewProfile(entry.address) : undefined}
                >
                  <span className="leaderboard-rank">#{i + 1}</span>
                  <span className="leaderboard-avatar">
                    {typeof avatar === 'string' && avatar.startsWith('http') ? (
                      <img src={avatar} alt="" referrerPolicy="no-referrer" className="leaderboard-avatar-img" />
                    ) : (
                      avatar
                    )}
                  </span>
                  <span className="leaderboard-nick">{nick}</span>
                  <span className="leaderboard-score">{Math.floor(entry.score)}</span>
                  {rowLabel && (
                    <span className={`leaderboard-premium-label leaderboard-premium-label--${selectedBallId}`}>
                      {rowLabel}
                    </span>
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
