import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  AIM_PLAYER,
  BOSS_COUNT,
  BOSS_FIRE_RANGE,
  BOSS_PATTERNS,
  BOSS_PHASE_COUNT,
  BULLET_LIFE,
  BULLET_ORB,
  BULLET_RADIUS,
  BULLET_SHARD,
  BULLET_SHELL,
  DAMAGE_BOSS_BULLET,
  DAMAGE_CONTACT,
  DAMAGE_SHELL,
  DESPAWN_RADIUS,
  ENEMY_BOSS_FIRST,
  ENEMY_TANK,
  EVENT_CAP,
  EV_ENEMY_FIRE,
  EV_HURT,
  INPUT_CHOICE,
  INPUT_IDLE,
  MAX_BULLETS,
  MAX_TANKS_AIMING,
  PASSIVE_PLATING,
  PHASE_LEVEL_UP,
  PLAYER_IFRAMES,
  PLAYER_RADIUS,
  PROP_HANGAR,
  PROP_POWER_PLANT,
  PROP_RADIUS,
  RUN_TICKS,
  TANK_FIRE_MAX_RANGE,
  TANK_FIRE_MIN_RANGE,
  TANK_RELOAD_TICKS,
  TANK_WINDUP_TICKS,
  VOLLEY_FAN,
  VOLLEY_RING,
  VOLLEY_WALL,
  type BossVolley,
} from '../src/game/sim/content.ts'
import { botInput } from '../src/game/sim/bot.hot.ts'
import { bulletDamage, spawnBullet } from '../src/game/sim/bullets.hot.ts'
import { spawnEnemy } from '../src/game/sim/enemies.hot.ts'
import { buildPropGrid } from '../src/game/sim/props.hot.ts'
import { createState, type State } from '../src/game/sim/state.ts'
import { step } from '../src/game/sim/step.hot.ts'
import { runBot, surface } from './harness.ts'

const LANE_RADIUS = 120
const LANE_MARGIN = 6

interface Fired {
  readonly tick: number
  readonly type: number
  readonly kind: number
  readonly x: number
  readonly y: number
}

function quietState(seed: number): State {
  const s = createState()
  surface(s, seed)
  s.weaponLevel.fill(0)
  s.maxHp = 1e9
  s.hp = 1e9
  s.xpNext = 1e9
  s.poiCount = 0
  s.propCount = 0
  buildPropGrid(s)
  return s
}

function clearHorde(s: State): void {
  for (let i = 0; i < s.enemyCount; i++) if (s.eType[i] !== ENEMY_TANK && s.eType[i]! < ENEMY_BOSS_FIRST) s.eHp[i] = 0
}

function tick(s: State): Fired[] {
  const head = s.evHead
  clearHorde(s)
  step(s, s.phase === PHASE_LEVEL_UP ? INPUT_CHOICE : INPUT_IDLE)
  const fired: Fired[] = []
  for (let n = Math.max(head, s.evHead - EVENT_CAP); n < s.evHead; n++) {
    const slot = n % EVENT_CAP
    if (s.evType[slot] !== EV_ENEMY_FIRE) continue
    fired.push({ tick: s.tick, type: s.evA[slot]!, kind: s.evB[slot]!, x: s.evX[slot]!, y: s.evY[slot]! })
  }
  return fired
}

function indexOfId(s: State, id: number): number {
  for (let i = 0; i < s.enemyCount; i++) if (s.eId[i] === id) return i
  return -1
}

function freshBullets(s: State): number[] {
  const found: number[] = []
  for (let j = 0; j < s.bulletCount; j++) if (s.bAge[j] === 1) found.push(j)
  return found
}

function hurtEvents(s: State, head: number): number[] {
  const found: number[] = []
  for (let n = head; n < s.evHead; n++) if (s.evType[n % EVENT_CAP] === EV_HURT) found.push(s.evA[n % EVENT_CAP]!)
  return found
}

function expectedBullets(v: BossVolley): number {
  if (v.shape === VOLLEY_FAN) return v.count * v.arms
  return v.count - v.gaps * v.gapWidth
}

function widestLane(v: BossVolley): number {
  const slots = v.gaps > 0 ? v.gapWidth + 1 : 1
  const opening = v.shape === VOLLEY_RING ? 2 * LANE_RADIUS * Math.sin((slots * Math.PI) / v.count) : slots * v.spread
  return opening - 2 * BULLET_RADIUS[v.kind]!
}

