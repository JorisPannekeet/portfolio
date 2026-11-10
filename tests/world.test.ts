import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  BEACONS_PER_ZONE,
  BEACON_CAPTURE_TICKS,
  BEACON_MIN_ORIGIN_DIST,
  BEACON_MIN_SPACING,
  BEACON_RADIUS,
  BEACON_REWARD_HEAL,
  BOSS_SPAWN_RESERVE,
  BOSS_TICKS,
  ENEMY_BOSS_FIRST,
  ENEMY_GRUNT,
  EVENT_CAP,
  EV_BEACON,
  EV_BOSS,
  EV_HEAL,
  EV_KILL,
  EV_ZONE,
  INPUT_CHOICE,
  HUB_RADIUS,
  INPUT_DIRECTIONS,
  INTRO_TICKS,
  INPUT_IDLE,
  LAIR_MIN_BEACON_DIST,
  LAIR_MIN_ORIGIN_DIST,
  LAIR_RADIUS,
  MAX_ENEMIES,
  MAX_POIS,
  PASSIVE_COUNT,
  PASSIVE_HP_PER_LEVEL,
  PASSIVE_MAX_LEVEL,
  PASSIVE_REACTOR,
  PASSIVE_SLOTS,
  PASSIVE_TARGETING,
  PHASE_LEVEL_UP,
  PHASE_PLAYING,
  POI_BEACON,
  POI_BORDER_MARGIN,
  POI_EDGE_MARGIN,
  POI_LAIR,
  REPAIR_HEAL,
  SPAWN_RADIUS,
  START_X,
  START_Y,
  WORLD_HALF,
  ZONE_COUNT,
  ZONE_HANGAR,
} from '../src/game/sim/content.ts'
import { spawnEnemy } from '../src/game/sim/enemies.hot.ts'
import { createState, resetState, type State } from '../src/game/sim/state.ts'
import { step } from '../src/game/sim/step.hot.ts'
import { zoneAt } from '../src/game/sim/world.hot.ts'
import { isTerminal, surface } from './harness.ts'

interface Event {
  readonly type: number
  readonly x: number
  readonly y: number
  readonly a: number
  readonly b: number
}

function freshState(seed: number): State {
  const s = createState()
  surface(s, seed)
  s.maxHp = 1e9
  s.hp = 1e9
  s.xpNext = 1e9
  return s
}

function eventsSince(s: State, head: number, type: number): Event[] {
  const found: Event[] = []
  for (let n = head; n < s.evHead; n++) {
    const k = n % EVENT_CAP
    if (s.evType[k] === type) found.push({ type, x: s.evX[k]!, y: s.evY[k]!, a: s.evA[k]!, b: s.evB[k]! })
  }
  return found
}

function layout(seed: number, s = createState()): number[] {
  surface(s, seed)
  const rows: number[] = [s.poiCount]
  for (let i = 0; i < s.poiCount; i++) rows.push(s.poiKind[i]!, s.poiZone[i]!, s.poiX[i]!, s.poiY[i]!, s.poiDone[i]!, s.poiProgress[i]!)
  return rows
}

function poisOf(s: State, kind: number): number[] {
  const found: number[] = []
  for (let i = 0; i < s.poiCount; i++) if (s.poiKind[i] === kind) found.push(i)
  return found
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
}

function placePlayer(s: State, x: number, y: number): void {
  s.px = x
  s.py = y
  s.ppx = x
  s.ppy = y
  s.zone = zoneAt(x, y)
}

function bossesAlive(s: State): number[] {
  const types: number[] = []
  for (let i = 0; i < s.enemyCount; i++) if (s.eType[i]! >= ENEMY_BOSS_FIRST && s.eHp[i]! > 0) types.push(s.eType[i]!)
  return types
}

test('the same seed lays out the same points of interest and other seeds differ', () => {
  assert.deepEqual(layout(5), layout(5))
  assert.notDeepEqual(layout(5), layout(6))
  const used = createState()
  surface(used, 99)
  placePlayer(used, used.poiX[0]!, used.poiY[0]!)
  for (let t = 0; t < BEACON_CAPTURE_TICKS; t++) step(used, INPUT_IDLE)
  assert.equal(used.poiDone[0], 1)
  assert.deepEqual(layout(5, used), layout(5))
})

