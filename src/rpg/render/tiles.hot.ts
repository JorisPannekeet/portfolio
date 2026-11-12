import type { State } from '../sim/state.ts'
import { AREA_COUNT, TILE, TILE_COUNT, TILE_VOID } from '../sim/content.ts'
import type { View } from './view.ts'
import { AREA_TILESET, NONE, SPR_TILES, TILE_ANIM, TILE_EDGE, TILE_FACE, TILE_FACE_VARIANTS, TILE_FIRST, TILE_GROUP, TILE_VARIANTS } from './sheet.ts'
import { blitAt, frameId, rect } from './sprite.hot.ts'
import { C_NIGHT } from './colors.ts'

const ANIM_TICKS = 24

export function tileAt(s: State, tx: number, ty: number): number {
  if (tx < 0 || ty < 0 || tx >= s.mapW || ty >= s.mapH) return -1
  return s.tiles[ty * s.mapW + tx]!
}

export function tileHash(tx: number, ty: number): number {
  return (Math.imul(tx, 73856093) ^ Math.imul(ty, 19349663) ^ Math.imul(tx + ty, 83492791)) >>> 0
}

export function tilesetOf(s: State): number {
  return s.area >= 0 && s.area < AREA_COUNT ? AREA_TILESET[s.area]! : 0
}

export function tileFrame(s: State, tileset: number, tx: number, ty: number, beat: number): number {
  const raw = tileAt(s, tx, ty)
  const kind = raw < 0 || raw >= TILE_COUNT ? TILE_VOID : raw
  const i = tileset * TILE_COUNT + kind
  const group = TILE_GROUP[kind]!
  const hash = tileHash(tx, ty)
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
  if (TILE_ANIM[i]! > 1) frame += (beat + (hash & 1)) % TILE_ANIM[i]!
  return frame
}

export function drawTiles(v: View, s: State, t: number): void {
  rect(v, C_NIGHT, 0, 0, v.width, v.height)
  const tileset = tilesetOf(s)
  const ox = v.originX
  const oy = v.originY
  const x0 = Math.floor(ox / TILE)
  const y0 = Math.floor(oy / TILE)
  const x1 = Math.floor((ox + v.width - 1) / TILE)
  const y1 = Math.floor((oy + v.height - 1) / TILE)
  const beat = (t / ANIM_TICKS) | 0
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      blitAt(v, frameId(v, SPR_TILES, tileFrame(s, tileset, tx, ty, beat), 0), tx * TILE - ox, ty * TILE - oy, 1)
    }
  }
}
