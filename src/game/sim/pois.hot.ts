import {
  BEACON_CHARGE_DRAIN,
  BEACON_CHARGE_FULL,
  BEACON_CHARGE_RISE,
  BEACON_RADIUS,
  BEACON_REWARD_HEAL,
  BOSS_TICKS,
  ENEMY_BOSS_FIRST,
  EV_BEACON,
  EV_BOSS,
  EV_HEAL,
  LAIR_RADIUS,
  POI_LAIR,
  REPAIR_HEAL,
  SPAWN_RADIUS,
} from './content.ts'
import { spawnEnemy } from './enemies.hot.ts'
import { emit } from './events.hot.ts'
import { rollBeaconPassive, takePassive } from './levelup.hot.ts'
import type { State } from './state.ts'

function releaseLair(s: State, lair: number, x: number, y: number): void {
  const zone = s.poiZone[lair]!
  if (spawnEnemy(s, ENEMY_BOSS_FIRST + zone, x, y) < 0) return
  s.poiDone[lair] = 1
  emit(s, EV_BOSS, x, y, zone, 0)
}

function captureBeacon(s: State, beacon: number): void {
  s.poiDone[beacon] = 1
  s.poiCharge[beacon] = BEACON_CHARGE_FULL
  s.poiProgress[beacon] = 1
  const x = s.poiX[beacon]!
  const y = s.poiY[beacon]!
  const p = rollBeaconPassive(s)
  if (p >= 0) {
    takePassive(s, p)
    emit(s, EV_BEACON, x, y, p, s.passiveLevel[p]!)
    return
  }
  const before = s.hp
  s.hp = Math.min(s.maxHp, s.hp + REPAIR_HEAL)
  emit(s, EV_BEACON, x, y, BEACON_REWARD_HEAL, 0)
  emit(s, EV_HEAL, s.px, s.py, s.hp - before, 0)
}

function chargeBeacon(s: State, beacon: number, inside: boolean): void {
  let charge = s.poiCharge[beacon]!
  if (inside) charge += BEACON_CHARGE_RISE
  else if (charge > BEACON_CHARGE_DRAIN) charge -= BEACON_CHARGE_DRAIN
  else charge = 0
  if (charge >= BEACON_CHARGE_FULL) {
    captureBeacon(s, beacon)
    return
  }
  s.poiCharge[beacon] = charge
  s.poiProgress[beacon] = charge / BEACON_CHARGE_FULL
}

export function updatePois(s: State): void {
  const n = s.poiCount
  for (let i = 0; i < n; i++) {
    if (s.poiDone[i] !== 0) continue
    const dx = s.poiX[i]! - s.px
    const dy = s.poiY[i]! - s.py
    const d2 = dx * dx + dy * dy
    if (s.poiKind[i] === POI_LAIR) {
      if (d2 <= LAIR_RADIUS * LAIR_RADIUS) releaseLair(s, i, s.poiX[i]!, s.poiY[i]!)
      continue
    }
    chargeBeacon(s, i, d2 <= BEACON_RADIUS * BEACON_RADIUS)
  }
}

function nearestOpenLair(s: State): number {
  let best = -1
  let bestD2 = Number.POSITIVE_INFINITY
  for (let i = 0; i < s.poiCount; i++) {
    if (s.poiKind[i] !== POI_LAIR || s.poiDone[i] !== 0) continue
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

export function runBossClock(s: State): void {
  if (s.bossCursor >= BOSS_TICKS.length || s.tick < BOSS_TICKS[s.bossCursor]!) return
  s.bossCursor++
  const lair = nearestOpenLair(s)
  if (lair < 0) return
  const dx = s.poiX[lair]! - s.px
  const dy = s.poiY[lair]! - s.py
  const d = Math.sqrt(dx * dx + dy * dy)
  const ux = d > 0.0001 ? dx / d : s.aimX
  const uy = d > 0.0001 ? dy / d : s.aimY
  releaseLair(s, lair, s.px + ux * SPAWN_RADIUS, s.py + uy * SPAWN_RADIUS)
}
