import { TICK_HZ, ZONE_COUNT, ZONE_HANGAR } from '../sim/content.ts'
import { CRYO_THEME, FOUNDRY_THEME, HANGAR_THEME, SCRAPYARD_THEME } from './patterns.ts'
import { parsePattern, STEPS_PER_BAR, VOICE_ARP, VOICE_KICK, VOICE_NOISE, VOICE_P1, VOICE_P2, VOICE_PAD, VOICE_SUB, VOICE_WAVE } from './tracker.ts'
import type { PatternTable } from './tracker.ts'

export const BPM = 140
export const STEP_SECONDS = 60 / BPM / 4
export const BAR_SECONDS = STEP_SECONDS * STEPS_PER_BAR

export const THEME_COUNT = ZONE_COUNT
export const ZONE_THEMES: readonly string[] = [HANGAR_THEME, SCRAPYARD_THEME, CRYO_THEME, FOUNDRY_THEME]
export const THEME_TABLES: readonly PatternTable[] = ZONE_THEMES.map(parsePattern)
export const ZONE_SYNTH_BRIGHTNESS: readonly number[] = [1, 0.75, 1.7, 0.6]
export const MIN_THEME_BARS = 2

export function themeForZone(zone: number): number {
  return zone >= 0 && zone < THEME_COUNT ? zone | 0 : ZONE_HANGAR
}

export const INTENSITY_COUNT = 4
export const INTENSITY_START_TICKS: readonly number[] = [0, 2 * 60 * TICK_HZ, 4 * 60 * TICK_HZ, 6 * 60 * TICK_HZ]

export function intensityForTick(tick: number): number {
  for (let level = INTENSITY_COUNT - 1; level > 0; level--) {
    if (tick >= INTENSITY_START_TICKS[level]!) return level
  }
  return 0
}
export const VOICE_RANGE_LOW: readonly number[] = [45, 45, 36, 60, 24, 40, 24, 55]
export const VOICE_RANGE_HIGH: readonly number[] = [100, 100, 76, 108, 48, 64, 60, 96]

export const NOISE_LONG = 0
export const NOISE_SHORT = 1
export const CHORD_MINOR = 0
export const CHORD_MAJOR = 1

export interface Instrument {
  readonly level: number
  readonly duty: number
  readonly attack: number
  readonly decay: number
  readonly sustain: number
  readonly release: number
  readonly sweep: number
  readonly noise: number
  readonly highpass: number
  readonly chord: number
  readonly bend: number
  readonly ring: number
}

const SILENT: Instrument = { level: 0, duty: 2, attack: 0.005, decay: 0.1, sustain: 0, release: 0.03, sweep: 0, noise: NOISE_LONG, highpass: 0, chord: CHORD_MINOR, bend: 0, ring: 0 }
const instrument = (fields: Partial<Instrument>): Instrument => ({ ...SILENT, ...fields })

export const INSTRUMENTS: readonly Instrument[] = [
  SILENT,
  instrument({ level: 0.11, duty: 2, decay: 0.2, sustain: 0.6, release: 0.06 }),
  instrument({ level: 0.11, duty: 1, decay: 0.2, sustain: 0.6, release: 0.06 }),
  instrument({ level: 0.07, duty: 0, decay: 0.08, sustain: 0, release: 0.03 }),
  instrument({ level: 0.07, duty: 1, decay: 0.2, sustain: 0.6, release: 0.05 }),
  instrument({ level: 0.16, decay: 0.3, sustain: 0.8, release: 0.05 }),
  instrument({ level: 0.16, decay: 0.12, sustain: 0.35, release: 0.04 }),
  instrument({ level: 0.45, decay: 0.22, sustain: 0, release: 0.05, sweep: -24 }),
  instrument({ level: 0.12, decay: 0.12, sustain: 0, release: 0.03, highpass: 1200 }),
  instrument({ level: 0.05, decay: 0.03, sustain: 0, release: 0.02, highpass: 7000 }),
  instrument({ level: 0.05, decay: 0.14, sustain: 0, release: 0.04, highpass: 6000 }),
  instrument({ level: 0.06, decay: 0.9, sustain: 0, release: 0.2, highpass: 4000 }),
  instrument({ level: 0.028, attack: 0.12, decay: 0.6, sustain: 0.8, release: 0.5, chord: CHORD_MINOR }),
  instrument({ level: 0.028, attack: 0.12, decay: 0.6, sustain: 0.8, release: 0.5, chord: CHORD_MAJOR }),
  instrument({ level: 0.18, attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.06 }),
  instrument({ level: 0.045, decay: 0.09, sustain: 0.2, release: 0.05 }),
  instrument({ level: 0.1, duty: 0, attack: 0.002, decay: 0.18, sustain: 0.3, release: 0.06, bend: 2 }),
  instrument({ level: 0.075, duty: 2, attack: 0.002, decay: 0.9, sustain: 0, release: 0.4, ring: 2.76 }),
  instrument({ level: 0.09, decay: 0.12, sustain: 0, release: 0.04, noise: NOISE_SHORT, highpass: 2000 }),
  instrument({ level: 0.11, decay: 0.35, sustain: 0, release: 0.1, noise: NOISE_SHORT, highpass: 500 }),
  instrument({ level: 0.035, attack: 0.015, decay: 0.06, sustain: 0, release: 0.03, highpass: 5000 }),
]

