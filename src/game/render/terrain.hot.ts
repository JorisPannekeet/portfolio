import { WORLD_HALF, ZONE_COUNT, ZONE_HANGAR } from '../sim/content.ts'
import type { View } from './view.ts'
import {
  BOUNDS_HAZARD_H,
  BOUNDS_HAZARD_V,
  BOUNDS_WALL,
  EDGE_DIRECTIONS,
  EDGE_EAST,
  EDGE_NORTH,
  EDGE_SHAPES,
  EDGE_SOUTH,
  EDGE_WEST,
  FLOOR_DECAL_COUNT,
  FLOOR_DECAL_FIRST,
  DECK_DIGIT_W,
  FLOOR_LANE_CROSS,
  FLOOR_LANE_H,
  FLOOR_LANE_V,
  FLOOR_PAD,
  FLOOR_PLATE,
  FLOOR_PLATE_GRATE,
  FLOOR_PLATE_TREAD,
  FLOOR_PLATE_WORN,
  GROUND_CATEGORIES,
  GROUND_COUNT,
  GROUND_FEATURE_A,
  GROUND_FEATURE_B,
  GROUND_FIRST,
  GROUND_GLOW,
  GROUND_PATCH_HIGH,
  GROUND_PATCH_LOW,
  GROUND_RARE,
  GROUND_SPECK,
  SPR_BOUNDS,
  SPR_DECK_DIGITS,
  SPR_EDGES,
  SPR_FLOOR,
  SPR_GROUND,
} from './sheet.ts'
import { blitAt, frameId } from './sprite.hot.ts'
import { CORE, ZONE_GROUND } from './colors.ts'

const TILE = 32
const EDGE = 6
const WORLD_TILES = WORLD_HALF / TILE
const MAX_STAMP = 48
const NOISE_CELL = 300
const PATCH_CELL = 38
const FEATURE_CELL = 46
const SPECK_CELL = 19
const GLOW_CELL = 58
const LAYER_PATCH = 0
const LAYER_FEATURE = 1
const LAYER_SPECK = 2
const LAYER_GLOW = 3
const LAYER_PATCH_DENSE = 4
const PATCH_DENSE_SHIFT = 0.45
const SALT_TONE = 11
const SALT_REGION = 23
const SALT_EDGE_X = 37
const SALT_EDGE_Y = 41
const FEATURE_CHANCE = 150
const SPECK_CHANCE = 120
const GLOW_CHANCE = 110
const RARE_ODDS = 15
const GLOW_PERIOD = 22
const LANE_EVERY = 8
const LANE_PHASE = 2
const PAD_SIZE = 64
const PAD_NUMBERS = 48
const PAD_DIGIT_TOP = 25
const EDGE_STEP = 3
const EDGE_REACH = 16
const EDGE_WAVE = 6
const EDGE_SWING = 6

function hash3(x: number, y: number, salt: number): number {
  let h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1) ^ Math.imul(salt, 0x9e3779b1)
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  return (h ^ (h >>> 16)) >>> 0
}

function lattice(ix: number, iy: number, salt: number): number {
  return (hash3(ix, iy, salt) & 0xffff) / 0xffff
}

function noise(x: number, y: number, salt: number): number {
  const gx = x / NOISE_CELL
  const gy = y / NOISE_CELL
  const ix = Math.floor(gx)
  const iy = Math.floor(gy)
  let fx = gx - ix
  let fy = gy - iy
  fx = fx * fx * (3 - 2 * fx)
  fy = fy * fy * (3 - 2 * fy)
  const a = lattice(ix, iy, salt)
  const b = lattice(ix + 1, iy, salt)
  const c = lattice(ix, iy + 1, salt)
  const d = lattice(ix + 1, iy + 1, salt)
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}

function zoneLeft(z: number): number {
  return (z & 1) === 0 ? -WORLD_HALF : 0
}

