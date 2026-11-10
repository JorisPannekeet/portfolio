import {
  CHOICE_EVOLVE,
  CHOICE_PASSIVE,
  CHOICE_REPAIR,
  EVOLVED,
  PASSIVE_AMOUNT_PER_LEVEL,
  PASSIVE_AREA_PER_LEVEL,
  PASSIVE_ARMOR_PER_LEVEL,
  PASSIVE_COOLDOWN_PER_LEVEL,
  PASSIVE_DAMAGE_PER_LEVEL,
  PASSIVE_HP_PER_LEVEL,
  PASSIVE_PICKUP_PER_LEVEL,
  PASSIVE_REGEN_PER_LEVEL,
  PASSIVE_SPEED_PER_LEVEL,
  PASSIVE_XP_PER_LEVEL,
  REPAIR_HEAL,
  TICK_HZ,
  WEAPONS,
  WEAPON_MAX_LEVEL,
} from '../sim/content.ts'
import type { Strings } from './i18n.ts'

export interface Card {
  choice: number
  name: string
  tag: string
  blurb: string
  lines: string[]
  evolution: boolean
}

type Count = keyof Strings['statCount']
type Cadence = keyof Strings['statFaster']
type Area = keyof Strings['statArea']

export interface WeaponStatMeaning {
  count: Count | null
  cadence: Cadence
  area: Area | null
  areaAtStart: boolean
  pierce: boolean
  duration: 'range' | 'uptime' | null
}

export const PIERCES_EVERYTHING = 99

export const WEAPON_STAT_MEANING: readonly WeaponStatMeaning[] = [
  { count: 'bolt', cadence: 'fire', area: 'boltSize', areaAtStart: false, pierce: true, duration: 'range' },
  { count: 'slash', cadence: 'slashes', area: 'reach', areaAtStart: true, pierce: false, duration: null },
  { count: 'round', cadence: 'fire', area: 'roundSize', areaAtStart: false, pierce: true, duration: 'range' },
  { count: 'missile', cadence: 'launches', area: 'burstRadius', areaAtStart: true, pierce: false, duration: null },
  { count: 'drone', cadence: 'redeploy', area: 'orbitRadius', areaAtStart: true, pierce: false, duration: 'uptime' },
  { count: null, cadence: 'pulses', area: 'fieldRadius', areaAtStart: true, pierce: false, duration: null },
]

export const PASSIVE_STEP: readonly (readonly number[])[] = [
  [PASSIVE_DAMAGE_PER_LEVEL * 100],
  [PASSIVE_AREA_PER_LEVEL * 100],
  [PASSIVE_COOLDOWN_PER_LEVEL * 100],
  [PASSIVE_AMOUNT_PER_LEVEL],
  [PASSIVE_XP_PER_LEVEL * 100],
  [PASSIVE_HP_PER_LEVEL, PASSIVE_REGEN_PER_LEVEL],
  [PASSIVE_SPEED_PER_LEVEL * 100],
  [PASSIVE_ARMOR_PER_LEVEL],
  [PASSIVE_PICKUP_PER_LEVEL * 100],
]

export function formatNumber(value: number): string {
  return String(Math.round(value * 100) / 100)
}

function fill(template: string, values: readonly number[]): string {
  return template.replace(/\{(\d)\}/g, (_, index: string) => formatNumber(values[Number(index)] ?? 0))
}

function signed(template: string, delta: number): string {
  return (delta > 0 ? '+' : '') + fill(template, [delta])
}

function seconds(ticks: number): number {
  return Math.round((ticks / TICK_HZ) * 10) / 10
}

function countLine(t: Strings, count: Count, value: number, withSign: boolean): string {
  const forms = t.statCount[count]
  const line = fill(Math.abs(value) === 1 ? forms[0] : forms[1], [value])
  return withSign && value > 0 ? `+${line}` : line
}

export function weaponStartLines(w: number, t: Strings): string[] {
  const def = WEAPONS[w]!
  const meaning = WEAPON_STAT_MEANING[w]!
  const lines = [fill(t.statDamage, [def.damage[0]!])]
  if (meaning.count) lines.push(countLine(t, meaning.count, def.amount[0]!, false))
  lines.push(fill(t.statInterval[meaning.cadence], [seconds(def.cooldown[0]!)]))
  if (meaning.area && meaning.areaAtStart) lines.push(fill(t.statArea[meaning.area], [def.area[0]!]))
  if (meaning.duration === 'uptime') lines.push(fill(t.statUptime, [seconds(def.duration[0]!)]))
  return lines
}

