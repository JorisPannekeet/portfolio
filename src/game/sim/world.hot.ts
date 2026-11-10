import {
  BEACONS_PER_ZONE,
  BEACON_MIN_ORIGIN_DIST,
  BEACON_MIN_SPACING,
  LAIR_MIN_BEACON_DIST,
  LAIR_MIN_ORIGIN_DIST,
  POI_BEACON,
  POI_BORDER_MARGIN,
  POI_EDGE_MARGIN,
  POI_LAIR,
  POI_PLACE_ATTEMPTS,
  WORLD_HALF,
  ZONE_COUNT,
} from './content.ts'
import { rngInt } from './prng.hot.ts'
import type { State } from './state.ts'

const POI_SPAN = WORLD_HALF - POI_EDGE_MARGIN - POI_BORDER_MARGIN

export function zoneAt(x: number, y: number): number {
  return (x >= 0 ? 1 : 0) + (y >= 0 ? 2 : 0)
}

export function clampToWorld(v: number): number {
  return v < -WORLD_HALF ? -WORLD_HALF : v > WORLD_HALF ? WORLD_HALF : v
}

function farFromKind(s: State, x: number, y: number, kind: number, gap: number): boolean {
  for (let i = 0; i < s.poiCount; i++) {
    if (s.poiKind[i] !== kind) continue
    const dx = s.poiX[i]! - x
    const dy = s.poiY[i]! - y
    if (dx * dx + dy * dy < gap * gap) return false
  }
  return true
}

function candidateValid(s: State, x: number, y: number, kind: number): boolean {
  const d2 = x * x + y * y
  if (kind === POI_LAIR) {
    return d2 >= LAIR_MIN_ORIGIN_DIST * LAIR_MIN_ORIGIN_DIST && farFromKind(s, x, y, POI_BEACON, LAIR_MIN_BEACON_DIST)
  }
  return d2 >= BEACON_MIN_ORIGIN_DIST * BEACON_MIN_ORIGIN_DIST && farFromKind(s, x, y, POI_BEACON, BEACON_MIN_SPACING)
}

function placePoi(s: State, zone: number, kind: number): void {
  const signX = (zone & 1) !== 0 ? 1 : -1
  const signY = (zone & 2) !== 0 ? 1 : -1
  let x = 0
  let y = 0
  for (let attempt = 0; attempt < POI_PLACE_ATTEMPTS; attempt++) {
    x = signX * (POI_BORDER_MARGIN + rngInt(s, POI_SPAN + 1))
    y = signY * (POI_BORDER_MARGIN + rngInt(s, POI_SPAN + 1))
    if (candidateValid(s, x, y, kind)) break
  }
  const i = s.poiCount++
  s.poiKind[i] = kind
  s.poiZone[i] = zone
  s.poiX[i] = x
  s.poiY[i] = y
  s.poiDone[i] = 0
  s.poiProgress[i] = 0
  s.poiCharge[i] = 0
}

export function placePois(s: State): void {
  s.poiCount = 0
  for (let zone = 0; zone < ZONE_COUNT; zone++) {
    for (let k = 0; k < BEACONS_PER_ZONE; k++) placePoi(s, zone, POI_BEACON)
  }
  for (let zone = 0; zone < ZONE_COUNT; zone++) placePoi(s, zone, POI_LAIR)
}
