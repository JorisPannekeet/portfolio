import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SHELL_EVENTS, SHELL_STATES, SHELL_TRANSITIONS, eventForPhase, shellReduce, type ShellEvent, type ShellState } from '../src/game/ui/shell.ts'
import { KEY_DOWN, KEY_LEFT, KEY_RIGHT, KEY_UP, STICK_DEAD_ZONE, headingFromKeys, headingFromVector } from '../src/game/ui/heading.ts'
import { describeChoice, formatClock, parseSeed } from '../src/game/ui/cards.ts'
import { strings } from '../src/game/ui/i18n.ts'
import { CHOICE_EVOLVE, CHOICE_PASSIVE, CHOICE_REPAIR, PHASE_DEAD, PHASE_LEVEL_UP, PHASE_PLAYING, PHASE_WON } from '../src/game/sim/content.ts'

const legal: readonly (readonly [ShellState, ShellEvent, ShellState])[] = [
  ['title', 'launch', 'playing'],
  ['playing', 'pause', 'paused'],
  ['playing', 'levelUp', 'levelUp'],
  ['playing', 'die', 'dead'],
  ['playing', 'win', 'won'],
  ['levelUp', 'pick', 'playing'],
  ['paused', 'resume', 'playing'],
  ['paused', 'exit', 'title'],
  ['dead', 'relaunch', 'playing'],
  ['dead', 'exit', 'title'],
  ['won', 'relaunch', 'playing'],
  ['won', 'exit', 'title'],
]

for (const [from, event, to] of legal) {
  test(`${from} --${event}--> ${to}`, () => {
    assert.equal(shellReduce(from, event), to)
  })
}

test('the transition table holds exactly the legal transitions', () => {
  let count = 0
  for (const state of SHELL_STATES) count += Object.keys(SHELL_TRANSITIONS[state]).length
  assert.equal(count, legal.length)
})

test('every illegal event leaves the state unchanged', () => {
  for (const state of SHELL_STATES) {
    for (const event of SHELL_EVENTS) {
      if (legal.some(([from, on]) => from === state && on === event)) continue
      assert.equal(shellReduce(state, event), state, `${state} on ${event}`)
    }
  }
})

function sources(target: ShellState): ShellState[] {
  return SHELL_STATES.filter(state => state !== target && SHELL_EVENTS.some(event => shellReduce(state, event) === target))
}

function exits(from: ShellState): ShellEvent[] {
  return SHELL_EVENTS.filter(event => shellReduce(from, event) !== from)
}

test('level-up is entered only from playing and returns only to playing', () => {
  assert.deepEqual(sources('levelUp'), ['playing'])
  assert.deepEqual(exits('levelUp').map(event => shellReduce('levelUp', event)), ['playing'])
})

test('pause is reached only from playing and resumes to playing', () => {
  assert.deepEqual(sources('paused'), ['playing'])
  assert.equal(shellReduce('paused', 'resume'), 'playing')
})

test('dead and won leave only through relaunch or exit', () => {
  assert.deepEqual(exits('dead'), ['relaunch', 'exit'])
  assert.deepEqual(exits('won'), ['relaunch', 'exit'])
})

test('sim phases map to shell events', () => {
  assert.equal(eventForPhase(PHASE_PLAYING), null)
  assert.equal(eventForPhase(PHASE_LEVEL_UP), 'levelUp')
  assert.equal(eventForPhase(PHASE_DEAD), 'die')
  assert.equal(eventForPhase(PHASE_WON), 'win')
})

test('key sets map to the contract headings', () => {
  assert.equal(headingFromKeys(0), 0)
  assert.equal(headingFromKeys(KEY_RIGHT), 1)
  assert.equal(headingFromKeys(KEY_RIGHT | KEY_DOWN), 3)
  assert.equal(headingFromKeys(KEY_DOWN), 5)
  assert.equal(headingFromKeys(KEY_DOWN | KEY_LEFT), 7)
  assert.equal(headingFromKeys(KEY_LEFT), 9)
  assert.equal(headingFromKeys(KEY_LEFT | KEY_UP), 11)
  assert.equal(headingFromKeys(KEY_UP), 13)
  assert.equal(headingFromKeys(KEY_UP | KEY_RIGHT), 15)
})

