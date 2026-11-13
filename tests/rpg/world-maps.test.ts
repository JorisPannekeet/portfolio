import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  AREA_ASHFORGE,
  AREA_BARROW,
  AREA_BRENNHOLD,
  AREA_CITADEL,
  AREA_COUNT,
  AREA_SALTREACH,
  AREA_SHRINE,
  AREA_VALDMERE,
  AREA_VELLIN,
  CH_BARROW,
  CH_CITADEL,
  CH_EMBER,
  CH_FLEE,
  CH_GALE,
  CH_RAID,
  CH_TIDE,
  ELEMENT_EMBER,
  ELEMENT_GALE,
  ELEMENT_STONE,
  ELEMENT_TIDE,
  FLAG_COUNT,
  KEY_GRAPPLE,
  KEY_LONGBOW,
  KEY_WARHAMMER,
  MAP_MAX_H,
  MAP_MAX_W,
  OBJ_CHEST,
  OBJ_EXIT,
  OBJ_KEY,
  OBJ_PEDESTAL,
  OBJ_SWITCH,
  OBJ_WINDMILL,
  SHRINE_COUNT,
  TILE,
  TILE_BARRICADE,
  TILE_BLOCKS_WALK,
  TILE_CHASM,
  TILE_CRACKED,
  TILE_DOOR,
  TILE_GATE,
  TILE_PILLAR_SUNK,
  TILE_SEAL,
  TILE_WATER,
} from '../../src/rpg/sim/content.ts'
import { AREAS, DOOR_KEY_FLAG, EXIT_SPAWN_MASK, GATE_OPENER, type ParsedArea } from '../../src/rpg/sim/areas.ts'
import { FLAG_NAMES } from '../../src/rpg/sim/flags.ts'
import { CHEST_KEY } from '../../src/rpg/sim/loot-tables.ts'
import { charTiles } from './world-helpers.ts'

test('every map parses, is rectangular and fits the map caps', () => {
  assert.equal(AREAS.length, AREA_COUNT)
  for (const a of AREAS) {
    assert.ok(a.w <= MAP_MAX_W && a.h <= MAP_MAX_H, 'area ' + a.id + ' fits')
    for (const row of a.def.rows) assert.equal(row.length, a.w, 'area ' + a.id + ' is rectangular')
  }
})

test('every exit lands on a walkable spawn that is not itself an exit', () => {
  for (const a of AREAS) {
    for (let k = 0; k < a.objCount; k++) {
      if (a.oKind[k] !== OBJ_EXIT) continue
      const to = AREAS[a.oArg[k]!]!
      const first = a.oData[k]! & EXIT_SPAWN_MASK
      const last = a.id === AREA_SHRINE ? first + SHRINE_COUNT - 1 : first
      for (let sp = first; sp <= last; sp++) {
        assert.ok((to.spawnSet & (1 << sp)) !== 0, 'area ' + a.id + ' exit to ' + to.id + ' spawn ' + sp)
        const tx = Math.floor(to.spawnX[sp]! / TILE)
        const ty = Math.floor(to.spawnY[sp]! / TILE)
        assert.equal(TILE_BLOCKS_WALK[to.tiles[ty * to.w + tx]!], 0)
        for (let j = 0; j < to.objCount; j++) {
          if (to.oKind[j] !== OBJ_EXIT) continue
          assert.ok(Math.floor(to.oX[j]! / TILE) !== tx || Math.floor(to.oY[j]! / TILE) !== ty, 'spawn sits on an exit')
        }
      }
    }
  }
})

test('flag ids are unique, fit FLAG_COUNT, and no object flag is reused', () => {
  assert.ok(FLAG_NAMES.length <= FLAG_COUNT)
  assert.equal(new Set(FLAG_NAMES).size, FLAG_NAMES.length)
  const seen = new Set<number>()
  for (const a of AREAS) {
    for (let k = 0; k < a.objCount; k++) {
      const f = a.oFlag[k]!
      if (f < 0) continue
      assert.ok(!seen.has(f), 'object flag ' + FLAG_NAMES[f] + ' used twice')
      seen.add(f)
    }
  }
})

