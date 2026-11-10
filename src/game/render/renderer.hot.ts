import type { State } from '../sim/state.ts'
import { PHASE_DEAD, WEAPON_FIELD } from '../sim/content.ts'
import type { View } from './view.ts'
import { ROTATIONS, VARIANT_FLIP, VARIANT_NORMAL, VARIANT_WHITE } from './atlas.ts'
import {
  ENEMY_SPRITE,
  PLAYER_FRAME_IDLE,
  PLAYER_FRAME_IDLE_COUNT,
  PLAYER_FRAME_WALK,
  PLAYER_FRAME_WALK_COUNT,
  SPR_DRONE,
  SPR_GEMS,
  SPR_PLAYER,
  SPR_SCOUT,
  SPR_SHOTS,
  SPR_THRUST,
  THRUST_FRAME_COUNT,
} from './sheet.ts'
import { blitAt, blitCentered, frameId } from './sprite.hot.ts'
import { drawFloor, drawPois } from './world.hot.ts'
import { consumeEvents, drawEffects, drawFlash, drawSweep, shakeOffset } from './effects.hot.ts'
import { drawHud, drawPlayerArmor } from './hud.hot.ts'
import { AMBER, CYAN } from './colors.ts'

const CULL = 48
const TAU = Math.PI * 2
const THRUST_LOW_X = -3
const THRUST_LOW_Y = 16
const THRUST_HIGH_X = -6
const THRUST_HIGH_Y = 10

function drawGems(v: View, s: State): void {
  const ox = v.originX
  const oy = v.originY
  for (let i = 0; i < s.gemCount; i++) {
    const x = Math.round(s.gx[i]! - ox)
    const y = Math.round(s.gy[i]! - oy)
    if (x < -8 || y < -8 || x > v.width + 8 || y > v.height + 8) continue
    blitCentered(v, frameId(v, SPR_GEMS, s.gKind[i]!, 0), x, y)
  }
}

function drawAura(v: View, s: State, t: number, x: number, y: number): void {
  if (s.auraRadius <= 0) return
  const ctx = v.ctx
  const color = s.weaponEvolved[WEAPON_FIELD]! > 0 ? AMBER : CYAN
  ctx.beginPath()
  ctx.arc(x, y, s.auraRadius, 0, TAU)
  ctx.globalAlpha = 0.08
  ctx.fillStyle = color
  ctx.fill()
  ctx.globalAlpha = ((t / 8) | 0) % 2 === 0 ? 0.55 : 0.35
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.globalAlpha = 1
}

function drawEnemies(v: View, s: State, alpha: number, t: number): void {
  const ox = v.originX
  const oy = v.originY
  const right = v.width + CULL
  const bottom = v.height + CULL
  const step = (t / 14) | 0
  for (let i = 0; i < s.enemyCount; i++) {
    const wx = s.epx[i]! + (s.ex[i]! - s.epx[i]!) * alpha
    const wy = s.epy[i]! + (s.ey[i]! - s.epy[i]!) * alpha
    const x = Math.round(wx - ox)
    const y = Math.round(wy - oy)
    if (x < -CULL || y < -CULL || x > right || y > bottom) continue
    const type = s.eType[i]!
    const frame = (step + type + ((wx / 24) | 0)) & 1
    const variant = (s.px < wx ? VARIANT_FLIP : VARIANT_NORMAL) + (s.eFlash[i]! > 0 ? VARIANT_WHITE : 0)
    blitCentered(v, frameId(v, ENEMY_SPRITE[type] ?? SPR_SCOUT, frame, variant), x, y)
  }
}

function drawThrust(v: View, frame: number, flip: boolean, left: number, top: number, relX: number, relY: number): void {
  const a = v.atlas
  const id = frameId(v, SPR_THRUST, frame, flip ? VARIANT_FLIP : VARIANT_NORMAL)
  const bodyW = a.rw[a.base[SPR_PLAYER]!]!
  const x = flip ? bodyW - relX - a.rw[id]! : relX
  blitAt(v, id, left + x, top + relY - (a.rh[id]! >> 1), 1)
}

