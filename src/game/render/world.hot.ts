import type { State } from '../sim/state.ts'
import { BEACON_RADIUS, LAIR_RADIUS, POI_BEACON, WORLD_HALF } from '../sim/content.ts'
import { zoneAt } from '../sim/world.hot.ts'
import type { View } from './view.ts'
import {
  BEACON_ANCHOR_X,
  BEACON_ANCHOR_Y,
  BOUNDS_HAZARD_H,
  BOUNDS_HAZARD_V,
  BOUNDS_SEAM_H,
  BOUNDS_SEAM_V,
  BOUNDS_WALL,
  FLOOR_DECAL_COUNT,
  FLOOR_DECAL_FIRST,
  FLOOR_PLATE,
  FLOOR_PLATE_WORN,
  FLOOR_ZONE_STRIDE,
  POI_FRAME_BEACON,
  POI_FRAME_BEACON_PULSE,
  POI_FRAME_BEACON_SPENT,
  POI_FRAME_LAIR,
  POI_FRAME_LAIR_OPEN,
  SPR_BOUNDS,
  SPR_FLOOR,
  SPR_POI,
} from './sheet.ts'
import { blitAt, blitCentered, frameId } from './sprite.hot.ts'
import { CORE, CYAN, CYAN_DEEP } from './colors.ts'

const TILE = 32
const TAU = Math.PI * 2
const EDGE = 6
const SEAM_HALF = 2
const WORLD_TILES = WORLD_HALF / TILE

function hashTile(x: number, y: number): number {
  let h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1)
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  return (h ^ (h >>> 16)) >>> 0
}

function insideTile(t: number): boolean {
  return t >= -WORLD_TILES && t < WORLD_TILES
}

export function drawFloor(v: View): void {
  const ox = v.originX
  const oy = v.originY
  const tx0 = Math.floor(ox / TILE)
  const ty0 = Math.floor(oy / TILE)
  const tx1 = Math.floor((ox + v.width) / TILE)
  const ty1 = Math.floor((oy + v.height) / TILE)
  const wall = frameId(v, SPR_BOUNDS, BOUNDS_WALL, 0)
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const x = tx * TILE - ox
      const y = ty * TILE - oy
      if (!insideTile(tx) || !insideTile(ty)) {
        blitAt(v, wall, x, y, 1)
        continue
      }
      const base = zoneAt(tx * TILE, ty * TILE) * FLOOR_ZONE_STRIDE
      const h = hashTile(tx, ty)
      blitAt(v, frameId(v, SPR_FLOOR, base + ((h & 7) === 0 ? FLOOR_PLATE_WORN : FLOOR_PLATE), 0), x, y, 1)
      if ((h >>> 3) % 7 !== 0) continue
      const decal = frameId(v, SPR_FLOOR, base + FLOOR_DECAL_FIRST + ((h >>> 6) % FLOOR_DECAL_COUNT), 0)
      const room = TILE - 4 - v.atlas.rw[decal]!
      const roomY = TILE - 4 - v.atlas.rh[decal]!
      blitAt(v, decal, x + 2 + ((h >>> 9) % (room + 1)), y + 2 + ((h >>> 14) % (roomY + 1)), 1)
    }
  }
  drawBounds(v, tx0, ty0, tx1, ty1)
}

