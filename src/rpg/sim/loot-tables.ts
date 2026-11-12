import {
  AFFIX_ARMOR,
  AFFIX_ATTACK,
  AFFIX_COUNT,
  AFFIX_CRIT,
  AFFIX_EMBER,
  AFFIX_FOCUS_GAIN,
  AFFIX_GALE,
  AFFIX_HP,
  AFFIX_PARRY,
  AFFIX_STAMINA_REGEN,
  AFFIX_STONE,
  AFFIX_TIDE,
  BOSS_BARROW_KING,
  BOSS_VAREK,
  ELEMENT_EMBER,
  ELEMENT_GALE,
  ELEMENT_STONE,
  ELEMENT_TIDE,
  ENEMY_ARCHER,
  ENEMY_ASH_HOUND,
  ENEMY_CHAINED,
  ENEMY_DROWNED,
  ENEMY_FOOTMAN,
  ENEMY_GALE_WISP,
  ENEMY_KIND_COUNT,
  ENEMY_KNIGHT,
  ENEMY_WIGHT,
  ITEM_GREATSWORD,
  ITEM_SWORD,
  KEY_GRAPPLE,
  KEY_LONGBOW,
  KEY_WARHAMMER,
  SET_ASHFORGED,
  SET_BARROWGUARD,
  SET_NONE,
  SET_SKYWEAVE,
  SET_TIDEWARDEN,
  SLOT_GREAVES,
  SLOT_HELM,
  SLOT_PLATE,
  TIER_COMMON,
  TIER_COUNT,
  TIER_EPIC,
  TIER_LEGENDARY,
  TIER_RARE,
  TIER_UNCOMMON,
  armorBase,
} from './content.ts'

export const ENEMY_XP = Int16Array.from([13, 13, 29, 16, 19, 22, 26, 38, 256, 352, 448, 544, 960])
export const ENEMY_GOLD = Int16Array.from([4, 4, 9, 5, 6, 7, 8, 12, 80, 110, 140, 170, 300])
export const BOSS_SET = Int8Array.from([-1, -1, -1, -1, -1, -1, -1, -1, SET_BARROWGUARD, SET_TIDEWARDEN, SET_ASHFORGED, SET_SKYWEAVE, SET_NONE])
export const BOSS_TIER = Int8Array.from([0, 0, 0, 0, 0, 0, 0, 0, TIER_RARE, TIER_RARE, TIER_EPIC, TIER_EPIC, TIER_LEGENDARY])
if (ENEMY_XP.length !== ENEMY_KIND_COUNT || ENEMY_GOLD.length !== ENEMY_KIND_COUNT || BOSS_SET.length !== ENEMY_KIND_COUNT) throw new Error('enemy loot tables must cover every kind')
if (BOSS_TIER[BOSS_BARROW_KING] !== TIER_RARE || BOSS_SET[BOSS_VAREK] !== SET_NONE) throw new Error('boss tables out of order')

export const DROP_HEART_CHANCE = 0.35
export const DROP_GOLD_CHANCE = 0.55
export const DROP_ORE_CHANCE = 0.2
export const DROP_ITEM_CHANCE = 1 / 6
export const DROP_ITEM_ELITE_BONUS = 0.15
export const DROP_ITEM_NIGHT_BONUS = 0.05
export const DROP_RUNE_ELITE_CHANCE = 0.05
export const DROP_TIER_NIGHT_UPGRADE = 0.25
export const DROP_SCATTER = 8
export const HEART_HEAL = 15
export const ORE_DROP = 1
export const ELITE_XP_MULT = 2
export const ELITE_GOLD_MULT = 2
export const BOSS_GOLD_PILES = 3
export const LOOT_ITEM_TIER_BITS = 3
export const LOOT_ITEM_TIER_MASK = 7

export const TIER_WEIGHTS = Uint8Array.from([
  70, 25, 5, 0, 0,
  50, 35, 13, 2, 0,
  30, 40, 24, 5, 1,
  15, 35, 35, 12, 3,
  5, 25, 40, 23, 7,
])
export const TIER_WEIGHT_ROWS = 5

export const DROP_WEAPON_CHANCE = 0.3
export const DROP_GREATSWORD_CHANCE = 0.4
export const DROP_SET_CHANCE = 0.35

export const UNARMED_ATTACK = 4

