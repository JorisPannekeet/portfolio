import { BASS_WAVETABLE, DUTY_STEPS, lfsrSequence, stepWaveCoefficients, WAVE_HARMONICS } from '../../game/audio/waves.ts'
import { EV_COUNT } from '../sim/content.ts'
import { SFX_VARIANT_STRIDE, SFX_VOICES } from './sfx.ts'
import { MIN_THEME_BARS, OPEN_CUTOFF, STEP_SECONDS } from './song.ts'

export const MASTER_LEVEL = 0.8
export const MUSIC_LEVEL = 0.7
export const SFX_LEVEL = 0.9
export const NOISE_CUTOFF = 9000
export const SYNTH_CUTOFF = 1800

export interface AudioRuntime {
  readonly ctx: AudioContext
  readonly master: GainNode
  readonly musicBus: GainNode
  readonly duckFilter: BiquadFilterNode
  readonly duckGain: GainNode
  readonly musicTone: BiquadFilterNode
  readonly chipBus: GainNode
  readonly noiseBus: GainNode
  readonly drumBus: GainNode
  readonly synthBus: GainNode
  readonly delaySend: GainNode
  readonly sfxBus: GainNode
  readonly pulseWaves: readonly PeriodicWave[]
  readonly bassWave: PeriodicWave
  readonly noiseLong: AudioBuffer
  readonly noiseShort: AudioBuffer

  synced: number
  theme: number
  pendingTheme: number
  bar: number
  themeSince: number
  row: number
  nextStepTime: number
  duck: number
  jingleUntil: number

  cursor: number
  lastTick: number
  lastScript: number
  lastLine: number
  pickupStreak: number
  lastPickupTime: number
  readonly lastPlayed: Float64Array

  readonly sfxEnd: Float64Array
  readonly sfxPriority: Uint8Array
  readonly sfxEnv: (GainNode | null)[]
}

function noiseBuffer(ctx: AudioContext, width: 7 | 15): AudioBuffer {
  const sequence = lfsrSequence(width)
  const buffer = ctx.createBuffer(1, sequence.length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < sequence.length; i++) data[i] = sequence[i]!
  return buffer
}

function periodicWave(ctx: AudioContext, levels: readonly number[]): PeriodicWave {
  const { real, imag } = stepWaveCoefficients(levels, WAVE_HARMONICS)
  return ctx.createPeriodicWave(real, imag)
}

function gain(ctx: AudioContext, value: number, destination: AudioNode): GainNode {
  const node = ctx.createGain()
  node.gain.value = value
  node.connect(destination)
  return node
}

function filter(ctx: AudioContext, type: BiquadFilterType, frequency: number, destination: AudioNode): BiquadFilterNode {
  const node = ctx.createBiquadFilter()
  node.type = type
  node.frequency.value = frequency
  node.connect(destination)
  return node
}

export function createRuntime(ctx: AudioContext): AudioRuntime {
  const master = gain(ctx, MASTER_LEVEL, ctx.destination)
  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.value = -16
  compressor.knee.value = 8
  compressor.ratio.value = 4
  compressor.attack.value = 0.004
  compressor.release.value = 0.2
  compressor.connect(master)
  const rumbleCut = filter(ctx, 'highpass', 30, compressor)

  const duckGain = gain(ctx, 1, rumbleCut)
  const duckFilter = filter(ctx, 'lowpass', OPEN_CUTOFF, duckGain)
  const musicTone = filter(ctx, 'lowpass', OPEN_CUTOFF, duckFilter)
  const musicBus = gain(ctx, 0, musicTone)
  const chipBus = gain(ctx, 1, musicBus)
  const noiseTone = filter(ctx, 'lowpass', NOISE_CUTOFF, chipBus)
  const noiseBus = gain(ctx, 1, noiseTone)
  const drumBus = gain(ctx, 1, musicBus)
  const synthTone = filter(ctx, 'lowpass', SYNTH_CUTOFF, musicBus)
  synthTone.Q.value = 0.8
  const synthBus = gain(ctx, 0.9, synthTone)

  const delayReturn = gain(ctx, 0.5, musicBus)
  const delay = ctx.createDelay(1)
  delay.delayTime.value = STEP_SECONDS * 3
  const delayTone = filter(ctx, 'lowpass', 2500, delayReturn)
  delay.connect(delayTone)
  delayTone.connect(gain(ctx, 0.38, delay))
  const delaySend = gain(ctx, 0.25, delay)

  const sfxBus = gain(ctx, SFX_LEVEL, rumbleCut)
  const sfxEnv: (GainNode | null)[] = []
  for (let i = 0; i < SFX_VOICES; i++) sfxEnv.push(null)

  return {
    ctx,
    master,
    musicBus,
    duckFilter,
    duckGain,
    musicTone,
    chipBus,
    noiseBus,
    drumBus,
    synthBus,
    delaySend,
    sfxBus,
    pulseWaves: DUTY_STEPS.map(steps => periodicWave(ctx, steps)),
    bassWave: periodicWave(ctx, BASS_WAVETABLE),
    noiseLong: noiseBuffer(ctx, 15),
    noiseShort: noiseBuffer(ctx, 7),
    synced: 0,
    theme: 0,
    pendingTheme: 0,
    bar: 0,
    themeSince: -MIN_THEME_BARS,
    row: 0,
    nextStepTime: 0,
    duck: 0,
    jingleUntil: 0,
    cursor: 0,
    lastTick: 0,
    lastScript: -1,
    lastLine: 0,
    pickupStreak: 0,
    lastPickupTime: -1000,
    lastPlayed: new Float64Array(EV_COUNT * SFX_VARIANT_STRIDE).fill(-1000),
    sfxEnd: new Float64Array(SFX_VOICES),
    sfxPriority: new Uint8Array(SFX_VOICES),
    sfxEnv,
  }
}