function zoneTop(z: number): number {
  return (z & 2) === 0 ? -WORLD_HALF : 0
}

function pickCategory(layer: number, h: number, wx: number, wy: number): number {
  const roll = (h & 255) / 255
  if (layer === LAYER_PATCH || layer === LAYER_PATCH_DENSE) {
    const n = noise(wx, wy, SALT_TONE)
    const extra = layer === LAYER_PATCH ? 0 : PATCH_DENSE_SHIFT
    if (n < 0.43 && roll < (0.43 - n) * 5 - extra) return GROUND_PATCH_LOW
    if (n > 0.57 && roll < (n - 0.57) * 5 - extra) return GROUND_PATCH_HIGH
    return -1
  }
  if (layer === LAYER_FEATURE) {
    if ((h & 255) > FEATURE_CHANCE) return -1
    if (((h >>> 12) & RARE_ODDS) === 0) return GROUND_RARE
    const n = noise(wx, wy, SALT_REGION)
    const lean = (n - 0.5) * 5 + 0.5
    return ((h >>> 24) & 255) / 255 < lean ? GROUND_FEATURE_A : GROUND_FEATURE_B
  }
  if (layer === LAYER_SPECK) return (h & 255) > SPECK_CHANCE ? -1 : GROUND_SPECK
  return (h & 255) > GLOW_CHANCE ? -1 : GROUND_GLOW
}

function scatter(v: View, zone: number, x0: number, y0: number, x1: number, y1: number, cell: number, layer: number, t: number): void {
  const a = v.atlas
  const cx0 = Math.floor((x0 - MAX_STAMP) / cell)
  const cy0 = Math.floor((y0 - MAX_STAMP) / cell)
  const cx1 = Math.floor(x1 / cell)
  const cy1 = Math.floor(y1 / cell)
  const salt = layer * 7919 + 5
  for (let cy = cy0; cy <= cy1; cy++) {
    for (let cx = cx0; cx <= cx1; cx++) {
      const h = hash3(cx, cy, salt)
      const category = pickCategory(layer, h, cx * cell, cy * cell)
      if (category < 0) continue
      const slot = zone * GROUND_CATEGORIES + category
      const count = GROUND_COUNT[slot]!
      if (count === 0) continue
      const place = hash3(cx, cy, salt + 1)
      const pick = (place >>> 20) % count
      let frame = GROUND_FIRST[slot]!
      if (category === GROUND_GLOW) frame += pick * 2 + ((((t / GLOW_PERIOD) | 0) + (place & 3)) & 1)
      else frame += pick
      const id = frameId(v, SPR_GROUND, frame, 0)
      const x = cx * cell + (place % cell) - v.originX
      const y = cy * cell + ((place >>> 10) % cell) - v.originY
      if (x + a.rw[id]! <= 0 || y + a.rh[id]! <= 0 || x >= v.width || y >= v.height) continue
      blitAt(v, id, x, y, 1)
    }
  }
}

function drawGround(v: View, zone: number, x0: number, y0: number, x1: number, y1: number, t: number): void {
  const ctx = v.ctx
  ctx.fillStyle = ZONE_GROUND[zone]!
  ctx.fillRect(x0 - v.originX, y0 - v.originY, x1 - x0, y1 - y0)
  ctx.save()
  ctx.beginPath()
  ctx.rect(x0 - v.originX, y0 - v.originY, x1 - x0, y1 - y0)
  ctx.clip()
  scatter(v, zone, x0, y0, x1, y1, PATCH_CELL, LAYER_PATCH, t)
  scatter(v, zone, x0, y0, x1, y1, PATCH_CELL, LAYER_PATCH_DENSE, t)
  scatter(v, zone, x0, y0, x1, y1, FEATURE_CELL, LAYER_FEATURE, t)
  scatter(v, zone, x0, y0, x1, y1, GLOW_CELL, LAYER_GLOW, t)
  scatter(v, zone, x0, y0, x1, y1, SPECK_CELL, LAYER_SPECK, t)
  ctx.restore()
}

