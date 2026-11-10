import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CHOICE_EVOLVE,
  EVENT_CAP,
  EV_EVOLVE,
  INPUT_CHOICE,
  INPUT_IDLE,
  PHASE_LEVEL_UP,
  PHASE_PLAYING,
  SHOT_LANCE,
  WEAPONS,
  WEAPON_COUNT,
  WEAPON_DRONE,
  WEAPON_MAX_LEVEL,
  WEAPON_RIFLE,
} from '../src/game/sim/content.ts'
import { createState, resetState, type State } from '../src/game/sim/state.ts'
import { step } from '../src/game/sim/step.hot.ts'

function readyToEvolve(w: number, seed: number): State {
  const s = createState()
  resetState(s, seed)
  s.weaponLevel[w] = WEAPON_MAX_LEVEL
  s.passiveLevel[WEAPONS[w]!.pairedPassive] = 1
  s.xp = s.xpNext
  step(s, INPUT_IDLE)
  return s
}

for (let w = 0; w < WEAPON_COUNT; w++) {
  test(`weapon ${w} at level 6 with its paired passive is offered its evolution first`, () => {
    const s = readyToEvolve(w, 40 + w)
    assert.equal(s.phase, PHASE_LEVEL_UP)
    assert.equal(s.choices[0], CHOICE_EVOLVE + w)
    const head = s.evHead
    step(s, INPUT_CHOICE)
    assert.equal(s.weaponEvolved[w], 1)
    assert.equal(s.phase, PHASE_PLAYING)
    let evolveEvents = 0
    for (let n = head; n < s.evHead; n++) {
      if (s.evType[n % EVENT_CAP] === EV_EVOLVE && s.evA[n % EVENT_CAP] === w) evolveEvents++
    }
    assert.equal(evolveEvents, 1)
  })
}

test('no evolution is offered without the paired passive', () => {
  const s = createState()
  resetState(s, 50)
  s.weaponLevel[WEAPON_RIFLE] = WEAPON_MAX_LEVEL
  for (let round = 0; round < 10; round++) {
    s.xp = s.xpNext
    step(s, INPUT_IDLE)
    for (let k = 0; k < s.choiceCount; k++) assert.notEqual(s.choices[k], CHOICE_EVOLVE + WEAPON_RIFLE)
    s.passiveLevel.fill(0)
    s.weaponLevel[WEAPON_RIFLE] = WEAPON_MAX_LEVEL
    s.phase = PHASE_PLAYING
    s.choiceCount = 0
  }
})

test('the evolved rifle fires lances and evolved drones never redock', () => {
  const s = readyToEvolve(WEAPON_RIFLE, 60)
  step(s, INPUT_CHOICE)
  s.weaponLevel[WEAPON_DRONE] = WEAPON_MAX_LEVEL
  s.weaponEvolved[WEAPON_DRONE] = 1
  s.maxHp = 1e9
  s.hp = 1e9
  let lances = 0
  let dockedTicks = 0
  for (let t = 0; t < 1200; t++) {
    step(s, s.phase === PHASE_LEVEL_UP ? INPUT_CHOICE : INPUT_IDLE)
    for (let i = 0; i < s.shotCount; i++) if (s.sKind[i] === SHOT_LANCE) lances++
    if (s.phase === PHASE_PLAYING && s.droneCount === 0) dockedTicks++
  }
  assert.ok(lances > 0)
  assert.equal(dockedTicks, 0)
})
