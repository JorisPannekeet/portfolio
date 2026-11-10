import {
  BEACON_REWARD_HEAL,
  BULLET_KIND_COUNT,
  ENEMY_BOSS_FIRST,
  EV_BEACON,
  EV_ENEMY_FIRE,
  EV_KILL,
  EV_PICKUP,
  EV_SHOOT,
  GEM_LARGE,
  GEM_REPAIR,
  WEAPON_COUNT,
} from '../sim/content.ts'

export const SFX_PULSE = 0
export const SFX_WAVE = 1
export const SFX_NOISE_LONG = 2
export const SFX_NOISE_SHORT = 3
export const SFX_SAW = 4

export interface SfxDef {
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
  readonly priority: number
  readonly gapMs: number
}

const BLIP: SfxDef = {
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
  priority: 2,
  gapMs: 60,
}
const sfx = (fields: Partial<SfxDef>): SfxDef => ({ ...BLIP, ...fields })

const SHOOT_BY_WEAPON: readonly SfxDef[] = [
  sfx({ duty: 1, startHz: 1400, endHz: 600, sustain: 0.02, decay: 0.06, level: 0.16 }),
  sfx({ duty: 0, startHz: 1800, endHz: 260, sustain: 0.05, decay: 0.16, level: 0.22, priority: 3, gapMs: 80 }),
  sfx({ wave: SFX_NOISE_LONG, startHz: 2600, endHz: 1400, sustain: 0.01, decay: 0.07, level: 0.12, gapMs: 90 }),
  sfx({ wave: SFX_NOISE_LONG, startHz: 1800, endHz: 700, sustain: 0.03, decay: 0.12, level: 0.17, priority: 3, gapMs: 90 }),
  sfx({ wave: SFX_NOISE_SHORT, startHz: 1300, endHz: 800, sustain: 0.008, decay: 0.03, level: 0.08, gapMs: 50 }),
  sfx({ wave: SFX_NOISE_SHORT, startHz: 900, endHz: 450, sustain: 0.012, decay: 0.05, level: 0.11, gapMs: 40 }),
  sfx({ wave: SFX_NOISE_LONG, startHz: 400, endHz: 1500, attack: 0.01, sustain: 0.05, decay: 0.12, level: 0.12, gapMs: 90 }),
  sfx({ wave: SFX_NOISE_LONG, startHz: 260, endHz: 1200, attack: 0.01, sustain: 0.07, decay: 0.18, level: 0.16, priority: 3, gapMs: 90 }),
  sfx({ duty: 2, startHz: 600, endHz: 900, sustain: 0.01, decay: 0.05, level: 0.09, gapMs: 120 }),
  sfx({ wave: SFX_WAVE, startHz: 500, endHz: 1000, sustain: 0.02, decay: 0.08, level: 0.12, priority: 3, gapMs: 120 }),
  sfx({ wave: SFX_WAVE, startHz: 220, endHz: 120, sustain: 0.02, decay: 0.1, level: 0.12, gapMs: 150 }),
  sfx({ wave: SFX_WAVE, startHz: 160, endHz: 70, sustain: 0.04, decay: 0.16, level: 0.16, priority: 3, gapMs: 150 }),
]

const ENEMY_FIRE_BY_BULLET: readonly SfxDef[] = [
  sfx({ duty: 0, startHz: 880, endHz: 1320, sustain: 0.02, decay: 0.04, level: 0.07, arpRatio: 1.5, arpAt: 0.025, priority: 2, gapMs: 130 }),
  sfx({ wave: SFX_SAW, startHz: 130, endHz: 38, attack: 0.001, sustain: 0.03, decay: 0.14, level: 0.17, priority: 4, gapMs: 170 }),
  sfx({ wave: SFX_SAW, startHz: 3200, endHz: 1100, attack: 0.001, sustain: 0.004, decay: 0.03, level: 0.05, priority: 2, gapMs: 90 }),
]

