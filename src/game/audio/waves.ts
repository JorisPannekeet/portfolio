export const DUTY_STEPS: readonly (readonly number[])[] = [
  [0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 0],
]

export const BASS_WAVETABLE: readonly number[] = [
  0, 2, 4, 6, 8, 10, 12, 14, 15, 15, 15, 14, 13, 12, 11, 10,
  9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0, 0, 1, 1, 0, 0,
]

export const WAVE_HARMONICS = 48

export interface WaveCoefficients {
  readonly real: Float32Array
  readonly imag: Float32Array
}

export function stepWaveCoefficients(levels: readonly number[], harmonics: number): WaveCoefficients {
  const count = levels.length
  let mean = 0
  for (const level of levels) mean += level
  mean /= count
  const real = new Float32Array(harmonics + 1)
  const imag = new Float32Array(harmonics + 1)
  for (let n = 1; n <= harmonics; n++) {
    let a = 0
    let b = 0
    for (let k = 0; k < count; k++) {
      const value = levels[k]! - mean
      const from = (2 * Math.PI * n * k) / count
      const to = (2 * Math.PI * n * (k + 1)) / count
      a += value * (Math.sin(to) - Math.sin(from))
      b += value * (Math.cos(from) - Math.cos(to))
    }
    real[n] = a / (Math.PI * n)
    imag[n] = b / (Math.PI * n)
  }
  return { real, imag }
}

export function lfsrSequence(width: 7 | 15): Int8Array {
  const period = width === 15 ? 32767 : 127
  const out = new Int8Array(period)
  let register = 0x7fff
  for (let i = 0; i < period; i++) {
    const bit = (register ^ (register >> 1)) & 1
    register = (register >> 1) | (bit << 14)
    if (width === 7) register = (register & ~0x40) | (bit << 6)
    out[i] = register & 1 ? -1 : 1
  }
  return out
}