function deckPlate(h: number): number {
  if ((h & 7) === 0) return FLOOR_PLATE_WORN
  const pick = (h >>> 3) & 31
  if (pick === 0) return FLOOR_PLATE_GRATE
  if (pick === 1) return FLOOR_PLATE_TREAD
  return FLOOR_PLATE
}

function drawPads(v: View, tx0: number, ty0: number, tx1: number, ty1: number): void {
  const ox = v.originX
  const oy = v.originY
  const bx0 = Math.floor((tx0 - LANE_PHASE - 6) / LANE_EVERY)
  const by0 = Math.floor((ty0 - LANE_PHASE - 6) / LANE_EVERY)
  const bx1 = Math.floor((tx1 - LANE_PHASE) / LANE_EVERY)
  const by1 = Math.floor((ty1 - LANE_PHASE) / LANE_EVERY)
  for (let by = by0; by <= by1; by++) {
    for (let bx = bx0; bx <= bx1; bx++) {
      const h = hash3(bx, by, 5)
      if (h % 3 === 0) continue
      const ptx = bx * LANE_EVERY + LANE_PHASE + 2 + ((h >>> 2) & 3)
      const pty = by * LANE_EVERY + LANE_PHASE + 2 + ((h >>> 4) & 3)
      if (ptx < -WORLD_TILES || pty < -WORLD_TILES || ptx + 1 >= 0 || pty + 1 >= 0) continue
      const x = ptx * TILE - ox
      const y = pty * TILE - oy
      if (x + PAD_SIZE <= 0 || y + PAD_SIZE <= 0 || x >= v.width || y >= v.height) continue
      blitAt(v, frameId(v, SPR_FLOOR, FLOOR_PAD, 0), x, y, 1)
      const number = 1 + ((h >>> 8) % PAD_NUMBERS)
      const left = x + (PAD_SIZE >> 1) - DECK_DIGIT_W * 2 - 1
      const top = y + PAD_DIGIT_TOP
      blitAt(v, frameId(v, SPR_DECK_DIGITS, (number / 10) | 0, 0), left, top, 2)
      blitAt(v, frameId(v, SPR_DECK_DIGITS, number % 10, 0), left + DECK_DIGIT_W * 2 + 2, top, 2)
    }
  }
}

function drawDeck(v: View, x0: number, y0: number, x1: number, y1: number): void {
  const ox = v.originX
  const oy = v.originY
  const tx0 = Math.floor(x0 / TILE)
  const ty0 = Math.floor(y0 / TILE)
  const tx1 = Math.ceil(x1 / TILE) - 1
  const ty1 = Math.ceil(y1 / TILE) - 1
  for (let ty = ty0; ty <= ty1; ty++) {
    const laneRow = (ty & (LANE_EVERY - 1)) === LANE_PHASE
    for (let tx = tx0; tx <= tx1; tx++) {
      const x = tx * TILE - ox
      const y = ty * TILE - oy
      const h = hash3(tx, ty, 3)
      blitAt(v, frameId(v, SPR_FLOOR, deckPlate(h), 0), x, y, 1)
      const laneColumn = (tx & (LANE_EVERY - 1)) === LANE_PHASE
      if (laneRow || laneColumn) {
        const lane = laneRow && laneColumn ? FLOOR_LANE_CROSS : laneRow ? FLOOR_LANE_H : FLOOR_LANE_V
        blitAt(v, frameId(v, SPR_FLOOR, lane, 0), x, y, 1)
        continue
      }
      if ((h >>> 9) % 6 !== 0) continue
      const decal = frameId(v, SPR_FLOOR, FLOOR_DECAL_FIRST + ((h >>> 12) % FLOOR_DECAL_COUNT), 0)
      const room = TILE - 4 - v.atlas.rw[decal]!
      const roomY = TILE - 4 - v.atlas.rh[decal]!
      blitAt(v, decal, x + 2 + ((h >>> 15) % (room + 1)), y + 2 + ((h >>> 20) % (roomY + 1)), 1)
    }
  }
  drawPads(v, tx0, ty0, tx1, ty1)
}

