import { useEffect, useState } from 'react'
import { getArkanoidStats, type ArkanoidStats } from '../lib/arkanoidStats'
import { getNickname } from '../lib/nicknameStorage'
import { useMiniApp } from '../providers/MiniAppProvider'
import { fetchProfileStats } from '../lib/statsApi'
import {
  ACHIEVEMENT_GROUPS,
  getAchievementsByIds,
  getAchievementProgress,
  type AchievementDef,
  type AchievementProgress,
} from '../lib/arkanoidAchievements'
import './Screen.css'
import './Profile.css'

function formatProgress(progress: AchievementProgress): string {
  if (progress.unlocked) {
    if (progress.target != null) return `${progress.target.toLocaleString()} ✓`
    return '✓'
  }
  if (progress.current != null && progress.target != null) {
    return `${progress.current.toLocaleString()} / ${progress.target.toLocaleString()}`
  }
  return '—'
}

function AchievementSubrow({ ach, progress }: { ach: AchievementDef; progress: AchievementProgress }) {
  const stateLabel = formatProgress(progress)
  return (
    <div className={`profile-achievement-subrow ${progress.unlocked ? 'unlocked' : 'locked'}`}>
      <span className="profile-achievement-icon">{ach.icon}</span>
      <span className="profile-achievement-title">{ach.title}</span>
      <span className="profile-achievement-state">{stateLabel}</span>
    </div>
  )
}

type ProfileProps = {
  /** When set, show as "view profile" with Back button (e.g. from leaderboard). */
  viewAddress?: string | null
  currentAddress?: string | null
  onBack?: () => void
  /** Ник текущего пользователя (для своего профиля). */
  currentUserNickname?: string | null
}

function mergeStats(local: ArkanoidStats, remote: ArkanoidStats | null): ArkanoidStats {
  if (!remote) return local
  return {
    gamesPlayed: Math.max(local.gamesPlayed, remote.gamesPlayed),
    bestScore: Math.max(local.bestScore, remote.bestScore),
    totalScore: Math.max(local.totalScore, remote.totalScore),
    maxLevelReached: Math.max(local.maxLevelReached, remote.maxLevelReached),
    checkInCount: Math.max(local.checkInCount, remote.checkInCount),
    connectedWithCoinbaseAt: local.connectedWithCoinbaseAt ?? remote.connectedWithCoinbaseAt,
  }
}

const EMPTY_STATS: ArkanoidStats = { gamesPlayed: 0, bestScore: 0, totalScore: 0, maxLevelReached: 0, checkInCount: 0 }

export default function Profile({ viewAddress = null, currentAddress = null, onBack, currentUserNickname = null }: ProfileProps = {}) {
  const localStats = getArkanoidStats()
  const [serverStats, setServerStats] = useState<ArkanoidStats | null>(null)
  const { context: miniAppContext } = useMiniApp()
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set())
  const isViewingOther = viewAddress != null && viewAddress !== 'current-user'
  const targetAddress = isViewingOther ? viewAddress : currentAddress
  const displayStats = isViewingOther ? (serverStats ?? EMPTY_STATS) : mergeStats(localStats, serverStats)
  const baseUser = !isViewingOther ? miniAppContext?.user : null
  const displayName = isViewingOther
    ? (getNickname(viewAddress!) ?? (viewAddress!.slice(0, 6) + '…' + viewAddress!.slice(-4)))
    : (baseUser?.displayName ?? baseUser?.username ?? currentUserNickname ?? 'Guest')
  const avatarUrl = baseUser?.pfpUrl ?? null

  useEffect(() => {
    let cancelled = false
    if (!targetAddress || !/^0x[a-f0-9]{40}$/i.test(targetAddress)) {
      setServerStats(null)
      return
    }
    fetchProfileStats(targetAddress).then((s) => {
      if (!cancelled) setServerStats(s)
    })
    return () => {
      cancelled = true
    }
  }, [targetAddress])

  const totalUnlocked = ACHIEVEMENT_GROUPS.reduce(
    (sum, g) =>
      sum + getAchievementsByIds(g.achievementIds).filter((a) => a.check(displayStats)).length,
    0
  )
  const totalCount = ACHIEVEMENT_GROUPS.reduce((sum, g) => sum + g.achievementIds.length, 0)

  const toggleGroup = (groupId: string) => {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  return (
    <div className={`screen screen--profile ${onBack ? 'screen--profile-with-back' : ''}`}>
      {onBack && (
        <button type="button" className="back secondary" onClick={onBack}>
          ← Back
        </button>
      )}
      <h2 className="screen-title">
        {isViewingOther ? `Profile` : `Profile`}
      </h2>
      <div className="screen-content profile-content">
        <div className="profile-user">
          <div className={`profile-avatar ${avatarUrl ? 'profile-avatar--pfp' : ''}`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="profile-avatar-img" />
            ) : (
              <span className="profile-avatar-icon">👤</span>
            )}
          </div>
          <p className="profile-username">{displayName}</p>
          <p className="profile-hint">
            {isViewingOther ? 'On-chain stats coming soon' : 'Sign in with Base to save progress & leaderboard'}
          </p>
        </div>

        <section className="profile-stats">
          <h3 className="profile-section-title">Stats</h3>
          <div className="profile-stats-grid">
            <div className="profile-stat">
              <span className="profile-stat-value">{displayStats.gamesPlayed}</span>
              <span className="profile-stat-label">Games</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{displayStats.totalScore}</span>
              <span className="profile-stat-label">Total score</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{displayStats.maxLevelReached}</span>
              <span className="profile-stat-label">Max level</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{displayStats.checkInCount}</span>
              <span className="profile-stat-label">Check-ins</span>
            </div>
          </div>
        </section>

        <section className="profile-section">
          <h3 className="profile-section-title">Achievements</h3>
          <span className="profile-section-state profile-section-state--inline">
            {totalUnlocked} / {totalCount}
          </span>
          <div className="profile-achievement-groups">
              {!isViewingOther && ACHIEVEMENT_GROUPS.map((group) => {
                const groupAchs = getAchievementsByIds(group.achievementIds)
                const unlockedInGroup = groupAchs.filter((a) => a.check(displayStats)).length
                const allUnlocked = unlockedInGroup === group.achievementIds.length
                const expanded = expandedGroupIds.has(group.id)

                return (
                  <div
                    key={group.id}
                    className={`profile-achievement-group ${expanded ? 'expanded' : ''}`}
                  >
                    <button
                      type="button"
                      className="profile-achievement-head"
                      onClick={() => toggleGroup(group.id)}
                      aria-expanded={expanded}
                    >
                      <span className="profile-achievement-icon">{group.icon}</span>
                      <span className="profile-achievement-title">{group.title}</span>
                      <span className="profile-achievement-state">
                        {unlockedInGroup} / {group.achievementIds.length}
                      </span>
                      <span className="profile-achievement-chevron" aria-hidden>
                        {expanded ? '▼' : '▶'}
                      </span>
                    </button>
                    {expanded && (
                      <div className="profile-achievement-sublist">
                        {allUnlocked && (
                          <p className="profile-achievement-all-done">All done</p>
                        )}
                        {groupAchs.map((ach) => (
                          <AchievementSubrow
                            key={ach.id}
                            ach={ach}
                            progress={getAchievementProgress(ach, displayStats)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {isViewingOther && (
                <p className="profile-achievement-all-done">Achievements for this user will load from chain.</p>
              )}
          </div>
        </section>
      </div>
    </div>
  )
}
