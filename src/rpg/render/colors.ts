import { RPG_PALETTE } from './palette.ts'

function index(key: string): number {
  const at = RPG_PALETTE.keys.indexOf(key)
  if (at < 0) throw new Error(`no palette key ${key}`)
  return at
}

function indices(keys: string): Uint8Array {
  return Uint8Array.from([...keys].map(index))
}

export const HEX: readonly string[] = RPG_PALETTE.hex

export const C_INK = index('0')
export const C_WHITE = index('W')
export const C_PALE = index('q')
export const C_STEEL = index('o')
export const C_STONE_DARK = index('l')
export const C_RED = index('S')
export const C_RED_DEEP = index('R')
export const C_GOLD = index('A')
export const C_GOLD_PALE = index('U')
export const C_GREEN = index('G')
export const C_TEAL = index('Y')
export const C_NIGHT = index('x')
export const C_EMBER = index('T')
export const C_RUST = index('H')
export const C_CORRUPT = index('g')
export const C_CORRUPT_GLOW = index('z')
export const C_DUST = index('&')
export const C_SKY = index('O')

export const STANCE_COLOR = indices('&NTY')
export const STANCE_DEEP = indices('eMSX')
export const STANCE_LIGHT = indices('hPUZ')
export const TIER_COLOR = indices('pGNaA')
export const LOOT_GLINT = indices('UScpz')
export const C_GLOVE = index('e')
export const STANCE_TRAIL = indices('hOAZ')
export const C_RED_LIGHT = index('T')
export const C_GREEN_LIGHT = index('I')
export const C_GREEN_DEEP = index('v')
export const C_SKY_LIGHT = index('P')
export const C_SKY_DEEP = index('N')
export const C_BRASS = index('K')
export const C_BRASS_LIGHT = index('A')
