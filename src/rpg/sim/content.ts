export const TICK_HZ = 60
export const TILE = 16
export const MAP_MAX_W = 96
export const MAP_MAX_H = 64
export const MAX_TILES = MAP_MAX_W * MAP_MAX_H

export const MAX_ENEMIES = 48
export const MAX_PROJECTILES = 64
export const MAX_OBJECTS = 192
export const INV_CAP = 24
export const FLAG_COUNT = 256
export const EVENT_CAP = 64

export const INPUT_IDLE = 0
export const INPUT_DIRECTIONS = 16
export const INPUT_HEADING_MASK = 31
export const IN_ATTACK = 1 << 5
export const IN_GUARD = 1 << 6
export const IN_DODGE = 1 << 7
export const IN_SKILL = 1 << 8
export const IN_INTERACT = 1 << 9
export const IN_LOCK = 1 << 10
export const IN_STANCE_SHIFT = 11
export const IN_STANCE_MASK = 7
export const IN_COMMAND = 1 << 15
export const COMMAND_OPCODE_SHIFT = 10
export const COMMAND_OPCODE_MASK = 31
export const COMMAND_ARG_MASK = 1023

export const CMD_ADVANCE = 0
export const CMD_CHOICE = 1
export const CMD_RESPAWN = 2
export const CMD_EQUIP = 3
export const CMD_UNEQUIP = 4
export const CMD_SCRAP = 5
export const CMD_UPGRADE = 6
export const CMD_REFORGE = 7
export const CMD_SOCKET = 8
export const CMD_LEARN = 9
export const CMD_HORN = 10
export const CMD_COUNT = 11
export const SOCKET_RUNE_SHIFT = 5
export const HORN_TARGET_SHIFT = 2

export const PHASE_PLAYING = 0
export const PHASE_DIALOG = 1
export const PHASE_DEAD = 2
export const PHASE_ENDED = 3

export const ELEMENT_STONE = 0
export const ELEMENT_TIDE = 1
export const ELEMENT_EMBER = 2
export const ELEMENT_GALE = 3
export const ELEMENT_COUNT = 4
export const ELEMENT_NONE = -1

export const PL_IDLE = 0
export const PL_ATTACK = 1
export const PL_GUARD = 2
export const PL_DODGE = 3
export const PL_SKILL = 4
export const PL_HURT = 5
export const PL_DEAD = 6
export const PL_BOW = 7
export const PL_GRAPPLE = 8

export const HEAT_MAX = 100

export const AREA_BRENNHOLD = 0
export const AREA_VALDMERE = 1
export const AREA_BARROW = 2
export const AREA_SALTREACH = 3
export const AREA_ASHFORGE = 4
export const AREA_VELLIN = 5
export const AREA_CITADEL = 6
export const AREA_SHRINE = 7
export const AREA_COUNT = 8
export const AREA_ELEMENT: readonly number[] = [ELEMENT_NONE, ELEMENT_NONE, ELEMENT_STONE, ELEMENT_TIDE, ELEMENT_EMBER, ELEMENT_GALE, ELEMENT_NONE, ELEMENT_NONE]

export const SHRINE_COUNT = 4

export const TILE_VOID = 0
export const TILE_FLOOR = 1
export const TILE_WALL = 2
export const TILE_GRASS = 3
export const TILE_ROAD = 4
export const TILE_TREE = 5
export const TILE_ROCK = 6
export const TILE_WATER = 7
export const TILE_ICE = 8
export const TILE_PIT = 9
export const TILE_PILLAR_SUNK = 10
export const TILE_PILLAR_RAISED = 11
export const TILE_BARRICADE = 12
export const TILE_ASH = 13
export const TILE_CRACKED = 14
export const TILE_RUBBLE = 15
export const TILE_DOOR = 16
export const TILE_DOOR_OPEN = 17
export const TILE_GATE = 18
export const TILE_GATE_OPEN = 19
export const TILE_SEAL = 20
export const TILE_SEAL_OPEN = 21
export const TILE_LAVA = 22
export const TILE_BRIDGE = 23
export const TILE_HOUSE = 24
export const TILE_CHASM = 25
export const TILE_STAIRS = 26
export const TILE_COUNT = 27

