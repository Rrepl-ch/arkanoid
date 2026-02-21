import type { ArkanoidStats } from './arkanoidStats'

export type AchievementProgress = {
  unlocked: boolean
  current?: number
  target?: number
}

export type AchievementDef = {
  id: string
  title: string
  description: string
  icon: string
  check: (stats: ArkanoidStats) => boolean
  getProgress?: (stats: ArkanoidStats) => AchievementProgress
}

const SCORE_MILESTONES = [1000, 4000, 10000]
const LEVEL_MILESTONES = [3, 5, 10, 20]
const GAMES_MILESTONES = [1, 10]

export const ACHIEVEMENTS: AchievementDef[] = [
  ...SCORE_MILESTONES.map((m) => ({
    id: `score_${m}`,
    title: m >= 1000 ? `${m / 1000}k pts` : `${m} pts`,
    description: `Reach ${m.toLocaleString()} points`,
    icon: '⭐',
    check: (s: ArkanoidStats) => s.bestScore >= m,
    getProgress: (s: ArkanoidStats): AchievementProgress => ({
      unlocked: s.bestScore >= m,
      current: s.bestScore,
      target: m,
    }),
  })),
  ...LEVEL_MILESTONES.map((m) => ({
    id: `level_${m}`,
    title: m === 20 ? 'Champion' : `Level ${m}`,
    description: `Clear level ${m}`,
    icon: m === 20 ? '👑' : '🧱',
    check: (s: ArkanoidStats) => s.maxLevelReached >= m,
    getProgress: (s: ArkanoidStats): AchievementProgress => ({
      unlocked: s.maxLevelReached >= m,
      current: s.maxLevelReached,
      target: m,
    }),
  })),
  ...GAMES_MILESTONES.map((m) => ({
    id: `games_${m}`,
    title: m === 1 ? 'First run' : 'Regular',
    description: m === 1 ? 'Play your first game' : `Play ${m} games`,
    icon: m === 1 ? '🎮' : '🕹️',
    check: (s: ArkanoidStats) => s.gamesPlayed >= m,
    getProgress: (s: ArkanoidStats): AchievementProgress => ({
      unlocked: s.gamesPlayed >= m,
      current: s.gamesPlayed,
      target: m,
    }),
  })),
  {
    id: 'coinbase_wallet',
    title: 'Coinbase Wallet',
    description: 'Sign in with Coinbase Wallet',
    icon: '🔵',
    check: (s) => s.connectedWithCoinbaseAt != null,
    getProgress: (s): AchievementProgress => ({
      unlocked: s.connectedWithCoinbaseAt != null,
    }),
  },
]

export type AchievementGroupDef = {
  id: string
  title: string
  icon: string
  achievementIds: string[]
}

export const ACHIEVEMENT_GROUPS: AchievementGroupDef[] = [
  {
    id: 'score',
    title: 'Score',
    icon: '⭐',
    achievementIds: SCORE_MILESTONES.map((m) => `score_${m}`),
  },
  {
    id: 'levels',
    title: 'Levels',
    icon: '🧱',
    achievementIds: LEVEL_MILESTONES.map((m) => `level_${m}`),
  },
  {
    id: 'games',
    title: 'Games',
    icon: '🎮',
    achievementIds: GAMES_MILESTONES.map((m) => `games_${m}`),
  },
  {
    id: 'wallet',
    title: 'Wallet',
    icon: '🔵',
    achievementIds: ['coinbase_wallet'],
  },
]

const BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]))

export function getAchievementsByIds(ids: string[]): AchievementDef[] {
  return ids.map((id) => BY_ID.get(id)).filter(Boolean) as AchievementDef[]
}

export function getAchievementProgress(ach: AchievementDef, stats: ArkanoidStats): AchievementProgress {
  if (ach.getProgress) return ach.getProgress(stats)
  return { unlocked: ach.check(stats) }
}
