import {
  EV_HEAL,
  EV_PICKUP,
  GEM_COLLECT_RADIUS,
  GEM_LARGE,
  GEM_MAGNET,
  GEM_MEDIUM,
  GEM_PULL_SPEED,
  GEM_REPAIR,
  GEM_SMALL,
  GEM_XP,
  MAX_GEMS,
  PICKUP_EVENTS_PER_TICK,
  REPAIR_HEAL,
} from './content.ts'
import { emit } from './events.hot.ts'
import { pickupRadius, xpMultiplier } from './stats.hot.ts'
import type { State } from './state.ts'

function kindForValue(value: number): number {
  if (value >= GEM_XP[GEM_LARGE]!) return GEM_LARGE
  if (value >= GEM_XP[GEM_MEDIUM]!) return GEM_MEDIUM
  return GEM_SMALL
}

function lastXpGemBefore(s: State, before: number): number {
  for (let i = before - 1; i >= 0; i--) if (s.gKind[i]! < GEM_REPAIR) return i
  return -1
}

function addGemValue(s: State, i: number, value: number): void {
  const total = s.gValue[i]! + value
  s.gValue[i] = total
  s.gKind[i] = kindForValue(total)
}

function writeGem(s: State, i: number, kind: number, value: number, x: number, y: number): void {
  s.gKind[i] = kind
  s.gValue[i] = value
  s.gx[i] = x
  s.gy[i] = y
  s.gAttract[i] = 0
}

export function dropGem(s: State, kind: number, value: number, x: number, y: number): void {
  if (s.gemCount < MAX_GEMS) {
    writeGem(s, s.gemCount++, kind, value, x, y)
    return
  }
  const j = lastXpGemBefore(s, s.gemCount)
  if (j < 0) return
  if (kind < GEM_REPAIR) {
    addGemValue(s, j, value)
    return
  }
  const k = lastXpGemBefore(s, j)
  if (k < 0) return
  addGemValue(s, k, s.gValue[j]!)
  writeGem(s, j, kind, value, x, y)
}

function removeGem(s: State, i: number): void {
  const last = --s.gemCount
  if (i === last) return
  s.gKind[i] = s.gKind[last]!
  s.gValue[i] = s.gValue[last]!
  s.gx[i] = s.gx[last]!
  s.gy[i] = s.gy[last]!
  s.gAttract[i] = s.gAttract[last]!
}

function collectGem(s: State, i: number): void {
  const kind = s.gKind[i]!
  if (kind === GEM_REPAIR) {
    const before = s.hp
    s.hp = Math.min(s.maxHp, s.hp + REPAIR_HEAL)
    emit(s, EV_PICKUP, s.gx[i]!, s.gy[i]!, kind, 0)
    emit(s, EV_HEAL, s.px, s.py, s.hp - before, 0)
    return
  }
  if (kind === GEM_MAGNET) {
    s.gAttract.fill(1, 0, s.gemCount)
    emit(s, EV_PICKUP, s.gx[i]!, s.gy[i]!, kind, 0)
    return
  }
  s.xp += s.gValue[i]! * xpMultiplier(s)
  if (s.pickupEvents < PICKUP_EVENTS_PER_TICK) {
    s.pickupEvents++
    emit(s, EV_PICKUP, s.gx[i]!, s.gy[i]!, kind, 0)
  }
}

export function updateGems(s: State): void {
  const reach = pickupRadius(s)
  const reach2 = reach * reach
  const px = s.px
  const py = s.py
  const gx = s.gx
  const gy = s.gy
  const attract = s.gAttract
  let i = 0
  while (i < s.gemCount) {
    const dx = px - gx[i]!
    const dy = py - gy[i]!
    const d2 = dx * dx + dy * dy
    if (attract[i] === 0) {
      if (d2 > reach2) {
        i++
        continue
      }
      attract[i] = 1
    }
    const d = Math.sqrt(d2)
    if (d <= GEM_COLLECT_RADIUS) {
      collectGem(s, i)
      removeGem(s, i)
      continue
    }
    gx[i] = gx[i]! + (dx / d) * GEM_PULL_SPEED
    gy[i] = gy[i]! + (dy / d) * GEM_PULL_SPEED
    i++
  }
}
