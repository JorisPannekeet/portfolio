export interface RngState {
  seed: number
  rngA: number
  rngB: number
  rngC: number
  rngD: number
}

const UINT32_RANGE = 4294967296
const WARMUP_ROUNDS = 15

export function rngNext(s: RngState): number {
  const a = s.rngA
  const b = s.rngB
  const c = s.rngC
  const d = s.rngD
  const t = (((a + b) | 0) + d) | 0
  s.rngD = (d + 1) | 0
  s.rngA = b ^ (b >>> 9)
  s.rngB = (c + (c << 3)) | 0
  s.rngC = (((c << 21) | (c >>> 11)) + t) | 0
  return t >>> 0
}

export function rngFloat(s: RngState): number {
  return rngNext(s) / UINT32_RANGE
}

export function rngInt(s: RngState, n: number): number {
  return Math.floor(rngFloat(s) * n)
}

export function seedRng(s: RngState): void {
  s.rngA = 0x9e3779b9 | 0
  s.rngB = 0x243f6a88 | 0
  s.rngC = 0xb7e15162 | 0
  s.rngD = s.seed | 0
  for (let i = 0; i < WARMUP_ROUNDS; i++) rngNext(s)
}
