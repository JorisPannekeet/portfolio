import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  AI_WINDUP,
  BOSS_BARROW_KING,
  BOSS_FORGEMASTER,
  BOSS_VAREK,
  ELEMENT_NONE,
  ENEMY_ARCHER,
  ENEMY_FOOTMAN,
  ENEMY_KNIGHT,
  ENEMY_WIGHT,
  EV_BOSS_PHASE,
  EV_DEAD,
  EV_ENEMY_DIE,
  EV_SHOOT,
  EV_TELEGRAPH,
  IN_LOCK,
  MAX_ENEMIES,
  PHASE_DEAD,
  PL_DEAD,
  PROJ_ARROW,
} from '../../src/rpg/sim/content.ts'
import { ELITE_DAMAGE, ELITE_HP, ENEMY_DAMAGE, ENEMY_HP } from '../../src/rpg/sim/combat-tuning.ts'
import { clearActors, damageEnemy, enemyRadius, setStagger, spawnEnemy, windupTicks } from '../../src/rpg/sim/enemies.hot.ts'
import { hurtPlayer } from '../../src/rpg/sim/player.hot.ts'
import { arena, events, run, spawnNear, tick } from './action-arena.ts'

test('a knight blocks frontal hits unless staggered or struck from behind', () => {
  const s = arena(1)
  const k = spawnNear(s, ENEMY_KNIGHT, 30, 0)
  const full = ENEMY_HP[ENEMY_KNIGHT]!
  damageEnemy(s, k, 20, ELEMENT_NONE, s.playerX, s.playerY)
  const frontal = full - s.eHp[k]!
  assert.ok(frontal < 3, `frontal ${frontal}`)
  const before = s.eHp[k]!
  damageEnemy(s, k, 20, ELEMENT_NONE, s.eX[k]! + 30, s.eY[k]!)
  assert.equal(before - s.eHp[k]!, 20)
  setStagger(s, k, 60)
  const staggered = s.eHp[k]!
  damageEnemy(s, k, 10, ELEMENT_NONE, s.playerX, s.playerY)
  assert.equal(staggered - s.eHp[k]!, 10)
})

test('elites have more health and hit harder', () => {
  const s = arena(2)
  const e = spawnNear(s, ENEMY_FOOTMAN, 14, 0, 1)
  assert.equal(s.eMaxHp[e], ENEMY_HP[ENEMY_FOOTMAN]! * ELITE_HP)
  let ticks = 0
  while (s.hp === 100 && ticks++ < 300) tick(s, 0)
  assert.ok(Math.abs(100 - s.hp - ENEMY_DAMAGE[ENEMY_FOOTMAN]! * ELITE_DAMAGE) < 1e-4)
})

test('enemies telegraph before they strike', () => {
  const s = arena(3)
  const e = spawnNear(s, ENEMY_FOOTMAN, 14, 0)
  const since = s.evHead
  while (s.eState[e] !== AI_WINDUP) tick(s, 0)
  const telegraphs = events(s, EV_TELEGRAPH, since)
  assert.equal(telegraphs.length, 1)
  assert.equal(s.evA[telegraphs[0]! % 64], e)
  assert.equal(s.hp, 100)
  run(s, 0, windupTicks(s, e) + 1)
  assert.ok(s.hp < 100)
})

test('archers keep their distance and shoot arrows', () => {
  const s = arena(4)
  const e = spawnNear(s, ENEMY_ARCHER, 30, 0)
  const since = s.evHead
  run(s, 0, 200)
  const dx = s.eX[e]! - s.playerX
  assert.ok(dx > 40, `archer at ${dx}`)
  const shots = events(s, EV_SHOOT, since)
  assert.ok(shots.length >= 1)
  assert.equal(s.evA[shots[0]! % 64], PROJ_ARROW)
})

