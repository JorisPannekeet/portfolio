import { ENEMY_MAX_RADIUS, ENEMY_RADIUS, GRID_CELL, GRID_CELLS, GRID_DIM } from './content.ts'
import type { State } from './state.ts'

const GRID_HALF = (GRID_CELL * GRID_DIM) / 2

function cellCoord(offset: number): number {
  const c = Math.floor(offset / GRID_CELL)
  return c < 0 ? 0 : c >= GRID_DIM ? GRID_DIM - 1 : c
}

export function gridBuild(s: State): void {
  const n = s.enemyCount
  const start = s.scratchCellStart
  const cursor = s.scratchCellCursor
  const items = s.scratchCellItems
  const cellOf = s.scratchCell
  const ex = s.ex
  const ey = s.ey
  const ox = s.px - GRID_HALF
  const oy = s.py - GRID_HALF
  s.gridOx = ox
  s.gridOy = oy
  start.fill(0)
  for (let i = 0; i < n; i++) {
    const c = cellCoord(ey[i]! - oy) * GRID_DIM + cellCoord(ex[i]! - ox)
    cellOf[i] = c
    start[c + 1]!++
  }
  for (let c = 0; c < GRID_CELLS; c++) {
    start[c + 1]! += start[c]!
    cursor[c] = start[c]!
  }
  for (let i = 0; i < n; i++) {
    const c = cellOf[i]!
    items[cursor[c]!] = i
    cursor[c]!++
  }
}

export function gridQuery(s: State, x: number, y: number, radius: number): number {
  const reach = radius + ENEMY_MAX_RADIUS
  const cx0 = cellCoord(x - reach - s.gridOx)
  const cx1 = cellCoord(x + reach - s.gridOx)
  const cy0 = cellCoord(y - reach - s.gridOy)
  const cy1 = cellCoord(y + reach - s.gridOy)
  const start = s.scratchCellStart
  const items = s.scratchCellItems
  const out = s.scratchQuery
  const ex = s.ex
  const ey = s.ey
  const eHp = s.eHp
  const eType = s.eType
  const n = s.enemyCount
  let found = 0
  for (let cy = cy0; cy <= cy1; cy++) {
    for (let cx = cx0; cx <= cx1; cx++) {
      const c = cy * GRID_DIM + cx
      const end = start[c + 1]!
      for (let k = start[c]!; k < end; k++) {
        const e = items[k]!
        if (e >= n || eHp[e]! <= 0) continue
        const dx = ex[e]! - x
        const dy = ey[e]! - y
        const r = radius + ENEMY_RADIUS[eType[e]!]!
        if (dx * dx + dy * dy <= r * r) out[found++] = e
      }
    }
  }
  return found
}

export function gridNearest(s: State, x: number, y: number, range: number, want: number): number {
  if (want < 1) return 0
  const found = gridQuery(s, x, y, range)
  const idx = s.scratchNearIdx
  const dist = s.scratchNearDist
  const out = s.scratchQuery
  const ex = s.ex
  const ey = s.ey
  let kept = 0
  for (let k = 0; k < found; k++) {
    const e = out[k]!
    const dx = ex[e]! - x
    const dy = ey[e]! - y
    const d2 = dx * dx + dy * dy
    if (kept === want && d2 >= dist[kept - 1]!) continue
    let j = kept < want ? kept++ : kept - 1
    while (j > 0 && dist[j - 1]! > d2) {
      dist[j] = dist[j - 1]!
      idx[j] = idx[j - 1]!
      j--
    }
    dist[j] = d2
    idx[j] = e
  }
  return kept
}
