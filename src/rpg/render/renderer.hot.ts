import type { State } from '../sim/state.ts'
import { TILE } from '../sim/content.ts'
import type { View } from './view.ts'
import { snap } from './sprite.hot.ts'
import { drawTiles } from './tiles.hot.ts'
import { drawAmbient, drawAmbientLow, updateAmbient, updateWeather } from './ambient.hot.ts'
import { drawActors, drawFlatObjects } from './actors.hot.ts'
import { drawProjectiles } from './foes.hot.ts'
import { consumeEvents, drawEffects, drawFlash, shakeOffset } from './effects.hot.ts'
import { drawLighting } from './light.hot.ts'
import { drawHud } from './hud.hot.ts'

function cameraAxis(center: number, view: number, mapPixels: number): number {
  if (mapPixels <= view) return Math.round((mapPixels - view) / 2)
  let origin = snap(center) - (view >> 1)
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
  v.playerX = snap(px) - v.originX
  v.playerY = snap(py) - v.originY
  v.ctx.globalAlpha = 1
  updateWeather(v, s)
  updateAmbient(v, s)
  drawTiles(v, s, t)
  drawAmbientLow(v, s, t)
  drawFlatObjects(v, s, t)
  drawActors(v, s, a, t)
  drawProjectiles(v, s, a, t)
  drawAmbient(v, s, t)
  drawEffects(v, t)
  drawLighting(v, s, t)
  drawFlash(v, t)
  drawHud(v, s, t, a)
}