function measuredRingLane(s: State, bullets: number[]): number {
  const angles = bullets.map(j => Math.atan2(s.bvy[j]!, s.bvx[j]!)).sort((a, b) => a - b)
  let widest = angles[0]! + 2 * Math.PI - angles[angles.length - 1]!
  for (let k = 1; k < angles.length; k++) widest = Math.max(widest, angles[k]! - angles[k - 1]!)
  return 2 * LANE_RADIUS * Math.sin(widest / 2) - 2 * BULLET_RADIUS[s.bKind[bullets[0]!]!]!
}

function measuredWallLane(s: State, bullets: number[]): number {
  const j0 = bullets[0]!
  const speed = Math.hypot(s.bvx[j0]!, s.bvy[j0]!)
  const nx = -s.bvy[j0]! / speed
  const ny = s.bvx[j0]! / speed
  const offsets = bullets.map(j => s.bx[j]! * nx + s.by[j]! * ny).sort((a, b) => a - b)
  let widest = 0
  for (let k = 1; k < offsets.length; k++) widest = Math.max(widest, offsets[k]! - offsets[k - 1]!)
  return widest - 2 * BULLET_RADIUS[s.bKind[j0]!]!
}

test('a tank in range winds up, fires exactly one shell at the player and reloads', () => {
  const s = quietState(51)
  const tank = spawnEnemy(s, ENEMY_TANK, s.px + 120, s.py + 30)
  const id = s.eId[tank]!
  s.eReload[tank] = 0
  tick(s)
  let i = indexOfId(s, id)
  assert.equal(s.eAim[i], TANK_WINDUP_TICKS, 'the tank starts winding up')
  const braceX = s.ex[i]!
  const fired: Fired[] = []
  let shell = -1
  for (let t = 0; t < TANK_WINDUP_TICKS && fired.length === 0; t++) {
    const before = s.eAim[indexOfId(s, id)]!
    fired.push(...tick(s))
    i = indexOfId(s, id)
    if (fired.length === 0) {
      assert.equal(s.eAim[i], before - 1, 'the wind-up counts down one per tick')
      assert.ok(Math.abs(s.ex[i]! - braceX) < 0.5, 'a winding-up tank holds its ground')
    } else shell = freshBullets(s)[0]!
  }
  assert.equal(fired.length, 1)
  assert.deepEqual([fired[0]!.type, fired[0]!.kind], [ENEMY_TANK, BULLET_SHELL])
  assert.equal(s.bulletCount, 1)
  assert.equal(s.bKind[shell], BULLET_SHELL)
  const toPlayer = Math.atan2(s.py - fired[0]!.y, s.px - fired[0]!.x)
  const heading = Math.atan2(s.bvy[shell]!, s.bvx[shell]!)
  assert.ok(Math.abs(heading - toPlayer) < 0.02, 'the shell flies at the player')
  assert.equal(s.eAim[i], 0)
  assert.ok(s.eReload[i]! >= TANK_RELOAD_TICKS - 1, 'the tank reloads after firing')
  for (let t = 0; t < TANK_RELOAD_TICKS - 2; t++) assert.equal(tick(s).length, 0, 'no second shell while reloading')
})

test('a tank beyond its firing band or point-blank never fires', () => {
  const far = quietState(52)
  const tank = spawnEnemy(far, ENEMY_TANK, far.px + 420, far.py)
  far.eReload[tank] = 0
  for (let t = 0; t < 600; t++) {
    const i = indexOfId(far, far.eId[0]!)
    assert.ok(Math.hypot(far.ex[i]! - far.px, far.ey[i]! - far.py) > TANK_FIRE_MAX_RANGE)
    assert.equal(tick(far).length, 0)
    assert.equal(far.eAim[i], 0)
  }
  const close = quietState(53)
  const id = close.eId[spawnEnemy(close, ENEMY_TANK, close.px + 30, close.py)]!
  for (let t = 0; t < 600; t++) {
    const i = indexOfId(close, id)
    close.eReload[i] = 0
    close.ex[i] = close.px + TANK_FIRE_MIN_RANGE / 2
    close.ey[i] = close.py
    assert.equal(tick(close).length, 0)
  }
  assert.equal(close.bulletCount, 0)
})

test('a crowd of tanks staggers its fire and never winds up more than the cap at once', () => {
  const s = quietState(54)
  for (let k = 0; k < 24; k++) {
    const angle = (k / 24) * 2 * Math.PI
    spawnEnemy(s, ENEMY_TANK, s.px + Math.cos(angle) * 140, s.py + Math.sin(angle) * 140)
  }
  const shotTicks = new Set<number>()
  for (let t = 0; t < 900; t++) {
    for (const shot of tick(s)) shotTicks.add(shot.tick)
    let aiming = 0
    for (let i = 0; i < s.enemyCount; i++) if (s.eType[i] === ENEMY_TANK && s.eAim[i]! > 0) aiming++
    assert.ok(aiming <= MAX_TANKS_AIMING, `${aiming} tanks winding up at once`)
  }
  assert.ok(shotTicks.size >= 12, `tanks fired on only ${shotTicks.size} distinct ticks`)
})

