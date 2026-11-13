import type { State } from '../sim/state.ts'
import { CH_EMBER, ELEMENT_COUNT, ELEMENT_EMBER, ELEMENT_GALE, HEAT_MAX, PL_ATTACK, PL_BOW, PL_DEAD, PL_DODGE, PL_GRAPPLE, PL_GUARD, PL_HURT, PL_IDLE, PL_SKILL } from '../sim/content.ts'
import { DODGE_TICKS, MAX_COMBO, MOVE_ACTIVE, MOVE_WINDUP, STANCE_PLAIN, TWO_HANDED_TIME } from '../sim/combat-tuning.ts'
import { FX_PARTICLE, type View } from './view.ts'
import { VARIANT_FLIP, VARIANT_NORMAL, VARIANT_WHITE } from '../../game/render/atlas.ts'
import { SPR_ALDRIC, SPR_BLADES, SPR_CAST, SPR_HELD } from './sheet-ids.ts'
import {
  CAST_HORSE, GUARD_ANGLE, HELD_BOW, HELD_FIST, HELD_SHIELD, HELD_SHIELD_BACK, HELD_SHIELD_FRONT, HORSE_IDLE, REST_ANGLE, ROT_GREATSWORD, ROT_SWORD, SWEEP_SIDE,
  WINDUP_ANGLE,
} from './sheet-hero.ts'
import {
  DEAD_FRAMES, HERO_BACK, HERO_BEHIND, HERO_BOW, HERO_DASH, HERO_DEAD, HERO_ELDER, HERO_FALLS_ELDER, HERO_FRONT, HERO_GREAT, HERO_H, HERO_HAND, HERO_MOUNTED,
  HERO_ROLL, HERO_SIDE, HERO_W, IDLE_FRAMES, POSES_PER_FACING, POSE_BLINK, POSE_FOLLOW, POSE_GUARD, POSE_HURT, POSE_IDLE, POSE_STRIKE, POSE_WALK, POSE_WINDUP,
  ROLL_FRAMES, WALK_FRAMES,
} from '../sprites/aldric.ts'
import { GREATSWORD_REACH, SWORD_REACH } from '../sprites/gear.ts'
import { FOOT, blitCentered, blitFoot, blitFootSized, disc, drawShadow, frameH, frameId, frameW, ring, rotationIndex, simOf, snap } from './sprite.hot.ts'
import { C_DUST, C_EMBER, C_GOLD_PALE, C_PALE, C_TEAL, C_WHITE, HEX, STANCE_COLOR, STANCE_TRAIL } from './colors.ts'
import { random, spawnFx } from './effects.hot.ts'
import { TRAIL_CAP, motion } from './motion.ts'

const TAU = Math.PI * 2
const SKILL_WINDUP = 5
const SKILL_SWING = 8
const BLINK_EVERY = 190
const BLINK_TICKS = 5
const SQUASH_TICKS = 4
const SETTLE_TICKS = 4
const TRAIL_LIFE = 9
const TRAIL_ARC = 1.6
const TRAIL_LINES = 4

export function quadrant(face: number): number {
  return ((face + 128) & 1023) >> 8
}

function playerMoving(s: State): boolean {
  return s.playerX !== s.playerPrevX || s.playerY !== s.playerPrevY
}

function swingMove(s: State): number {
  const row = (s.stancesUnlocked & (1 << s.stance)) !== 0 ? s.stance : STANCE_PLAIN
  const step = s.playerCombo < 1 ? 0 : s.playerCombo > MAX_COMBO ? MAX_COMBO - 1 : s.playerCombo - 1
  return row * MAX_COMBO + step
}

function swingWindup(s: State): number {
  if (s.playerState !== PL_ATTACK) return SKILL_WINDUP
  return MOVE_WINDUP[swingMove(s)]! * (s.statTwoHanded !== 0 ? TWO_HANDED_TIME : 1)
}

function swingActive(s: State): number {
  if (s.playerState !== PL_ATTACK) return SKILL_SWING
  return MOVE_ACTIVE[swingMove(s)]! * (s.statTwoHanded !== 0 ? TWO_HANDED_TIME : 1)
}

function drawBlade(v: View, frame: number, x: number, y: number, angle: number, reach: number): void {
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  blitCentered(v, frameId(v, SPR_BLADES, frame, rotationIndex(dx, dy)), snap(x + dx * reach), snap(y + dy * reach))
}

function heroFacing(q: number): number {
  return q === 1 ? HERO_FRONT : q === 3 ? HERO_BACK : HERO_SIDE
}

