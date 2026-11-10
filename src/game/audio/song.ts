import { TICK_HZ } from '../sim/content.ts'
import { ASSAULT_PATTERN, CONTACT_PATTERN, LAST_STAND_PATTERN, PATROL_PATTERN } from './patterns.ts'
import { parsePattern, STEPS_PER_BAR } from './tracker.ts'
import type { PatternTable } from './tracker.ts'

export const BPM = 140
export const STEP_SECONDS = 60 / BPM / 4
export const BAR_SECONDS = STEP_SECONDS * STEPS_PER_BAR

export const SECTION_PATROL = 0
export const SECTION_CONTACT = 1
export const SECTION_ASSAULT = 2
export const SECTION_LAST_STAND = 3
export const SECTION_COUNT = 4

export const SECTION_START_TICKS: readonly number[] = [0, 2 * 60 * TICK_HZ, 4 * 60 * TICK_HZ, 6 * 60 * TICK_HZ]
export const SECTION_SYNTH_LEVEL: readonly number[] = [0.75, 0.9, 1, 1]
export const SECTION_SYNTH_CUTOFF: readonly number[] = [900, 1600, 2600, 4200]
export const SECTION_PATTERNS: readonly string[] = [PATROL_PATTERN, CONTACT_PATTERN, ASSAULT_PATTERN, LAST_STAND_PATTERN]
export const SECTION_TABLES: readonly PatternTable[] = SECTION_PATTERNS.map(parsePattern)

export function sectionForTick(tick: number): number {
  for (let section = SECTION_COUNT - 1; section > 0; section--) {
    if (tick >= SECTION_START_TICKS[section]!) return section
  }
  return SECTION_PATROL
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
}

const SILENT: Instrument = { level: 0, duty: 2, attack: 0.005, decay: 0.1, sustain: 0, release: 0.03, sweep: 0, noise: NOISE_LONG, highpass: 0, chord: CHORD_MINOR }
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
]

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