test('a bullet that reaches the player hurts once through armour and is consumed', () => {
  const s = quietState(55)
  s.passiveLevel[PASSIVE_PLATING] = 3
  spawnBullet(s, BULLET_ORB, s.px + 40, s.py, -1, 0)
  const head = s.evHead
  const hp = s.hp
  for (let t = 0; t < 60; t++) tick(s)
  const expected = Math.max(1, Math.round(bulletDamage(s, BULLET_ORB) - 3))
  assert.deepEqual(hurtEvents(s, head), [expected])
  assert.equal(hp - s.hp, expected)
  assert.equal(s.bulletCount, 0, 'the bullet is consumed')
  assert.equal(s.damageBySource[DAMAGE_BOSS_BULLET], expected)
  assert.equal(s.damageBySource[DAMAGE_CONTACT], 0)
  s.passiveLevel[PASSIVE_PLATING] = 50
  spawnBullet(s, BULLET_SHELL, s.px + 40, s.py, -2, 0)
  for (let t = 0; t < 60; t++) tick(s)
  assert.equal(s.damageBySource[DAMAGE_SHELL], 1, 'armour never takes a hit below 1')
})

test('a bullet passes through a player with invulnerability frames', () => {
  const s = quietState(56)
  spawnBullet(s, BULLET_SHARD, s.px + 20, s.py, -2, 0)
  s.iframes = PLAYER_IFRAMES
  const hp = s.hp
  const head = s.evHead
  for (let t = 0; t < 30; t++) tick(s)
  assert.equal(s.hp, hp)
  assert.equal(hurtEvents(s, head).length, 0)
  assert.equal(s.bulletCount, 1, 'the bullet flies on')
})

test('a prop between shooter and player blocks every bullet', () => {
  const s = quietState(57)
  s.propCount = 1
  s.propKind[0] = PROP_HANGAR
  s.propX[0] = s.px + 60
  s.propY[0] = s.py
  buildPropGrid(s)
  const hp = s.hp
  const behind = s.px + 60 + PROP_RADIUS[PROP_HANGAR]! + 40
  for (let k = -3; k <= 3; k++) {
    const angle = Math.PI + k * 0.05
    spawnBullet(s, BULLET_SHELL, behind, s.py, Math.cos(angle) * 1.9, Math.sin(angle) * 1.9)
    spawnBullet(s, BULLET_ORB, behind, s.py + k * 3, -0.8, 0)
  }
  const tank = s.eId[spawnEnemy(s, ENEMY_TANK, behind + 20, s.py)]!
  let shells = 0
  for (let t = 0; t < 400; t++) {
    const i = indexOfId(s, tank)
    s.ex[i] = behind + 20
    s.ey[i] = s.py
    if (s.eAim[i] === 0) s.eReload[i] = 0
    shells += tick(s).length
    for (let j = 0; j < s.bulletCount; j++) {
      const reach = PROP_RADIUS[PROP_HANGAR]! + BULLET_RADIUS[s.bKind[j]!]!
      assert.ok(Math.hypot(s.bx[j]! - s.propX[0]!, s.by[j]! - s.propY[0]!) >= reach, 'a bullet sits inside the prop')
    }
  }
  assert.ok(shells >= 5, 'the pinned tank keeps shelling the prop')
  assert.equal(s.hp, hp)
  assert.equal(s.damageBySource[DAMAGE_SHELL] + s.damageBySource[DAMAGE_BOSS_BULLET], 0)
})