function drawBounds(v: View, tx0: number, ty0: number, tx1: number, ty1: number): void {
  const ox = v.originX
  const oy = v.originY
  const seamV = frameId(v, SPR_BOUNDS, BOUNDS_SEAM_V, 0)
  const seamH = frameId(v, SPR_BOUNDS, BOUNDS_SEAM_H, 0)
  const hazardV = frameId(v, SPR_BOUNDS, BOUNDS_HAZARD_V, 0)
  const hazardH = frameId(v, SPR_BOUNDS, BOUNDS_HAZARD_H, 0)
  const ya = ty0 < -WORLD_TILES ? -WORLD_TILES : ty0
  const yb = ty1 >= WORLD_TILES ? WORLD_TILES - 1 : ty1
  const xa = tx0 < -WORLD_TILES ? -WORLD_TILES : tx0
  const xb = tx1 >= WORLD_TILES ? WORLD_TILES - 1 : tx1
  for (let ty = ya; ty <= yb; ty++) {
    const y = ty * TILE - oy
    blitAt(v, seamV, -SEAM_HALF - ox, y, 1)
    blitAt(v, hazardV, -WORLD_HALF - EDGE - ox, y, 1)
    blitAt(v, hazardV, WORLD_HALF - ox, y, 1)
  }
  for (let tx = xa; tx <= xb; tx++) {
    const x = tx * TILE - ox
    blitAt(v, seamH, x, -SEAM_HALF - oy, 1)
    blitAt(v, hazardH, x, -WORLD_HALF - EDGE - oy, 1)
    blitAt(v, hazardH, x, WORLD_HALF - oy, 1)
  }
  const ctx = v.ctx
  ctx.fillStyle = CORE
  ctx.fillRect(-WORLD_HALF - EDGE - ox, -WORLD_HALF - EDGE - oy, EDGE, EDGE)
  ctx.fillRect(WORLD_HALF - ox, -WORLD_HALF - EDGE - oy, EDGE, EDGE)
  ctx.fillRect(-WORLD_HALF - EDGE - ox, WORLD_HALF - oy, EDGE, EDGE)
  ctx.fillRect(WORLD_HALF - ox, WORLD_HALF - oy, EDGE, EDGE)
}

function ring(v: View, x: number, y: number, radius: number, from: number, to: number, color: string, width: number, alpha: number): void {
  const ctx = v.ctx
  ctx.globalAlpha = alpha
  ctx.beginPath()
  ctx.arc(x, y, radius, from, to)
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.stroke()
}

export function drawPois(v: View, s: State, t: number, playerX: number, playerY: number): void {
  const ctx = v.ctx
  const ox = v.originX
  const oy = v.originY
  const blink = ((t / 6) | 0) & 1
  for (let i = 0; i < s.poiCount; i++) {
    const x = Math.round(s.poiX[i]! - ox)
    const y = Math.round(s.poiY[i]! - oy)
    const reach = s.poiKind[i] === POI_BEACON ? BEACON_RADIUS + 24 : LAIR_RADIUS + 2
    if (x < -reach || y < -reach || x > v.width + reach || y > v.height + reach) continue
    const done = s.poiDone[i]! > 0
    if (s.poiKind[i] === POI_BEACON) {
      if (done) {
        blitAt(v, frameId(v, SPR_POI, POI_FRAME_BEACON_SPENT, 0), x - BEACON_ANCHOR_X, y - BEACON_ANCHOR_Y, 1)
        continue
      }
      const dx = playerX - x
      const dy = playerY - y
      const capturing = dx * dx + dy * dy <= BEACON_RADIUS * BEACON_RADIUS
      const progress = s.poiProgress[i]!
      ctx.globalAlpha = capturing ? 0.16 : 0.07
      ctx.fillStyle = CYAN
      ctx.beginPath()
      ctx.arc(x, y, BEACON_RADIUS, 0, TAU)
      ctx.fill()
      ring(v, x, y, BEACON_RADIUS, 0, TAU, CYAN_DEEP, 1, capturing ? 1 : 0.7)
      if (progress > 0) {
        ring(v, x, y, BEACON_RADIUS - 2, -Math.PI / 2, -Math.PI / 2 + TAU * (progress > 1 ? 1 : progress), CYAN, 3, capturing && blink === 0 ? 1 : 0.65)
      }
      ctx.globalAlpha = 1
      const pulse = capturing ? blink === 0 : (((t / 24) | 0) & 1) === 0
      blitAt(v, frameId(v, SPR_POI, pulse ? POI_FRAME_BEACON_PULSE : POI_FRAME_BEACON, 0), x - BEACON_ANCHOR_X, y - BEACON_ANCHOR_Y, 1)
    } else if (done) {
      blitCentered(v, frameId(v, SPR_POI, POI_FRAME_LAIR_OPEN, 0), x, y)
    } else {
      ring(v, x, y, LAIR_RADIUS, 0, TAU, CORE, 1, (((t / 20) | 0) & 1) === 0 ? 0.35 : 0.2)
      ctx.globalAlpha = 1
      blitCentered(v, frameId(v, SPR_POI, POI_FRAME_LAIR, 0), x, y)
    }
  }
  ctx.globalAlpha = 1
}