export const AFFIX_COUNT_BY_TIER = Uint8Array.from([0, 1, 1, 2, 2])
export const WEAPON_AFFIXES = Int8Array.from([AFFIX_STONE, AFFIX_TIDE, AFFIX_EMBER, AFFIX_GALE, AFFIX_ATTACK, AFFIX_CRIT, AFFIX_FOCUS_GAIN])
export const ARMOR_AFFIXES = Int8Array.from([AFFIX_STONE, AFFIX_TIDE, AFFIX_EMBER, AFFIX_GALE, AFFIX_PARRY, AFFIX_HP, AFFIX_STAMINA_REGEN, AFFIX_ARMOR, AFFIX_FOCUS_GAIN])

const AFFIX_BASE_LO = [4, 4, 4, 4, 1, 5, 5, 5, 1, 2, 2]
const AFFIX_BASE_HI = [8, 8, 8, 8, 1, 10, 10, 10, 3, 4, 4]
const AFFIX_TIER_STEP = 0.5
export const AFFIX_LO = new Int16Array(AFFIX_COUNT * TIER_COUNT)
export const AFFIX_HI = new Int16Array(AFFIX_COUNT * TIER_COUNT)
for (let a = 0; a < AFFIX_COUNT; a++) {
  for (let t = 0; t < TIER_COUNT; t++) {
    const scale = 1 + AFFIX_TIER_STEP * t
    AFFIX_LO[a * TIER_COUNT + t] = Math.max(1, Math.round(AFFIX_BASE_LO[a]! * scale))
    AFFIX_HI[a * TIER_COUNT + t] = Math.max(1, Math.round(AFFIX_BASE_HI[a]! * scale))
  }
}
export const AFFIX_VALUE_MAX = 1000
export const PERCENT = 100

export function xpForLevel(level: number): number {
  return 40 + 30 * level + 6 * level * level
}
export const HP_PER_LEVEL = 6
export const VIGIL_HP = 20
export const BASE_HP = 150
export const BASE_STAMINA = 100
export const BASE_FOCUS = 100
export const BASE_PARRY_TICKS = 8
export const BASE_STAMINA_REGEN = 0.5
export const BASE_FOCUS_GAIN = 1

export const CHEST_BRENNHOLD = 0
export const CHEST_WARHAMMER = 1
export const CHEST_GRAPPLE = 2
export const CHEST_LONGBOW = 3
export const CHEST_VELLIN_CACHE = 4
export const CHEST_BARROW_ALCOVE = 5
export const CHEST_BARROW_VAULT = 6
export const CHEST_SALT_ALCOVE = 7
export const CHEST_SALT_VAULT = 8
export const CHEST_ASH_ALCOVE = 9
export const CHEST_ASH_VAULT = 10
export const CHEST_VELLIN_ALCOVE = 11
export const CHEST_VELLIN_VAULT = 12
export const CHEST_BARROW_CORRUPT = 13
export const CHEST_SALT_CORRUPT = 14
export const CHEST_CITADEL = 15
export const CHEST_VALDMERE_EAST = 16
export const CHEST_VALDMERE_SOUTH = 17
export const CHEST_SHRINE_FIRST = 18

interface ChestDef {
  readonly gold: number
  readonly ore: number
  readonly key?: number
  readonly base?: number
  readonly tier?: number
  readonly rune?: number
}