test('bullets expire, leave beyond the despawn radius and the full pool drops its oldest', () => {
  const s = quietState(58)
  spawnBullet(s, BULLET_SHARD, s.px + 200, s.py + 200, 0, 0)
  for (let t = 0; t < BULLET_LIFE[BULLET_SHARD]! - 1; t++) tick(s)
  assert.equal(s.bulletCount, 1)
  tick(s)
  assert.equal(s.bulletCount, 0, 'a bullet expires at the end of its life')
  spawnBullet(s, BULLET_ORB, s.px + DESPAWN_RADIUS - 1, s.py, 2, 0)
  tick(s)
  assert.equal(s.bulletCount, 0, 'a bullet beyond the despawn radius vanishes')
  spawnBullet(s, BULLET_ORB, s.px + 300, s.py, 0, 0)
  for (let t = 0; t < 5; t++) tick(s)
  while (s.bulletCount < MAX_BULLETS) spawnBullet(s, BULLET_ORB, s.px - 300, s.py + (s.bulletCount % 40), 0, 0)
  spawnBullet(s, BULLET_SHARD, s.px, s.py - 300, 0, 0)
  assert.equal(s.bulletCount, MAX_BULLETS)
  let oldest = 0
  let shards = 0
  for (let j = 0; j < s.bulletCount; j++) {
    oldest = Math.max(oldest, s.bAge[j]!)
    if (s.bKind[j] === BULLET_SHARD) shards++
  }
  assert.equal(oldest, 0, 'the oldest bullet made room')
  assert.equal(shards, 1)
})

test('bullet damage grows gently with the minutes', () => {
  const s = quietState(59)
  const early = bulletDamage(s, BULLET_ORB)
  s.tick = RUN_TICKS
  const late = bulletDamage(s, BULLET_ORB)
  assert.ok(late > early && late < early * 2, `orb damage ${early} at the start and ${late} at the end`)
})

test('every ring and wall in the boss table leaves a lane wider than the player at 120 px', () => {
  const need = 2 * PLAYER_RADIUS + LANE_MARGIN
  for (let b = 0; b < BOSS_COUNT; b++) {
    assert.equal(BOSS_PATTERNS[b]!.length, BOSS_PHASE_COUNT)
    for (let phase = 0; phase < BOSS_PHASE_COUNT; phase++) {
      for (const v of BOSS_PATTERNS[b]![phase]!) {
        assert.ok(v.windup > 0 && v.windup < 256, 'every volley is telegraphed')
        assert.ok(v.bursts > 0 && v.interval > 0 && v.rest > 0)
        if (v.shape === VOLLEY_FAN) continue
        assert.ok(v.gaps === 0 || v.count % v.gaps === 0, 'gaps divide the ring evenly')
        const lane = widestLane(v)
        assert.ok(lane > need, `boss ${b} phase ${phase} ${v.shape === VOLLEY_RING ? 'ring' : 'wall'} lane ${lane.toFixed(1)} px`)
      }
    }
  }
})

test('rings and spirals fly no faster than the player and aimed shots are telegraphed', () => {
  for (const phases of BOSS_PATTERNS) {
    for (const volleys of phases) {
      for (const v of volleys) {
        if (v.aim === AIM_PLAYER) assert.ok(v.windup >= 20, 'an aimed volley winds up for at least a third of a second')
        if (v.shape === VOLLEY_RING || (v.shape === VOLLEY_FAN && v.count === 1)) assert.ok(v.speed <= 1.25, 'rings and spirals stay at or below player speed')
      }
    }
  }
})

function playBoss(s: State, b: number, volleys: readonly BossVolley[], wanted: number): void {
  const bossId = s.eId[0]!
  let expected = 0
  let burst = 0
  let lastAim = 0
  let checked = 0
  while (checked < wanted) {
    const fired = tick(s)
    assert.ok(s.tick < 20000, `boss ${b} stopped firing`)
    const i = indexOfId(s, bossId)
    if (fired.length === 0) {
      lastAim = s.eAim[i]!
      continue
    }
    assert.equal(fired.length, 1, 'one event per volley')
    const v = volleys[expected]!
    const shot = fired[0]!
    assert.equal(shot.type, ENEMY_BOSS_FIRST + b)
    assert.equal(shot.kind, v.kind, `boss ${b} volley ${expected} kind`)
    const bullets = freshBullets(s)
    assert.equal(bullets.length, expectedBullets(v), `boss ${b} volley ${expected} burst ${burst} bullet count`)
    for (const j of bullets) assert.equal(s.bKind[j], v.kind)
    if (burst === 0) assert.equal(lastAim, 1, `boss ${b} volley ${expected} was telegraphed`)
    if (v.shape === VOLLEY_RING) assert.ok(Math.abs(measuredRingLane(s, bullets) - widestLane(v)) < 1, 'the ring matches its table geometry')
    if (v.shape === VOLLEY_WALL) assert.ok(Math.abs(measuredWallLane(s, bullets) - widestLane(v)) < 1, 'the wall matches its table geometry')
    burst++
    checked++
    if (burst === v.bursts) {
      burst = 0
      expected = (expected + 1) % volleys.length
    }
    lastAim = s.eAim[i]!
  }
}

