import type { State } from '../sim/state.ts'
import { CHOICE_EVOLVE, CHOICE_PASSIVE, CHOICE_REPAIR, CHOICE_WEAPON, PASSIVE_COUNT, SPAWN_RADIUS, WEAPON_COUNT } from '../sim/content.ts'
import { buildAtlas, ICON_FULL, type Atlas } from './atlas.ts'
import { ICON_EVOLVED_FIRST, ICON_PASSIVE_FIRST, ICON_REPAIR, SPR_ICONS, SPRITE_DEFS } from './sheet.ts'
import { createView } from './view.ts'
import { drawFrame } from './renderer.hot.ts'

export interface Renderer {
  resize(cssWidth: number, cssHeight: number): void
  draw(s: State, alpha: number): void
  drawIcon(target: CanvasRenderingContext2D, choice: number, x: number, y: number, scale: number): void
  setBossNames(names: readonly string[]): void
}

const PIXELS_PER_SCALE_STEP = 96000
const VIEW_RADIUS_LIMIT = SPAWN_RADIUS - 20
const DOM_BUTTON_CLEARANCE = 40

let shared: { atlas: Atlas; image: HTMLCanvasElement } | null = null

function sharedAtlas(): { atlas: Atlas; image: HTMLCanvasElement } {
  if (shared) return shared
  const atlas = buildAtlas(SPRITE_DEFS)
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
  let scale = Math.max(1, Math.round(Math.sqrt((cssWidth * cssHeight) / PIXELS_PER_SCALE_STEP)))
  while (Math.hypot(Math.ceil(cssWidth / scale), Math.ceil(cssHeight / scale)) / 2 >= VIEW_RADIUS_LIMIT) scale++
  return scale
}

export function iconFrame(choice: number): number {
  if (choice === CHOICE_REPAIR) return ICON_REPAIR
  if (choice >= CHOICE_EVOLVE && choice < CHOICE_EVOLVE + WEAPON_COUNT) return ICON_EVOLVED_FIRST + choice - CHOICE_EVOLVE
  if (choice >= CHOICE_PASSIVE && choice < CHOICE_PASSIVE + PASSIVE_COUNT) return ICON_PASSIVE_FIRST + choice - CHOICE_PASSIVE
  if (choice >= CHOICE_WEAPON && choice < CHOICE_WEAPON + WEAPON_COUNT) return choice - CHOICE_WEAPON
  return -1
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
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
      view.scale = scale
      view.clearRight = Math.ceil(DOM_BUTTON_CLEARANCE / scale)
      view.reducedMotion = prefersReducedMotion()
    },
    draw(s, alpha) {
      drawFrame(view, s, alpha)
    },
    setBossNames(names) {
      for (let b = 0; b < view.bossNames.length; b++) view.bossNames[b] = (names[b] ?? '').toUpperCase()
    },
    drawIcon(target, choice, x, y, scale) {
      const frame = iconFrame(choice)
      if (frame < 0) return
      const id = atlas.base[SPR_ICONS]! + frame * atlas.variants[SPR_ICONS]! + ICON_FULL
      const w = atlas.rw[id]!
      const h = atlas.rh[id]!
      target.imageSmoothingEnabled = false
      target.drawImage(image, atlas.rx[id]!, atlas.ry[id]!, w, h, x, y, w * scale, h * scale)
    },
  }
}
