/**
 * Паттерны уровней в стиле ретро Arkanoid/Breakout.
 * Сетка 8 колонок, число рядов по уровню. -1 = пусто, 0–5 = индекс цвета.
 */
const COLS = 8
const COLOR = (r: number, c: number) => (r * COLS + c) % 6

function fullRows(rows: number): number[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => COLOR(r, c))
  )
}

/** Пирамида: узко сверху (1–2 кирпича), широко снизу */
function pyramid(rows: number): number[][] {
  const grid: number[][] = []
  for (let r = 0; r < rows; r++) {
    const count = Math.min(COLS, 2 + 2 * r)
    const start = Math.floor((COLS - count) / 2)
    const row = Array(COLS).fill(-1)
    for (let c = 0; c < count; c++) row[start + c] = COLOR(r, start + c)
    grid.push(row)
  }
  return grid
}

/** Две башни по краям */
function twoTowers(rows: number): number[][] {
  return Array.from({ length: rows }, (_, r) => {
    const row = Array(COLS).fill(-1)
    row[0] = COLOR(r, 0)
    row[1] = COLOR(r, 1)
    row[6] = COLOR(r, 6)
    row[7] = COLOR(r, 7)
    return row
  })
}

/** Шеврон (перевёрнутая V): узко сверху, широко снизу */
function chevron(rows: number): number[][] {
  const grid: number[][] = []
  for (let r = 0; r < rows; r++) {
    const count = Math.min(COLS, 1 + 2 * r)
    const start = Math.floor((COLS - count) / 2)
    const row = Array(COLS).fill(-1)
    for (let c = 0; c < count; c++) row[start + c] = COLOR(r, start + c)
    grid.push(row)
  }
  return grid
}

/** Овал / капсула */
function oval(rows: number): number[][] {
  const grid: number[][] = []
  const rMid = (rows - 1) / 2
  const cMid = (COLS - 1) / 2
  for (let r = 0; r < rows; r++) {
    const row = Array(COLS).fill(-1)
    const ry = (r - rMid) / (rMid || 1)
    const w = Math.sqrt(1 - ry * ry) * (COLS * 0.5)
    const cStart = Math.max(0, Math.floor(cMid - w))
    const cEnd = Math.min(COLS, Math.ceil(cMid + w))
    for (let c = cStart; c < cEnd; c++) row[c] = COLOR(r, c)
    grid.push(row)
  }
  return grid
}

/** Две горизонтальные полосы */
function bands(rows: number): number[][] {
  const grid: number[][] = []
  const bandH = Math.max(1, Math.floor(rows / 4))
  for (let r = 0; r < rows; r++) {
    const inTop = r < bandH
    const inBot = r >= rows - bandH
    const row = inTop || inBot ? Array(COLS).fill(inTop ? 0 : 1).map((_, c) => COLOR(r, c)) : Array(COLS).fill(-1)
    grid.push(row)
  }
  return grid
}

/** Шахматная доска */
function checkerboard(rows: number): number[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => ((r + c) % 2 === 0 ? COLOR(r, c) : -1))
  )
}

/** Лестница по диагонали */
function staircase(rows: number): number[][] {
  return Array.from({ length: rows }, (_, r) => {
    const row = Array(COLS).fill(-1)
    const count = Math.min(r + 1, COLS)
    for (let c = 0; c < count; c++) row[c] = COLOR(r, c)
    return row
  })
}

/** Рамка (квадрат с дыркой внутри) */
function frame(rows: number): number[][] {
  if (rows < 3) return fullRows(rows)
  const grid: number[][] = []
  for (let r = 0; r < rows; r++) {
    const row = Array(COLS).fill(-1)
    const isFirstOrLast = r === 0 || r === rows - 1
    for (let c = 0; c < COLS; c++) {
      const atEdge = c === 0 || c === COLS - 1
      if (isFirstOrLast || atEdge) row[c] = COLOR(r, c)
    }
    grid.push(row)
  }
  return grid
}

/** Арка: пусто в центре */
function arch(rows: number): number[][] {
  const grid: number[][] = []
  const centerStart = 2
  const centerEnd = COLS - 2
  for (let r = 0; r < rows; r++) {
    const row = Array(COLS).fill(-1)
    for (let c = 0; c < COLS; c++) {
      if (c < centerStart || c >= centerEnd) row[c] = COLOR(r, c)
      else if (r === 0) row[c] = COLOR(r, c)
    }
    grid.push(row)
  }
  return grid
}

/** Разбросанные блоки (детерминировано) */
function scattered(rows: number): number[][] {
  const grid: number[][] = []
  for (let r = 0; r < rows; r++) {
    const row = Array.from({ length: COLS }, (_, c) => {
      const s = (r * 7 + c * 11) % 10
      return s >= 4 ? COLOR(r, c) : -1
    })
    grid.push(row)
  }
  if (grid.flat().every((v) => v === -1)) grid[0][0] = 0
  return grid
}

/** Inverted U */
function invertedU(rows: number): number[][] {
  const grid: number[][] = []
  for (let r = 0; r < rows; r++) {
    const row = Array(COLS).fill(-1)
    if (r === 0) {
      for (let c = 0; c < COLS; c++) row[c] = COLOR(r, c)
    } else {
      row[0] = COLOR(r, 0)
      row[COLS - 1] = COLOR(r, COLS - 1)
    }
    grid.push(row)
  }
  return grid
}

/** Две строки с прорезями */
function rowsWithGaps(rows: number): number[][] {
  const grid: number[][] = []
  for (let r = 0; r < rows; r++) {
    const row = Array.from({ length: COLS }, (_, c) => (c === 2 || c === 5 ? -1 : COLOR(r, c)))
    grid.push(row)
  }
  return grid
}

const LEVEL_GENERATORS: ((rows: number) => number[][])[] = [
  () => fullRows(2),
  () => fullRows(3),
  pyramid,
  twoTowers,
  chevron,
  oval,
  bands,
  checkerboard,
  staircase,
  frame,
  arch,
  scattered,
  invertedU,
  rowsWithGaps,
  () => fullRows(5),
  () => twoTowers(6),
  () => checkerboard(7),
  () => oval(6),
  () => fullRows(7),
  (rows) => fullRows(rows),
]

export const MAX_LEVEL = LEVEL_GENERATORS.length

function clampRows(level: number): number {
  return Math.min(8, Math.max(2, 3 + Math.floor(level / 3)))
}

/**
 * Возвращает сетку уровня: rows x 8. -1 = пусто, 0–5 = цвет.
 */
export function getLevelPattern(level: number): number[][] {
  const oneBased = Math.max(1, Math.min(level, MAX_LEVEL))
  const rows = oneBased === MAX_LEVEL ? 13 : clampRows(oneBased)
  const gen = LEVEL_GENERATORS[oneBased - 1]
  const grid = gen(rows)
  if (grid.flat().every((v) => v === -1)) return fullRows(rows)
  return grid
}
