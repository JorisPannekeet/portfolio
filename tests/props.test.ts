import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  BEACON_RADIUS,
  ENEMY_BOSS_FIRST,
  ENEMY_GRUNT,
  ENEMY_HP,
  ENEMY_RADIUS,
  GEM_PROP_CLEARANCE,
  GEM_REPAIR,
  GEM_SMALL,
  GUARD_ELITE_MIN_SQUAD,
  GUARD_SQUAD_SIZE,
  INPUT_CHOICE,
  INPUT_DIRECTIONS,
  INPUT_IDLE,
  MAX_ENEMIES,
  BOSS_SPAWN_RESERVE,
  PHASE_LEVEL_UP,
  PLAYER_RADIUS,
  POI_BEACON,
  POI_LAIR,
  PROPS_PER_SLOT,
  PROP_BEACON_GAP,
  PROP_BORDER_MARGIN,
  PROP_EDGE_MARGIN,
  PROP_HANGAR,
  PROP_KIND_COUNT,
  PROP_LAIR_CLEARANCE,
  PROP_MIN_GAP,
  PROP_RADIUS,
  PROP_SLOTS_PER_ZONE,
  PROP_START_CLEARANCE,
  RUN_TICKS,
  START_X,
  START_Y,
  WAVES,
  WEAPON_COUNT,
  WORLD_HALF,
  ZONE_COUNT,
} from '../src/game/sim/content.ts'
import { spawnEnemy } from '../src/game/sim/enemies.hot.ts'
import { dropGem } from '../src/game/sim/pickups.hot.ts'
import { buildPropGrid } from '../src/game/sim/props.hot.ts'
import { createState, resetState, type State } from '../src/game/sim/state.ts'
import { step } from '../src/game/sim/step.hot.ts'
import { zoneAt } from '../src/game/sim/world.hot.ts'
import { isTerminal, runBot } from './harness.ts'

const OVERLAP_TOLERANCE = 1e-3
const RIGHT = 1

function freshState(seed: number): State {
  const s = createState()
  resetState(s, seed)
  s.maxHp = 1e9
  s.hp = 1e9
  s.xpNext = 1e9
  return s
}

function propLayout(seed: number, s = createState()): number[] {
  resetState(s, seed)
  const rows: number[] = [s.propCount]
  for (let k = 0; k < s.propCount; k++) rows.push(s.propKind[k]!, s.propX[k]!, s.propY[k]!)
  return rows
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
}

function propOverlapping(s: State, x: number, y: number, radius: number): number {
  for (let k = 0; k < s.propCount; k++) {
    if (distance(x, y, s.propX[k]!, s.propY[k]!) < radius + PROP_RADIUS[s.propKind[k]!]! - OVERLAP_TOLERANCE) return k
  }
  return -1
}

function assertClearOfProps(s: State, label: string): void {
  assert.equal(propOverlapping(s, s.px, s.py, PLAYER_RADIUS), -1, `${label}: player inside a prop at ${s.px}, ${s.py}`)
  for (let i = 0; i < s.enemyCount; i++) {
    const k = propOverlapping(s, s.ex[i]!, s.ey[i]!, ENEMY_RADIUS[s.eType[i]!]!)
    assert.equal(k, -1, `${label}: hostile type ${s.eType[i]} inside prop ${k} at tick ${s.tick}`)
  }
  for (let g = 0; g < s.gemCount; g++) {
    if (s.gAttract[g] !== 0) continue
    assert.equal(propOverlapping(s, s.gx[g]!, s.gy[g]!, 0), -1, `${label}: gem resting inside a prop`)
  }
}

function soloProp(s: State, kind: number, x: number, y: number): void {
  s.propCount = 1
  s.propKind[0] = kind
  s.propX[0] = x
  s.propY[0] = y
  buildPropGrid(s)
}

function placePlayer(s: State, x: number, y: number): void {
  s.px = x
  s.py = y
  s.ppx = x
  s.ppy = y
  s.zone = zoneAt(x, y)
}

function hostilesNear(s: State, x: number, y: number, reach: number): number[] {
  const found: number[] = []
  for (let i = 0; i < s.enemyCount; i++) if (distance(s.ex[i]!, s.ey[i]!, x, y) <= reach) found.push(i)
  return found
}

function beacons(s: State): number[] {
  const found: number[] = []
  for (let i = 0; i < s.poiCount; i++) if (s.poiKind[i] === POI_BEACON) found.push(i)
  return found
}

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

test('the same seed lays out the same props and other seeds differ', () => {
  assert.deepEqual(propLayout(5), propLayout(5))
  assert.notDeepEqual(propLayout(5), propLayout(6))
  const used = runBot(9, 600).state
  assert.deepEqual(propLayout(5, used), propLayout(5))
})

