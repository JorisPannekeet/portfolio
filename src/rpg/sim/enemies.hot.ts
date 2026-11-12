import {
  AI_AIR,
  AI_CHASE,
  AI_IDLE,
  AI_RECOVER,
  AI_STAGGER,
  AI_STRIKE,
  AI_WINDUP,
  ELEMENT_EMBER,
  ELEMENT_GALE,
  ELEMENT_NONE,
  ELEMENT_STONE,
  ELEMENT_TIDE,
  ENEMY_BOSS_FIRST,
  ENEMY_WIGHT,
  EV_BOSS_PHASE,
  EV_ENEMY_DIE,
  EV_HIT,
  EV_SHOOT,
  EV_TELEGRAPH,
  MAX_ENEMIES,
  OWNER_ENEMY,
  PROJ_EMBER,
  SCRIPT_NONE,
} from './content.ts'
import {
  ACT_CHARGE,
  ACT_GUST,
  ACT_MELEE,
  ACT_RING,
  ACT_SLAM,
  ACT_TELEPORT,
  ACT_VOLLEY,
  BOSS_DAMAGE,
  BOSS_KNOCKBACK,
  BOSS_PHASE2_AT,
  BOSS_PHASE_AT,
  BOSS_PHASES,
  BOSS_STAGGER_SCALE,
  BOSS_SUMMONS,
  BURN_DAMAGE,
  BURN_HIT,
  BURN_PERIOD,
  CHAPTER_DAMAGE,
  CHAPTER_HP,
  CHARGE_LIMIT,
  CHILL_HIT,
  ELITE_DAMAGE,
  ELITE_HP,
  ENEMY_AGGRO,
  ENEMY_ARC,
  ENEMY_BURNS,
  ENEMY_COOLDOWN,
  ENEMY_DAMAGE,
  ENEMY_FLOATS,
  ENEMY_HP,
  ENEMY_LUNGE,
  ENEMY_POISE,
  ENEMY_PROJ,
  ENEMY_RADIUS,
  ENEMY_RANGE,
  ENEMY_RECOVER,
  ENEMY_RESIST,
  ENEMY_SHIELDED,
  ENEMY_SPEED,
  ENEMY_STRIKE,
  ENEMY_TOUGHNESS,
  ENEMY_WINDUP,
  FLASH_TICKS,
  GALE_KNOCKBACK,
  HOUND_EMBER_LIFE,
  IDLE_COOLDOWN,
  JUGGLE_MULT,
  KEEP_AWAY,
  KNOCKBACK,
  KNOCKBACK_DECAY,
  MELEE_APPROACH,
  PATTERN_ACT,
  PATTERN_BURSTS,
  PATTERN_COUNT,
  PATTERN_DAMAGE,
  PATTERN_INTERVAL,
  PATTERN_PROJ,
  PATTERN_RANGE,
  PATTERN_RECOVER,
  PATTERN_SPEED,
  PATTERN_SPREAD,
  PATTERN_STRIKE,
  PATTERN_WINDUP,
  PLAYER_RADIUS,
  PROJ_SPEED,
  RESIST_SCALE,
  SEPARATION,
  SET_CYCLE,
  SET_RADIUS,
  SET_SCRIPT,
  SET_SIZE,
  SET_SPEED,
  SET_START,
  SET_TEMPO,
  SHIELD_ARC,
  SHIELD_BLOCK,
  STAGGER_PER_POISE,
  STONE_POISE_BONUS,
  SUMMON_OFFSET,
  TRACK_FRACTION,
} from './combat-tuning.ts'
import { emit } from './events.hot.ts'
import { onEnemyKilled } from './loot.hot.ts'
import { resolvePlayerHit } from './player.hot.ts'
import { spawnProjectile } from './projectiles.hot.ts'
import { blockedCircle, inArc, turnOf } from './body.hot.ts'
import type { State } from './state.ts'
import { startScript } from './story.hot.ts'
import { blocksWalk } from './world.hot.ts'
import { rngInt } from '../../game/sim/prng.hot.ts'
import { TRIG_SIZE, cosTurn, sinTurn } from '../../game/sim/trig.ts'

const STEP_PX = 4
const MIN_DIST = 0.001

function isBoss(kind: number): boolean {
  return kind >= ENEMY_BOSS_FIRST
}

