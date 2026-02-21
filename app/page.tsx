'use client'

import { useEffect, useState } from 'react'
import { useAccount, useConnect } from 'wagmi'
import Menu from './Menu'
import ArkanoidLevelSelect from './ArkanoidLevelSelect'
import Arkanoid from './games/Arkanoid'
import Minesweeper from './games/Minesweeper'
import SpaceShooter from './games/SpaceShooter'
import TabBar, { type TabId } from './components/TabBar'
import RulesPopup, { getRulesSeen } from './components/RulesPopup'
import HowToPlay from './screens/HowToPlay'
import BallSelect from './screens/BallSelect'
import Leaderboard from './screens/Leaderboard'
import Profile from './screens/Profile'
import GameSelect from './screens/GameSelect'
import WalletConnect from './screens/WalletConnect'
import SetNickname from './screens/SetNickname'
import ArkanoidHeader from './components/ArkanoidHeader'
import { useNicknameForAddress } from './lib/useNicknameForAddress'
import { useMiniApp } from './providers/MiniAppProvider'
import { recordCoinbaseConnect } from './lib/arkanoidStats'
import { getSelectedBallId } from './lib/ballStorage'
import { getBallColor } from './lib/ballConfig'
import { BALL_TYPE_IDS } from './lib/arkanoidBalls'
import { useOwnedBalls } from './lib/useArkanoidBallsContract'
import { getTheme, setTheme as persistTheme, type Theme } from './lib/themeStorage'
import type { GameId } from './types'

const REQUIRE_WALLET = true

export default function Home() {
  const { address, status } = useAccount()
  const { connect, connectors, isPending: connecting, error: connectError } = useConnect()
  const { context: miniAppContext, isReady: miniAppReady } = useMiniApp()
  const { nickname, setNickname } = useNicknameForAddress(address ?? undefined)
  const baseUser = miniAppContext?.user
  const effectiveNickname = baseUser
    ? (baseUser.username ?? baseUser.displayName ?? nickname)
    : nickname
  const effectiveAvatar = baseUser?.pfpUrl ?? null
  const needsNickname = Boolean(address && !baseUser && !effectiveNickname && miniAppReady)
  const { owned: ownedBallIds } = useOwnedBalls()
  const hasMintedBall = ownedBallIds.size > 0
  const [game, setGame] = useState<GameId>('menu')
  const [arkanoidStartLevel, setArkanoidStartLevel] = useState(1)
  const [activeTab, setActiveTab] = useState<TabId | null>(null)
  const [profileViewAddress, setProfileViewAddress] = useState<string | null>(null)
  const [mintHintShown, setMintHintShown] = useState(false)
  const [theme, setThemeState] = useState<Theme>(() => getTheme())
  const [rulesPopupOpen, setRulesPopupOpen] = useState(() => !getRulesSeen())

  const setTheme = (t: Theme) => {
    persistTheme(t)
    setThemeState(t)
  }

  useEffect(() => {
    if (address) recordCoinbaseConnect(address)
  }, [address])

  const loading = status === 'reconnecting'

  if (REQUIRE_WALLET && !address) {
    return (
      <div className="app">
        <div className="wallet-gate">
          <ArkanoidHeader />
          {loading ? (
            <p className="wallet-gate-loading">Loading…</p>
          ) : (
            <WalletConnect
              connectors={connectors}
              connect={connect}
              connecting={connecting}
              error={connectError?.message}
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
          <SetNickname
            address={address}
            setNickname={setNickname}
            onDone={() => {}}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {game === 'menu' && rulesPopupOpen && (
        <RulesPopup onClose={() => setRulesPopupOpen(false)} />
      )}
      {game === 'menu' && (
        <>
          <div className="app-main">
            {activeTab === null && (
              <div className="app-main-center">
                <Menu
                  theme={theme}
                  setTheme={setTheme}
                  onSelect={(id) => {
                    if (id === 'arkanoid-levels' && !hasMintedBall) {
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
                  currentAddress={address ?? null}
                  onBack={() => setProfileViewAddress(null)}
                  currentUserNickname={effectiveNickname}
                />
              ) : (
                <Leaderboard
                  currentAddress={address ?? null}
                  currentUserNickname={effectiveNickname}
                  currentUserAvatar={effectiveAvatar}
                  onViewProfile={(addr) => {
                    if (addr === 'current-user') setActiveTab('profile')
                    else setProfileViewAddress(addr)
                  }}
                />
              )
            )}
            {activeTab === 'profile' && profileViewAddress == null && (
              <Profile currentAddress={address ?? null} currentUserNickname={effectiveNickname} />
            )}
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
          ballColor={getBallColor((() => {
            const s = getSelectedBallId()
            const si = BALL_TYPE_IDS.indexOf(s as (typeof BALL_TYPE_IDS)[number])
            if (si >= 0 && ownedBallIds.has(si)) return s
            if (ownedBallIds.size === 0) return 'classic'
            return BALL_TYPE_IDS[Math.min(...ownedBallIds)]
          })())}
          onBack={() => setGame('arkanoid-levels')}
        />
      )}
      {game === 'games' && (
        <GameSelect
          onBack={() => setGame('menu')}
          onSelect={(action) => {
            if (action === 'arkanoid-levels' && !hasMintedBall) {
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
