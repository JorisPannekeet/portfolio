import {
  ELEMENT_EMBER,
  ELEMENT_GALE,
  ELEMENT_STONE,
  ELEMENT_TIDE,
  EV_PUZZLE,
  KEY_LONGBOW,
  KEY_WARHAMMER,
  MAX_OBJECTS,
  OBJ_IDLE,
  OBJ_SWITCH,
  OBJ_USED,
  OBJ_WINDMILL,
  TILE,
  TILE_BARRICADE,
  TILE_CRACKED,
  TILE_ICE,
  TILE_PILLAR_RAISED,
  TILE_PILLAR_SUNK,
  TILE_SEAL,
  TILE_WATER,
} from './content.ts'
import type { State } from './state.ts'
import { AREAS, TILE_OPENED } from './areas.ts'
import { emit } from './events.hot.ts'
import { STRIKE_PAD, SWITCH_RANGE, WINDMILL_PAD } from './world-tuning.ts'

export function openedTile(tile: number): number {
  return TILE_OPENED[tile] !== 0 ? TILE_OPENED[tile]! : tile
}

export function openTileGroup(s: State, flag: number): void {
  s.flags[flag] = 1
  const tileFlag = AREAS[s.area]!.tileFlag
  const n = s.mapW * s.mapH
  for (let i = 0; i < n; i++) if (tileFlag[i] === flag) s.tiles[i] = openedTile(s.tiles[i]!)
}

function transformTile(s: State, i: number, from: number, to: number): boolean {
  if (s.tiles[i] !== from) return false
  const flag = AREAS[s.area]!.tileFlag[i]!
  if (flag >= 0) openTileGroup(s, flag)
  else s.tiles[i] = to
  return true
}

function affectTiles(s: State, x: number, y: number, radius: number, from: number, to: number): number {
  const r = radius < 0 ? 0 : radius
  const x0 = Math.max(0, Math.floor((x - r) / TILE))
  const y0 = Math.max(0, Math.floor((y - r) / TILE))
  const x1 = Math.min(s.mapW - 1, Math.floor((x + r) / TILE))
  const y1 = Math.min(s.mapH - 1, Math.floor((y + r) / TILE))
  const reach = (r + TILE / 2) * (r + TILE / 2)
  let changed = 0
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const dx = (tx + 0.5) * TILE - x
      const dy = (ty + 0.5) * TILE - y
      if (dx * dx + dy * dy > reach) continue
      if (transformTile(s, ty * s.mapW + tx, from, to)) changed++
    }
  }
  return changed
}

function turnWindmills(s: State, x: number, y: number, radius: number): number {
  const reach = (radius + WINDMILL_PAD) * (radius + WINDMILL_PAD)
  let changed = 0
  for (let i = 0; i < MAX_OBJECTS; i++) {
    if (s.objKind[i] !== OBJ_WINDMILL || s.objState[i] !== OBJ_IDLE) continue
    const dx = s.objX[i]! - x
    const dy = s.objY[i]! - y
    if (dx * dx + dy * dy > reach) continue
    s.objState[i] = OBJ_USED
    if (s.objFlag[i]! >= 0) s.flags[s.objFlag[i]!] = 1
    openTileGroup(s, s.objArg[i]!)
    changed++
  }
  return changed
}

export function elementWorldEffect(s: State, element: number, x: number, y: number, radius: number): void {
  let changed = 0
  if (element === ELEMENT_STONE) changed = affectTiles(s, x, y, radius, TILE_PILLAR_SUNK, TILE_PILLAR_RAISED)
  else if (element === ELEMENT_TIDE) changed = affectTiles(s, x, y, radius, TILE_WATER, TILE_ICE)
  else if (element === ELEMENT_EMBER) changed = affectTiles(s, x, y, radius, TILE_BARRICADE, openedTile(TILE_BARRICADE))
  else if (element === ELEMENT_GALE) changed = turnWindmills(s, x, y, radius)
  if (changed > 0) emit(s, EV_PUZZLE, element, changed, x, y)
}

export function strikeWorldEffect(s: State, x: number, y: number): void {
  if ((s.keyItems & KEY_WARHAMMER) === 0) return
  const changed = affectTiles(s, x, y, STRIKE_PAD, TILE_CRACKED, openedTile(TILE_CRACKED))
  if (changed > 0) emit(s, EV_PUZZLE, -1, KEY_WARHAMMER, x, y)
}

export function arrowWorldEffect(s: State, x: number, y: number): number {
  for (let i = 0; i < MAX_OBJECTS; i++) {
    if (s.objKind[i] !== OBJ_SWITCH || s.objState[i] !== OBJ_IDLE) continue
    const dx = s.objX[i]! - x
    const dy = s.objY[i]! - y
    if (dx * dx + dy * dy > SWITCH_RANGE * SWITCH_RANGE) continue
    s.objState[i] = OBJ_USED
    if (s.objFlag[i]! >= 0) s.flags[s.objFlag[i]!] = 1
    openTileGroup(s, s.objArg[i]!)
    emit(s, EV_PUZZLE, -1, KEY_LONGBOW, s.objX[i]!, s.objY[i]!)
    return 1
  }
  return 0
}

export function openSealsNear(s: State, x: number, y: number, radius: number): number {
  return affectTiles(s, x, y, radius, TILE_SEAL, openedTile(TILE_SEAL))
}