function edgeFrame(v: View, zone: number, direction: number, shape: number): number {
  return frameId(v, SPR_EDGES, (zone * EDGE_DIRECTIONS + direction) * EDGE_SHAPES + shape, 0)
}

function edgeOffset(s: number, salt: number, deck: boolean): number {
  const k = s / EDGE_WAVE
  const i = Math.floor(k)
  let f = k - i
  f = f * f * (3 - 2 * f)
  const a = lattice(i, 0, salt)
  const n = a + (lattice(i + 1, 0, salt) - a) * f
  const offset = Math.round((n - 0.5) * 2 * EDGE_SWING + (hash3(s, 1, salt) & 3) - 1.5)
  return deck ? -(offset < 0 ? -offset : offset) - 2 : offset
}

function drawSeams(v: View): void {
  const a = v.atlas
  const ctx = v.ctx
  const ox = v.originX
  const oy = v.originY
  if (ox < EDGE_REACH && ox + v.width > -EDGE_REACH) {
    const ya = oy > -WORLD_HALF ? oy : -WORLD_HALF
    const yb = oy + v.height < WORLD_HALF ? oy + v.height : WORLD_HALF
    for (let s = Math.floor(ya / EDGE_STEP); s * EDGE_STEP < yb; s++) {
      const wy = s * EDGE_STEP
      const west = wy < 0 ? 0 : 2
      const east = west + 1
      const offset = edgeOffset(s, SALT_EDGE_X, west === ZONE_HANGAR)
      const shape = hash3(s, 2, SALT_EDGE_X) % EDGE_SHAPES
      if (offset >= 0) {
        ctx.fillStyle = ZONE_GROUND[west]!
        ctx.fillRect(-ox, wy - oy, offset, EDGE_STEP)
        blitAt(v, edgeFrame(v, west, EDGE_EAST, shape), offset - ox, wy - oy, 1)
      } else {
        ctx.fillStyle = ZONE_GROUND[east]!
        ctx.fillRect(offset - ox, wy - oy, -offset, EDGE_STEP)
        const id = edgeFrame(v, east, EDGE_WEST, shape)
        blitAt(v, id, offset - a.rw[id]! - ox, wy - oy, 1)
      }
    }
  }
  if (oy < EDGE_REACH && oy + v.height > -EDGE_REACH) {
    const xa = ox > -WORLD_HALF ? ox : -WORLD_HALF
    const xb = ox + v.width < WORLD_HALF ? ox + v.width : WORLD_HALF
    for (let s = Math.floor(xa / EDGE_STEP); s * EDGE_STEP < xb; s++) {
      const wx = s * EDGE_STEP
      const north = wx < 0 ? 0 : 1
      const south = north + 2
      const offset = edgeOffset(s, SALT_EDGE_Y, north === ZONE_HANGAR)
      const shape = hash3(s, 2, SALT_EDGE_Y) % EDGE_SHAPES
      if (offset >= 0) {
        ctx.fillStyle = ZONE_GROUND[north]!
        ctx.fillRect(wx - ox, -oy, EDGE_STEP, offset)
        blitAt(v, edgeFrame(v, north, EDGE_SOUTH, shape), wx - ox, offset - oy, 1)
      } else {
        ctx.fillStyle = ZONE_GROUND[south]!
        ctx.fillRect(wx - ox, offset - oy, EDGE_STEP, -offset)
        const id = edgeFrame(v, south, EDGE_NORTH, shape)
        blitAt(v, id, wx - ox, offset - a.rh[id]! - oy, 1)
      }
    }
  }
}

