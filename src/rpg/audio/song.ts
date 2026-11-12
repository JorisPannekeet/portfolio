import { parsePattern, STEPS_PER_BAR, VOICE_ARP, VOICE_KICK, VOICE_NOISE, VOICE_P1, VOICE_P2, VOICE_PAD, VOICE_SUB, VOICE_WAVE } from '../../game/audio/tracker.ts'
import type { PatternTable } from '../../game/audio/tracker.ts'
import {
  AREA_ASHFORGE,
  AREA_BARROW,
  AREA_BRENNHOLD,
  AREA_CITADEL,
  AREA_SALTREACH,
  AREA_SHRINE,
  AREA_VALDMERE,
  AREA_VELLIN,
  BOSS_VAREK,
  CH_EMBER,
  AI_IDLE,
  ENEMY_BOSS_FIRST,
  MAX_ENEMIES,
  NIGHT_START_TICKS,
  VAREK_PHASE_ELEMENTS,
} from '../sim/content.ts'
import type { State } from '../sim/state.ts'
import { ASHFORGE_SONG, BARROW_SONG, BOSS_SONG, BRENNHOLD_SONG, CITADEL_SONG, SALTREACH_SONG, VALDMERE_SONG, VELLIN_SONG } from './patterns.ts'

export const BPM = 104
export const STEP_SECONDS = 60 / BPM / 4
export const BAR_SECONDS = STEP_SECONDS * STEPS_PER_BAR
export const MIN_THEME_BARS = 2

export const SONG_BRENNHOLD = 0
export const SONG_VALDMERE = 1
export const SONG_BARROW = 2
export const SONG_SALTREACH = 3
export const SONG_ASHFORGE = 4
export const SONG_VELLIN = 5
export const SONG_CITADEL = 6
export const SONG_BOSS = 7

export const SONGS: readonly string[] = [BRENNHOLD_SONG, VALDMERE_SONG, BARROW_SONG, SALTREACH_SONG, ASHFORGE_SONG, VELLIN_SONG, CITADEL_SONG, BOSS_SONG]
export const SONG_TABLES: readonly PatternTable[] = SONGS.map(parsePattern)
export const GRID_STEPS = SONG_TABLES.reduce((most, table) => Math.max(most, table.steps), STEPS_PER_BAR)

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

export const INS_RECORDER = 1
export const INS_HORN = 20
export const INS_DRONE = 5

export const INSTRUMENTS: readonly Instrument[] = [
  SILENT,
  instrument({ level: 0.1, duty: 2, attack: 0.012, decay: 0.25, sustain: 0.6, release: 0.08 }),
  instrument({ level: 0.1, duty: 1, attack: 0.006, decay: 0.2, sustain: 0.6, release: 0.06 }),
  instrument({ level: 0.075, duty: 1, attack: 0.002, decay: 0.22, sustain: 0, release: 0.12 }),
  instrument({ level: 0.065, duty: 2, attack: 0.002, decay: 0.3, sustain: 0, release: 0.15 }),
  instrument({ level: 0.14, attack: 0.03, decay: 0.4, sustain: 0.8, release: 0.15 }),
  instrument({ level: 0.16, decay: 0.12, sustain: 0.35, release: 0.04 }),
  instrument({ level: 0.36, decay: 0.24, sustain: 0, release: 0.05, sweep: -12 }),
  instrument({ level: 0.11, decay: 0.1, sustain: 0, release: 0.03, highpass: 200 }),
  instrument({ level: 0.045, decay: 0.04, sustain: 0, release: 0.02, highpass: 7000 }),
  instrument({ level: 0.05, decay: 0.14, sustain: 0, release: 0.04, noise: NOISE_SHORT, highpass: 5000 }),
  instrument({ level: 0.05, attack: 0.2, decay: 0.9, sustain: 0, release: 0.3, highpass: 3000 }),
  instrument({ level: 0.026, attack: 0.25, decay: 0.8, sustain: 0.8, release: 0.7, chord: CHORD_MINOR }),
  instrument({ level: 0.026, attack: 0.25, decay: 0.8, sustain: 0.8, release: 0.7, chord: CHORD_MAJOR }),
  instrument({ level: 0.15, attack: 0.02, decay: 0.3, sustain: 0.8, release: 0.1 }),
  instrument({ level: 0.04, attack: 0.002, decay: 0.15, sustain: 0.1, release: 0.2 }),
  instrument({ level: 0.07, duty: 2, attack: 0.002, decay: 0.9, sustain: 0, release: 0.4, ring: 2.76 }),
  instrument({ level: 0.11, decay: 0.35, sustain: 0, release: 0.1, noise: NOISE_SHORT, highpass: 500 }),
  instrument({ level: 0.12, decay: 0.07, sustain: 0, release: 0.03, highpass: 150 }),
  instrument({ level: 0.1, decay: 0.12, sustain: 0, release: 0.03, highpass: 1200 }),
  instrument({ level: 0.16, duty: 1, attack: 0.025, decay: 0.3, sustain: 0.75, release: 0.1, bend: -1 }),
  instrument({ level: 0.2, attack: 0.02, decay: 0.3, sustain: 0.8, release: 0.12 }),
]

