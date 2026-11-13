import type { State } from '../sim/state.ts'
import {
  AREA_COUNT, OBJ_EXIT, TILE, TILE_BLOCKS_WALK, TILE_BRIDGE, TILE_COUNT, TILE_FLOOR, TILE_GRASS, TILE_HOUSE, TILE_ICE, TILE_LAVA, TILE_ROAD, TILE_STAIRS, TILE_TREE, TILE_VOID,
  TILE_WALL, TILE_WATER, TILE_ASH,
} from '../sim/content.ts'
import { SMOKE_CAP, type View } from './view.ts'
import { NONE, SPR_TILES } from './sheet-ids.ts'
import {
  AREA_OUTDOOR, AREA_SKY_KIND, AREA_TILESET, CHIMNEY, CLOUD_FIRST, CLOUD_LOOKS, LANDMARK_FRAME, LIP_FIRST, SKY_FIRST, SKY_VARIANTS, UNDERSIDE_FIRST,
  UNDERSIDE_VARIANTS, FLOOR_DECAL_COUNT, FLOOR_DECAL_FIRST, FOAM_FIRST, GRASS_DECAL_FIRST, HOUSE_FACE_FIRST, HOUSE_ROOF_FIRST, LILY_FIRST,
  REEDS_FIRST, ROAD_FRINGE_FIRST, ROAD_RUT_H, ROAD_RUT_V, TILESET_VILLAGE, TILE_ANIM, TILE_EDGE, TILE_FACE, TILE_FACE_VARIANTS, TILE_FIRST,
  TILE_GROUP, TILE_VARIANTS, TREE_FIRST, WALL_DECAL_FIRST, WATER_FRAMES,
} from './sheet-world.ts'
import { BRIDGE_ACROSS, BRIDGE_RAIL_A, BRIDGE_RAIL_B, DECAL_BELL, DECAL_BUTTERCUP, DECAL_CLOVER, DECAL_DAISY, DECAL_MUSHROOM, DECAL_PEBBLES, DECAL_TUFT_A, DECAL_TUFT_B, FACE_DOOR, FACE_FRAMES, FACE_LEFT, FACE_PLAIN, FACE_RIGHT, FACE_WINDOW, FACE_WINDOW_LIT, HOUSE_LOOKS, ROOF_FRAMES, TREE_LOOKS, WALL_BANNER, WALL_CHAIN, WALL_TORCH, WALL_VINE } from '../sprites/tiles.ts'
import { blitAt, blitFoot, frameId, rect, snap } from './sprite.hot.ts'
import { pushLight } from './light.hot.ts'
import { C_EMBER, C_NIGHT } from './colors.ts'
import { COLOR_SMOKE, COLOR_WINDOW } from './ambient.ts'

const ANIM_TICKS = 24
const WATER_TICKS = 18
const DECAL_PERCENT = 34
const TREE_OVERHANG = 2
const SCAN = 12
const CLOUD_CELL_W = 120
const CLOUD_CELL_H = 44
const CLOUD_DRIFT = 0.06

export function tileAt(s: State, tx: number, ty: number): number {
  if (tx < 0 || ty < 0 || tx >= s.mapW || ty >= s.mapH) return -1
  return s.tiles[ty * s.mapW + tx]!
}

export function tileHash(tx: number, ty: number): number {
  return (Math.imul(tx, 73856093) ^ Math.imul(ty, 19349663) ^ Math.imul(tx + ty, 83492791)) >>> 0
}

function mixHash(h: number): number {
  let x = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d)
  x = Math.imul(x ^ (x >>> 12), 0x297a2d39)
  return (x ^ (x >>> 15)) >>> 0
}

export function landmarkOf(s: State, i: number): number {
  if (s.objKind[i]! !== OBJ_EXIT || s.area < 0 || s.area >= AREA_COUNT || AREA_OUTDOOR[s.area]! === 0) return -1
  const area = s.objArg[i]!
  return area >= 0 && area < AREA_COUNT && LANDMARK_FRAME[area]! >= 0 ? area : -1
}

export function landmarkLead(s: State, i: number): boolean {
  const tx = Math.floor(s.objX[i]! / TILE)
  const ty = Math.floor(s.objY[i]! / TILE)
  return tileAt(s, tx, ty) === TILE_STAIRS && tileAt(s, tx - 1, ty) !== TILE_STAIRS
}

export function landmarkFoot(s: State, i: number): number {
  return (Math.floor(s.objY[i]! / TILE) + 1) * TILE
}