export const SFX_TABLE: readonly (readonly SfxDef[])[] = [
  [sfx({ wave: SFX_NOISE_SHORT, startHz: 2000, endHz: 1200, sustain: 0.005, decay: 0.03, level: 0.09, priority: 1, gapMs: 40 })],
  [
    sfx({ wave: SFX_NOISE_LONG, startHz: 1200, endHz: 200, sustain: 0.01, decay: 0.08, level: 0.13, priority: 2, gapMs: 60 }),
    sfx({ wave: SFX_NOISE_LONG, startHz: 600, endHz: 40, sustain: 0.25, decay: 0.9, level: 0.34, priority: 9, gapMs: 0 }),
  ],
  SHOOT_BY_WEAPON,
  [sfx({ wave: SFX_NOISE_LONG, startHz: 2400, endHz: 800, attack: 0.005, sustain: 0.02, decay: 0.09, level: 0.15, priority: 3, gapMs: 70 })],
  [sfx({ wave: SFX_NOISE_LONG, startHz: 900, endHz: 80, sustain: 0.05, decay: 0.3, level: 0.24, priority: 4, gapMs: 90 })],
  [sfx({ wave: SFX_WAVE, startHz: 180, endHz: 90, sustain: 0.04, decay: 0.2, level: 0.18, priority: 3, gapMs: 120 })],
  [
    sfx({ duty: 2, startHz: 1046, endHz: 1046, sustain: 0.03, decay: 0.05, level: 0.1, arpRatio: 1.5, arpAt: 0.03, priority: 3, gapMs: 30 }),
    sfx({ wave: SFX_WAVE, startHz: 523, endHz: 1046, sustain: 0.1, decay: 0.15, level: 0.16, arpRatio: 1.25, arpAt: 0.06, priority: 5, gapMs: 100 }),
    sfx({ duty: 1, startHz: 400, endHz: 1600, sustain: 0.15, decay: 0.15, level: 0.15, priority: 5, gapMs: 100 }),
  ],
  [sfx({ duty: 2, startHz: 300, endHz: 80, sustain: 0.04, decay: 0.15, level: 0.26, priority: 6, gapMs: 120 })],
  [sfx({ duty: 2, startHz: 523, endHz: 523, sustain: 0.12, decay: 0.3, level: 0.22, arpRatio: 2, arpAt: 0.08, priority: 7, gapMs: 200 })],
  [sfx({ duty: 0, startHz: 262, endHz: 1046, sustain: 0.3, decay: 0.4, level: 0.24, arpRatio: 2, arpAt: 0.25, vibratoHz: 12, vibratoCents: 30, priority: 8, gapMs: 300 })],
  [sfx({ duty: 1, startHz: 440, endHz: 330, sustain: 1, decay: 0.4, level: 0.22, vibratoHz: 4, vibratoCents: 300, priority: 9, gapMs: 1000 })],
  [sfx({ wave: SFX_WAVE, startHz: 523, endHz: 1046, sustain: 0.1, decay: 0.2, level: 0.16, arpRatio: 1.5, arpAt: 0.08, priority: 5, gapMs: 150 })],
  [],
  [],
  [
    sfx({ duty: 1, startHz: 587, endHz: 1175, attack: 0.004, sustain: 0.12, decay: 0.35, level: 0.2, arpRatio: 1.5, arpAt: 0.09, vibratoHz: 14, vibratoCents: 15, priority: 7, gapMs: 200 }),
    sfx({ wave: SFX_WAVE, startHz: 440, endHz: 660, attack: 0.01, sustain: 0.1, decay: 0.3, level: 0.13, arpRatio: 1.25, arpAt: 0.1, priority: 6, gapMs: 200 }),
  ],
  [sfx({ wave: SFX_WAVE, startHz: 70, endHz: 180, attack: 0.02, sustain: 0.06, decay: 0.22, level: 0.16, priority: 4, gapMs: 400 })],
  ENEMY_FIRE_BY_BULLET,
]

export const SFX_VARIANT_STRIDE = 16
export const SFX_VOICES = 6

export function sfxVariant(type: number, a: number, b: number): number {
  if (type === EV_SHOOT) {
    const weapon = a >= 0 && a < WEAPON_COUNT ? a | 0 : 0
    return weapon * 2 + (b === 1 ? 1 : 0)
  }
  if (type === EV_KILL) return a >= ENEMY_BOSS_FIRST ? 1 : 0
  if (type === EV_BEACON) return a === BEACON_REWARD_HEAL ? 1 : 0
  if (type === EV_ENEMY_FIRE) return b >= 0 && b < BULLET_KIND_COUNT ? b | 0 : 0
  if (type === EV_PICKUP) return a <= GEM_LARGE ? 0 : a === GEM_REPAIR ? 1 : 2
  return 0
}

export const PICKUP_STREAK_SECONDS = 0.4
const PICKUP_SEMITONES: readonly number[] = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]
export const PICKUP_RATIOS = new Float32Array(PICKUP_SEMITONES.map(semitones => 2 ** (semitones / 12)))
