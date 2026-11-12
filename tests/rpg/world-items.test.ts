import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  AFFIX_SLOTS,
  AREA_BARROW,
  BOSS_BARROW_KING,
  CMD_EQUIP,
  CMD_LEARN,
  CMD_REFORGE,
  CMD_SCRAP,
  CMD_SOCKET,
  CMD_UNEQUIP,
  CMD_UPGRADE,
  ELEMENT_EMBER,
  ELEMENT_TIDE,
  ENEMY_FOOTMAN,
  EV_FORGE,
  EVENT_CAP,
  INV_CAP,
  ITEM_GREATSWORD,
  ITEM_MAX_LEVEL,
  ITEM_SWORD,
  LOOT_ITEM,
  MAX_LEVEL,
  NODE_EMBER_KINDLE,
  NODE_EMBER_STOKE,
  NODE_STEEL_EDGE,
  NODE_STEEL_POISE,
  NODE_TIDE_FLOW,
  OBJ_LOOT,
  SET_BARROWGUARD,
  SET_NONE,
  SLOT_GREAVES,
  SLOT_HELM,
  SLOT_PLATE,
  SLOT_WEAPON,
  SOCKET_RUNE_SHIFT,
  TIER_COMMON,
  TIER_COUNT,
  TIER_EPIC,
  TIER_LEGENDARY,
  TIER_RARE,
  RUNE_DAMAGE_PCT,
  armorBase,
  forgeGold,
  forgeOre,
  itemPower,
  itemSet,
  scrapOre,
} from '../../src/rpg/sim/content.ts'
import { applyCommand } from '../../src/rpg/sim/commands.hot.ts'
import { flagId } from '../../src/rpg/sim/flags.ts'
import {
  AFFIX_COUNT_BY_TIER,
  AFFIX_HI,
  HP_PER_LEVEL,
  AFFIX_LO,
  LOOT_ITEM_TIER_BITS,
  LOOT_ITEM_TIER_MASK,
  xpForLevel,
} from '../../src/rpg/sim/loot-tables.ts'
import { addXp, grantItem, onEnemyKilled } from '../../src/rpg/sim/loot.hot.ts'
import { createState } from '../../src/rpg/sim/state.ts'
import { loadArea } from '../../src/rpg/sim/world.hot.ts'
import { freshGame, objectsOf } from './world-helpers.ts'

test('rolled items respect the tier affix count, value ranges and no duplicate affixes', () => {
  const s = freshGame(11)
  for (let n = 0; n < 400; n++) {
    const tier = n % TIER_COUNT
    const base = n % 2 === 0 ? ITEM_SWORD : armorBase(n % 5, SLOT_HELM + (n % 3))
    s.invBase.fill(-1)
    const i = grantItem(s, base, tier)
    assert.ok(i >= 0)
    const affixes: number[] = []
    for (let k = 0; k < AFFIX_SLOTS; k++) {
      const a = s.invAffix[i * AFFIX_SLOTS + k]!
      if (a < 0) continue
      affixes.push(a)
      const v = s.invAffixValue[i * AFFIX_SLOTS + k]!
      assert.ok(v >= AFFIX_LO[a * TIER_COUNT + tier]! && v <= AFFIX_HI[a * TIER_COUNT + tier]!)
    }
    assert.equal(affixes.length, AFFIX_COUNT_BY_TIER[tier])
    assert.equal(new Set(affixes).size, affixes.length)
  }
})

test('loot rolls are deterministic per seed', () => {
  const roll = (seed: number): number[] => {
    const s = freshGame(seed)
    for (let n = 0; n < 30; n++) {
      s.eKind[0] = ENEMY_FOOTMAN
      s.eElite[0] = n % 2
      s.eX[0] = 200
      s.eY[0] = 200
      onEnemyKilled(s, 0)
    }
    return [...s.invAffix, ...s.invAffixValue, ...s.objArg, ...s.objData, s.xp, s.level]
  }
  assert.deepEqual(roll(3), roll(3))
  assert.notDeepEqual(roll(3), roll(4))
})