test('every zone holds the contract count of each of its prop kinds', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const s = createState()
    resetState(s, seed)
    const counts = new Array<number>(PROP_KIND_COUNT * ZONE_COUNT).fill(0)
    for (let k = 0; k < s.propCount; k++) counts[s.propKind[k]! * ZONE_COUNT + zoneAt(s.propX[k]!, s.propY[k]!)]!++
    for (let kind = 0; kind < PROP_KIND_COUNT; kind++) {
      const home = Math.floor(kind / PROP_SLOTS_PER_ZONE)
      for (let zone = 0; zone < ZONE_COUNT; zone++) {
        const expected = zone === home ? PROPS_PER_SLOT[kind % PROP_SLOTS_PER_ZONE]! : 0
        assert.equal(counts[kind * ZONE_COUNT + zone], expected, `seed ${seed} kind ${kind} zone ${zone}`)
      }
    }
  }
})

test('every prop layout over 200 seeds obeys the placement rules', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const s = createState()
    resetState(s, seed)
    for (let k = 0; k < s.propCount; k++) {
      const x = s.propX[k]!
      const y = s.propY[k]!
      const r = PROP_RADIUS[s.propKind[k]!]!
      const label = `seed ${seed} prop ${k}`
      for (const v of [x, y]) {
        assert.ok(Math.abs(v) - r >= PROP_BORDER_MARGIN, `${label} keeps off the zone border`)
        assert.ok(Math.abs(v) + r <= WORLD_HALF - PROP_EDGE_MARGIN, `${label} keeps off the world edge`)
      }
      assert.ok(distance(x, y, START_X, START_Y) - r >= PROP_START_CLEARANCE, `${label} crowds the start`)
      for (let i = 0; i < s.poiCount; i++) {
        const gap = distance(x, y, s.poiX[i]!, s.poiY[i]!) - r
        if (s.poiKind[i] === POI_LAIR) assert.ok(gap >= PROP_LAIR_CLEARANCE, `${label} crowds lair ${i}`)
        else assert.ok(gap - BEACON_RADIUS >= PROP_BEACON_GAP, `${label} crowds beacon ${i}`)
      }
      for (let j = k + 1; j < s.propCount; j++) {
        const gap = distance(x, y, s.propX[j]!, s.propY[j]!) - r - PROP_RADIUS[s.propKind[j]!]!
        assert.ok(gap >= PROP_MIN_GAP, `${label} and prop ${j} leave a ${gap.toFixed(1)} px gap`)
      }
    }
  }
})

test('a player walking off-centre into a prop slides along it and past it', () => {
  const s = freshState(3)
  s.weaponLevel.fill(0)
  const hx = START_X + 120
  const hy = START_Y
  soloProp(s, PROP_HANGAR, hx, hy)
  placePlayer(s, hx - 100, hy + 8)
  let touched = false
  let lastX = s.px
  let stalled = 0
  while (s.px < hx + PROP_RADIUS[PROP_HANGAR]!) {
    step(s, s.phase === PHASE_LEVEL_UP ? INPUT_CHOICE : RIGHT)
    assertClearOfProps(s, 'walk')
    const gap = distance(s.px, s.py, hx, hy) - PROP_RADIUS[PROP_HANGAR]! - PLAYER_RADIUS
    if (gap < 0.01) touched = true
    if (s.px - lastX < 0.01) stalled++
    lastX = s.px
    assert.ok(s.tick < 600, 'the player should get past the prop')
  }
  assert.ok(touched, 'the player should have pressed against the prop')
  assert.equal(stalled, 0, 'the player should never stop dead against the prop')
  assert.ok(s.py > hy, 'the player slides round on the side it approached from')
})

test('a horde on the far side of a hangar flows round it to a stationary player', () => {
  const s = freshState(4)
  s.weaponLevel.fill(0)
  const hx = START_X + 100
  const hy = START_Y
  const reach = PROP_RADIUS[PROP_HANGAR]!
  soloProp(s, PROP_HANGAR, hx, hy)
  placePlayer(s, hx - reach - PLAYER_RADIUS - 2, hy)
  const horde = new Map<number, number>()
  for (let k = 0; k < 16; k++) {
    const i = spawnEnemy(s, ENEMY_GRUNT, hx + reach + 20 + k * 9, hy)
    horde.set(s.eId[i]!, -1)
  }
  const arrive = reach + 20
  while (s.tick < 30 * 60 && [...horde.values()].some(t => t < 0)) {
    step(s, s.phase === PHASE_LEVEL_UP ? INPUT_CHOICE : INPUT_IDLE)
    assertClearOfProps(s, 'horde')
    for (let i = 0; i < s.enemyCount; i++) {
      const id = s.eId[i]!
      if (horde.get(id) === -1 && distance(s.ex[i]!, s.ey[i]!, s.px, s.py) < arrive) horde.set(id, s.tick)
    }
  }
  const late = [...horde.values()].filter(t => t < 0).length
  assert.equal(late, 0, `${late} of ${horde.size} hostiles never got round the hangar`)
})

for (const seed of [101, 202, 303]) {
  test(`random input never leaves the player, a hostile or a resting gem inside a prop (seed ${seed})`, () => {
    const random = testRandom(seed)
    const s = createState()
    resetState(s, seed)
    let heading = INPUT_IDLE
    let hold = 0
    while (!isTerminal(s) && s.tick < RUN_TICKS / 2) {
      if (hold <= 0) {
        heading = random() < 0.15 ? INPUT_IDLE : 1 + Math.floor(random() * INPUT_DIRECTIONS)
        hold = 10 + Math.floor(random() * 60)
      }
      hold--
      step(s, s.phase === PHASE_LEVEL_UP ? INPUT_CHOICE + Math.floor(random() * 3) : heading)
      assertClearOfProps(s, `random ${seed}`)
    }
  })
}

