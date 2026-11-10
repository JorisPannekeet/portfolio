import type { State } from '../sim/state.ts'
import { BULLET_ORB, BULLET_SHELL, ENEMY_BOSS_FIRST, ENEMY_RADIUS, ENEMY_TANK } from '../sim/content.ts'
import type { View } from './view.ts'
import { ROTATIONS } from './atlas.ts'
import { HOSTILE_SHOT_SHARD, HOSTILE_SHOT_SHELL, SPR_HOSTILE_SHOTS, SPR_ORBS } from './sheet.ts'
import { blitCentered, frameId } from './sprite.hot.ts'
import { HOSTILE, HOSTILE_CORE, INK } from './colors.ts'

const TAU = Math.PI * 2
const BULLET_CULL = 8
const AIM_CULL = 160
const ORB_PULSE_TICKS = 6
const WIND_UP_SPAN_TICKS = 60
const RING_BLINK_TICKS = 3
const RING_GAP = 5
const RING_TRAVEL = 18

export function drawBullets(v: View, s: State, alpha: number, t: number): void {
  const ox = v.originX
  const oy = v.originY
  const right = v.width + BULLET_CULL
  const bottom = v.height + BULLET_CULL
  const orb = frameId(v, SPR_ORBS, ((t / ORB_PULSE_TICKS) | 0) & 1, 0)
  for (let i = 0; i < s.bulletCount; i++) {
    const x = Math.round(s.bpx[i]! + (s.bx[i]! - s.bpx[i]!) * alpha - ox)
    const y = Math.round(s.bpy[i]! + (s.by[i]! - s.bpy[i]!) * alpha - oy)
    if (x < -BULLET_CULL || y < -BULLET_CULL || x > right || y > bottom) continue
    const kind = s.bKind[i]!
    if (kind === BULLET_ORB) {
      blitCentered(v, orb, x, y)
      continue
    }
    const heading = Math.round((Math.atan2(s.bvy[i]!, s.bvx[i]!) * ROTATIONS) / TAU) & (ROTATIONS - 1)
    blitCentered(v, frameId(v, SPR_HOSTILE_SHOTS, kind === BULLET_SHELL ? HOSTILE_SHOT_SHELL : HOSTILE_SHOT_SHARD, heading), x, y)
  }
}

function windUpLeft(aim: number): number {
  return aim < WIND_UP_SPAN_TICKS ? aim / WIND_UP_SPAN_TICKS : 1
}

function strokeLine(v: View, x0: number, y0: number, x1: number, y1: number, color: string, alpha: number): void {
  const ctx = v.ctx
  ctx.beginPath()
  ctx.moveTo(x0 + 0.5, y0 + 0.5)
  ctx.lineTo(x1 + 0.5, y1 + 0.5)
  ctx.lineWidth = 1
  ctx.globalAlpha = alpha
  ctx.strokeStyle = color
  ctx.stroke()
}

function drawAimLine(v: View, x: number, y: number, playerX: number, playerY: number, left: number, t: number): void {
  const strength = Math.ceil((1 - left) * 4) / 4
  strokeLine(v, x, y + 1, playerX, playerY + 1, INK, 0.2 + strength * 0.3)
  const blink = left < 0.25 && ((t / RING_BLINK_TICKS) | 0) % 2 === 0
  strokeLine(v, x, y, playerX, playerY, blink ? HOSTILE_CORE : HOSTILE, 0.3 + strength * 0.7)
}

function drawChargeRing(v: View, x: number, y: number, type: number, left: number, t: number): void {
  const ctx = v.ctx
  const radius = (ENEMY_RADIUS[type] ?? 20) + RING_GAP + Math.round(left * RING_TRAVEL)
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, TAU)
  ctx.globalAlpha = 0.6
  ctx.strokeStyle = INK
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.strokeStyle = ((t / RING_BLINK_TICKS) | 0) % 2 === 0 ? HOSTILE : HOSTILE_CORE
  ctx.lineWidth = 1
  ctx.stroke()
}

export function drawWindUps(v: View, s: State, alpha: number, t: number, playerX: number, playerY: number): void {
  const ox = v.originX
  const oy = v.originY
  const right = v.width + AIM_CULL
  const bottom = v.height + AIM_CULL
  for (let i = 0; i < s.enemyCount; i++) {
    const aim = s.eAim[i]!
    if (aim === 0) continue
    const type = s.eType[i]!
    if (type !== ENEMY_TANK && type < ENEMY_BOSS_FIRST) continue
    const x = Math.round(s.epx[i]! + (s.ex[i]! - s.epx[i]!) * alpha - ox)
    const y = Math.round(s.epy[i]! + (s.ey[i]! - s.epy[i]!) * alpha - oy)
    if (x < -AIM_CULL || y < -AIM_CULL || x > right || y > bottom) continue
    if (type === ENEMY_TANK) drawAimLine(v, x, y, playerX, playerY, windUpLeft(aim), t)
    else drawChargeRing(v, x, y, type, windUpLeft(aim), t)
  }
  v.ctx.globalAlpha = 1
}
