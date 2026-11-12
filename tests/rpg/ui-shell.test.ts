import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  INITIAL_SHELL,
  MENU_TABS,
  SHELL_EVENTS,
  SHELL_MODES,
  SHELL_TRANSITIONS,
  eventForPhase,
  shellReduce,
  type ShellEvent,
  type ShellMode,
} from '../../src/rpg/ui/shell.ts'
import { PHASE_DEAD, PHASE_DIALOG, PHASE_ENDED, PHASE_PLAYING } from '../../src/rpg/sim/content.ts'

const tabs = MENU_TABS.flatMap(tab => [['playing', tab, 'menu'], ['menu', tab, 'menu']] as const)

const legal: readonly (readonly [ShellMode, ShellEvent, ShellMode])[] = [
  ['title', 'launch', 'playing'],
  ['playing', 'pause', 'paused'],
  ['playing', 'simDialog', 'dialog'],
  ['playing', 'simDead', 'dead'],
  ['playing', 'simEnded', 'ended'],
  ['dialog', 'simPlaying', 'playing'],
  ['dialog', 'simDead', 'dead'],
  ['dialog', 'simEnded', 'ended'],
  ['menu', 'closeMenu', 'playing'],
  ['menu', 'simDialog', 'dialog'],
  ['menu', 'simDead', 'dead'],
  ['menu', 'simEnded', 'ended'],
  ['paused', 'resume', 'playing'],
  ['paused', 'exit', 'title'],
  ['dead', 'simPlaying', 'playing'],
  ['dead', 'exit', 'title'],
  ['ended', 'relaunch', 'playing'],
  ['ended', 'exit', 'title'],
  ...tabs,
]

test('every state and event pair resolves to the table', () => {
  for (const mode of SHELL_MODES) {
    for (const event of SHELL_EVENTS) {
      const hit = legal.find(([from, on]) => from === mode && on === event)
      const next = shellReduce({ mode, tab: 'gear' }, event)
      assert.equal(next.mode, hit ? hit[2] : mode, `${mode} on ${event}`)
    }
  }
})

test('the transition table holds exactly the legal transitions', () => {
  let count = 0
  for (const mode of SHELL_MODES) count += Object.keys(SHELL_TRANSITIONS[mode]).length
  assert.equal(count, legal.length)
})

test('an illegal event returns the same shell object', () => {
  const shell = { mode: 'title' as const, tab: 'gear' as const }
  assert.equal(shellReduce(shell, 'pause'), shell)
})

test('opening a tab selects it and switching tabs stays in the menu', () => {
  const gear = shellReduce({ mode: 'playing', tab: 'gear' }, 'horn')
  assert.deepEqual(gear, { mode: 'menu', tab: 'horn' })
  assert.deepEqual(shellReduce(gear, 'forge'), { mode: 'menu', tab: 'forge' })
  assert.deepEqual(shellReduce(gear, 'closeMenu'), { mode: 'playing', tab: 'horn' })
})

test('the shell starts on the title screen', () => {
  assert.equal(INITIAL_SHELL.mode, 'title')
})

test('the user cannot leave dialog, death or the ending by pausing or opening the menu', () => {
  for (const mode of ['dialog', 'dead', 'ended'] as const) {
    for (const event of ['pause', ...MENU_TABS] as const) assert.equal(shellReduce({ mode, tab: 'gear' }, event).mode, mode)
  }
})

test('sim phases map to shell events', () => {
  assert.equal(eventForPhase(PHASE_PLAYING), 'simPlaying')
  assert.equal(eventForPhase(PHASE_DIALOG), 'simDialog')
  assert.equal(eventForPhase(PHASE_DEAD), 'simDead')
  assert.equal(eventForPhase(PHASE_ENDED), 'simEnded')
  assert.equal(eventForPhase(99), null)
})