export const INS_HORN_BASS = 21

export interface Arrangement {
  readonly song: number
  readonly voices: number
  readonly cutoff: number
  readonly sour: number
}

const bits = (indices: readonly number[]): number => indices.reduce((mask, index) => mask | (1 << index), 0)
const ALL_VOICES = 255
const NIGHT_VOICES = bits([VOICE_P1, VOICE_WAVE, VOICE_PAD, VOICE_ARP])
const DARK_VOICES = bits([VOICE_P1, VOICE_P2, VOICE_WAVE, VOICE_NOISE, VOICE_KICK, VOICE_PAD, VOICE_SUB])
const BOSS_VOICES = bits([VOICE_P1, VOICE_P2, VOICE_WAVE, VOICE_NOISE, VOICE_KICK, VOICE_PAD])
const SHRINE_VOICES = bits([VOICE_P2, VOICE_WAVE, VOICE_NOISE, VOICE_KICK, VOICE_ARP])
export const OPEN_CUTOFF = 18000
const DARK_CUTOFF = 1500
const CORRUPT_CUTOFF = 1100
const SOUR_CENTS = 28

const arrangement = (song: number, voices = ALL_VOICES, cutoff = OPEN_CUTOFF, sour = 0): Arrangement => ({ song, voices, cutoff, sour })

export const TH_BRENNHOLD = 0
export const TH_VALDMERE = 1
export const TH_VALDMERE_NIGHT = 2
export const TH_VALDMERE_DARK = 3
export const TH_VALDMERE_DARK_NIGHT = 4
export const TH_BARROW = 5
export const TH_BARROW_CORRUPT = 6
export const TH_SALTREACH = 7
export const TH_SALTREACH_CORRUPT = 8
export const TH_ASHFORGE = 9
export const TH_VELLIN = 10
export const TH_CITADEL = 11
export const TH_BOSS = 12
export const TH_VAREK = 13
export const TH_VAREK_WAKENED = 14
export const TH_SHRINE = 15

export const ARRANGEMENTS: readonly Arrangement[] = [
  arrangement(SONG_BRENNHOLD),
  arrangement(SONG_VALDMERE),
  arrangement(SONG_VALDMERE, NIGHT_VOICES, 2600),
  arrangement(SONG_VALDMERE, DARK_VOICES, DARK_CUTOFF, SOUR_CENTS),
  arrangement(SONG_VALDMERE, NIGHT_VOICES & DARK_VOICES, DARK_CUTOFF, SOUR_CENTS),
  arrangement(SONG_BARROW),
  arrangement(SONG_BARROW, ALL_VOICES, CORRUPT_CUTOFF, SOUR_CENTS),
  arrangement(SONG_SALTREACH),
  arrangement(SONG_SALTREACH, ALL_VOICES, CORRUPT_CUTOFF, SOUR_CENTS),
  arrangement(SONG_ASHFORGE),
  arrangement(SONG_VELLIN),
  arrangement(SONG_CITADEL),
  arrangement(SONG_BOSS, BOSS_VOICES),
  arrangement(SONG_BOSS),
  arrangement(SONG_BOSS, ALL_VOICES, 4000, SOUR_CENTS),
  arrangement(SONG_BOSS, SHRINE_VOICES, 5000),
]

export function aliveBoss(s: State): number {
  let kind = -1
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (s.eAlive[i] === 1 && s.eState[i] !== AI_IDLE && s.eKind[i]! >= ENEMY_BOSS_FIRST && s.eKind[i]! > kind) kind = s.eKind[i]!
  }
  return kind
}

