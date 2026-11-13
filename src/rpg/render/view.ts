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
export const TREE_DEPTH_CAP = 640
export const DEPTH_CAP = MAX_OBJECTS + MAX_ENEMIES + 1 + TREE_DEPTH_CAP
export const DEPTH_ROWS = 1024
export const DEPTH_MARGIN = 96

export const LIGHT_CAP = 96
export const LIGHT_COLS = 512
export const AMB_CAP = 128
export const BIRD_CAP = 6
export const SMOKE_CAP = 8

export const DEPTH_PLAYER = 0
export const DEPTH_ENEMY = 1
export const DEPTH_OBJECT = 2
export const DEPTH_TREE = 3
export const DEPTH_LANDMARK = 4

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
  depthRef: Int32Array
  depthRow: Int16Array
  depthOrder: Int16Array
  depthStart: Int32Array
  night: number
  wind: number
  rain: number
  mist: number
  ash: number
  lightCount: number
  lightX: Float32Array
  lightY: Float32Array
  lightR: Float32Array
  lightColor: Uint8Array
  lightFloor: Uint8Array
  lightLevel: Uint8Array
  ambNext: number
  ambTick: number
  ambKind: Uint8Array
  ambColor: Uint8Array
  ambX: Float32Array
  ambY: Float32Array
  ambVx: Float32Array
  ambVy: Float32Array
  ambBirth: Float64Array
  ambLife: Float32Array
  birdState: Uint8Array
  birdX: Float32Array
  birdY: Float32Array
  birdVx: Float32Array
  birdVy: Float32Array
  birdT: Float64Array
  smokeCount: number
  smokeX: Float32Array
  smokeY: Float32Array
  smokeColor: Uint8Array
  smokeScale: Float32Array
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
    depthRef: new Int32Array(DEPTH_CAP),
    depthRow: new Int16Array(DEPTH_CAP),
    depthOrder: new Int16Array(DEPTH_CAP),
    depthStart: new Int32Array(DEPTH_ROWS + 1),
    night: 0,
    wind: 0,
    rain: 0,
    mist: 0,
    ash: 0,
    lightCount: 0,
    lightX: new Float32Array(LIGHT_CAP),
    lightY: new Float32Array(LIGHT_CAP),
    lightR: new Float32Array(LIGHT_CAP),
    lightColor: new Uint8Array(LIGHT_CAP),
    lightFloor: new Uint8Array(LIGHT_CAP),
    lightLevel: new Uint8Array(LIGHT_COLS),
    ambNext: 0,
    ambTick: -1,
    ambKind: new Uint8Array(AMB_CAP),
    ambColor: new Uint8Array(AMB_CAP),
    ambX: new Float32Array(AMB_CAP),
    ambY: new Float32Array(AMB_CAP),
    ambVx: new Float32Array(AMB_CAP),
    ambVy: new Float32Array(AMB_CAP),
    ambBirth: new Float64Array(AMB_CAP),
    ambLife: new Float32Array(AMB_CAP),
    birdState: new Uint8Array(BIRD_CAP),
    birdX: new Float32Array(BIRD_CAP),
    birdY: new Float32Array(BIRD_CAP),
    birdVx: new Float32Array(BIRD_CAP),
    birdVy: new Float32Array(BIRD_CAP),
    birdT: new Float64Array(BIRD_CAP),
    smokeCount: 0,
    smokeX: new Float32Array(SMOKE_CAP),
    smokeY: new Float32Array(SMOKE_CAP),
    smokeColor: new Uint8Array(SMOKE_CAP),
    smokeScale: new Float32Array(SMOKE_CAP),
  }
}