function westish(face: number): boolean {
  const f = face & 1023
  return f > 256 && f < 768
}

function dashing(s: State): boolean {
  return s.stance === ELEMENT_GALE && (s.stancesUnlocked & (1 << ELEMENT_GALE)) !== 0
}

function swingProgress(s: State): number {
  const windup = swingWindup(s)
  if (s.playerTimer < windup) return -1
  const p = (s.playerTimer - windup) / swingActive(s)
  return p > 1 ? 1 : p
}

function heroPose(v: View, s: State, t: number): number {
  const state = s.playerState
  const facing = heroFacing(quadrant(s.playerFace))
  const row = facing * POSES_PER_FACING
  if (s.mounted !== 0) return HERO_MOUNTED
  if (state === PL_DEAD) return HERO_DEAD + (s.playerTimer < 6 ? 0 : s.playerTimer < 14 ? 1 : DEAD_FRAMES - 1)
  if (state === PL_DODGE) {
    if (dashing(s)) return HERO_DASH
    const step = ((s.playerTimer * ROLL_FRAMES) / DODGE_TICKS) | 0
    return HERO_ROLL + (step > ROLL_FRAMES - 1 ? ROLL_FRAMES - 1 : step)
  }
  if (state === PL_HURT) return row + POSE_HURT
  if (state === PL_ATTACK || state === PL_SKILL) {
    const p = swingProgress(s)
    return row + (p < 0 ? POSE_WINDUP : p < 0.45 ? POSE_STRIKE : POSE_FOLLOW)
  }
  if (state === PL_GUARD) return row + POSE_GUARD
  if (state === PL_BOW || state === PL_GRAPPLE) return HERO_BOW + (s.playerTimer < 8 ? 0 : 1)
  if (playerMoving(s)) return row + POSE_WALK + (((t / 5) | 0) % WALK_FRAMES)
  if (!v.reducedMotion && ((t | 0) % BLINK_EVERY) < BLINK_TICKS) return row + POSE_BLINK
  return row + POSE_IDLE + (v.reducedMotion ? 0 : ((t / 36) | 0) % IDLE_FRAMES)
}

export function playerFrame(v: View, s: State, t: number): number {
  const pose = heroPose(v, s, t)
  if (pose >= HERO_ROLL) return pose + (s.chapter >= CH_EMBER ? HERO_FALLS_ELDER : 0)
  return pose + (s.statTwoHanded !== 0 ? HERO_GREAT : 0) + (s.chapter >= CH_EMBER ? HERO_ELDER : 0)
}

function playerFlip(s: State, pose: number): boolean {
  if (pose >= HERO_BOW) return westish(s.playerFace)
  return quadrant(s.playerFace) === 2
}

function weaponVisible(s: State): boolean {
  const state = s.playerState
  return s.mounted === 0 && state !== PL_DEAD && state !== PL_DODGE && state !== PL_BOW && state !== PL_GRAPPLE
}

function heroAngle(s: State, facing: number, flip: boolean): number {
  const state = s.playerState
  const style = s.statTwoHanded !== 0 ? 3 : 0
  let rest = state === PL_GUARD ? GUARD_ANGLE[style + facing]! : REST_ANGLE[style + facing]!
  if ((state === PL_ATTACK || state === PL_SKILL) && s.playerTimer < swingWindup(s) + swingActive(s) + SETTLE_TICKS) {
    const face = (s.playerFace * TAU) / 1024
    const k = flip ? -SWEEP_SIDE[facing]! : SWEEP_SIDE[facing]!
    const p = swingProgress(s)
    if (p < 0) return face + (flip ? -WINDUP_ANGLE[facing]! : WINDUP_ANGLE[facing]!)
    const eased = 1 - (1 - p) * (1 - p)
    return face - k * 1.7 + k * 3.4 * eased
  }
  if (flip) rest = Math.PI - rest
  return rest
}