test('a killing blow emits the death, clears the lock and frees the slot for reuse', () => {
  const s = arena(5)
  const e = spawnNear(s, ENEMY_FOOTMAN, 40, 0, 1)
  tick(s, IN_LOCK)
  assert.equal(s.lockTarget, e)
  const since = s.evHead
  damageEnemy(s, e, 500, ELEMENT_NONE, s.playerX, s.playerY)
  const deaths = events(s, EV_ENEMY_DIE, since)
  assert.equal(deaths.length, 1)
  assert.equal(s.evA[deaths[0]! % 64], ENEMY_FOOTMAN)
  assert.equal(s.evB[deaths[0]! % 64], 1)
  assert.equal(s.eAlive[e], 0)
  assert.equal(s.lockTarget, -1)
  assert.equal(spawnNear(s, ENEMY_WIGHT, 40, 0), e)
})

test('the enemy pool refuses spawns when full and clearActors empties it', () => {
  const s = arena(6)
  for (let i = 0; i < MAX_ENEMIES; i++) assert.equal(spawnEnemy(s, ENEMY_FOOTMAN, 100 + i, 100, 0, i), i)
  assert.equal(spawnEnemy(s, ENEMY_FOOTMAN, 50, 50, 0, -1), -1)
  assert.equal(s.eObj[3], 3)
  clearActors(s)
  assert.equal(s.eAlive.reduce((a, b) => a + b, 0), 0)
  assert.equal(s.prAlive.reduce((a, b) => a + b, 0), 0)
})

test('the player dies, lingers, then the game enters PHASE_DEAD', () => {
  const s = arena(7)
  s.hp = 5
  hurtPlayer(s, 50, s.playerX + 10, s.playerY)
  assert.equal(s.playerState, PL_DEAD)
  const since = s.evHead
  run(s, 0, 120)
  assert.equal(s.phase, PHASE_DEAD)
  assert.equal(events(s, EV_DEAD, since).length, 1)
})

test('Varek passes through all three phases and cannot skip one', () => {
  const s = arena(8)
  const v = spawnNear(s, BOSS_VAREK, 120, 0)
  const r0 = enemyRadius(s, v)
  const since = s.evHead
  damageEnemy(s, v, 5000, ELEMENT_NONE, s.playerX, s.playerY)
  assert.equal(s.eAlive[v], 1)
  assert.equal(s.bossPhase, 1)
  damageEnemy(s, v, 5000, ELEMENT_NONE, s.playerX, s.playerY)
  assert.equal(s.bossPhase, 2)
  assert.ok(enemyRadius(s, v) > r0)
  const phases = events(s, EV_BOSS_PHASE, since).map(e => s.evA[e % 64])
  assert.deepEqual(phases, [1, 2])
  damageEnemy(s, v, 5000, ELEMENT_NONE, s.playerX, s.playerY)
  assert.equal(s.eAlive[v], 0)
})

test('the Barrow King summons two wights at half health', () => {
  const s = arena(9)
  const b = spawnNear(s, BOSS_BARROW_KING, 120, 0)
  damageEnemy(s, b, s.eMaxHp[b]! * 0.6 * 2, ELEMENT_NONE, s.playerX, s.playerY)
  let wights = 0
  for (let i = 0; i < MAX_ENEMIES; i++) if (s.eAlive[i] === 1 && s.eKind[i] === ENEMY_WIGHT) wights++
  assert.equal(wights, 2)
  assert.equal(s.bossPhase, 1)
})

test('the Forgemaster enrages below 40% and winds up faster', () => {
  const s = arena(10)
  const f = spawnNear(s, BOSS_FORGEMASTER, 120, 0)
  const calm = windupTicks(s, f)
  damageEnemy(s, f, s.eMaxHp[f]! * 0.7 * 2, ELEMENT_NONE, s.playerX, s.playerY)
  assert.equal(s.bossPhase, 1)
  assert.ok(windupTicks(s, f) < calm || calm === 0)
})

test('burning enemies lose health over time', () => {
  const s = arena(11)
  const e = spawnNear(s, ENEMY_KNIGHT, 150, 0)
  s.eCooldown[e] = 1e9
  s.eBurn[e] = 200
  run(s, 0, 120)
  assert.ok(s.eHp[e]! < ENEMY_HP[ENEMY_KNIGHT]!)
})
