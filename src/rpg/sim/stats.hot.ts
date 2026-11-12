import {
  AFFIX_ARMOR,
  AFFIX_ATTACK,
  AFFIX_CRIT,
  AFFIX_FOCUS_GAIN,
  AFFIX_GALE,
  AFFIX_HP,
  AFFIX_PARRY,
  AFFIX_SLOTS,
  AFFIX_STAMINA_REGEN,
  CH_EMBER,
  ELEMENT_COUNT,
  ITEM_GREATSWORD,
  NODE_STEEL_EDGE,
  NODE_STEEL_MASTERY,
  NODE_STEEL_POISE,
  NODE_TIDE_FLOW,
  NODE_VALUE,
  RUNE_DAMAGE_PCT,
  SET_NONE,
  SLOT_COUNT,
  SLOT_HELM,
  SLOT_WEAPON,
  itemPower,
  itemSet,
} from './content.ts'
import type { State } from './state.ts'
import {
  BASE_FOCUS,
  BASE_FOCUS_GAIN,
  BASE_HP,
  BASE_PARRY_TICKS,
  BASE_STAMINA,
  BASE_STAMINA_REGEN,
  HP_PER_LEVEL,
  PERCENT,
  UNARMED_ATTACK,
  VIGIL_HP,
} from './loot-tables.ts'

const SET_UNDECIDED = -1

function power(s: State, index: number): number {
  return itemPower(s.invBase[index]!, s.invTier[index]!, s.invLevel[index]!)
}

function nodeBonus(s: State, node: number): number {
  return s.nodes[node] !== 0 ? NODE_VALUE[node]! : 0
}

export function recomputeStats(s: State): void {
  let attack = 0
  let armor = 0
  let hp = 0
  let parry = 0
  let regen = 0
  let focusGain = 0
  let crit = 0
  let twoHanded = 0
  let weapon = false
  for (let e = 0; e < ELEMENT_COUNT; e++) s.statElement[e] = 0
  let set = SET_UNDECIDED
  for (let slot = 0; slot < SLOT_COUNT; slot++) {
    const index = s.equipped[slot]!
    if (index < 0 || s.invBase[index]! < 0) {
      if (slot >= SLOT_HELM) set = SET_NONE
      continue
    }
    const base = s.invBase[index]!
    if (slot === SLOT_WEAPON) {
      weapon = true
      attack += power(s, index)
      if (base === ITEM_GREATSWORD) twoHanded = 1
    } else {
      armor += power(s, index)
      const pieceSet = itemSet(base)
      set = set === SET_UNDECIDED || set === pieceSet ? pieceSet : SET_NONE
    }
    if (s.invRune[index]! >= 0) s.statElement[s.invRune[index]!] = s.statElement[s.invRune[index]!]! + RUNE_DAMAGE_PCT / PERCENT
    for (let k = 0; k < AFFIX_SLOTS; k++) {
      const affix = s.invAffix[index * AFFIX_SLOTS + k]!
      const value = s.invAffixValue[index * AFFIX_SLOTS + k]!
      if (affix < 0) continue
      if (affix <= AFFIX_GALE) s.statElement[affix] = s.statElement[affix]! + value / PERCENT
      else if (affix === AFFIX_PARRY) parry += value
      else if (affix === AFFIX_HP) hp += value
      else if (affix === AFFIX_STAMINA_REGEN) regen += value
      else if (affix === AFFIX_FOCUS_GAIN) focusGain += value
      else if (affix === AFFIX_ATTACK) attack += value
      else if (affix === AFFIX_ARMOR) armor += value
      else if (affix === AFFIX_CRIT) crit += value
    }
  }
  if (!weapon) attack += UNARMED_ATTACK
  s.statSet = set === SET_UNDECIDED ? SET_NONE : set
  s.statAttack = attack * (1 + nodeBonus(s, NODE_STEEL_EDGE) / PERCENT)
  s.statArmor = armor
  s.statMaxHp = BASE_HP + HP_PER_LEVEL * (s.level - 1) + (s.chapter >= CH_EMBER ? VIGIL_HP : 0) + hp
  s.statMaxStamina = BASE_STAMINA + nodeBonus(s, NODE_STEEL_POISE)
  s.statMaxFocus = BASE_FOCUS
  s.statParryTicks = BASE_PARRY_TICKS + parry + nodeBonus(s, NODE_TIDE_FLOW)
  s.statStaminaRegen = BASE_STAMINA_REGEN * (1 + regen / PERCENT)
  s.statFocusGain = BASE_FOCUS_GAIN + focusGain / PERCENT
  s.statCrit = (crit + nodeBonus(s, NODE_STEEL_MASTERY)) / PERCENT
  s.statTwoHanded = twoHanded
  if (s.hp > s.statMaxHp) s.hp = s.statMaxHp
  if (s.stamina > s.statMaxStamina) s.stamina = s.statMaxStamina
  if (s.focus > s.statMaxFocus) s.focus = s.statMaxFocus
}