export const INS_SNARE = 8
export const INS_HAT = 9
export const INS_OPEN_HAT = 10
export const INS_CRASH = 11
export const INS_SHORT_BASS = 6
export const INS_METAL = 18
export const INS_ANVIL = 19
export const INS_SHAKER = 20

export interface IntensityLevel {
  readonly voices: number
  readonly instruments: number
  readonly synthLevel: number
  readonly synthCutoff: number
}

const bits = (indices: readonly number[]): number => indices.reduce((mask, index) => mask | (1 << index), 0)
const ALL_INSTRUMENTS = (1 << INSTRUMENTS.length) - 1
const allInstrumentsBut = (muted: readonly number[]): number => ALL_INSTRUMENTS & ~bits(muted)

export const INTENSITY_LEVELS: readonly IntensityLevel[] = [
  {
    voices: bits([VOICE_P1, VOICE_WAVE, VOICE_NOISE]),
    instruments: allInstrumentsBut([INS_SNARE, INS_OPEN_HAT, INS_CRASH, INS_METAL, INS_ANVIL]),
    synthLevel: 0.75,
    synthCutoff: 900,
  },
  {
    voices: bits([VOICE_P1, VOICE_WAVE, VOICE_NOISE, VOICE_KICK, VOICE_PAD]),
    instruments: allInstrumentsBut([INS_OPEN_HAT, INS_CRASH]),
    synthLevel: 0.85,
    synthCutoff: 1500,
  },
  {
    voices: bits([VOICE_P1, VOICE_P2, VOICE_WAVE, VOICE_NOISE, VOICE_KICK, VOICE_PAD, VOICE_SUB]),
    instruments: allInstrumentsBut([INS_CRASH]),
    synthLevel: 0.95,
    synthCutoff: 2600,
  },
  {
    voices: bits([VOICE_P1, VOICE_P2, VOICE_WAVE, VOICE_NOISE, VOICE_KICK, VOICE_PAD, VOICE_SUB, VOICE_ARP]),
    instruments: ALL_INSTRUMENTS,
    synthLevel: 1,
    synthCutoff: 4200,
  },
]

export function levelAllows(level: number, voice: number, instrumentIndex: number): boolean {
  const mask = INTENSITY_LEVELS[level]
  if (!mask) return false
  return ((mask.voices >> voice) & 1) === 1 && ((mask.instruments >> instrumentIndex) & 1) === 1
}

export const TENSION_LEVEL = 0.9
export const TENSION_FADE_IN_SECONDS = 0.4
export const TENSION_FADE_OUT_BARS = 2
export const TENSION_LOW_NOTE = 38
export const TENSION_HAT_NOTE = 96
export const TENSION_HAT_VOLUME = 5

export interface Jingle {
  readonly stepSeconds: number
  readonly lead: readonly number[]
  readonly bass: readonly number[]
  readonly finalSweep: number
}

export const DEFEAT_JINGLE: Jingle = {
  stepSeconds: 0.09,
  lead: [81, 2, 77, 2, 74, 2, 73, 2, 70, 2, 69, 2, 65, 2, 62, 10],
  bass: [50, 8, 46, 8, 38, 12],
  finalSweep: -12,
}

export const VICTORY_JINGLE: Jingle = {
  stepSeconds: 0.08,
  lead: [74, 1, 77, 1, 81, 1, 84, 1, 86, 2, 84, 1, 86, 1, 90, 10],
  bass: [38, 4, 41, 4, 45, 2, 50, 10],
  finalSweep: 0,
}