export function weaponChangeLines(w: number, from: number, to: number, t: Strings): string[] {
  const def = WEAPONS[w]!
  const meaning = WEAPON_STAT_MEANING[w]!
  const lines: string[] = []
  const permanent = meaning.duration === 'uptime' && def.duration[to] === 0
  if (permanent && def.duration[from] !== 0) lines.push(t.statNeverDocks)
  const damage = def.damage[to]! - def.damage[from]!
  if (damage !== 0) lines.push(signed(t.statDamage, damage))
  const amount = def.amount[to]! - def.amount[from]!
  if (meaning.count && amount !== 0) lines.push(countLine(t, meaning.count, amount, true))
  const before = def.cooldown[from]!
  const after = def.cooldown[to]!
  if (!permanent && after !== before) lines.push(fill(t.statFaster[meaning.cadence], [Math.max(1, Math.round(((before - after) / before) * 100))]))
  const area = def.area[to]! - def.area[from]!
  if (meaning.area && area !== 0) lines.push(signed(t.statArea[meaning.area], area))
  if (meaning.pierce) {
    if (def.pierce[to]! >= PIERCES_EVERYTHING && def.pierce[from]! < PIERCES_EVERYTHING) lines.push(t.statPiercesAll)
    else if (def.pierce[to] !== def.pierce[from]) lines.push(signed(t.statPierce, def.pierce[to]! - def.pierce[from]!))
  }
  const duration = def.duration[to]! - def.duration[from]!
  if (meaning.duration === 'range' && duration !== 0) lines.push(signed(t.statRange, duration * def.speed))
  if (meaning.duration === 'uptime' && !permanent && duration !== 0) lines.push(signed(t.statUptime, seconds(duration)))
  return lines
}

export function passiveLines(p: number, newLevel: number, t: Strings): string[] {
  const step = PASSIVE_STEP[p]!
  const lines = (t.passiveEffect[p] ?? []).map(template => fill(template, step))
  lines.push(fill(t.passiveTotal[p] ?? '', step.map(value => value * newLevel)))
  return lines
}

function levelTag(level: number, t: Strings): string {
  return level === 0 ? t.tagNew : `${t.tagLevel} ${level + 1}`
}

export function describeChoice(choice: number, weaponLevel: ArrayLike<number>, passiveLevel: ArrayLike<number>, t: Strings): Card {
  if (choice >= CHOICE_REPAIR) {
    return { choice, name: t.repairName, tag: t.tagRepair, blurb: '', lines: [fill(t.repairEffect, [REPAIR_HEAL])], evolution: false }
  }
  if (choice >= CHOICE_EVOLVE) {
    const w = choice - CHOICE_EVOLVE
    return {
      choice,
      name: t.evolvedName[w] ?? '',
      tag: t.tagEvolve,
      blurb: t.evolvedDesc[w] ?? '',
      lines: weaponChangeLines(w, WEAPON_MAX_LEVEL - 1, EVOLVED, t),
      evolution: true,
    }
  }
  if (choice >= CHOICE_PASSIVE) {
    const p = choice - CHOICE_PASSIVE
    const level = passiveLevel[p] ?? 0
    return { choice, name: t.passiveName[p] ?? '', tag: levelTag(level, t), blurb: '', lines: passiveLines(p, level + 1, t), evolution: false }
  }
  const level = weaponLevel[choice] ?? 0
  return {
    choice,
    name: t.weaponName[choice] ?? '',
    tag: levelTag(level, t),
    blurb: level === 0 ? t.weaponDesc[choice] ?? '' : '',
    lines: level === 0 ? weaponStartLines(choice, t) : weaponChangeLines(choice, level - 1, level, t),
    evolution: false,
  }
}

export function formatClock(ticks: number, tickHz: number): string {
  const seconds = Math.floor(ticks / tickHz)
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function parseSeed(search: string): number | null {
  const raw = new URLSearchParams(search).get('seed')
  if (raw === null || !/^\d{1,10}$/.test(raw)) return null
  const seed = Number(raw)
  return seed <= 0xffffffff ? seed : null
}
