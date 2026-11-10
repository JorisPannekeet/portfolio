import type { State } from '../sim/state.ts'
import { BEACON_RADIUS, LAIR_RADIUS, POI_BEACON } from '../sim/content.ts'
import type { View } from './view.ts'
import {
  BEACON_ANCHOR_X,
  BEACON_ANCHOR_Y,
  POI_FRAME_BEACON,
  POI_FRAME_BEACON_PULSE,
  POI_FRAME_BEACON_SPENT,
  POI_FRAME_LAIR,
  POI_FRAME_LAIR_OPEN,
  SPR_POI,
} from './sheet.ts'
import { blitAt, blitCentered, frameId } from './sprite.hot.ts'
import { CORE, CYAN, CYAN_DEEP } from './colors.ts'

const TAU = Math.PI * 2

function ring(v: View, x: number, y: number, radius: number, from: number, to: number, color: string, width: number, alpha: number): void {
  const ctx = v.ctx
  ctx.globalAlpha = alpha
  ctx.beginPath()
  ctx.arc(x, y, radius, from, to)
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.stroke()
}

export function drawPois(v: View, s: State, t: number, playerX: number, playerY: number): void {
  const ctx = v.ctx
  const ox = v.originX
  const oy = v.originY
  const blink = ((t / 6) | 0) & 1
  for (let i = 0; i < s.poiCount; i++) {
    const x = Math.round(s.poiX[i]! - ox)
    const y = Math.round(s.poiY[i]! - oy)
    const reach = s.poiKind[i] === POI_BEACON ? BEACON_RADIUS + 24 : LAIR_RADIUS + 2
    if (x < -reach || y < -reach || x > v.width + reach || y > v.height + reach) continue
    const done = s.poiDone[i]! > 0
    if (s.poiKind[i] === POI_BEACON) {
      if (done) {
        blitAt(v, frameId(v, SPR_POI, POI_FRAME_BEACON_SPENT, 0), x - BEACON_ANCHOR_X, y - BEACON_ANCHOR_Y, 1)
        continue
      }
      const dx = playerX - x
      const dy = playerY - y
      const capturing = dx * dx + dy * dy <= BEACON_RADIUS * BEACON_RADIUS
      const progress = s.poiProgress[i]!
      ctx.globalAlpha = capturing ? 0.16 : 0.07
      ctx.fillStyle = CYAN
      ctx.beginPath()
      ctx.arc(x, y, BEACON_RADIUS, 0, TAU)
      ctx.fill()
      ring(v, x, y, BEACON_RADIUS, 0, TAU, CYAN_DEEP, 1, capturing ? 1 : 0.7)
      if (progress > 0) {
        ring(v, x, y, BEACON_RADIUS - 2, -Math.PI / 2, -Math.PI / 2 + TAU * (progress > 1 ? 1 : progress), CYAN, 3, capturing && blink === 0 ? 1 : 0.65)
      }
      ctx.globalAlpha = 1
      const pulse = capturing ? blink === 0 : (((t / 24) | 0) & 1) === 0
      blitAt(v, frameId(v, SPR_POI, pulse ? POI_FRAME_BEACON_PULSE : POI_FRAME_BEACON, 0), x - BEACON_ANCHOR_X, y - BEACON_ANCHOR_Y, 1)
    } else if (done) {
      blitCentered(v, frameId(v, SPR_POI, POI_FRAME_LAIR_OPEN, 0), x, y)
    } else {
      ring(v, x, y, LAIR_RADIUS, 0, TAU, CORE, 1, (((t / 20) | 0) & 1) === 0 ? 0.35 : 0.2)
      ctx.globalAlpha = 1
      blitCentered(v, frameId(v, SPR_POI, POI_FRAME_LAIR, 0), x, y)
    }
  }
  ctx.globalAlpha = 1
}