function bossSet(s: State, kind: number): number {
  return (kind - ENEMY_BOSS_FIRST) * BOSS_PHASES + s.bossPhase
}

export function enemyRadius(s: State, i: number): number {
  const kind = s.eKind[i]!
  const r = ENEMY_RADIUS[kind]!
  return isBoss(kind) ? r * SET_RADIUS[bossSet(s, kind)]! : r
}

function damageScale(s: State, i: number): number {
  const kind = s.eKind[i]!
  const tier = isBoss(kind) ? BOSS_DAMAGE[kind - ENEMY_BOSS_FIRST]! : CHAPTER_DAMAGE[s.chapter]!
  return s.eElite[i] === 1 ? ELITE_DAMAGE * tier : tier
}

function tempo(s: State, kind: number): number {
  return isBoss(kind) ? SET_TEMPO[bossSet(s, kind)]! : 1
}

function speedOf(s: State, kind: number): number {
  return isBoss(kind) ? ENEMY_SPEED[kind]! * SET_SPEED[bossSet(s, kind)]! : ENEMY_SPEED[kind]!
}

function setAi(s: State, i: number, state: number): void {
  s.eState[i] = state
  s.eTimer[i] = 0
}

function choosePattern(s: State, i: number): void {
  const set = bossSet(s, s.eKind[i]!)
  const start = SET_START[set]!
  const size = SET_SIZE[set]!
  const current = s.eAttack[i]!
  if (SET_CYCLE[set] === 1) {
    s.eAttack[i] = current >= start && current < start + size ? start + ((current - start + 1) % size) : start
    return
  }
  s.eAttack[i] = start + rngInt(s, size)
}

export function spawnEnemy(s: State, kind: number, x: number, y: number, elite: number, obj: number): number {
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (s.eAlive[i] === 1) continue
    const hp = ENEMY_HP[kind]! * (elite === 1 ? ELITE_HP : 1) * (isBoss(kind) ? 1 : CHAPTER_HP[s.chapter]!)
    s.eAlive[i] = 1
    s.eKind[i] = kind
    s.eElite[i] = elite === 1 ? 1 : 0
    s.eState[i] = AI_IDLE
    s.eTimer[i] = 0
    s.eX[i] = x
    s.eY[i] = y
    s.ePrevX[i] = x
    s.ePrevY[i] = y
    s.eVx[i] = 0
    s.eVy[i] = 0
    s.eFace[i] = turnOf(s.playerX - x, s.playerY - y)
    s.eHp[i] = hp
    s.eMaxHp[i] = hp
    s.eFlashUntil[i] = 0
    s.eBurn[i] = 0
    s.eChill[i] = 0
    s.eObj[i] = obj
    s.eAttack[i] = 0
    s.eCooldown[i] = s.tick + IDLE_COOLDOWN
    if (isBoss(kind)) {
      s.bossPhase = 0
      s.eAttack[i] = 255
      choosePattern(s, i)
    }
    return i
  }
  return -1
}

function freeEnemy(s: State, i: number): void {
  s.eAlive[i] = 0
  s.eObj[i] = -1
  if (s.lockTarget === i) s.lockTarget = -1
}

export function clearActors(s: State): void {
  for (let i = 0; i < MAX_ENEMIES; i++) freeEnemy(s, i)
  s.prAlive.fill(0)
  s.lockTarget = -1
}

export function setStagger(s: State, i: number, ticks: number): void {
  if (s.eAlive[i] !== 1) return
  const scaled = isBoss(s.eKind[i]!) ? Math.round(ticks * BOSS_STAGGER_SCALE) : ticks
  setAi(s, i, AI_STAGGER)
  s.eCooldown[i] = s.tick + scaled
}

export function launchEnemy(s: State, i: number, ticks: number): void {
  if (s.eAlive[i] !== 1) return
  if (isBoss(s.eKind[i]!)) {
    setStagger(s, i, STAGGER_PER_POISE)
    return
  }
  setAi(s, i, AI_AIR)
  s.eCooldown[i] = s.tick + ticks
}

export function afflict(s: State, i: number, element: number, ticks: number): void {
  if (s.eAlive[i] !== 1 || ENEMY_RESIST[s.eKind[i]!] === element) return
  if (element === ELEMENT_STONE) setStagger(s, i, ticks)
  else if (element === ELEMENT_TIDE) s.eChill[i] = Math.max(s.eChill[i]!, s.tick + ticks)
  else if (element === ELEMENT_EMBER) s.eBurn[i] = Math.max(s.eBurn[i]!, s.tick + ticks)
  else if (element === ELEMENT_GALE) launchEnemy(s, i, ticks)
}

