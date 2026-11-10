import type { State } from '../sim/state.ts'
import { ENEMY_BOSS_FIRST, POI_BEACON, POI_LAIR, START_X, START_Y, WORLD_HALF, ZONE_COUNT } from '../sim/content.ts'
import type { View } from './view.ts'
import { GLYPH_DARK, GLYPH_LIGHT, GLYPH_RED, ROTATIONS } from './atlas.ts'
import { ARROW_CYAN, ARROW_RED, HUD_MARK_SKULL_PIP, HUD_MARK_SKULL_RED, SPR_ARROWS, SPR_HUD_MARKS } from './sheet.ts'
import { blitAt, blitCentered, drawNumber, frameId, numberWidth } from './sprite.hot.ts'
import { ARMOR, ARMOR_SHADE, CORE, CYAN, INK, PALE, STEEL, ZONE_MAP_COLOR } from './colors.ts'

const TAU = Math.PI * 2
const MAP_SIZE = 44
const MAP_SIZE_SMALL = 36
const ARROW_INSET = 9
const MAP_CLEARANCE = 8
const LABEL_OFFSET = 14
const DISTANCE_UNIT = 10
const SKULL_W = 5
const HUB_PIP = 3

function mapX(wx: number, left: number, size: number): number {
  const cell = Math.floor(((wx + WORLD_HALF) * size) / (2 * WORLD_HALF))
  return left + (cell < 0 ? 0 : cell >= size ? size - 1 : cell)
}

function pip(v: View, x: number, y: number, n: number, color: string): void {
  v.ctx.fillStyle = color
  v.ctx.fillRect(x - (n >> 1), y - (n >> 1), n, n)
}

function drawMinimap(v: View, s: State, t: number): void {
  const ctx = v.ctx
  const size = v.scale === 1 ? MAP_SIZE_SMALL : MAP_SIZE
  const half = size >> 1
  const top = (v.clearRight > v.hudTop ? v.clearRight : v.hudTop) + 2
  const left = v.width - size - 3
  v.mapLeft = left - 1
  v.mapBottom = top + size + 1
  ctx.globalAlpha = 1
  ctx.fillStyle = STEEL
  ctx.fillRect(left - 1, top - 1, size + 2, size + 2)
  ctx.globalAlpha = 0.9
  for (let z = 0; z < ZONE_COUNT; z++) {
    ctx.fillStyle = ZONE_MAP_COLOR[z]!
    ctx.fillRect(left + (z & 1) * half, top + (z >> 1) * half, half, half)
  }
  ctx.globalAlpha = 1
  ctx.fillStyle = INK
  ctx.fillRect(left + half, top, 1, size)
  ctx.fillRect(left, top + half, size, 1)
  const hubX = mapX(START_X, left, size)
  const hubY = mapX(START_Y, top, size)
  pip(v, hubX, hubY, HUB_PIP + 2, INK)
  pip(v, hubX, hubY, HUB_PIP, STEEL)
  for (let i = 0; i < s.poiCount; i++) {
    if (s.poiDone[i]! > 0) continue
    const x = mapX(s.poiX[i]!, left, size)
    const y = mapX(s.poiY[i]!, top, size)
    if (s.poiKind[i] === POI_BEACON) pip(v, x, y, 2, CYAN)
    else blitCentered(v, frameId(v, SPR_HUD_MARKS, HUD_MARK_SKULL_PIP, 0), x, y)
  }
  const bossOn = ((t / 8) | 0) & 1
  for (let i = 0; i < s.enemyCount; i++) {
    if (s.eType[i]! < ENEMY_BOSS_FIRST) continue
    pip(v, mapX(s.ex[i]!, left, size), mapX(s.ey[i]!, top, size), 3, bossOn === 0 ? CORE : PALE)
  }
  const px = mapX(s.px, left, size)
  const py = mapX(s.py, top, size)
  pip(v, px, py, 3, INK)
  pip(v, px, py, 2, (((t / 16) | 0) & 1) === 0 ? ARMOR : ARMOR_SHADE)
}

