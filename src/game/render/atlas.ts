import { PALETTE_HEX, PALETTE_KEYS, TRANSPARENT_KEY, paletteIndex, paletteRgba } from './palette.ts'

export const KIND_PLAIN = 0
export const KIND_ACTOR = 1
export const KIND_ROTATED = 2
export const KIND_GLYPH = 3
export const KIND_ICON = 4

export const ICON_FULL = 0
export const ICON_MINI = 1

export const VARIANT_NORMAL = 0
export const VARIANT_FLIP = 1
export const VARIANT_WHITE = 2
export const VARIANT_WHITE_FLIP = 3

export const GLYPH_LIGHT = 0
export const GLYPH_DARK = 1
export const GLYPH_RED = 2
export const GLYPH_AMBER = 3
export const GLYPH_GREEN = 4

export const ROTATIONS = 16

export interface SpriteDef {
  readonly name: string
  readonly kind: number
  readonly frames: readonly (readonly string[])[]
}

export interface Atlas {
  readonly width: number
  readonly height: number
  readonly pixels: Uint8Array
  readonly base: Uint16Array
  readonly variants: Uint8Array
  readonly rx: Uint16Array
  readonly ry: Uint16Array
  readonly rw: Uint16Array
  readonly rh: Uint16Array
}

interface Bitmap {
  readonly w: number
  readonly h: number
  readonly data: Uint8Array
}

const FLASH_KEY = 'W'
const GLYPH_TINT_KEYS = ['', '0', 'R', 'A', 'G']

export function variantCount(kind: number): number {
  if (kind === KIND_ACTOR) return 4
  if (kind === KIND_GLYPH) return GLYPH_TINT_KEYS.length
  if (kind === KIND_ROTATED) return ROTATIONS
  if (kind === KIND_ICON) return 2
  return 1
}

export function rasterise(name: string, rows: readonly string[], rgba: Uint8Array, tintKey: string, flip: boolean): Bitmap {
  const h = rows.length
  const w = rows[0]?.length ?? 0
  if (w === 0) throw new Error(`${name}: empty sprite`)
  const tint = tintKey === '' ? -1 : paletteIndex(tintKey)
  const data = new Uint8Array(w * h * 4)
  for (let y = 0; y < h; y++) {
    const row = rows[y]!
    if (row.length !== w) throw new Error(`${name}: row ${y} is ${row.length} wide, expected ${w}`)
    for (let x = 0; x < w; x++) {
      const key = row[flip ? w - 1 - x : x]!
      if (key === TRANSPARENT_KEY) continue
      const index = paletteIndex(key)
      if (index < 0) throw new Error(`${name}: unknown palette key '${key}' at ${x},${y}`)
      const source = (tint < 0 ? index : tint) * 4
      const target = (y * w + x) * 4
      data[target] = rgba[source]!
      data[target + 1] = rgba[source + 1]!
      data[target + 2] = rgba[source + 2]!
      data[target + 3] = 255
    }
  }
  return { w, h, data }
}

const ICON_QUIET_KEYS = '.02'

export function miniRows(rows: readonly string[]): string[] {
  const out: string[] = []
  for (let y = 0; y + 1 < rows.length; y += 2) {
    let row = ''
    for (let x = 0; x + 1 < rows[y]!.length; x += 2) {
      const block = rows[y]![x]! + rows[y]![x + 1]! + rows[y + 1]![x]! + rows[y + 1]![x + 1]!
      row += salientKey(block)
    }
    out.push(row)
  }
  return out
}

function salientKey(block: string): string {
  let best = ''
  let bestCount = 0
  for (const pass of [0, 1]) {
    for (const key of block) {
      if (key === TRANSPARENT_KEY || (pass === 0 && ICON_QUIET_KEYS.includes(key))) continue
      let count = 0
      for (const other of block) if (other === key) count++
      if (count > bestCount) {
        best = key
        bestCount = count
      }
    }
    if (best !== '') return best
  }
  return TRANSPARENT_KEY
}