for (const seed of [4, 5]) {
  test(`a full bot run never leaves anything inside a prop, bosses included (seed ${seed})`, () => {
    let bosses = 0
    runBot(seed, RUN_TICKS, s => {
      if (s.tick % 2 === 0) assertClearOfProps(s, `bot ${seed}`)
      if (s.bossMaxHp > 0) bosses++
    })
    assert.ok(bosses > 0, 'the run should meet a boss')
  })
}

function standOnBeacon(s: State, beacon: number): void {
  placePlayer(s, s.poiX[beacon]!, s.poiY[beacon]!)
  step(s, INPUT_IDLE)
}

test('a guard squad deploys once around a beacon the first time the player stands on it', () => {
  const s = freshState(17)
  const beacon = beacons(s)[0]!
  const bx = s.poiX[beacon]!
  const by = s.poiY[beacon]!
  assert.equal(s.poiGuard[beacon], 0)
  standOnBeacon(s, beacon)
  assert.equal(s.poiGuard[beacon], 1)
  assert.ok(s.poiProgress[beacon]! > 0)
  const squad = hostilesNear(s, bx, by, 240)
  assert.equal(squad.length, GUARD_SQUAD_SIZE[0])
  for (const i of squad) assert.ok(distance(s.ex[i]!, s.ey[i]!, bx, by) >= 70, 'guards deploy on a ring round the beacon')
  placePlayer(s, bx + 200, by)
  for (let t = 0; t < 120; t++) step(s, INPUT_IDLE)
  s.enemyCount = 0
  standOnBeacon(s, beacon)
  assert.equal(hostilesNear(s, bx, by, 240).length, 0, 'a second visit deploys nothing')
})

test('the guard squad grows with the number of beacons already captured', () => {
  for (let captured = 0; captured < GUARD_SQUAD_SIZE.length; captured++) {
    const s = freshState(18)
    const all = beacons(s)
    for (let n = 0; n < captured; n++) {
      s.poiDone[all[n]!] = 1
      s.poiProgress[all[n]!] = 1
    }
    const beacon = all[captured]!
    standOnBeacon(s, beacon)
    const squad = hostilesNear(s, s.poiX[beacon]!, s.poiY[beacon]!, 240)
    assert.equal(squad.length, GUARD_SQUAD_SIZE[captured], `squad after ${captured} captures`)
    if (squad.length >= GUARD_ELITE_MIN_SQUAD) {
      const pool = WAVES[0]!.pool
      const poolHp = Math.max(...pool.map(type => ENEMY_HP[type]!))
      assert.ok(squad.some(i => ENEMY_HP[s.eType[i]!]! > poolHp), 'a large squad brings a tougher frame')
    }
  }
})

test('a guard squad deploys through recycling when the hostile pool is full and never moves a boss', () => {
  const s = freshState(19)
  for (let w = 0; w < WEAPON_COUNT; w++) s.weaponLevel[w] = 0
  const beacon = beacons(s)[1]!
  const bx = s.poiX[beacon]!
  const by = s.poiY[beacon]!
  const ox = bx - Math.sign(bx) * 380
  const boss = spawnEnemy(s, ENEMY_BOSS_FIRST, ox, by)
  const bossId = s.eId[boss]!
  while (s.enemyCount < MAX_ENEMIES - BOSS_SPAWN_RESERVE) {
    const k = s.enemyCount
    spawnEnemy(s, ENEMY_GRUNT, ox + (k % 20) * 4, by + 40 + Math.floor(k / 20) * 4)
  }
  const count = s.enemyCount
  standOnBeacon(s, beacon)
  assert.equal(s.enemyCount, count)
  assert.equal(hostilesNear(s, bx, by, 240).length, GUARD_SQUAD_SIZE[0])
  let found = -1
  for (let i = 0; i < s.enemyCount; i++) if (s.eId[i] === bossId) found = i
  assert.ok(found >= 0, 'the boss survives recycling')
  assert.ok(distance(s.ex[found]!, s.ey[found]!, ox, by) < 2)
})

test('gems dropped on a prop are pushed clear of it', () => {
  const s = freshState(20)
  for (let k = 0; k < s.propCount; k++) {
    const x = s.propX[k]!
    const y = s.propY[k]!
    dropGem(s, GEM_SMALL, 1, x + 1, y - 2)
    dropGem(s, GEM_REPAIR, 0, x, y)
    for (let g = s.gemCount - 2; g < s.gemCount; g++) {
      const gap = distance(s.gx[g]!, s.gy[g]!, x, y) - PROP_RADIUS[s.propKind[k]!]!
      assert.ok(gap >= GEM_PROP_CLEARANCE - OVERLAP_TOLERANCE, `gem ${g} rests ${gap.toFixed(2)} px from prop ${k}`)
    }
  }
})
