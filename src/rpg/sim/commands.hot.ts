import {
  AFFIX_SLOTS,
  AREA_COUNT,
  AREA_SHRINE,
  CMD_ADVANCE,
  CMD_CHOICE,
  CMD_EQUIP,
  CMD_HORN,
  CMD_LEARN,
  CMD_REFORGE,
  CMD_RESPAWN,
  CMD_SCRAP,
  CMD_SOCKET,
  CMD_UNEQUIP,
  CMD_UPGRADE,
  ELEMENT_COUNT,
  EV_FORGE,
  EV_HORN,
  EV_LEARN,
  HORN_TARGET_SHIFT,
  INV_CAP,
  ITEM_MAX_LEVEL,
  MELODY_COUNT,
  MELODY_ROADS,
  MELODY_SEALS,
  MELODY_STABLE,
  NODES_PER_TREE,
  NODE_COUNT,
  OBJ_HORSE,
  PHASE_DEAD,
  PHASE_PLAYING,
  PL_IDLE,
  SLOT_COUNT,
  SOCKET_RUNE_SHIFT,
  TIER_UNCOMMON,
  TREE_STEEL,
  forgeGold,
  forgeOre,
  itemSlot,
  scrapOre,
} from './content.ts'
import type { State } from './state.ts'
import { AREAS } from './areas.ts'
import { emit } from './events.hot.ts'
import { rollAffixes } from './loot.hot.ts'
import { openSealsNear } from './puzzles.hot.ts'
import { recomputeStats } from './stats.hot.ts'
import { advanceDialog, chooseDialog } from './story.hot.ts'
import { blocksWalk, loadArea, placeObject, setCheckpoint } from './world.hot.ts'
import { HORN_MELODY_MASK, HORN_TARGET_MASK, HORSE_CALL_OFFSET, SEAL_RANGE, SOCKET_INDEX_MASK } from './world-tuning.ts'

function hasItem(s: State, index: number): boolean {
  return index >= 0 && index < INV_CAP && s.invBase[index]! >= 0
}

function isEquipped(s: State, index: number): boolean {
  for (let slot = 0; slot < SLOT_COUNT; slot++) if (s.equipped[slot] === index) return true
  return false
}

function forgeResult(s: State, opcode: number, ok: boolean): void {
  emit(s, EV_FORGE, opcode, ok ? 1 : 0, s.playerX, s.playerY)
}

function equip(s: State, index: number): void {
  if (!hasItem(s, index)) return
  s.equipped[itemSlot(s.invBase[index]!)] = index
  recomputeStats(s)
}

function unequip(s: State, slot: number): void {
  if (slot >= SLOT_COUNT) return
  s.equipped[slot] = -1
  recomputeStats(s)
}

function scrap(s: State, index: number): void {
  if (!hasItem(s, index)) return
  if (isEquipped(s, index)) {
    forgeResult(s, CMD_SCRAP, false)
    return
  }
  s.ore += scrapOre(s.invTier[index]!, s.invLevel[index]!)
  const rune = s.invRune[index]!
  if (rune >= 0) s.runes[rune] = Math.min(255, s.runes[rune]! + 1)
  s.invBase[index] = -1
  s.invTier[index] = 0
  s.invLevel[index] = 0
  s.invRune[index] = -1
  for (let k = index * AFFIX_SLOTS; k < (index + 1) * AFFIX_SLOTS; k++) {
    s.invAffix[k] = -1
    s.invAffixValue[k] = 0
  }
  forgeResult(s, CMD_SCRAP, true)
}

function pay(s: State, gold: number, ore: number): boolean {
  if (s.gold < gold || s.ore < ore) return false
  s.gold -= gold
  s.ore -= ore
  return true
}

function upgrade(s: State, index: number): void {
  if (!hasItem(s, index)) return
  const tier = s.invTier[index]!
  const level = s.invLevel[index]!
  const ok = s.nearForge !== 0 && level < ITEM_MAX_LEVEL && pay(s, forgeGold(CMD_UPGRADE, tier, level), forgeOre(CMD_UPGRADE, tier, level))
  if (ok) {
    s.invLevel[index] = level + 1
    recomputeStats(s)
  }
  forgeResult(s, CMD_UPGRADE, ok)
}

function reforge(s: State, index: number): void {
  if (!hasItem(s, index)) return
  const tier = s.invTier[index]!
  const level = s.invLevel[index]!
  const ok = s.nearForge !== 0 && tier >= TIER_UNCOMMON && pay(s, forgeGold(CMD_REFORGE, tier, level), forgeOre(CMD_REFORGE, tier, level))
  if (ok) {
    rollAffixes(s, index)
    recomputeStats(s)
  }
  forgeResult(s, CMD_REFORGE, ok)
}

