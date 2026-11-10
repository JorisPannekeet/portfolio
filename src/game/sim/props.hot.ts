import {
  BEACON_RADIUS,
  GEM_PROP_CLEARANCE,
  MAX_PROPS,
  PLAYER_RADIUS,
  POI_LAIR,
  PROPS_PER_SLOT,
  PROP_BEACON_GAP,
  PROP_BORDER_MARGIN,
  PROP_EDGE_MARGIN,
  PROP_GRID_CELL,
  PROP_GRID_CELLS,
  PROP_GRID_DIM,
  PROP_LAIR_CLEARANCE,
  PROP_MIN_GAP,
  PROP_PLACE_ATTEMPTS,
  PROP_QUERY_PAD,
  PROP_RADIUS,
  PROP_SCAN_STEP,
  PROP_SLOTS_PER_ZONE,
  PROP_START_CLEARANCE,
  START_X,
  START_Y,
  WORLD_HALF,
  ZONE_COUNT,
} from './content.ts'
import { rngInt } from './prng.hot.ts'
import type { State } from './state.ts'
import { clampToWorld } from './world.hot.ts'

let resolvedX = 0
let resolvedY = 0

function farEnough(dx: number, dy: number, reach: number): boolean {
  return dx * dx + dy * dy >= reach * reach
}

function propFits(s: State, x: number, y: number, radius: number): boolean {
  if (!farEnough(x - START_X, y - START_Y, PROP_START_CLEARANCE + radius)) return false
  for (let i = 0; i < s.poiCount; i++) {
    const clearance = s.poiKind[i] === POI_LAIR ? PROP_LAIR_CLEARANCE : PROP_BEACON_GAP + BEACON_RADIUS
    if (!farEnough(x - s.poiX[i]!, y - s.poiY[i]!, clearance + radius)) return false
  }
  for (let k = 0; k < s.propCount; k++) {
    if (!farEnough(x - s.propX[k]!, y - s.propY[k]!, radius + PROP_RADIUS[s.propKind[k]!]! + PROP_MIN_GAP)) return false
  }
  return true
}

function addProp(s: State, kind: number, x: number, y: number): void {
  const k = s.propCount++
  s.propKind[k] = kind
  s.propX[k] = x
  s.propY[k] = y
}

function scanForSpot(s: State, kind: number, signX: number, signY: number, low: number, high: number): void {
  const radius = PROP_RADIUS[kind]!
  for (let v = low; v <= high; v += PROP_SCAN_STEP) {
    for (let u = low; u <= high; u += PROP_SCAN_STEP) {
      if (!propFits(s, signX * u, signY * v, radius)) continue
      addProp(s, kind, signX * u, signY * v)
      return
    }
  }
}

function placeProp(s: State, zone: number, kind: number): void {
  if (s.propCount >= MAX_PROPS) return
  const radius = PROP_RADIUS[kind]!
  const signX = (zone & 1) !== 0 ? 1 : -1
  const signY = (zone & 2) !== 0 ? 1 : -1
  const low = PROP_BORDER_MARGIN + radius
  const high = WORLD_HALF - PROP_EDGE_MARGIN - radius
  for (let attempt = 0; attempt < PROP_PLACE_ATTEMPTS; attempt++) {
    const x = signX * (low + rngInt(s, high - low + 1))
    const y = signY * (low + rngInt(s, high - low + 1))
    if (!propFits(s, x, y, radius)) continue
    addProp(s, kind, x, y)
    return
  }
  scanForSpot(s, kind, signX, signY, low, high)
}

function cellCoord(v: number): number {
  const c = Math.floor((v + WORLD_HALF) / PROP_GRID_CELL)
  return c < 0 ? 0 : c >= PROP_GRID_DIM ? PROP_GRID_DIM - 1 : c
}

function propTouchesCell(s: State, k: number, cx: number, cy: number): boolean {
  const reach = PROP_RADIUS[s.propKind[k]!]! + PROP_QUERY_PAD
  const left = cx * PROP_GRID_CELL - WORLD_HALF
  const top = cy * PROP_GRID_CELL - WORLD_HALF
  const x = s.propX[k]!
  const y = s.propY[k]!
  const nearX = x < left ? left : x > left + PROP_GRID_CELL ? left + PROP_GRID_CELL : x
  const nearY = y < top ? top : y > top + PROP_GRID_CELL ? top + PROP_GRID_CELL : y
  return !farEnough(x - nearX, y - nearY, reach)
}

