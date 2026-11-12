import {
  AREA_COUNT,
  AREA_SHRINE,
  CH_COUNT,
  ENEMY_ARCHER,
  ENEMY_ASH_HOUND,
  ENEMY_BOSS_FIRST,
  ENEMY_CHAINED,
  ENEMY_DROWNED,
  ENEMY_FOOTMAN,
  ENEMY_GALE_WISP,
  ENEMY_KIND_COUNT,
  ENEMY_KNIGHT,
  ENEMY_WIGHT,
  FLAG_COUNT,
  MAP_MAX_H,
  MAP_MAX_W,
  MAX_ENEMIES,
  MAX_OBJECTS,
  OBJ_EXIT,
  OBJ_KEY,
  OBJ_KIND_COUNT,
  OBJ_NONE,
  OBJ_SWITCH,
  OBJ_WINDMILL,
  SHRINE_COUNT,
  TILE,
  TILE_ASH,
  TILE_BARRICADE,
  TILE_BLOCKS_WALK,
  TILE_BRIDGE,
  TILE_CHASM,
  TILE_COUNT,
  TILE_CRACKED,
  TILE_DOOR,
  TILE_DOOR_OPEN,
  TILE_FLOOR,
  TILE_GATE,
  TILE_GATE_OPEN,
  TILE_GRASS,
  TILE_HOUSE,
  TILE_ICE,
  TILE_LAVA,
  TILE_PILLAR_RAISED,
  TILE_PILLAR_SUNK,
  TILE_PIT,
  TILE_ROAD,
  TILE_ROCK,
  TILE_RUBBLE,
  TILE_SEAL,
  TILE_SEAL_OPEN,
  TILE_STAIRS,
  TILE_TREE,
  TILE_VOID,
  TILE_WALL,
  TILE_WATER,
} from './content.ts'
import type { AreaDef, Cell } from './area-def.ts'
import { flagId } from './flags.ts'
import { SHRINE_RETURN_SPAWN } from './loot-tables.ts'
import { BRENNHOLD_MAP } from './map-brennhold.ts'
import { VALDMERE_MAP } from './map-valdmere.ts'
import { BARROW_MAP } from './map-barrow.ts'
import { SALTREACH_MAP } from './map-saltreach.ts'
import { ASHFORGE_MAP } from './map-ashforge.ts'
import { VELLIN_MAP } from './map-vellin.ts'
import { CITADEL_MAP } from './map-citadel.ts'
import { SHRINE_MAP } from './map-shrine.ts'

export const TILE_CHARS: Readonly<Record<string, number>> = {
  ' ': TILE_VOID, '#': TILE_WALL, '.': TILE_FLOOR, ',': TILE_GRASS, '=': TILE_ROAD, T: TILE_TREE, '^': TILE_ROCK,
  '~': TILE_WATER, I: TILE_ICE, o: TILE_PIT, p: TILE_PILLAR_SUNK, P: TILE_PILLAR_RAISED, a: TILE_ASH, r: TILE_RUBBLE,
  L: TILE_LAVA, _: TILE_BRIDGE, H: TILE_HOUSE, X: TILE_CHASM, '>': TILE_STAIRS,
}
export const ENEMY_CHARS: Readonly<Record<string, number>> = {
  f: ENEMY_FOOTMAN, b: ENEMY_ARCHER, k: ENEMY_KNIGHT, w: ENEMY_WIGHT, d: ENEMY_DROWNED, h: ENEMY_ASH_HOUND, y: ENEMY_GALE_WISP, c: ENEMY_CHAINED,
}
export const SPAWN_SLOTS = 10
const LOOT_OBJECT_RESERVE = 48

export const TILE_OPENED = new Uint8Array(TILE_COUNT)
TILE_OPENED[TILE_DOOR] = TILE_DOOR_OPEN
TILE_OPENED[TILE_GATE] = TILE_GATE_OPEN
TILE_OPENED[TILE_BARRICADE] = TILE_ASH
TILE_OPENED[TILE_CRACKED] = TILE_RUBBLE
TILE_OPENED[TILE_SEAL] = TILE_SEAL_OPEN

export const DOOR_KEY_FLAG = new Int16Array(FLAG_COUNT).fill(-1)
export const GATE_OPENER = new Uint8Array(FLAG_COUNT)