export function skyKindOf(s: State): number {
  return s.area >= 0 && s.area < AREA_COUNT ? AREA_SKY_KIND[s.area]! : -1
}

export function tilesetOf(s: State): number {
  return s.area >= 0 && s.area < AREA_COUNT ? AREA_TILESET[s.area]! : 0
}

export function tileFrame(s: State, tileset: number, tx: number, ty: number, beat: number): number {
  const raw = tileAt(s, tx, ty)
  const kind = raw < 0 || raw >= TILE_COUNT ? TILE_VOID : raw
  const i = tileset * TILE_COUNT + kind
  const group = TILE_GROUP[kind]!
  const hash = mixHash(tileHash(tx, ty))
  let frame = TILE_FIRST[i]!
  if (TILE_FACE[i]! !== NONE) {
    const below = tileAt(s, tx, ty + 1)
    if (below >= 0 && below < TILE_COUNT && TILE_GROUP[below]! !== group) return TILE_FACE[i]! + (hash % TILE_FACE_VARIANTS[i]!)
  }
  if (TILE_EDGE[i]! !== NONE) {
    const above = tileAt(s, tx, ty - 1)
    if (above >= 0 && above < TILE_COUNT && TILE_GROUP[above]! !== group) frame = TILE_EDGE[i]!
  }
  if (TILE_VARIANTS[i]! > 1) frame += (hash >>> 3) % TILE_VARIANTS[i]!
  if (TILE_ANIM[i]! > 1) frame += beat % TILE_ANIM[i]!
  return frame
}

function swayFrame(v: View, t: number, tx: number, ty: number, slow: number): number {
  if (v.reducedMotion) return 0
  const speed = (0.008 + v.wind * 0.05) / slow
  return ((t * speed + tx * 0.37 + ty * 0.21) | 0) & 1
}

function grassy(kind: number): boolean {
  return kind === TILE_GRASS || kind === TILE_TREE
}

function wet(kind: number): boolean {
  return kind === TILE_WATER || kind === TILE_BRIDGE || kind === TILE_ICE || kind < 0
}

function tile(v: View, frame: number, x: number, y: number): void {
  blitAt(v, frameId(v, SPR_TILES, frame, 0), x, y, 1)
}

function drawGrassDecal(v: View, hash: number, tx: number, ty: number, x: number, y: number, t: number): void {
  if ((hash >>> 8) % 100 >= DECAL_PERCENT) return
  const pick = (hash >>> 15) & 15
  let frame = GRASS_DECAL_FIRST
  if (pick < 8) frame += ((pick & 1) === 0 ? DECAL_TUFT_A : DECAL_TUFT_B) + swayFrame(v, t, tx, ty, 1)
  else if (pick < 10) frame += DECAL_CLOVER
  else if (pick === 10 || pick === 15) frame += DECAL_DAISY
  else if (pick === 11) frame += DECAL_BUTTERCUP
  else if (pick === 12) frame += DECAL_BELL
  else if (pick === 13) frame += (hash & 3) === 0 ? DECAL_MUSHROOM : DECAL_DAISY
  else frame += DECAL_PEBBLES
  tile(v, frame, x + 1 + ((hash >>> 20) % 8), y + 2 + ((hash >>> 24) % 9))
}

function drawRoad(v: View, s: State, tx: number, ty: number, x: number, y: number, hash: number, first: number): void {
  const l = tileAt(s, tx - 1, ty)
  const r = tileAt(s, tx + 1, ty)
  const u = tileAt(s, tx, ty - 1)
  const d = tileAt(s, tx, ty + 1)
  const horiz = (l === TILE_ROAD || l === TILE_BRIDGE) && (r === TILE_ROAD || r === TILE_BRIDGE || r < 0)
  const vert = (u === TILE_ROAD || u === TILE_BRIDGE) && (d === TILE_ROAD || d === TILE_BRIDGE || d < 0)
  const variant = horiz && !vert ? ROAD_RUT_H : vert && !horiz ? ROAD_RUT_V : (hash >>> 3) & 1
  tile(v, first + variant, x, y)
  drawFringe(v, u, r, d, l, x, y)
}

function drawFringe(v: View, u: number, r: number, d: number, l: number, x: number, y: number): void {
  if (grassy(u)) tile(v, ROAD_FRINGE_FIRST, x, y)
  if (grassy(r)) tile(v, ROAD_FRINGE_FIRST + 1, x, y)
  if (grassy(d)) tile(v, ROAD_FRINGE_FIRST + 2, x, y)
  if (grassy(l)) tile(v, ROAD_FRINGE_FIRST + 3, x, y)
}

