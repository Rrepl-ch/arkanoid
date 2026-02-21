import { useCallback, useRef, useState } from 'react'
import './Minesweeper.css'

const ROWS = 16
const COLS = 16
const MINES = 40

function buildGrid(rows: number, cols: number, mines: number, safeR: number, safeC: number): number[][] {
  const g: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  const placed = new Set<string>()
  while (placed.size < mines) {
    const r = Math.floor(Math.random() * rows)
    const c = Math.floor(Math.random() * cols)
    if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue
    const key = `${r},${c}`
    if (!placed.has(key)) { placed.add(key); g[r][c] = -1 }
  }
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (g[r][c] !== -1) {
        let n = 0
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++)
            if (r + dr >= 0 && r + dr < rows && c + dc >= 0 && c + dc < cols && g[r + dr][c + dc] === -1) n++
        g[r][c] = n
      }
  return g
}

function floodReveal(grid: number[][], rows: number, cols: number, r: number, c: number): boolean[][] {
  const rev: boolean[][] = Array(rows).fill(null).map(() => Array(cols).fill(false))
  const open = (rr: number, cc: number) => {
    if (rr < 0 || rr >= rows || cc < 0 || cc >= cols || rev[rr][cc]) return
    rev[rr][cc] = true
    if (grid[rr][cc] === 0)
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) open(rr + dr, cc + dc)
  }
  open(r, c)
  return rev
}

export default function Minesweeper({ onBack }: { onBack: () => void }) {
  const rows = ROWS
  const cols = COLS
  const mines = MINES
  const [grid, setGrid] = useState<number[][]>([])
  const [revealed, setRevealed] = useState<boolean[][]>([])
  const [flagged, setFlagged] = useState<boolean[][]>([])
  const [started, setStarted] = useState(false)
  const [lost, setLost] = useState(false)
  const [won, setWon] = useState(false)

  const reveal = useCallback((r: number, c: number) => {
    if (lost || won) return
    if (!started) {
      const g = buildGrid(rows, cols, mines, r, c)
      setGrid(g)
      setRevealed(floodReveal(g, rows, cols, r, c))
      setFlagged(Array(rows).fill(null).map(() => Array(cols).fill(false)))
      setStarted(true)
      const totalSafe = rows * cols - mines
      if (totalSafe === 1) setWon(true)
      return
    }
    if (revealed[r][c] || flagged[r][c]) return
    setRevealed(prev => {
      const next = prev.map(row => [...row])
      const open = (rr: number, cc: number) => {
        if (rr < 0 || rr >= rows || cc < 0 || cc >= cols || next[rr][cc] || flagged[rr]?.[cc]) return
        next[rr][cc] = true
        if (grid[rr][cc] === -1) setLost(true)
        else if (grid[rr][cc] === 0)
          for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++) open(rr + dr, cc + dc)
      }
      open(r, c)
      const count = next.flat().filter(Boolean).length
      if (count >= rows * cols - mines) setWon(true)
      return next
    })
  }, [started, lost, won, rows, cols, mines, grid, revealed, flagged])

  const toggleFlag = useCallback((r: number, c: number) => {
    if (!started || revealed[r]?.[c]) return
    setFlagged(prev => prev.map((row, ri) => row.map((v, ci) => ri === r && ci === c ? !v : v)))
  }, [started, revealed])

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressHandledRef = useRef(false)
  const LONG_PRESS_MS = 500

  const handleCellPointerDown = useCallback((r: number, c: number) => {
    longPressHandledRef.current = false
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null
      longPressHandledRef.current = true
      toggleFlag(r, c)
    }, LONG_PRESS_MS)
  }, [toggleFlag])

  const handleCellPointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const handleCellClick = useCallback((r: number, c: number) => {
    if (longPressHandledRef.current) {
      longPressHandledRef.current = false
      return
    }
    reveal(r, c)
  }, [reveal])

  const baseCell = 28
  const maxWidth = typeof window !== 'undefined' ? Math.min(360, window.innerWidth - 32) : 360
  const gridGap = 2
  const cellSize = Math.min(baseCell, Math.floor((maxWidth - (cols - 1) * gridGap) / cols))
  const colors = ['', '#4d96ff','#2ed573','#ff4757','#1a0a2e','#8b0000','#00ced1','#000','#6b6b7a']

  if (!started) {
    return (
      <div className="game-container">
        <button className="back secondary" onClick={onBack}>← Back</button>
        <div className="minesweeper-menu">
          <h2 className="minesweeper-menu-title">Minesweeper</h2>
          <p className="minesweeper-hint">Tap a cell to start. Mines are placed randomly.</p>
          <div className="minesweeper-grid-wrap">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                gap: gridGap,
              }}
            >
              {Array(rows * cols).fill(0).map((_, i) => {
                const r = Math.floor(i / cols), c = i % cols
                return (
                  <div
                    key={i}
                    role="button"
                    tabIndex={0}
                    className="minesweeper-cell"
                    style={{ width: cellSize, height: cellSize, fontSize: Math.max(10, cellSize - 6) }}
                    onClick={() => reveal(r, c)}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    ·
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const gridStyle = {
    display: 'grid' as const,
    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
    gap: gridGap,
  }

  return (
    <div className="game-container">
      <button className="back secondary" onClick={onBack}>← Back</button>
      <div className="minesweeper-menu">
        {(lost || won) && (
          <p className="minesweeper-hint" style={{ color: lost ? 'var(--danger)' : 'var(--success)' }}>{lost ? 'Mine!' : 'You win!'}</p>
        )}
        <div className="minesweeper-grid-wrap">
          <div style={gridStyle}>
          {grid.flat().map((cell, i) => {
            const r = Math.floor(i / cols), c = i % cols
            const rev = revealed[r]?.[c]
            const fl = flagged[r]?.[c]
            return (
              <div
                key={i}
                onClick={() => !fl && handleCellClick(r, c)}
                onContextMenu={(e) => { e.preventDefault(); toggleFlag(r, c) }}
                onPointerDown={() => handleCellPointerDown(r, c)}
                onPointerUp={handleCellPointerUp}
                onPointerLeave={handleCellPointerUp}
                style={{
                  width: cellSize, height: cellSize, background: rev ? (cell === -1 ? '#ff4757' : '#12121a') : '#1a1a24',
                  border: '1px solid #2a2a32', borderRadius: 2, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.max(10, cellSize - 6),
                  color: colors[cell >= 0 ? cell : 0] || '#e8e8ed',
                }}
              >
                {rev ? (cell === -1 ? '💣' : cell > 0 ? cell : '') : fl ? '🚩' : ''}
              </div>
            )
          })}
          </div>
        </div>
        <p className="hint minesweeper-hint">Tap to reveal, long-press or right-click to flag</p>
      </div>
    </div>
  )
}
