import {
  ELEMENT_COUNT,
  ENDING_REFORGE,
  ENDING_SHATTER,
  ENEMY_BOSS_FIRST,
  EVENT_CAP,
  EV_AREA,
  EV_BLOCK,
  EV_BOSS_PHASE,
  EV_CHEST,
  EV_COUNT,
  EV_DEAD,
  EV_DEFLECT,
  EV_DIALOG,
  EV_DODGE,
  EV_DOOR,
  EV_ENDING,
  EV_ENEMY_DIE,
  EV_FINISHER,
  EV_FORGE,
  EV_HIT,
  EV_HORN,
  EV_ITEM_GAIN,
  EV_KEY_ITEM,
  EV_LEARN,
  EV_LEVEL_UP,
  EV_LOOT_DROP,
  EV_MOUNT,
  EV_PARRY,
  EV_PERFECT_BLOCK,
  EV_PICKUP,
  EV_PLAYER_HURT,
  EV_PUZZLE,
  EV_SAVE,
  EV_SHARD,
  EV_SHOOT,
  EV_SKILL,
  EV_STANCE,
  EV_SWING,
  EV_TELEGRAPH,
  EV_VIGIL,
  LOOT_ITEM,
  LOOT_RUNE,
  MELODY_COUNT,
  PROJ_KIND_COUNT,
  TIER_COUNT,
} from '../sim/content.ts'
import {
  DEFEAT_JINGLE,
  HORN_JINGLES,
  KEY_ITEM_JINGLE,
  LEVEL_UP_JINGLE,
  PUZZLE_JINGLE,
  REFORGE_JINGLE,
  SHARD_JINGLE,
  SHATTER_JINGLE,
  VIGIL_JINGLE,
} from './song.ts'
import type { Jingle } from './song.ts'

export const SFX_PULSE = 0
export const SFX_WAVE = 1
export const SFX_NOISE_LONG = 2
export const SFX_NOISE_SHORT = 3
export const SFX_SAW = 4

export interface SfxLayer {
  readonly wave: number
  readonly duty: number
  readonly startHz: number
  readonly endHz: number
  readonly attack: number
  readonly sustain: number
  readonly decay: number
  readonly level: number
  readonly arpRatio: number
  readonly arpAt: number
  readonly vibratoHz: number
  readonly vibratoCents: number
  readonly delay: number
}

export interface Sound {
  readonly priority: number
  readonly gapMs: number
  readonly layers: readonly SfxLayer[]
}

const BLIP: SfxLayer = {
  wave: SFX_PULSE,
  duty: 2,
  startHz: 440,
  endHz: 440,
  attack: 0.002,
  sustain: 0.02,
  decay: 0.06,
  level: 0.15,
  arpRatio: 1,
  arpAt: 0,
  vibratoHz: 0,
  vibratoCents: 0,
  delay: 0,
}
const layer = (fields: Partial<SfxLayer>): SfxLayer => ({ ...BLIP, ...fields })
const sound = (priority: number, gapMs: number, ...layers: Partial<SfxLayer>[]): Sound => ({ priority, gapMs, layers: layers.map(layer) })

const SWING: readonly Sound[] = [
  sound(2, 50, { wave: SFX_NOISE_LONG, startHz: 1400, endHz: 2600, attack: 0.01, sustain: 0.02, decay: 0.07, level: 0.09 }),
  sound(2, 50, { wave: SFX_WAVE, startHz: 170, endHz: 70, sustain: 0.03, decay: 0.12, level: 0.2 }, { wave: SFX_NOISE_LONG, startHz: 500, endHz: 200, sustain: 0.02, decay: 0.08, level: 0.1 }),
  sound(2, 50, { wave: SFX_NOISE_LONG, startHz: 700, endHz: 2600, attack: 0.03, sustain: 0.04, decay: 0.12, level: 0.1 }, { wave: SFX_PULSE, duty: 0, startHz: 880, endHz: 1320, attack: 0.02, sustain: 0.02, decay: 0.08, level: 0.03 }),
  sound(2, 50, { wave: SFX_NOISE_SHORT, startHz: 3200, endHz: 1400, sustain: 0.03, decay: 0.08, level: 0.08 }, { wave: SFX_NOISE_LONG, startHz: 2200, endHz: 900, sustain: 0.01, decay: 0.06, level: 0.08, delay: 0.03 }),
  sound(2, 50, { wave: SFX_PULSE, duty: 0, startHz: 1700, endHz: 2700, attack: 0.01, sustain: 0.05, decay: 0.08, level: 0.06, vibratoHz: 30, vibratoCents: 40 }, { wave: SFX_NOISE_LONG, startHz: 2400, endHz: 3800, sustain: 0.03, decay: 0.06, level: 0.06 }),
]