test('flags that already shipped keep their save slots when new ones are added', () => {
  assert.equal(FLAG_NAMES.indexOf('SHRINE_CLEAR_0'), 13)
  assert.equal(FLAG_NAMES.indexOf('SHRINE_CHEST_2'), 18)
  assert.equal(FLAG_NAMES.indexOf('CIT_CHEST'), 66)
})

test('every dungeon has a waystone, a key and door, a pedestal and a boss', () => {
  for (const id of [AREA_BARROW, AREA_SALTREACH, AREA_ASHFORGE, AREA_VELLIN]) {
    const a = AREAS[id]!
    assert.ok(a.bossX >= 0, 'boss in ' + id)
    assert.ok(charTiles(id, 'W').length === 1 && charTiles(id, 'J').length === 1 && charTiles(id, '!').length === 1)
    assert.ok(a.tiles.includes(TILE_DOOR))
  }
  for (let id = 0; id < AREA_COUNT; id++) if (id !== AREA_SHRINE) assert.equal(charTiles(id, 'W').length, 1, 'waystone in ' + id)
})

interface Kit {
  stances: number
  keys: number
  seals: boolean
}

function objectsAt(a: ParsedArea, chapter: number, kind: number): number[] {
  const out: number[] = []
  for (let k = 0; k < a.objCount; k++) {
    if (a.oKind[k] !== kind || a.oVariant[k] === 1) continue
    if (chapter < a.oMinCh[k]! || chapter > a.oMaxCh[k]!) continue
    if (kind === OBJ_EXIT && chapter < a.oData[k]! >> 8) continue
    out.push(k)
  }
  return out
}

function tileOf(a: ParsedArea, k: number): number {
  return Math.floor(a.oY[k]! / TILE) * a.w + Math.floor(a.oX[k]! / TILE)
}

function solve(area: number, spawn: number, chapter: number, start: Kit, grantShards = true): { reached: Uint8Array; kit: Kit } {
  const a = AREAS[area]!
  const kit = { ...start }
  const doors = new Set<number>()
  const bossTile = a.bossX >= 0 ? Math.floor(a.bossY / TILE) * a.w + Math.floor(a.bossX / TILE) : -1
  const open = (i: number): boolean => {
    const t = a.tiles[i]!
    if (TILE_BLOCKS_WALK[t] === 0) return true
    const f = a.tileFlag[i]!
    if (t === TILE_PILLAR_SUNK) return (kit.stances & (1 << ELEMENT_STONE)) !== 0
    if (t === TILE_WATER) return (kit.stances & (1 << ELEMENT_TIDE)) !== 0
    if (t === TILE_BARRICADE) return (kit.stances & (1 << ELEMENT_EMBER)) !== 0
    if (t === TILE_CRACKED) return (kit.keys & KEY_WARHAMMER) !== 0
    if (t === TILE_CHASM) return (kit.keys & KEY_GRAPPLE) !== 0
    if (t === TILE_SEAL) return kit.seals
    if (t === TILE_DOOR) return doors.has(f)
    if (t === TILE_GATE) return GATE_OPENER[f] === OBJ_WINDMILL ? (kit.stances & (1 << ELEMENT_GALE)) !== 0 : GATE_OPENER[f] === OBJ_SWITCH && (kit.keys & KEY_LONGBOW) !== 0
    return false
  }
  for (;;) {
    const reached = new Uint8Array(a.w * a.h)
    const sx = Math.floor(a.spawnX[spawn]! / TILE)
    const sy = Math.floor(a.spawnY[spawn]! / TILE)
    const queue = [sy * a.w + sx]
    reached[queue[0]!] = 1
    while (queue.length > 0) {
      const cur = queue.pop()!
      const x = cur % a.w
      const y = (cur - x) / a.w
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= a.w || ny >= a.h) continue
        const n = ny * a.w + nx
        if (reached[n] === 0 && open(n)) {
          reached[n] = 1
          queue.push(n)
        }
      }
    }
    const before = JSON.stringify([kit, [...doors]])
    for (const k of objectsAt(a, chapter, OBJ_CHEST)) if (reached[tileOf(a, k)]) kit.keys |= CHEST_KEY[a.oArg[k]!]!
    for (const k of objectsAt(a, chapter, OBJ_KEY)) if (reached[tileOf(a, k)]) doors.add(a.oArg[k]!)
    for (const k of objectsAt(a, chapter, OBJ_PEDESTAL)) if (grantShards && reached[tileOf(a, k)] && reached[bossTile]) kit.stances |= 1 << a.oArg[k]!
    if (JSON.stringify([kit, [...doors]]) === before) return { reached, kit }
  }
}

