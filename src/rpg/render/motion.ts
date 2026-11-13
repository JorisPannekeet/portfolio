
export const TRAIL_CAP = 6
export const CORPSE_CAP = 16

export interface Motion {
  cursor: number
  lastTick: number
  hitAt: number
  hurtAt: number
  movingSince: number
  wasMoving: boolean
  trailNext: number
  trailX: Float32Array
  trailY: Float32Array
  trailFrame: Uint16Array
  trailVariant: Uint8Array
  trailTick: Float64Array
  corpseNext: number
  corpseKind: Int16Array
  corpseElite: Uint8Array
  corpseFlip: Uint8Array
  corpseX: Float32Array
  corpseY: Float32Array
  corpseBorn: Float64Array
  hpShown: number
  hpLag: number
  hpLagAt: number
}

export const motion: Motion = {
  cursor: 0,
  lastTick: 0,
  hitAt: -1e9,
  hurtAt: -1e9,
  movingSince: 0,
  wasMoving: false,
  trailNext: 0,
  trailX: new Float32Array(TRAIL_CAP),
  trailY: new Float32Array(TRAIL_CAP),
  trailFrame: new Uint16Array(TRAIL_CAP),
  trailVariant: new Uint8Array(TRAIL_CAP),
  trailTick: new Float64Array(TRAIL_CAP).fill(-1e9),
  corpseNext: 0,
  corpseKind: new Int16Array(CORPSE_CAP).fill(-1),
  corpseElite: new Uint8Array(CORPSE_CAP),
  corpseFlip: new Uint8Array(CORPSE_CAP),
  corpseX: new Float32Array(CORPSE_CAP),
  corpseY: new Float32Array(CORPSE_CAP),
  corpseBorn: new Float64Array(CORPSE_CAP),
  hpShown: -1,
  hpLag: 0,
  hpLagAt: 0,
}
