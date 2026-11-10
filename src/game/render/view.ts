import type { Atlas } from './atlas.ts'
import { fontGlyphs } from '../sprites/font.ts'
import { MAX_DRONES, MAX_ENEMIES, MAX_PROPS } from '../sim/content.ts'

export const FX_CAP = 384
export const FX_NONE = 0
export const FX_SLASH = 1
export const FX_BLAST = 2
export const FX_PULSE = 3
export const FX_SPARK = 4
export const FX_DEBRIS = 5
export const FX_NUMBER = 6
export const FX_GLINT = 7
export const FX_LEVEL_RING = 8
export const FX_BEACON_ICON = 9
export const FX_BEACON_RING = 10

export const DIGIT_BUFFER = 12
export const DEPTH_CAP = MAX_PROPS + MAX_ENEMIES + MAX_DRONES + 1
export const DEPTH_ROWS = 2048
export const DEPTH_MARGIN = 160

export interface View {
  ctx: CanvasRenderingContext2D
  atlas: Atlas
  image: CanvasImageSource
  width: number
  height: number
  scale: number
  clearRight: number
  reducedMotion: boolean
  rng: number
  eventCursor: number
  lastTick: number
  shakeUntil: number
  flashUntil: number
  flashStart: number
  flashColor: string
  sweepStart: number
  sweepUntil: number
  sweepColor: string
  hudTop: number
  hudBottom: number
  mapLeft: number
  mapBottom: number
  originX: number
  originY: number
  numbersThisFrame: number
  sparksThisFrame: number
  debrisThisFrame: number
  activeNumbers: number
  fxNext: number
  fxKind: Uint8Array
  fxFrame: Uint8Array
  fxX: Float32Array
  fxY: Float32Array
  fxVx: Float32Array
  fxVy: Float32Array
  fxA: Float32Array
  fxB: Float32Array
  fxBirth: Float64Array
  fxLife: Float32Array
  glyphIndex: Int8Array
  digits: Uint8Array
  depthCount: number
  depthId: Int32Array
  depthX: Int16Array
  depthY: Int16Array
  depthRow: Int16Array
  depthOrder: Int16Array
  depthStart: Int32Array
}

export function createView(ctx: CanvasRenderingContext2D, atlas: Atlas, image: CanvasImageSource): View {
  const glyphIndex = new Int8Array(128).fill(-1)
  for (let i = 0; i < fontGlyphs.length; i++) glyphIndex[fontGlyphs.charCodeAt(i)] = i
  return {
    ctx,
    atlas,
    image,
    width: 1,
    height: 1,
    scale: 1,
    clearRight: 40,
    reducedMotion: false,
    rng: 0x9e3779b9,
    eventCursor: 0,
    lastTick: 0,
    shakeUntil: 0,
    flashUntil: 0,
    flashStart: 0,
    flashColor: '#F4F5F7',
    sweepStart: 0,
    sweepUntil: 0,
    sweepColor: '#F4F5F7',
    hudTop: 0,
    hudBottom: 1,
    mapLeft: 0,
    mapBottom: 0,
    originX: 0,
    originY: 0,
    numbersThisFrame: 0,
    sparksThisFrame: 0,
    debrisThisFrame: 0,
    activeNumbers: 0,
    fxNext: 0,
    fxKind: new Uint8Array(FX_CAP),
    fxFrame: new Uint8Array(FX_CAP),
    fxX: new Float32Array(FX_CAP),
    fxY: new Float32Array(FX_CAP),
    fxVx: new Float32Array(FX_CAP),
    fxVy: new Float32Array(FX_CAP),
    fxA: new Float32Array(FX_CAP),
    fxB: new Float32Array(FX_CAP),
    fxBirth: new Float64Array(FX_CAP),
    fxLife: new Float32Array(FX_CAP),
    glyphIndex,
    digits: new Uint8Array(DIGIT_BUFFER),
    depthCount: 0,
    depthId: new Int32Array(DEPTH_CAP),
    depthX: new Int16Array(DEPTH_CAP),
    depthY: new Int16Array(DEPTH_CAP),
    depthRow: new Int16Array(DEPTH_CAP),
    depthOrder: new Int16Array(DEPTH_CAP),
    depthStart: new Int32Array(DEPTH_ROWS + 1),
  }
}