function drawArrow(v: View, s: State, wx: number, wy: number, red: boolean, playerX: number, playerY: number): void {
  const tx = wx - v.originX
  const ty = wy - v.originY
  if (tx >= 0 && ty >= 0 && tx < v.width && ty < v.height) return
  const dx = tx - playerX
  const dy = ty - playerY
  const left = ARROW_INSET
  const right = v.width - ARROW_INSET
  const top = v.hudTop + ARROW_INSET
  const bottom = v.hudBottom - ARROW_INSET
  let k = 1e9
  if (dx > 0) k = Math.min(k, (right - playerX) / dx)
  if (dx < 0) k = Math.min(k, (left - playerX) / dx)
  if (dy > 0) k = Math.min(k, (bottom - playerY) / dy)
  if (dy < 0) k = Math.min(k, (top - playerY) / dy)
  if (k <= 0 || k >= 1e9) return
  const ax = Math.round(playerX + dx * k)
  let ay = Math.round(playerY + dy * k)
  if (ax > v.mapLeft - MAP_CLEARANCE && ay < v.mapBottom + MAP_CLEARANCE) ay = v.mapBottom + MAP_CLEARANCE
  const heading = Math.round((Math.atan2(dy, dx) * ROTATIONS) / TAU) & (ROTATIONS - 1)
  blitCentered(v, frameId(v, SPR_ARROWS, red ? ARROW_RED : ARROW_CYAN, heading), ax, ay)
  const length = Math.hypot(dx, dy)
  const distance = Math.round(Math.hypot(wx - s.px, wy - s.py) / DISTANCE_UNIT)
  const width = numberWidth(distance, 1, 1) + (red ? SKULL_W + 1 : 0)
  let lx = Math.round(ax - (dx / length) * LABEL_OFFSET) - (width >> 1)
  let ly = Math.round(ay - (dy / length) * LABEL_OFFSET) - 2
  if (lx < 2) lx = 2
  if (lx > v.width - width - 2) lx = v.width - width - 2
  if (ly < v.hudTop + 2) ly = v.hudTop + 2
  if (ly > v.hudBottom - 7) ly = v.hudBottom - 7
  let cursor = lx
  if (red) {
    blitAt(v, frameId(v, SPR_HUD_MARKS, HUD_MARK_SKULL_RED, 0), cursor, ly, 1)
    cursor += SKULL_W + 1
  }
  drawNumber(v, distance, 1, GLYPH_DARK, cursor + 1, ly + 1, 1)
  drawNumber(v, distance, 1, red ? GLYPH_RED : GLYPH_LIGHT, cursor, ly, 1)
}

function drawArrows(v: View, s: State, playerX: number, playerY: number): void {
  let first = -1
  let second = -1
  let firstD = 0
  let secondD = 0
  let lair = -1
  let lairD = 0
  for (let i = 0; i < s.poiCount; i++) {
    if (s.poiDone[i]! > 0) continue
    const dx = s.poiX[i]! - s.px
    const dy = s.poiY[i]! - s.py
    const d = dx * dx + dy * dy
    if (s.poiKind[i] === POI_LAIR) {
      if (lair < 0 || d < lairD) {
        lair = i
        lairD = d
      }
    } else if (first < 0 || d < firstD) {
      second = first
      secondD = firstD
      first = i
      firstD = d
    } else if (second < 0 || d < secondD) {
      second = i
      secondD = d
    }
  }
  if (first >= 0) drawArrow(v, s, s.poiX[first]!, s.poiY[first]!, false, playerX, playerY)
  if (second >= 0) drawArrow(v, s, s.poiX[second]!, s.poiY[second]!, false, playerX, playerY)
  if (lair >= 0) drawArrow(v, s, s.poiX[lair]!, s.poiY[lair]!, true, playerX, playerY)
  for (let i = 0; i < s.enemyCount; i++) {
    if (s.eType[i]! >= ENEMY_BOSS_FIRST) drawArrow(v, s, s.ex[i]!, s.ey[i]!, true, playerX, playerY)
  }
}

export function drawNavigation(v: View, s: State, t: number, playerX: number, playerY: number): void {
  drawMinimap(v, s, t)
  drawArrows(v, s, playerX, playerY)
  v.ctx.globalAlpha = 1
}
