import type { State } from '../sim/state.ts'
import { PHASE_DEAD, WEAPON_FIELD } from '../sim/content.ts'
import type { View } from './view.ts'
import { ROTATIONS } from './atlas.ts'
import { SPR_GEMS, SPR_SHOTS } from './sheet.ts'
import { blitCentered, frameId } from './sprite.hot.ts'
import { drawActors, drawPropShadows } from './actors.hot.ts'
import { drawPois } from './world.hot.ts'
import { drawFloor } from './terrain.hot.ts'
import { consumeEvents, drawEffects, drawFlash, drawSweep, shakeOffset } from './effects.hot.ts'
import { drawHud, drawPlayerArmor } from './hud.hot.ts'
import { AMBER, CYAN } from './colors.ts'

const CULL = 48
const TAU = Math.PI * 2

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
  drawFloor(v, t)
  drawPois(v, s, t, playerX, playerY)
  drawPropShadows(v, s)
  drawGems(v, s)
  drawAura(v, s, t, playerX, playerY)
  drawActors(v, s, a, t, playerX, playerY)
  drawShots(v, s, a)
  drawEffects(v, t, playerX, playerY)
  drawFlash(v, t)
  drawSweep(v, t)
  if (s.phase !== PHASE_DEAD) drawPlayerArmor(v, s, playerX, playerY)
  drawHud(v, s, t, playerX, playerY)
}
