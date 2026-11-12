import {
  ELEMENT_COUNT,
  ELEMENT_STONE,
  ELEMENT_TIDE,
  IN_ATTACK,
  IN_DODGE,
  IN_GUARD,
  IN_LOCK,
  IN_SKILL,
  IN_STANCE_SHIFT,
  MAX_ENEMIES,
  MAX_PROJECTILES,
  OWNER_ENEMY,
  PHASE_PLAYING,
  PL_ATTACK,
  PL_GUARD,
  PL_IDLE,
} from './content.ts'
import {
  BOT_APPROACH,
  BOT_ATTACK_SLACK,
  BOT_DODGE_LEAD,
  BOT_GUARD_LEAD,
  BOT_HOLD_LEAD,
  BOT_NO_THREAT,
  BOT_PROJ_HORIZON,
  BOT_SKILL_RANGE,
  DODGE_COST,
  MAX_COMBO,
  MOVE_REACH,
  PLAYER_RADIUS,
  PROJ_RADIUS,
  PROJ_UNBLOCKABLE,
  SKILL_COST,
  STANCE_PLAIN,
  TIDE_PARRY_BONUS,
} from './combat-tuning.ts'
import { turnOf } from './body.hot.ts'
import { enemyRadius, enemyThreat } from './enemies.hot.ts'
import type { State } from './state.ts'
import { HEADING_TURNS } from '../../game/sim/trig.ts'

const HEADING_COUNT = 16

function unlocked(s: State, element: number): boolean {
  return ((s.stancesUnlocked >> element) & 1) === 1
}

export function select(element: number): number {
  return (element + 1) << IN_STANCE_SHIFT
}

export function headingTo(dx: number, dy: number): number {
  return 1 + (Math.round(turnOf(dx, dy) / HEADING_TURNS) % HEADING_COUNT)
}

export function tap(s: State, bit: number): number {
  return (s.prevInput & bit) === 0 ? bit : 0
}

function nearest(s: State): number {
  let best = -1
  let bestD = Infinity
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (s.eAlive[i] !== 1) continue
    const dx = s.eX[i]! - s.playerX
    const dy = s.eY[i]! - s.playerY
    const d = dx * dx + dy * dy
    if (d < bestD) {
      best = i
      bestD = d
    }
  }
  return best
}

function meleeThreat(s: State): number {
  let soonest = BOT_NO_THREAT
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (s.eAlive[i] !== 1) continue
    const t = enemyThreat(s, i)
    if (t >= 0 && t < soonest) soonest = t
  }
  return soonest
}

function shotThreat(s: State, unblockable: number): number {
  let soonest = BOT_NO_THREAT
  for (let p = 0; p < MAX_PROJECTILES; p++) {
    if (s.prAlive[p] !== 1 || s.prOwner[p] !== OWNER_ENEMY || PROJ_UNBLOCKABLE[s.prKind[p]!] !== unblockable) continue
    const rx = s.playerX - s.prX[p]!
    const ry = s.playerY - s.prY[p]!
    const vx = s.prVx[p]!
    const vy = s.prVy[p]!
    const v2 = vx * vx + vy * vy
    const reach = PROJ_RADIUS[s.prKind[p]!]! + PLAYER_RADIUS + 2
    if (v2 < 0.0001) {
      if (rx * rx + ry * ry <= reach * reach) soonest = 0
      continue
    }
    const tc = (rx * vx + ry * vy) / v2
    if (tc < -1 || tc > BOT_PROJ_HORIZON) continue
    const mx = rx - vx * tc
    const my = ry - vy * tc
    if (mx * mx + my * my > reach * reach) continue
    const t = Math.max(0, Math.floor(tc - reach / Math.sqrt(v2)))
    if (t < soonest) soonest = t
  }
  return soonest
}

function nextStance(s: State): number {
  for (let k = 1; k < ELEMENT_COUNT; k++) {
    const element = (s.stance + k) % ELEMENT_COUNT
    if (unlocked(s, element)) return element
  }
  return -1
}

function guardInput(s: State, threat: number, element: number): number {
  const stance = element >= 0 && unlocked(s, element) ? select(element) : 0
  if (s.playerState !== PL_GUARD) return stance | tap(s, IN_GUARD)
  const window = s.statParryTicks + (element === ELEMENT_TIDE ? TIDE_PARRY_BONUS : 0)
  if (threat >= 2 && s.tick - s.guardStart + threat > window) return stance
  return stance | IN_GUARD
}

export function combatBotInput(s: State): number {
  return combatInputAt(s, nearest(s))
}

export function combatInputAt(s: State, target: number): number {
  if (s.phase !== PHASE_PLAYING || target < 0 || s.eAlive[target] !== 1) return 0
  const dx = s.eX[target]! - s.playerX
  const dy = s.eY[target]! - s.playerY
  const gap = Math.sqrt(dx * dx + dy * dy) - enemyRadius(s, target)
  const toward = headingTo(dx, dy)
  const lock = s.lockTarget !== target ? tap(s, IN_LOCK) : 0
  const stoneGuard = unlocked(s, ELEMENT_STONE)
  const wave = shotThreat(s, 1)
  if (wave <= BOT_DODGE_LEAD) {
    if (s.stamina >= DODGE_COST && !stoneGuard) return lock | toward | tap(s, IN_DODGE)
    if (stoneGuard) return lock | guardInput(s, wave, ELEMENT_STONE)
  }
  const threat = Math.min(meleeThreat(s), shotThreat(s, 0))
  const parryStance = unlocked(s, ELEMENT_TIDE) ? ELEMENT_TIDE : s.stance
  if (threat <= BOT_GUARD_LEAD) return lock | guardInput(s, threat, parryStance)
  if (threat <= BOT_HOLD_LEAD) return lock
  const row = unlocked(s, s.stance) ? s.stance : STANCE_PLAIN
  const reach = MOVE_REACH[row * MAX_COMBO]!
  if (gap > reach * BOT_APPROACH + BOT_ATTACK_SLACK) return lock | toward
  if (s.playerState === PL_IDLE && s.focus >= SKILL_COST && gap <= BOT_SKILL_RANGE && unlocked(s, s.stance)) return lock | tap(s, IN_SKILL)
  let input = lock
  if (s.playerState === PL_ATTACK && s.playerCombo >= 2 && s.playerChain === 0) {
    const finisher = nextStance(s)
    if (finisher >= 0) input |= select(finisher)
  }
  if (gap <= reach) input |= tap(s, IN_ATTACK)
  else input |= toward
  return input
}
