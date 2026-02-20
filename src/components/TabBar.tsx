import './TabBar.css'

export type TabId = 'how' | 'ball' | 'play' | 'leaderboard' | 'profile'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'how', label: 'How to play', icon: '?' },
  { id: 'ball', label: 'Ball', icon: '●' },
  { id: 'play', label: 'Play', icon: '▶' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
  { id: 'profile', label: 'Profile', icon: '👤' },
]

export default function TabBar({
  activeTab,
  onSelect,
  onPlayClick,
}: {
  activeTab: TabId | null
  onSelect: (tab: TabId) => void
  onPlayClick: () => void
}) {
  return (
    <nav className="tab-bar" role="tablist">
      {TABS.map(({ id, label, icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={id !== 'play' && activeTab === id}
          aria-label={label}
          className={`tab-bar-item ${id === 'play' ? 'tab-bar-item--play' : ''} ${id !== 'play' && activeTab === id ? 'tab-bar-item--active' : ''}`}
          onClick={() => (id === 'play' ? onPlayClick() : onSelect(id))}
        >
          <span className="tab-bar-icon">{icon}</span>
          <span className="tab-bar-label">{label}</span>
        </button>
      ))}
    </nav>
  )
}
