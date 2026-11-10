import type { State } from '../sim/state.ts'
import { INTRO_TICKS, START_X, START_Y } from '../sim/content.ts'
import type { View } from './view.ts'
import { VARIANT_FLIP, VARIANT_NORMAL } from './atlas.ts'
import {
  LIFT_APRON,
  LIFT_DOOR_LEFT,
  LIFT_DOOR_RIGHT,
  LIFT_LAMP_AMBER,
  LIFT_LAMP_GREEN,
  LIFT_LAMP_OFF,
  LIFT_LAMP_RED,
  LIFT_PLATE,
  LIFT_PLATE_LOCKED,
  LIFT_STEAM_COUNT,
  LIFT_STEAM_FIRST,
  LIFT_WALL,
  PLAYER_FRAME_IDLE,
  SPR_LIFT,
  SPR_PLAYER,
} from './sheet.ts'
import { blitAt, frameId } from './sprite.hot.ts'
import { INK } from './colors.ts'

const TAU = Math.PI * 2
const APRON_HALF = 76
const HOLE_LEFT = -20
const HOLE_TOP = -18
const HOLE = 40
const DOOR = 20
const DEPTH_MAX = 40
const UNLOCK_TICK = 4
const DOOR_STEP_FIRST = 8
const DOOR_STEP_TICKS = 4
const DOOR_STEPS = 3
const RISE_START = 22
const RISE_STEPS = 8
const RISE_STEP_TICKS = 8
const RISE_MOVE_TICKS = 3
const RECOIL_TICKS = 3
const SHAKE_TICKS = 6
const FLARE_TICKS = 9
const STEAM_TICKS = 32
const STEAM_RISE_EVERY = 4
const STROBE_TICKS = 4
const GUIDE_LIGHTS = 8
const GUIDE_RADIUS = 58
const GUIDE_LIT = 2
const LAMP_HALF = 2
const CORNER_X = 27
const CORNER_TOP = -25
const CORNER_BOTTOM = 28
const VENT_X = 22
const SHAFT_SHADE = 0.6
const SHADE_STEPS = 4
const VENT_TOP = -20
const VENT_BOTTOM = 24

export function liftDepth(tick: number): number {
  if (tick >= INTRO_TICKS) return 0
  if (tick < RISE_START) return DEPTH_MAX
  const k = tick - RISE_START
  const step = (k / RISE_STEP_TICKS) | 0
  if (step >= RISE_STEPS) return 0
  const within = k - step * RISE_STEP_TICKS
  const moved = within >= RISE_MOVE_TICKS ? 1 : within / RISE_MOVE_TICKS
  return Math.round(DEPTH_MAX * (1 - (step + moved) / RISE_STEPS))
}

export function liftRecoil(tick: number): number {
  return tick >= INTRO_TICKS && tick < INTRO_TICKS + RECOIL_TICKS ? 1 : 0
}

export function liftFlare(tick: number): boolean {
  return tick >= INTRO_TICKS && tick < INTRO_TICKS + FLARE_TICKS
}

export function liftRiding(tick: number): boolean {
  return tick < INTRO_TICKS
}

export function liftBuried(tick: number): boolean {
  return tick < INTRO_TICKS && liftDepth(tick) > 0
}

export function armLiftShake(v: View, tick: number): void {
  const until = INTRO_TICKS + SHAKE_TICKS
  if (v.reducedMotion || tick < INTRO_TICKS || tick >= until || v.shakeUntil >= until) return
  v.shakeUntil = until
}

function doorRetract(tick: number): number {
  if (tick < UNLOCK_TICK) return 0
  if (tick < DOOR_STEP_FIRST) return 1
  let steps = 1 + (((tick - DOOR_STEP_FIRST) / DOOR_STEP_TICKS) | 0)
  if (steps > DOOR_STEPS) steps = DOOR_STEPS
  return Math.round((DOOR * steps) / DOOR_STEPS)
}

function blitPart(v: View, id: number, sx: number, sy: number, w: number, h: number, x: number, y: number): void {
  if (w <= 0 || h <= 0) return
  const a = v.atlas
  v.ctx.drawImage(v.image, a.rx[id]! + sx, a.ry[id]! + sy, w, h, x, y, w, h)
}

function lampFrame(v: View, tick: number, lit: boolean, strobeColor: number): number {
  if (tick < 1) return frameId(v, SPR_LIFT, LIFT_LAMP_OFF, 0)
  if (tick >= INTRO_TICKS) return frameId(v, SPR_LIFT, LIFT_LAMP_GREEN, 0)
  return frameId(v, SPR_LIFT, v.reducedMotion || lit ? strobeColor : LIFT_LAMP_OFF, 0)
}

