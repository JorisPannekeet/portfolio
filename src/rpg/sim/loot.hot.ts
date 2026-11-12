import {
  AFFIX_SLOTS,
  AREA_ELEMENT,
  ELEMENT_COUNT,
  ENEMY_BOSS_FIRST,
  ENEMY_KIND_COUNT,
  EV_ITEM_GAIN,
  EV_LEVEL_UP,
  EV_LOOT_DROP,
  EV_PICKUP,
  INV_CAP,
  ITEM_BASE_COUNT,
  ITEM_GREATSWORD,
  ITEM_SWORD,
  LOOT_GOLD,
  LOOT_HEART,
  LOOT_ITEM,
  LOOT_ORE,
  LOOT_RUNE,
  MAX_LEVEL,
  OBJ_LOOT,
  SET_NONE,
  SET_PIECES,
  SLOT_HELM,
  SLOT_WEAPON,
  TIER_COUNT,
  TIER_LEGENDARY,
  armorBase,
  itemSlot,
  scrapOre,
} from './content.ts'
import type { State } from './state.ts'
import { rngFloat, rngInt } from '../../game/sim/prng.hot.ts'
import { AREAS } from './areas.ts'
import { emit } from './events.hot.ts'
import {
  AFFIX_COUNT_BY_TIER,
  AFFIX_HI,
  AFFIX_LO,
  ARMOR_AFFIXES,
  BOSS_GOLD_PILES,
  BOSS_SET,
  BOSS_TIER,
  DROP_GOLD_CHANCE,
  DROP_GREATSWORD_CHANCE,
  DROP_HEART_CHANCE,
  DROP_ITEM_CHANCE,
  DROP_ITEM_ELITE_BONUS,
  DROP_ITEM_NIGHT_BONUS,
  DROP_ORE_CHANCE,
  DROP_RUNE_ELITE_CHANCE,
  DROP_SCATTER,
  DROP_SET_CHANCE,
  DROP_TIER_NIGHT_UPGRADE,
  DROP_WEAPON_CHANCE,
  ELITE_GOLD_MULT,
  ELITE_XP_MULT,
  ENEMY_GOLD,
  ENEMY_XP,
  HEART_HEAL,
  HP_PER_LEVEL,
  LOOT_ITEM_TIER_BITS,
  ORE_DROP,
  TIER_WEIGHTS,
  TIER_WEIGHT_ROWS,
  WEAPON_AFFIXES,
  xpForLevel,
} from './loot-tables.ts'
import { recomputeStats } from './stats.hot.ts'
import { fireStory } from './story.hot.ts'
import { TRG_BOSS } from './story-table.ts'
import { blocksWalk, isNight, placeObject } from './world.hot.ts'

function hasAffix(s: State, index: number, affix: number, upto: number): boolean {
  for (let k = 0; k < upto; k++) if (s.invAffix[index * AFFIX_SLOTS + k] === affix) return true
  return false
}

export function rollAffixes(s: State, index: number): void {
  for (let k = 0; k < AFFIX_SLOTS; k++) {
    s.invAffix[index * AFFIX_SLOTS + k] = -1
    s.invAffixValue[index * AFFIX_SLOTS + k] = 0
  }
  const tier = s.invTier[index]!
  const weapon = itemSlot(s.invBase[index]!) === SLOT_WEAPON
  const pool = weapon ? WEAPON_AFFIXES : ARMOR_AFFIXES
  const count = AFFIX_COUNT_BY_TIER[tier]!
  for (let k = 0; k < count; k++) {
    let pick = rngInt(s, pool.length)
    while (hasAffix(s, index, pool[pick]!, k)) pick = (pick + 1) % pool.length
    const affix = pool[pick]!
    const lo = AFFIX_LO[affix * TIER_COUNT + tier]!
    const hi = AFFIX_HI[affix * TIER_COUNT + tier]!
    s.invAffix[index * AFFIX_SLOTS + k] = affix
    s.invAffixValue[index * AFFIX_SLOTS + k] = lo + rngInt(s, hi - lo + 1)
  }
}

export function grantItem(s: State, base: number, tier: number): number {
  if (base < 0 || base >= ITEM_BASE_COUNT || tier < 0 || tier >= TIER_COUNT) return -1
  let index = -1
  for (let i = 0; i < INV_CAP; i++) {
    if (s.invBase[i]! < 0) {
      index = i
      break
    }
  }
  if (index < 0) {
    const ore = scrapOre(tier, 0)
    s.ore += ore
    emit(s, EV_PICKUP, LOOT_ORE, ore, s.playerX, s.playerY)
    return -1
  }
  s.invBase[index] = base
  s.invTier[index] = tier
  s.invLevel[index] = 0
  s.invRune[index] = -1
  rollAffixes(s, index)
  emit(s, EV_ITEM_GAIN, index, tier, s.playerX, s.playerY)
  return index
}

export function addXp(s: State, amount: number): void {
  if (s.level >= MAX_LEVEL) return
  s.xp += amount
  let leveled = false
  while (s.level < MAX_LEVEL && s.xp >= xpForLevel(s.level)) {
    s.xp -= xpForLevel(s.level)
    s.level++
    s.skillPoints++
    leveled = true
    emit(s, EV_LEVEL_UP, s.level, 0, s.playerX, s.playerY)
  }
  if (s.level >= MAX_LEVEL) s.xp = 0
  if (!leveled) return
  recomputeStats(s)
  s.hp = Math.min(s.statMaxHp, s.hp + HP_PER_LEVEL)
}