function enterPhase(s: State, i: number, phase: number, threshold: number): void {
  const kind = s.eKind[i]!
  const boss = kind - ENEMY_BOSS_FIRST
  s.eHp[i] = Math.max(s.eHp[i]!, threshold)
  s.bossPhase = phase
  emit(s, EV_BOSS_PHASE, phase, kind, s.eX[i]!, s.eY[i]!)
  const summons = BOSS_SUMMONS[boss]!
  for (let k = 0; k < summons; k++) {
    const side = k % 2 === 0 ? 1 : -1
    spawnEnemy(s, ENEMY_WIGHT, s.eX[i]! + side * SUMMON_OFFSET, s.eY[i]! + SUMMON_OFFSET * 0.5, s.eElite[i]!, -1)
  }
  setAi(s, i, AI_CHASE)
  s.eAttack[i] = 255
  choosePattern(s, i)
  s.eCooldown[i] = s.tick + IDLE_COOLDOWN
  const script = SET_SCRIPT[bossSet(s, kind)]!
  if (script !== SCRIPT_NONE) startScript(s, script)
}

function checkPhase(s: State, i: number): void {
  const boss = s.eKind[i]! - ENEMY_BOSS_FIRST
  const max = s.eMaxHp[i]!
  const first = BOSS_PHASE_AT[boss]! * max
  const second = BOSS_PHASE2_AT[boss]! * max
  if (s.bossPhase === 0 && first > 0 && s.eHp[i]! <= first) enterPhase(s, i, 1, first)
  else if (s.bossPhase === 1 && second > 0 && s.eHp[i]! <= second) enterPhase(s, i, 2, second)
}

export function strikeEnemy(s: State, i: number, amount: number, element: number, fromX: number, fromY: number, stagger: number): number {
  if (s.eAlive[i] !== 1) return 0
  const kind = s.eKind[i]!
  const state = s.eState[i]!
  const dx = s.eX[i]! - fromX
  const dy = s.eY[i]! - fromY
  const d = Math.sqrt(dx * dx + dy * dy)
  const vulnerable = state === AI_STAGGER || state === AI_AIR
  const resisted = element !== ELEMENT_NONE && ENEMY_RESIST[kind] === element
  let damage = amount * ENEMY_TOUGHNESS[kind]!
  let poise = stagger
  let knock = KNOCKBACK
  const shielded = ENEMY_SHIELDED[kind] === 1 && !vulnerable && d > MIN_DIST && inArc(s.eFace[i]!, -dx, -dy, SHIELD_ARC) === 1
  if (resisted) damage *= RESIST_SCALE
  if (state === AI_AIR) damage *= JUGGLE_MULT
  if (!resisted) {
    if (element === ELEMENT_STONE) poise += STONE_POISE_BONUS
    else if (element === ELEMENT_TIDE) s.eChill[i] = Math.max(s.eChill[i]!, s.tick + CHILL_HIT)
    else if (element === ELEMENT_EMBER) s.eBurn[i] = Math.max(s.eBurn[i]!, s.tick + BURN_HIT)
    else if (element === ELEMENT_GALE) knock *= GALE_KNOCKBACK
  }
  const threshold = ENEMY_POISE[kind]!
  if (shielded) {
    damage *= SHIELD_BLOCK
    if (poise > threshold) setStagger(s, i, poise * STAGGER_PER_POISE)
  } else if (poise > 0 && poise >= threshold) {
    setStagger(s, i, poise * STAGGER_PER_POISE)
  }
  if (d > MIN_DIST) {
    const k = isBoss(kind) ? knock * BOSS_KNOCKBACK : knock
    s.eVx[i] = s.eVx[i]! + (dx / d) * k
    s.eVy[i] = s.eVy[i]! + (dy / d) * k
  }
  s.eHp[i] = s.eHp[i]! - damage
  s.eFlashUntil[i] = s.tick + FLASH_TICKS
  emit(s, EV_HIT, i, Math.round(damage), s.eX[i]!, s.eY[i]!)
  if (isBoss(kind)) checkPhase(s, i)
  if (s.eHp[i]! <= 0) {
    emit(s, EV_ENEMY_DIE, kind, s.eElite[i]!, s.eX[i]!, s.eY[i]!)
    onEnemyKilled(s, i)
    freeEnemy(s, i)
  }
  return damage
}

