import { test } from 'node:test'
import { surface } from './harness.ts'
import assert from 'node:assert/strict'
import {
  CHOICE_COUNT,
  CHOICE_EVOLVE,
  CHOICE_PASSIVE,
  CHOICE_REPAIR,
  CHOICE_WEAPON,
  EVENT_CAP,
  EV_HEAL,
  EV_LEVEL,
  INPUT_CHOICE,
  INPUT_IDLE,
  PASSIVE_COUNT,
  PASSIVE_MAX_LEVEL,
  PASSIVE_SLOTS,
  PHASE_LEVEL_UP,
  PHASE_PLAYING,
  WEAPON_COUNT,
  WEAPON_MAX_LEVEL,
} from '../src/game/sim/content.ts'
import { botInput } from '../src/game/sim/bot.hot.ts'
import { hashState } from '../src/game/sim/hash.ts'
import { createState, type State } from '../src/game/sim/state.ts'
import { xpForLevel } from '../src/game/sim/stats.hot.ts'
import { step } from '../src/game/sim/step.hot.ts'

function freshState(seed: number): State {
  const s = createState()
  surface(s, seed)
  return s
}

function playUntilLevelUp(seed: number): State {
  const s = freshState(seed)
  while (s.phase !== PHASE_LEVEL_UP) {
    step(s, botInput(s))
    assert.ok(s.tick < 20000, 'the bot should level up')
  }
  return s
}

function eventsSince(s: State, head: number, type: number): number[] {
  const payloads: number[] = []
  for (let n = head; n < s.evHead; n++) if (s.evType[n % EVENT_CAP] === type) payloads.push(s.evA[n % EVENT_CAP]!)
  return payloads
}

function grantLevels(s: State, levels: number): void {
  let xp = 0
  for (let k = 0; k < levels; k++) xp += xpForLevel(s.level + k)
  s.xp = xp
}

test('move, idle and out-of-range inputs during a level-up change nothing', () => {
  const s = playUntilLevelUp(3)
  const before = hashState(s)
  const tick = s.tick
  for (let input = 0; input <= 16; input++) step(s, input)
  step(s, INPUT_CHOICE + s.choiceCount)
  step(s, INPUT_CHOICE + CHOICE_COUNT)
  step(s, INPUT_CHOICE + 10)
  step(s, 255)
  assert.equal(s.phase, PHASE_LEVEL_UP)
  assert.equal(s.tick, tick)
  assert.equal(hashState(s), before)
})

test('an out-of-range index is ignored when fewer than three choices are offered', () => {
  const s = freshState(4)
  s.weaponLevel.fill(WEAPON_MAX_LEVEL)
  s.weaponEvolved.fill(1)
  for (let p = 0; p < PASSIVE_SLOTS; p++) s.passiveLevel[p] = PASSIVE_MAX_LEVEL[p]!
  s.xp = s.xpNext
  step(s, INPUT_IDLE)
  assert.equal(s.phase, PHASE_LEVEL_UP)
  assert.equal(s.choiceCount, 1)
  assert.equal(s.choices[0], CHOICE_REPAIR)
  const before = hashState(s)
  step(s, INPUT_CHOICE + 1)
  step(s, INPUT_CHOICE + 2)
  assert.equal(hashState(s), before)
})

test('offered choices are distinct and legal', () => {
  for (let seed = 1; seed <= 5; seed++) {
    const s = playUntilLevelUp(seed)
    assert.ok(s.choiceCount >= 1 && s.choiceCount <= CHOICE_COUNT)
    const seen = new Set<number>()
    for (let k = 0; k < s.choiceCount; k++) {
      const choice = s.choices[k]!
      assert.ok(!seen.has(choice), 'choices must be distinct')
      seen.add(choice)
      if (choice >= CHOICE_REPAIR) continue
      if (choice >= CHOICE_EVOLVE) assert.equal(s.weaponLevel[choice - CHOICE_EVOLVE], WEAPON_MAX_LEVEL)
      else if (choice >= CHOICE_PASSIVE) assert.ok(s.passiveLevel[choice - CHOICE_PASSIVE]! < PASSIVE_MAX_LEVEL[choice - CHOICE_PASSIVE]!)
      else assert.ok(s.weaponLevel[choice - CHOICE_WEAPON]! < WEAPON_MAX_LEVEL)
    }
  }
})