function reachesChar(area: number, reached: Uint8Array, ch: string): boolean {
  const w = AREAS[area]!.w
  const tiles = charTiles(area, ch)
  assert.ok(tiles.length > 0, 'char ' + ch + ' exists in area ' + area)
  return tiles.some(([x, y]) => reached[y * w + x] === 1)
}

const STONE = 1 << ELEMENT_STONE
const TIDE = 1 << ELEMENT_TIDE
const EMBER = 1 << ELEMENT_EMBER
const GALE = 1 << ELEMENT_GALE
const kitAt: Record<number, Kit> = {
  [CH_RAID]: { stances: 0, keys: 0, seals: false },
  [CH_FLEE]: { stances: STONE, keys: 0, seals: false },
  [CH_BARROW]: { stances: STONE, keys: 0, seals: false },
  [CH_TIDE]: { stances: STONE, keys: KEY_WARHAMMER, seals: false },
  [CH_EMBER]: { stances: STONE | TIDE, keys: KEY_WARHAMMER | KEY_GRAPPLE, seals: false },
  [CH_GALE]: { stances: STONE | TIDE | EMBER, keys: KEY_WARHAMMER | KEY_GRAPPLE | KEY_LONGBOW, seals: false },
  [CH_CITADEL]: { stances: STONE | TIDE | EMBER | GALE, keys: KEY_WARHAMMER | KEY_GRAPPLE | KEY_LONGBOW, seals: true },
}

test('Brennhold: the child is reachable in the raid and the road opens once Maren is heard', () => {
  const raid = solve(AREA_BRENNHOLD, 0, CH_RAID, kitAt[CH_RAID]!)
  assert.ok(reachesChar(AREA_BRENNHOLD, raid.reached, 'A'))
  assert.ok(reachesChar(AREA_BRENNHOLD, raid.reached, 'M'))
  assert.equal(objectsAt(AREAS[AREA_BRENNHOLD]!, CH_FLEE, OBJ_EXIT).length, 0, 'the road is closed before Maren speaks')
  assert.equal(objectsAt(AREAS[AREA_BRENNHOLD]!, CH_BARROW, OBJ_EXIT).length, 2)
  assert.ok(reachesChar(AREA_BRENNHOLD, solve(AREA_BRENNHOLD, 0, CH_BARROW, kitAt[CH_BARROW]!).reached, 'E'))
})

const DUNGEONS: [number, number, number, number][] = [
  [AREA_BARROW, CH_BARROW, ELEMENT_STONE, KEY_WARHAMMER],
  [AREA_SALTREACH, CH_TIDE, ELEMENT_TIDE, KEY_GRAPPLE],
  [AREA_ASHFORGE, CH_EMBER, ELEMENT_EMBER, KEY_LONGBOW],
  [AREA_VELLIN, CH_GALE, ELEMENT_GALE, 0],
]

