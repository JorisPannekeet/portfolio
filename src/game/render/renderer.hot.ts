import type { State } from '../sim/state.ts'
import { PHASE_DEAD, WEAPON_FIELD } from '../sim/content.ts'
import type { View } from './view.ts'
import { ROTATIONS, VARIANT_FLIP, VARIANT_NORMAL, VARIANT_WHITE } from './atlas.ts'
import {
  FLOOR_DECAL_COUNT,
  FLOOR_DECAL_FIRST,
  FLOOR_PLATE,
  FLOOR_PLATE_WORN,
  PLAYER_FRAME_IDLE,
  PLAYER_FRAME_WALK,
  SPR_DRONE,
  SPR_ENEMY_FIRST,
  SPR_FLOOR,
  SPR_GEMS,
  SPR_PLAYER,
  SPR_SHOTS,
} from './sheet.ts'
import { blitAt, blitCentered, frameId } from './sprite.hot.ts'
import { consumeEvents, drawEffects, drawFlash, shakeOffset } from './effects.hot.ts'
import { drawHud, drawPlayerArmor } from './hud.hot.ts'
import { AMBER, CYAN } from './colors.ts'

const TILE = 32
const CULL = 32
const TAU = Math.PI * 2

function hashTile(x: number, y: number): number {
  let h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1)
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  return (h ^ (h >>> 16)) >>> 0
}

function drawFloor(v: View): void {
  const ox = v.originX
  const oy = v.originY
  const tx0 = Math.floor(ox / TILE)
  const ty0 = Math.floor(oy / TILE)
  const tx1 = Math.floor((ox + v.width) / TILE)
  const ty1 = Math.floor((oy + v.height) / TILE)
  const plate = frameId(v, SPR_FLOOR, FLOOR_PLATE, 0)
  const worn = frameId(v, SPR_FLOOR, FLOOR_PLATE_WORN, 0)
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      const h = hashTile(tx, ty)
      const x = tx * TILE - ox
      const y = ty * TILE - oy
      blitAt(v, (h & 7) === 0 ? worn : plate, x, y, 1)
      if ((h >>> 3) % 7 !== 0) continue
      const decal = frameId(v, SPR_FLOOR, FLOOR_DECAL_FIRST + ((h >>> 6) % FLOOR_DECAL_COUNT), 0)
      const room = TILE - 4 - v.atlas.rw[decal]!
      const roomY = TILE - 4 - v.atlas.rh[decal]!
      blitAt(v, decal, x + 2 + ((h >>> 9) % (room + 1)), y + 2 + ((h >>> 14) % (roomY + 1)), 1)
    }
  }
}

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
    blitCentered(v, frameId(v, SPR_ENEMY_FIRST + type, frame, variant), x, y)
  }
}

function drawPlayer(v: View, s: State, t: number, x: number, y: number): void {
  if (s.phase === PHASE_DEAD) return
  if (s.iframes > 0 && ((s.tick >> 2) & 1) === 1) return
  const moving = s.px !== s.ppx || s.py !== s.ppy
  const frame = moving ? PLAYER_FRAME_WALK + (((t / 8) | 0) & 1) : PLAYER_FRAME_IDLE
  blitCentered(v, frameId(v, SPR_PLAYER, frame, s.faceX < 0 ? VARIANT_FLIP : VARIANT_NORMAL), x, y)
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
  drawGems(v, s)
  drawAura(v, s, t, playerX, playerY)
  drawEnemies(v, s, a, t)
  drawPlayer(v, s, t, playerX, playerY)
  drawDrones(v, s, a)
  drawShots(v, s, a)
  drawEffects(v, t, playerX, playerY)
  drawFlash(v, t)
  if (s.phase !== PHASE_DEAD) drawPlayerArmor(v, s, playerX, playerY)
  drawHud(v, s)
}