export function damageEnemy(s: State, index: number, amount: number, element: number, fromX: number, fromY: number): void {
  strikeEnemy(s, index, amount, element, fromX, fromY, 0)
}

function moveEnemy(s: State, i: number, dx: number, dy: number): void {
  const r = enemyRadius(s, i)
  const floats = ENEMY_FLOATS[s.eKind[i]!]!
  const nx = s.eX[i]! + dx
  if (blockedCircle(s, nx, s.eY[i]!, r, floats) === 0) s.eX[i] = nx
  const ny = s.eY[i]! + dy
  if (blockedCircle(s, s.eX[i]!, ny, r, floats) === 0) s.eY[i] = ny
}

function moveToward(s: State, i: number, tx: number, ty: number, speed: number): void {
  const dx = tx - s.eX[i]!
  const dy = ty - s.eY[i]!
  const d = Math.sqrt(dx * dx + dy * dy)
  if (d < MIN_DIST) return
  const step = speed < d ? speed : d
  moveEnemy(s, i, (dx / d) * step, (dy / d) * step)
}

function gap(s: State, i: number): number {
  const dx = s.playerX - s.eX[i]!
  const dy = s.playerY - s.eY[i]!
  return Math.sqrt(dx * dx + dy * dy) - enemyRadius(s, i) - PLAYER_RADIUS
}

function meleeHit(s: State, i: number, damage: number, range: number, arc: number): void {
  if (damage <= 0 || gap(s, i) > range) return
  if (inArc(s.eFace[i]!, s.playerX - s.eX[i]!, s.playerY - s.eY[i]!, arc) === 0) return
  resolvePlayerHit(s, damage * damageScale(s, i), s.eX[i]!, s.eY[i]!, i, -1)
}

function fire(s: State, i: number, kind: number, turn: number, speed: number, damage: number): number {
  const r = enemyRadius(s, i)
  const c = cosTurn(turn)
  const n = sinTurn(turn)
  return spawnProjectile(s, kind, OWNER_ENEMY, s.eX[i]! + c * r, s.eY[i]! + n * r, c * speed, n * speed, damage * damageScale(s, i))
}

function fan(s: State, i: number, kind: number, count: number, spread: number, centre: number, speed: number, damage: number): void {
  for (let c = 0; c < count; c++) {
    const offset = count > 1 ? (c / (count - 1) - 0.5) * spread : 0
    fire(s, i, kind, centre + offset, speed, damage)
  }
  emit(s, EV_SHOOT, kind, i, s.eX[i]!, s.eY[i]!)
}

function ring(s: State, i: number, kind: number, count: number, offset: number, speed: number, damage: number): void {
  for (let c = 0; c < count; c++) fire(s, i, kind, offset + (c * TRIG_SIZE) / count, speed, damage)
  emit(s, EV_SHOOT, kind, i, s.eX[i]!, s.eY[i]!)
}

function aimAtPlayer(s: State, i: number): number {
  return turnOf(s.playerX - s.eX[i]!, s.playerY - s.eY[i]!)
}

function regularStrike(s: State, i: number): void {
  const kind = s.eKind[i]!
  const proj = ENEMY_PROJ[kind]!
  if (proj >= 0) {
    fan(s, i, proj, 1, 0, aimAtPlayer(s, i), PROJ_SPEED[proj]!, ENEMY_DAMAGE[kind]!)
    return
  }
  if (ENEMY_LUNGE[kind] === 1) {
    let left = Math.min(ENEMY_RANGE[kind]!, Math.max(0, gap(s, i) - 1))
    while (left > 0) {
      const step = left < STEP_PX ? left : STEP_PX
      moveToward(s, i, s.playerX, s.playerY, step)
      left -= step
    }
  }
  meleeHit(s, i, ENEMY_DAMAGE[kind]!, ENEMY_RANGE[kind]! * (ENEMY_LUNGE[kind] === 1 ? 0.25 : 1), ENEMY_ARC[kind]!)
  if (ENEMY_BURNS[kind] === 1) {
    const p = spawnProjectile(s, PROJ_EMBER, OWNER_ENEMY, s.eX[i]!, s.eY[i]!, 0, 0, ENEMY_DAMAGE[kind]! * 0.5 * damageScale(s, i))
    if (p >= 0) s.prLife[p] = HOUND_EMBER_LIFE
  }
}

