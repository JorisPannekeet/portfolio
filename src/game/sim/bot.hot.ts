import {
  BOT_BOSS_WEIGHT,
  BOT_CORE_WEAPONS,
  BOT_EDGE_BAND,
  BOT_EDGE_WEIGHT,
  BOT_GEM_RADIUS,
  BOT_GEM_WEIGHT,
  BOT_GOAL_WEIGHT,
  BOT_LAIR_AVOID_WEIGHT,
  BOT_LAIR_LEVEL,
  BOT_LAIR_MARGIN,
  BOT_LOOKAHEAD,
  BOT_SAFE_HP_FRACTION,
  BOT_SCAN_RADIUS,
  BOT_SOFTEN,
  BOT_STEADY_BONUS,
  BOT_THREAT_LIMIT,
  CHOICE_EVOLVE,
  CHOICE_PASSIVE,
  CHOICE_REPAIR,
  ENEMY_BOSS_FIRST,
  ENEMY_DAMAGE,
  INPUT_CHOICE,
  INPUT_DIRECTIONS,
  INPUT_IDLE,
  LAIR_RADIUS,
  PHASE_LEVEL_UP,
  PHASE_PLAYING,
  POI_LAIR,
  WEAPONS,
  WEAPON_COUNT,
  WORLD_HALF,
} from './content.ts'
import { playerSpeed } from './stats.hot.ts'
import type { State } from './state.ts'
import { HEADING_TURNS, cosTurn, sinTurn } from './trig.ts'

function pairsWithOwnedWeapon(s: State, passive: number): boolean {
  for (let w = 0; w < WEAPON_COUNT; w++) {
    if (s.weaponLevel[w]! > 0 && WEAPONS[w]!.pairedPassive === passive) return true
  }
  return false
}

function ownedWeaponCount(s: State): number {
  let n = 0
  for (let w = 0; w < WEAPON_COUNT; w++) if (s.weaponLevel[w]! > 0) n++
  return n
}

function choiceScore(s: State, choice: number): number {
  if (choice >= CHOICE_REPAIR) return 0
  if (choice >= CHOICE_EVOLVE) return 1000
  if (choice >= CHOICE_PASSIVE) {
    const p = choice - CHOICE_PASSIVE
    const paired = pairsWithOwnedWeapon(s, p) ? 100 : 0
    return s.passiveLevel[p]! > 0 ? 400 + paired : 150 + paired
  }
  const level = s.weaponLevel[choice]!
  if (level > 0) return 600 + level
  return ownedWeaponCount(s) < BOT_CORE_WEAPONS ? 550 : 200
}

function botChoice(s: State): number {
  let best = 0
  let bestScore = -1
  for (let k = 0; k < s.choiceCount; k++) {
    const score = choiceScore(s, s.choices[k]!)
    if (score > bestScore) {
      best = k
      bestScore = score
    }
  }
  return best
}

function gatherThreats(s: State): number {
  const out = s.scratchQuery
  const scan2 = BOT_SCAN_RADIUS * BOT_SCAN_RADIUS
  let found = 0
  for (let i = 0; i < s.enemyCount; i++) {
    const dx = s.ex[i]! - s.px
    const dy = s.ey[i]! - s.py
    if (dx * dx + dy * dy <= scan2) out[found++] = i
  }
  return found
}

function dangerAt(s: State, x: number, y: number, found: number): number {
  const out = s.scratchQuery
  let danger = 0
  for (let k = 0; k < found; k++) {
    const e = out[k]!
    const type = s.eType[e]!
    const dx = s.ex[e]! - x
    const dy = s.ey[e]! - y
    const weight = type >= ENEMY_BOSS_FIRST ? ENEMY_DAMAGE[type]! * BOT_BOSS_WEIGHT : ENEMY_DAMAGE[type]!
    danger += weight / (dx * dx + dy * dy + BOT_SOFTEN)
  }
  return danger
}

function nearestGem(s: State): number {
  let best = -1
  let bestD2 = BOT_GEM_RADIUS * BOT_GEM_RADIUS
  for (let i = 0; i < s.gemCount; i++) {
    const dx = s.gx[i]! - s.px
    const dy = s.gy[i]! - s.py
    const d2 = dx * dx + dy * dy
    if (d2 < bestD2) {
      best = i
      bestD2 = d2
    }
  }
  return best
}