const CHESTS: readonly ChestDef[] = [
  { gold: 30, ore: 2 },
  { gold: 0, ore: 0, key: KEY_WARHAMMER, base: ITEM_SWORD, tier: TIER_UNCOMMON },
  { gold: 0, ore: 0, key: KEY_GRAPPLE, base: ITEM_SWORD, tier: TIER_RARE },
  { gold: 0, ore: 0, key: KEY_LONGBOW, base: ITEM_SWORD, tier: TIER_EPIC },
  { gold: 150, ore: 10, base: ITEM_GREATSWORD, tier: TIER_EPIC },
  { gold: 40, ore: 3, base: armorBase(SET_BARROWGUARD, SLOT_HELM), tier: TIER_UNCOMMON },
  { gold: 60, ore: 4, base: ITEM_GREATSWORD, tier: TIER_UNCOMMON },
  { gold: 60, ore: 4, base: armorBase(SET_TIDEWARDEN, SLOT_HELM), tier: TIER_RARE },
  { gold: 80, ore: 6, base: armorBase(SET_TIDEWARDEN, SLOT_GREAVES), tier: TIER_RARE },
  { gold: 90, ore: 6, base: armorBase(SET_ASHFORGED, SLOT_HELM), tier: TIER_EPIC },
  { gold: 120, ore: 8, rune: ELEMENT_EMBER },
  { gold: 100, ore: 8, base: armorBase(SET_SKYWEAVE, SLOT_HELM), tier: TIER_EPIC },
  { gold: 150, ore: 10, rune: ELEMENT_GALE },
  { gold: 100, ore: 8, base: armorBase(SET_BARROWGUARD, SLOT_PLATE), tier: TIER_EPIC, rune: ELEMENT_STONE },
  { gold: 120, ore: 10, base: armorBase(SET_TIDEWARDEN, SLOT_PLATE), tier: TIER_EPIC, rune: ELEMENT_TIDE },
  { gold: 200, ore: 15, base: ITEM_SWORD, tier: TIER_LEGENDARY },
  { gold: 60, ore: 5, base: armorBase(SET_NONE, SLOT_GREAVES), tier: TIER_UNCOMMON },
  { gold: 80, ore: 6, base: ITEM_SWORD, tier: TIER_RARE },
  { gold: 100, ore: 10, base: ITEM_GREATSWORD, tier: TIER_EPIC, rune: ELEMENT_STONE },
  { gold: 120, ore: 12, base: armorBase(SET_SKYWEAVE, SLOT_GREAVES), tier: TIER_EPIC, rune: ELEMENT_TIDE },
  { gold: 150, ore: 14, base: ITEM_SWORD, tier: TIER_LEGENDARY, rune: ELEMENT_GALE },
]
const CHEST_COUNT = CHESTS.length
export const CHEST_GOLD = Int16Array.from(CHESTS, c => c.gold)
export const CHEST_ORE = Int16Array.from(CHESTS, c => c.ore)
export const CHEST_KEY = Int8Array.from(CHESTS, c => c.key ?? 0)
export const CHEST_BASE = Int8Array.from(CHESTS, c => c.base ?? -1)
export const CHEST_TIER = Int8Array.from(CHESTS, c => c.tier ?? TIER_COMMON)
export const CHEST_RUNE = Int8Array.from(CHESTS, c => c.rune ?? -1)
if (CHEST_COUNT !== CHEST_SHRINE_FIRST + 3) throw new Error('chest table out of order')

const SHRINE_WAVES: readonly (readonly (readonly [number, number])[])[] = [
  [[ENEMY_FOOTMAN, 4], [ENEMY_WIGHT, 4], [ENEMY_KNIGHT, 3]],
  [[ENEMY_DROWNED, 4], [ENEMY_ARCHER, 3], [ENEMY_KNIGHT, 2], [ENEMY_DROWNED, 4]],
  [[ENEMY_ASH_HOUND, 5], [ENEMY_GALE_WISP, 4], [ENEMY_KNIGHT, 3], [ENEMY_CHAINED, 2]],
]
export const SHRINE_WAVE_COUNT = Uint8Array.from(SHRINE_WAVES, w => w.length)
export const SHRINE_WAVE_STRIDE = 4
export const SHRINE_WAVE_KIND = new Int8Array(SHRINE_WAVES.length * SHRINE_WAVE_STRIDE).fill(-1)
export const SHRINE_WAVE_SIZE = new Uint8Array(SHRINE_WAVES.length * SHRINE_WAVE_STRIDE)
for (let v = 0; v < SHRINE_WAVES.length; v++) {
  const waves = SHRINE_WAVES[v]!
  if (waves.length > SHRINE_WAVE_STRIDE) throw new Error('too many shrine waves')
  for (let w = 0; w < waves.length; w++) {
    SHRINE_WAVE_KIND[v * SHRINE_WAVE_STRIDE + w] = waves[w]![0]
    SHRINE_WAVE_SIZE[v * SHRINE_WAVE_STRIDE + w] = waves[w]![1]
  }
}
export const SHRINE_RING_DX = Int16Array.from([-64, 64, 0, 0, -48, 48, -48, 48])
export const SHRINE_RING_DY = Int16Array.from([0, 0, -48, 48, -40, -40, 40, 40])
export const SHRINE_RETURN_SPAWN = 7
