import { useCallback, useEffect, useRef, useState } from 'react'
import { useWindowSize, useCanvasMouse } from '../hooks/useFullscreenCanvas'

const PLAYER_W = 28
const PLAYER_H = 22
const ENEMY_W = 24
const ENEMY_H = 18
const BULLET_H = 10
const LIVES = 3

export default function SpaceShooter({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w: W, h: H } = useWindowSize()
  const mouseXRef = useCanvasMouse(canvasRef, !false)
  const [lives, setLives] = useState(LIVES)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const playerRef = useRef({ x: W / 2 - PLAYER_W / 2, y: H - 50 })
  const bulletsRef = useRef<{ x: number; y: number }[]>([])
  const enemiesRef = useRef<{ x: number; y: number; shootAt: number }[]>([])
  const enemyBulletsRef = useRef<{ x: number; y: number }[]>([])
  const lastEnemyRef = useRef(0)
  const lastShotRef = useRef(0)
  const keysRef = useRef<Record<string, boolean>>({})
  const firePressedRef = useRef(false)

  useEffect(() => {
    playerRef.current.y = H - 50
    playerRef.current.x = Math.max(0, Math.min(W - PLAYER_W, W / 2 - PLAYER_W / 2))
  }, [W, H])

  const spawnEnemy = useCallback(() => {
    const x = 20 + Math.random() * (W - 40 - ENEMY_W)
    enemiesRef.current.push({ x, y: 20, shootAt: Date.now() + 600 + Math.random() * 900 })
  }, [W])

  useEffect(() => {
    if (gameOver || W < 100 || H < 100) return
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!
    let raf: number

    const loop = () => {
      const now = Date.now()
      const player = playerRef.current
      const mouseX = mouseXRef.current || W / 2
      player.x = Math.max(0, Math.min(W - PLAYER_W, mouseX - PLAYER_W / 2))
      if ((keysRef.current[' '] || firePressedRef.current) && now - lastShotRef.current > 300) {
        lastShotRef.current = now
        bulletsRef.current.push({ x: player.x + PLAYER_W / 2 - 2, y: player.y })
      }

      bulletsRef.current = bulletsRef.current.filter(b => {
        b.y -= 12
        return b.y > -BULLET_H
      })

      enemyBulletsRef.current = enemyBulletsRef.current.filter(b => {
        b.y += 6
        if (b.y > player.y && b.y < player.y + PLAYER_H && b.x > player.x && b.x < player.x + PLAYER_W) {
          setLives(l => {
            if (l <= 1) setGameOver(true)
            return l - 1
          })
          return false
        }
        return b.y < H
      })

      if (now - lastEnemyRef.current > 2400) {
        spawnEnemy()
        lastEnemyRef.current = now
      }
      enemiesRef.current.forEach(e => {
        if (now >= e.shootAt) {
          enemyBulletsRef.current.push({ x: e.x + ENEMY_W / 2 - 2, y: e.y + ENEMY_H })
          e.shootAt = now + 500 + Math.random() * 800
        }
      })

      enemiesRef.current = enemiesRef.current.filter(e => {
        e.y += 0.2
        const hit = bulletsRef.current.find(b => b.x >= e.x && b.x <= e.x + ENEMY_W && b.y >= e.y && b.y <= e.y + ENEMY_H)
        if (hit) {
          bulletsRef.current = bulletsRef.current.filter(x => x !== hit)
          setScore(s => s + 50)
          return false
        }
        if (e.y + ENEMY_H > player.y) {
          setLives(l => { if (l <= 1) setGameOver(true); return l - 1 })
          return false
        }
        return e.y < H
      })

      ctx.fillStyle = '#0a0a12'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#00d4aa'
      ctx.fillRect(player.x, player.y, PLAYER_W, PLAYER_H)
      ctx.fillStyle = '#fff'
      bulletsRef.current.forEach(b => ctx.fillRect(b.x, b.y, 4, BULLET_H))
      ctx.fillStyle = '#ff4757'
      enemiesRef.current.forEach(e => ctx.fillRect(e.x, e.y, ENEMY_W, ENEMY_H))
      enemyBulletsRef.current.forEach(b => { ctx.fillStyle = '#ffd93d'; ctx.fillRect(b.x, b.y, 4, 8) })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [gameOver, spawnEnemy, W, H, mouseXRef])

  useEffect(() => {
    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (['ArrowLeft','ArrowRight',' '].includes(e.key)) { e.preventDefault(); keysRef.current[e.key] = down }
    }
    const d = (e: KeyboardEvent) => onKey(e, true)
    const u = (e: KeyboardEvent) => onKey(e, false)
    window.addEventListener('keydown', d)
    window.addEventListener('keyup', u)
    return () => { window.removeEventListener('keydown', d); window.removeEventListener('keyup', u) }
  }, [])

  if (gameOver) {
    return (
      <div className="game-container">
        <button className="back secondary" onClick={onBack}>← Back</button>
        <p style={{ color: 'var(--danger)', fontSize: '1.2rem' }}>Game Over</p>
        <p>Score: {score}</p>
        <button onClick={() => window.location.reload()}>Play again</button>
      </div>
    )
  }

  return (
    <div className="game-container game-fullscreen" tabIndex={0}>
      <button className="back secondary" onClick={onBack}>← Back</button>
      <div className="game-ui">
        <span>Lives: {lives}</span>
        <span>Score: {score}</span>
      </div>
      <div
        className="game-canvas-wrap"
        onPointerDown={(e) => { e.preventDefault(); firePressedRef.current = true }}
        onPointerUp={() => { firePressedRef.current = false }}
        onPointerLeave={() => { firePressedRef.current = false }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <canvas ref={canvasRef} className="game-canvas" style={{ width: W, height: H }} />
      </div>
    </div>
  )
}
