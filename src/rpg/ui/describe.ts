import {
  AFFIX_NONE,
  AFFIX_PARRY,
  AFFIX_SLOTS,
  AREA_BARROW,
  AREA_SALTREACH,
  AREA_SHRINE,
  BOSS_VAREK,
  CMD_REFORGE,
  CMD_SOCKET,
  CMD_UPGRADE,
  ELEMENT_COUNT,
  INV_CAP,
  EV_AREA,
  EV_FORGE,
  EV_ITEM_GAIN,
  EV_KEY_ITEM,
  EV_LEARN,
  EV_LEVEL_UP,
  EV_SAVE,
  EV_SHARD,
  EV_VIGIL,
  ITEM_GREATSWORD,
  ITEM_MAX_LEVEL,
  KEY_LONGBOW,
  NODES_PER_TREE,
  NODE_TIDE_FLOW,
  NODE_TIDE_UNDERTOW,
  NODE_VALUE,
  RUNE_DAMAGE_PCT,
  SET_NONE,
  SET_PIECES,
  SET_VALUE,
  SLOT_COUNT,
  SLOT_WEAPON,
  TICK_HZ,
  TIER_UNCOMMON,
  TREE_STEEL,
  forgeGold,
  forgeOre,
  itemPower,
  itemSet,
  itemSlot,
  scrapOre,
} from '../sim/content.ts'
import type { State } from '../sim/state.ts'
import { activeBoss } from '../render/hud.hot.ts'
import { skillCharge } from '../sim/player.hot.ts'
import type { ControlKeys, Line, Strings } from './i18n.ts'

export function fill(template: string, values: readonly (string | number)[]): string {
  return template.replace(/\{(\d)\}/g, (_, index: string) => String(values[Number(index)] ?? ''))
}

function ticksToMs(ticks: number): number {
  return Math.round((ticks * 1000) / TICK_HZ)
}

