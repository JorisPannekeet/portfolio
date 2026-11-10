import { test } from 'node:test'
import assert from 'node:assert/strict'
import { RUN_TICKS } from '../src/game/sim/content.ts'
import { botInput } from '../src/game/sim/bot.hot.ts'
import { hashState } from '../src/game/sim/hash.ts'
import { createState, resetState } from '../src/game/sim/state.ts'
import { step } from '../src/game/sim/step.hot.ts'
import { isTerminal, runBot } from './harness.ts'

const CHECKPOINT_TICKS = 600

function hashTrace(seed: number): number[] {
  const hashes: number[] = []
  const { state } = runBot(seed, RUN_TICKS, s => {
    if (s.tick % CHECKPOINT_TICKS === 0) hashes.push(hashState(s))
  })
  hashes.push(hashState(state))
  return hashes
}

test('the same seed under the bot hashes identically every 600 ticks and at the end', () => {
  const first = hashTrace(7)
  const second = hashTrace(7)
  assert.ok(first.length > 3, 'the run should last several checkpoints')
  assert.deepEqual(second, first)
})

test('different seeds diverge', () => {
  const a = hashTrace(7)
  const b = hashTrace(8)
  assert.notEqual(a[a.length - 1], b[b.length - 1])
  assert.notEqual(a[0], b[0])
})

test('resetting a used state replays exactly like a fresh state', () => {
  const ticks = 3000
  const fresh = runBot(21, ticks).state
  const reused = createState()
  resetState(reused, 99)
  while (!isTerminal(reused) && reused.tick < ticks) step(reused, botInput(reused))
  resetState(reused, 21)
  while (!isTerminal(reused) && reused.tick < ticks) step(reused, botInput(reused))
  assert.equal(hashState(reused), hashState(fresh))
})
