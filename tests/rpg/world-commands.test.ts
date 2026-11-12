import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  AREA_ASHFORGE,
  AREA_BARROW,
  AREA_COUNT,
  AREA_SHRINE,
  AREA_VALDMERE,
  CH_GALE,
  CMD_HORN,
  CMD_RESPAWN,
  COMMAND_OPCODE_MASK,
  COMMAND_ARG_MASK,
  ELEMENT_COUNT,
  HORN_TARGET_SHIFT,
  INV_CAP,
  ITEM_GREATSWORD,
  ITEM_MAX_LEVEL,
  MAX_LEVEL,
  MELODY_ROADS,
  MELODY_STABLE,
  NODE_COUNT,
  OBJ_HORSE,
  PHASE_DEAD,
  PHASE_PLAYING,
  SLOT_COUNT,
  TIER_EPIC,
  TIER_RARE,
  armorBase,
  itemSlot,
} from '../../src/rpg/sim/content.ts'
import { AREAS } from '../../src/rpg/sim/areas.ts'
import { applyCommand } from '../../src/rpg/sim/commands.hot.ts'
import { continueGame } from '../../src/rpg/sim/game.ts'
import { grantItem } from '../../src/rpg/sim/loot.hot.ts'
import { findPath, puzzleHint, HINT_KEY_ITEM } from '../../src/rpg/sim/nav.ts'
import { restoreProgress, serializeProgress, SAVE_FIELDS } from '../../src/rpg/sim/progress.ts'
import { recomputeStats } from '../../src/rpg/sim/stats.hot.ts'
import { createState, type State } from '../../src/rpg/sim/state.ts'
import { loadArea } from '../../src/rpg/sim/world.hot.ts'
import { charCenter, finishDialog, freshGame, objectsOf, standAt, tileIndexAt } from './world-helpers.ts'

function midGame(): State {
  const s = freshGame(21)
  s.chapter = CH_GALE
  s.stancesUnlocked = 7
  s.shards = 7
  s.keyItems = 7
  s.melodies = 7
  s.waystones = 0b0111111
  s.level = 10
  s.skillPoints = 9
  s.gold = 5000
  s.ore = 400
  s.runes.fill(2)
  for (let n = 0; n < 8; n++) grantItem(s, n % 2 === 0 ? ITEM_GREATSWORD : armorBase(n % 5, 1 + (n % 3)), n % 2 === 0 ? TIER_EPIC : TIER_RARE)
  loadArea(s, AREA_VALDMERE, 6)
  s.nearForge = 1
  return s
}

function assertSane(s: State, where: string): void {
  assert.ok(s.phase >= 0 && s.phase <= 3, where)
  assert.ok(s.gold >= 0 && s.ore >= 0 && s.skillPoints >= 0, where)
  assert.ok(s.level >= 1 && s.level <= MAX_LEVEL, where)
  assert.ok(s.area >= 0 && s.area < AREA_COUNT, where)
  for (let slot = 0; slot < SLOT_COUNT; slot++) {
    const i = s.equipped[slot]!
    if (i >= 0) assert.equal(itemSlot(s.invBase[i]!), slot, where)
  }
  for (let i = 0; i < INV_CAP; i++) assert.ok(s.invLevel[i]! <= ITEM_MAX_LEVEL, where)
  for (let e = 0; e < ELEMENT_COUNT; e++) assert.ok(s.runes[e]! >= 0, where)
  for (let n = 0; n < NODE_COUNT; n++) assert.ok(s.nodes[n]! <= 1, where)
  assert.ok(Number.isFinite(s.statAttack) && Number.isFinite(s.playerX), where)
}

test('every opcode with every arg on a mid-game state never throws or leaves an invalid state', () => {
  const s = midGame()
  for (let op = 0; op <= COMMAND_OPCODE_MASK; op++) {
    for (let arg = 0; arg <= COMMAND_ARG_MASK; arg++) {
      applyCommand(s, op, arg)
      if (s.phase === PHASE_DEAD || s.phase > PHASE_PLAYING) s.phase = PHASE_PLAYING
      s.nearForge = 1
    }
    assertSane(s, 'opcode ' + op)
    const t = createState()
    assert.equal(restoreProgress(t, serializeProgress(s)), true, 'opcode ' + op + ' keeps the save valid')
  }
})

test('respawn only works when dead and reloads the checkpoint at full health', () => {
  const s = midGame()
  s.checkpointArea = AREA_BARROW
  s.checkpointSpawn = 1
  applyCommand(s, CMD_RESPAWN, 0)
  assert.equal(s.area, AREA_VALDMERE)
  s.phase = PHASE_DEAD
  s.hp = 0
  applyCommand(s, CMD_RESPAWN, 0)
  assert.equal(s.phase, PHASE_PLAYING)
  assert.equal(s.area, AREA_BARROW)
  assert.equal(s.hp, s.statMaxHp)
})

function persistent(s: State): unknown[] {
  return SAVE_FIELDS.map(f => {
    const v = s[f.key]
    return ArrayBuffer.isView(v) ? [...(v as Uint8Array)] : v
  })
}

test('save round trip restores every persistent field on a fresh state', () => {
  const s = midGame()
  s.flags[5] = 1
  s.nodes[16] = 1
  s.clock = 1234
  s.checkpointArea = AREA_ASHFORGE
  s.checkpointSpawn = 1
  const save = serializeProgress(s)
  const t = createState()
  assert.equal(restoreProgress(t, save), true)
  assert.deepEqual(persistent(t), persistent(s))
  recomputeStats(s)
  assert.equal(t.statAttack, s.statAttack)
  const u = createState()
  assert.equal(continueGame(u, 4, save), true)
  assert.equal(u.area, AREA_ASHFORGE)
  assert.equal(u.hp, u.statMaxHp)
})

