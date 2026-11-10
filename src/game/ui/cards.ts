import { CHOICE_EVOLVE, CHOICE_PASSIVE, CHOICE_REPAIR } from '../sim/content.ts'
import type { Strings } from './i18n.ts'

export interface Card {
  choice: number
  name: string
  tag: string
  desc: string
  evolution: boolean
}

function levelTag(level: number, t: Strings): string {
  return level === 0 ? t.tagNew : `${t.tagLevel} ${level + 1}`
}

export function describeChoice(choice: number, weaponLevel: ArrayLike<number>, passiveLevel: ArrayLike<number>, t: Strings): Card {
  if (choice >= CHOICE_REPAIR) return { choice, name: t.repairName, tag: t.tagRepair, desc: t.repairDesc, evolution: false }
  if (choice >= CHOICE_EVOLVE) {
    const w = choice - CHOICE_EVOLVE
    return { choice, name: t.evolvedName[w] ?? '', tag: t.tagEvolve, desc: t.evolvedDesc[w] ?? '', evolution: true }
  }
  if (choice >= CHOICE_PASSIVE) {
    const p = choice - CHOICE_PASSIVE
    return { choice, name: t.passiveName[p] ?? '', tag: levelTag(passiveLevel[p] ?? 0, t), desc: t.passiveDesc[p] ?? '', evolution: false }
  }
  return { choice, name: t.weaponName[choice] ?? '', tag: levelTag(weaponLevel[choice] ?? 0, t), desc: t.weaponDesc[choice] ?? '', evolution: false }
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
