import { useCallback, useEffect, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { useWindowSize, useCanvasMouse } from '../lib/useFullscreenCanvas'
import { recordArkanoidGameEnd, recordArkanoidProgress } from '../lib/arkanoidStats'
import { getLevelPattern, MAX_LEVEL } from './arkanoidLevels'
import { getNickname } from '../lib/nicknameStorage'

const PADDLE_H = 14
const BALL_R = 8
/** Ball base speed (+50% vs previous value). */
const BALL_SPEED = 2.5

/** Layout под телефон (Base wallet): 8 колонок, крупные кирпичи. */
const COLS = 8

// Бусты: жизнь (красное ♥), растроение (жёлтый «3»). Со временем растёт шанс именно на растроение.
const POWER_COLORS: Record<PowerUp, string> = {
  life: '#e74c3c',
  multiball: '#ffd93d',
}

type PowerUp = 'life' | 'multiball'

const LIFE_CHANCE = 0.05
const MULTIBALL_CHANCE_START = 0.3
const MULTIBALL_INTERVAL_SEC = 3
const MULTIBALL_BONUS_PER_STEP = 0.05
const MULTIBALL_CHANCE_MAX = 0.35

/** Один бросок: 5% — жизнь, растущий шанс (30%→60%) — растроение, иначе ничего. */
function rollPowerUp(_level: number, forceHeart?: boolean, elapsedSeconds = 0): PowerUp | undefined {
  if (forceHeart) return 'life'
  const r = Math.random()
  if (r < LIFE_CHANCE) return 'life'
  const bonus = Math.floor(elapsedSeconds / MULTIBALL_INTERVAL_SEC) * MULTIBALL_BONUS_PER_STEP
  const multiballChance = Math.min(MULTIBALL_CHANCE_MAX, MULTIBALL_CHANCE_START + bonus)
  if (r < LIFE_CHANCE + multiballChance) return 'multiball'
  return undefined
}

export default function Arkanoid({ onBack, initialLevel = 1, ballColor = '#ffffff' }: { onBack: () => void; initialLevel?: number; ballColor?: string }) {
  const { address } = useAccount()
  const nickname = address ? getNickname(address) : null
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w: W, h: H } = useWindowSize()
  const [restartKey, setRestartKey] = useState(0)
  const mouseXRef = useCanvasMouse(canvasRef, true, restartKey)
  const [lives, setLives] = useState(1)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(Math.min(Math.max(1, initialLevel), MAX_LEVEL))
  const [gameOver, setGameOver] = useState(false)
  const [levelComplete, setLevelComplete] = useState(false)
  const [_elapsed, setElapsed] = useState(0)
  const [ballLaunched, setBallLaunched] = useState(false)
  const levelCompleteShownRef = useRef(false)
  const PADDLE_W = Math.min(90, Math.floor(W * 0.28))
  const paddleRef = useRef({ x: W / 2 - PADDLE_W / 2 })
  const ballRef = useRef({ x: W / 2, y: H - 80, dx: BALL_SPEED, dy: -BALL_SPEED })
  const ballsRef = useRef<{ x: number; y: number; dx: number; dy: number }[]>([{ x: W / 2, y: H - 80, dx: BALL_SPEED, dy: -BALL_SPEED }])
  const bricksRef = useRef<{ x: number; y: number; w: number; h: number; colorIndex: number }[]>([])
  const firstHeartDroppedRef = useRef(false)
  const powerUpsRef = useRef<{ x: number; y: number; type: PowerUp }[]>([])
  const gameStartRef = useRef<number>(0)
  const elapsedRef = useRef(0)
  const lastElapsedSecRef = useRef(-1)
  const levelRef = useRef(level)
  levelRef.current = level
  const launchedRef = useRef(false)
  launchedRef.current = ballLaunched
  const gameOverRecordedRef = useRef(false)

  const launchBall = useCallback(() => {
    if (launchedRef.current) return
    launchedRef.current = true
    setBallLaunched(true)
  }, [])

  const initBricks = useCallback((currentLevel: number) => {
    const gap = 2
    const bw = (W - 4) / COLS - gap
    const bh = 20
    const pattern = getLevelPattern(currentLevel)
    const list: { x: number; y: number; w: number; h: number; colorIndex: number }[] = []
    for (let row = 0; row < pattern.length; row++) {
      for (let col = 0; col < pattern[row].length && col < COLS; col++) {
        const colorIndex = pattern[row][col]
        if (colorIndex < 0) continue
        list.push({
          x: 2 + col * (bw + gap),
          y: 50 + row * (bh + gap),
          w: bw,
          h: bh,
          colorIndex: colorIndex % 6,
        })
      }
    }
    bricksRef.current = list
  }, [W])

  useEffect(() => { initBricks(level) }, [initBricks, level])

  useEffect(() => {
    if (gameOver || levelComplete || W < 100 || H < 100) return
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!
    let raf: number

    const loop = () => {
      if (gameStartRef.current === 0) gameStartRef.current = performance.now()
      const sec = (performance.now() - gameStartRef.current) / 1000
      elapsedRef.current = sec
      const secInt = sec | 0
      if (secInt !== lastElapsedSecRef.current) {
        lastElapsedSecRef.current = secInt
        setElapsed(sec)
      }

      const paddle = paddleRef.current
      const mx = mouseXRef.current || W / 2
      paddle.x = Math.max(0, Math.min(W - PADDLE_W, mx - PADDLE_W / 2))

      const balls = ballsRef.current
      if (!launchedRef.current) {
        const px = paddle.x + PADDLE_W / 2
        const py = H - 80
        balls.forEach((b, i) => {
          b.x = px
          b.y = py
          if (i === 0) { b.dx = BALL_SPEED; b.dy = -BALL_SPEED }
        })
      } else {
      for (let bi = balls.length - 1; bi >= 0; bi--) {
        const b = balls[bi]
        b.x += b.dx
        b.y += b.dy
        if (b.x <= BALL_R || b.x >= W - BALL_R) b.dx *= -1
        if (b.y <= BALL_R) b.dy *= -1
        if (b.y >= H - BALL_R) {
          balls.splice(bi, 1)
          if (balls.length === 0) {
            setLives(l => { if (l <= 1) setGameOver(true); return l - 1 })
            ballsRef.current = [{ x: W / 2, y: H - 80, dx: BALL_SPEED, dy: -BALL_SPEED }]
            ballRef.current = ballsRef.current[0]
            setTimeout(() => setBallLaunched(false), 0)
          }
          continue
        }
        if (b.y + BALL_R >= H - 35 && b.y - BALL_R <= H - 35 + PADDLE_H && b.x >= paddle.x && b.x <= paddle.x + PADDLE_W) {
          b.dy = -Math.abs(b.dy)
          b.dx = (b.x - (paddle.x + PADDLE_W / 2)) / (PADDLE_W / 2) * (BALL_SPEED * 2)
        }
      }

      const bricks = bricksRef.current
      const hitBrickIndices = new Set<number>()
      ballsRef.current.forEach(b => {
        for (let i = 0; i < bricks.length; i++) {
          if (hitBrickIndices.has(i)) continue
          const br = bricks[i]
          if (b.x + BALL_R >= br.x && b.x - BALL_R <= br.x + br.w && b.y + BALL_R >= br.y && b.y - BALL_R <= br.y + br.h) {
            b.dy *= -1
            hitBrickIndices.add(i)
            setScore(s => s + 10)
            const forceFirstHeart = levelRef.current === 1 && !firstHeartDroppedRef.current
            const power = rollPowerUp(levelRef.current, forceFirstHeart, elapsedRef.current)
            if (power) {
              powerUpsRef.current.push({ x: br.x + br.w / 2 - 8, y: br.y, type: power })
              if (forceFirstHeart) firstHeartDroppedRef.current = true
            }
            break
          }
        }
      })
      bricksRef.current = bricks.filter((_, i) => !hitBrickIndices.has(i))
      }

      powerUpsRef.current = powerUpsRef.current.filter(pu => {
        pu.y += 3
        if (pu.y > H - 40 && pu.x > paddle.x - 10 && pu.x < paddle.x + PADDLE_W + 10) {
          if (pu.type === 'life') setLives(l => l + 1)
          if (pu.type === 'multiball' && launchedRef.current) {
            const existing = ballsRef.current.slice()
            const MAX_BALLS = 30
            const newBalls = existing.slice()
            for (const b of existing) {
              if (newBalls.length >= MAX_BALLS) break
              newBalls.push({ x: b.x, y: b.y, dx: -b.dx, dy: b.dy })
              if (newBalls.length >= MAX_BALLS) break
              newBalls.push({ x: b.x, y: b.y, dx: b.dx * 1.2, dy: b.dy })
            }
            ballsRef.current = newBalls
          }
          return false
        }
        return pu.y < H
      })

      if (bricksRef.current.length === 0 && !levelCompleteShownRef.current) {
        levelCompleteShownRef.current = true
        setTimeout(() => setLevelComplete(true), 250)
      }

      ctx.fillStyle = '#0a0a12'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#00d4aa'
      ctx.fillRect(paddle.x, H - 35, PADDLE_W, PADDLE_H)
      ctx.fillStyle = ballColor
      ballsRef.current.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2); ctx.fill() })
      const colors = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#9b59b6','#e67e22']
      bricksRef.current.forEach((br) => {
        ctx.fillStyle = colors[br.colorIndex]
        ctx.fillRect(br.x, br.y, br.w, br.h)
      })
      powerUpsRef.current.forEach(pu => {
        const cx = pu.x + 8
        const cy = pu.y + 7
        ctx.save()
        if (pu.type === 'life') {
          ctx.fillStyle = POWER_COLORS.life
          ctx.fillRect(pu.x, pu.y, 16, 14)
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 14px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('♥', cx, cy)
        } else {
          ctx.fillStyle = POWER_COLORS.multiball
          ctx.fillRect(pu.x, pu.y, 16, 14)
          ctx.fillStyle = '#1a1a1a'
          ctx.font = 'bold 12px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('3', cx, cy)
        }
        ctx.restore()
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [gameOver, levelComplete, initBricks, W, H, mouseXRef, PADDLE_W, ballLaunched, ballColor])

  useEffect(() => {
    if (gameOver && !gameOverRecordedRef.current) {
      gameOverRecordedRef.current = true
      recordArkanoidGameEnd(score, level, { address: address ?? undefined, nickname })
    }
  }, [gameOver, score, level, address, nickname])

  if (gameOver) {
    return (
      <div className="game-container game-level-complete">
        <div className="level-complete-card">
          <h2 className="level-complete-title" style={{ color: 'var(--danger)' }}>Game Over</h2>
          <p className="level-complete-score">Score: {score}</p>
          <div className="level-complete-actions">
            <button
              type="button"
              className="level-complete-btn level-complete-btn--primary"
              onClick={() => {
                gameOverRecordedRef.current = false
                setGameOver(false)
                setLives(1)
                setScore(0)
                ballsRef.current = [{ x: W / 2, y: H - 80, dx: BALL_SPEED, dy: -BALL_SPEED }]
                powerUpsRef.current = []
                paddleRef.current.x = W / 2 - PADDLE_W / 2
                initBricks(level)
                setRestartKey(k => k + 1)
                setTimeout(() => setBallLaunched(false), 0)
              }}
            >
              Again
            </button>
            <button type="button" className="level-complete-btn secondary" onClick={onBack}>
              Menu
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (levelComplete) {
    return (
      <div className="game-container game-level-complete">
        <div className="level-complete-card">
          <h2 className="level-complete-title">Level complete</h2>
          <p className="level-complete-score">Score: {score}</p>
          <div className="level-complete-actions">
            <button
              type="button"
              className="level-complete-btn level-complete-btn--primary"
              onClick={() => {
                recordArkanoidProgress(score, level, address ?? undefined)
                levelCompleteShownRef.current = false
                setLevelComplete(false)
                setLevel(l => Math.min(l + 1, MAX_LEVEL))
                setScore(s => s + 100)
                setLives(1)
                setElapsed(0)
                firstHeartDroppedRef.current = false
                gameStartRef.current = 0
                elapsedRef.current = 0
                lastElapsedSecRef.current = -1
                ballsRef.current = [{ x: W / 2, y: H - 80, dx: BALL_SPEED, dy: -BALL_SPEED }]
                powerUpsRef.current = []
                setRestartKey(k => k + 1)
                setTimeout(() => setBallLaunched(false), 0)
              }}
            >
              Next level
            </button>
            <button
              type="button"
              className="level-complete-btn secondary"
              onClick={() => {
                recordArkanoidGameEnd(score, level, { address: address ?? undefined, nickname })
                onBack()
              }}
            >
              Menu
            </button>
            <button
              type="button"
              className="level-complete-btn secondary"
              onClick={() => {
                levelCompleteShownRef.current = false
                setLevelComplete(false)
                initBricks(level)
                ballsRef.current = [{ x: W / 2, y: H - 80, dx: BALL_SPEED, dy: -BALL_SPEED }]
                setRestartKey(k => k + 1)
                setTimeout(() => setBallLaunched(false), 0)
              }}
            >
              Play again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="game-container game-fullscreen" tabIndex={0}>
      <button className="back secondary" onClick={onBack}>← Back</button>
      <div className="game-ui">
        <span>Lives: {lives}</span>
        <span>Score: {score}</span>
        <span>Lvl: {level}</span>
      </div>
      <div
        className="game-canvas-wrap"
        onClick={launchBall}
        onTouchEnd={(e) => { if (!ballLaunched) { e.preventDefault(); launchBall() } }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (!ballLaunched && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); launchBall() } }}
        aria-label={ballLaunched ? undefined : 'Click or press space to launch ball'}
      >
        <canvas
          ref={canvasRef}
          className="game-canvas"
          style={{ width: W, height: H }}
          onClick={(e) => { e.stopPropagation(); launchBall() }}
          onTouchEnd={(e) => { if (!ballLaunched) { e.preventDefault(); launchBall() } }}
        />
      </div>
    </div>
  )
}
