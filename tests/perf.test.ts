import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  BOSS_COUNT,
  BULLET_KIND_COUNT,
  ENEMY_ACE,
  ENEMY_BOSS_FIRST,
  ENEMY_GRUNT,
  ENEMY_HEAVY,
  ENEMY_STRIKER,
  ENEMY_TANK,
  MAX_BULLETS,
  PASSIVE_AUTOLOADER,
  PASSIVE_MULTILOCK,
  PASSIVE_SERVOS,
  PHASE_LEVEL_UP,
  PHASE_PLAYING,
  TICK_HZ,
  WEAPON_COUNT,
} from '../src/game/sim/content.ts'
import { botInput } from '../src/game/sim/bot.hot.ts'
import { spawnBullet } from '../src/game/sim/bullets.hot.ts'
import { spawnEnemy } from '../src/game/sim/enemies.hot.ts'
import { createState, resetState, type State } from '../src/game/sim/state.ts'
import { step } from '../src/game/sim/step.hot.ts'
import { HEADING_TURNS, cosTurn, sinTurn } from '../src/game/sim/trig.ts'

const BUDGET_MS = 2
const MEASURED_TICKS = 600
const TARGET_HOSTILES = 500
const HOSTILE_MIX = [ENEMY_GRUNT, ENEMY_STRIKER, ENEMY_TANK, ENEMY_HEAVY, ENEMY_ACE]

function fillBullets(s: State): void {
  let k = s.bulletCount
  while (s.bulletCount < MAX_BULLETS) {
    const turn = k * 37
    const radius = 90 + (k % 31) * 10
    const ux = cosTurn(turn)
    const uy = sinTurn(turn)
    spawnBullet(s, k % BULLET_KIND_COUNT, s.px + ux * radius, s.py + uy * radius, -uy * 0.8, ux * 0.8)
    k++
  }
}

test(`mean step time with about ${TARGET_HOSTILES} hostiles, four firing bosses and a full bullet pool stays under ${BUDGET_MS} ms`, () => {
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
  for (let b = 0; b < BOSS_COUNT; b++) spawnEnemy(s, ENEMY_BOSS_FIRST + b, s.px + cosTurn(b * 256) * 120, s.py + sinTurn(b * 256) * 120)
  for (let i = 0; i < TARGET_HOSTILES; i++) {
    const turn = i * 7 * HEADING_TURNS
    const radius = 40 + (i % 25) * 10
    spawnEnemy(s, HOSTILE_MIX[i % HOSTILE_MIX.length]!, s.px + cosTurn(turn) * radius, s.py + sinTurn(turn) * radius)
  }
  let bulletTicks = 0
  let hostileTicks = 0
  let elapsed = 0
  let ticks = 0
  while (ticks < MEASURED_TICKS) {
    const input = botInput(s)
    fillBullets(s)
    const started = performance.now()
    step(s, input)
    elapsed += performance.now() - started
    if (s.phase === PHASE_PLAYING || s.phase === PHASE_LEVEL_UP) {
      hostileTicks += s.enemyCount
      bulletTicks += s.bulletCount
      ticks++
    }
  }
  const meanMs = elapsed / ticks
  const meanHostiles = hostileTicks / ticks
  const meanBullets = bulletTicks / ticks
  console.log(`perf: mean step ${meanMs.toFixed(3)} ms over ${ticks} ticks with ${meanHostiles.toFixed(0)} hostiles and ${meanBullets.toFixed(0)} bullets on average`)
  assert.ok(meanBullets > MAX_BULLETS * 0.9, `expected a near-full bullet pool, got ${meanBullets.toFixed(0)}`)
  assert.ok(meanHostiles > 400, `expected a dense field, got ${meanHostiles.toFixed(0)} hostiles`)
  assert.ok(meanMs < BUDGET_MS, `mean step ${meanMs.toFixed(3)} ms exceeds ${BUDGET_MS} ms`)
})
