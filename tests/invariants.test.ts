import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CHOICE_COUNT,
  EVENT_CAP,
  EV_WON,
  INPUT_CHOICE,
  INPUT_DIRECTIONS,
  INPUT_IDLE,
  MAX_DRONES,
  MAX_ENEMIES,
  MAX_GEMS,
  MAX_POIS,
  MAX_SHOTS,
  PASSIVE_COUNT,
  PASSIVE_MAX_LEVEL,
  PASSIVE_SLOTS,
  PHASE_LEVEL_UP,
  PHASE_WON,
  POI_BEACON,
  POI_LAIR,
  RUN_TICKS,
  WEAPONS,
  WEAPON_COUNT,
  WEAPON_MAX_LEVEL,
  WEAPON_SLOTS,
  WORLD_HALF,
} from '../src/game/sim/content.ts'
import { hashState } from '../src/game/sim/hash.ts'
import { createState, resetState, type State } from '../src/game/sim/state.ts'
import { step } from '../src/game/sim/step.hot.ts'
import { zoneAt } from '../src/game/sim/world.hot.ts'
import { isTerminal } from './harness.ts'

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

function assertInvariants(s: State): void {
  assert.ok(s.enemyCount >= 0 && s.enemyCount <= MAX_ENEMIES)
  assert.ok(s.shotCount >= 0 && s.shotCount <= MAX_SHOTS)
  assert.ok(s.gemCount >= 0 && s.gemCount <= MAX_GEMS)
  assert.ok(s.droneCount >= 0 && s.droneCount <= MAX_DRONES)
  assert.ok(s.hp >= 0 && s.hp <= s.maxHp, `hp ${s.hp} outside 0..${s.maxHp}`)
  assert.ok(s.tick <= RUN_TICKS)
  assert.ok(s.choiceCount <= CHOICE_COUNT)
  let weapons = 0
  for (let w = 0; w < WEAPON_COUNT; w++) {
    const level = s.weaponLevel[w]!
    assert.ok(level <= WEAPON_MAX_LEVEL)
    if (level > 0) weapons++
    if (s.weaponEvolved[w]! > 0) {
      assert.equal(level, WEAPON_MAX_LEVEL)
      assert.ok(s.passiveLevel[WEAPONS[w]!.pairedPassive]! > 0)
    }
  }
  let passives = 0
  for (let p = 0; p < PASSIVE_COUNT; p++) {
    assert.ok(s.passiveLevel[p]! <= PASSIVE_MAX_LEVEL[p]!)
    if (s.passiveLevel[p]! > 0) passives++
  }
  assert.ok(weapons <= WEAPON_SLOTS)
  assert.ok(passives <= PASSIVE_SLOTS)
  assert.ok(Math.abs(s.px) <= WORLD_HALF && Math.abs(s.py) <= WORLD_HALF, `player at ${s.px}, ${s.py} left the world`)
  assert.equal(s.zone, zoneAt(s.px, s.py))
  for (let g = 0; g < s.gemCount; g++) assert.ok(Math.abs(s.gx[g]!) <= WORLD_HALF && Math.abs(s.gy[g]!) <= WORLD_HALF, 'gem outside the world')
  assert.equal(s.poiCount, MAX_POIS)
  let lairsDone = 0
  for (let i = 0; i < s.poiCount; i++) {
    const progress = s.poiProgress[i]!
    assert.ok(progress >= 0 && progress <= 1)
    if (s.poiKind[i] === POI_BEACON && s.poiDone[i] === 1) assert.equal(progress, 1)
    if (s.poiKind[i] === POI_LAIR && s.poiDone[i] === 1) lairsDone++
  }
  assert.ok(s.bossKills <= lairsDone, 'every boss comes from a lair')
  assert.ok(s.bossHp >= 0 && s.bossHp <= s.bossMaxHp)
  if (s.phase === PHASE_LEVEL_UP) {
    assert.ok(s.choiceCount > 0)
    for (let a = 0; a < s.choiceCount; a++) for (let b = a + 1; b < s.choiceCount; b++) assert.notEqual(s.choices[a], s.choices[b])
  }
}

function randomRun(seed: number): State {
  const random = testRandom(seed)
  const s = createState()
  resetState(s, seed)
  let heading = INPUT_IDLE
  let hold = 0
  let steps = 0
  const done = new Uint8Array(MAX_POIS)
  while (!isTerminal(s) && steps < RUN_TICKS * 2) {
    if (hold <= 0) {
      heading = random() < 0.15 ? INPUT_IDLE : 1 + Math.floor(random() * INPUT_DIRECTIONS)
      hold = 10 + Math.floor(random() * 60)
    }
    hold--
    const input = s.phase === PHASE_LEVEL_UP && random() < 0.8 ? INPUT_CHOICE + Math.floor(random() * (CHOICE_COUNT + 2)) : heading
    step(s, input)
    steps++
    assertInvariants(s)
    for (let i = 0; i < MAX_POIS; i++) {
      assert.ok(s.poiDone[i]! >= done[i]!, 'a finished point of interest never reopens')
      done[i] = s.poiDone[i]!
    }
  }
  return s
}

for (const seed of [101, 202, 303]) {
  test(`random-input run ${seed} keeps every invariant and its terminal phase is absorbing`, () => {
    const s = randomRun(seed)
    assert.ok(isTerminal(s), 'a random run should end')
    const hash = hashState(s)
    const tick = s.tick
    for (let input = 0; input < 40; input++) step(s, input)
    assert.equal(s.tick, tick)
    assert.equal(hashState(s), hash)
  })
}

test('reaching the run length alive wins, emits EV_WON once and freezes', () => {
  const s = createState()
  resetState(s, 9)
  s.tick = RUN_TICKS - 3
  s.maxHp = 1e6
  s.hp = 1e6
  for (let k = 0; k < 10; k++) step(s, s.phase === PHASE_LEVEL_UP ? INPUT_CHOICE : INPUT_IDLE)
  assert.equal(s.phase, PHASE_WON)
  assert.equal(s.tick, RUN_TICKS)
  let wonEvents = 0
  for (let n = Math.max(0, s.evHead - EVENT_CAP); n < s.evHead; n++) if (s.evType[n % EVENT_CAP] === EV_WON) wonEvents++
  assert.equal(wonEvents, 1)
  assert.equal(s.choiceCount, 0)
})
