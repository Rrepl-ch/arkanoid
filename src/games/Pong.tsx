import { useEffect, useRef, useState } from 'react'
import { useWindowSize, useCanvasMouse } from '../hooks/useFullscreenCanvas'

const PADDLE_H = 12
const BALL_R = 8

export default function Pong({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { w: W, h: H } = useWindowSize()
  const mouseXRef = useCanvasMouse(canvasRef, true)
  const PADDLE_W = Math.min(100, Math.floor(W * 0.25))
  const [playerScore, setPlayerScore] = useState(0)
  const [aiScore, setAiScore] = useState(0)
  const playerRef = useRef({ x: W / 2 - PADDLE_W / 2, y: H - 35 })
  const aiRef = useRef({ x: W / 2 - PADDLE_W / 2, y: 25 })
  const ballRef = useRef({ x: W / 2, y: H / 2, dx: 6, dy: -6 })

  useEffect(() => {
    if (W < 100 || H < 100) return
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!
    let raf: number

    const loop = () => {
      const player = playerRef.current
      const ai = aiRef.current
      const ball = ballRef.current
      const mx = mouseXRef.current ?? W / 2
      player.x = Math.max(0, Math.min(W - PADDLE_W, mx - PADDLE_W / 2))

      ai.x += (ball.x - (ai.x + PADDLE_W / 2)) * 0.06
      ai.x = Math.max(0, Math.min(W - PADDLE_W, ai.x))

      ball.x += ball.dx
      ball.y += ball.dy
      if (ball.x <= BALL_R || ball.x >= W - BALL_R) ball.dx *= -1
      if (ball.y <= BALL_R) {
        if (ball.x >= ai.x && ball.x <= ai.x + PADDLE_W) ball.dy *= -1
        else { setPlayerScore(s => s + 1); ball.x = W / 2; ball.y = H / 2; ball.dx = 6; ball.dy = -6 }
      }
      if (ball.y >= H - BALL_R) {
        if (ball.x >= player.x && ball.x <= player.x + PADDLE_W) ball.dy *= -1
        else { setAiScore(s => s + 1); ball.x = W / 2; ball.y = H / 2; ball.dx = 6; ball.dy = 6 }
      }

      ctx.fillStyle = '#0a0a12'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#00d4aa'
      ctx.fillRect(player.x, player.y, PADDLE_W, PADDLE_H)
      ctx.fillRect(ai.x, ai.y, PADDLE_W, PADDLE_H)
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2)
      ctx.fill()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [W, H, PADDLE_W, mouseXRef])

  return (
    <div className="game-container game-fullscreen" tabIndex={0}>
      <button className="back secondary" onClick={onBack}>← Назад</button>
      <div className="game-ui">
        <span>Вы: {playerScore}</span>
        <span>Соперник: {aiScore}</span>
      </div>
      <div className="game-canvas-wrap">
        <canvas ref={canvasRef} className="game-canvas" style={{ width: W, height: H }} />
      </div>
      <p className="hint">Мышь — двигать платформу</p>
    </div>
  )
}
