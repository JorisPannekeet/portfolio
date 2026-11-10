import { PALETTE_HEX, PALETTE_KEYS } from './palette.ts'

function color(key: string): string {
  const index = PALETTE_KEYS.indexOf(key)
  if (index < 0) throw new Error(`no palette key ${key}`)
  return PALETTE_HEX[index]!
}

export const INK = color('0')
export const PANEL = color('2')
export const LINE = color('3')
export const STEEL = color('5')
export const ARMOR = color('W')
export const ARMOR_DIM = color('s')
export const CORE = color('R')
export const CORE_DEEP = color('r')
export const AMBER = color('A')
export const AMBER_DEEP = color('a')
export const PALE = color('Y')
export const CYAN = color('C')
export const CYAN_DEEP = color('c')
export const GREEN = color('G')
export const HOSTILE = color('+')
export const HOSTILE_CORE = color('*')
export const HOSTILE_DEEP = color('v')
export const ARMOR_SHADE = color('g')
export const ZONE_COLOR: readonly string[] = [color('s'), color('z'), color('6'), color('E')]
export const ZONE_MAP_COLOR: readonly string[] = [color('4'), color('y'), color('8'), color('F')]
export const ZONE_GROUND: readonly string[] = [color('1'), color('y'), color('9'), color('p')]