test('a full inventory auto-scraps new items into ore', () => {
  const s = freshGame()
  for (let i = 0; i < INV_CAP; i++) if (s.invBase[i]! < 0) grantItem(s, ITEM_SWORD, TIER_COMMON)
  const ore = s.ore
  assert.equal(grantItem(s, ITEM_GREATSWORD, TIER_EPIC), -1)
  assert.equal(s.ore, ore + scrapOre(TIER_EPIC, 0))
})

test('bosses set their flag and drop a Rare or better piece of their set', () => {
  const s = freshGame(2)
  loadArea(s, AREA_BARROW, 0)
  s.eKind[0] = BOSS_BARROW_KING
  s.eX[0] = 400
  s.eY[0] = 100
  onEnemyKilled(s, 0)
  assert.equal(s.flags[flagId('BOSS_BARROW')], 1)
  const items = objectsOf(s, OBJ_LOOT, LOOT_ITEM)
  assert.equal(items.length, 1)
  const data = s.objData[items[0]!]!
  assert.ok((data & LOOT_ITEM_TIER_MASK) >= TIER_RARE)
  assert.equal(itemSet(data >> LOOT_ITEM_TIER_BITS), SET_BARROWGUARD)
})

test('the xp curve levels up with a skill point each level and caps at MAX_LEVEL', () => {
  const s = freshGame()
  const hp = s.statMaxHp
  addXp(s, xpForLevel(1))
  assert.equal(s.level, 2)
  assert.equal(s.skillPoints, 1)
  assert.equal(s.statMaxHp, hp + HP_PER_LEVEL)
  addXp(s, 10_000_000)
  assert.equal(s.level, MAX_LEVEL)
  assert.equal(s.skillPoints, MAX_LEVEL - 1)
  let total = 0
  for (let l = 1; l < 14; l++) total += xpForLevel(l)
  assert.ok(total > 6000 && total < 12000, 'level 14 takes a full playthrough of xp: ' + total)
})

function forgeOk(s: ReturnType<typeof freshGame>): number {
  return s.evType[(s.evHead - 1) % EVENT_CAP] === EV_FORGE ? s.evB[(s.evHead - 1) % EVENT_CAP]! : -1
}

test('upgrades cost gold and ore, need the forge, and stop at ITEM_MAX_LEVEL', () => {
  const s = freshGame()
  const sword = s.equipped[SLOT_WEAPON]!
  s.gold = 100_000
  s.ore = 10_000
  applyCommand(s, CMD_UPGRADE, sword)
  assert.equal(forgeOk(s), 0, 'refused away from the forge')
  s.nearForge = 1
  const attack = s.statAttack
  for (let level = 0; level < ITEM_MAX_LEVEL; level++) {
    const gold = s.gold
    const ore = s.ore
    applyCommand(s, CMD_UPGRADE, sword)
    assert.equal(forgeOk(s), 1)
    assert.equal(gold - s.gold, forgeGold(CMD_UPGRADE, TIER_COMMON, level))
    assert.equal(ore - s.ore, forgeOre(CMD_UPGRADE, TIER_COMMON, level))
    assert.equal(s.statAttack, itemPower(ITEM_SWORD, TIER_COMMON, level + 1))
  }
  assert.equal(s.invLevel[sword], ITEM_MAX_LEVEL)
  assert.ok(s.statAttack > attack)
  applyCommand(s, CMD_UPGRADE, sword)
  assert.equal(forgeOk(s), 0)
  s.gold = 0
  const other = grantItem(s, ITEM_SWORD, TIER_COMMON)
  applyCommand(s, CMD_UPGRADE, other)
  assert.equal(forgeOk(s), 0, 'refused without gold')
})