function progress(s: State): number {
  let n = 0
  for (let e = 0; e < ELEMENT_COUNT; e++) if ((s.shards & (1 << e)) !== 0) n++
  return n < TIER_WEIGHT_ROWS ? n : TIER_WEIGHT_ROWS - 1
}

function rollTier(s: State, elite: number): number {
  const row = progress(s) * TIER_COUNT
  let total = 0
  for (let t = 0; t < TIER_COUNT; t++) total += TIER_WEIGHTS[row + t]!
  let roll = rngInt(s, total)
  let tier = 0
  for (let t = 0; t < TIER_COUNT; t++) {
    roll -= TIER_WEIGHTS[row + t]!
    if (roll < 0) {
      tier = t
      break
    }
  }
  if (elite !== 0) tier++
  if (isNight(s) && rngFloat(s) < DROP_TIER_NIGHT_UPGRADE) tier++
  return tier > TIER_LEGENDARY ? TIER_LEGENDARY : tier
}

function rollBase(s: State): number {
  if (rngFloat(s) < DROP_WEAPON_CHANCE) return rngFloat(s) < DROP_GREATSWORD_CHANCE ? ITEM_GREATSWORD : ITEM_SWORD
  const slot = SLOT_HELM + rngInt(s, SET_PIECES)
  const element = AREA_ELEMENT[s.area]!
  let set = SET_NONE
  if (rngFloat(s) < DROP_SET_CHANCE) set = element >= 0 ? element + 1 : 1 + rngInt(s, ELEMENT_COUNT)
  return armorBase(set, slot)
}

function dropLoot(s: State, type: number, amount: number, tier: number, x: number, y: number): void {
  let dx = x + rngInt(s, DROP_SCATTER * 2 + 1) - DROP_SCATTER
  let dy = y + rngInt(s, DROP_SCATTER * 2 + 1) - DROP_SCATTER
  if (blocksWalk(s, dx, dy) !== 0) {
    dx = x
    dy = y
  }
  emit(s, EV_LOOT_DROP, type, tier, dx, dy)
  if (placeObject(s, OBJ_LOOT, dx, dy, type, amount, -1) >= 0) return
  if (type === LOOT_ITEM) grantItem(s, amount >> LOOT_ITEM_TIER_BITS, tier)
  else if (type === LOOT_GOLD) s.gold += amount
  else if (type === LOOT_ORE) s.ore += amount
  else if (type === LOOT_RUNE) s.runes[amount] = Math.min(255, s.runes[amount]! + 1)
}

function dropItem(s: State, base: number, tier: number, x: number, y: number): void {
  dropLoot(s, LOOT_ITEM, (base << LOOT_ITEM_TIER_BITS) | tier, tier, x, y)
}

export function onEnemyKilled(s: State, index: number): void {
  const kind = s.eKind[index]!
  if (kind >= ENEMY_KIND_COUNT) return
  const elite = s.eElite[index]!
  const x = s.eX[index]!
  const y = s.eY[index]!
  addXp(s, ENEMY_XP[kind]! * (elite !== 0 ? ELITE_XP_MULT : 1))
  const gold = ENEMY_GOLD[kind]! * (elite !== 0 ? ELITE_GOLD_MULT : 1)
  if (kind >= ENEMY_BOSS_FIRST) {
    const flag = AREAS[s.area]!.bossFlag[s.areaVariant === 1 ? 1 : 0]!
    if (flag >= 0) s.flags[flag] = 1
    for (let k = 0; k < BOSS_GOLD_PILES; k++) dropLoot(s, LOOT_GOLD, Math.floor(gold / BOSS_GOLD_PILES), 0, x, y)
    const set = BOSS_SET[kind]!
    const tier = Math.min(TIER_LEGENDARY, BOSS_TIER[kind]! + elite + rngInt(s, 2))
    const base = set === SET_NONE ? (rngInt(s, 2) === 0 ? ITEM_SWORD : ITEM_GREATSWORD) : armorBase(set, SLOT_HELM + rngInt(s, SET_PIECES))
    dropItem(s, base, tier, x, y)
    fireStory(s, TRG_BOSS, kind)
    return
  }
  if (rngFloat(s) < DROP_HEART_CHANCE) dropLoot(s, LOOT_HEART, HEART_HEAL, 0, x, y)
  if (rngFloat(s) < DROP_GOLD_CHANCE) dropLoot(s, LOOT_GOLD, gold, 0, x, y)
  if (rngFloat(s) < DROP_ORE_CHANCE) dropLoot(s, LOOT_ORE, ORE_DROP, 0, x, y)
  let itemChance = DROP_ITEM_CHANCE
  if (elite !== 0) itemChance += DROP_ITEM_ELITE_BONUS
  if (isNight(s)) itemChance += DROP_ITEM_NIGHT_BONUS
  if (rngFloat(s) < itemChance) dropItem(s, rollBase(s), rollTier(s, elite), x, y)
  if (elite !== 0 && rngFloat(s) < DROP_RUNE_ELITE_CHANCE) dropLoot(s, LOOT_RUNE, rngInt(s, ELEMENT_COUNT), 0, x, y)
}