export function formatClock(ticks: number): string {
  const seconds = Math.floor(ticks / TICK_HZ)
  const hours = Math.floor(seconds / 3600)
  const mm = String(Math.floor(seconds / 60) % 60).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

export function formatLine(line: Line, name: string, keys: ControlKeys): Line {
  const swap = (text: string) => text.replace(/\{(\w+)\}/g, (match, key: string) => (key === 'name' ? name : (keys as Record<string, string>)[key] ?? match))
  return { speaker: swap(line.speaker), text: swap(line.text) }
}

export function dialogLine(t: Strings, script: number, line: number, name: string, keys: ControlKeys): Line | null {
  const raw = t.scripts[script]?.[line]
  if (!raw) return null
  const formatted = formatLine(raw, name, keys)
  return { speaker: formatted.speaker || t.narrator, text: formatted.text }
}

export function describeAffix(t: Strings, affix: number, value: number): string {
  return fill(t.affixEffect[affix] ?? '', [affix === AFFIX_PARRY ? ticksToMs(value) : value])
}

export function describeSet(t: Strings, set: number): string {
  return fill(t.setBonus[set] ?? '', [SET_VALUE[set] ?? 0])
}

export function nodeDisplayValue(node: number): number {
  const value = NODE_VALUE[node] ?? 0
  if (node === NODE_TIDE_FLOW) return ticksToMs(value)
  if (node === NODE_TIDE_UNDERTOW) return value - 100
  return value
}

export function describeNode(t: Strings, node: number): string {
  return fill(t.nodeEffect[node] ?? '', [nodeDisplayValue(node)])
}

export type NodeState = 'learned' | 'available' | 'locked'

export interface NodeStatus {
  state: NodeState
  reason: string
}

export function nodeStatus(t: Strings, s: State, node: number): NodeStatus {
  if (s.nodes[node] === 1) return { state: 'learned', reason: t.learned }
  const tree = Math.floor(node / NODES_PER_TREE)
  if (tree !== TREE_STEEL && (s.stancesUnlocked & (1 << tree)) === 0) {
    return { state: 'locked', reason: fill(t.lockedStance, [t.elementName[tree] ?? '']) }
  }
  if (node % NODES_PER_TREE > 0 && s.nodes[node - 1] !== 1) {
    return { state: 'locked', reason: fill(t.lockedPrevious, [t.nodeName[node - 1] ?? '']) }
  }
  if (s.skillPoints <= 0) return { state: 'locked', reason: t.lockedPoints }
  return { state: 'available', reason: t.available }
}

export interface ItemView {
  base: number
  tier: number
  level: number
  rune: number
  affixes: readonly number[]
  values: readonly number[]
}

export function readItem(s: State, index: number): ItemView | null {
  const base = s.invBase[index]
  if (base === undefined || base < 0) return null
  const affixes: number[] = []
  const values: number[] = []
  for (let k = 0; k < AFFIX_SLOTS; k++) {
    const affix = s.invAffix[index * AFFIX_SLOTS + k] ?? AFFIX_NONE
    if (affix === AFFIX_NONE) continue
    affixes.push(affix)
    values.push(s.invAffixValue[index * AFFIX_SLOTS + k] ?? 0)
  }
  return { base, tier: s.invTier[index] ?? 0, level: s.invLevel[index] ?? 0, rune: s.invRune[index] ?? -1, affixes, values }
}

export function powerLine(t: Strings, base: number, tier: number, level: number): string {
  return fill(itemSlot(base) === SLOT_WEAPON ? t.powerAttack : t.powerArmor, [itemPower(base, tier, level)])
}

export function runeLine(t: Strings, element: number): string {
  return fill(t.runeLine, [RUNE_DAMAGE_PCT, t.elementName[element] ?? ''])
}

export function itemName(t: Strings, item: Pick<ItemView, 'base' | 'level'>): string {
  const name = t.itemName[item.base] ?? ''
  return item.level > 0 ? `${name} ${fill(t.itemLevel, [item.level])}` : name
}

export interface ItemDescription {
  name: string
  tier: string
  slot: string
  lines: string[]
  handling: string
  set: string
  setBonus: string
}

export function describeItem(t: Strings, item: ItemView): ItemDescription {
  const lines = [powerLine(t, item.base, item.tier, item.level)]
  for (let k = 0; k < item.affixes.length; k++) lines.push(describeAffix(t, item.affixes[k]!, item.values[k] ?? 0))
  if (item.rune >= 0) lines.push(runeLine(t, item.rune))
  const slot = itemSlot(item.base)
  const set = itemSet(item.base)
  return {
    name: itemName(t, item),
    tier: t.tierName[item.tier] ?? '',
    slot: t.slotName[slot] ?? '',
    lines,
    handling: slot !== SLOT_WEAPON ? '' : item.base === ITEM_GREATSWORD ? t.twoHanded : t.swordShield,
    set: set === SET_NONE ? '' : t.setName[set] ?? '',
    setBonus: set === SET_NONE ? '' : describeSet(t, set),
  }
}

export function setPiecesWorn(s: State, set: number): number {
  let worn = 0
  for (let slot = 0; slot < SLOT_COUNT; slot++) {
    const index = s.equipped[slot] ?? -1
    const base = index >= 0 ? s.invBase[index] ?? -1 : -1
    if (base >= 0 && itemSet(base) === set) worn++
  }
  return worn
}

export function setProgress(t: Strings, s: State, set: number): string {
  return fill(t.setPieces, [setPiecesWorn(s, set), SET_PIECES])
}

export function equippedSlot(s: State, index: number): number {
  for (let slot = 0; slot < SLOT_COUNT; slot++) if (s.equipped[slot] === index) return slot
  return -1
}

export function packIndices(s: State): number[] {
  const indices: number[] = []
  for (let index = 0; index < INV_CAP; index++) if (equippedSlot(s, index) < 0) indices.push(index)
  return indices
}

export function scrapLine(t: Strings, item: ItemView): string {
  return fill(t.scrapGain, [scrapOre(item.tier, item.level)])
}

export interface ForgeOption {
  opcode: number
  element: number
  label: string
  cost: string
  before: string
  after: string
  enabled: boolean
}

function costText(t: Strings, gold: number, ore: number): string {
  return ore > 0 ? fill(t.costLine, [gold, ore]) : fill(t.costGold, [gold])
}

function affordable(s: State, gold: number, ore: number): boolean {
  return s.gold >= gold && s.ore >= ore
}

export function forgeOptions(t: Strings, s: State, item: ItemView): ForgeOption[] {
  const options: ForgeOption[] = []
  const upGold = forgeGold(CMD_UPGRADE, item.tier, item.level)
  const upOre = forgeOre(CMD_UPGRADE, item.tier, item.level)
  const maxed = item.level >= ITEM_MAX_LEVEL
  options.push({
    opcode: CMD_UPGRADE,
    element: -1,
    label: t.upgrade,
    cost: maxed ? fill(t.maxLevel, [ITEM_MAX_LEVEL]) : costText(t, upGold, upOre),
    before: powerLine(t, item.base, item.tier, item.level),
    after: maxed ? '' : powerLine(t, item.base, item.tier, item.level + 1),
    enabled: s.nearForge === 1 && !maxed && affordable(s, upGold, upOre),
  })
  const reGold = forgeGold(CMD_REFORGE, item.tier, item.level)
  const reOre = forgeOre(CMD_REFORGE, item.tier, item.level)
  const rerollable = item.tier >= TIER_UNCOMMON
  options.push({
    opcode: CMD_REFORGE,
    element: -1,
    label: t.reforge,
    cost: rerollable ? costText(t, reGold, reOre) : t.reforgeCommon,
    before: item.affixes.map((affix, k) => describeAffix(t, affix, item.values[k] ?? 0)).join(', ') || t.emptySlot,
    after: fill(t.reforgeEffect, [AFFIX_SLOTS]),
    enabled: s.nearForge === 1 && rerollable && affordable(s, reGold, reOre),
  })
  const soGold = forgeGold(CMD_SOCKET, item.tier, item.level)
  const soOre = forgeOre(CMD_SOCKET, item.tier, item.level)
  for (let element = 0; element < ELEMENT_COUNT; element++) {
    const held = s.runes[element] ?? 0
    if (held === 0) continue
    options.push({
      opcode: CMD_SOCKET,
      element,
      label: fill(t.socket, [t.elementName[element] ?? '']),
      cost: item.rune >= 0 ? t.socketFull : `${costText(t, soGold, soOre)} · ${fill(t.runesHeld, [held])}`,
      before: item.rune >= 0 ? runeLine(t, item.rune) : t.emptySlot,
      after: runeLine(t, element),
      enabled: s.nearForge === 1 && item.rune < 0 && affordable(s, soGold, soOre),
    })
  }
  return options
}

export function interactPrompt(t: Strings, kind: number): string {
  return t.objPrompt[kind] ?? ''
}

export function bossTitle(t: Strings, kind: number, phase: number): string {
  if (kind === BOSS_VAREK) return t.varekTitle[phase] ?? t.varekTitle[0]!
  return t.enemyName[kind] ?? ''
}

export function areaTitle(t: Strings, area: number, variant: number): string {
  if (area === AREA_SHRINE) return t.shrineName[variant] ?? t.areaName[area] ?? ''
  const name = t.areaName[area] ?? ''
  return variant === 1 && (area === AREA_BARROW || area === AREA_SALTREACH) ? `${t.toastCorrupted} ${name}` : name
}

export function keyItemIndex(bit: number): number {
  return Math.round(Math.log2(bit))
}

export function bitsSet(mask: number, count: number): number[] {
  const out: number[] = []
  for (let i = 0; i < count; i++) if ((mask & (1 << i)) !== 0) out.push(i)
  return out
}

export interface Hud {
  goal: number
  interact: number
  boss: number
  bossPhase: number
  stance: number
  stances: number
  longbow: boolean
  nearForge: boolean
  skill: number
}

export const SKILL_CHARGE_STEPS = 12

export const EMPTY_HUD: Hud = { goal: -1, interact: -1, boss: -1, bossPhase: 0, stance: 0, stances: 0, longbow: false, nearForge: false, skill: 0 }

export function readHud(s: State): Hud {
  const slot = activeBoss(s)
  return {
    goal: s.goal,
    interact: s.interactObj >= 0 ? s.objKind[s.interactObj] ?? -1 : -1,
    boss: slot >= 0 ? s.eKind[slot]! : -1,
    bossPhase: s.bossPhase,
    stance: s.stance,
    stances: s.stancesUnlocked,
    longbow: (s.keyItems & KEY_LONGBOW) !== 0,
    nearForge: s.nearForge === 1,
    skill: Math.floor(skillCharge(s) * SKILL_CHARGE_STEPS),
  }
}

export function sameHud(a: Hud, b: Hud): boolean {
  return (Object.keys(a) as (keyof Hud)[]).every(key => a[key] === b[key])
}

export interface ToastText {
  kind: 'area' | 'item' | 'level' | 'key' | 'shard' | 'save' | 'learn' | 'forge' | 'vigil'
  label: string
  text: string
  tier: number
  base: number
}

function toast(kind: ToastText['kind'], label: string, text: string, tier = -1, base = -1): ToastText {
  return { kind, label, text, tier, base }
}

export function toastFor(t: Strings, s: State, type: number, a: number, b: number): ToastText | null {
  switch (type) {
    case EV_AREA:
      return toast('area', t.toastArea, areaTitle(t, a, b))
    case EV_ITEM_GAIN: {
      const item = readItem(s, a)
      return item ? toast('item', `${t.toastItem} · ${t.tierName[item.tier] ?? ''}`, itemName(t, item), item.tier, item.base) : null
    }
    case EV_LEVEL_UP:
      return toast('level', fill(t.toastLevel, [a]), t.toastLevelGain)
    case EV_KEY_ITEM:
      if (a <= 0) return toast('key', t.toastKey, t.toastKeyText)
      return toast('key', t.toastKeyItem, `${t.keyItemName[keyItemIndex(a)] ?? ''}. ${t.keyItemUse[keyItemIndex(a)] ?? ''}`)
    case EV_SHARD:
      return toast('shard', fill(t.toastShardName, [t.elementName[a] ?? '']), fill(t.toastStance, [t.elementName[a] ?? '']))
    case EV_SAVE:
      return toast('save', t.toastSaved, t.areaName[s.area] ?? '')
    case EV_LEARN:
      return toast('learn', `${t.toastLearned} · ${t.nodeName[a] ?? ''}`, describeNode(t, a))
    case EV_FORGE:
      return b === 1 ? null : toast('forge', t.tabs.forge, t.forgeRefused)
    case EV_VIGIL:
      return toast('vigil', t.toastVigil, t.toastVigilText)
    default:
      return null
  }
}