export function rotate(source: Bitmap, angle: number): Bitmap {
  const size = Math.ceil(Math.hypot(source.w, source.h)) | 1
  const data = new Uint8Array(size * size * 4)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const half = size / 2
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - half
      const dy = y + 0.5 - half
      const sx = Math.floor(cos * dx + sin * dy + source.w / 2)
      const sy = Math.floor(-sin * dx + cos * dy + source.h / 2)
      if (sx < 0 || sy < 0 || sx >= source.w || sy >= source.h) continue
      const from = (sy * source.w + sx) * 4
      const to = (y * size + x) * 4
      for (let c = 0; c < 4; c++) data[to + c] = source.data[from + c]!
    }
  }
  return { w: size, h: size, data }
}

function framesFor(def: SpriteDef, rgba: Uint8Array): Bitmap[] {
  const out: Bitmap[] = []
  for (const rows of def.frames) {
    if (def.kind === KIND_ACTOR) {
      out.push(rasterise(def.name, rows, rgba, '', false))
      out.push(rasterise(def.name, rows, rgba, '', true))
      out.push(rasterise(def.name, rows, rgba, FLASH_KEY, false))
      out.push(rasterise(def.name, rows, rgba, FLASH_KEY, true))
    } else if (def.kind === KIND_GLYPH) {
      for (const tint of GLYPH_TINT_KEYS) out.push(rasterise(def.name, rows, rgba, tint, false))
    } else if (def.kind === KIND_ICON) {
      out.push(rasterise(def.name, rows, rgba, '', false))
      out.push(rasterise(def.name, miniRows(rows), rgba, '', false))
    } else if (def.kind === KIND_ROTATED) {
      const upright = rasterise(def.name, rows, rgba, '', false)
      for (let r = 0; r < ROTATIONS; r++) out.push(rotate(upright, (r * Math.PI * 2) / ROTATIONS))
    } else {
      out.push(rasterise(def.name, rows, rgba, '', false))
    }
  }
  return out
}

export function buildAtlas(defs: readonly SpriteDef[], width = 512): Atlas {
  const rgba = paletteRgba()
  if (PALETTE_KEYS.length > 64) throw new Error('palette exceeds 64 colours')
  if (PALETTE_KEYS.length !== PALETTE_HEX.length) throw new Error('palette keys and colours differ in length')
  const bitmaps: Bitmap[] = []
  const base = new Uint16Array(defs.length)
  const variants = new Uint8Array(defs.length)
  for (let i = 0; i < defs.length; i++) {
    const def = defs[i]!
    base[i] = bitmaps.length
    variants[i] = variantCount(def.kind)
    bitmaps.push(...framesFor(def, rgba))
  }
  const count = bitmaps.length
  const rx = new Uint16Array(count)
  const ry = new Uint16Array(count)
  const rw = new Uint16Array(count)
  const rh = new Uint16Array(count)
  const order = bitmaps.map((_, i) => i).sort((a, b) => bitmaps[b]!.h - bitmaps[a]!.h || a - b)
  let x = 1
  let y = 1
  let shelf = 0
  for (const i of order) {
    const bitmap = bitmaps[i]!
    if (bitmap.w + 2 > width) throw new Error(`${bitmap.w}px frame does not fit a ${width}px atlas`)
    if (x + bitmap.w + 1 > width) {
      x = 1
      y += shelf + 1
      shelf = 0
    }
    rx[i] = x
    ry[i] = y
    rw[i] = bitmap.w
    rh[i] = bitmap.h
    x += bitmap.w + 1
    shelf = Math.max(shelf, bitmap.h)
  }
  const height = y + shelf + 1
  const pixels = new Uint8Array(width * height * 4)
  for (let i = 0; i < count; i++) {
    const bitmap = bitmaps[i]!
    for (let row = 0; row < bitmap.h; row++) {
      pixels.set(bitmap.data.subarray(row * bitmap.w * 4, (row + 1) * bitmap.w * 4), ((ry[i]! + row) * width + rx[i]!) * 4)
    }
  }
  return { width, height, pixels, base, variants, rx, ry, rw, rh }
}
