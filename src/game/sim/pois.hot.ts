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
  ENEMY_HP,
  EV_HEAL,
  GUARD_ELITE_EVERY,
  GUARD_ELITE_MIN_SQUAD,
  GUARD_ELITE_WAVE_LOOKAHEAD,
  GUARD_RING_MIN,
  GUARD_RING_SPREAD,
  GUARD_SQUAD_SIZE,
  LAIR_RADIUS,
  POI_BEACON,
  POI_LAIR,
  REPAIR_HEAL,
  SPAWN_RADIUS,
  WAVES,
} from './content.ts'
import { deployHostile, spawnEnemy, waveSegment } from './enemies.hot.ts'
import { emit } from './events.hot.ts'
import { rollBeaconPassive, takePassive } from './levelup.hot.ts'
import { rngInt } from './prng.hot.ts'
import type { State } from './state.ts'
import { TRIG_SIZE, cosTurn, sinTurn } from './trig.ts'

export function beaconsCaptured(s: State): number {
  let n = 0
  for (let i = 0; i < s.poiCount; i++) if (s.poiKind[i] === POI_BEACON && s.poiDone[i] !== 0) n++
  return n
}

export function guardSquadSize(captured: number): number {
  const last = GUARD_SQUAD_SIZE.length - 1
  return GUARD_SQUAD_SIZE[captured < last ? captured : last]!
}

function toughestOf(pool: readonly number[]): number {
  let best = pool[0]!
  for (let k = 1; k < pool.length; k++) if (ENEMY_HP[pool[k]!]! > ENEMY_HP[best]!) best = pool[k]!
  return best
}

function deployGuards(s: State, beacon: number): void {
  s.poiGuard[beacon] = 1
  const size = guardSquadSize(beaconsCaptured(s))
  const segment = waveSegment(s)
  const ahead = segment + GUARD_ELITE_WAVE_LOOKAHEAD
  const pool = WAVES[segment]!.pool
  const elite = toughestOf(WAVES[ahead < WAVES.length ? ahead : WAVES.length - 1]!.pool)
  const elites = size >= GUARD_ELITE_MIN_SQUAD ? Math.floor(size / GUARD_ELITE_EVERY) : 0
  const bx = s.poiX[beacon]!
  const by = s.poiY[beacon]!
  const phase = rngInt(s, TRIG_SIZE)
  for (let k = 0; k < size; k++) {
    const type = k < elites ? elite : pool[rngInt(s, pool.length)]!
    const turn = phase + Math.floor((k * TRIG_SIZE) / size)
    const reach = GUARD_RING_MIN + rngInt(s, GUARD_RING_SPREAD + 1)
    deployHostile(s, type, bx + cosTurn(turn) * reach, by + sinTurn(turn) * reach)
  }
}

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
  if (inside && s.poiGuard[beacon] === 0) deployGuards(s, beacon)
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