const WALK_BLOCKERS: readonly number[] = [
  TILE_VOID, TILE_WALL, TILE_TREE, TILE_ROCK, TILE_WATER, TILE_PIT, TILE_PILLAR_SUNK, TILE_BARRICADE, TILE_CRACKED,
  TILE_DOOR, TILE_GATE, TILE_SEAL, TILE_LAVA, TILE_HOUSE, TILE_CHASM,
]
const SHOT_BLOCKERS: readonly number[] = [
  TILE_VOID, TILE_WALL, TILE_TREE, TILE_ROCK, TILE_BARRICADE, TILE_CRACKED, TILE_DOOR, TILE_GATE, TILE_SEAL, TILE_HOUSE,
]

function tileMask(kinds: readonly number[]): Uint8Array {
  const mask = new Uint8Array(TILE_COUNT)
  for (const kind of kinds) mask[kind] = 1
  return mask
}

export const TILE_BLOCKS_WALK = tileMask(WALK_BLOCKERS)
export const TILE_BLOCKS_SHOT = tileMask(SHOT_BLOCKERS)

export const OBJ_NONE = 0
export const OBJ_EXIT = 1
export const OBJ_NPC = 2
export const OBJ_CHEST = 3
export const OBJ_WAYSTONE = 4
export const OBJ_FORGE = 5
export const OBJ_WINDMILL = 6
export const OBJ_SWITCH = 7
export const OBJ_GRAPPLE = 8
export const OBJ_PEDESTAL = 9
export const OBJ_KEY = 10
export const OBJ_TRIGGER = 11
export const OBJ_SHRINE = 12
export const OBJ_HORSE = 13
export const OBJ_LOOT = 14
export const OBJ_KIND_COUNT = 15

export const OBJ_IDLE = 0
export const OBJ_USED = 1

export const LOOT_GOLD = 0
export const LOOT_HEART = 1
export const LOOT_ORE = 2
export const LOOT_ITEM = 3
export const LOOT_RUNE = 4

export const NPC_MAREN = 0
export const NPC_SMITH = 1
export const NPC_CHILD = 2
export const NPC_VILLAGER = 3
export const NPC_COUNT = 4

export const ENEMY_FOOTMAN = 0
export const ENEMY_ARCHER = 1
export const ENEMY_KNIGHT = 2
export const ENEMY_WIGHT = 3
export const ENEMY_DROWNED = 4
export const ENEMY_ASH_HOUND = 5
export const ENEMY_GALE_WISP = 6
export const ENEMY_CHAINED = 7
export const ENEMY_BOSS_FIRST = 8
export const BOSS_BARROW_KING = 8
export const BOSS_DROWNED_ABBOT = 9
export const BOSS_FORGEMASTER = 10
export const BOSS_STORM_ABBESS = 11
export const BOSS_VAREK = 12
export const ENEMY_KIND_COUNT = 13
export const VAREK_PHASE_DUEL = 0
export const VAREK_PHASE_ELEMENTS = 1
export const VAREK_PHASE_COLOSSUS = 2

export const AI_IDLE = 0
export const AI_CHASE = 1
export const AI_WINDUP = 2
export const AI_STRIKE = 3
export const AI_RECOVER = 4
export const AI_STAGGER = 5
export const AI_AIR = 6

export const PROJ_ARROW = 0
export const PROJ_PLAYER_ARROW = 1
export const PROJ_BOLT = 2
export const PROJ_WAVE = 3
export const PROJ_EMBER = 4
export const PROJ_TIDE = 5
export const PROJ_KIND_COUNT = 6
export const OWNER_ENEMY = 0
export const OWNER_PLAYER = 1

export const KEY_WARHAMMER = 1
export const KEY_GRAPPLE = 2
export const KEY_LONGBOW = 4

export const MELODY_STABLE = 0
export const MELODY_ROADS = 1
export const MELODY_SEALS = 2
export const MELODY_COUNT = 3

export const SLOT_WEAPON = 0
export const SLOT_HELM = 1
export const SLOT_PLATE = 2
export const SLOT_GREAVES = 3
export const SLOT_COUNT = 4

export const TIER_COMMON = 0
export const TIER_UNCOMMON = 1
export const TIER_RARE = 2
export const TIER_EPIC = 3
export const TIER_LEGENDARY = 4
export const TIER_COUNT = 5