function drawWater(v: View, s: State, tileset: number, tx: number, ty: number, x: number, y: number, hash: number, t: number): void {
  const i = tileset * TILE_COUNT + TILE_WATER
  const phase = v.reducedMotion ? 0 : ((t / WATER_TICKS) | 0) % WATER_FRAMES
  const u = tileAt(s, tx, ty - 1)
  const r = tileAt(s, tx + 1, ty)
  const d = tileAt(s, tx, ty + 1)
  const l = tileAt(s, tx - 1, ty)
  tile(v, (wet(u) ? TILE_FIRST[i]! : TILE_EDGE[i]!) + phase, x, y)
  const foam = phase & 1
  if (!wet(r)) tile(v, FOAM_FIRST + foam, x, y)
  if (!wet(d)) tile(v, FOAM_FIRST + 2 + foam, x, y)
  if (!wet(l)) tile(v, FOAM_FIRST + 4 + foam, x, y)
  if (tileset !== TILESET_VILLAGE) return
  const roll = (hash >>> 8) % 100
  const shore = !wet(r) || !wet(d) || !wet(l) || !wet(u)
  if (shore && roll < 30) {
    const rx = !wet(l) ? (hash >>> 16) % 3 : !wet(r) ? 7 + ((hash >>> 16) % 3) : 2 + ((hash >>> 16) % 6)
    tile(v, REEDS_FIRST + swayFrame(v, t, tx, ty, 1.5), x + rx, y + 3 + ((hash >>> 20) % 4))
  } else if (!shore && roll < 12 && u !== TILE_BRIDGE && d !== TILE_BRIDGE) tile(v, LILY_FIRST + (roll < 3 ? 1 : 0), x + 2 + ((hash >>> 16) % 8), y + 3 + ((hash >>> 22) % 8))
}

function blocked(kind: number): boolean {
  return kind < 0 || kind >= TILE_COUNT || TILE_BLOCKS_WALK[kind]! !== 0
}

function drawBridge(v: View, s: State, tx: number, ty: number, x: number, y: number, first: number): void {
  const u = blocked(tileAt(s, tx, ty - 1))
  const d = blocked(tileAt(s, tx, ty + 1))
  const l = blocked(tileAt(s, tx - 1, ty))
  const r = blocked(tileAt(s, tx + 1, ty))
  const across = !l && !r && (u || d)
  const variant = across ? BRIDGE_ACROSS + (u ? BRIDGE_RAIL_A : 0) + (d ? BRIDGE_RAIL_B : 0) : (l ? BRIDGE_RAIL_A : 0) + (r ? BRIDGE_RAIL_B : 0)
  tile(v, first + variant, x, y)
}

function drawHouse(v: View, s: State, tx: number, ty: number, x: number, y: number): void {
  let left = tx
  while (left > tx - SCAN && tileAt(s, left - 1, ty) === TILE_HOUSE) left--
  let right = tx
  while (right < tx + SCAN && tileAt(s, right + 1, ty) === TILE_HOUSE) right++
  let top = ty
  while (top > ty - SCAN && tileAt(s, tx, top - 1) === TILE_HOUSE) top--
  const look = mixHash(tileHash(left, top)) % HOUSE_LOOKS
  const edge = tx === left ? 0 : tx === right ? 2 : 1
  if (tileAt(s, tx, ty + 1) === TILE_HOUSE) {
    tile(v, HOUSE_ROOF_FIRST + look * ROOF_FRAMES + (ty === top ? 0 : 3) + edge, x, y)
    return
  }
  const width = right - left + 1
  const door = left + 1 + (width > 2 ? mixHash(tileHash(left + 7, top)) % (width - 2) : 0)
  let kind = tx === left ? FACE_LEFT : tx === right ? FACE_RIGHT : tx === door ? FACE_DOOR : (tx - left) % 3 === 2 ? FACE_PLAIN : FACE_WINDOW
  if (kind === FACE_WINDOW && v.night > 0.3) {
    kind = FACE_WINDOW_LIT
    pushLight(v, x + 8, y + 9, 26, COLOR_WINDOW)
  }
  tile(v, HOUSE_FACE_FIRST + look * FACE_FRAMES + kind, x, y)
}

