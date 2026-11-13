import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PHASE_ENDED, TICK_HZ } from '../../src/rpg/sim/content.ts'
import { BOT_SLOPPY } from '../../src/rpg/sim/bot-tuning.ts'
import { playthrough } from './e2e-harness.ts'

const SEEDS = [1, 2, 3]
const normal = SEEDS.map(seed => playthrough(seed))
const sloppy = SEEDS.map(seed => playthrough(seed, { mode: BOT_SLOPPY }))

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[sorted.length >> 1]!
}

test('the normal bot finishes every seed with at most two deaths', () => {
  for (const r of normal) {
    assert.equal(r.state.phase, PHASE_ENDED)
    assert.ok(r.deaths <= 2, 'deaths ' + r.deaths)
  }
})

test('the sloppy bot that never guards or dodges still sees the ending within 25 deaths', () => {
  for (const r of sloppy) {
    assert.equal(r.state.phase, PHASE_ENDED)
    assert.ok(r.deaths <= 25, 'deaths ' + r.deaths)
  }
})

test('timed from the first blow, no boss falls in under 10 s to the normal bot; the sloppy bot wins its last try in 15-90 s', () => {
  for (const r of normal) for (const b of r.bosses) assert.ok(b.ticks >= 10 * TICK_HZ, 'boss ' + b.kind + ' ' + b.ticks)
  for (const r of sloppy) for (const b of r.bosses) assert.ok(b.ticks >= 15 * TICK_HZ && b.ticks <= 90 * TICK_HZ, 'boss ' + b.kind + ' ' + b.ticks)
})

test('regular enemies take 2-4 s to kill for the normal bot', () => {
  const kills = normal.flatMap(r => r.kills.map(k => k.ticks))
  const m = median(kills)
  assert.ok(m >= 2 * TICK_HZ && m <= 4 * TICK_HZ, 'median ' + m)
})

test('the player ends between level 10 and 16, and main-path gear keeps attack rising', () => {
  for (const r of [...normal, ...sloppy]) {
    assert.ok(r.state.level >= 10 && r.state.level <= 16, 'level ' + r.state.level)
    const attack = r.chapters.map(c => c.attack)
    for (let k = 1; k < attack.length; k++) assert.ok(attack[k]! >= attack[k - 1]!, 'attack fell entering chapter ' + k)
    assert.ok(attack[attack.length - 1]! >= 3 * attack[0]!, 'attack at least triples over the story')
  }
})
