import {
  AIM_PLAYER,
  BOSS_FIRE_RANGE,
  BOSS_FIRST_VOLLEY_DELAY,
  BOSS_PATTERNS,
  BOSS_PHASE_TWO_FRACTION,
  BULLET_SHELL,
  ENEMY_BOSS_FIRST,
  ENEMY_TANK,
  EV_ENEMY_FIRE,
  MAX_TANKS_AIMING,
  TANK_FIRE_MAX_RANGE,
  TANK_FIRE_MIN_RANGE,
  TANK_FIRST_RELOAD_TICKS,
  TANK_RELOAD_SPREAD,
  TANK_RELOAD_TICKS,
  TANK_SHELL_SPEED,
  TANK_WINDUP_TICKS,
  VOLLEY_FAN,
  VOLLEY_RING,
  type BossVolley,
} from './content.ts'
import { spawnBullet } from './bullets.hot.ts'
import { emit } from './events.hot.ts'
import { rngInt } from './prng.hot.ts'
import type { State } from './state.ts'
import { TRIG_SIZE, cosTurn, sinTurn } from './trig.ts'

let aimX = 1
let aimY = 0
let tanksAiming = 0

export function armHostile(s: State, i: number, type: number): void {
  s.eAim[i] = 0
  s.eReload[i] = type === ENEMY_TANK ? TANK_FIRST_RELOAD_TICKS + rngInt(s, TANK_RELOAD_SPREAD) : 0
  if (type < ENEMY_BOSS_FIRST) return
  const b = type - ENEMY_BOSS_FIRST
  s.bossVolley[b] = 0
  s.bossBurst[b] = 0
  s.bossPhase[b] = 0
  s.bossTimer[b] = BOSS_FIRST_VOLLEY_DELAY
  s.bossSpin[b] = 0
}

function aimAtPlayer(s: State, i: number): void {
  const dx = s.px - s.ex[i]!
  const dy = s.py - s.ey[i]!
  const d = Math.sqrt(dx * dx + dy * dy)
  aimX = d > 0.0001 ? dx / d : 1
  aimY = d > 0.0001 ? dy / d : 0
}

function fireRotated(s: State, kind: number, x: number, y: number, turn: number, speed: number): void {
  const c = cosTurn(turn)
  const n = sinTurn(turn)
  spawnBullet(s, kind, x, y, (aimX * c - aimY * n) * speed, (aimX * n + aimY * c) * speed)
}

function inGap(v: BossVolley, slot: number): boolean {
  if (v.gaps <= 0) return false
  const period = v.count / v.gaps
  const first = Math.floor((period - v.gapWidth) / 2)
  const at = slot % period
  return at >= first && at < first + v.gapWidth
}

function fireFan(s: State, v: BossVolley, x: number, y: number): void {
  const centre = (v.count - 1) / 2
  for (let arm = 0; arm < v.arms; arm++) {
    const armTurn = Math.floor((arm * TRIG_SIZE) / v.arms)
    for (let k = 0; k < v.count; k++) fireRotated(s, v.kind, x, y, armTurn + Math.round((k - centre) * v.spread), v.speed)
  }
}

function fireRing(s: State, v: BossVolley, x: number, y: number): void {
  for (let k = 0; k < v.count; k++) {
    if (inGap(v, k)) continue
    fireRotated(s, v.kind, x, y, Math.floor((k * TRIG_SIZE) / v.count), v.speed)
  }
}

function fireWall(s: State, v: BossVolley, x: number, y: number): void {
  const centre = (v.count - 1) / 2
  for (let k = 0; k < v.count; k++) {
    if (inGap(v, k)) continue
    const offset = (k - centre) * v.spread
    spawnBullet(s, v.kind, x - aimY * offset, y + aimX * offset, aimX * v.speed, aimY * v.speed)
  }
}

function fireVolley(s: State, i: number, b: number, v: BossVolley): void {
  if (v.aim === AIM_PLAYER) aimAtPlayer(s, i)
  else {
    aimX = cosTurn(s.bossSpin[b]!)
    aimY = sinTurn(s.bossSpin[b]!)
  }
  const x = s.ex[i]!
  const y = s.ey[i]!
  if (v.shape === VOLLEY_FAN) fireFan(s, v, x, y)
  else if (v.shape === VOLLEY_RING) fireRing(s, v, x, y)
  else fireWall(s, v, x, y)
  s.bossSpin[b] = (s.bossSpin[b]! + v.spin) % TRIG_SIZE
  emit(s, EV_ENEMY_FIRE, x, y, s.eType[i]!, v.kind)
}

