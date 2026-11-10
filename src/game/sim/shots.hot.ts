import {
  ENEMY_RADIUS,
  EV_BLAST,
  MAX_SHOTS,
  MISSILE_HIT_RADIUS,
  MISSILE_SEEK_RANGE,
  MISSILE_TURN,
  SHOT_MISSILE,
  SHOT_VULCAN,
  WEAPONS,
  WEAPON_MISSILE,
  WEAPON_RIFLE,
  WEAPON_VULCAN,
} from './content.ts'
import { damageEnemy } from './enemies.hot.ts'
import { emit } from './events.hot.ts'
import { gridNearest, gridQuery } from './grid.hot.ts'
import type { State } from './state.ts'

export function weaponOfShot(kind: number): number {
  if (kind === SHOT_VULCAN) return WEAPON_VULCAN
  if (kind === SHOT_MISSILE) return WEAPON_MISSILE
  return WEAPON_RIFLE
}

function oldestShot(s: State): number {
  let oldest = 0
  const seq = s.sSeq
  for (let i = 1; i < s.shotCount; i++) if (seq[i]! < seq[oldest]!) oldest = i
  return oldest
}

export function spawnShot(
  s: State,
  kind: number,
  x: number,
  y: number,
  vx: number,
  vy: number,
  life: number,
  damage: number,
  pierce: number,
  radius: number,
  area: number,
): number {
  const i = s.shotCount < MAX_SHOTS ? s.shotCount++ : oldestShot(s)
  s.sKind[i] = kind
  s.sx[i] = x
  s.sy[i] = y
  s.spx[i] = x
  s.spy[i] = y
  s.svx[i] = vx
  s.svy[i] = vy
  s.sLife[i] = life
  s.sDamage[i] = damage
  s.sPierce[i] = pierce
  s.sRadius[i] = radius
  s.sArea[i] = area
  s.sLastHit[i] = 0
  s.sTarget[i] = -1
  s.sTargetId[i] = 0
  s.sSeq[i] = s.shotSeq++
  return i
}

function removeShot(s: State, i: number): void {
  const last = --s.shotCount
  if (i === last) return
  s.sKind[i] = s.sKind[last]!
  s.sx[i] = s.sx[last]!
  s.sy[i] = s.sy[last]!
  s.spx[i] = s.spx[last]!
  s.spy[i] = s.spy[last]!
  s.svx[i] = s.svx[last]!
  s.svy[i] = s.svy[last]!
  s.sLife[i] = s.sLife[last]!
  s.sDamage[i] = s.sDamage[last]!
  s.sPierce[i] = s.sPierce[last]!
  s.sRadius[i] = s.sRadius[last]!
  s.sArea[i] = s.sArea[last]!
  s.sLastHit[i] = s.sLastHit[last]!
  s.sTarget[i] = s.sTarget[last]!
  s.sTargetId[i] = s.sTargetId[last]!
  s.sSeq[i] = s.sSeq[last]!
}

export function burst(s: State, x: number, y: number, radius: number, damage: number): void {
  emit(s, EV_BLAST, x, y, radius, 0)
  const found = gridQuery(s, x, y, radius)
  const out = s.scratchQuery
  for (let k = 0; k < found; k++) damageEnemy(s, out[k]!, damage, WEAPON_MISSILE)
}

function steerMissile(s: State, i: number): void {
  let target = s.sTarget[i]!
  if (target < 0 || target >= s.enemyCount || s.eId[target] !== s.sTargetId[i] || s.eHp[target]! <= 0) {
    target = gridNearest(s, s.sx[i]!, s.sy[i]!, MISSILE_SEEK_RANGE, 1) > 0 ? s.scratchNearIdx[0]! : -1
    s.sTarget[i] = target
    s.sTargetId[i] = target >= 0 ? s.eId[target]! : 0
  }
  const speed = WEAPONS[WEAPON_MISSILE]!.speed
  let vx = s.svx[i]!
  let vy = s.svy[i]!
  if (target >= 0) {
    const dx = s.ex[target]! - s.sx[i]!
    const dy = s.ey[target]! - s.sy[i]!
    const d = Math.sqrt(dx * dx + dy * dy)
    if (d > 0.0001) {
      vx += ((dx / d) * speed - vx) * MISSILE_TURN
      vy += ((dy / d) * speed - vy) * MISSILE_TURN
    }
  }
  const v = Math.sqrt(vx * vx + vy * vy)
  const grow = v < speed ? Math.min(speed, v + speed * MISSILE_TURN) : speed
  if (v > 0.0001) {
    vx = (vx / v) * grow
    vy = (vy / v) * grow
  }
  s.svx[i] = vx
  s.svy[i] = vy
}

function missileContact(s: State, x: number, y: number): boolean {
  return gridQuery(s, x, y, MISSILE_HIT_RADIUS) > 0
}

function sweepHits(s: State, i: number, x0: number, y0: number, vx: number, vy: number): boolean {
  const v2 = vx * vx + vy * vy
  if (v2 < 0.0001) return false
  const radius = s.sRadius[i]!
  const found = gridQuery(s, x0 + vx * 0.5, y0 + vy * 0.5, radius + Math.sqrt(v2) * 0.5)
  const out = s.scratchQuery
  const weapon = weaponOfShot(s.sKind[i]!)
  for (let k = 0; k < found; k++) {
    const e = out[k]!
    if (s.eHp[e]! <= 0 || s.eId[e] === s.sLastHit[i]) continue
    const ox = s.ex[e]! - x0
    const oy = s.ey[e]! - y0
    const t = (ox * vx + oy * vy) / v2
    if (t < 0 || t >= 1) continue
    const qx = ox - vx * t
    const qy = oy - vy * t
    const reach = radius + ENEMY_RADIUS[s.eType[e]!]!
    if (qx * qx + qy * qy > reach * reach) continue
    damageEnemy(s, e, s.sDamage[i]!, weapon)
    s.sLastHit[i] = s.eId[e]!
    const pierce = s.sPierce[i]! - 1
    s.sPierce[i] = pierce
    if (pierce <= 0) return true
  }
  return false
}

export function updateShots(s: State): void {
  let i = 0
  while (i < s.shotCount) {
    const kind = s.sKind[i]!
    if (kind === SHOT_MISSILE) steerMissile(s, i)
    const x0 = s.sx[i]!
    const y0 = s.sy[i]!
    const vx = s.svx[i]!
    const vy = s.svy[i]!
    const x = x0 + vx
    const y = y0 + vy
    s.sx[i] = x
    s.sy[i] = y
    const life = s.sLife[i]! - 1
    s.sLife[i] = life
    if (kind === SHOT_MISSILE) {
      if (missileContact(s, x, y) || life <= 0) {
        burst(s, x, y, s.sArea[i]!, s.sDamage[i]!)
        removeShot(s, i)
        continue
      }
      i++
      continue
    }
    if (sweepHits(s, i, x0, y0, vx, vy) || life <= 0) {
      removeShot(s, i)
      continue
    }
    i++
  }
}