for (let b = 0; b < BOSS_COUNT; b++) {
  test(`boss ${b} fires its table pattern and switches to the second phase below half health`, () => {
    const s = quietState(60 + b)
    s.enemyCount = 0
    spawnEnemy(s, ENEMY_BOSS_FIRST + b, s.px + 150, s.py)
    const phaseOne = BOSS_PATTERNS[b]![0]!
    const one = phaseOne.reduce((n, v) => n + v.bursts, 0)
    playBoss(s, b, phaseOne, one + phaseOne[0]!.bursts)
    assert.equal(s.bossPhase[b], 0)
    const i = indexOfId(s, s.eId[0]!)
    s.eHp[i] = s.eMaxHp[i]! * 0.49
    while (s.eAim[i]! > 0 || s.bossBurst[b]! > 0) tick(s)
    tick(s)
    assert.equal(s.bossPhase[b], 1)
    s.bossTimer[b] = 0
    const phaseTwo = BOSS_PATTERNS[b]![1]!
    playBoss(s, b, phaseTwo, phaseTwo.reduce((n, v) => n + v.bursts, 0))
    assert.ok(s.bulletCount <= MAX_BULLETS)
  })
}

test('a boss beyond its firing range holds fire', () => {
  const s = quietState(70)
  s.enemyCount = 0
  const boss = spawnEnemy(s, ENEMY_BOSS_FIRST + 3, s.px + BOSS_FIRE_RANGE + 60, s.py)
  for (let t = 0; t < 120; t++) {
    s.ex[boss] = s.px + BOSS_FIRE_RANGE + 60
    s.ey[boss] = s.py
    assert.equal(tick(s).length, 0)
    assert.equal(s.eAim[boss], 0)
  }
})

for (const seed of [4, 5]) {
  test(`a full bot run never holds more than ${MAX_BULLETS} bullets and every bullet stays live (seed ${seed})`, () => {
    let peak = 0
    let bossShots = 0
    runBot(seed, RUN_TICKS, s => {
      assert.ok(s.bulletCount <= MAX_BULLETS)
      peak = Math.max(peak, s.bulletCount)
      for (let j = 0; j < s.bulletCount; j++) {
        assert.ok(s.bAge[j]! < BULLET_LIFE[s.bKind[j]!]!)
        assert.ok(Math.hypot(s.bx[j]! - s.px, s.by[j]! - s.py) <= DESPAWN_RADIUS)
        if (s.bKind[j] !== BULLET_SHELL) bossShots++
      }
    })
    assert.ok(peak > 0 && bossShots > 0, 'the run should meet tanks and a firing boss')
  })
}

function botTick(s: State): void {
  clearHorde(s)
  step(s, s.phase === PHASE_LEVEL_UP ? INPUT_CHOICE : botInput(s, false))
}

test('the bot steps out of the path of aimed shells', () => {
  for (let k = 0; k < 8; k++) {
    const s = quietState(80 + k)
    const angle = (k / 8) * 2 * Math.PI
    for (let n = 0; n < 3; n++) {
      const reach = 90 + n * 30
      spawnBullet(s, BULLET_SHELL, s.px + Math.cos(angle) * reach, s.py + Math.sin(angle) * reach, -Math.cos(angle) * 1.9, -Math.sin(angle) * 1.9)
    }
    for (let t = 0; t < 120; t++) botTick(s)
    assert.equal(s.damageBySource[DAMAGE_SHELL], 0, `shells from heading ${k} hit the bot`)
  }
})

test('the bot takes cover behind a prop from a firing boss', () => {
  const s = quietState(90)
  s.propCount = 1
  s.propKind[0] = PROP_POWER_PLANT
  s.propX[0] = s.px + 70
  s.propY[0] = s.py + 20
  buildPropGrid(s)
  s.enemyCount = 0
  const id = s.eId[spawnEnemy(s, ENEMY_BOSS_FIRST + 2, s.px + 200, s.py)]!
  let shadowed = 0
  const ticks = 1200
  for (let t = 0; t < ticks; t++) {
    botTick(s)
    const i = indexOfId(s, id)
    const ox = s.propX[0]! - s.ex[i]!
    const oy = s.propY[0]! - s.ey[i]!
    const length = Math.hypot(ox, oy)
    const qx = s.px - s.ex[i]!
    const qy = s.py - s.ey[i]!
    const along = (qx * ox + qy * oy) / length
    const lateral = Math.abs(qx * oy - qy * ox) / length
    if (along > length && lateral < PROP_RADIUS[PROP_POWER_PLANT]!) shadowed++
  }
  assert.ok(shadowed > ticks / 2, `the bot hid behind the prop for only ${shadowed} of ${ticks} ticks`)
})
