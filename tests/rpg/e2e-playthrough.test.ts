import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CH_COUNT,
  ELEMENT_EMBER,
  ELEMENT_GALE,
  ELEMENT_STONE,
  ELEMENT_TIDE,
  ENDING_REFORGE,
  ENDING_SHATTER,
  KEY_GRAPPLE,
  KEY_LONGBOW,
  KEY_WARHAMMER,
  MELODY_COUNT,
  PHASE_ENDED,
  SCRIPT_VAREK_COLOSSUS,
  SCRIPT_VAREK_ELEMENTS,
  SHRINE_COUNT,
  VAREK_PHASE_COLOSSUS,
  VAREK_PHASE_ELEMENTS,
} from '../../src/rpg/sim/content.ts'
import { BOT_CORRUPT_CHEST, BOT_OPTIONAL, BOT_SHATTER } from '../../src/rpg/sim/bot-tuning.ts'
import { FLAG_SHRINE_CHEST, FLAG_SHRINE_CLEAR } from '../../src/rpg/sim/flags.ts'
import { TICKS_PER_MINUTE, playthrough, type Playthrough } from './e2e-harness.ts'

const SEEDS = [1, 2, 3]
const MAIN_BUDGET = 25 * TICKS_PER_MINUTE
const ALL_ELEMENTS = (1 << 4) - 1

const runs = new Map<string, Playthrough>()

function run(seed: number, mode: number): Playthrough {
  const key = seed + ':' + mode
  let found = runs.get(key)
  if (!found) {
    found = playthrough(seed, { mode, budget: MAIN_BUDGET })
    runs.set(key, found)
  }
  return found
}

for (const seed of SEEDS) {
  for (const [mode, ending] of [[0, ENDING_REFORGE], [BOT_SHATTER, ENDING_SHATTER]] as const) {
    test(`seed ${seed}: the bot plays from newGame to ending ${ending} inside the budget`, () => {
      const r = run(seed, mode)
      assert.equal(r.state.phase, PHASE_ENDED, 'finished')
      assert.equal(r.state.ending, ending)
      assert.ok(r.elapsed < MAIN_BUDGET)
      assert.equal(r.wallOverlaps, 0, 'the player never overlaps a blocking tile')
    })
  }

  test(`seed ${seed}: the story runs in order and everything is owned by the end`, () => {
    const r = run(seed, 0)
    assert.deepEqual(r.chapters.map(c => c.chapter), Array.from({ length: CH_COUNT }, (_, c) => c), 'each chapter once, in order')
    assert.equal(r.state.shards, ALL_ELEMENTS)
    assert.equal(r.state.stancesUnlocked, ALL_ELEMENTS)
    assert.equal(r.state.keyItems, KEY_WARHAMMER | KEY_GRAPPLE | KEY_LONGBOW)
    assert.equal(r.state.melodies, (1 << MELODY_COUNT) - 1)
    assert.ok(r.stanceTick[ELEMENT_STONE]! < r.shardTick[ELEMENT_STONE]!, 'Stone wakes before its shard')
    for (const e of [ELEMENT_TIDE, ELEMENT_EMBER, ELEMENT_GALE]) assert.equal(r.stanceTick[e], r.shardTick[e], 'stance ' + e + ' unlocks with its shard')
    for (let k = 1; k < r.shardTick.length; k++) assert.ok(r.shardTick[k]! > r.shardTick[k - 1]!, 'shards in element order')
  })

  test(`seed ${seed}: Varek runs all three phases and their scripts before the choice`, () => {
    const r = run(seed, 0)
    assert.ok(r.bossPhases.includes(VAREK_PHASE_ELEMENTS) && r.bossPhases.includes(VAREK_PHASE_COLOSSUS))
    const elements = r.scripts.indexOf(SCRIPT_VAREK_ELEMENTS)
    const colossus = r.scripts.indexOf(SCRIPT_VAREK_COLOSSUS)
    assert.ok(elements >= 0 && colossus > elements)
  })
}

test('the same seed replays the same hash trace; another seed diverges', () => {
  const first = run(1, 0)
  const again = playthrough(1, { budget: MAIN_BUDGET })
  assert.ok(first.hashes.length > 50)
  assert.deepEqual(again.hashes, first.hashes)
  const other = run(2, 0)
  const shared = Math.min(first.hashes.length, other.hashes.length)
  let same = 0
  for (let k = 0; k < shared; k++) if (first.hashes[k] === other.hashes[k]) same++
  assert.ok(same < shared / 10)
})

test('saving at checkpoints and continuing into a fresh state still reaches the ending', () => {
  const r = playthrough(4, { budget: MAIN_BUDGET, continueAtSaves: [2, 4, 6, 8, 9] })
  assert.equal(r.continues, 5)
  assert.equal(r.state.phase, PHASE_ENDED)
  assert.equal(r.state.ending, ENDING_REFORGE)
})

test('the optional bot clears every shrine and both corrupted dungeons, then still finishes', () => {
  const r = playthrough(2, { mode: BOT_OPTIONAL, budget: 35 * TICKS_PER_MINUTE })
  for (let v = 0; v < SHRINE_COUNT; v++) {
    assert.equal(r.state.flags[FLAG_SHRINE_CLEAR[v]!], 1, 'shrine ' + v + ' cleared')
    assert.equal(r.state.flags[FLAG_SHRINE_CHEST[v]!], 1, 'shrine ' + v + ' chest taken')
  }
  for (const flag of BOT_CORRUPT_CHEST) assert.equal(r.state.flags[flag], 1, 'corrupted chest ' + flag + ' taken')
  assert.equal(r.state.phase, PHASE_ENDED)
})