test('every layout over 200 seeds obeys the placement rules', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const s = createState()
    surface(s, seed)
    assert.equal(s.poiCount, MAX_POIS)
    const beacons = poisOf(s, POI_BEACON)
    const lairs = poisOf(s, POI_LAIR)
    assert.equal(beacons.length, ZONE_COUNT * BEACONS_PER_ZONE)
    assert.equal(lairs.length, ZONE_COUNT)
    for (let zone = 0; zone < ZONE_COUNT; zone++) {
      assert.equal(beacons.filter(i => s.poiZone[i] === zone).length, BEACONS_PER_ZONE, `seed ${seed} zone ${zone} beacons`)
      assert.equal(lairs.filter(i => s.poiZone[i] === zone).length, 1, `seed ${seed} zone ${zone} lair`)
    }
    for (let i = 0; i < s.poiCount; i++) {
      const x = s.poiX[i]!
      const y = s.poiY[i]!
      assert.equal(zoneAt(x, y), s.poiZone[i], `seed ${seed} poi ${i} lies in its zone`)
      for (const v of [x, y]) {
        assert.ok(Math.abs(v) >= POI_BORDER_MARGIN, `seed ${seed} poi ${i} keeps off the zone border`)
        assert.ok(Math.abs(v) <= WORLD_HALF - POI_EDGE_MARGIN, `seed ${seed} poi ${i} keeps off the world edge`)
      }
      assert.equal(s.poiDone[i], 0)
      assert.equal(s.poiProgress[i], 0)
    }
    for (const b of beacons) {
      assert.ok(distance(s.poiX[b]!, s.poiY[b]!, START_X, START_Y) >= BEACON_MIN_ORIGIN_DIST, `seed ${seed} beacon ${b} near the start`)
      for (const c of beacons) {
        if (c > b) assert.ok(distance(s.poiX[b]!, s.poiY[b]!, s.poiX[c]!, s.poiY[c]!) >= BEACON_MIN_SPACING, `seed ${seed} beacons ${b} and ${c} too close`)
      }
    }
    for (const l of lairs) {
      assert.ok(distance(s.poiX[l]!, s.poiY[l]!, START_X, START_Y) >= LAIR_MIN_ORIGIN_DIST, `seed ${seed} lair ${l} near the start`)
      for (const b of beacons) {
        assert.ok(distance(s.poiX[l]!, s.poiY[l]!, s.poiX[b]!, s.poiY[b]!) >= LAIR_MIN_BEACON_DIST, `seed ${seed} lair ${l} near beacon ${b}`)
      }
    }
  }
})

test('standing on a beacon captures it in exactly the capture time and grants one passive level', () => {
  const s = freshState(12)
  const beacon = poisOf(s, POI_BEACON)[0]!
  placePlayer(s, s.poiX[beacon]!, s.poiY[beacon]!)
  const before = Array.from(s.passiveLevel)
  const head = s.evHead
  const startTick = s.tick
  for (let t = 1; t < BEACON_CAPTURE_TICKS; t++) {
    step(s, INPUT_IDLE)
    assert.equal(s.poiDone[beacon], 0, `captured early at tick ${t}`)
    assert.ok(Math.abs(s.poiProgress[beacon]! - t / BEACON_CAPTURE_TICKS) < 1e-6)
  }
  assert.deepEqual(Array.from(s.passiveLevel), before)
  step(s, INPUT_IDLE)
  assert.equal(s.tick - startTick, BEACON_CAPTURE_TICKS)
  assert.equal(s.poiDone[beacon], 1)
  assert.equal(s.poiProgress[beacon], 1)
  const events = eventsSince(s, head, EV_BEACON)
  assert.equal(events.length, 1)
  const [event] = events
  assert.equal(event!.x, s.poiX[beacon])
  assert.equal(event!.y, s.poiY[beacon])
  assert.equal(event!.a, PASSIVE_TARGETING, 'the rifle makes its paired passive the preferred reward')
  assert.equal(event!.b, 1)
  const gained = Array.from(s.passiveLevel).map((level, p) => level - before[p]!)
  assert.deepEqual(gained, Array.from({ length: PASSIVE_COUNT }, (_, p) => (p === event!.a ? 1 : 0)))
})