function drawVoid(v: View): void {
  const ox = v.originX
  const oy = v.originY
  if (ox >= -WORLD_HALF && oy >= -WORLD_HALF && ox + v.width <= WORLD_HALF && oy + v.height <= WORLD_HALF) return
  const wall = frameId(v, SPR_BOUNDS, BOUNDS_WALL, 0)
  const tx0 = Math.floor(ox / TILE)
  const ty0 = Math.floor(oy / TILE)
  const tx1 = Math.floor((ox + v.width) / TILE)
  const ty1 = Math.floor((oy + v.height) / TILE)
  for (let ty = ty0; ty <= ty1; ty++) {
    const rowInside = ty >= -WORLD_TILES && ty < WORLD_TILES
    for (let tx = tx0; tx <= tx1; tx++) {
      if (rowInside && tx >= -WORLD_TILES && tx < WORLD_TILES) continue
      blitAt(v, wall, tx * TILE - ox, ty * TILE - oy, 1)
    }
  }
}

function drawBounds(v: View): void {
  const ox = v.originX
  const oy = v.originY
  const hazardV = frameId(v, SPR_BOUNDS, BOUNDS_HAZARD_V, 0)
  const hazardH = frameId(v, SPR_BOUNDS, BOUNDS_HAZARD_H, 0)
  const ty0 = Math.max(Math.floor(oy / TILE), -WORLD_TILES)
  const ty1 = Math.min(Math.floor((oy + v.height) / TILE), WORLD_TILES - 1)
  const tx0 = Math.max(Math.floor(ox / TILE), -WORLD_TILES)
  const tx1 = Math.min(Math.floor((ox + v.width) / TILE), WORLD_TILES - 1)
  const showLeft = ox < -WORLD_HALF + EDGE
  const showRight = ox + v.width > WORLD_HALF - EDGE
  const showTop = oy < -WORLD_HALF + EDGE
  const showBottom = oy + v.height > WORLD_HALF - EDGE
  for (let ty = ty0; ty <= ty1; ty++) {
    const y = ty * TILE - oy
    if (showLeft) blitAt(v, hazardV, -WORLD_HALF - EDGE - ox, y, 1)
    if (showRight) blitAt(v, hazardV, WORLD_HALF - ox, y, 1)
  }
  for (let tx = tx0; tx <= tx1; tx++) {
    const x = tx * TILE - ox
    if (showTop) blitAt(v, hazardH, x, -WORLD_HALF - EDGE - oy, 1)
    if (showBottom) blitAt(v, hazardH, x, WORLD_HALF - oy, 1)
  }
  const ctx = v.ctx
  ctx.fillStyle = CORE
  ctx.fillRect(-WORLD_HALF - EDGE - ox, -WORLD_HALF - EDGE - oy, EDGE, EDGE)
  ctx.fillRect(WORLD_HALF - ox, -WORLD_HALF - EDGE - oy, EDGE, EDGE)
  ctx.fillRect(-WORLD_HALF - EDGE - ox, WORLD_HALF - oy, EDGE, EDGE)
  ctx.fillRect(WORLD_HALF - ox, WORLD_HALF - oy, EDGE, EDGE)
}

export function drawFloor(v: View, t: number): void {
  const left = v.originX
  const top = v.originY
  const right = left + v.width
  const bottom = top + v.height
  drawVoid(v)
  for (let z = 0; z < ZONE_COUNT; z++) {
    const zx = zoneLeft(z)
    const zy = zoneTop(z)
    const x0 = zx > left ? zx : left
    const y0 = zy > top ? zy : top
    const x1 = zx + WORLD_HALF < right ? zx + WORLD_HALF : right
    const y1 = zy + WORLD_HALF < bottom ? zy + WORLD_HALF : bottom
    if (x0 >= x1 || y0 >= y1) continue
    if (z === ZONE_HANGAR) drawDeck(v, x0, y0, x1, y1)
    else drawGround(v, z, x0, y0, x1, y1, t)
  }
  drawSeams(v)
  drawBounds(v)
}
