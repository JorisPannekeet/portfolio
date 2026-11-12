import type { State } from '../sim/state.ts'
import { MAX_PROJECTILES, PROJ_EMBER, TILE } from '../sim/content.ts'
import type { View } from './view.ts'
import { PROJ_ANIM, PROJ_FRAME, PROJ_ROTATED, SPR_FX, SPR_ROTATED } from './sheet.ts'
import { blitCentered, disc, frameId, rotationIndex } from './sprite.hot.ts'
import { drawTiles } from './tiles.hot.ts'
import { drawActors, drawFlatObjects } from './actors.hot.ts'
import { consumeEvents, drawEffects, drawFlash, shakeOffset } from './effects.hot.ts'
import { drawLighting } from './light.hot.ts'
import { drawHud } from './hud.hot.ts'
import { C_EMBER, C_GOLD, C_INK } from './colors.ts'

const CULL = 24
const PROJ_LIFT = 6

function drawProjectiles(v: View, s: State, alpha: number, t: number): void {
  const ox = v.originX
  const oy = v.originY
  for (let i = 0; i < MAX_PROJECTILES; i++) {
    if (s.prAlive[i]! === 0) continue
    const kind = s.prKind[i]!
    const x = Math.round(s.prPrevX[i]! + (s.prX[i]! - s.prPrevX[i]!) * alpha - ox)
    const y = Math.round(s.prPrevY[i]! + (s.prY[i]! - s.prPrevY[i]!) * alpha - oy)
    if (x < -CULL || y < -CULL || x > v.width + CULL || y > v.height + CULL) continue
    if (kind === PROJ_EMBER && s.prVx[i]! === 0 && s.prVy[i]! === 0) {
      const flicker = ((t / 5 + i) | 0) & 1
      disc(v, x, y, 8 + flicker, 4, C_EMBER, 0.35)
      disc(v, x, y, 4, 2, C_GOLD, 0.45 + flicker * 0.2)
      v.ctx.globalAlpha = 1
      blitCentered(v, frameId(v, SPR_FX, PROJ_FRAME[kind]! + flicker, 0), x, y - 2)
      continue
    }
    disc(v, x, y, 3, 1, C_INK, 0.3)
    v.ctx.globalAlpha = 1
    const id = PROJ_ROTATED[kind]! !== 0
      ? frameId(v, SPR_ROTATED, PROJ_FRAME[kind]!, rotationIndex(s.prVx[i]!, s.prVy[i]!))
      : frameId(v, SPR_FX, PROJ_FRAME[kind]! + (((t / 4 + i) | 0) % PROJ_ANIM[kind]!), 0)
    blitCentered(v, id, x, y - PROJ_LIFT)
  }
}

function cameraAxis(center: number, view: number, mapPixels: number): number {
  if (mapPixels <= view) return Math.round((mapPixels - view) / 2)
  let origin = Math.round(center) - (view >> 1)
  if (origin < 0) origin = 0
  if (origin > mapPixels - view) origin = mapPixels - view
  return origin
}

export function drawFrame(v: View, s: State, alpha: number): void {
  const a = alpha < 0 ? 0 : alpha > 1 ? 1 : alpha
  const t = s.tick + a
  consumeEvents(v, s)
  const px = s.playerPrevX + (s.playerX - s.playerPrevX) * a
  const py = s.playerPrevY + (s.playerY - s.playerPrevY) * a
  v.originX = cameraAxis(px, v.width, s.mapW * TILE) + shakeOffset(v, t)
  v.originY = cameraAxis(py, v.height, s.mapH * TILE) + shakeOffset(v, t)
  v.playerX = Math.round(px) - v.originX
  v.playerY = Math.round(py) - v.originY
  v.ctx.globalAlpha = 1
  drawTiles(v, s, t)
  drawFlatObjects(v, s, t)
  drawActors(v, s, a, t)
  drawProjectiles(v, s, a, t)
  drawEffects(v, t)
  drawLighting(v, s)
  drawFlash(v, t)
  drawHud(v, s, t, a)
}
