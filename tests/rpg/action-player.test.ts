import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  AI_AIR,
  AI_STAGGER,
  BOSS_BARROW_KING,
  ELEMENT_EMBER,
  ELEMENT_GALE,
  ELEMENT_STONE,
  ELEMENT_TIDE,
  ENEMY_ARCHER,
  ENEMY_DROWNED,
  ENEMY_FOOTMAN,
  EV_BLOCK,
  EV_DEFLECT,
  EV_DODGE,
  EV_FINISHER,
  EV_HIT,
  EV_MOUNT,
  EV_PARRY,
  EV_PERFECT_BLOCK,
  EV_PLAYER_HURT,
  EV_SHOOT,
  EV_SKILL,
  EV_SWING,
  IN_ATTACK,
  IN_DODGE,
  IN_GUARD,
  IN_INTERACT,
  IN_SKILL,
  IN_STANCE_SHIFT,
  KEY_LONGBOW,
  OWNER_ENEMY,
  OWNER_PLAYER,
  PL_ATTACK,
  PL_DODGE,
  PL_GRAPPLE,
  PL_GUARD,
  PL_IDLE,
  PROJ_ARROW,
  PROJ_PLAYER_ARROW,
  TILE_WALL,
} from '../../src/rpg/sim/content.ts'
import { HEAT_HOLD, HEAT_PER_HIT, MOUNT_SPEED, MOVE_STAMINA, SKILL_COST, WALK_SPEED } from '../../src/rpg/sim/combat-tuning.ts'
import { hurtPlayer, skillCharge } from '../../src/rpg/sim/player.hot.ts'
import { spawnProjectile } from '../../src/rpg/sim/projectiles.hot.ts'
import { ARENA_W, arena, events, run, spawnNear, tick } from './action-arena.ts'

const EAST = 1

function stance(element: number): number {
  return (element + 1) << IN_STANCE_SHIFT
}

function swings(s: ReturnType<typeof arena>, since: number): number[] {
  return events(s, EV_SWING, since).map(e => s.evB[e % s.evB.length]!)
}

test('attack presses run the three-step combo, buffer during a swing, then wrap to step 0', () => {
  const s = arena(1)
  s.stancesUnlocked = 1
  const since = s.evHead
  for (let k = 0; k < 4; k++) {
    tick(s, IN_ATTACK)
    run(s, 0, 24)
  }
  run(s, 0, 100)
  assert.deepEqual(swings(s, since).slice(0, 4), [0, 1, 2, 0])
})

test('an attack press without a buffered follow-up returns to idle and resets the combo', () => {
  const s = arena(1)
  s.stancesUnlocked = 1
  tick(s, IN_ATTACK)
  run(s, 0, 120)
  assert.equal(s.playerState, PL_IDLE)
  const since = s.evHead
  tick(s, IN_ATTACK)
  assert.deepEqual(swings(s, since), [0])
})

test('each swing spends its stamina and a hit earns focus', () => {
  const s = arena(1)
  s.stancesUnlocked = 1
  s.focus = 50
  spawnNear(s, ENEMY_DROWNED, 14, 0)
  tick(s, IN_ATTACK)
  assert.equal(s.stamina, 100 - MOVE_STAMINA[ELEMENT_STONE * 4]!)
  run(s, 0, 20)
  assert.ok(s.focus > 50, 'a landed hit gives focus')
})

test('focus regenerates on its own only up to one skill cost', () => {
  const s = arena(1)
  run(s, 0, 2000)
  assert.equal(s.focus, SKILL_COST)
  s.focus = 60
  run(s, 0, 200)
  assert.equal(s.focus, 60)
})

test('a guard raised just before the hit is a perfect block, a held guard is a plain block, no guard takes damage', () => {
  const perfect = arena(1)
  perfect.stancesUnlocked = 1
  tick(perfect, IN_GUARD)
  const p0 = perfect.evHead
  hurtPlayer(perfect, 10, perfect.playerX + 20, perfect.playerY)
  assert.equal(events(perfect, EV_PERFECT_BLOCK, p0).length, 1)
  assert.equal(perfect.hp, 100)
  assert.ok(perfect.focus >= 30)

  const late = arena(1)
  late.stancesUnlocked = 1
  run(late, IN_GUARD, 40)
  const l0 = late.evHead
  hurtPlayer(late, 10, late.playerX + 20, late.playerY)
  assert.equal(events(late, EV_BLOCK, l0).length, 1)
  assert.equal(late.hp, 100)
  assert.ok(late.stamina < 100)

  const open = arena(1)
  hurtPlayer(open, 10, open.playerX + 20, open.playerY)
  assert.equal(open.hp, 90)
})