test('corrupted saves are rejected without touching the state', () => {
  const s = midGame()
  const good = JSON.parse(serializeProgress(s)) as number[]
  const bad: string[] = [
    '',
    'not json',
    '{}',
    JSON.stringify([2, ...good.slice(1)]),
    JSON.stringify(good.slice(0, -1)),
    JSON.stringify([...good, 0]),
    JSON.stringify(good.map((v, i) => (i === 1 ? 99 : v))),
    JSON.stringify(good.map((v, i) => (i === 9 ? 0.5 : v))),
    JSON.stringify(good.map((v, i) => (i === 9 ? -1 : v))),
    JSON.stringify(good.map((v, i) => (i === 1 ? '1' : v))),
  ]
  const equippedAt = 1 + 15 + 256 + 20 + 4
  bad.push(JSON.stringify(good.map((v, i) => (i === equippedAt ? 23 : v))))
  bad.push(JSON.stringify(good.map((v, i) => (i === 14 ? AREA_SHRINE : i === 15 ? 5 : v))))
  for (const save of bad) {
    const t = midGame()
    const before = persistent(t)
    assert.equal(restoreProgress(t, save), false, save.slice(0, 40))
    assert.deepEqual(persistent(t), before)
  }
  const fresh = createState()
  assert.equal(continueGame(fresh, 3, 'garbage'), false)
  assert.equal(fresh.chapter, 0)
})

test('the stable melody calls the horse to the player in the hub only', () => {
  const s = midGame()
  standAt(s, 700, 480)
  applyCommand(s, CMD_HORN, MELODY_STABLE)
  const horse = objectsOf(s, OBJ_HORSE)[0]!
  assert.ok(Math.abs(s.objX[horse]! - 720) <= 20 && s.objY[horse] === 480)
  loadArea(s, AREA_BARROW, 0)
  const head = s.evHead
  applyCommand(s, CMD_HORN, MELODY_STABLE)
  assert.equal(s.evHead, head, 'no horse in dungeons')
})

test('the roads melody warps only to attuned waystones', () => {
  const s = midGame()
  s.waystones = 1 << AREA_VALDMERE
  applyCommand(s, CMD_HORN, MELODY_ROADS | (AREA_ASHFORGE << HORN_TARGET_SHIFT))
  assert.equal(s.area, AREA_VALDMERE)
  s.waystones |= 1 << AREA_ASHFORGE
  applyCommand(s, CMD_HORN, MELODY_ROADS | (AREA_ASHFORGE << HORN_TARGET_SHIFT))
  assert.equal(s.area, AREA_ASHFORGE)
  assert.equal(s.checkpointArea, AREA_ASHFORGE)
  const ws = AREAS[AREA_ASHFORGE]!.waystoneSpawn
  assert.equal(s.playerX, AREAS[AREA_ASHFORGE]!.spawnX[ws])
  s.melodies = 0
  applyCommand(s, CMD_HORN, MELODY_ROADS | (AREA_VALDMERE << HORN_TARGET_SHIFT))
  assert.equal(s.area, AREA_ASHFORGE, 'an unknown melody does nothing')
})

test('findPath walks every map from spawn 0 to its waystone or exit over walkable tiles', () => {
  const s = freshGame()
  const out = new Int32Array(4096)
  for (let area = 0; area < AREA_COUNT; area++) {
    s.chapter = CH_GALE
    loadArea(s, area, 0)
    finishDialog(s)
    const a = AREAS[area]!
    const target = a.waystoneSpawn >= 0 ? charCenter(area, 'W') : charCenter(area, 'Z')
    const n = findPath(s, a.spawnX[0]!, a.spawnY[0]!, target[0], target[1], out)
    assert.ok(n > 1, 'path found in area ' + area)
    assert.equal(out[0], tileIndexAt(s, a.spawnX[0]!, a.spawnY[0]!))
    assert.equal(out[n - 1], tileIndexAt(s, target[0], target[1]))
    for (let k = 1; k < n; k++) {
      const d = Math.abs(out[k]! - out[k - 1]!)
      assert.ok(d === 1 || d === s.mapW, 'steps are adjacent')
    }
  }
  loadArea(s, AREA_BARROW, 0)
  const [bx, by] = charCenter(AREA_BARROW, 'Q')
  assert.equal(findPath(s, AREAS[AREA_BARROW]!.spawnX[0]!, AREAS[AREA_BARROW]!.spawnY[0]!, bx, by, out), 0, 'the locked chest room is unreachable')
})

test('puzzleHint names the element or key item that opens a blocking tile', () => {
  const s = freshGame()
  loadArea(s, AREA_VALDMERE, 0)
  const [cx, cy] = charCenter(AREA_VALDMERE, 'C')
  assert.equal(puzzleHint(s, tileIndexAt(s, cx, cy)), HINT_KEY_ITEM + 1)
  const [gx, gy] = charCenter(AREA_VALDMERE, 'G')
  assert.equal(puzzleHint(s, tileIndexAt(s, gx, gy)), HINT_KEY_ITEM + 4)
  const [wx, wy] = charCenter(AREA_VALDMERE, '~')
  assert.equal(puzzleHint(s, tileIndexAt(s, wx, wy)), 1)
  assert.equal(puzzleHint(s, tileIndexAt(s, AREAS[AREA_VALDMERE]!.spawnX[0]!, AREAS[AREA_VALDMERE]!.spawnY[0]!)), -1)
  assert.equal(puzzleHint(s, -5), -1)
  loadArea(s, AREA_BARROW, 0)
  const [px, py] = charCenter(AREA_BARROW, 'p')
  assert.equal(puzzleHint(s, tileIndexAt(s, px, py)), 0)
})
