import {
  BULLET_DAMAGE,
  BULLET_DAMAGE_GROWTH_PER_MINUTE,
  BULLET_LIFE,
  BULLET_RADIUS,
  BULLET_SHELL,
  DAMAGE_BOSS_BULLET,
  DAMAGE_SHELL,
  DESPAWN_RADIUS,
  MAX_BULLETS,
  PLAYER_RADIUS,
  PROP_RADIUS,
} from './content.ts'
import { hurtPlayer } from './player.hot.ts'
import { propCellOf } from './props.hot.ts'
import { minutesElapsed } from './stats.hot.ts'
import type { State } from './state.ts'

function oldestBullet(s: State): number {
  let oldest = 0
  const age = s.bAge
  for (let i = 1; i < s.bulletCount; i++) if (age[i]! > age[oldest]!) oldest = i
  return oldest
}

export function spawnBullet(s: State, kind: number, x: number, y: number, vx: number, vy: number): void {
  const i = s.bulletCount < MAX_BULLETS ? s.bulletCount++ : oldestBullet(s)
  s.bKind[i] = kind
  s.bx[i] = x
  s.by[i] = y
  s.bpx[i] = x
  s.bpy[i] = y
  s.bvx[i] = vx
  s.bvy[i] = vy
  s.bAge[i] = 0
}

function removeBullet(s: State, i: number): void {
  const last = --s.bulletCount
  if (i === last) return
  s.bKind[i] = s.bKind[last]!
  s.bx[i] = s.bx[last]!
  s.by[i] = s.by[last]!
  s.bpx[i] = s.bpx[last]!
  s.bpy[i] = s.bpy[last]!
  s.bvx[i] = s.bvx[last]!
  s.bvy[i] = s.bvy[last]!
  s.bAge[i] = s.bAge[last]!
}

export function bulletDamage(s: State, kind: number): number {
  return BULLET_DAMAGE[kind]! * (1 + BULLET_DAMAGE_GROWTH_PER_MINUTE * minutesElapsed(s))
}

function hitsProp(s: State, x: number, y: number, radius: number): boolean {
  const cell = propCellOf(x, y)
  const end = s.propCellStart[cell + 1]!
  for (let n = s.propCellStart[cell]!; n < end; n++) {
    const k = s.propCellItems[n]!
    const dx = x - s.propX[k]!
    const dy = y - s.propY[k]!
    const reach = radius + PROP_RADIUS[s.propKind[k]!]!
    if (dx * dx + dy * dy < reach * reach) return true
  }
  return false
}

export function updateBullets(s: State): void {
  const despawn2 = DESPAWN_RADIUS * DESPAWN_RADIUS
  const px = s.px
  const py = s.py
  let i = 0
  while (i < s.bulletCount) {
    const kind = s.bKind[i]!
    const x = s.bx[i]! + s.bvx[i]!
    const y = s.by[i]! + s.bvy[i]!
    s.bx[i] = x
    s.by[i] = y
    const age = s.bAge[i]! + 1
    s.bAge[i] = age
    const radius = BULLET_RADIUS[kind]!
    const dx = x - px
    const dy = y - py
    const d2 = dx * dx + dy * dy
    if (age >= BULLET_LIFE[kind]! || d2 > despawn2 || hitsProp(s, x, y, radius)) {
      removeBullet(s, i)
      continue
    }
    const reach = radius + PLAYER_RADIUS
    if (d2 < reach * reach && hurtPlayer(s, bulletDamage(s, kind), kind === BULLET_SHELL ? DAMAGE_SHELL : DAMAGE_BOSS_BULLET)) {
      removeBullet(s, i)
      continue
    }
    i++
  }
}