function drawLamps(v: View, tick: number, cx: number, cy: number): void {
  const beat = (tick / STROBE_TICKS) | 0
  for (let k = 0; k < GUIDE_LIGHTS; k++) {
    const angle = (k * TAU) / GUIDE_LIGHTS
    const x = cx + Math.round(Math.cos(angle) * GUIDE_RADIUS) - LAMP_HALF
    const y = cy + Math.round(Math.sin(angle) * GUIDE_RADIUS) - LAMP_HALF
    blitAt(v, lampFrame(v, tick, ((beat - k) & (GUIDE_LIGHTS - 1)) < GUIDE_LIT, LIFT_LAMP_AMBER), x, y, 1)
  }
  for (let corner = 0; corner < 4; corner++) {
    const right = corner === 1 || corner === 2
    const bottom = corner >= 2
    const x = cx + (right ? CORNER_X : -CORNER_X) - LAMP_HALF
    const y = cy + (bottom ? CORNER_BOTTOM : CORNER_TOP) - LAMP_HALF
    blitAt(v, lampFrame(v, tick, ((beat + corner) & 1) === 0, LIFT_LAMP_RED), x, y, 1)
  }
}

export function drawLiftHub(v: View, s: State): void {
  const cx = START_X - v.originX
  const cy = START_Y - v.originY
  if (cx + APRON_HALF <= 0 || cy + APRON_HALF <= 0 || cx - APRON_HALF >= v.width || cy - APRON_HALF >= v.height) return
  const tick = s.tick
  blitAt(v, frameId(v, SPR_LIFT, LIFT_APRON, 0), cx - APRON_HALF, cy - APRON_HALF, 1)
  const holeX = cx + HOLE_LEFT
  const holeY = cy + HOLE_TOP
  if (tick >= INTRO_TICKS) {
    blitAt(v, frameId(v, SPR_LIFT, LIFT_PLATE_LOCKED, 0), holeX, holeY + liftRecoil(tick), 1)
  } else {
    const depth = liftDepth(tick)
    blitPart(v, frameId(v, SPR_LIFT, LIFT_WALL, 0), 0, 0, HOLE, depth, holeX, holeY)
    blitPart(v, frameId(v, SPR_LIFT, LIFT_PLATE, 0), 0, 0, HOLE, HOLE - depth, holeX, holeY + depth)
    const open = doorRetract(tick)
    blitPart(v, frameId(v, SPR_LIFT, LIFT_DOOR_LEFT, 0), open, 0, DOOR - open, HOLE, holeX, holeY)
    blitPart(v, frameId(v, SPR_LIFT, LIFT_DOOR_RIGHT, 0), 0, 0, DOOR - open, HOLE, holeX + DOOR + open, holeY)
  }
  drawLamps(v, tick, cx, cy)
}

export function drawLiftRider(v: View, s: State): void {
  const a = v.atlas
  const id = frameId(v, SPR_PLAYER, PLAYER_FRAME_IDLE, s.faceX < 0 ? VARIANT_FLIP : VARIANT_NORMAL)
  const w = a.rw[id]!
  const h = a.rh[id]!
  const cx = START_X - v.originX
  const cy = START_Y - v.originY
  const top = cy - (h >> 1) + liftDepth(s.tick)
  const rim = cy + HOLE_TOP + HOLE
  const rows = rim - top < h ? rim - top : h
  blitPart(v, id, 0, 0, w, rows, cx - (w >> 1), top)
  const depth = liftDepth(s.tick)
  if (depth <= 0 || depth >= HOLE) return
  const ctx = v.ctx
  ctx.globalAlpha = (Math.ceil((depth * SHADE_STEPS) / DEPTH_MAX) / SHADE_STEPS) * SHAFT_SHADE
  ctx.fillStyle = INK
  ctx.fillRect(cx + HOLE_LEFT, cy + HOLE_TOP + depth, HOLE, HOLE - depth)
  ctx.globalAlpha = 1
}

export function drawLiftSteam(v: View, s: State): void {
  const age = s.tick - INTRO_TICKS
  if (age < 0 || age >= STEAM_TICKS) return
  const cx = START_X - v.originX
  const cy = START_Y - v.originY
  const stage = ((age * LIFT_STEAM_COUNT) / STEAM_TICKS) | 0
  const id = frameId(v, SPR_LIFT, LIFT_STEAM_FIRST + stage, 0)
  const w = v.atlas.rw[id]!
  const h = v.atlas.rh[id]!
  const rise = ((age / STEAM_RISE_EVERY) | 0) * 2
  v.ctx.globalAlpha = stage === 0 ? 0.9 : stage === 1 ? 0.7 : 0.45
  for (let vent = 0; vent < 4; vent++) {
    const side = (vent & 1) === 0 ? -1 : 1
    const x = cx + side * (VENT_X + (rise >> 1)) - (w >> 1)
    const y = cy + ((vent & 2) === 0 ? VENT_TOP : VENT_BOTTOM) - rise - (h >> 1)
    blitAt(v, id, x, y, 1)
  }
  v.ctx.globalAlpha = 1
}