const SKILL: readonly Sound[] = [
  sound(7, 200, { wave: SFX_WAVE, startHz: 120, endHz: 38, sustain: 0.08, decay: 0.4, level: 0.32 }, { wave: SFX_NOISE_LONG, startHz: 420, endHz: 60, sustain: 0.06, decay: 0.45, level: 0.24 }),
  sound(7, 200, { wave: SFX_NOISE_LONG, startHz: 3200, endHz: 900, attack: 0.03, sustain: 0.1, decay: 0.35, level: 0.15 }, { wave: SFX_PULSE, duty: 0, startHz: 2093, endHz: 2637, sustain: 0.12, decay: 0.3, level: 0.05, vibratoHz: 18, vibratoCents: 25 }),
  sound(7, 200, { wave: SFX_NOISE_SHORT, startHz: 700, endHz: 220, sustain: 0.06, decay: 0.3, level: 0.2 }, { wave: SFX_NOISE_LONG, startHz: 2400, endHz: 300, attack: 0.02, sustain: 0.1, decay: 0.4, level: 0.18 }),
  sound(7, 200, { wave: SFX_NOISE_LONG, startHz: 300, endHz: 3200, attack: 0.06, sustain: 0.12, decay: 0.3, level: 0.16 }, { wave: SFX_PULSE, duty: 0, startHz: 1200, endHz: 2400, attack: 0.05, sustain: 0.1, decay: 0.2, level: 0.05, vibratoHz: 24, vibratoCents: 60 }),
]

const STANCE_ROOTS: readonly number[] = [294, 440, 587, 880]
const STANCE: readonly Sound[] = STANCE_ROOTS.map((hz, element) =>
  sound(4, 120, { duty: element === 0 ? 2 : 1, startHz: hz, endHz: hz, sustain: 0.04, decay: 0.12, level: 0.11, arpRatio: 1.5, arpAt: 0.05 }),
)

const FINISHER: readonly Sound[] = SKILL.map((skill, element) =>
  sound(
    8,
    150,
    ...skill.layers,
    { wave: SFX_WAVE, startHz: 95, endHz: 40, sustain: 0.06, decay: 0.3, level: 0.28 },
    { duty: 2, startHz: STANCE_ROOTS[element]! * 2, endHz: STANCE_ROOTS[element]! * 2, sustain: 0.08, decay: 0.3, level: 0.09, arpRatio: 2, arpAt: 0.06, delay: 0.04 },
  ),
)

const ENEMY_DIE: readonly Sound[] = [
  sound(4, 70, { wave: SFX_NOISE_LONG, startHz: 1100, endHz: 120, sustain: 0.03, decay: 0.22, level: 0.18 }, { wave: SFX_WAVE, startHz: 220, endHz: 80, sustain: 0.02, decay: 0.15, level: 0.12 }),
  sound(5, 90, { wave: SFX_NOISE_LONG, startHz: 900, endHz: 70, sustain: 0.06, decay: 0.35, level: 0.24 }, { wave: SFX_WAVE, startHz: 180, endHz: 50, sustain: 0.04, decay: 0.3, level: 0.18 }, { duty: 0, startHz: 1320, endHz: 660, sustain: 0.02, decay: 0.15, level: 0.06 }),
  sound(9, 500, { wave: SFX_NOISE_LONG, startHz: 600, endHz: 40, sustain: 0.3, decay: 1.1, level: 0.34 }, { wave: SFX_WAVE, startHz: 110, endHz: 36, sustain: 0.3, decay: 0.9, level: 0.26 }),
]

const SHOOT: readonly Sound[] = [
  sound(3, 70, { duty: 1, startHz: 700, endHz: 420, sustain: 0.01, decay: 0.08, level: 0.1 }, { wave: SFX_NOISE_LONG, startHz: 3000, endHz: 1500, sustain: 0.01, decay: 0.05, level: 0.05 }),
  sound(3, 70, { duty: 1, startHz: 980, endHz: 560, sustain: 0.01, decay: 0.1, level: 0.12 }, { wave: SFX_NOISE_LONG, startHz: 3600, endHz: 1800, sustain: 0.01, decay: 0.05, level: 0.05 }),
  sound(3, 90, { wave: SFX_SAW, startHz: 1400, endHz: 300, sustain: 0.02, decay: 0.08, level: 0.07 }),
  sound(3, 90, { wave: SFX_WAVE, startHz: 420, endHz: 180, attack: 0.02, sustain: 0.06, decay: 0.15, level: 0.12 }),
  sound(3, 90, { wave: SFX_NOISE_SHORT, startHz: 900, endHz: 400, sustain: 0.04, decay: 0.12, level: 0.1 }),
  sound(3, 90, { duty: 0, startHz: 1200, endHz: 1800, sustain: 0.04, decay: 0.1, level: 0.06, vibratoHz: 20, vibratoCents: 30 }),
]