export interface ParsedArea {
  readonly def: AreaDef
  readonly id: number
  readonly w: number
  readonly h: number
  readonly outdoor: number
  readonly horse: number
  readonly waystoneSpawn: number
  readonly tiles: Uint8Array
  readonly tileFlag: Int16Array
  readonly objCount: number
  readonly oKind: Uint8Array
  readonly oX: Float32Array
  readonly oY: Float32Array
  readonly oArg: Int16Array
  readonly oData: Int32Array
  readonly oFlag: Int16Array
  readonly oMinCh: Int8Array
  readonly oMaxCh: Int8Array
  readonly oVariant: Int8Array
  readonly enCount: number
  readonly enKind: Uint8Array
  readonly enX: Float32Array
  readonly enY: Float32Array
  readonly enElite: Uint8Array
  readonly enNight: Uint8Array
  readonly enBoss: Uint8Array
  readonly enMinCh: Int8Array
  readonly enMaxCh: Int8Array
  readonly enVariant: Int8Array
  readonly spawnSet: number
  readonly spawnX: Float32Array
  readonly spawnY: Float32Array
  readonly bossFlag: Int16Array
  readonly bossX: number
  readonly bossY: number
}

export const EXIT_SPAWN_MASK = 255
export const EXIT_CHAPTER_SHIFT = 8

const PERSISTENT_TILES = [TILE_DOOR, TILE_GATE, TILE_BARRICADE, TILE_CRACKED, TILE_SEAL]

function fail(def: AreaDef, message: string): never {
  throw new Error('area ' + def.id + ': ' + message)
}

function center(t: number): number {
  return t * TILE + TILE / 2
}

interface FlagUse { area: number; kind: number; object: boolean }
const flagUses: (FlagUse | undefined)[] = []

function claimFlag(def: AreaDef, flag: number, kind: number, object: boolean): void {
  const prior = flagUses[flag]
  if (prior === undefined) {
    flagUses[flag] = { area: def.id, kind, object }
    return
  }
  if (object || prior.object || prior.area !== def.id || prior.kind !== kind) fail(def, 'flag ' + flag + ' is used twice')
}