function bossBlow(s: State, i: number, burst: number): void {
  const p = s.eAttack[i]!
  const act = PATTERN_ACT[p]!
  const damage = PATTERN_DAMAGE[p]!
  const range = PATTERN_RANGE[p]!
  const proj = PATTERN_PROJ[p]!
  const count = PATTERN_COUNT[p]!
  const spread = PATTERN_SPREAD[p]!
  const speed = PATTERN_SPEED[p]!
  if (act === ACT_MELEE) {
    s.eFace[i] = aimAtPlayer(s, i)
    meleeHit(s, i, damage, range, spread)
  } else if (act === ACT_SLAM) {
    meleeHit(s, i, damage, range, TRIG_SIZE)
    ring(s, i, proj, count, burst * 16, speed, damage)
  } else if (act === ACT_VOLLEY) {
    fan(s, i, proj, count, spread, aimAtPlayer(s, i), speed, damage)
  } else if (act === ACT_RING) {
    ring(s, i, proj, count, (burst * TRIG_SIZE) / (count * 2), speed, damage)
  } else if (act === ACT_TELEPORT) {
    const turn = rngInt(s, TRIG_SIZE)
    const r = enemyRadius(s, i)
    const tx = s.playerX + cosTurn(turn) * range
    const ty = s.playerY + sinTurn(turn) * range
    if (blockedCircle(s, tx, ty, r, 0) === 0 && walkableLine(s, s.eX[i]!, s.eY[i]!, tx, ty)) {
      s.eX[i] = tx
      s.eY[i] = ty
      s.ePrevX[i] = tx
      s.ePrevY[i] = ty
    }
    s.eFace[i] = aimAtPlayer(s, i)
    fan(s, i, proj, count, spread, s.eFace[i]!, PROJ_SPEED[proj]!, damage)
  } else if (act === ACT_GUST) {
    meleeHit(s, i, damage, range, TRIG_SIZE)
  }
}

function walkableLine(s: State, x0: number, y0: number, x1: number, y1: number): boolean {
  const dx = x1 - x0
  const dy = y1 - y0
  const steps = Math.ceil(Math.sqrt(dx * dx + dy * dy) / STEP_PX)
  for (let k = 1; k <= steps; k++) if (blocksWalk(s, x0 + (dx * k) / steps, y0 + (dy * k) / steps) === 1) return false
  return true
}

function pushPlayer(s: State, dx: number, dy: number): void {
  const nx = s.playerX + dx
  if (blockedCircle(s, nx, s.playerY, PLAYER_RADIUS, 0) === 0) s.playerX = nx
  const ny = s.playerY + dy
  if (blockedCircle(s, s.playerX, ny, PLAYER_RADIUS, 0) === 0) s.playerY = ny
}

function bossStrikeTick(s: State, i: number): void {
  const p = s.eAttack[i]!
  const act = PATTERN_ACT[p]!
  const t = s.eTimer[i]!
  const interval = PATTERN_INTERVAL[p]!
  if (t > 0 && interval > 0 && t % interval === 0 && t / interval < PATTERN_BURSTS[p]!) bossBlow(s, i, t / interval)
  if (act === ACT_CHARGE) {
    const speed = PATTERN_SPEED[p]! * SET_SPEED[bossSet(s, s.eKind[i]!)]!
    moveEnemy(s, i, cosTurn(s.eFace[i]!) * speed, sinTurn(s.eFace[i]!) * speed)
    if (gap(s, i) <= PATTERN_RANGE[p]!) {
      meleeHit(s, i, PATTERN_DAMAGE[p]!, PATTERN_RANGE[p]!, TRIG_SIZE)
      setAi(s, i, AI_RECOVER)
    }
  } else if (act === ACT_GUST) {
    const dx = s.playerX - s.eX[i]!
    const dy = s.playerY - s.eY[i]!
    const d = Math.sqrt(dx * dx + dy * dy)
    if (d > MIN_DIST && d - enemyRadius(s, i) <= PATTERN_RANGE[p]!) {
      const speed = PATTERN_SPEED[p]!
      const pull = speed < 0 && d + speed < enemyRadius(s, i) + PLAYER_RADIUS + 2 ? 0 : speed
      pushPlayer(s, (dx / d) * pull, (dy / d) * pull)
    }
  }
}