test('progress drains at half the rate while the player is away', () => {
  const s = freshState(13)
  const beacon = poisOf(s, POI_BEACON)[1]!
  const x = s.poiX[beacon]!
  const y = s.poiY[beacon]!
  placePlayer(s, x, y)
  const half = BEACON_CAPTURE_TICKS / 2
  for (let t = 0; t < half; t++) step(s, INPUT_IDLE)
  assert.ok(Math.abs(s.poiProgress[beacon]! - 0.5) < 1e-6)
  placePlayer(s, x - Math.sign(x) * (BEACON_RADIUS + 30), y)
  const away = 60
  for (let t = 0; t < away; t++) step(s, INPUT_IDLE)
  assert.ok(Math.abs(s.poiProgress[beacon]! - (0.5 - away / (2 * BEACON_CAPTURE_TICKS))) < 1e-6)
  for (let t = 0; t < 2 * BEACON_CAPTURE_TICKS; t++) step(s, INPUT_IDLE)
  assert.equal(s.poiProgress[beacon], 0)
  assert.equal(s.poiDone[beacon], 0)
})

test('a captured beacon never grants twice', () => {
  const s = freshState(14)
  const beacon = poisOf(s, POI_BEACON)[2]!
  placePlayer(s, s.poiX[beacon]!, s.poiY[beacon]!)
  const head = s.evHead
  for (let t = 0; t < BEACON_CAPTURE_TICKS; t++) step(s, INPUT_IDLE)
  const after = Array.from(s.passiveLevel)
  for (let t = 0; t < 3 * BEACON_CAPTURE_TICKS; t++) step(s, INPUT_IDLE)
  assert.equal(eventsSince(s, head, EV_BEACON).length, 1)
  assert.deepEqual(Array.from(s.passiveLevel), after)
  assert.equal(s.poiDone[beacon], 1)
  assert.equal(s.poiProgress[beacon], 1)
})

test('with no legal passive a beacon heals instead and reports the heal reward', () => {
  const s = freshState(15)
  for (let p = 0; p < PASSIVE_SLOTS; p++) s.passiveLevel[p] = PASSIVE_MAX_LEVEL[p]!
  s.maxHp = 100
  s.hp = 10
  const beacon = poisOf(s, POI_BEACON)[3]!
  placePlayer(s, s.poiX[beacon]!, s.poiY[beacon]!)
  const head = s.evHead
  for (let t = 0; t < BEACON_CAPTURE_TICKS; t++) step(s, INPUT_IDLE)
  const [event] = eventsSince(s, head, EV_BEACON)
  assert.equal(event!.a, BEACON_REWARD_HEAL)
  assert.equal(eventsSince(s, head, EV_HEAL).length, 1)
  assert.ok(s.hp >= 10 + REPAIR_HEAL - 1)
})

test('a Reactor Core level from a beacon raises max armor like a level-up does', () => {
  const s = freshState(16)
  let filled = 0
  for (let p = 0; p < PASSIVE_COUNT && filled < PASSIVE_SLOTS - 1; p++) {
    if (p === PASSIVE_REACTOR) continue
    s.passiveLevel[p] = PASSIVE_MAX_LEVEL[p]!
    filled++
  }
  s.passiveLevel[PASSIVE_REACTOR] = 1
  s.maxHp = 100
  s.hp = 50
  const beacon = poisOf(s, POI_BEACON)[4]!
  placePlayer(s, s.poiX[beacon]!, s.poiY[beacon]!)
  for (let t = 0; t < BEACON_CAPTURE_TICKS; t++) step(s, INPUT_IDLE)
  assert.equal(s.passiveLevel[PASSIVE_REACTOR], 2)
  assert.equal(s.maxHp, 100 + PASSIVE_HP_PER_LEVEL)
  assert.ok(s.hp >= 50 + PASSIVE_HP_PER_LEVEL)
})