function bossBurst(s: State, i: number, b: number): void {
  const volleys = BOSS_PATTERNS[b]![s.bossPhase[b]!]!
  const v = volleys[s.bossVolley[b]!]!
  fireVolley(s, i, b, v)
  const fired = s.bossBurst[b]! + 1
  if (fired < v.bursts) {
    s.bossBurst[b] = fired
    s.bossTimer[b] = v.interval
    return
  }
  s.bossBurst[b] = 0
  s.bossVolley[b] = (s.bossVolley[b]! + 1) % volleys.length
  s.bossTimer[b] = v.rest
}

function enterPhaseTwo(s: State, i: number, b: number): void {
  s.bossPhase[b] = 1
  s.bossVolley[b] = 0
  s.bossBurst[b] = 0
  s.eAim[i] = 0
}

function updateBoss(s: State, i: number, d2: number): void {
  const b = s.eType[i]! - ENEMY_BOSS_FIRST
  if (s.bossPhase[b] === 0 && s.eHp[i]! < s.eMaxHp[i]! * BOSS_PHASE_TWO_FRACTION) enterPhaseTwo(s, i, b)
  if (s.bossTimer[b]! > 0) s.bossTimer[b]!--
  if (d2 > BOSS_FIRE_RANGE * BOSS_FIRE_RANGE) {
    s.eAim[i] = 0
    s.bossBurst[b] = 0
    return
  }
  if (s.eAim[i]! > 0) {
    if (--s.eAim[i]! === 0) bossBurst(s, i, b)
    return
  }
  if (s.bossTimer[b]! > 0) return
  if (s.bossBurst[b]! > 0) {
    bossBurst(s, i, b)
    return
  }
  const v = BOSS_PATTERNS[b]![s.bossPhase[b]!]![s.bossVolley[b]!]!
  s.eAim[i] = v.windup
}

function fireShell(s: State, i: number): void {
  aimAtPlayer(s, i)
  const x = s.ex[i]!
  const y = s.ey[i]!
  spawnBullet(s, BULLET_SHELL, x, y, aimX * TANK_SHELL_SPEED, aimY * TANK_SHELL_SPEED)
  emit(s, EV_ENEMY_FIRE, x, y, ENEMY_TANK, BULLET_SHELL)
  s.eReload[i] = TANK_RELOAD_TICKS + rngInt(s, TANK_RELOAD_SPREAD)
}

function updateTank(s: State, i: number, d2: number): void {
  if (s.eAim[i]! > 0) {
    if (--s.eAim[i]! === 0) fireShell(s, i)
    return
  }
  if (s.eReload[i]! > 0) {
    s.eReload[i]!--
    return
  }
  if (tanksAiming >= MAX_TANKS_AIMING) return
  if (d2 < TANK_FIRE_MIN_RANGE * TANK_FIRE_MIN_RANGE || d2 > TANK_FIRE_MAX_RANGE * TANK_FIRE_MAX_RANGE) return
  s.eAim[i] = TANK_WINDUP_TICKS
  tanksAiming++
}

export function tanksWindingUp(s: State): number {
  let n = 0
  for (let i = 0; i < s.enemyCount; i++) if (s.eType[i] === ENEMY_TANK && s.eAim[i]! > 0) n++
  return n
}

export function runEnemyFire(s: State): void {
  tanksAiming = tanksWindingUp(s)
  const n = s.enemyCount
  for (let i = 0; i < n; i++) {
    const type = s.eType[i]!
    if (type !== ENEMY_TANK && type < ENEMY_BOSS_FIRST) continue
    if (s.eHp[i]! <= 0) continue
    const dx = s.ex[i]! - s.px
    const dy = s.ey[i]! - s.py
    const d2 = dx * dx + dy * dy
    if (type === ENEMY_TANK) updateTank(s, i, d2)
    else updateBoss(s, i, d2)
  }
}
