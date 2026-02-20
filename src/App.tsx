import { sdk } from '@farcaster/miniapp-sdk'
import { useEffect, useState } from 'react'
import Menu from './Menu'
import ArkanoidLevelSelect from './ArkanoidLevelSelect'
import Arkanoid from './games/Arkanoid'
import Minesweeper from './games/Minesweeper'
import SpaceShooter from './games/SpaceShooter'
import TabBar, { type TabId } from './components/TabBar'
import HowToPlay from './screens/HowToPlay'
import BallSelect from './screens/BallSelect'
import Leaderboard from './screens/Leaderboard'
import Profile from './screens/Profile'
import GameSelect from './screens/GameSelect'
import WalletConnect from './screens/WalletConnect'
import SetNickname from './screens/SetNickname'
import ArkanoidHeader from './components/ArkanoidHeader'
import { useWalletConnect } from './hooks/useWalletConnect'
import { hasMintedBall, getSelectedBallId, getMintedBallIds } from './ball/ballStorage'
import { getBallColor } from './ball/ballConfig'
import { getTheme, setTheme as persistTheme, type Theme } from './theme/themeStorage'
import './App.css'

export type GameId = 'menu' | 'arkanoid-levels' | 'arkanoid' | 'games' | 'minesweeper' | 'space-shooter'

/** Без подключённого кошелька игра недоступна. */
const REQUIRE_WALLET = true

export default function App() {
  const { address, nickname, setNickname, needsNickname, loading, connecting, error, connect } = useWalletConnect()
  const [game, setGame] = useState<GameId>('menu')
  const [arkanoidStartLevel, setArkanoidStartLevel] = useState(1)
  const [activeTab, setActiveTab] = useState<TabId | null>(null)
  const [profileViewAddress, setProfileViewAddress] = useState<string | null>(null)
  const [mintHintShown, setMintHintShown] = useState(false)
  const [theme, setThemeState] = useState<Theme>(() => getTheme())

  const setTheme = (t: Theme) => {
    persistTheme(t)
    setThemeState(t)
  }

  useEffect(() => {
    sdk.actions.ready()
  }, [])

  if (REQUIRE_WALLET && !address) {
    return (
      <div className="app">
        <div className="wallet-gate">
          <ArkanoidHeader />
          {loading ? (
            <p className="wallet-gate-loading">Loading…</p>
          ) : (
            <WalletConnect
              onCoinbase={connect}
              onWalletConnect={connect}
              connecting={connecting}
              error={error ?? undefined}
            />
          )}
        </div>
      </div>
    )
  }
  if (REQUIRE_WALLET && address && needsNickname) {
    return (
      <div className="app">
        <div className="wallet-gate">
          <SetNickname address={address} setNickname={setNickname} onDone={() => {}} />
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {game === 'menu' && (
        <>
          <div className="app-main">
            {activeTab === null && (
              <div className="app-main-center">
                <Menu
                  theme={theme}
                  setTheme={setTheme}
                  onSelect={(id) => {
                    if (id === 'arkanoid-levels' && !hasMintedBall()) {
                      setActiveTab('ball')
                      setMintHintShown(true)
                      return
                    }
                    setGame(id)
                  }}
                  onGamesClick={() => setGame('games')}
                />
              </div>
            )}
            {activeTab === 'how' && <HowToPlay />}
            {activeTab === 'ball' && (
              <>
                {mintHintShown && (
                  <div className="mint-hint">
                    <p>Mint a ball first to start playing</p>
                    <button type="button" className="mint-hint-dismiss" onClick={() => setMintHintShown(false)}>
                      ×
                    </button>
                  </div>
                )}
                <BallSelect />
              </>
            )}
            {activeTab === 'leaderboard' && (
              profileViewAddress != null ? (
                <Profile
                  viewAddress={profileViewAddress}
                  onBack={() => setProfileViewAddress(null)}
                  currentUserNickname={nickname}
                />
              ) : (
                <Leaderboard
                  currentUserNickname={nickname}
                  onViewProfile={(address) => {
                    if (address === 'current-user') setActiveTab('profile')
                    else setProfileViewAddress(address)
                  }}
                />
              )
            )}
            {activeTab === 'profile' && profileViewAddress == null && <Profile currentUserNickname={nickname} />}
          </div>
          <TabBar
            activeTab={activeTab}
            onSelect={(tab) => {
              setProfileViewAddress(null)
              setActiveTab(tab)
            }}
            onPlayClick={() => setActiveTab(null)}
          />
        </>
      )}
      {game === 'arkanoid-levels' && (
        <ArkanoidLevelSelect
          onBack={() => setGame('menu')}
          onSelect={(level) => {
            setArkanoidStartLevel(level)
            setGame('arkanoid')
          }}
        />
      )}
      {game === 'arkanoid' && (
        <Arkanoid
          initialLevel={arkanoidStartLevel}
          ballColor={getBallColor((() => { const m = getMintedBallIds(); const s = getSelectedBallId(); return m.includes(s) ? s : m[0] ?? 'classic'; })())}
          onBack={() => setGame('arkanoid-levels')}
        />
      )}
      {game === 'games' && (
        <GameSelect
          onBack={() => setGame('menu')}
          onSelect={(action) => {
            if (action === 'arkanoid-levels' && !hasMintedBall()) {
              setGame('menu')
              setActiveTab('ball')
              setMintHintShown(true)
              return
            }
            setGame(action)
          }}
        />
      )}
      {game === 'minesweeper' && (
        <Minesweeper onBack={() => setGame('games')} />
      )}
      {game === 'space-shooter' && (
        <SpaceShooter onBack={() => setGame('games')} />
      )}
    </div>
  )
}