test('Stone stance blocks for less stamina, and a two-handed plain block lets half the damage through', () => {
  const sword = arena(1)
  sword.stancesUnlocked = 3
  sword.stance = ELEMENT_TIDE
  run(sword, IN_GUARD, 40)
  hurtPlayer(sword, 10, sword.playerX + 20, sword.playerY)
  const stone = arena(1)
  stone.stancesUnlocked = 1
  run(stone, IN_GUARD, 40)
  hurtPlayer(stone, 10, stone.playerX + 20, stone.playerY)
  assert.ok(100 - stone.stamina < 100 - sword.stamina)
  const great = arena(1)
  great.statTwoHanded = 1
  run(great, IN_GUARD, 40)
  hurtPlayer(great, 10, great.playerX + 20, great.playerY)
  assert.equal(great.hp, 95)
})

test('a guard facing away does not block', () => {
  const s = arena(1)
  tick(s, IN_GUARD)
  hurtPlayer(s, 10, s.playerX - 20, s.playerY)
  assert.equal(s.hp, 90)
})

test('running out of stamina breaks the guard', () => {
  const s = arena(1)
  run(s, IN_GUARD, 40)
  s.stamina = 5
  hurtPlayer(s, 20, s.playerX + 20, s.playerY)
  assert.equal(s.stamina, 0)
  assert.ok(s.hp < 100)
  assert.notEqual(s.playerState, PL_GUARD)
})

test('a Tide parry staggers and counters a melee attacker', () => {
  const s = arena(2)
  s.stancesUnlocked = 2
  s.stance = ELEMENT_TIDE
  const e = spawnNear(s, ENEMY_FOOTMAN, 14, 0)
  while (s.eState[e] !== 2) tick(s, 0)
  while (s.eState[e] === 2 && s.eTimer[e]! < 24) tick(s, 0)
  const since = s.evHead
  run(s, IN_GUARD, 12)
  assert.equal(events(s, EV_PARRY, since).length, 1)
  assert.equal(s.hp, 100)
  assert.equal(s.eState[e], AI_STAGGER)
  assert.ok(s.eHp[e]! < s.eMaxHp[e]!)
  assert.ok(s.focus >= 35)
})

test('a Tide parry sends an arrow back at its shooter', () => {
  const s = arena(2)
  s.stancesUnlocked = 2
  s.stance = ELEMENT_TIDE
  const archer = spawnNear(s, ENEMY_ARCHER, 80, 0)
  const p = spawnProjectile(s, PROJ_ARROW, OWNER_ENEMY, s.playerX + 20, s.playerY, -3, 0, 7)
  tick(s, IN_GUARD)
  const since = s.evHead
  run(s, IN_GUARD, 6)
  assert.equal(events(s, EV_PARRY, since).length, 1)
  assert.equal(events(s, EV_DEFLECT, since).length, 1)
  assert.equal(s.prOwner[p], OWNER_PLAYER)
  assert.ok(s.prVx[p]! > 0)
  run(s, 0, 40)
  assert.ok(s.eHp[archer]! < s.eMaxHp[archer]! || s.eAlive[archer] === 0)
})

test('a Gale guard deflects arrows, other stances only stop them', () => {
  const gale = arena(2)
  gale.stancesUnlocked = 8
  gale.stance = ELEMENT_GALE
  run(gale, IN_GUARD, 30)
  const g = spawnProjectile(gale, PROJ_ARROW, OWNER_ENEMY, gale.playerX + 12, gale.playerY, -3, 0, 7)
  run(gale, IN_GUARD, 5)
  assert.equal(gale.prOwner[g], OWNER_PLAYER)
  const stone = arena(2)
  stone.stancesUnlocked = 1
  run(stone, IN_GUARD, 30)
  const t = spawnProjectile(stone, PROJ_ARROW, OWNER_ENEMY, stone.playerX + 12, stone.playerY, -3, 0, 7)
  run(stone, IN_GUARD, 5)
  assert.equal(stone.prAlive[t], 0)
  assert.equal(stone.hp, 100)
})