function drawSwingTrail(v: View, s: State, facing: number, flip: boolean, hx: number, hy: number, reach: number): void {
  if (s.playerState !== PL_ATTACK && s.playerState !== PL_SKILL) return
  const p = swingProgress(s)
  if (p <= 0 || p >= 1) return
  const face = (s.playerFace * TAU) / 1024
  const k = flip ? -SWEEP_SIDE[facing]! : SWEEP_SIDE[facing]!
  const from = face - k * 1.7
  const to = face - k * 1.7 + k * 3.4 * (1 - (1 - p) * (1 - p))
  const element = (s.stancesUnlocked & (1 << s.stance)) !== 0 && s.stance >= 0 && s.stance < ELEMENT_COUNT ? s.stance : -1
  const ctx = v.ctx
  const span = to - from
  const tail = span > TRAIL_ARC ? to - TRAIL_ARC : span < -TRAIL_ARC ? to + TRAIL_ARC : from
  ctx.lineWidth = 0.5
  for (let n = 0; n < TRAIL_LINES; n++) {
    const r = reach * 2 - 0.5 - n * 0.75
    ctx.globalAlpha = 0.75 - n * 0.16
    ctx.strokeStyle = HEX[n === 0 ? C_WHITE : element < 0 ? C_PALE : STANCE_TRAIL[element]!]!
    ctx.beginPath()
    if (k > 0) ctx.arc(hx, hy, r, tail + (to - tail) * n * 0.12, to)
    else ctx.arc(hx, hy, r, to, tail + (to - tail) * n * 0.12)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function drawShield(v: View, s: State, facing: number, flip: boolean, ox: number, oy: number, front: boolean): void {
  if (s.statTwoHanded !== 0) return
  const guarding = s.playerState === PL_GUARD
  if (facing === HERO_SIDE) {
    if (front !== guarding) return
    blitCentered(v, frameId(v, SPR_HELD, HELD_SHIELD, flip ? VARIANT_FLIP : VARIANT_NORMAL), ox, oy)
    return
  }
  if (!front) return
  blitCentered(v, frameId(v, SPR_HELD, facing === HERO_FRONT ? HELD_SHIELD_FRONT : HELD_SHIELD_BACK, VARIANT_NORMAL), ox, oy)
}

function recordTrail(v: View, s: State, id: number): void {
  const m = motion
  const last = (m.trailNext + TRAIL_CAP - 1) % TRAIL_CAP
  if (m.trailTick[last] === s.tick) return
  const i = m.trailNext
  m.trailNext = (i + 1) % TRAIL_CAP
  m.trailX[i] = v.playerX + v.originX
  m.trailY[i] = v.playerY + v.originY
  m.trailFrame[i] = id
  m.trailTick[i] = s.tick
}

function drawTrail(v: View, s: State, t: number): void {
  const m = motion
  const dash = s.playerState === PL_DODGE && dashing(s)
  for (let i = 0; i < TRAIL_CAP; i++) {
    const age = t - m.trailTick[i]!
    if (age <= 0 || age > TRAIL_LIFE) continue
    const fade = 1 - age / TRAIL_LIFE
    const x = snap(m.trailX[i]! - v.originX)
    const y = snap(m.trailY[i]! - v.originY)
    if (dash) disc(v, x, y - 6, 4, 7, C_TEAL, 0.25 * fade)
    v.ctx.globalAlpha = (dash ? 0.45 : 0.3) * fade
    blitFoot(v, m.trailFrame[i]!, x, y + FOOT)
  }
  v.ctx.globalAlpha = 1
}

function kickDust(v: View, s: State, t: number): void {
  const moving = playerMoving(s) && s.playerState === PL_IDLE && s.mounted === 0
  const m = motion
  if (moving && !m.wasMoving && !v.reducedMotion) {
    const back = westish(s.playerFace) ? 1 : -1
    for (let n = 0; n < 3; n++) {
      spawnFx(v, FX_PARTICLE, v.playerX + v.originX + back * (2 + random(v) * 3), v.playerY + v.originY + FOOT - 1, t, 12 + random(v) * 8, C_DUST, back * (0.2 + random(v) * 0.3), -0.15 - random(v) * 0.2)
    }
  }
  m.wasMoving = moving
}

function drawStanceAura(v: View, s: State, t: number, x: number, y: number): void {
  if (s.stancesUnlocked === 0 || s.stance < 0 || s.stance >= ELEMENT_COUNT || s.playerState === PL_DEAD) return
  const pulse = ((t / 10) | 0) & 1
  ring(v, x, y + FOOT - 1, 8 + pulse, 3, STANCE_COLOR[s.stance]!, 1, 0.45)
  if (s.stance === ELEMENT_EMBER && s.heat > 0) {
    const heat = s.heat / HEAT_MAX
    disc(v, x, y - 4, 5 + heat * 5, 6 + heat * 5, C_EMBER, 0.12 + heat * 0.18)
    if (heat > 0.5 && ((t | 0) & 3) === 0) spawnFx(v, FX_PARTICLE, x + v.originX + (random(v) * 10 - 5), y + v.originY - 2, t, 18, C_GOLD_PALE, (random(v) - 0.5) * 0.2, -0.5)
  }
  v.ctx.globalAlpha = 1
}

function handX(at: number, flip: boolean, w: number): number {
  const px = flip ? HERO_W - 1 - HERO_HAND[at]! : HERO_HAND[at]!
  return snap(((px + 0.5 - HERO_W / 2) * w) / HERO_W)
}

function handY(at: number, h: number): number {
  return snap(((HERO_H - HERO_HAND[at]! - 0.5) * h) / HERO_H)
}

function drawFists(v: View, two: boolean, angle: number, hx: number, hy: number): void {
  const fist = frameId(v, SPR_HELD, HELD_FIST, VARIANT_NORMAL)
  if (two) blitCentered(v, fist, snap(hx - Math.cos(angle) * 2), snap(hy - Math.sin(angle) * 2))
  blitCentered(v, fist, hx, hy)
}

export function drawPlayer(v: View, s: State, t: number, x: number, y: number): void {
  const pose = heroPose(v, s, t)
  const frame = playerFrame(v, s, t)
  const flip = playerFlip(s, pose)
  const white = s.hurtFlashUntil > s.tick && ((s.tick >> 1) & 1) === 0
  const id = frameId(v, SPR_ALDRIC, frame, (flip ? VARIANT_FLIP : VARIANT_NORMAL) + (white ? VARIANT_WHITE : 0))
  if (s.mounted !== 0) {
    const run = playerMoving(s) ? ((t / 5) | 0) & 3 : HORSE_IDLE + (((t / 40) | 0) & 1)
    blitFoot(v, frameId(v, SPR_CAST, CAST_HORSE + run, flip ? VARIANT_FLIP : VARIANT_NORMAL), x, y + FOOT)
    blitFoot(v, id, x + (flip ? 2 : -2), y + FOOT - 6 - (run & 1))
    return
  }
  kickDust(v, s, t)
  if (s.playerState === PL_DODGE) recordTrail(v, s, frameId(v, SPR_ALDRIC, frame, (flip ? VARIANT_FLIP : VARIANT_NORMAL) + VARIANT_WHITE))
  drawTrail(v, s, t)
  let w = frameW(v, id)
  let h = frameH(v, id)
  if (t - motion.hitAt < SQUASH_TICKS) {
    w += 1.5
    h -= 1
  } else if (t - motion.hurtAt < SQUASH_TICKS) {
    w -= 1.5
    h += 1
  }
  const facing = pose < HERO_BOW ? ((pose / POSES_PER_FACING) | 0) : HERO_SIDE
  const foot = y + FOOT
  const hx = x + handX(frame * 4, flip, w)
  const hy = foot - handY(frame * 4 + 1, h)
  const sx = x + handX(frame * 4 + 2, flip, w)
  const sy = foot - handY(frame * 4 + 3, h)
  const armed = weaponVisible(s)
  const two = s.statTwoHanded !== 0
  const bladeFrame = two ? ROT_GREATSWORD : ROT_SWORD
  const reach = simOf(v, frameId(v, SPR_BLADES, bladeFrame, 0), two ? GREATSWORD_REACH : SWORD_REACH)
  const behind = HERO_BEHIND[frame]! !== 0
  const angle = heroAngle(s, facing, flip)
  if (armed) drawShield(v, s, facing, flip, sx, sy, false)
  if (armed && behind) {
    drawBlade(v, bladeFrame, hx, hy, angle, reach)
    drawFists(v, two, angle, hx, hy)
  }
  blitFootSized(v, id, x, foot, w, h)
  if (armed && !behind) {
    drawSwingTrail(v, s, facing, flip, hx, hy, reach)
    drawBlade(v, bladeFrame, hx, hy, angle, reach)
    drawFists(v, two, angle, hx, hy)
  }
  if (armed) drawShield(v, s, facing, flip, sx, sy, true)
  if (s.playerState === PL_BOW) blitCentered(v, frameId(v, SPR_HELD, HELD_BOW, flip ? VARIANT_FLIP : VARIANT_NORMAL), sx, sy)
}

export function drawPlayerGround(v: View, s: State, t: number): void {
  drawShadow(v, v.playerX, v.playerY, s.mounted !== 0 ? 20 : 11, 0)
  drawStanceAura(v, s, t, v.playerX, v.playerY)
}
