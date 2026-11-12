import type { View } from './view.ts'
import { FONT_ADVANCE, SPR_DIGITS } from './sheet.ts'
import { HEX } from './colors.ts'

const TAU = Math.PI * 2

export function frameId(v: View, sprite: number, frame: number, variant: number): number {
  return v.atlas.base[sprite]! + frame * v.atlas.variants[sprite]! + variant
}

export function blitAt(v: View, id: number, x: number, y: number, k: number): void {
  const a = v.atlas
  const w = a.rw[id]!
  const h = a.rh[id]!
  v.ctx.drawImage(v.image, a.rx[id]!, a.ry[id]!, w, h, x, y, w * k, h * k)
}

export function blitCentered(v: View, id: number, x: number, y: number): void {
  const a = v.atlas
  v.ctx.drawImage(v.image, a.rx[id]!, a.ry[id]!, a.rw[id]!, a.rh[id]!, x - (a.rw[id]! >> 1), y - (a.rh[id]! >> 1), a.rw[id]!, a.rh[id]!)
}

export function blitFoot(v: View, id: number, x: number, y: number): void {
  const a = v.atlas
  v.ctx.drawImage(v.image, a.rx[id]!, a.ry[id]!, a.rw[id]!, a.rh[id]!, x - (a.rw[id]! >> 1), y - a.rh[id]!, a.rw[id]!, a.rh[id]!)
}

export function rect(v: View, color: number, x: number, y: number, w: number, h: number): void {
  v.ctx.fillStyle = HEX[color]!
  v.ctx.fillRect(x, y, w, h)
}

export function ring(v: View, x: number, y: number, rx: number, ry: number, color: number, width: number, alpha: number): void {
  const ctx = v.ctx
  ctx.globalAlpha = alpha
  ctx.beginPath()
  ctx.ellipse(x, y, rx < 1 ? 1 : rx, ry < 1 ? 1 : ry, 0, 0, TAU)
  ctx.strokeStyle = HEX[color]!
  ctx.lineWidth = width
  ctx.stroke()
}

export function disc(v: View, x: number, y: number, rx: number, ry: number, color: number, alpha: number): void {
  const ctx = v.ctx
  ctx.globalAlpha = alpha
  ctx.beginPath()
  ctx.ellipse(x, y, rx < 1 ? 1 : rx, ry < 1 ? 1 : ry, 0, 0, TAU)
  ctx.fillStyle = HEX[color]!
  ctx.fill()
}

export function digitCount(n: number): number {
  let count = 1
  let rest = Math.floor(n / 10)
  while (rest > 0) {
    count++
    rest = Math.floor(rest / 10)
  }
  return count
}

export function drawNumber(v: View, n: number, tint: number, x: number, y: number, k: number): void {
  let value = n < 0 ? 0 : Math.floor(n)
  const count = digitCount(value)
  for (let i = count - 1; i >= 0; i--) {
    v.digits[i] = value % 10
    value = Math.floor(value / 10)
  }
  let cursor = x
  for (let i = 0; i < count; i++) {
    blitAt(v, frameId(v, SPR_DIGITS, v.digits[i]!, tint), cursor, y, k)
    cursor += FONT_ADVANCE * k
  }
}

export function numberWidth(n: number, k: number): number {
  return (digitCount(n < 0 ? 0 : Math.floor(n)) * FONT_ADVANCE - 1) * k
}

export function rotationIndex(dx: number, dy: number): number {
  return Math.round((Math.atan2(dy, dx) * 16) / TAU) & 15
}