function chimneyAt(s: State, tx: number, ty: number): boolean {
  if (tileAt(s, tx, ty - 1) === TILE_HOUSE || tileAt(s, tx, ty + 1) !== TILE_HOUSE) return false
  let left = tx
  while (left > tx - SCAN && tileAt(s, left - 1, ty) === TILE_HOUSE) left--
  let right = tx
  while (right < tx + SCAN && tileAt(s, right + 1, ty) === TILE_HOUSE) right++
  const h = mixHash(tileHash(left, ty) + 3)
  if (h % 3 === 0 || right - left < 2) return false
  return tx === left + 1 + ((h >>> 4) % (right - left - 1))
}

function drawWallDecor(v: View, tileset: number, hash: number, x: number, y: number, t: number): void {
  if (tileset === TILESET_VILLAGE) return
  const roll = (hash >>> 8) % 100
  const first = WALL_DECAL_FIRST[tileset]!
  if (roll < 8) {
    const flick = v.reducedMotion ? 0 : ((t / 7 + (hash & 7)) | 0) & 1
    tile(v, first + WALL_TORCH + flick, x + 5.5, y + 1.5)
    pushLight(v, x + 8, y + 4, 40 + flick * 3, C_EMBER)
  } else if (roll < 11) tile(v, first + WALL_BANNER, x + 4, y + 3)
  else if (roll < 18) tile(v, first + WALL_VINE, x + 2 + ((hash >>> 16) % 10), y + 1)
  else if (roll < 21) tile(v, first + WALL_CHAIN, x + 3 + ((hash >>> 16) % 10), y + 2)
}

function land(kind: number, sky: number): boolean {
  return kind >= 0 && kind !== sky && kind !== TILE_BRIDGE
}

function drawSkyEdge(v: View, s: State, sky: number, tx: number, ty: number, x: number, y: number, hash: number): void {
  if (land(tileAt(s, tx - 1, ty), sky)) tile(v, LIP_FIRST, x, y)
  if (land(tileAt(s, tx + 1, ty), sky)) tile(v, LIP_FIRST + 1, x, y)
  if (land(tileAt(s, tx, ty - 1), sky)) tile(v, UNDERSIDE_FIRST + ((hash >>> 5) % UNDERSIDE_VARIANTS), x, y)
}

function drawClouds(v: View, t: number): void {
  const drift = v.reducedMotion ? 0 : t * CLOUD_DRIFT
  const r0 = Math.floor((v.originY - 20) / CLOUD_CELL_H)
  const r1 = Math.floor((v.originY + v.height + 10) / CLOUD_CELL_H)
  for (let r = r0; r <= r1; r++) {
    const shift = drift * (0.7 + (mixHash(r * 31 + 5) % 60) / 100)
    const k0 = Math.floor((v.originX - shift - 60) / CLOUD_CELL_W)
    const k1 = Math.floor((v.originX + v.width - shift) / CLOUD_CELL_W)
    for (let k = k0; k <= k1; k++) {
      const h = mixHash(tileHash(k, r) + 97)
      if (h % 100 > 62) continue
      const x = k * CLOUD_CELL_W + ((h >>> 8) % 70) + shift - v.originX
      const y = r * CLOUD_CELL_H + ((h >>> 16) % 24) - v.originY
      tile(v, CLOUD_FIRST + ((h >>> 4) % CLOUD_LOOKS), snap(x), y)
    }
  }
}

function drawSky(v: View, s: State, sky: number, x0: number, y0: number, x1: number, y1: number, t: number): void {
  let seen = 0
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const raw = tileAt(s, tx, ty)
      if ((raw < 0 ? TILE_VOID : raw) !== sky) continue
      tile(v, SKY_FIRST + (mixHash(tileHash(tx, ty)) % SKY_VARIANTS), tx * TILE - v.originX, ty * TILE - v.originY)
      seen++
    }
  }
  if (seen > 0) drawClouds(v, t)
}

