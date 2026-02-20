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
  /** Avatar URL (Farcaster pfp) or emoji string. */
  currentUserAvatar?: string | null
  onViewProfile?: (address: string) => void
}) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const selectedBallId = getSelectedBallId()
  const isPremiumSelected = PREMIUM_BALL_IDS.includes(selectedBallId as PremiumBallId)
  const premiumClass = isPremiumSelected ? `leaderboard-row--${selectedBallId}` : ''
  const premiumLabel = getPremiumLabel(selectedBallId)

  useEffect(() => {
    let cancelled = false
    fetchLeaderboard(20).then((list) => {
      if (!cancelled) setEntries(list)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleRowClick = (address: string) => {
    onViewProfile?.(address)
  }

  const renderAvatar = (entryAddress: string, rowAvatar?: string | null) => {
    const isYou = !!currentAddress && entryAddress.toLowerCase() === currentAddress.toLowerCase()
    const avatar = isYou ? (currentUserAvatar ?? rowAvatar ?? '👤') : (rowAvatar ?? '👤')
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
        <p className="screen-muted">Global leaderboard (Redis).</p>
        {entries.length === 0 ? (
          <div className="leaderboard-placeholder">
            <span className="leaderboard-icon">🏆</span>
            <p>No entries yet</p>
          </div>
        ) : (
          <ul className="leaderboard-list">
            {entries.map((entry, i) => {
              const isYou = !!currentAddress && entry.address.toLowerCase() === currentAddress.toLowerCase()
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
                  {renderAvatar(entry.address, entry.avatar)}
                  <span className="leaderboard-address">{isYou ? (currentUserNickname ?? entry.nickname ?? 'You') : (entry.nickname ?? entry.address)}</span>
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