for (let zone = 0; zone < ZONE_COUNT; zone++) {
  test(`walking into the zone ${zone} lair releases that zone's boss at the lair`, () => {
    const s = freshState(20 + zone)
    const lair = poisOf(s, POI_LAIR).find(i => s.poiZone[i] === zone)!
    const lx = s.poiX[lair]!
    const ly = s.poiY[lair]!
    const side = lx > 0 ? -1 : 1
    placePlayer(s, lx + side * (LAIR_RADIUS + 3), ly)
    const towardLair = side < 0 ? 1 : 1 + INPUT_DIRECTIONS / 2
    const head = s.evHead
    const startTick = s.tick
    while (s.poiDone[lair] === 0) {
      step(s, towardLair)
      assert.ok(s.tick - startTick < 10, 'the lair should trigger within a few steps')
    }
    assert.ok(distance(s.px, s.py, lx, ly) <= LAIR_RADIUS)
    const events = eventsSince(s, head, EV_BOSS)
    assert.equal(events.length, 1)
    assert.equal(events[0]!.a, zone)
    assert.equal(events[0]!.x, lx)
    assert.equal(events[0]!.y, ly)
    assert.deepEqual(bossesAlive(s), [ENEMY_BOSS_FIRST + zone])
    for (let t = 0; t < 30; t++) step(s, towardLair)
    assert.equal(eventsSince(s, head, EV_BOSS).length, 1)
  })
}

test('each boss time releases one more boss from the nearest lair when no lair is visited', () => {
  const s = freshState(30)
  const head = s.evHead
  let released = 0
  for (const at of BOSS_TICKS) {
    const lairs = poisOf(s, POI_LAIR).filter(i => s.poiDone[i] === 0)
    const nearest = lairs.reduce((best, i) => (distance(s.poiX[i]!, s.poiY[i]!, s.px, s.py) < distance(s.poiX[best]!, s.poiY[best]!, s.px, s.py) ? i : best))
    s.tick = at - 1
    step(s, INPUT_IDLE)
    released++
    const events = eventsSince(s, head, EV_BOSS)
    assert.equal(events.length, released)
    const last = events[events.length - 1]!
    assert.equal(last.a, s.poiZone[nearest])
    assert.equal(s.poiDone[nearest], 1)
    assert.ok(Math.abs(distance(last.x, last.y, s.px, s.py) - SPAWN_RADIUS) < 2)
    assert.equal(bossesAlive(s).length, released)
    assert.equal(poisOf(s, POI_LAIR).filter(i => s.poiDone[i] === 1).length, released)
  }
})

test('killing a boss opens a level-up pick without gaining a level', () => {
  const s = freshState(31)
  s.xpNext = 5
  const type = ENEMY_BOSS_FIRST + 1
  const boss = spawnEnemy(s, type, s.px + 120, s.py)
  s.eHp[boss] = 1
  const head = s.evHead
  while (eventsSince(s, head, EV_KILL).every(e => e.a !== type)) {
    step(s, INPUT_IDLE)
    assert.ok(s.tick < 200, 'the rifle should kill the boss')
  }
  assert.equal(s.phase, PHASE_LEVEL_UP)
  assert.equal(s.level, 1)
  assert.equal(s.bossKills, 1)
  assert.ok(s.choiceCount > 0)
  step(s, INPUT_CHOICE)
  assert.equal(s.phase, PHASE_PLAYING)
  assert.equal(s.level, 1)
})

test('the boss bar follows the nearest of several bosses', () => {
  const s = freshState(32)
  const far = spawnEnemy(s, ENEMY_BOSS_FIRST + 2, s.px + 250, s.py)
  const near = spawnEnemy(s, ENEMY_BOSS_FIRST + 1, s.px - 60, s.py)
  step(s, INPUT_IDLE)
  assert.notEqual(s.eMaxHp[far], s.eMaxHp[near])
  assert.equal(s.bossMaxHp, s.eMaxHp[near])
  s.ex[near] = s.px - 400
  s.ey[near] = s.py
  step(s, INPUT_IDLE)
  assert.equal(s.bossMaxHp, s.eMaxHp[far])
})

