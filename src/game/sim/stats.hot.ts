import {
  BOSS_SURGE_SCALE,
  ENEMY_BOSS_FIRST,
  ENEMY_DAMAGE,
  ENEMY_DAMAGE_GROWTH_PER_MINUTE,
  BOSS_HP_PER_MINUTE_CUBED,
  ENEMY_HP,
  ENEMY_DAMAGE_SURGE_PER_MINUTE_SQUARED,
  ENEMY_HP_GROWTH_PER_MINUTE,
  ENEMY_HP_SURGE_PER_MINUTE_SQUARED,
  ENEMY_SPEED_GROWTH_PER_MINUTE,
  ENEMY_SURGE_START_MINUTE,
  EVOLVED,
  MIN_COOLDOWN_TICKS,
  PASSIVE_AMOUNT_PER_LEVEL,
  PASSIVE_AREA_PER_LEVEL,
  PASSIVE_ARMOR_PER_LEVEL,
  PASSIVE_AUTOLOADER,
  PASSIVE_COOLDOWN_PER_LEVEL,
  PASSIVE_DAMAGE_PER_LEVEL,
  PASSIVE_MAGNET,
  PASSIVE_MULTILOCK,
  PASSIVE_NEURAL,
  PASSIVE_PICKUP_PER_LEVEL,
  PASSIVE_PLATING,
  PASSIVE_REACTOR,
  PASSIVE_REGEN_PER_LEVEL,
  PASSIVE_SERVOS,
  PASSIVE_SPEED_PER_LEVEL,
  PASSIVE_TARGETING,
  PASSIVE_THRUSTERS,
  PASSIVE_XP_PER_LEVEL,
  PLAYER_PICKUP_RADIUS,
  PLAYER_SPEED,
  TICK_HZ,
  WEAPONS,
  XP_BASE,
  XP_PER_LEVEL,
  XP_PER_LEVEL_CUBED,
  XP_PER_LEVEL_QUARTIC,
} from './content.ts'
import type { State } from './state.ts'

const TICKS_PER_MINUTE = 60 * TICK_HZ

export function weaponTier(s: State, w: number): number {
  return s.weaponEvolved[w]! > 0 ? EVOLVED : s.weaponLevel[w]! - 1
}

export function weaponDamage(s: State, w: number): number {
  return WEAPONS[w]!.damage[weaponTier(s, w)]! * (1 + s.passiveLevel[PASSIVE_TARGETING]! * PASSIVE_DAMAGE_PER_LEVEL)
}

export function weaponArea(s: State, w: number): number {
  return WEAPONS[w]!.area[weaponTier(s, w)]! * (1 + s.passiveLevel[PASSIVE_SERVOS]! * PASSIVE_AREA_PER_LEVEL)
}

export function weaponCooldown(s: State, w: number): number {
  const base = WEAPONS[w]!.cooldown[weaponTier(s, w)]! * (1 - s.passiveLevel[PASSIVE_AUTOLOADER]! * PASSIVE_COOLDOWN_PER_LEVEL)
  return Math.max(MIN_COOLDOWN_TICKS, Math.round(base))
}

export function weaponAmount(s: State, w: number): number {
  return WEAPONS[w]!.amount[weaponTier(s, w)]! + s.passiveLevel[PASSIVE_MULTILOCK]! * PASSIVE_AMOUNT_PER_LEVEL
}

export function weaponPierce(s: State, w: number): number {
  return WEAPONS[w]!.pierce[weaponTier(s, w)]!
}

export function weaponDuration(s: State, w: number): number {
  return WEAPONS[w]!.duration[weaponTier(s, w)]!
}

export function playerSpeed(s: State): number {
  return PLAYER_SPEED * (1 + s.passiveLevel[PASSIVE_THRUSTERS]! * PASSIVE_SPEED_PER_LEVEL)
}

export function playerArmor(s: State): number {
  return s.passiveLevel[PASSIVE_PLATING]! * PASSIVE_ARMOR_PER_LEVEL
}

export function playerRegenPerTick(s: State): number {
  return (s.passiveLevel[PASSIVE_REACTOR]! * PASSIVE_REGEN_PER_LEVEL) / TICK_HZ
}

export function pickupRadius(s: State): number {
  return PLAYER_PICKUP_RADIUS * (1 + s.passiveLevel[PASSIVE_MAGNET]! * PASSIVE_PICKUP_PER_LEVEL)
}

export function xpMultiplier(s: State): number {
  return 1 + s.passiveLevel[PASSIVE_NEURAL]! * PASSIVE_XP_PER_LEVEL
}

export function xpForLevel(level: number): number {
  const n = level - 1
  return Math.round(XP_BASE + XP_PER_LEVEL * n + XP_PER_LEVEL_CUBED * n * n * n + XP_PER_LEVEL_QUARTIC * n * n * n * n)
}

export function minutesElapsed(s: State): number {
  return s.tick / TICKS_PER_MINUTE
}

function surge(minutes: number, type: number): number {
  const over = minutes - ENEMY_SURGE_START_MINUTE
  if (over <= 0) return 0
  return type >= ENEMY_BOSS_FIRST ? over * over * BOSS_SURGE_SCALE : over * over
}

export function enemyMaxHp(s: State, type: number): number {
  const m = minutesElapsed(s)
  const bossGrowth = type >= ENEMY_BOSS_FIRST ? BOSS_HP_PER_MINUTE_CUBED * m * m * m : 0
  return ENEMY_HP[type]! * (1 + ENEMY_HP_GROWTH_PER_MINUTE * m + ENEMY_HP_SURGE_PER_MINUTE_SQUARED * surge(m, type) + bossGrowth)
}

export function enemyContactDamage(s: State, type: number): number {
  const m = minutesElapsed(s)
  return ENEMY_DAMAGE[type]! * (1 + ENEMY_DAMAGE_GROWTH_PER_MINUTE * m + ENEMY_DAMAGE_SURGE_PER_MINUTE_SQUARED * surge(m, type))
}

export function enemySpeedScale(s: State): number {
  return 1 + ENEMY_SPEED_GROWTH_PER_MINUTE * minutesElapsed(s)
}