const PICKUP: readonly Sound[] = [
  sound(2, 30, { duty: 1, startHz: 988, endHz: 988, sustain: 0.03, decay: 0.12, level: 0.09, arpRatio: 4 / 3, arpAt: 0.04 }),
  sound(3, 80, { wave: SFX_WAVE, startHz: 523, endHz: 1046, sustain: 0.08, decay: 0.15, level: 0.15, arpRatio: 1.25, arpAt: 0.05 }),
  sound(2, 60, { wave: SFX_NOISE_SHORT, startHz: 2600, endHz: 2200, sustain: 0.01, decay: 0.1, level: 0.08 }, { wave: SFX_WAVE, startHz: 330, endHz: 330, sustain: 0.02, decay: 0.1, level: 0.1 }),
  sound(4, 80, { duty: 2, startHz: 659, endHz: 659, sustain: 0.05, decay: 0.2, level: 0.1, arpRatio: 1.5, arpAt: 0.06 }),
  sound(4, 80, { duty: 0, startHz: 1175, endHz: 1760, sustain: 0.12, decay: 0.3, level: 0.08, vibratoHz: 14, vibratoCents: 30 }),
]

const ITEM_GAIN = sound(5, 120, { duty: 2, startHz: 587, endHz: 587, sustain: 0.05, decay: 0.2, level: 0.12, arpRatio: 1.5, arpAt: 0.05 }, { duty: 1, startHz: 1175, endHz: 1175, sustain: 0.04, decay: 0.3, level: 0.06, arpRatio: 1.25, arpAt: 0.05, delay: 0.1 })

export const SILENT_EVENTS: readonly number[] = []

const table: (readonly Sound[])[] = []
for (let type = 0; type < EV_COUNT; type++) table.push([])
table[EV_SWING] = SWING
table[EV_HIT] = [sound(4, 30, { wave: SFX_NOISE_LONG, startHz: 1600, endHz: 300, sustain: 0.01, decay: 0.1, level: 0.16 }, { duty: 2, startHz: 300, endHz: 110, sustain: 0.01, decay: 0.07, level: 0.12 })]
table[EV_PLAYER_HURT] = [sound(7, 120, { duty: 2, startHz: 420, endHz: 90, sustain: 0.04, decay: 0.16, level: 0.24 }, { wave: SFX_NOISE_LONG, startHz: 900, endHz: 200, sustain: 0.02, decay: 0.12, level: 0.14 })]
table[EV_BLOCK] = [sound(5, 60, { wave: SFX_NOISE_LONG, startHz: 500, endHz: 220, sustain: 0.02, decay: 0.08, level: 0.2 }, { wave: SFX_WAVE, startHz: 150, endHz: 110, sustain: 0.02, decay: 0.08, level: 0.16 })]
table[EV_PERFECT_BLOCK] = [sound(7, 80, { duty: 2, startHz: 1568, endHz: 1568, sustain: 0.06, decay: 0.45, level: 0.14, vibratoHz: 9, vibratoCents: 8 }, { wave: SFX_NOISE_SHORT, startHz: 5000, endHz: 3000, sustain: 0.005, decay: 0.05, level: 0.1 })]
table[EV_PARRY] = [sound(8, 80, { duty: 2, startHz: 1319, endHz: 1319, sustain: 0.05, decay: 0.3, level: 0.14 }, { duty: 1, startHz: 1976, endHz: 1976, sustain: 0.08, decay: 0.5, level: 0.12, delay: 0.07 }, { wave: SFX_WAVE, startHz: 659, endHz: 659, sustain: 0.05, decay: 0.4, level: 0.1 })]
table[EV_DODGE] = [
    sound(2, 80, { wave: SFX_NOISE_LONG, startHz: 500, endHz: 1500, attack: 0.02, sustain: 0.03, decay: 0.1, level: 0.08 }),
    sound(3, 80, { wave: SFX_NOISE_LONG, startHz: 1200, endHz: 4000, attack: 0.02, sustain: 0.05, decay: 0.12, level: 0.1 }, { duty: 0, startHz: 1400, endHz: 2200, sustain: 0.06, decay: 0.08, level: 0.05 }),
  ]