function drawGround(v: View, s: State, tileset: number, sky: number, tx: number, ty: number, beat: number, t: number): void {
  const raw = tileAt(s, tx, ty)
  const kind = raw < 0 || raw >= TILE_COUNT ? TILE_VOID : raw
  const x = tx * TILE - v.originX
  const y = ty * TILE - v.originY
  const hash = mixHash(tileHash(tx, ty))
  if (kind === sky) return drawSkyEdge(v, s, sky, tx, ty, x, y, hash)
  if (kind === TILE_HOUSE) return drawHouse(v, s, tx, ty, x, y)
  if (kind === TILE_WATER) return drawWater(v, s, tileset, tx, ty, x, y, hash, t)
  if (kind === TILE_BRIDGE) return drawBridge(v, s, tx, ty, x, y, TILE_FIRST[tileset * TILE_COUNT + TILE_BRIDGE]!)
  if (kind === TILE_ROAD) return drawRoad(v, s, tx, ty, x, y, hash, TILE_FIRST[tileset * TILE_COUNT + TILE_ROAD]!)
  tile(v, tileFrame(s, tileset, tx, ty, kind === TILE_LAVA ? (v.reducedMotion ? 0 : (t / 40) | 0) : beat), x, y)
  if (kind === TILE_GRASS) drawGrassDecal(v, hash, tx, ty, x, y, t)
  else if (kind === TILE_ASH && tileset === TILESET_VILLAGE) drawFringe(v, tileAt(s, tx, ty - 1), tileAt(s, tx + 1, ty), tileAt(s, tx, ty + 1), tileAt(s, tx - 1, ty), x, y)
  else if (kind === TILE_FLOOR && (hash >>> 8) % 100 < 9) {
    tile(v, FLOOR_DECAL_FIRST[tileset]! + ((hash >>> 16) % FLOOR_DECAL_COUNT), x + 2 + ((hash >>> 20) % 7), y + 2 + ((hash >>> 24) % 8))
  } else if (kind === TILE_WALL) {
    const below = tileAt(s, tx, ty + 1)
    if (below >= 0 && below < TILE_COUNT && TILE_GROUP[below]! !== TILE_GROUP[TILE_WALL]! && below !== TILE_STAIRS) drawWallDecor(v, tileset, hash, x, y, t)
  } else if (kind === TILE_LAVA && tx % 3 === 0 && (ty & 1) === 0) pushLight(v, x + 8, y + 8, 28, C_EMBER)
}

export function treeFoot(v: View, tx: number, ty: number): number {
  return ty * TILE - v.originY + TILE - TREE_OVERHANG + ((mixHash(tileHash(tx, ty) + 11) >>> 8) & 1) + 1
}

export function drawTree(v: View, tx: number, ty: number, t: number): void {
  const hash = mixHash(tileHash(tx, ty) + 11)
  const pick = hash & 15
  const look = pick < 7 ? 0 : pick < 11 ? 1 : pick < 14 ? 2 : 3
  const jitter = ((hash >>> 4) % 3) - 1
  const frame = TREE_FIRST + (look < TREE_LOOKS ? look : 0) * 2 + swayFrame(v, t, tx, ty, 2)
  blitFoot(v, frameId(v, SPR_TILES, frame, 0), tx * TILE - v.originX + 8 + jitter, treeFoot(v, tx, ty))
}

export function pushSmoke(v: View, x: number, y: number, color: number, scale: number): void {
  if (v.smokeCount >= SMOKE_CAP) return
  const k = v.smokeCount++
  v.smokeX[k] = x
  v.smokeY[k] = y
  v.smokeColor[k] = color
  v.smokeScale[k] = scale
}

function drawChimney(v: View, s: State, tx: number, ty: number): void {
  if (tileAt(s, tx, ty) === TILE_HOUSE && chimneyAt(s, tx, ty)) {
    const x = tx * TILE - v.originX + 4
    const y = ty * TILE - v.originY - 6
    tile(v, CHIMNEY, x, y)
    pushSmoke(v, x + 3.5 + v.originX, y + v.originY, COLOR_SMOKE, 1)
  }
}

export function drawTiles(v: View, s: State, t: number): void {
  v.lightCount = 0
  rect(v, C_NIGHT, 0, 0, v.width, v.height)
  const tileset = tilesetOf(s)
  const ox = v.originX
  const oy = v.originY
  const x0 = Math.floor(ox / TILE)
  const y0 = Math.floor(oy / TILE)
  const x1 = Math.floor((ox + v.width - 1) / TILE)
  const y1 = Math.floor((oy + v.height - 1) / TILE)
  const beat = (t / ANIM_TICKS) | 0
  const sky = skyKindOf(s)
  if (sky >= 0) drawSky(v, s, sky, x0, y0, x1, y1, t)
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) drawGround(v, s, tileset, sky, tx, ty, beat, t)
  }
  v.smokeCount = 0
  for (let ty = y0; ty <= y1 + 2; ty++) {
    for (let tx = x0 - 1; tx <= x1 + 1; tx++) drawChimney(v, s, tx, ty)
  }
}