function forEachPropCell(s: State, k: number, fill: boolean): void {
  const reach = PROP_RADIUS[s.propKind[k]!]! + PROP_QUERY_PAD
  const x = s.propX[k]!
  const y = s.propY[k]!
  const cx1 = cellCoord(x + reach)
  const cy1 = cellCoord(y + reach)
  const start = s.propCellStart
  for (let cy = cellCoord(y - reach); cy <= cy1; cy++) {
    for (let cx = cellCoord(x - reach); cx <= cx1; cx++) {
      if (!propTouchesCell(s, k, cx, cy)) continue
      const cell = cy * PROP_GRID_DIM + cx
      if (fill) s.propCellItems[start[cell]!++] = k
      else start[cell + 1]!++
    }
  }
}

export function buildPropGrid(s: State): void {
  const start = s.propCellStart
  start.fill(0)
  for (let k = 0; k < s.propCount; k++) forEachPropCell(s, k, false)
  for (let c = 0; c < PROP_GRID_CELLS; c++) start[c + 1]! += start[c]!
  for (let k = 0; k < s.propCount; k++) forEachPropCell(s, k, true)
  for (let c = PROP_GRID_CELLS; c > 0; c--) start[c] = start[c - 1]!
  start[0] = 0
}

export function placeProps(s: State): void {
  s.propCount = 0
  for (let slot = 0; slot < PROP_SLOTS_PER_ZONE; slot++) {
    for (let zone = 0; zone < ZONE_COUNT; zone++) {
      const kind = zone * PROP_SLOTS_PER_ZONE + slot
      for (let n = 0; n < PROPS_PER_SLOT[slot]!; n++) placeProp(s, zone, kind)
    }
  }
  buildPropGrid(s)
}

export function propCellOf(x: number, y: number): number {
  return cellCoord(y) * PROP_GRID_DIM + cellCoord(x)
}

function resolveCircle(s: State, x: number, y: number, radius: number, towardX: number, towardY: number, nudge: number): boolean {
  const cell = propCellOf(x, y)
  const end = s.propCellStart[cell + 1]!
  for (let n = s.propCellStart[cell]!; n < end; n++) {
    const k = s.propCellItems[n]!
    const cx = s.propX[k]!
    const cy = s.propY[k]!
    const dx = x - cx
    const dy = y - cy
    const reach = radius + PROP_RADIUS[s.propKind[k]!]!
    const d2 = dx * dx + dy * dy
    if (d2 >= reach * reach) continue
    let nx = 1
    let ny = 0
    if (d2 > 1e-8) {
      const d = Math.sqrt(d2)
      nx = dx / d
      ny = dy / d
    }
    resolvedX = cx + nx * reach
    resolvedY = cy + ny * reach
    if (nudge > 0) {
      const side = towardY * nx - towardX * ny < 0 ? -1 : 1
      resolvedX -= ny * side * nudge
      resolvedY += nx * side * nudge
    }
    return true
  }
  return false
}

export function pushPlayerOutOfProps(s: State): void {
  if (!resolveCircle(s, s.px, s.py, PLAYER_RADIUS, 0, 0, 0)) return
  s.px = clampToWorld(resolvedX)
  s.py = clampToWorld(resolvedY)
}

export function pushHostileOutOfProps(s: State, e: number, radius: number, towardX: number, towardY: number, nudge: number): boolean {
  if (!resolveCircle(s, s.ex[e]!, s.ey[e]!, radius, towardX, towardY, nudge)) return false
  s.ex[e] = resolvedX
  s.ey[e] = resolvedY
  return true
}

export function pushGemOutOfProps(s: State, g: number): void {
  if (!resolveCircle(s, s.gx[g]!, s.gy[g]!, GEM_PROP_CLEARANCE, 0, 0, 0)) return
  s.gx[g] = clampToWorld(resolvedX)
  s.gy[g] = clampToWorld(resolvedY)
}