test('a choice applies, emits EV_LEVEL with the new level and resumes play', () => {
  const s = playUntilLevelUp(5)
  const head = s.evHead
  const level = s.level
  const choice = s.choices[0]!
  const weaponsBefore = Array.from(s.weaponLevel)
  const passivesBefore = Array.from(s.passiveLevel)
  step(s, INPUT_CHOICE)
  assert.equal(s.phase, PHASE_PLAYING)
  assert.deepEqual(eventsSince(s, head, EV_LEVEL), [level])
  if (choice >= CHOICE_PASSIVE) assert.equal(s.passiveLevel[choice - CHOICE_PASSIVE], passivesBefore[choice - CHOICE_PASSIVE]! + 1)
  else assert.equal(s.weaponLevel[choice], weaponsBefore[choice]! + 1)
})

test('several pending levels keep the level-up open with fresh choices until all are spent', () => {
  const s = freshState(6)
  grantLevels(s, 3)
  step(s, INPUT_IDLE)
  assert.equal(s.level, 4)
  const pending = 3
  const head = s.evHead
  for (let pick = 1; pick <= pending; pick++) {
    assert.equal(s.phase, PHASE_LEVEL_UP)
    assert.ok(s.choiceCount > 0)
    step(s, INPUT_CHOICE)
  }
  assert.equal(s.phase, PHASE_PLAYING)
  assert.deepEqual(eventsSince(s, head, EV_LEVEL), Array.from({ length: pending }, (_, k) => k + 2))
})

test('with no legal upgrade only a repair is offered, and it heals', () => {
  const s = freshState(7)
  s.weaponLevel.fill(WEAPON_MAX_LEVEL)
  s.weaponEvolved.fill(1)
  for (let p = 0; p < PASSIVE_SLOTS; p++) s.passiveLevel[p] = PASSIVE_MAX_LEVEL[p]!
  s.hp = 10
  s.xp = s.xpNext
  step(s, INPUT_IDLE)
  assert.equal(s.choiceCount, 1)
  assert.equal(s.choices[0], CHOICE_REPAIR)
  const head = s.evHead
  const hp = s.hp
  step(s, INPUT_CHOICE)
  assert.ok(s.hp > hp)
  assert.equal(eventsSince(s, head, EV_HEAL).length, 1)
  assert.equal(eventsSince(s, head, EV_LEVEL).length, 1)
  assert.equal(s.phase, PHASE_PLAYING)
})

test('full passive slots stop new passives from being offered', () => {
  const s = freshState(8)
  for (let p = 0; p < PASSIVE_SLOTS; p++) s.passiveLevel[p] = 1
  for (let round = 0; round < 12; round++) {
    s.xp = s.xpNext
    step(s, INPUT_IDLE)
    assert.equal(s.phase, PHASE_LEVEL_UP)
    for (let k = 0; k < s.choiceCount; k++) {
      const choice = s.choices[k]!
      if (choice >= CHOICE_PASSIVE && choice < CHOICE_EVOLVE) assert.ok(s.passiveLevel[choice - CHOICE_PASSIVE]! > 0)
    }
    step(s, INPUT_CHOICE)
    let owned = 0
    for (let p = 0; p < PASSIVE_COUNT; p++) if (s.passiveLevel[p]! > 0) owned++
    assert.ok(owned <= PASSIVE_SLOTS)
  }
  for (let w = 0; w < WEAPON_COUNT; w++) assert.ok(s.weaponLevel[w]! <= WEAPON_MAX_LEVEL)
})