test('despawn and full-pool recycling never relocate a boss', () => {
  const s = freshState(33)
  const boss = spawnEnemy(s, ENEMY_BOSS_FIRST + 3, 900, 0)
  while (s.enemyCount < MAX_ENEMIES - BOSS_SPAWN_RESERVE) {
    const k = s.enemyCount
    spawnEnemy(s, ENEMY_GRUNT, -200 - (k % 20) * 10, -100 + Math.floor(k / 20) * 8)
  }
  let x = s.ex[boss]!
  for (let t = 0; t < 120; t++) {
    step(s, INPUT_IDLE)
    let found = -1
    for (let i = 0; i < s.enemyCount; i++) if (s.eType[i]! >= ENEMY_BOSS_FIRST) found = i
    assert.ok(found >= 0)
    assert.ok(Math.abs(s.ex[found]! - x) < 2, `boss jumped from ${x} to ${s.ex[found]}`)
    x = s.ex[found]!
  }
})

test('a fresh run starts in the Hangar Deck at the start position', () => {
  const s = freshState(41)
  assert.equal(s.px, START_X)
  assert.equal(s.py, START_Y)
  assert.equal(s.zone, ZONE_HANGAR)
  assert.equal(zoneAt(START_X, START_Y), ZONE_HANGAR)
})

test('EV_ZONE fires on crossing a zone border and not on the first tick', () => {
  const s = freshState(40)
  assert.equal(s.zone, ZONE_HANGAR)
  const head = s.evHead
  step(s, INPUT_IDLE)
  assert.equal(eventsSince(s, head, EV_ZONE).length, 0)
  const outsideHub = HUB_RADIUS + 30
  const left = 1 + INPUT_DIRECTIONS / 2
  const up = 1 + (3 * INPUT_DIRECTIONS) / 4
  placePlayer(s, 0.5, outsideHub)
  step(s, left)
  placePlayer(s, -outsideHub, 0.5)
  step(s, up)
  placePlayer(s, -0.5, -outsideHub)
  step(s, 1)
  placePlayer(s, HUB_RADIUS + 0.5, -0.5)
  step(s, left)
  assert.deepEqual(eventsSince(s, head, EV_ZONE).map(e => e.a), [2, 0, 1, ZONE_HANGAR])
  assert.equal(s.zone, zoneAt(s.px, s.py))
})

function testRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

for (const seed of [7, 8, 9]) {
  test(`random input drifting toward a corner never leaves the world (seed ${seed})`, () => {
    const random = testRandom(seed)
    const s = freshState(seed)
    const corner = 1 + Math.floor(random() * 4) * (INPUT_DIRECTIONS / 4) + INPUT_DIRECTIONS / 8
    let heading = INPUT_IDLE
    let hold = 0
    let touched = 0
    while (!isTerminal(s) && s.tick < 6000) {
      if (hold <= 0) {
        const r = random()
        heading = r < 0.6 ? corner : r < 0.7 ? INPUT_IDLE : 1 + Math.floor(random() * INPUT_DIRECTIONS)
        hold = 10 + Math.floor(random() * 90)
      }
      hold--
      step(s, s.phase === PHASE_LEVEL_UP ? INPUT_CHOICE : heading)
      assert.ok(Math.abs(s.px) <= WORLD_HALF && Math.abs(s.py) <= WORLD_HALF, `player at ${s.px}, ${s.py}`)
      for (let g = 0; g < s.gemCount; g++) assert.ok(Math.abs(s.gx[g]!) <= WORLD_HALF && Math.abs(s.gy[g]!) <= WORLD_HALF)
      if (Math.abs(s.px) === WORLD_HALF || Math.abs(s.py) === WORLD_HALF) touched++
    }
    assert.ok(touched > 100, 'the run should press against the world edge')
  })
}

test('the lift intro freezes the world: no movement, no spawns, no damage until the plate locks', () => {
  const s = createState()
  resetState(s, 3)
  for (let t = 1; t < INTRO_TICKS; t++) {
    step(s, 1)
    assert.equal(s.tick, t)
    assert.equal(s.px, START_X)
    assert.equal(s.py, START_Y)
    assert.equal(s.enemyCount, 0)
    assert.equal(s.shotCount, 0)
    assert.equal(s.hp, s.maxHp)
  }
  step(s, 1)
  assert.equal(s.tick, INTRO_TICKS)
  assert.ok(s.px > START_X, 'the unit moves on the first tick after the lift locks')
})