function parseArea(def: AreaDef): ParsedArea {
  const h = def.rows.length
  const w = h > 0 ? def.rows[0]!.length : 0
  if (w === 0 || w > MAP_MAX_W || h > MAP_MAX_H) fail(def, 'map size ' + w + 'x' + h + ' out of range')
  for (const key of Object.keys(def.legend)) {
    if (key.length !== 1) fail(def, 'legend key must be one char: ' + key)
    if (TILE_CHARS[key] !== undefined || ENEMY_CHARS[key] !== undefined || (key >= '0' && key <= '9')) fail(def, 'legend shadows a global char: ' + key)
  }
  const tiles = new Uint8Array(w * h)
  const tileFlag = new Int16Array(w * h).fill(-1)
  const objs: { cell: Cell; tx: number; ty: number }[] = []
  const enemies: { cell: Cell; kind: number; tx: number; ty: number }[] = []
  const spawnX = new Float32Array(SPAWN_SLOTS)
  const spawnY = new Float32Array(SPAWN_SLOTS)
  let spawnSet = 0
  for (let ty = 0; ty < h; ty++) {
    const line = def.rows[ty]!
    if (line.length !== w) fail(def, 'row ' + ty + ' has length ' + line.length + ', expected ' + w)
    for (let tx = 0; tx < w; tx++) {
      const ch = line[tx]!
      const i = ty * w + tx
      const tileKind = TILE_CHARS[ch]
      const enemy = ENEMY_CHARS[ch]
      const cell = def.legend[ch]
      if (tileKind !== undefined) tiles[i] = tileKind
      else if (enemy !== undefined) {
        tiles[i] = def.floor
        enemies.push({ cell: {}, kind: enemy, tx, ty })
      } else if (ch >= '0' && ch <= '9') {
        const id = ch.charCodeAt(0) - 48
        if ((spawnSet & (1 << id)) !== 0) fail(def, 'spawn ' + id + ' placed twice')
        spawnSet |= 1 << id
        spawnX[id] = center(tx)
        spawnY[id] = center(ty)
        tiles[i] = def.floor
      } else if (cell !== undefined) {
        tiles[i] = cell.tile ?? def.floor
        if (cell.flag !== undefined && cell.obj === undefined && cell.enemy === undefined) {
          if (!PERSISTENT_TILES.includes(tiles[i]!)) fail(def, 'flagged tile ' + ch + ' is not a persistent kind')
          const f = flagId(cell.flag)
          claimFlag(def, f, tiles[i]!, false)
          tileFlag[i] = f
        }
        if (cell.obj !== undefined) objs.push({ cell, tx, ty })
        if (cell.enemy !== undefined) enemies.push({ cell, kind: cell.enemy, tx, ty })
      } else fail(def, 'unknown char ' + JSON.stringify(ch) + ' at ' + tx + ',' + ty)
      if (PERSISTENT_TILES.includes(tiles[i]!) && tileFlag[i]! < 0) fail(def, 'persistent tile at ' + tx + ',' + ty + ' has no flag')
    }
  }
  if (objs.length > MAX_OBJECTS - LOOT_OBJECT_RESERVE) fail(def, 'too many objects')
  if (enemies.length > MAX_ENEMIES) fail(def, 'too many enemies')
  const n = objs.length
  const oKind = new Uint8Array(n)
  const oX = new Float32Array(n)
  const oY = new Float32Array(n)
  const oArg = new Int16Array(n)
  const oData = new Int32Array(n)
  const oFlag = new Int16Array(n).fill(-1)
  const oMinCh = new Int8Array(n)
  const oMaxCh = new Int8Array(n).fill(CH_COUNT)
  const oVariant = new Int8Array(n).fill(-1)
  for (let k = 0; k < n; k++) {
    const { cell, tx, ty } = objs[k]!
    const kind = cell.obj!
    if (kind <= OBJ_NONE || kind >= OBJ_KIND_COUNT) fail(def, 'bad object kind ' + kind)
    oKind[k] = kind
    oX[k] = center(tx)
    oY[k] = center(ty)
    oArg[k] = cell.arg ?? 0
    oData[k] = cell.data ?? 0
    if (kind === OBJ_EXIT) oData[k] = (cell.data ?? 0) | ((cell.minChapter ?? 0) << EXIT_CHAPTER_SHIFT)
    else oMinCh[k] = cell.minChapter ?? 0
    oMaxCh[k] = cell.maxChapter ?? CH_COUNT
    oVariant[k] = cell.variant ?? -1
    if (cell.flag !== undefined) {
      oFlag[k] = flagId(cell.flag)
      claimFlag(def, oFlag[k]!, kind, true)
    }
    if (cell.argFlag !== undefined) oArg[k] = flagId(cell.argFlag)
    if (TILE_BLOCKS_WALK[tiles[ty * w + tx]!] !== 0 && kind !== OBJ_SWITCH) fail(def, 'object at ' + tx + ',' + ty + ' sits on a blocking tile')
  }
  const m = enemies.length
  const enKind = new Uint8Array(m)
  const enX = new Float32Array(m)
  const enY = new Float32Array(m)
  const enElite = new Uint8Array(m)
  const enNight = new Uint8Array(m)
  const enBoss = new Uint8Array(m)
  const enMinCh = new Int8Array(m)
  const enMaxCh = new Int8Array(m).fill(CH_COUNT)
  const enVariant = new Int8Array(m).fill(-1)
  let bossX = -1
  let bossY = -1
  for (let k = 0; k < m; k++) {
    const { cell, kind, tx, ty } = enemies[k]!
    if (kind < 0 || kind >= ENEMY_KIND_COUNT) fail(def, 'bad enemy kind ' + kind)
    enKind[k] = kind
    enX[k] = center(tx)
    enY[k] = center(ty)
    enElite[k] = cell.elite ?? 0
    enNight[k] = cell.night ?? 0
    enBoss[k] = cell.boss ?? 0
    enMinCh[k] = cell.minChapter ?? 0
    enMaxCh[k] = cell.maxChapter ?? CH_COUNT
    enVariant[k] = cell.variant ?? -1
    if (enBoss[k] !== 0) {
      if (kind < ENEMY_BOSS_FIRST || bossX >= 0) fail(def, 'an area holds at most one boss')
      bossX = enX[k]!
      bossY = enY[k]!
    }
  }
  const bossFlag = Int16Array.from([def.bossFlag ? flagId(def.bossFlag) : -1, def.corruptFlag ? flagId(def.corruptFlag) : -1])
  for (const f of bossFlag) if (f >= 0) claimFlag(def, f, -1, true)
  if ((bossX >= 0) !== (bossFlag[0]! >= 0)) fail(def, 'boss and boss flag must come together')
  for (let id = 0; id < SPAWN_SLOTS; id++) {
    if ((spawnSet & (1 << id)) === 0) continue
    const tx = Math.floor(spawnX[id]! / TILE)
    const ty = Math.floor(spawnY[id]! / TILE)
    if (TILE_BLOCKS_WALK[tiles[ty * w + tx]!] !== 0) fail(def, 'spawn ' + id + ' is not walkable')
  }
  if ((spawnSet & 1) === 0) fail(def, 'spawn 0 is missing')
  if (def.waystoneSpawn >= 0 && (spawnSet & (1 << def.waystoneSpawn)) === 0) fail(def, 'waystone spawn is missing')
  return {
    def, id: def.id, w, h, outdoor: def.outdoor, horse: def.horse, waystoneSpawn: def.waystoneSpawn, tiles, tileFlag,
    objCount: n, oKind, oX, oY, oArg, oData, oFlag, oMinCh, oMaxCh, oVariant,
    enCount: m, enKind, enX, enY, enElite, enNight, enBoss, enMinCh, enMaxCh, enVariant,
    spawnSet, spawnX, spawnY, bossFlag, bossX, bossY,
  }
}

