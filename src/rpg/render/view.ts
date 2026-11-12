import type { Atlas } from '../../game/render/atlas.ts'
import { MAX_ENEMIES, MAX_OBJECTS } from '../sim/content.ts'

export const FX_CAP = 320
export const FX_NONE = 0
export const FX_ARC = 1
export const FX_RING = 2
export const FX_DISC = 3
export const FX_SPARK = 4
export const FX_PUFF = 5
export const FX_GLINT = 6
export const FX_NUMBER = 7
export const FX_PARTICLE = 8
export const FX_PROP = 9

export const DIGIT_BUFFER = 12
export const DEPTH_CAP = MAX_OBJECTS + MAX_ENEMIES + 1
export const DEPTH_ROWS = 1024
export const DEPTH_MARGIN = 96

export const DEPTH_PLAYER = 0
export const DEPTH_ENEMY = 1
export const DEPTH_OBJECT = 2

export interface View {
  ctx: CanvasRenderingContext2D
  atlas: Atlas
  image: CanvasImageSource
  width: number
  height: number
  scale: number
  clearRight: number
  clearTop: number
  clearBottom: number
  hudTop: number
  bossBarY: number
  textBottom: number
  skillReadyAt: number
  reducedMotion: boolean
  rng: number
  eventCursor: number
  lastTick: number
  shakeUntil: number
  shakePower: number
  flashUntil: number
  flashStart: number
  flashColor: number
  flashStrength: number
  originX: number
  originY: number
  playerX: number
  playerY: number
  numbersThisFrame: number
  fxNext: number
  fxKind: Uint8Array
  fxColor: Uint8Array
  fxX: Float32Array
  fxY: Float32Array
  fxVx: Float32Array
  fxVy: Float32Array
  fxA: Float32Array
  fxB: Float32Array
  fxBirth: Float64Array
  fxLife: Float32Array
  digits: Uint8Array
  depthCount: number
  depthKind: Uint8Array
  depthRef: Int16Array
  depthRow: Int16Array
  depthOrder: Int16Array
  depthStart: Int32Array
}

export function createView(ctx: CanvasRenderingContext2D, atlas: Atlas, image: CanvasImageSource): View {
  return {
    ctx,
    atlas,
    image,
    width: 1,
    height: 1,
    scale: 1,
    clearRight: 100,
    clearTop: 24,
    clearBottom: 0,
    hudTop: 28,
    bossBarY: 40,
    textBottom: 44,
    skillReadyAt: -1,
    reducedMotion: false,
    rng: 0x9e3779b9,
    eventCursor: 0,
    lastTick: 0,
    shakeUntil: 0,
    shakePower: 0,
    flashUntil: 0,
    flashStart: 0,
    flashColor: 0,
    flashStrength: 0,
    originX: 0,
    originY: 0,
    playerX: 0,
    playerY: 0,
    numbersThisFrame: 0,
    fxNext: 0,
    fxKind: new Uint8Array(FX_CAP),
    fxColor: new Uint8Array(FX_CAP),
    fxX: new Float32Array(FX_CAP),
    fxY: new Float32Array(FX_CAP),
    fxVx: new Float32Array(FX_CAP),
    fxVy: new Float32Array(FX_CAP),
    fxA: new Float32Array(FX_CAP),
    fxB: new Float32Array(FX_CAP),
    fxBirth: new Float64Array(FX_CAP),
    fxLife: new Float32Array(FX_CAP),
    digits: new Uint8Array(DIGIT_BUFFER),
    depthCount: 0,
    depthKind: new Uint8Array(DEPTH_CAP),
    depthRef: new Int16Array(DEPTH_CAP),
    depthRow: new Int16Array(DEPTH_CAP),
    depthOrder: new Int16Array(DEPTH_CAP),
    depthStart: new Int32Array(DEPTH_ROWS + 1),
  }
}
