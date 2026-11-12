import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  BOSS_BARROW_KING,
  BOSS_DROWNED_ABBOT,
  BOSS_FORGEMASTER,
  BOSS_STORM_ABBESS,
  BOSS_VAREK,
  ENEMY_ARCHER,
  ENEMY_KIND_COUNT,
  ENEMY_KNIGHT,
  HEAT_MAX,
  IN_COMMAND,
  KEY_LONGBOW,
  MAX_ENEMIES,
  PHASE_DEAD,
  PHASE_PLAYING,
  PL_IDLE,
  TICK_HZ,
} from '../../src/rpg/sim/content.ts'
import { combatBotInput } from '../../src/rpg/sim/bot-combat.hot.ts'
import { hashState } from '../../src/rpg/sim/hash.ts'
import { arena, duel, spawnNear, tick } from './action-arena.ts'

const BOSSES = [BOSS_BARROW_KING, BOSS_DROWNED_ABBOT, BOSS_FORGEMASTER, BOSS_STORM_ABBESS, BOSS_VAREK]
const SEEDS = [1, 2, 3, 4, 5]
const DUEL_TICKS = 240 * TICK_HZ

for (const boss of BOSSES) {
  test(`the combat bot beats boss ${boss} on at least four of five seeds`, () => {
    const wins = SEEDS.filter(seed => duel(seed, boss, 25, DUEL_TICKS).won).length
    assert.ok(wins >= 4, `won ${wins} of ${SEEDS.length}`)
  })
}

function brawlTrace(seed: number): number[] {
  const s = arena(seed)
  s.stancesUnlocked = 15
  spawnNear(s, ENEMY_KNIGHT, 60, 0)
  spawnNear(s, ENEMY_ARCHER, -80, 30, 1)
  spawnNear(s, BOSS_VAREK, 0, 90)
  s.statCrit = 0.2
  const trace: number[] = []
  for (let t = 0; t < 30 * TICK_HZ; t++) {
    tick(s, combatBotInput(s))
    if (t % 300 === 0) trace.push(hashState(s))
  }
  trace.push(hashState(s))
  return trace
}

test('the same seed and inputs produce an identical hash trace', () => {
  assert.deepEqual(brawlTrace(11), brawlTrace(11))
})

test('different seeds diverge', () => {
  const a = brawlTrace(11)
  const b = brawlTrace(12)
  assert.notEqual(a[a.length - 1], b[b.length - 1])
})

function lcg(seed: number): () => number {
  let x = seed >>> 0
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0
    return x
  }
}

test('20k ticks of random input never throw and keep the meters in range', () => {
  const s = arena(13)
  s.stancesUnlocked = 15
  s.keyItems = KEY_LONGBOW
  s.nodes.fill(1)
  s.statCrit = 0.1
  const next = lcg(99)
  let held = 0
  for (let t = 0; t < 20000; t++) {
    if (t % 6 === 0) held = next() & 0x7fff & ~IN_COMMAND
    let alive = 0
    for (let i = 0; i < MAX_ENEMIES; i++) alive += s.eAlive[i]!
    if (alive < 4 && t % 90 === 0) spawnNear(s, next() % ENEMY_KIND_COUNT, (next() % 200) - 100, (next() % 200) - 100, next() % 2)
    if (s.phase === PHASE_DEAD) {
      s.phase = PHASE_PLAYING
      s.hp = s.statMaxHp
      s.playerState = PL_IDLE
    }
    tick(s, held)
    assert.ok(s.hp >= 0 && s.hp <= s.statMaxHp, `hp ${s.hp} at ${t}`)
    assert.ok(s.stamina >= 0 && s.stamina <= s.statMaxStamina, `stamina ${s.stamina} at ${t}`)
    assert.ok(s.focus >= 0 && s.focus <= s.statMaxFocus, `focus ${s.focus} at ${t}`)
    assert.ok(s.heat >= 0 && s.heat <= HEAT_MAX, `heat ${s.heat} at ${t}`)
    assert.ok(Number.isFinite(s.playerX) && Number.isFinite(s.playerY), `position at ${t}`)
  }
})