test('a dodge rolls with i-frames, a Gale dash goes further', () => {
  const s = arena(3)
  const since = s.evHead
  tick(s, IN_DODGE | EAST)
  assert.equal(s.playerState, PL_DODGE)
  assert.ok(s.stamina < 100)
  hurtPlayer(s, 10, s.playerX + 20, s.playerY)
  assert.equal(s.hp, 100)
  run(s, 0, 40)
  hurtPlayer(s, 10, s.playerX + 20, s.playerY)
  assert.equal(s.hp, 90)
  assert.equal(s.evA[events(s, EV_DODGE, since)[0]! % 64], 0)

  const roll = arena(3)
  const x0 = roll.playerX
  tick(roll, IN_DODGE | EAST)
  run(roll, 0, 30)
  const dash = arena(3)
  dash.stancesUnlocked = 8
  dash.stance = ELEMENT_GALE
  const d0 = dash.evHead
  tick(dash, IN_DODGE | EAST)
  run(dash, 0, 30)
  assert.ok(dash.playerX - x0 > roll.playerX - x0)
  assert.equal(dash.evA[events(dash, EV_DODGE, d0)[0]! % 64], 1)
})

function dummy(s: ReturnType<typeof arena>): number {
  const e = spawnNear(s, BOSS_BARROW_KING, 18, 0)
  s.eCooldown[e] = 1e9
  return e
}

function hitDamage(s: ReturnType<typeof arena>, since: number): number[] {
  return events(s, EV_HIT, since).map(e => s.evB[e % s.evB.length]!)
}

test('switching stance mid-combo makes the next attack a finisher of the new stance', () => {
  const plain = arena(4)
  plain.stancesUnlocked = 3
  plain.stance = ELEMENT_TIDE
  plain.statAttack = 100
  dummy(plain)
  const p0 = plain.evHead
  for (let k = 0; k < 3; k++) {
    tick(plain, IN_ATTACK)
    run(plain, 0, 24)
  }
  const thirdHit = hitDamage(plain, p0)[2]!

  const s = arena(4)
  s.stancesUnlocked = 3
  s.statAttack = 100
  const b = dummy(s)
  tick(s, IN_ATTACK)
  tick(s, stance(ELEMENT_TIDE))
  assert.equal(s.playerChain, 1)
  run(s, 0, 30)
  const since = s.evHead
  tick(s, IN_ATTACK)
  run(s, 0, 30)
  assert.equal(events(s, EV_FINISHER, since).length, 1)
  assert.equal(s.playerChain, 0)
  const finisherHit = hitDamage(s, since)[0]!
  assert.ok(Math.abs(finisherHit / thirdHit - 1.6) < 0.03, `finisher ${finisherHit} vs ${thirdHit}`)
  assert.ok(s.eChill[b]! > s.tick + 100)
})

test('Ember hits build heat that decays after a pause and boosts damage', () => {
  const s = arena(5)
  s.stancesUnlocked = 4
  s.stance = ELEMENT_EMBER
  s.statAttack = 1
  dummy(s)
  tick(s, IN_ATTACK)
  run(s, 0, 30)
  assert.equal(s.heat, HEAT_PER_HIT)
  run(s, 0, HEAT_HOLD - 30)
  assert.equal(s.heat, HEAT_PER_HIT)
  run(s, 0, 200)
  assert.equal(s.heat, 0)
})

test('each skill costs focus, damages and applies its element status', () => {
  const expectations = [
    [ELEMENT_STONE, (e: number, st: ReturnType<typeof arena>) => st.eState[e] === AI_STAGGER],
    [ELEMENT_TIDE, (e: number, st: ReturnType<typeof arena>) => st.eChill[e]! > st.tick + 100],
    [ELEMENT_EMBER, (e: number, st: ReturnType<typeof arena>) => st.eBurn[e]! > st.tick + 100],
    [ELEMENT_GALE, (e: number, st: ReturnType<typeof arena>) => st.eState[e] === AI_AIR],
  ] as const
  for (const [element, applied] of expectations) {
    const s = arena(6)
    s.stancesUnlocked = 1 << element
    s.stance = element
    s.statAttack = 4
    s.focus = SKILL_COST
    s.heat = 40
    const e = spawnNear(s, ENEMY_FOOTMAN, 20, 0)
    const since = s.evHead
    tick(s, IN_SKILL)
    assert.equal(events(s, EV_SKILL, since).length, 1, 'skill fires')
    assert.ok(s.focus < 1, 'skill spends focus')
    assert.ok(s.eHp[e]! < s.eMaxHp[e]!, 'skill damages')
    assert.ok(applied(e, s), 'skill applies status')
    if (element === ELEMENT_EMBER) assert.equal(s.heat, 0)
  }
})

