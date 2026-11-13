import type { State } from '../sim/state.ts'
import {
  AREA_ASHFORGE, AREA_BARROW, AREA_BRENNHOLD, AREA_CITADEL, AREA_COUNT, AREA_SALTREACH, AREA_SHRINE, AREA_VALDMERE, AREA_VELLIN, CH_EMBER, TICK_HZ,
} from '../sim/content.ts'
import { AREA_OUTDOOR } from './sheet-world.ts'
import { RPG_PALETTE } from './palette.ts'

export const WEATHER_CLEAR = 0
export const WEATHER_BREEZY = 1
export const WEATHER_RAIN = 2
export const WEATHER_MIST = 3
export const WEATHER_COUNT = 4
export const WEATHER_SPAN = 150 * TICK_HZ
export const WEATHER_FADE = 10 * TICK_HZ

export const AMB_NONE = 0
export const AMB_MOTE = 1
export const AMB_EMBER = 2
export const AMB_LEAF = 3
export const AMB_DUST = 4
export const AMB_SPLASH = 5
export const AMB_FIREFLY = 6
export const AMB_BUBBLE = 7
export const AMB_DRIP = 8
export const AMB_SMOKE = 9
export const AMB_PETAL = 10
export const AMB_BUTTERFLY = 11
export const AMB_GLINT = 12

function key(k: string): number {
  return RPG_PALETTE.keys.indexOf(k)
}

export const AREA_DARK = new Float32Array(AREA_COUNT)
AREA_DARK[AREA_BARROW] = 0.56
AREA_DARK[AREA_SALTREACH] = 0.44
AREA_DARK[AREA_ASHFORGE] = 0.4
AREA_DARK[AREA_CITADEL] = 0.42
AREA_DARK[AREA_SHRINE] = 0.36

export const AREA_MOTE_KIND = new Uint8Array(AREA_COUNT)
export const AREA_MOTE_RATE = new Float32Array(AREA_COUNT)
export const AREA_MOTE_COLOR = new Uint8Array(AREA_COUNT)
export const AREA_MOTE_ALT = new Uint8Array(AREA_COUNT)

function motes(area: number, kind: number, rate: number, color: string, alt: string): void {
  AREA_MOTE_KIND[area] = kind
  AREA_MOTE_RATE[area] = rate
  AREA_MOTE_COLOR[area] = key(color)
  AREA_MOTE_ALT[area] = key(alt)
}

motes(AREA_BRENNHOLD, AMB_MOTE, 0.12, 'U', '4')
motes(AREA_VALDMERE, AMB_MOTE, 0.12, 'U', '4')
motes(AREA_BARROW, AMB_MOTE, 0.22, '&', 'p')
motes(AREA_SALTREACH, AMB_DRIP, 0.25, 'O', 'Z')
motes(AREA_ASHFORGE, AMB_EMBER, 0.6, 'T', 'A')
motes(AREA_VELLIN, AMB_PETAL, 0.45, 'Q', 'W')
motes(AREA_CITADEL, AMB_MOTE, 0.3, 'z', 'a')
motes(AREA_SHRINE, AMB_GLINT, 0.25, 'Z', 'W')

export const CORRUPT_MOTE_COLOR = key('z')
export const CORRUPT_MOTE_ALT = key('a')
export const COLOR_LEAF = key('2')
export const COLOR_LEAF_DARK = key('u')
export const COLOR_ASH = key('n')
export const COLOR_RAIN = key('P')
export const COLOR_MIST = key('q')
export const COLOR_FIREFLY = key('4')
export const COLOR_SMOKE = key('p')
export const COLOR_WING = key('W')
export const COLOR_WING_ALT = key('A')
export const COLOR_BIRD = key('c')
export const COLOR_BIRD_BELLY = key('h')
export const COLOR_WINDOW = key('#')
export const COLOR_RIM = key('F')

function mix(n: number): number {
  let h = Math.imul(n ^ (n >>> 16), 0x45d9f3b)
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

export function weatherAt(cycle: number, seed: number, ember: boolean): number {
  if (cycle <= 0) return WEATHER_BREEZY
  const h = mix(Math.imul(cycle, 2654435761) ^ seed ^ 0x5bd1e995)
  if (ember) return h < 0.15 ? WEATHER_CLEAR : h < 0.45 ? WEATHER_BREEZY : h < 0.75 ? WEATHER_RAIN : WEATHER_MIST
  return h < 0.4 ? WEATHER_CLEAR : h < 0.65 ? WEATHER_BREEZY : h < 0.85 ? WEATHER_RAIN : WEATHER_MIST
}

function outdoor(s: State): boolean {
  return s.area >= 0 && s.area < AREA_COUNT && AREA_OUTDOOR[s.area]! !== 0
}

export function weatherFor(s: State): number {
  if (!outdoor(s)) return WEATHER_CLEAR
  return weatherAt(Math.floor(s.tick / WEATHER_SPAN), s.seed, s.chapter >= CH_EMBER)
}

export function weatherAmount(s: State, kind: number): number {
  if (!outdoor(s)) return kind === WEATHER_CLEAR ? 1 : 0
  const cycle = Math.floor(s.tick / WEATHER_SPAN)
  const into = s.tick - cycle * WEATHER_SPAN
  const f = into >= WEATHER_FADE ? 1 : into / WEATHER_FADE
  const ember = s.chapter >= CH_EMBER
  return (weatherAt(cycle, s.seed, ember) === kind ? f : 0) + (weatherAt(cycle - 1, s.seed, ember) === kind ? 1 - f : 0)
}

export function ashAmount(s: State): number {
  return outdoor(s) && s.chapter >= CH_EMBER ? 1 : 0
}
