import {
  BEACON_RADIUS,
  BOT_BEACON_AVOID_MARGIN,
  BOT_BEACON_AVOID_WEIGHT,
  BOT_BEACON_HOLD,
  BOT_BEACON_LEVEL,
  BOT_BOSS_WEIGHT,
  BOT_BREAK_HP_FRACTION,
  BOT_BULLET_HORIZON,
  BOT_BULLET_MARGIN,
  BOT_BULLET_SCAN,
  BOT_BULLET_WEIGHT,
  BOT_COVER_GAP,
  BOT_COVER_RANGE,
  BOT_COVER_SEARCH,
  BOT_COVER_WEIGHT,
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
  BOT_PAIR_WEAPON_LEVEL,
  BOT_DETOUR_CLEARANCE,
  BOT_PROP_CLEARANCE,
  BOT_PROP_WEIGHT,
  BOT_SAFE_HP_FRACTION,
  BOT_SCAN_RADIUS,
  BOT_SOFTEN,
  BOT_STEADY_BONUS,
  BOT_THREAT_LIMIT,
  BULLET_RADIUS,
  BULLET_SHELL,
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
  PLAYER_RADIUS,
  POI_LAIR,
  PROP_RADIUS,
  WEAPONS,
  WEAPON_COUNT,
  WORLD_HALF,
} from './content.ts'
import { beaconsCaptured } from './pois.hot.ts'
import { propCellOf } from './props.hot.ts'
import { playerSpeed } from './stats.hot.ts'
import type { State } from './state.ts'
import { HEADING_TURNS, cosTurn, sinTurn } from './trig.ts'

let waypointX = 0
let waypointY = 0
let coverX = 0
let coverY = 0

