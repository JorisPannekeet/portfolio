import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BULLET_ORB, ENEMY_BOSS_FIRST, ENEMY_TANK, RUN_TICKS } from '../src/game/sim/content.ts'
import { botInput } from '../src/game/sim/bot.hot.ts'
import { spawnBullet } from '../src/game/sim/bullets.hot.ts'
import { spawnEnemy } from '../src/game/sim/enemies.hot.ts'
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

test('the hash covers zone, point-of-interest, prop, boss-kill, bullet and enemy-fire state', () => {
  const s = createState()
  resetState(s, 3)
  spawnEnemy(s, ENEMY_TANK, s.px + 100, s.py)
  spawnEnemy(s, ENEMY_BOSS_FIRST, s.px - 100, s.py)
  spawnBullet(s, BULLET_ORB, s.px + 50, s.py, -1, 0)
  const base = hashState(s)
  const last = s.propCount - 1
  const mutations: [string, () => void, () => void][] = [
    ['zone', () => (s.zone = 3), () => (s.zone = 0)],
    ['bossKills', () => (s.bossKills = 1), () => (s.bossKills = 0)],
    ['poiX', () => (s.poiX[s.poiCount - 1] = s.poiX[s.poiCount - 1]! + 1), () => (s.poiX[s.poiCount - 1] = s.poiX[s.poiCount - 1]! - 1)],
    ['poiDone', () => (s.poiDone[0] = 1), () => (s.poiDone[0] = 0)],
    ['poiProgress', () => (s.poiProgress[1] = 0.5), () => (s.poiProgress[1] = 0)],
    ['poiCharge', () => (s.poiCharge[2] = 7), () => (s.poiCharge[2] = 0)],
    ['poiGuard', () => (s.poiGuard[3] = 1), () => (s.poiGuard[3] = 0)],
    ['propCount', () => s.propCount--, () => s.propCount++],
    ['propKind', () => (s.propKind[last] = s.propKind[last]! + 1), () => (s.propKind[last] = s.propKind[last]! - 1)],
    ['propX', () => (s.propX[last] = s.propX[last]! + 1), () => (s.propX[last] = s.propX[last]! - 1)],
    ['propY', () => (s.propY[last] = s.propY[last]! + 1), () => (s.propY[last] = s.propY[last]! - 1)],
    ['propCellStart', () => s.propCellStart[5]!++, () => s.propCellStart[5]!--],
    ['propCellItems', () => s.propCellItems[0]!++, () => s.propCellItems[0]!--],
    ['bulletCount', () => s.bulletCount--, () => s.bulletCount++],
    ['bKind', () => (s.bKind[0] = 2), () => (s.bKind[0] = 0)],
    ['bx', () => s.bx[0]!++, () => s.bx[0]!--],
    ['by', () => s.by[0]!++, () => s.by[0]!--],
    ['bpx', () => s.bpx[0]!++, () => s.bpx[0]!--],
    ['bpy', () => s.bpy[0]!++, () => s.bpy[0]!--],
    ['bvx', () => s.bvx[0]!++, () => s.bvx[0]!--],
    ['bvy', () => s.bvy[0]!++, () => s.bvy[0]!--],
    ['bAge', () => s.bAge[0]!++, () => s.bAge[0]!--],
    ['eAim', () => (s.eAim[0] = 9), () => (s.eAim[0] = 0)],
    ['eReload', () => s.eReload[0]!++, () => s.eReload[0]!--],
    ['bossVolley', () => (s.bossVolley[0] = 1), () => (s.bossVolley[0] = 0)],
    ['bossBurst', () => (s.bossBurst[0] = 1), () => (s.bossBurst[0] = 0)],
    ['bossPhase', () => (s.bossPhase[0] = 1), () => (s.bossPhase[0] = 0)],
    ['bossTimer', () => s.bossTimer[0]!++, () => s.bossTimer[0]!--],
    ['bossSpin', () => (s.bossSpin[0] = 5), () => (s.bossSpin[0] = 0)],
    ['damageBySource', () => s.damageBySource[1]!++, () => s.damageBySource[1]!--],
  ]
  for (const [name, change, undo] of mutations) {
    change()
    assert.notEqual(hashState(s), base, `${name} is not hashed`)
    undo()
    assert.equal(hashState(s), base)
  }
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
