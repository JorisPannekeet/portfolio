import type { State } from '../sim/state.ts'
import { AREA_COUNT, CH_EMBER, DAY_TICKS, NIGHT_START_TICKS } from '../sim/content.ts'
import type { View } from './view.ts'
import { AREA_CORRUPTIBLE, AREA_DUNGEON, AREA_OUTDOOR } from './sheet.ts'
import { C_CORRUPT, C_EMBER, C_INK, C_NIGHT, C_RUST, HEX } from './colors.ts'

const TWILIGHT = 40 * 60
const NIGHT_ALPHA = 0.5
const FADE_TICKS = 24
const VIGNETTE_STEPS = 5
const VIGNETTE_ALPHA = 0.08

export function nightAmount(clock: number): number {
  const c = ((clock % DAY_TICKS) + DAY_TICKS) % DAY_TICKS
  if (c < NIGHT_START_TICKS) return 0
  const into = (c - NIGHT_START_TICKS) / TWILIGHT
  const left = (DAY_TICKS - c) / TWILIGHT
  const amount = into < left ? into : left
  return amount > 1 ? 1 : amount
}

function duskAmount(clock: number): number {
  const c = ((clock % DAY_TICKS) + DAY_TICKS) % DAY_TICKS
  const d = Math.abs(c - NIGHT_START_TICKS)
  const dawn = c < TWILIGHT ? c : DAY_TICKS - c
  const near = d < dawn ? d : dawn
  return near < TWILIGHT ? 1 - near / TWILIGHT : 0
}

function tint(v: View, color: number, alpha: number): void {
  if (alpha <= 0) return
  v.ctx.globalAlpha = alpha
  v.ctx.fillStyle = HEX[color]!
  v.ctx.fillRect(0, 0, v.width, v.height)
}

function vignette(v: View, strength: number): void {
  const ctx = v.ctx
  const band = Math.max(2, Math.round(Math.min(v.width, v.height) / 22))
  ctx.fillStyle = HEX[C_INK]!
  ctx.globalAlpha = VIGNETTE_ALPHA * strength
  for (let k = 0; k < VIGNETTE_STEPS; k++) {
    const d = band * (VIGNETTE_STEPS - k)
    ctx.fillRect(0, 0, v.width, d)
    ctx.fillRect(0, v.height - d, v.width, d)
    ctx.fillRect(0, d, d, v.height - d * 2)
    ctx.fillRect(v.width - d, d, d, v.height - d * 2)
  }
}

export function drawLighting(v: View, s: State): void {
  const area = s.area >= 0 && s.area < AREA_COUNT ? s.area : 0
  const vigil = s.chapter >= CH_EMBER && AREA_OUTDOOR[area]! !== 0
  let night = 0
  if (AREA_OUTDOOR[area]! !== 0) {
    night = nightAmount(s.clock)
    tint(v, C_EMBER, duskAmount(s.clock) * 0.1)
    tint(v, C_NIGHT, night * NIGHT_ALPHA)
  }
  if (vigil) {
    tint(v, C_RUST, 0.14)
    tint(v, C_NIGHT, 0.12)
  }
  if (AREA_CORRUPTIBLE[area]! !== 0 && s.areaVariant === 1) tint(v, C_CORRUPT, 0.16)
  if (AREA_DUNGEON[area]! !== 0) vignette(v, 1.4)
  else if (night > 0 || vigil) vignette(v, night + (vigil ? 0.5 : 0))
  if (s.areaTick < FADE_TICKS) tint(v, C_INK, 1 - s.areaTick / FADE_TICKS)
  v.ctx.globalAlpha = 1
}
