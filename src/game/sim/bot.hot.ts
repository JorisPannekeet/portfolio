import {
  BOT_BOSS_WEIGHT,
  BOT_CORE_WEAPONS,
  BOT_GEM_RADIUS,
  BOT_GEM_WEIGHT,
  BOT_LOOKAHEAD,
  BOT_SCAN_RADIUS,
  BOT_SOFTEN,
  BOT_STEADY_BONUS,
  CHOICE_EVOLVE,
  CHOICE_PASSIVE,
  CHOICE_REPAIR,
  ENEMY_DAMAGE,
  ENEMY_DREADNOUGHT,
  INPUT_CHOICE,
  INPUT_DIRECTIONS,
  INPUT_IDLE,
  PHASE_LEVEL_UP,
  PHASE_PLAYING,
  WEAPONS,
  WEAPON_COUNT,
} from './content.ts'
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
    const weight = type === ENEMY_DREADNOUGHT ? ENEMY_DAMAGE[type]! * BOT_BOSS_WEIGHT : ENEMY_DAMAGE[type]!
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

function botHeading(s: State): number {
  const found = gatherThreats(s)
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
  let bestScore = dangerAt(s, s.px, s.py, found)
  for (let h = 0; h < INPUT_DIRECTIONS; h++) {
    const turn = h * HEADING_TURNS
    const ux = cosTurn(turn)
    const uy = sinTurn(turn)
    const steady = turn === s.aimTurn ? BOT_STEADY_BONUS : 0
    const score = dangerAt(s, s.px + ux * BOT_LOOKAHEAD, s.py + uy * BOT_LOOKAHEAD, found) - BOT_GEM_WEIGHT * (ux * gemX + uy * gemY) - steady
    if (score < bestScore) {
      best = h + 1
      bestScore = score
    }
  }
  return best
}

export function botInput(s: State): number {
  if (s.phase === PHASE_LEVEL_UP) return INPUT_CHOICE + botChoice(s)
  if (s.phase !== PHASE_PLAYING) return INPUT_IDLE
  return botHeading(s)
}