function socket(s: State, arg: number): void {
  const index = arg & SOCKET_INDEX_MASK
  const element = arg >> SOCKET_RUNE_SHIFT
  if (!hasItem(s, index) || element >= ELEMENT_COUNT) return
  const ok = s.nearForge !== 0 && s.invRune[index]! < 0 && s.runes[element]! > 0 && pay(s, forgeGold(CMD_SOCKET, s.invTier[index]!, s.invLevel[index]!), forgeOre(CMD_SOCKET, s.invTier[index]!, s.invLevel[index]!))
  if (ok) {
    s.invRune[index] = element
    s.runes[element] = s.runes[element]! - 1
    recomputeStats(s)
  }
  forgeResult(s, CMD_SOCKET, ok)
}

function learn(s: State, node: number): void {
  if (node >= NODE_COUNT || s.nodes[node] !== 0 || s.skillPoints <= 0) return
  const tree = Math.floor(node / NODES_PER_TREE)
  if (node % NODES_PER_TREE !== 0 && s.nodes[node - 1] === 0) return
  if (tree !== TREE_STEEL && (s.stancesUnlocked & (1 << tree)) === 0) return
  s.nodes[node] = 1
  s.skillPoints--
  recomputeStats(s)
  emit(s, EV_LEARN, node, 0, s.playerX, s.playerY)
}

function callHorse(s: State): boolean {
  if (AREAS[s.area]!.horse === 0 || s.mounted !== 0) return false
  let x = s.playerX + HORSE_CALL_OFFSET
  const y = s.playerY
  if (blocksWalk(s, x, y) !== 0) x = s.playerX
  for (let i = 0; i < s.objKind.length; i++) {
    if (s.objKind[i] !== OBJ_HORSE) continue
    s.objX[i] = x
    s.objY[i] = y
    return true
  }
  return placeObject(s, OBJ_HORSE, x, y, 0, 0, -1) >= 0
}

function horn(s: State, arg: number): void {
  const melody = arg & HORN_MELODY_MASK
  const target = (arg >> HORN_TARGET_SHIFT) & HORN_TARGET_MASK
  if (melody >= MELODY_COUNT || (s.melodies & (1 << melody)) === 0) return
  if (melody === MELODY_STABLE) {
    if (!callHorse(s)) return
  } else if (melody === MELODY_ROADS) {
    if (target >= AREA_COUNT || target === AREA_SHRINE || (s.waystones & (1 << target)) === 0) return
    const spawn = AREAS[target]!.waystoneSpawn
    if (spawn < 0) return
    emit(s, EV_HORN, melody, target, s.playerX, s.playerY)
    loadArea(s, target, spawn)
    setCheckpoint(s, target, spawn)
    return
  } else if (melody === MELODY_SEALS) openSealsNear(s, s.playerX, s.playerY, SEAL_RANGE)
  emit(s, EV_HORN, melody, target, s.playerX, s.playerY)
}

function respawn(s: State): void {
  s.phase = PHASE_PLAYING
  s.playerState = PL_IDLE
  s.playerTimer = 0
  s.playerCombo = 0
  s.playerChain = 0
  s.mounted = 0
  s.heat = 0
  recomputeStats(s)
  s.hp = s.statMaxHp
  s.stamina = s.statMaxStamina
  loadArea(s, s.checkpointArea, s.checkpointSpawn)
}

export function applyCommand(s: State, opcode: number, arg: number): void {
  if (opcode === CMD_ADVANCE) advanceDialog(s)
  else if (opcode === CMD_CHOICE) chooseDialog(s, arg)
  else if (opcode === CMD_RESPAWN) {
    if (s.phase === PHASE_DEAD) respawn(s)
  } else if (s.phase !== PHASE_PLAYING) return
  else if (opcode === CMD_EQUIP) equip(s, arg)
  else if (opcode === CMD_UNEQUIP) unequip(s, arg)
  else if (opcode === CMD_SCRAP) scrap(s, arg)
  else if (opcode === CMD_UPGRADE) upgrade(s, arg)
  else if (opcode === CMD_REFORGE) reforge(s, arg)
  else if (opcode === CMD_SOCKET) socket(s, arg)
  else if (opcode === CMD_LEARN) learn(s, arg)
  else if (opcode === CMD_HORN) horn(s, arg)
}