const AREA_DEFS: readonly AreaDef[] = [BRENNHOLD_MAP, VALDMERE_MAP, BARROW_MAP, SALTREACH_MAP, ASHFORGE_MAP, VELLIN_MAP, CITADEL_MAP, SHRINE_MAP]
export const AREAS: readonly ParsedArea[] = AREA_DEFS.map(parseArea)

function tileFlagKind(area: ParsedArea, flag: number): number {
  for (let i = 0; i < area.tileFlag.length; i++) if (area.tileFlag[i] === flag) return area.tiles[i]!
  return -1
}

function linkAreas(): void {
  if (AREAS.length !== AREA_COUNT) throw new Error('every area needs a map')
  for (let id = 0; id < AREA_COUNT; id++) {
    const a = AREAS[id]!
    if (a.id !== id) fail(a.def, 'map listed under the wrong id')
    for (let k = 0; k < a.objCount; k++) {
      const kind = a.oKind[k]!
      if (kind === OBJ_EXIT) {
        const to = a.oArg[k]!
        const spawn = a.oData[k]! & EXIT_SPAWN_MASK
        if (to < 0 || to >= AREA_COUNT || to === AREA_SHRINE) fail(a.def, 'exit to bad area ' + to)
        const last = id === AREA_SHRINE ? spawn + SHRINE_COUNT - 1 : spawn
        if (id === AREA_SHRINE && spawn !== SHRINE_RETURN_SPAWN) fail(a.def, 'shrine exit must return to the shrine spawns')
        for (let sp = spawn; sp <= last; sp++) if ((AREAS[to]!.spawnSet & (1 << sp)) === 0) fail(a.def, 'exit lands on missing spawn ' + sp + ' in area ' + to)
      } else if (kind === OBJ_KEY) {
        const door = a.oArg[k]!
        if (tileFlagKind(a, door) !== TILE_DOOR) fail(a.def, 'key does not open a door in this area')
        DOOR_KEY_FLAG[door] = a.oFlag[k]!
      } else if (kind === OBJ_SWITCH || kind === OBJ_WINDMILL) {
        const gate = a.oArg[k]!
        if (tileFlagKind(a, gate) !== TILE_GATE) fail(a.def, 'switch or windmill does not open a gate in this area')
        GATE_OPENER[gate] = kind
      }
    }
    for (let i = 0; i < a.tileFlag.length; i++) {
      const f = a.tileFlag[i]!
      if (f < 0) continue
      if (a.tiles[i] === TILE_DOOR && DOOR_KEY_FLAG[f]! < 0) fail(a.def, 'door has no key')
      if (a.tiles[i] === TILE_GATE && GATE_OPENER[f] === 0) fail(a.def, 'gate has no switch or windmill')
    }
  }
}

linkAreas()