function pairsWithOwnedWeapon(s: State, passive: number, level: number): boolean {
  for (let w = 0; w < WEAPON_COUNT; w++) {
    if (s.weaponLevel[w]! >= level && WEAPONS[w]!.pairedPassive === passive) return true
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
    if (s.passiveLevel[p] === 0 && pairsWithOwnedWeapon(s, p, BOT_PAIR_WEAPON_LEVEL)) return 700
    const paired = pairsWithOwnedWeapon(s, p, 1) ? 100 : 0
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

function beaconLevelNeeded(s: State): number {
  const captured = beaconsCaptured(s)
  const last = BOT_BEACON_LEVEL.length - 1
  return BOT_BEACON_LEVEL[captured < last ? captured : last]!
}

function beaconWanted(s: State, i: number, calm: boolean): boolean {
  if (s.poiGuard[i] === 0) return calm && s.level >= beaconLevelNeeded(s)
  const dx = s.poiX[i]! - s.px
  const dy = s.poiY[i]! - s.py
  const hold = BEACON_RADIUS + BOT_BEACON_HOLD
  const holding = dx * dx + dy * dy <= hold * hold
  return s.hp >= s.maxHp * (holding ? BOT_BREAK_HP_FRACTION : BOT_SAFE_HP_FRACTION)
}

function botGoal(s: State, takeBeacons: boolean, calm: boolean): number {
  const lairs = calm && readyForLair(s)
  let best = -1
  let bestD2 = Number.POSITIVE_INFINITY
  for (let i = 0; i < s.poiCount; i++) {
    if (s.poiDone[i] !== 0) continue
    if (s.poiKind[i] === POI_LAIR ? !lairs : !takeBeacons || !beaconWanted(s, i, calm)) continue
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

function aimAround(s: State, goalX: number, goalY: number): void {
  waypointX = goalX
  waypointY = goalY
  const dx = goalX - s.px
  const dy = goalY - s.py
  const length = Math.sqrt(dx * dx + dy * dy)
  if (length < 1) return
  const ux = dx / length
  const uy = dy / length
  let nearest = length
  let blocker = -1
  let offset = 0
  for (let k = 0; k < s.propCount; k++) {
    const ox = s.propX[k]! - s.px
    const oy = s.propY[k]! - s.py
    const along = ox * ux + oy * uy
    if (along <= 0 || along >= nearest) continue
    const lateral = oy * ux - ox * uy
    const reach = PROP_RADIUS[s.propKind[k]!]! + PLAYER_RADIUS + BOT_PROP_CLEARANCE
    if (lateral >= reach || lateral <= -reach) continue
    nearest = along
    blocker = k
    offset = lateral
  }
  if (blocker < 0) return
  const side = offset > 0 ? -1 : 1
  const reach = PROP_RADIUS[s.propKind[blocker]!]! + PLAYER_RADIUS + BOT_DETOUR_CLEARANCE
  waypointX = s.propX[blocker]! - uy * side * reach
  waypointY = s.propY[blocker]! + ux * side * reach
}

function propCost(s: State, x: number, y: number): number {
  const cell = propCellOf(x, y)
  const end = s.propCellStart[cell + 1]!
  let cost = 0
  for (let n = s.propCellStart[cell]!; n < end; n++) {
    const k = s.propCellItems[n]!
    const dx = s.propX[k]! - x
    const dy = s.propY[k]! - y
    const reach = PROP_RADIUS[s.propKind[k]!]! + PLAYER_RADIUS + BOT_PROP_CLEARANCE
    const d2 = dx * dx + dy * dy
    if (d2 >= reach * reach) continue
    const depth = (reach - Math.sqrt(d2)) / reach
    cost += BOT_PROP_WEIGHT * depth * depth
  }
  return cost
}

function edgeAxis(v: number): number {
  const over = (v < 0 ? -v : v) - (WORLD_HALF - BOT_EDGE_BAND)
  if (over <= 0) return 0
  const depth = over / BOT_EDGE_BAND
  return depth * depth
}

function avoidPoi(s: State, i: number, x: number, y: number, reach: number, weight: number): number {
  const dx = s.poiX[i]! - x
  const dy = s.poiY[i]! - y
  const d = Math.sqrt(dx * dx + dy * dy)
  return d < reach ? (weight * (reach - d)) / reach : 0
}

function terrainCost(s: State, x: number, y: number, avoidLairs: boolean, goal: number): number {
  let cost = BOT_EDGE_WEIGHT * (edgeAxis(x) + edgeAxis(y)) + propCost(s, x, y)
  for (let i = 0; i < s.poiCount; i++) {
    if (s.poiDone[i] !== 0 || i === goal) continue
    if (s.poiKind[i] === POI_LAIR) {
      if (avoidLairs) cost += avoidPoi(s, i, x, y, LAIR_RADIUS + BOT_LAIR_MARGIN, BOT_LAIR_AVOID_WEIGHT)
    } else if (s.poiGuard[i] === 0) {
      cost += avoidPoi(s, i, x, y, BEACON_RADIUS + BOT_BEACON_AVOID_MARGIN, BOT_BEACON_AVOID_WEIGHT)
    }
  }
  return cost
}

function gatherBullets(s: State): number {
  const out = s.scratchBullets
  const scan2 = BOT_BULLET_SCAN * BOT_BULLET_SCAN
  let found = 0
  for (let j = 0; j < s.bulletCount; j++) {
    const dx = s.bx[j]! - s.px
    const dy = s.by[j]! - s.py
    if (dx * dx + dy * dy > scan2) continue
    if (dx * s.bvx[j]! + dy * s.bvy[j]! >= 0) continue
    out[found++] = j
  }
  return found
}

function bulletDanger(s: State, vx: number, vy: number, found: number): number {
  const out = s.scratchBullets
  let danger = 0
  for (let k = 0; k < found; k++) {
    const j = out[k]!
    const rx = s.bx[j]! - s.px
    const ry = s.by[j]! - s.py
    const wx = s.bvx[j]! - vx
    const wy = s.bvy[j]! - vy
    const w2 = wx * wx + wy * wy
    let t = w2 > 1e-6 ? -(rx * wx + ry * wy) / w2 : 0
    if (t < 0) t = 0
    else if (t > BOT_BULLET_HORIZON) t = BOT_BULLET_HORIZON
    const cx = rx + wx * t
    const cy = ry + wy * t
    const reach = BULLET_RADIUS[s.bKind[j]!]! + PLAYER_RADIUS + BOT_BULLET_MARGIN
    const d2 = cx * cx + cy * cy
    if (d2 >= reach * reach) continue
    const closeness = 1 - Math.sqrt(d2) / reach
    danger += BOT_BULLET_WEIGHT * closeness * (2 - t / BOT_BULLET_HORIZON)
  }
  return danger
}

function nearestBoss(s: State): number {
  let best = -1
  let bestD2 = BOT_COVER_RANGE * BOT_COVER_RANGE
  for (let i = 0; i < s.enemyCount; i++) {
    if (s.eType[i]! < ENEMY_BOSS_FIRST) continue
    const dx = s.ex[i]! - s.px
    const dy = s.ey[i]! - s.py
    const d2 = dx * dx + dy * dy
    if (d2 < bestD2) {
      best = i
      bestD2 = d2
    }
  }
  return best
}

function findCover(s: State, boss: number): boolean {
  const bx = s.ex[boss]!
  const by = s.ey[boss]!
  let bestD2 = BOT_COVER_SEARCH * BOT_COVER_SEARCH
  let found = false
  for (let k = 0; k < s.propCount; k++) {
    const ox = s.propX[k]! - bx
    const oy = s.propY[k]! - by
    const d = Math.sqrt(ox * ox + oy * oy)
    if (d < 1) continue
    const reach = PROP_RADIUS[s.propKind[k]!]! + PLAYER_RADIUS + BOT_COVER_GAP
    const x = s.propX[k]! + (ox / d) * reach
    const y = s.propY[k]! + (oy / d) * reach
    const dx = x - s.px
    const dy = y - s.py
    const d2 = dx * dx + dy * dy
    if (d2 >= bestD2) continue
    bestD2 = d2
    coverX = x
    coverY = y
    found = true
  }
  return found
}

function bossBulletsNear(s: State, found: number): boolean {
  const out = s.scratchBullets
  for (let k = 0; k < found; k++) if (s.bKind[out[k]!] !== BULLET_SHELL) return true
  return false
}

function coverDistance(x: number, y: number): number {
  const dx = coverX - x
  const dy = coverY - y
  return Math.sqrt(dx * dx + dy * dy)
}

function waypointDistance(x: number, y: number): number {
  const dx = waypointX - x
  const dy = waypointY - y
  return Math.sqrt(dx * dx + dy * dy)
}

function botHeading(s: State, takeBeacons: boolean): number {
  const found = gatherThreats(s)
  const here = dangerAt(s, s.px, s.py, found)
  const calm = here < BOT_THREAT_LIMIT && s.hp >= s.maxHp * BOT_SAFE_HP_FRACTION
  const goal = botGoal(s, takeBeacons, calm)
  if (goal >= 0) aimAround(s, s.poiX[goal]!, s.poiY[goal]!)
  const goalNow = goal >= 0 ? waypointDistance(s.px, s.py) : 0
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
  const bullets = gatherBullets(s)
  const boss = bossBulletsNear(s, bullets) ? nearestBoss(s) : -1
  const covered = boss >= 0 && findCover(s, boss)
  const coverNow = covered ? coverDistance(s.px, s.py) : 0
  let best = INPUT_IDLE
  let bestScore = here + terrainCost(s, s.px, s.py, avoidLairs, goal) + bulletDanger(s, 0, 0, bullets)
  for (let h = 0; h < INPUT_DIRECTIONS; h++) {
    const turn = h * HEADING_TURNS
    const ux = cosTurn(turn)
    const uy = sinTurn(turn)
    const steady = turn === s.aimTurn ? BOT_STEADY_BONUS : 0
    const aheadX = s.px + ux * BOT_LOOKAHEAD
    const aheadY = s.py + uy * BOT_LOOKAHEAD
    const nextX = s.px + ux * speed
    const nextY = s.py + uy * speed
    const toGoal = goal >= 0 ? BOT_GOAL_WEIGHT * (waypointDistance(nextX, nextY) - goalNow) : 0
    const toCover = covered ? BOT_COVER_WEIGHT * (coverDistance(nextX, nextY) - coverNow) : 0
    const score =
      dangerAt(s, aheadX, aheadY, found) +
      terrainCost(s, aheadX, aheadY, avoidLairs, goal) +
      bulletDanger(s, ux * speed, uy * speed, bullets) +
      toGoal +
      toCover -
      BOT_GEM_WEIGHT * (ux * gemX + uy * gemY) -
      steady
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
