import {
  AFFIX_COUNT,
  AFFIX_SLOTS,
  AREA_COUNT,
  AREA_SHRINE,
  CH_COUNT,
  DAY_TICKS,
  ELEMENT_COUNT,
  ENDING_SHATTER,
  FLAG_COUNT,
  INV_CAP,
  ITEM_BASE_COUNT,
  ITEM_MAX_LEVEL,
  KEY_GRAPPLE,
  KEY_LONGBOW,
  KEY_WARHAMMER,
  MAX_LEVEL,
  MELODY_COUNT,
  NODE_COUNT,
  SHRINE_COUNT,
  SLOT_COUNT,
  TIER_COUNT,
  itemSlot,
} from './content.ts'
import type { State } from './state.ts'
import { AREAS, SPAWN_SLOTS } from './areas.ts'
import { AFFIX_VALUE_MAX } from './loot-tables.ts'
import { recomputeStats } from './stats.hot.ts'

export const SAVE_VERSION = 1
const BIG = 1_000_000_000

interface Field {
  readonly key: keyof State
  readonly len: number
  readonly min: number
  readonly max: number
}

function scalar(key: keyof State, min: number, max: number): Field {
  return { key, len: 0, min, max }
}

function list(key: keyof State, len: number, min: number, max: number): Field {
  return { key, len, min, max }
}

export const SAVE_FIELDS: readonly Field[] = [
  scalar('chapter', 0, CH_COUNT - 1),
  scalar('ending', 0, ENDING_SHATTER),
  scalar('shards', 0, (1 << ELEMENT_COUNT) - 1),
  scalar('stancesUnlocked', 0, (1 << ELEMENT_COUNT) - 1),
  scalar('keyItems', 0, KEY_WARHAMMER | KEY_GRAPPLE | KEY_LONGBOW),
  scalar('melodies', 0, (1 << MELODY_COUNT) - 1),
  scalar('waystones', 0, (1 << AREA_COUNT) - 1),
  scalar('level', 1, MAX_LEVEL),
  scalar('xp', 0, BIG),
  scalar('skillPoints', 0, NODE_COUNT),
  scalar('gold', 0, BIG),
  scalar('ore', 0, BIG),
  scalar('clock', 0, DAY_TICKS - 1),
  scalar('checkpointArea', 0, AREA_COUNT - 1),
  scalar('checkpointSpawn', 0, SPAWN_SLOTS - 1),
  list('flags', FLAG_COUNT, 0, 1),
  list('nodes', NODE_COUNT, 0, 1),
  list('runes', ELEMENT_COUNT, 0, 255),
  list('equipped', SLOT_COUNT, -1, INV_CAP - 1),
  list('invBase', INV_CAP, -1, ITEM_BASE_COUNT - 1),
  list('invTier', INV_CAP, 0, TIER_COUNT - 1),
  list('invLevel', INV_CAP, 0, ITEM_MAX_LEVEL),
  list('invRune', INV_CAP, -1, ELEMENT_COUNT - 1),
  list('invAffix', INV_CAP * AFFIX_SLOTS, -1, AFFIX_COUNT - 1),
  list('invAffixValue', INV_CAP * AFFIX_SLOTS, 0, AFFIX_VALUE_MAX),
]

const OFFSET: Record<string, number> = {}
let saveLength = 1
for (const f of SAVE_FIELDS) {
  OFFSET[f.key] = saveLength
  saveLength += f.len === 0 ? 1 : f.len
}
const SAVE_LENGTH = saveLength

function fieldArray(s: State, f: Field): ArrayLike<number> & { [i: number]: number } {
  return s[f.key] as unknown as ArrayLike<number> & { [i: number]: number }
}

export function serializeProgress(s: State): string {
  const out: number[] = [SAVE_VERSION]
  for (const f of SAVE_FIELDS) {
    if (f.len === 0) out.push(s[f.key] as number)
    else {
      const arr = fieldArray(s, f)
      for (let i = 0; i < f.len; i++) out.push(arr[i]!)
    }
  }
  return JSON.stringify(out)
}

function parse(save: string): number[] | null {
  let data: unknown
  try {
    data = JSON.parse(save)
  } catch {
    return null
  }
  if (!Array.isArray(data) || data.length !== SAVE_LENGTH || data[0] !== SAVE_VERSION) return null
  for (const v of data) if (typeof v !== 'number' || !Number.isInteger(v)) return null
  return data as number[]
}

function consistent(values: number[]): boolean {
  let p = 1
  for (const f of SAVE_FIELDS) {
    const n = f.len === 0 ? 1 : f.len
    for (let i = 0; i < n; i++) if (values[p + i]! < f.min || values[p + i]! > f.max) return false
    p += n
  }
  const area = values[OFFSET.checkpointArea!]!
  const spawn = values[OFFSET.checkpointSpawn!]!
  if (area === AREA_SHRINE ? spawn >= SHRINE_COUNT : (AREAS[area]!.spawnSet & (1 << spawn)) === 0) return false
  const equipped = OFFSET.equipped!
  const invBase = OFFSET.invBase!
  for (let slot = 0; slot < SLOT_COUNT; slot++) {
    const index = values[equipped + slot]!
    if (index < 0) continue
    const base = values[invBase + index]!
    if (base < 0 || itemSlot(base) !== slot) return false
  }
  return true
}

export function restoreProgress(s: State, save: string): boolean {
  const values = parse(save)
  if (values === null || !consistent(values)) return false
  let p = 1
  const target = s as unknown as Record<string, number>
  for (const f of SAVE_FIELDS) {
    if (f.len === 0) target[f.key] = values[p++]!
    else {
      const arr = fieldArray(s, f)
      for (let i = 0; i < f.len; i++) arr[i] = values[p++]!
    }
  }
  recomputeStats(s)
  return true
}