for (const [area, chapter, element, keyItem] of DUNGEONS) {
  test('dungeon ' + area + ' is solvable with only what the player owns in chapter ' + chapter, () => {
    const start = kitAt[chapter]!
    if (element !== ELEMENT_STONE) assert.equal(start.stances & (1 << element), 0, 'the dungeon element is not owned on entry')
    const { reached, kit } = solve(area, 0, chapter, start)
    for (const ch of ['Q', 'K', '!', 'E', '$', '&']) assert.ok(reachesChar(area, reached, ch), 'reaches ' + ch)
    assert.ok((kit.stances & (1 << element)) !== 0, 'the shard grants the stance')
    if (keyItem !== 0) assert.ok((kit.keys & keyItem) !== 0, 'the key item chest is reachable')
  })

  test('dungeon ' + area + ' boss, key item chest and pedestal are reachable without its own element', () => {
    const { reached, kit } = solve(area, 0, chapter, kitAt[chapter]!, false)
    assert.equal(kit.stances, kitAt[chapter]!.stances)
    assert.equal(reached[tileOfBoss(area)], 1)
    for (const ch of ['Q', '!']) assert.ok(reachesChar(area, reached, ch), 'reaches ' + ch)
  })
}

test('the corrupted reward chests are reachable in their variant', () => {
  for (const area of [AREA_BARROW, AREA_SALTREACH]) {
    const { reached } = solve(area, 0, CH_EMBER, kitAt[CH_EMBER]!)
    assert.ok(reachesChar(area, reached, '@'))
  }
})

const HUB_STEPS: [number, string[], string[]][] = [
  [CH_BARROW, ['U', 'M'], ['V', 'Y', 'Z', 'O', 'j', 'l', 'q', 'x']],
  [CH_TIDE, ['V', 'j'], ['Y', 'Z', 'O', 'l', 'q', 'x']],
  [CH_EMBER, ['Y', 'l'], ['Z', 'O', 'q', 'x']],
  [CH_GALE, ['Z', 'q'], ['O', 'x']],
  [CH_CITADEL, ['O', 'M', 'U', 'V', 'Y', 'Z', 'x'], []],
]

for (const [chapter, open, shut] of HUB_STEPS) {
  test('Valdmere in chapter ' + chapter + ' opens exactly the next road', () => {
    const { reached } = solve(AREA_VALDMERE, 0, chapter, kitAt[chapter]!)
    for (const ch of open) assert.ok(reachesChar(AREA_VALDMERE, reached, ch), 'reaches ' + ch)
    for (const ch of shut) assert.ok(!reachesChar(AREA_VALDMERE, reached, ch), 'does not reach ' + ch)
  })
}

test('the Citadel gauntlet reaches Varek with all four elements and not with three', () => {
  assert.equal(solve(AREA_CITADEL, 0, CH_CITADEL, kitAt[CH_CITADEL]!).reached[tileOfBoss(AREA_CITADEL)], 1)
  assert.equal(solve(AREA_CITADEL, 0, CH_CITADEL, { ...kitAt[CH_CITADEL]!, stances: STONE | TIDE | EMBER }).reached[tileOfBoss(AREA_CITADEL)], 0)
})

function tileOfBoss(area: number): number {
  const a = AREAS[area]!
  return Math.floor(a.bossY / TILE) * a.w + Math.floor(a.bossX / TILE)
}

test('every door has a key and every gate an opener in the same area', () => {
  for (const a of AREAS) {
    for (let i = 0; i < a.tiles.length; i++) {
      const f = a.tileFlag[i]!
      if (a.tiles[i] === TILE_DOOR) assert.ok(DOOR_KEY_FLAG[f]! >= 0)
      if (a.tiles[i] === TILE_GATE) assert.ok(GATE_OPENER[f] === OBJ_WINDMILL || GATE_OPENER[f] === OBJ_SWITCH)
    }
  }
})
