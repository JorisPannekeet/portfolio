import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ENEMY_ACE,
  ENEMY_GRUNT,
  ENEMY_HEAVY,
  ENEMY_STRIKER,
  ENEMY_TANK,
  PASSIVE_AUTOLOADER,
  PASSIVE_MULTILOCK,
  PASSIVE_SERVOS,
  PHASE_LEVEL_UP,
  PHASE_PLAYING,
  TICK_HZ,
  WEAPON_COUNT,
} from '../src/game/sim/content.ts'
import { botInput } from '../src/game/sim/bot.hot.ts'
import { spawnEnemy } from '../src/game/sim/enemies.hot.ts'
import { createState, resetState } from '../src/game/sim/state.ts'
import { step } from '../src/game/sim/step.hot.ts'
import { HEADING_TURNS, cosTurn, sinTurn } from '../src/game/sim/trig.ts'

const BUDGET_MS = 2
const MEASURED_TICKS = 600
const TARGET_HOSTILES = 500
const HOSTILE_MIX = [ENEMY_GRUNT, ENEMY_STRIKER, ENEMY_TANK, ENEMY_HEAVY, ENEMY_ACE]

test(`mean step time with about ${TARGET_HOSTILES} hostiles stays under ${BUDGET_MS} ms`, () => {
  const s = createState()
  resetState(s, 77)
  s.tick = 7 * 60 * TICK_HZ
  s.bossCursor = 2
  s.maxHp = 1e9
  s.hp = 1e9
  for (let w = 0; w < WEAPON_COUNT; w++) s.weaponLevel[w] = 4
  s.passiveLevel[PASSIVE_SERVOS] = 3
  s.passiveLevel[PASSIVE_AUTOLOADER] = 3
  s.passiveLevel[PASSIVE_MULTILOCK] = 1
  s.droneActive = 1000
  for (let i = 0; i < TARGET_HOSTILES; i++) {
    const turn = i * 7 * HEADING_TURNS
    const radius = 40 + (i % 25) * 10
    spawnEnemy(s, HOSTILE_MIX[i % HOSTILE_MIX.length]!, s.px + cosTurn(turn) * radius, s.py + sinTurn(turn) * radius)
  }
  let hostileTicks = 0
  let elapsed = 0
  let ticks = 0
  while (ticks < MEASURED_TICKS) {
    const input = botInput(s)
    const started = performance.now()
    step(s, input)
    elapsed += performance.now() - started
    if (s.phase === PHASE_PLAYING || s.phase === PHASE_LEVEL_UP) {
      hostileTicks += s.enemyCount
      ticks++
    }
  }
  const meanMs = elapsed / ticks
  const meanHostiles = hostileTicks / ticks
  console.log(`perf: mean step ${meanMs.toFixed(3)} ms over ${ticks} ticks with ${meanHostiles.toFixed(0)} hostiles on average`)
  assert.ok(meanHostiles > 400, `expected a dense field, got ${meanHostiles.toFixed(0)} hostiles`)
  assert.ok(meanMs < BUDGET_MS, `mean step ${meanMs.toFixed(3)} ms exceeds ${BUDGET_MS} ms`)
})