test('reforge rerolls affixes for a price and refuses Common gear', () => {
  const s = freshGame(8)
  s.nearForge = 1
  s.gold = 10_000
  s.ore = 1000
  applyCommand(s, CMD_REFORGE, s.equipped[SLOT_WEAPON]!)
  assert.equal(forgeOk(s), 0)
  const epic = grantItem(s, ITEM_SWORD, TIER_EPIC)
  const seen = new Set<string>()
  for (let n = 0; n < 8; n++) {
    applyCommand(s, CMD_REFORGE, epic)
    assert.equal(forgeOk(s), 1)
    seen.add(String([...s.invAffix.slice(epic * 2, epic * 2 + 2), ...s.invAffixValue.slice(epic * 2, epic * 2 + 2)]))
  }
  assert.ok(seen.size > 1)
})

test('socketing consumes a runestone and adds element damage; a socket holds one rune', () => {
  const s = freshGame()
  s.nearForge = 1
  s.gold = 1000
  const sword = s.equipped[SLOT_WEAPON]!
  applyCommand(s, CMD_SOCKET, sword | (ELEMENT_EMBER << SOCKET_RUNE_SHIFT))
  assert.equal(forgeOk(s), 0, 'no runestone owned')
  s.runes[ELEMENT_EMBER] = 2
  applyCommand(s, CMD_SOCKET, sword | (ELEMENT_EMBER << SOCKET_RUNE_SHIFT))
  assert.equal(forgeOk(s), 1)
  assert.equal(s.runes[ELEMENT_EMBER], 1)
  assert.ok(s.statElement[ELEMENT_EMBER]! > 0.1)
  applyCommand(s, CMD_SOCKET, sword | (ELEMENT_EMBER << SOCKET_RUNE_SHIFT))
  assert.equal(forgeOk(s), 0)
})

test('the forge charges exactly what the UI shows, and gear power is the UI number', () => {
  const s = freshGame(4)
  s.nearForge = 1
  s.gold = 100_000
  s.ore = 10_000
  s.runes[ELEMENT_TIDE] = 1
  const blade = grantItem(s, ITEM_GREATSWORD, TIER_RARE)
  const helm = grantItem(s, armorBase(SET_BARROWGUARD, SLOT_HELM), TIER_EPIC)
  for (let k = blade * AFFIX_SLOTS; k < (blade + 1) * AFFIX_SLOTS; k++) s.invAffix[k] = -1
  for (let k = helm * AFFIX_SLOTS; k < (helm + 1) * AFFIX_SLOTS; k++) s.invAffix[k] = -1
  applyCommand(s, CMD_EQUIP, blade)
  applyCommand(s, CMD_EQUIP, helm)
  for (const [op, arg, index] of [[CMD_UPGRADE, blade, blade], [CMD_REFORGE, helm, helm], [CMD_SOCKET, blade | (ELEMENT_TIDE << SOCKET_RUNE_SHIFT), blade]] as const) {
    const gold = s.gold
    const ore = s.ore
    const tier = s.invTier[index]!
    const level = s.invLevel[index]!
    applyCommand(s, op, arg)
    assert.equal(forgeOk(s), 1)
    assert.equal(gold - s.gold, forgeGold(op, tier, level), 'gold for opcode ' + op)
    assert.equal(ore - s.ore, forgeOre(op, tier, level), 'ore for opcode ' + op)
  }
  assert.equal(s.statAttack, itemPower(ITEM_GREATSWORD, TIER_RARE, 1))
  assert.ok(Math.abs(s.statElement[ELEMENT_TIDE]! - RUNE_DAMAGE_PCT / 100) < 1e-6)
  s.equipped[SLOT_PLATE] = -1
  s.equipped[SLOT_GREAVES] = -1
  for (let k = helm * AFFIX_SLOTS; k < (helm + 1) * AFFIX_SLOTS; k++) s.invAffix[k] = -1
  applyCommand(s, CMD_UNEQUIP, SLOT_WEAPON)
  assert.equal(s.statArmor, itemPower(armorBase(SET_BARROWGUARD, SLOT_HELM), TIER_EPIC, 0))
})