table[EV_SKILL] = SKILL
table[EV_STANCE] = STANCE
table[EV_FINISHER] = FINISHER
table[EV_ENEMY_DIE] = ENEMY_DIE
table[EV_TELEGRAPH] = [sound(6, 60, { duty: 0, startHz: 1760, endHz: 1760, attack: 0.001, sustain: 0.015, decay: 0.03, level: 0.11 }, { duty: 0, startHz: 1760, endHz: 1760, attack: 0.001, sustain: 0.015, decay: 0.03, level: 0.09, delay: 0.07 })]
table[EV_SHOOT] = SHOOT
table[EV_DEFLECT] = [sound(5, 60, { duty: 0, startHz: 2400, endHz: 2400, sustain: 0.02, decay: 0.15, level: 0.1, arpRatio: 1.25, arpAt: 0.03 })]
table[EV_BOSS_PHASE] = [sound(9, 800, { wave: SFX_WAVE, startHz: 75, endHz: 50, sustain: 0.5, decay: 0.8, level: 0.3 }, { duty: 1, startHz: 466, endHz: 440, sustain: 0.4, decay: 0.6, level: 0.12, vibratoHz: 6, vibratoCents: 40 }, { wave: SFX_NOISE_LONG, startHz: 1200, endHz: 300, sustain: 0.1, decay: 0.9, level: 0.16 })]
table[EV_LOOT_DROP] = [
    sound(1, 60, { duty: 0, startHz: 1500, endHz: 1500, sustain: 0.005, decay: 0.06, level: 0.06 }),
    sound(3, 100, { duty: 0, startHz: 1760, endHz: 1760, sustain: 0.03, decay: 0.25, level: 0.07, arpRatio: 1.5, arpAt: 0.05, vibratoHz: 12, vibratoCents: 20 }),
  ]
table[EV_PICKUP] = PICKUP
table[EV_ITEM_GAIN] = [ITEM_GAIN]
table[EV_DOOR] = [sound(4, 300, { wave: SFX_WAVE, startHz: 90, endHz: 60, sustain: 0.1, decay: 0.25, level: 0.22 }, { wave: SFX_NOISE_LONG, startHz: 320, endHz: 240, attack: 0.04, sustain: 0.18, decay: 0.15, level: 0.06, vibratoHz: 11, vibratoCents: 200 })]
table[EV_CHEST] = [sound(6, 300, { wave: SFX_NOISE_LONG, startHz: 400, endHz: 150, sustain: 0.02, decay: 0.1, level: 0.2 }, { duty: 2, startHz: 784, endHz: 784, sustain: 0.04, decay: 0.2, level: 0.1, arpRatio: 1.26, arpAt: 0.06, delay: 0.12 }, { duty: 2, startHz: 1175, endHz: 1175, sustain: 0.04, decay: 0.35, level: 0.09, arpRatio: 1.33, arpAt: 0.06, delay: 0.24 })]
table[EV_AREA] = [sound(2, 400, { wave: SFX_NOISE_LONG, startHz: 200, endHz: 1200, attack: 0.08, sustain: 0.1, decay: 0.2, level: 0.06 })]
table[EV_SAVE] = [sound(6, 400, { duty: 2, startHz: 1319, endHz: 1319, sustain: 0.06, decay: 0.3, level: 0.11, arpRatio: 1.5, arpAt: 0.09 }, { wave: SFX_WAVE, startHz: 659, endHz: 659, sustain: 0.1, decay: 0.4, level: 0.1, arpRatio: 1.5, arpAt: 0.09 })]
table[EV_FORGE] = [
    sound(6, 150, { wave: SFX_NOISE_SHORT, startHz: 2600, endHz: 1800, sustain: 0.01, decay: 0.3, level: 0.18 }, { duty: 2, startHz: 1760, endHz: 1760, sustain: 0.02, decay: 0.5, level: 0.07, vibratoHz: 7, vibratoCents: 12 }),
    sound(6, 150, { duty: 3, startHz: 110, endHz: 98, sustain: 0.15, decay: 0.08, level: 0.12 }, { wave: SFX_NOISE_LONG, startHz: 300, endHz: 120, sustain: 0.02, decay: 0.08, level: 0.12 }),
  ]