export const SET_NONE = 0
export const SET_BARROWGUARD = 1
export const SET_TIDEWARDEN = 2
export const SET_ASHFORGED = 3
export const SET_SKYWEAVE = 4
export const SET_COUNT = 5
export const SET_PIECES = 3
export const SET_VALUE: readonly number[] = [0, 20, 8, 25, 100]

export const ITEM_SWORD = 0
export const ITEM_GREATSWORD = 1
export const ITEM_ARMOR_FIRST = 2
export const ITEM_BASE_COUNT = ITEM_ARMOR_FIRST + SET_COUNT * SET_PIECES
export const ITEM_NONE = -1

export function armorBase(set: number, slot: number): number {
  return ITEM_ARMOR_FIRST + set * SET_PIECES + slot - SLOT_HELM
}

export function itemSlot(base: number): number {
  return base < ITEM_ARMOR_FIRST ? SLOT_WEAPON : SLOT_HELM + ((base - ITEM_ARMOR_FIRST) % SET_PIECES)
}

export function itemSet(base: number): number {
  return base < ITEM_ARMOR_FIRST ? SET_NONE : Math.floor((base - ITEM_ARMOR_FIRST) / SET_PIECES)
}

export const AFFIX_NONE = -1
export const AFFIX_STONE = 0
export const AFFIX_TIDE = 1
export const AFFIX_EMBER = 2
export const AFFIX_GALE = 3
export const AFFIX_PARRY = 4
export const AFFIX_HP = 5
export const AFFIX_STAMINA_REGEN = 6
export const AFFIX_FOCUS_GAIN = 7
export const AFFIX_ATTACK = 8
export const AFFIX_ARMOR = 9
export const AFFIX_CRIT = 10
export const AFFIX_COUNT = 11
export const AFFIX_SLOTS = 2
export const ITEM_MAX_LEVEL = 5

export const TREE_STEEL = 4
export const TREE_COUNT = 5
export const NODES_PER_TREE = 4
export const NODE_COUNT = TREE_COUNT * NODES_PER_TREE
export const NODE_STONE_BULWARK = 0
export const NODE_STONE_AFTERSHOCK = 1
export const NODE_STONE_ROOTED = 2
export const NODE_STONE_ANSWER = 3
export const NODE_TIDE_FLOW = 4
export const NODE_TIDE_RIPTIDE = 5
export const NODE_TIDE_UNDERTOW = 6
export const NODE_TIDE_STILLWATER = 7
export const NODE_EMBER_KINDLE = 8
export const NODE_EMBER_STOKE = 9
export const NODE_EMBER_FLASHFIRE = 10
export const NODE_EMBER_INFERNO = 11
export const NODE_GALE_TAILWIND = 12
export const NODE_GALE_UPDRAFT = 13
export const NODE_GALE_SLIPSTREAM = 14
export const NODE_GALE_EYE = 15
export const NODE_STEEL_EDGE = 16
export const NODE_STEEL_POISE = 17
export const NODE_STEEL_FINISHER = 18
export const NODE_STEEL_MASTERY = 19
export const NODE_VALUE: readonly number[] = [50, 40, 100, 50, 4, 50, 200, 40, 50, 50, 1, 30, 40, 50, 60, 100, 15, 25, 50, 10]
export const MAX_LEVEL = NODE_COUNT + 1

export const CH_RAID = 0
export const CH_FLEE = 1
export const CH_BARROW = 2
export const CH_TIDE = 3
export const CH_VIGIL = 4
export const CH_EMBER = 5
export const CH_GALE = 6
export const CH_REVEAL = 7
export const CH_CITADEL = 8
export const CH_CHOICE = 9
export const CH_ENDED = 10
export const CH_COUNT = 11

export const GOAL_REACH_CHILD = 0
export const GOAL_TALK_MAREN = 1
export const GOAL_BARROW = 2
export const GOAL_TAKE_SHARD = 3
export const GOAL_SALTREACH = 4
export const GOAL_ASHFORGE = 5
export const GOAL_VELLIN = 6
export const GOAL_RETURN_MAREN = 7
export const GOAL_CITADEL = 8
export const GOAL_CHOICE = 9
export const GOAL_COUNT = 10
export const GUIDE_NONE = -1

export const ENDING_NONE = 0
export const ENDING_REFORGE = 1
export const ENDING_SHATTER = 2

