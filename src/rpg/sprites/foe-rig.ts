import type { Rows } from './paint.ts'
import { bake, canvas, dissolve, ell, restore, save, scale, seg, turn, type Canvas, type Mat } from './sculpt.ts'

export interface FoeArt {
  readonly idle: readonly Rows[]
  readonly walk: readonly Rows[]
  readonly windup: Rows
  readonly cast: Rows
  readonly strike: Rows
  readonly stagger: Rows
  readonly death: readonly Rows[]
}

export interface Pose {
  bob: number
  lean: number
  head: number
  hipN: number
  kneeN: number
  hipF: number
  kneeF: number
  shN: number
  elN: number
  shF: number
  elF: number
  wpn: number
  open: number
}

export const REST: Pose = { bob: 0, lean: 0, head: 0, hipN: 0.08, kneeN: 0, hipF: -0.08, kneeF: 0, shN: 0.3, elN: -0.6, shF: -0.15, elF: -0.4, wpn: 1.1, open: 0 }

export function pose(over: Partial<Pose>, from: Pose = REST): Pose {
  return { ...from, ...over }
}

export interface Joints {
  hipX: number
  hipY: number
  neckX: number
  neckY: number
  headX: number
  headY: number
  shNX: number
  shNY: number
  shFX: number
  shFY: number
}

export function dir(angle: number, length: number): [number, number] {
  return [Math.sin(angle) * length, Math.cos(angle) * length]
}

export function leg(c: Canvas, x: number, y: number, hip: number, knee: number, thigh: number, shin: number, wide: number, legMat: Mat, bootMat: Mat): [number, number] {
  const [kx, ky] = dir(hip, thigh)
  const [ax, ay] = dir(hip - knee, shin)
  seg(c, legMat, x, y, x + kx, y + ky, wide, wide * 0.85)
  seg(c, bootMat, x + kx, y + ky, x + kx + ax, y + ky + ay, wide * 0.85, wide * 0.8, { join: true })
  const fx = x + kx + ax
  const fy = y + ky + ay
  seg(c, bootMat, fx - 0.5, fy - 1, fx + 2.6, fy - 0.6, wide * 0.8, wide * 0.7, { join: true })
  return [fx, fy]
}

export function arm(c: Canvas, x: number, y: number, sh: number, el: number, upper: number, fore: number, wide: number, sleeve: Mat, hand: Mat): [number, number] {
  const [ex, ey] = dir(sh, upper)
  const [hx, hy] = dir(sh + el, fore)
  seg(c, sleeve, x, y, x + ex, y + ey, wide, wide * 0.9)
  seg(c, sleeve, x + ex, y + ey, x + ex + hx * 0.75, y + ey + hy * 0.75, wide * 0.9, wide * 0.8, { join: true })
  ell(c, hand, x + ex + hx, y + ey + hy, wide * 0.85, wide * 0.85)
  return [x + ex + hx, y + ey + hy]
}

export interface Frame {
  readonly w: number
  readonly h: number
  readonly fy: number
}

export type Draw = (c: Canvas, p: Pose) => void

export function render(size: Frame, draw: Draw, p: Pose, fall = 0, fade = 0, seed = 1): string[] {
  const c = canvas(size.w, size.h, size.fy)
  if (fall !== 0) {
    const lift = Math.abs(Math.sin(fall))
    turn(c, -fall, c.fx, c.fy, lift * size.h * 0.22, -lift * 4)
  }
  draw(c, p)
  if (fade > 0) dissolve(c, fade, seed)
  return bake(c)
}

export interface Poses {
  readonly idle: readonly Pose[]
  readonly walk: readonly Pose[]
  readonly windup: Pose
  readonly cast?: Pose
  readonly strike: Pose
  readonly stagger: Pose
  readonly fallen?: Pose
}

export const FALL = [0.35, 0.95, 1.5, 1.57]
export const FADE = [0, 0, 0, 0.5]

export function animate(size: Frame, draw: Draw, poses: Poses, fall = FALL, fade = FADE): FoeArt {
  const one = (p: Pose) => render(size, draw, p)
  const windup = one(poses.windup)
  const stagger = poses.stagger
  return {
    idle: poses.idle.map(one),
    walk: poses.walk.map(one),
    windup,
    cast: poses.cast ? one(poses.cast) : windup,
    strike: one(poses.strike),
    stagger: one(stagger),
    death: fall.map((angle, n) => render(size, draw, n > 0 && poses.fallen ? poses.fallen : stagger, angle, fade[n] ?? 0, n + 3)),
  }
}

export function walkCycle(base: Pose, stride: number, swing: number, frames = 4): Pose[] {
  const out: Pose[] = []
  for (let n = 0; n < frames; n++) {
    const a = (n / frames) * Math.PI * 2
    const s = Math.sin(a)
    out.push(pose({
      bob: Math.abs(Math.cos(a)) < 0.5 ? -1 : 0,
      hipN: base.hipN + s * stride,
      kneeN: s < 0 ? -s * stride * 1.3 : 0.1,
      hipF: base.hipF - s * stride,
      kneeF: s > 0 ? s * stride * 1.3 : 0.1,
      shN: base.shN - s * swing,
      shF: base.shF + s * swing,
    }, base))
  }
  return out
}

export function withLean(c: Canvas, x: number, y: number, lean: number, body: () => void): void {
  const keep = save(c)
  turn(c, lean, x, y)
  body()
  restore(c, keep)
}

export const MAN: Frame = { w: 72, h: 64, fy: 60 }

export function joints(p: Pose): Joints {
  const hipX = 36
  const hipY = 44 + p.bob
  return { hipX, hipY, neckX: hipX + 1, neckY: hipY - 12, headX: hipX + 1, headY: hipY - 18.5, shNX: hipX + 3.5, shNY: hipY - 10.5, shFX: hipX - 3, shFY: hipY - 10.5 }
}

export function giant(c: Canvas, k: number): void {
  turn(c, 0, 0, 0, c.fx - 36, c.fy - 60)
  scale(c, k, k, 36, 60)
}