table[EV_MOUNT] = [
    sound(5, 300, { duty: 1, startHz: 900, endHz: 1300, attack: 0.02, sustain: 0.15, decay: 0.15, level: 0.09, vibratoHz: 9, vibratoCents: 120 }, { wave: SFX_NOISE_LONG, startHz: 400, endHz: 300, sustain: 0.01, decay: 0.05, level: 0.1, delay: 0.2 }, { wave: SFX_NOISE_LONG, startHz: 400, endHz: 300, sustain: 0.01, decay: 0.05, level: 0.1, delay: 0.3 }),
    sound(4, 300, { wave: SFX_WAVE, startHz: 140, endHz: 80, sustain: 0.02, decay: 0.12, level: 0.18 }, { wave: SFX_NOISE_LONG, startHz: 500, endHz: 200, sustain: 0.01, decay: 0.08, level: 0.1 }),
  ]
table[EV_LEARN] = [sound(6, 300, { duty: 2, startHz: 880, endHz: 880, sustain: 0.05, decay: 0.3, level: 0.12, arpRatio: 1.5, arpAt: 0.07 }, { duty: 1, startHz: 1760, endHz: 1760, sustain: 0.05, decay: 0.4, level: 0.07, arpRatio: 1.5, arpAt: 0.07, delay: 0.14 })]
table[EV_DIALOG] = [sound(1, 40, { duty: 1, startHz: 880, endHz: 880, sustain: 0.012, decay: 0.03, level: 0.07 })]
export const SFX_TABLE: readonly (readonly Sound[])[] = table

export const SFX_VARIANT_STRIDE = 8
export const SFX_VOICES = 8
const SWING_TIER_STEP = 1.05
const TIER_SEMITONES: readonly number[] = [0, 2, 4, 7, 12]
export const TIER_RATIOS = new Float32Array(TIER_SEMITONES.map(semitones => 2 ** (semitones / 12)))
export const PICKUP_STREAK_SECONDS = 0.4
const PICKUP_SEMITONES: readonly number[] = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]
export const PICKUP_RATIOS = new Float32Array(PICKUP_SEMITONES.map(semitones => 2 ** (semitones / 12)))

const clampIndex = (value: number, count: number): number => (value >= 0 && value < count ? value | 0 : 0)

export function sfxVariant(type: number, a: number, b: number): number {
  switch (type) {
    case EV_SWING:
      return a >= 0 && a < ELEMENT_COUNT ? (a | 0) + 1 : 0
    case EV_DODGE:
      return a === 1 ? 1 : 0
    case EV_SKILL:
    case EV_STANCE:
    case EV_FINISHER:
      return clampIndex(a, ELEMENT_COUNT)
    case EV_ENEMY_DIE:
      return a >= ENEMY_BOSS_FIRST ? 2 : b === 1 ? 1 : 0
    case EV_SHOOT:
      return clampIndex(a, PROJ_KIND_COUNT)
    case EV_LOOT_DROP:
      return a === LOOT_ITEM || a === LOOT_RUNE ? 1 : 0
    case EV_PICKUP:
      return clampIndex(a, PICKUP.length)
    case EV_FORGE:
      return b === 1 ? 0 : 1
    case EV_MOUNT:
      return a === 1 ? 0 : 1
  }
  return 0
}

export function sfxPitch(type: number, b: number): number {
  if (type === EV_SWING) return SWING_TIER_STEP ** Math.min(Math.max(b, 0), 4)
  if (type === EV_ITEM_GAIN || type === EV_LOOT_DROP) return TIER_RATIOS[clampIndex(b, TIER_COUNT)]!
  return 1
}

export function jingleFor(type: number, a: number): Jingle | null {
  switch (type) {
    case EV_HORN:
      return HORN_JINGLES[clampIndex(a, MELODY_COUNT)]!
    case EV_DEAD:
      return DEFEAT_JINGLE
    case EV_LEVEL_UP:
      return LEVEL_UP_JINGLE
    case EV_PUZZLE:
      return PUZZLE_JINGLE
    case EV_SHARD:
      return SHARD_JINGLE
    case EV_KEY_ITEM:
      return KEY_ITEM_JINGLE
    case EV_VIGIL:
      return VIGIL_JINGLE
    case EV_ENDING:
      return a === ENDING_SHATTER ? SHATTER_JINGLE : a === ENDING_REFORGE ? REFORGE_JINGLE : null
  }
  return null
}

export function syncCursor(cursor: number, head: number, tick: number, lastTick: number): number {
  const start = head < cursor || tick < lastTick ? 0 : cursor
  return head - start > EVENT_CAP ? head - EVENT_CAP : start
}