function drawPlayer(v: View, s: State, t: number, x: number, y: number): void {
  if (s.phase === PHASE_DEAD) return
  if (s.iframes > 0 && ((s.tick >> 2) & 1) === 1) return
  const moving = s.px !== s.ppx || s.py !== s.ppy
  const flip = s.faceX < 0
  const frame = moving
    ? PLAYER_FRAME_WALK + (((t / 7) | 0) % PLAYER_FRAME_WALK_COUNT)
    : PLAYER_FRAME_IDLE + (((t / 30) | 0) % PLAYER_FRAME_IDLE_COUNT)
  const id = frameId(v, SPR_PLAYER, frame, flip ? VARIANT_FLIP : VARIANT_NORMAL)
  const left = x - (v.atlas.rw[id]! >> 1)
  const top = y - (v.atlas.rh[id]! >> 1)
  if (moving) {
    const flare = ((t / 3) | 0) % THRUST_FRAME_COUNT
    drawThrust(v, flare, flip, left, top, THRUST_HIGH_X, THRUST_HIGH_Y)
    drawThrust(v, (flare + 1) % THRUST_FRAME_COUNT, flip, left, top, THRUST_LOW_X, THRUST_LOW_Y)
  }
  blitAt(v, id, left, top, 1)
}

function drawDrones(v: View, s: State, alpha: number): void {
  const id = frameId(v, SPR_DRONE, 0, 0)
  for (let i = 0; i < s.droneCount; i++) {
    const x = s.dronePx[i]! + (s.droneX[i]! - s.dronePx[i]!) * alpha
    const y = s.dronePy[i]! + (s.droneY[i]! - s.dronePy[i]!) * alpha
    blitCentered(v, id, Math.round(x - v.originX), Math.round(y - v.originY))
  }
}

function drawShots(v: View, s: State, alpha: number): void {
  const ox = v.originX
  const oy = v.originY
  const right = v.width + CULL
  const bottom = v.height + CULL
  for (let i = 0; i < s.shotCount; i++) {
    const x = Math.round(s.spx[i]! + (s.sx[i]! - s.spx[i]!) * alpha - ox)
    const y = Math.round(s.spy[i]! + (s.sy[i]! - s.spy[i]!) * alpha - oy)
    if (x < -CULL || y < -CULL || x > right || y > bottom) continue
    const heading = Math.round((Math.atan2(s.svy[i]!, s.svx[i]!) * ROTATIONS) / TAU) & (ROTATIONS - 1)
    blitCentered(v, frameId(v, SPR_SHOTS, s.sKind[i]!, heading), x, y)
  }
}

export function drawFrame(v: View, s: State, alpha: number): void {
  const a = alpha < 0 ? 0 : alpha > 1 ? 1 : alpha
  const t = s.tick + a
  consumeEvents(v, s)
  const camX = s.ppx + (s.px - s.ppx) * a
  const camY = s.ppy + (s.py - s.ppy) * a
  v.originX = Math.round(camX) - (v.width >> 1) + shakeOffset(v, t)
  v.originY = Math.round(camY) - (v.height >> 1) + shakeOffset(v, t)
  const playerX = Math.round(camX) - v.originX
  const playerY = Math.round(camY) - v.originY
  v.ctx.globalAlpha = 1
  drawFloor(v)
  drawPois(v, s, t, playerX, playerY)
  drawGems(v, s)
  drawAura(v, s, t, playerX, playerY)
  drawEnemies(v, s, a, t)
  drawPlayer(v, s, t, playerX, playerY)
  drawDrones(v, s, a)
  drawShots(v, s, a)
  drawEffects(v, t, playerX, playerY)
  drawFlash(v, t)
  drawSweep(v, t)
  if (s.phase !== PHASE_DEAD) drawPlayerArmor(v, s, playerX, playerY)
  drawHud(v, s, t, playerX, playerY)
}