export function themeFor(s: State): number {
  const boss = aliveBoss(s)
  if (boss === BOSS_VAREK) return s.bossPhase >= VAREK_PHASE_ELEMENTS ? TH_VAREK_WAKENED : TH_VAREK
  if (boss >= 0) return TH_BOSS
  const corrupt = s.areaVariant === 1
  switch (s.area) {
    case AREA_BRENNHOLD:
      return TH_BRENNHOLD
    case AREA_VALDMERE: {
      const night = s.clock >= NIGHT_START_TICKS
      if (s.chapter >= CH_EMBER) return night ? TH_VALDMERE_DARK_NIGHT : TH_VALDMERE_DARK
      return night ? TH_VALDMERE_NIGHT : TH_VALDMERE
    }
    case AREA_BARROW:
      return corrupt ? TH_BARROW_CORRUPT : TH_BARROW
    case AREA_SALTREACH:
      return corrupt ? TH_SALTREACH_CORRUPT : TH_SALTREACH
    case AREA_ASHFORGE:
      return TH_ASHFORGE
    case AREA_VELLIN:
      return TH_VELLIN
    case AREA_CITADEL:
      return TH_CITADEL
    case AREA_SHRINE:
      return TH_SHRINE
  }
  return TH_VALDMERE
}

export interface Jingle {
  readonly stepSeconds: number
  readonly lead: readonly number[]
  readonly bass: readonly number[]
  readonly leadIns: number
  readonly bassIns: number
  readonly finalSweep: number
}

const jingle = (stepSeconds: number, lead: readonly number[], bass: readonly number[], finalSweep = 0): Jingle => ({ stepSeconds, lead, bass, leadIns: INS_RECORDER, bassIns: INS_DRONE, finalSweep })

const octaveDown = (line: readonly number[]): number[] => line.map((value, i) => (i % 2 === 0 ? value - 12 : value))
const horn = (lead: readonly number[]): Jingle => ({ stepSeconds: 0.11, lead, bass: octaveDown(lead), leadIns: INS_HORN, bassIns: INS_HORN_BASS, finalSweep: 0 })

export const HORN_JINGLES: readonly Jingle[] = [
  horn([69, 2, 74, 2, 78, 2, 81, 4, 78, 2, 81, 6]),
  horn([74, 2, 76, 2, 77, 2, 79, 2, 81, 3, 77, 1, 79, 2, 74, 6]),
  horn([74, 3, 81, 3, 79, 2, 77, 2, 76, 2, 74, 8]),
]

export const DEFEAT_JINGLE = jingle(0.12, [81, 2, 79, 2, 77, 2, 76, 2, 74, 4, 73, 2, 74, 10], [50, 8, 46, 8, 38, 12], -12)
export const LEVEL_UP_JINGLE = jingle(0.07, [74, 1, 78, 1, 81, 1, 86, 3, 81, 1, 86, 6], [50, 4, 57, 4, 62, 6])
export const PUZZLE_JINGLE = jingle(0.06, [67, 1, 71, 1, 74, 1, 79, 1, 69, 1, 73, 1, 76, 1, 81, 1, 74, 1, 78, 1, 81, 1, 86, 8], [43, 4, 45, 4, 50, 8])
export const SHARD_JINGLE = jingle(
  0.055,
  [74, 1, 78, 1, 81, 1, 86, 1, 76, 1, 79, 1, 83, 1, 88, 1, 78, 1, 81, 1, 86, 1, 90, 1, 81, 1, 86, 1, 90, 1, 93, 1, 98, 16],
  [50, 8, 55, 8, 57, 8, 62, 16],
)
export const KEY_ITEM_JINGLE = jingle(0.09, [69, 2, 74, 2, 76, 2, 78, 4, 76, 2, 81, 8], [50, 6, 57, 6, 50, 8])
export const VIGIL_JINGLE = jingle(0.16, [74, 2, 77, 2, 81, 4, 79, 2, 77, 2, 76, 4, 74, 2, 73, 2, 74, 12], [50, 8, 46, 8, 45, 8, 50, 12])
export const REFORGE_JINGLE = jingle(0.15, [74, 2, 78, 2, 81, 4, 86, 4, 85, 2, 83, 2, 81, 4, 86, 12], [50, 8, 55, 8, 57, 8, 50, 12])
export const SHATTER_JINGLE = jingle(0.14, [69, 2, 76, 2, 81, 4, 83, 2, 85, 2, 88, 4, 81, 2, 88, 12], [50, 8, 57, 8, 55, 8, 50, 12])

export const JINGLES: readonly Jingle[] = [...HORN_JINGLES, DEFEAT_JINGLE, LEVEL_UP_JINGLE, PUZZLE_JINGLE, SHARD_JINGLE, KEY_ITEM_JINGLE, VIGIL_JINGLE, REFORGE_JINGLE, SHATTER_JINGLE]

export function jingleSeconds(j: Jingle): number {
  let steps = 0
  for (let i = 1; i < j.lead.length; i += 2) steps += j.lead[i]!
  return steps * j.stepSeconds
}

export const DUCK_LEVEL = 0.6
export const DUCK_CUTOFF = 1400
export const JINGLE_DUCK_LEVEL = 0.35