function approachDistance(s: State, i: number): number {
  const kind = s.eKind[i]!
  if (!isBoss(kind)) return ENEMY_RANGE[kind]!
  const p = s.eAttack[i]!
  const act = PATTERN_ACT[p]!
  if (act === ACT_MELEE || act === ACT_SLAM || act === ACT_GUST) return PATTERN_RANGE[p]! * MELEE_APPROACH
  if (act === ACT_CHARGE) return CHARGE_LIMIT
  return PATTERN_RANGE[p]!
}

function chase(s: State, i: number): void {
  const kind = s.eKind[i]!
  s.eFace[i] = aimAtPlayer(s, i)
  const reach = gap(s, i)
  const want = approachDistance(s, i)
  const speed = speedOf(s, kind)
  const ranged = !isBoss(kind) && ENEMY_PROJ[kind]! >= 0
  if (ranged && reach < want * KEEP_AWAY) {
    moveToward(s, i, 2 * s.eX[i]! - s.playerX, 2 * s.eY[i]! - s.playerY, speed)
  } else if (reach > want) {
    moveToward(s, i, s.playerX, s.playerY, speed)
    return
  }
  if (s.tick >= s.eCooldown[i]!) {
    setAi(s, i, AI_WINDUP)
    emit(s, EV_TELEGRAPH, i, s.eAttack[i]!, s.eX[i]!, s.eY[i]!)
  }
}

export function windupTicks(s: State, i: number): number {
  const kind = s.eKind[i]!
  return Math.round((isBoss(kind) ? PATTERN_WINDUP[s.eAttack[i]!]! : ENEMY_WINDUP[kind]!) * tempo(s, kind))
}

function strikeTicks(s: State, i: number): number {
  const kind = s.eKind[i]!
  return isBoss(kind) ? PATTERN_STRIKE[s.eAttack[i]!]! : ENEMY_STRIKE[kind]!
}

function recoverTicks(s: State, i: number): number {
  const kind = s.eKind[i]!
  return Math.round((isBoss(kind) ? PATTERN_RECOVER[s.eAttack[i]!]! : ENEMY_RECOVER[kind]!) * tempo(s, kind))
}

function resume(s: State, i: number, cooldown: number): void {
  setAi(s, i, AI_CHASE)
  s.eCooldown[i] = s.tick + cooldown
  if (isBoss(s.eKind[i]!)) choosePattern(s, i)
}

function think(s: State, i: number): void {
  const kind = s.eKind[i]!
  const state = s.eState[i]!
  const t = s.eTimer[i]!
  if (state === AI_IDLE) {
    if (gap(s, i) <= ENEMY_AGGRO[kind]!) setAi(s, i, AI_CHASE)
  } else if (state === AI_CHASE) {
    chase(s, i)
  } else if (state === AI_WINDUP) {
    const windup = windupTicks(s, i)
    if (t < windup * TRACK_FRACTION) s.eFace[i] = aimAtPlayer(s, i)
    if (t >= windup) {
      setAi(s, i, AI_STRIKE)
      if (isBoss(kind)) bossBlow(s, i, 0)
      else regularStrike(s, i)
    }
  } else if (state === AI_STRIKE) {
    if (isBoss(kind)) bossStrikeTick(s, i)
    if (s.eState[i] === AI_STRIKE && t >= strikeTicks(s, i)) setAi(s, i, AI_RECOVER)
  } else if (state === AI_RECOVER) {
    if (t >= recoverTicks(s, i)) resume(s, i, ENEMY_COOLDOWN[kind]!)
  } else if (s.tick >= s.eCooldown[i]!) {
    resume(s, i, IDLE_COOLDOWN)
  }
}

function burn(s: State, i: number): void {
  if (s.tick < s.eBurn[i]! && s.tick % BURN_PERIOD === 0) {
    strikeEnemy(s, i, s.statAttack * BURN_DAMAGE, ELEMENT_NONE, s.eX[i]!, s.eY[i]!, 0)
  }
}