test('opposite keys cancel', () => {
  assert.equal(headingFromKeys(KEY_LEFT | KEY_RIGHT), 0)
  assert.equal(headingFromKeys(KEY_UP | KEY_DOWN), 0)
  assert.equal(headingFromKeys(KEY_LEFT | KEY_RIGHT | KEY_UP | KEY_DOWN), 0)
  assert.equal(headingFromKeys(KEY_LEFT | KEY_RIGHT | KEY_UP), 13)
  assert.equal(headingFromKeys(KEY_UP | KEY_DOWN | KEY_RIGHT), 1)
})

test('vectors map to the 16 contract headings', () => {
  assert.equal(headingFromVector(20, 0, STICK_DEAD_ZONE), 1)
  assert.equal(headingFromVector(0, 20, STICK_DEAD_ZONE), 5)
  assert.equal(headingFromVector(-20, 0, STICK_DEAD_ZONE), 9)
  assert.equal(headingFromVector(0, -20, STICK_DEAD_ZONE), 13)
  assert.equal(headingFromVector(20, 20, STICK_DEAD_ZONE), 3)
  assert.equal(headingFromVector(-20, 20, STICK_DEAD_ZONE), 7)
  assert.equal(headingFromVector(-20, -20, STICK_DEAD_ZONE), 11)
  assert.equal(headingFromVector(20, -20, STICK_DEAD_ZONE), 15)
  assert.equal(headingFromVector(20, -1, STICK_DEAD_ZONE), 1)
  for (let index = 0; index < 16; index++) {
    const angle = (index * 2 * Math.PI) / 16
    assert.equal(headingFromVector(Math.cos(angle) * 30, Math.sin(angle) * 30, STICK_DEAD_ZONE), index + 1)
  }
})

test('the stick dead zone is 8 px', () => {
  assert.equal(STICK_DEAD_ZONE, 8)
  assert.equal(headingFromVector(0, 0, STICK_DEAD_ZONE), 0)
  assert.equal(headingFromVector(7.9, 0, STICK_DEAD_ZONE), 0)
  assert.equal(headingFromVector(-5, 5, STICK_DEAD_ZONE), 0)
  assert.equal(headingFromVector(8, 0, STICK_DEAD_ZONE), 1)
})

test('choice codes resolve to card text and tags', () => {
  const weaponLevel = Uint8Array.of(1, 0, 3, 0, 0, 0)
  const passiveLevel = new Uint8Array(9)
  passiveLevel[2] = 4
  assert.deepEqual(describeChoice(0, weaponLevel, passiveLevel, strings), {
    choice: 0, name: strings.weaponName[0], tag: `${strings.tagLevel} 2`, blurb: '', lines: ['+2 damage', '5% faster fire'], evolution: false,
  })
  assert.equal(describeChoice(1, weaponLevel, passiveLevel, strings).blurb, strings.weaponDesc[1])
  assert.equal(describeChoice(1, weaponLevel, passiveLevel, strings).tag, strings.tagNew)
  assert.equal(describeChoice(CHOICE_PASSIVE + 2, weaponLevel, passiveLevel, strings).tag, `${strings.tagLevel} 5`)
  assert.equal(describeChoice(CHOICE_PASSIVE + 8, weaponLevel, passiveLevel, strings).name, strings.passiveName[8])
  const evolved = describeChoice(CHOICE_EVOLVE + 3, weaponLevel, passiveLevel, strings)
  assert.equal(evolved.name, strings.evolvedName[3])
  assert.equal(evolved.tag, strings.tagEvolve)
  assert.equal(evolved.evolution, true)
  assert.equal(describeChoice(CHOICE_REPAIR, weaponLevel, passiveLevel, strings).name, strings.repairName)
})

test('run time formats as mm:ss and the seed parses as uint32', () => {
  assert.equal(formatClock(0, 60), '00:00')
  assert.equal(formatClock(61 * 60 + 59, 60), '01:01')
  assert.equal(formatClock(8 * 60 * 60, 60), '08:00')
  assert.equal(parseSeed('?seed=42'), 42)
  assert.equal(parseSeed('?seed=4294967295'), 4294967295)
  assert.equal(parseSeed('?seed=4294967296'), null)
  assert.equal(parseSeed('?seed=-1'), null)
  assert.equal(parseSeed('?seed=abc'), null)
  assert.equal(parseSeed(''), null)
})
