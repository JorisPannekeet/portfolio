import type { View } from './view.ts'
import { SPR_FONT, FONT_ADVANCE } from './sheet.ts'

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
  const w = a.rw[id]!
  const h = a.rh[id]!
  v.ctx.drawImage(v.image, a.rx[id]!, a.ry[id]!, w, h, x - (w >> 1), y - (h >> 1), w, h)
}

export function digitCount(n: number, minDigits: number): number {
  let count = 1
  let rest = Math.floor(n / 10)
  while (rest > 0) {
    count++
    rest = Math.floor(rest / 10)
  }
  return count < minDigits ? minDigits : count
}

export function numberWidth(n: number, minDigits: number, k: number): number {
  return (digitCount(n, minDigits) * FONT_ADVANCE - 1) * k
}

export function drawGlyph(v: View, glyph: number, tint: number, x: number, y: number, k: number): void {
  blitAt(v, frameId(v, SPR_FONT, glyph, tint), x, y, k)
}

export function drawChar(v: View, code: number, tint: number, x: number, y: number, k: number): void {
  const glyph = v.glyphIndex[code & 127]!
  if (glyph >= 0) drawGlyph(v, glyph, tint, x, y, k)
}

export function drawNumber(v: View, n: number, minDigits: number, tint: number, x: number, y: number, k: number): number {
  let value = Math.max(0, Math.floor(n))
  const count = digitCount(value, minDigits)
  for (let i = count - 1; i >= 0; i--) {
    v.digits[i] = value % 10
    value = Math.floor(value / 10)
  }
  let cursor = x
  for (let i = 0; i < count; i++) {
    drawGlyph(v, v.digits[i]!, tint, cursor, y, k)
    cursor += FONT_ADVANCE * k
  }
  return cursor
}