function drift(s: State, i: number): void {
  const vx = s.eVx[i]!
  const vy = s.eVy[i]!
  if (vx === 0 && vy === 0) return
  moveEnemy(s, i, vx, vy)
  s.eVx[i] = Math.abs(vx) < 0.01 ? 0 : vx * KNOCKBACK_DECAY
  s.eVy[i] = Math.abs(vy) < 0.01 ? 0 : vy * KNOCKBACK_DECAY
}

function separate(s: State): void {
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (s.eAlive[i] !== 1) continue
    const ri = enemyRadius(s, i)
    for (let j = i + 1; j < MAX_ENEMIES; j++) {
      if (s.eAlive[j] !== 1) continue
      const reach = ri + enemyRadius(s, j)
      const dx = s.eX[i]! - s.eX[j]!
      const dy = s.eY[i]! - s.eY[j]!
      const d2 = dx * dx + dy * dy
      if (d2 >= reach * reach) continue
      const d = Math.sqrt(d2)
      const push = (reach - d) * SEPARATION * 0.5
      const nx = d > MIN_DIST ? dx / d : 1
      const ny = d > MIN_DIST ? dy / d : 0
      if (!isBoss(s.eKind[i]!)) moveEnemy(s, i, nx * push, ny * push)
      if (!isBoss(s.eKind[j]!)) moveEnemy(s, j, -nx * push, -ny * push)
    }
    const dx = s.eX[i]! - s.playerX
    const dy = s.eY[i]! - s.playerY
    const reach = ri + PLAYER_RADIUS
    const d2 = dx * dx + dy * dy
    if (d2 < reach * reach && d2 > MIN_DIST) {
      const d = Math.sqrt(d2)
      moveEnemy(s, i, (dx / d) * (reach - d) * SEPARATION, (dy / d) * (reach - d) * SEPARATION)
    }
  }
}

export function updateEnemies(s: State): void {
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (s.eAlive[i] !== 1) continue
    s.ePrevX[i] = s.eX[i]!
    s.ePrevY[i] = s.eY[i]!
  }
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (s.eAlive[i] !== 1) continue
    burn(s, i)
    if (s.eAlive[i] !== 1) continue
    drift(s, i)
    if (s.tick < s.eChill[i]! && (s.tick & 1) === 1) continue
    s.eTimer[i] = s.eTimer[i]! + 1
    think(s, i)
  }
  separate(s)
}

export function enemyThreat(s: State, i: number): number {
  const kind = s.eKind[i]!
  const state = s.eState[i]!
  const slow = s.tick < s.eChill[i]! ? 2 : 1
  if (isBoss(kind)) {
    const p = s.eAttack[i]!
    const act = PATTERN_ACT[p]!
    if (act !== ACT_MELEE && act !== ACT_SLAM && act !== ACT_CHARGE && act !== ACT_GUST) return -1
    if (act === ACT_GUST && PATTERN_DAMAGE[p] === 0) return -1
    const reach = act === ACT_CHARGE ? CHARGE_LIMIT : PATTERN_RANGE[p]!
    if (state === AI_WINDUP) {
      const left = (windupTicks(s, i) - s.eTimer[i]!) * slow
      if (act === ACT_CHARGE) return left + Math.floor(Math.max(0, gap(s, i)) / (PATTERN_SPEED[p]! * SET_SPEED[bossSet(s, kind)]!))
      return gap(s, i) <= reach + PLAYER_RADIUS * 2 ? left : -1
    }
    if (state === AI_STRIKE) {
      if (act === ACT_CHARGE) return Math.floor(Math.max(0, gap(s, i) - PATTERN_RANGE[p]!) / (PATTERN_SPEED[p]! * SET_SPEED[bossSet(s, kind)]!))
      const interval = PATTERN_INTERVAL[p]!
      if (interval <= 0) return -1
      const next = Math.floor(s.eTimer[i]! / interval) + 1
      if (next >= PATTERN_BURSTS[p]!) return -1
      return gap(s, i) <= reach + PLAYER_RADIUS * 2 ? (next * interval - s.eTimer[i]!) * slow : -1
    }
    return -1
  }
  if (state !== AI_WINDUP || ENEMY_PROJ[kind]! >= 0) return -1
  if (gap(s, i) > ENEMY_RANGE[kind]! + PLAYER_RADIUS * 2) return -1
  return (windupTicks(s, i) - s.eTimer[i]!) * slow
}
