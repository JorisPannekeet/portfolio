import type { State } from '../sim/state.ts'
import { ELEMENT_COUNT, ITEM_BASE_COUNT, TIER_COUNT } from '../sim/content.ts'
import { buildAtlas, type Atlas } from '../../game/render/atlas.ts'
import { RPG_PALETTE } from './palette.ts'
import { ELEMENT_ICON_FIRST, ITEM_ICON, SPR_ICONS, SPRITE_DEFS } from './sheet.ts'
import { createView, type View } from './view.ts'
import { drawFrame } from './renderer.hot.ts'
import { HEX, C_INK, TIER_COLOR } from './colors.ts'

export interface Renderer {
  resize(cssWidth: number, cssHeight: number): void
  draw(s: State, alpha: number): void
  drawItemIcon(target: CanvasRenderingContext2D, base: number, tier: number, x: number, y: number, scale: number): void
  drawElementIcon(target: CanvasRenderingContext2D, element: number, x: number, y: number, scale: number): void
}

export const ATLAS_WIDTH = 1024
const TARGET_VIEW_AREA = 352 * 224
const SMALL_FIELD = 300
const MAX_SCALE = 5
const BAND_EDGE = 8
const BOSS_BAR_BELOW_TOP = 26
const TEXT_STRIP = 40

let shared: { atlas: Atlas; image: HTMLCanvasElement } | null = null

export function rpgAtlas(): Atlas {
  return buildAtlas(SPRITE_DEFS, ATLAS_WIDTH, RPG_PALETTE)
}

function sharedAtlas(): { atlas: Atlas; image: HTMLCanvasElement } {
  if (shared) return shared
  const atlas = rpgAtlas()
  const image = document.createElement('canvas')
  image.width = atlas.width
  image.height = atlas.height
  const ctx = image.getContext('2d')
  if (!ctx) throw new Error('2D canvas unavailable')
  const bytes = new Uint8ClampedArray(atlas.pixels.buffer, atlas.pixels.byteOffset, atlas.pixels.byteLength)
  ctx.putImageData(new ImageData(bytes, atlas.width, atlas.height), 0, 0)
  shared = { atlas, image }
  return shared
}

export function pickScale(cssWidth: number, cssHeight: number): number {
  return Math.min(MAX_SCALE, Math.max(1, Math.round(Math.sqrt((cssWidth * cssHeight) / TARGET_VIEW_AREA))))
}

export function itemIconFrame(base: number): number {
  return base >= 0 && base < ITEM_BASE_COUNT ? ITEM_ICON[base]! : -1
}

export function elementIconFrame(element: number): number {
  return element >= 0 && element < ELEMENT_COUNT ? ELEMENT_ICON_FIRST + element : -1
}

function clamp(value: number, low: number, high: number): number {
  return value < low ? low : value > high ? high : value
}

export function layoutView(v: View, cssWidth: number, cssHeight: number, scale: number, touch: boolean): void {
  const small = cssWidth <= SMALL_FIELD || cssHeight <= SMALL_FIELD
  const short = Math.min(cssWidth, cssHeight)
  const top = small ? 40 : clamp(short * 0.12, 56, 80)
  const button = small ? 32 : 44
  const gap = small ? 4 : 6
  v.scale = scale
  v.clearRight = Math.ceil((BAND_EDGE * 2 + button * 3 + gap * 2) / scale)
  v.clearTop = Math.ceil((BAND_EDGE + button) / scale)
  v.hudTop = Math.floor(top / scale)
  v.bossBarY = Math.round((top + BOSS_BAR_BELOW_TOP) / scale)
  v.textBottom = Math.ceil((top + TEXT_STRIP) / scale)
  const unit = clamp(short * 0.105, 30, 54)
  const unitGap = clamp(short * 0.012, 4, 8)
  v.clearBottom = touch ? Math.ceil((16 + unit * 3 + unitGap * 3) / scale) : 0
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

function coarsePointer(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
}

function blitIcon(target: CanvasRenderingContext2D, atlas: Atlas, image: CanvasImageSource, frame: number, x: number, y: number, scale: number): void {
  const id = atlas.base[SPR_ICONS]! + frame
  const w = atlas.rw[id]!
  const h = atlas.rh[id]!
  target.imageSmoothingEnabled = false
  target.drawImage(image, atlas.rx[id]!, atlas.ry[id]!, w, h, x, y, w * scale, h * scale)
}

export function createRenderer(canvas: HTMLCanvasElement): Renderer {
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('2D canvas unavailable')
  const { atlas, image } = sharedAtlas()
  const view = createView(ctx, atlas, image)
  canvas.style.imageRendering = 'pixelated'

  return {
    resize(cssWidth, cssHeight) {
      const w = Math.max(1, cssWidth)
      const h = Math.max(1, cssHeight)
      const scale = pickScale(w, h)
      canvas.width = Math.ceil(w / scale)
      canvas.height = Math.ceil(h / scale)
      ctx.imageSmoothingEnabled = false
      view.width = canvas.width
      view.height = canvas.height
      layoutView(view, w, h, scale, coarsePointer())
      view.reducedMotion = prefersReducedMotion()
    },
    draw(s, alpha) {
      drawFrame(view, s, alpha)
    },
    drawItemIcon(target, base, tier, x, y, scale) {
      const frame = itemIconFrame(base)
      if (frame < 0) return
      const size = atlas.rw[atlas.base[SPR_ICONS]! + frame]!
      const t = tier < 0 ? 0 : tier >= TIER_COUNT ? TIER_COUNT - 1 : tier
      target.fillStyle = HEX[C_INK]!
      target.fillRect(x, y, (size + 2) * scale, (size + 2) * scale)
      target.fillStyle = HEX[TIER_COLOR[t]!]!
      target.fillRect(x + scale, y + scale, size * scale, size * scale)
      target.fillStyle = HEX[C_INK]!
      target.fillRect(x + 2 * scale, y + 2 * scale, (size - 2) * scale, (size - 2) * scale)
      blitIcon(target, atlas, image, frame, x + scale, y + scale, scale)
    },
    drawElementIcon(target, element, x, y, scale) {
      const frame = elementIconFrame(element)
      if (frame >= 0) blitIcon(target, atlas, image, frame, x, y, scale)
    },
  }
}