function readyForLair(s: State): boolean {
  return s.level >= BOT_LAIR_LEVEL && s.bossMaxHp === 0
}

function botGoal(s: State, takeBeacons: boolean): number {
  const lairs = readyForLair(s)
  let best = -1
  let bestD2 = Number.POSITIVE_INFINITY
  for (let i = 0; i < s.poiCount; i++) {
    if (s.poiDone[i] !== 0) continue
    if (s.poiKind[i] === POI_LAIR ? !lairs : !takeBeacons) continue
    const dx = s.poiX[i]! - s.px
    const dy = s.poiY[i]! - s.py
    const d2 = dx * dx + dy * dy
    if (d2 < bestD2) {
      best = i
      bestD2 = d2
    }
  }
  return best
}

function edgeAxis(v: number): number {
  const over = (v < 0 ? -v : v) - (WORLD_HALF - BOT_EDGE_BAND)
  if (over <= 0) return 0
  const depth = over / BOT_EDGE_BAND
  return depth * depth
}

function terrainCost(s: State, x: number, y: number, avoidLairs: boolean): number {
  let cost = BOT_EDGE_WEIGHT * (edgeAxis(x) + edgeAxis(y))
  if (!avoidLairs) return cost
  const reach = LAIR_RADIUS + BOT_LAIR_MARGIN
  for (let i = 0; i < s.poiCount; i++) {
    if (s.poiKind[i] !== POI_LAIR || s.poiDone[i] !== 0) continue
    const dx = s.poiX[i]! - x
    const dy = s.poiY[i]! - y
    const d = Math.sqrt(dx * dx + dy * dy)
    if (d < reach) cost += (BOT_LAIR_AVOID_WEIGHT * (reach - d)) / reach
  }
  return cost
}

function goalDistance(s: State, goal: number, x: number, y: number): number {
  const dx = s.poiX[goal]! - x
  const dy = s.poiY[goal]! - y
  return Math.sqrt(dx * dx + dy * dy)
}

function botHeading(s: State, takeBeacons: boolean): number {
  const found = gatherThreats(s)
  const here = dangerAt(s, s.px, s.py, found)
  const safe = here < BOT_THREAT_LIMIT && s.hp >= s.maxHp * BOT_SAFE_HP_FRACTION
  const goal = safe ? botGoal(s, takeBeacons) : -1
  const goalNow = goal >= 0 ? goalDistance(s, goal, s.px, s.py) : 0
  const avoidLairs = !readyForLair(s)
  const speed = playerSpeed(s)
  const gem = nearestGem(s)
  let gemX = 0
  let gemY = 0
  if (gem >= 0) {
    const dx = s.gx[gem]! - s.px
    const dy = s.gy[gem]! - s.py
    const d = Math.sqrt(dx * dx + dy * dy)
    if (d > 0.0001) {
      gemX = dx / d
      gemY = dy / d
    }
  }
  let best = INPUT_IDLE
  let bestScore = here + terrainCost(s, s.px, s.py, avoidLairs)
  for (let h = 0; h < INPUT_DIRECTIONS; h++) {
    const turn = h * HEADING_TURNS
    const ux = cosTurn(turn)
    const uy = sinTurn(turn)
    const steady = turn === s.aimTurn ? BOT_STEADY_BONUS : 0
    const aheadX = s.px + ux * BOT_LOOKAHEAD
    const aheadY = s.py + uy * BOT_LOOKAHEAD
    const toGoal = goal >= 0 ? BOT_GOAL_WEIGHT * (goalDistance(s, goal, s.px + ux * speed, s.py + uy * speed) - goalNow) : 0
    const score =
      dangerAt(s, aheadX, aheadY, found) + terrainCost(s, aheadX, aheadY, avoidLairs) + toGoal - BOT_GEM_WEIGHT * (ux * gemX + uy * gemY) - steady
    if (score < bestScore) {
      best = h + 1
      bestScore = score
    }
  }
  return best
}

export function botInput(s: State, takeBeacons = true): number {
  if (s.phase === PHASE_LEVEL_UP) return INPUT_CHOICE + botChoice(s)
  if (s.phase !== PHASE_PLAYING) return INPUT_IDLE
  return botHeading(s, takeBeacons)
}