test('scrap refuses equipped items and turns others into ore', () => {
  const s = freshGame()
  applyCommand(s, CMD_SCRAP, s.equipped[SLOT_WEAPON]!)
  assert.equal(forgeOk(s), 0)
  const spare = grantItem(s, ITEM_SWORD, TIER_RARE)
  const ore = s.ore
  applyCommand(s, CMD_SCRAP, spare)
  assert.equal(forgeOk(s), 1)
  assert.equal(s.ore, ore + scrapOre(TIER_RARE, 0))
  assert.equal(s.invBase[spare], -1)
})

test('skill nodes need a point, the previous node, and the tree stance', () => {
  const s = freshGame()
  applyCommand(s, CMD_LEARN, NODE_STEEL_EDGE)
  assert.equal(s.nodes[NODE_STEEL_EDGE], 0, 'no points yet')
  s.skillPoints = 5
  applyCommand(s, CMD_LEARN, NODE_STEEL_POISE)
  assert.equal(s.nodes[NODE_STEEL_POISE], 0, 'needs the previous node')
  const attack = s.statAttack
  applyCommand(s, CMD_LEARN, NODE_STEEL_EDGE)
  assert.equal(s.nodes[NODE_STEEL_EDGE], 1)
  assert.ok(Math.abs(s.statAttack - attack * 1.15) < 1e-4)
  applyCommand(s, CMD_LEARN, NODE_STEEL_POISE)
  assert.equal(s.statMaxStamina, 125)
  applyCommand(s, CMD_LEARN, NODE_EMBER_KINDLE)
  assert.equal(s.nodes[NODE_EMBER_KINDLE], 0, 'Ember stance not unlocked')
  s.stancesUnlocked |= (1 << ELEMENT_EMBER) | (1 << ELEMENT_TIDE)
  applyCommand(s, CMD_LEARN, NODE_EMBER_KINDLE)
  applyCommand(s, CMD_LEARN, NODE_EMBER_STOKE)
  applyCommand(s, CMD_LEARN, NODE_TIDE_FLOW)
  assert.equal(s.nodes[NODE_EMBER_STOKE], 1)
  assert.equal(s.statParryTicks, 12)
  assert.equal(s.skillPoints, 0)
})

test('recomputeStats reflects the weapon, armor, a full set and two-handed weapons', () => {
  const s = freshGame()
  const plate = s.equipped[SLOT_PLATE]!
  assert.equal(s.statSet, SET_NONE)
  const armor = s.statArmor
  const pieces = [SLOT_HELM, SLOT_PLATE, SLOT_GREAVES].map(slot => grantItem(s, armorBase(SET_BARROWGUARD, slot), TIER_COMMON))
  applyCommand(s, CMD_EQUIP, pieces[0]!)
  applyCommand(s, CMD_EQUIP, pieces[1]!)
  assert.equal(s.statSet, SET_NONE)
  applyCommand(s, CMD_EQUIP, pieces[2]!)
  assert.equal(s.statSet, SET_BARROWGUARD)
  assert.ok(s.statArmor > armor)
  applyCommand(s, CMD_EQUIP, plate)
  assert.equal(s.statSet, SET_NONE)
  const great = grantItem(s, ITEM_GREATSWORD, TIER_LEGENDARY)
  applyCommand(s, CMD_EQUIP, great)
  assert.equal(s.statTwoHanded, 1)
  assert.ok(s.statAttack >= 39)
  applyCommand(s, CMD_UNEQUIP, SLOT_WEAPON)
  assert.equal(s.statTwoHanded, 0)
  assert.ok(s.statAttack < 6)
})

test('an upgraded Legendary late-game weapon lands in the 45-60 attack band', () => {
  const s = createState()
  s.level = 15
  s.invBase.fill(-1)
  s.invBase[0] = ITEM_SWORD
  s.invTier[0] = TIER_LEGENDARY
  s.invLevel[0] = ITEM_MAX_LEVEL
  s.equipped[SLOT_WEAPON] = 0
  s.nodes[NODE_STEEL_EDGE] = 1
  applyCommand(s, CMD_EQUIP, 0)
  assert.ok(s.statAttack >= 45 && s.statAttack <= 60, 'attack ' + s.statAttack)
})