test('a skill needs its stance unlocked and enough focus', () => {
  const locked = arena(6)
  locked.focus = SKILL_COST
  const since = locked.evHead
  tick(locked, IN_SKILL)
  assert.equal(events(locked, EV_SKILL, since).length, 0)
  const tired = arena(6)
  tired.stancesUnlocked = 1
  tired.focus = SKILL_COST - 1
  const t0 = tired.evHead
  tick(tired, IN_SKILL)
  assert.equal(events(tired, EV_SKILL, t0).length, 0)
})

test('movement walks at foot speed and rides faster', () => {
  const s = arena(7)
  const x0 = s.playerX
  run(s, EAST, 10)
  assert.ok(Math.abs(s.playerX - x0 - WALK_SPEED * 10) < 1e-6)
  s.mounted = 1
  const x1 = s.playerX
  run(s, EAST, 10)
  assert.ok(Math.abs(s.playerX - x1 - MOUNT_SPEED * 10) < 1e-6)
})

test('an attack press while mounted dismounts instead of swinging', () => {
  const s = arena(7)
  s.mounted = 1
  const since = s.evHead
  tick(s, IN_ATTACK)
  assert.equal(s.mounted, 0)
  assert.equal(s.evA[events(s, EV_MOUNT, since)[0]! % 64], 0)
  assert.equal(events(s, EV_SWING, since).length, 0)
})

test('the longbow fires a player arrow on interact when nothing else used the press', () => {
  const s = arena(8)
  const since = s.evHead
  tick(s, IN_INTERACT)
  assert.equal(events(s, EV_SHOOT, since).length, 0)
  tick(s, 0)
  s.keyItems = KEY_LONGBOW
  tick(s, IN_INTERACT)
  const shots = events(s, EV_SHOOT, since)
  assert.equal(shots.length, 1)
  assert.equal(s.evA[shots[0]! % 64], PROJ_PLAYER_ARROW)
})

test('a grapple glides over walls to its target untouchable, then returns to idle', () => {
  const s = arena(9)
  const row = Math.floor(s.playerY / 16)
  const col = Math.floor(s.playerX / 16) + 2
  s.tiles[row * ARENA_W + col] = TILE_WALL
  s.playerState = PL_GRAPPLE
  s.grappleX = s.playerX + 64
  s.grappleY = s.playerY
  tick(s, 0)
  hurtPlayer(s, 10, s.playerX + 10, s.playerY)
  assert.equal(s.hp, 100)
  run(s, 0, 30)
  assert.equal(s.playerX, s.grappleX)
  assert.equal(s.playerState, PL_IDLE)
})

test('the player cannot attack while in a stun, and a hurt emits the damage taken', () => {
  const s = arena(10)
  const since = s.evHead
  hurtPlayer(s, 12, s.playerX + 10, s.playerY)
  tick(s, IN_ATTACK)
  assert.notEqual(s.playerState, PL_ATTACK)
  assert.equal(s.evA[events(s, EV_PLAYER_HURT, since)[0]! % 64], 12)
})

test('skill charge reads 0 while locked, tracks the recharge, and reaches 1 exactly when the skill can fire', () => {
  const s = arena(8)
  s.focus = SKILL_COST
  assert.equal(skillCharge(s), 0, 'no stance unlocked')
  s.stancesUnlocked = 1
  assert.equal(skillCharge(s), 1)
  tick(s, IN_SKILL)
  assert.ok(skillCharge(s) < 0.1, 'casting empties the charge')
  let previous = skillCharge(s)
  let ticks = 0
  while (skillCharge(s) < 1 && ticks < 2000) {
    const before = s.evHead
    const early = skillCharge(s) < 0.9
    tick(s, early && ticks % 2 === 0 ? IN_SKILL : 0)
    if (early) assert.equal(events(s, EV_SKILL, before).length, 0, 'a press below full charge does nothing')
    assert.ok(skillCharge(s) >= previous, 'charge only rises while idle')
    previous = skillCharge(s)
    ticks++
  }
  assert.equal(skillCharge(s), 1)
  tick(s, 0)
  const ready = s.evHead
  tick(s, IN_SKILL)
  assert.equal(events(s, EV_SKILL, ready).length, 1)
})
