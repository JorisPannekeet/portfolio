import {
  ELEMENT_EMBER,
  ELEMENT_GALE,
  ELEMENT_STONE,
  ELEMENT_TIDE,
  KEY_GRAPPLE,
  KEY_LONGBOW,
  KEY_WARHAMMER,
  MAX_TILES,
  MELODY_SEALS,
  TILE_DOOR,
  OBJ_GRAPPLE,
  OBJ_WINDMILL,
  TILE,
  TILE_BARRICADE,
  TILE_BLOCKS_WALK,
  TILE_CHASM,
  TILE_CRACKED,
  TILE_GATE,
  TILE_PILLAR_SUNK,
  TILE_SEAL,
  TILE_WATER,
} from './content.ts'
import type { State } from './state.ts'
import { AREAS, DOOR_KEY_FLAG, GATE_OPENER, type ParsedArea } from './areas.ts'
import { GRAPPLE_RANGE } from './world-tuning.ts'

export const HINT_KEY_ITEM = 10
export const HINT_MELODY = 20

const prev = new Int32Array(MAX_TILES)
const queue = new Int32Array(MAX_TILES)
const DX = [1, -1, 0, 0]
const DY = [0, 0, 1, -1]

function tileIndex(s: State, x: number, y: number): number {
  const tx = Math.floor(x / TILE)
  const ty = Math.floor(y / TILE)
  if (x < 0 || y < 0 || tx >= s.mapW || ty >= s.mapH) return -1
  return ty * s.mapW + tx
}

export function findPath(s: State, fromX: number, fromY: number, toX: number, toY: number, out: Int32Array): number {
  const start = tileIndex(s, fromX, fromY)
  const goal = tileIndex(s, toX, toY)
  if (start < 0 || goal < 0 || TILE_BLOCKS_WALK[s.tiles[goal]!] !== 0) return 0
  const n = s.mapW * s.mapH
  prev.fill(-2, 0, n)
  prev[start] = -1
  queue[0] = start
  let head = 0
  let tail = 1
  while (head < tail && prev[goal] === -2) {
    const cur = queue[head++]!
    const cx = cur % s.mapW
    const cy = (cur - cx) / s.mapW
    for (let d = 0; d < 4; d++) {
      const x = cx + DX[d]!
      const y = cy + DY[d]!
      if (x < 0 || y < 0 || x >= s.mapW || y >= s.mapH) continue
      const next = y * s.mapW + x
      if (prev[next] !== -2 || TILE_BLOCKS_WALK[s.tiles[next]!] !== 0) continue
      prev[next] = cur
      queue[tail++] = next
    }
  }
  if (prev[goal] === -2) return 0
  let length = 0
  for (let at = goal; at !== -1; at = prev[at]!) length++
  const written = Math.min(length, out.length)
  let at = goal
  for (let k = length - 1; k >= 0; k--) {
    if (k < written) out[k] = at
    at = prev[at]!
  }
  return written
}

export function puzzleHint(s: State, tileIndex: number): number {
  if (tileIndex < 0 || tileIndex >= s.mapW * s.mapH) return -1
  const tile = s.tiles[tileIndex]!
  if (tile === TILE_PILLAR_SUNK) return ELEMENT_STONE
  if (tile === TILE_WATER) return ELEMENT_TIDE
  if (tile === TILE_BARRICADE) return ELEMENT_EMBER
  if (tile === TILE_CRACKED) return HINT_KEY_ITEM + KEY_WARHAMMER
  if (tile === TILE_CHASM) return HINT_KEY_ITEM + KEY_GRAPPLE
  if (tile === TILE_SEAL) return HINT_MELODY + MELODY_SEALS
  if (tile === TILE_GATE) {
    const flag = AREAS[s.area]!.tileFlag[tileIndex] ?? -1
    if (flag < 0) return -1
    return GATE_OPENER[flag] === OBJ_WINDMILL ? ELEMENT_GALE : HINT_KEY_ITEM + KEY_LONGBOW
  }
  return -1
}

export const NAV_FAR = 0x3fffffff

function crossable(a: ParsedArea): Uint8Array {
  const mask = new Uint8Array(a.w * a.h)
  for (let i = 0; i < mask.length; i++) {
    if (a.tiles[i] !== TILE_CHASM) continue
    const x = ((i % a.w) + 0.5) * TILE
    const y = (Math.floor(i / a.w) + 0.5) * TILE
    for (let k = 0; k < a.objCount; k++) {
      if (a.oKind[k] !== OBJ_GRAPPLE) continue
      const dx = a.oX[k]! - x
      const dy = a.oY[k]! - y
      if (dx * dx + dy * dy <= GRAPPLE_RANGE * GRAPPLE_RANGE) mask[i] = 1
    }
  }
  return mask
}

const CROSSABLE: readonly Uint8Array[] = AREAS.map(crossable)

function unlocked(s: State, element: number): boolean {
  return (s.stancesUnlocked & (1 << element)) !== 0
}

export function solvable(s: State, i: number): boolean {
  const tile = s.tiles[i]!
  if (tile === TILE_PILLAR_SUNK) return unlocked(s, ELEMENT_STONE)
  if (tile === TILE_WATER) return unlocked(s, ELEMENT_TIDE)
  if (tile === TILE_BARRICADE) return unlocked(s, ELEMENT_EMBER)
  if (tile === TILE_CRACKED) return (s.keyItems & KEY_WARHAMMER) !== 0
  if (tile === TILE_CHASM) return (s.keyItems & KEY_GRAPPLE) !== 0 && CROSSABLE[s.area]![i] === 1
  if (tile === TILE_SEAL) return (s.melodies & (1 << MELODY_SEALS)) !== 0
  const flag = AREAS[s.area]!.tileFlag[i] ?? -1
  if (flag < 0) return false
  if (tile === TILE_DOOR) return DOOR_KEY_FLAG[flag]! >= 0 && s.flags[DOOR_KEY_FLAG[flag]!] !== 0
  if (tile === TILE_GATE) return GATE_OPENER[flag] === OBJ_WINDMILL ? unlocked(s, ELEMENT_GALE) : (s.keyItems & KEY_LONGBOW) !== 0
  return false
}

export function fillField(s: State, field: Int32Array, from: number, solve: boolean): void {
  const n = s.mapW * s.mapH
  field.fill(NAV_FAR, 0, n)
  if (from < 0 || from >= n) return
  field[from] = 0
  queue[0] = from
  let head = 0
  let tail = 1
  while (head < tail) {
    const cur = queue[head++]!
    const cx = cur % s.mapW
    const cy = (cur - cx) / s.mapW
    for (let d = 0; d < 4; d++) {
      const x = cx + DX[d]!
      const y = cy + DY[d]!
      if (x < 0 || y < 0 || x >= s.mapW || y >= s.mapH) continue
      const next = y * s.mapW + x
      if (field[next] !== NAV_FAR) continue
      if (TILE_BLOCKS_WALK[s.tiles[next]!] !== 0 && !(solve && solvable(s, next))) continue
      field[next] = field[cur]! + 1
      queue[tail++] = next
    }
  }
}
