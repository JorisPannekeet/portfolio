import { test } from 'node:test'
import assert from 'node:assert/strict'
import { GAME_VERSION } from '../src/game/sim/content.ts'
import { hashState } from '../src/game/sim/hash.ts'
import { createRecord, decodeInputs, encodeInputs, replay, type RunRecord } from '../src/game/sim/replay.ts'
import { runBot } from './harness.ts'

test('a recorded bot run survives the codec and replays to the same state', () => {
  const seed = 11
  const { state, inputs } = runBot(seed)
  const record = createRecord(seed, inputs)
  assert.equal(record.version, GAME_VERSION)
  assert.ok(record.inputs.length < inputs.length / 2, 'run-length encoding should compress bot input')
  const restored = JSON.parse(JSON.stringify(record)) as RunRecord
  assert.deepEqual(Array.from(decodeInputs(restored.inputs)), inputs)
  const replayed = replay(restored)
  assert.equal(hashState(replayed), hashState(state))
  assert.equal(replayed.kills, state.kills)
  assert.equal(replayed.level, state.level)
  assert.equal(replayed.tick, state.tick)
  assert.equal(replayed.zone, state.zone)
  assert.equal(replayed.bossKills, state.bossKills)
  assert.equal(replayed.bulletCount, state.bulletCount)
  assert.deepEqual(Array.from(replayed.damageBySource), Array.from(state.damageBySource))
  assert.deepEqual(Array.from(replayed.bossPhase), Array.from(state.bossPhase))
  assert.ok(state.damageBySource.some(v => v > 0), 'the bot run should take damage')
  assert.deepEqual(Array.from(replayed.poiDone), Array.from(state.poiDone))
  assert.deepEqual(Array.from(replayed.poiX), Array.from(state.poiX))
  assert.deepEqual(Array.from(replayed.poiProgress), Array.from(state.poiProgress))
  assert.ok(state.poiDone.some(done => done === 1), 'the bot run should finish a point of interest')
})

test('the codec round-trips edge cases', () => {
  for (const inputs of [[], [0], [5, 5, 5], [1, 2, 3], [0, 0, 32, 0, 0, 0, 16, 16]]) {
    assert.deepEqual(Array.from(decodeInputs(encodeInputs(inputs))), inputs)
  }
  assert.deepEqual(encodeInputs([4, 4, 4, 0, 4]), [4, 3, 0, 1, 4, 1])
})

test('malformed streams and foreign versions are rejected', () => {
  assert.throws(() => decodeInputs([1, 2, 3]))
  assert.throws(() => decodeInputs([1, 0]))
  assert.throws(() => decodeInputs([1, 1.5]))
  assert.throws(() => replay({ version: GAME_VERSION + 1, seed: 1, inputs: [] }))
})