export const SCRIPT_NONE = -1
export const SCRIPT_INTRO = 0
export const SCRIPT_WAKING = 1
export const SCRIPT_MAREN_ROAD = 2
export const SCRIPT_BARROW_KING = 3
export const SCRIPT_STONE_SHARD = 4
export const SCRIPT_TWIST = 5
export const SCRIPT_SALTREACH = 6
export const SCRIPT_TIDE_SHARD = 7
export const SCRIPT_VIGIL = 8
export const SCRIPT_ASHFORGE = 9
export const SCRIPT_EMBER_SHARD = 10
export const SCRIPT_VELLIN = 11
export const SCRIPT_GALE_SHARD = 12
export const SCRIPT_REVEAL = 13
export const SCRIPT_VAREK_DUEL = 14
export const SCRIPT_VAREK_ELEMENTS = 15
export const SCRIPT_VAREK_COLOSSUS = 16
export const SCRIPT_CHOICE = 17
export const SCRIPT_END_REFORGE = 18
export const SCRIPT_END_SHATTER = 19
export const SCRIPT_SMITH = 20
export const SCRIPT_SHRINE = 21
export const SCRIPT_SHRINE_DONE = 22
export const SCRIPT_CORRUPTED = 23
export const SCRIPT_MAREN_HINT = 24
export const SCRIPT_COUNT = 25
export const SCRIPT_LENGTH: readonly number[] = [4, 5, 4, 2, 3, 5, 3, 3, 6, 3, 3, 3, 3, 6, 3, 2, 2, 3, 4, 4, 2, 2, 1, 2, 1]
export const SCRIPT_ENDS_IN_CHOICE: readonly number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]

export const DAY_TICKS = 6 * 60 * TICK_HZ
export const NIGHT_START_TICKS = Math.floor(DAY_TICKS * 0.6)

export const EV_SWING = 1
export const EV_HIT = 2
export const EV_PLAYER_HURT = 3
export const EV_BLOCK = 4
export const EV_PERFECT_BLOCK = 5
export const EV_PARRY = 6
export const EV_DODGE = 7
export const EV_SKILL = 8
export const EV_STANCE = 9
export const EV_FINISHER = 10
export const EV_ENEMY_DIE = 11
export const EV_TELEGRAPH = 12
export const EV_SHOOT = 13
export const EV_DEFLECT = 14
export const EV_BOSS_PHASE = 15
export const EV_DEAD = 16
export const EV_LOOT_DROP = 17
export const EV_PICKUP = 18
export const EV_ITEM_GAIN = 19
export const EV_LEVEL_UP = 20
export const EV_PUZZLE = 21
export const EV_DOOR = 22
export const EV_CHEST = 23
export const EV_AREA = 24
export const EV_SAVE = 25
export const EV_HORN = 26
export const EV_SHARD = 27
export const EV_KEY_ITEM = 28
export const EV_FORGE = 29
export const EV_VIGIL = 30
export const EV_ENDING = 31
export const EV_MOUNT = 32
export const EV_LEARN = 33
export const EV_DIALOG = 34
export const EV_COUNT = 35

export const ITEM_SLOT_POWER: readonly number[] = [10, 3, 6, 4]
export const ITEM_TIER_POWER: readonly number[] = [100, 130, 170, 220, 280]
export const ITEM_LEVEL_POWER_PCT = 12
export const GREATSWORD_POWER_PCT = 140
export const RUNE_DAMAGE_PCT = 15

export function itemPower(base: number, tier: number, level: number): number {
  const scale = base === ITEM_GREATSWORD ? GREATSWORD_POWER_PCT : 100
  const slot = ITEM_SLOT_POWER[itemSlot(base)] ?? 0
  return Math.round((slot * scale * (ITEM_TIER_POWER[tier] ?? 0) * (100 + level * ITEM_LEVEL_POWER_PCT)) / 1000000)
}

export function forgeGold(opcode: number, tier: number, level: number): number {
  if (opcode === CMD_UPGRADE) return 40 * (tier + 1) * (level + 1)
  if (opcode === CMD_REFORGE) return 30 * (tier + 1)
  if (opcode === CMD_SOCKET) return 50
  return 0
}

export function forgeOre(opcode: number, tier: number, level: number): number {
  if (opcode === CMD_UPGRADE) return 2 * (tier + 1) * (level + 1)
  if (opcode === CMD_REFORGE) return tier + 1
  return 0
}

export function scrapOre(tier: number, level: number): number {
  return 2 * (tier + 1) + level
}
