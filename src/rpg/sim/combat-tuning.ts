import {
  ELEMENT_EMBER,
  ELEMENT_GALE,
  ELEMENT_NONE,
  ELEMENT_STONE,
  ELEMENT_TIDE,
  PROJ_ARROW,
  PROJ_BOLT,
  PROJ_EMBER,
  PROJ_TIDE,
  PROJ_WAVE,
  SCRIPT_NONE,
  SCRIPT_VAREK_COLOSSUS,
  SCRIPT_VAREK_ELEMENTS,
} from './content.ts'

function table(values: readonly number[]): Float64Array {
  return Float64Array.from(values)
}

export const PLAYER_RADIUS = 5
export const WALK_SPEED = 1.5
export const MOUNT_SPEED = 2.6
export const GUARD_SPEED = 0.55
export const ATTACK_DRIFT = 0.35
export const BOW_DRIFT = 0.5
export const HURT_TICKS = 14
export const HURT_IFRAMES = 24
export const DEATH_TICKS = 60

export const DODGE_TICKS = 16
export const DODGE_SPEED = 3.2
export const DODGE_IFRAMES = 12
export const DODGE_COST = 20
export const DASH_TICKS = 20
export const DASH_SPEED = 4.4
export const DASH_IFRAMES = 16
export const SLIPSTREAM_REACH = 4

export const STANCE_PLAIN = 4
export const MAX_COMBO = 4
export const COMBO_GRACE = 18
export const COMBO_LENGTH = table([3, 3, 3, 3, 3])
export const STRIKE_POINT = 0.7

const MOVES_WINDUP = [
  12, 14, 18, 0,
  8, 8, 10, 0,
  5, 5, 6, 8,
  6, 6, 8, 0,
  8, 8, 12, 0,
]
const MOVES_ACTIVE = [
  6, 6, 8, 0,
  5, 5, 6, 0,
  4, 4, 4, 6,
  4, 4, 6, 0,
  5, 5, 6, 0,
]
const MOVES_RECOVERY = [
  16, 18, 26, 0,
  12, 12, 18, 0,
  8, 8, 10, 16,
  9, 9, 16, 0,
  12, 12, 20, 0,
]
const MOVES_DAMAGE = [
  1.2, 1.4, 2.2, 0,
  0.9, 1, 1.5, 0,
  0.6, 0.65, 0.75, 1.1,
  0.7, 0.75, 1, 0,
  0.9, 1, 1.4, 0,
]
const MOVES_REACH = [
  20, 20, 24, 0,
  20, 22, 24, 0,
  18, 18, 18, 22,
  20, 20, 22, 0,
  20, 20, 20, 0,
]
const MOVES_ARC = [
  200, 200, 280, 0,
  180, 180, 240, 0,
  160, 160, 180, 240,
  180, 180, 180, 0,
  190, 190, 190, 0,
]
const MOVES_STAMINA = [
  14, 16, 22, 0,
  10, 10, 14, 0,
  7, 7, 8, 12,
  8, 8, 12, 0,
  10, 10, 14, 0,
]
const MOVES_STAGGER = [
  2, 2, 3, 0,
  1, 1, 2, 0,
  1, 1, 1, 2,
  1, 1, 2, 0,
  1, 1, 2, 0,
]
const MOVES_LAUNCH = [
  0, 0, 0, 0,
  0, 0, 0, 0,
  0, 0, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 0,
]

export const MOVE_WINDUP = table(MOVES_WINDUP)
export const MOVE_ACTIVE = table(MOVES_ACTIVE)
export const MOVE_RECOVERY = table(MOVES_RECOVERY)
export const MOVE_DAMAGE = table(MOVES_DAMAGE)
export const MOVE_REACH = table(MOVES_REACH)
export const MOVE_ARC = table(MOVES_ARC)
export const MOVE_STAMINA = table(MOVES_STAMINA)
export const MOVE_STAGGER = table(MOVES_STAGGER)
export const MOVE_LAUNCH = table(MOVES_LAUNCH)

export const TWO_HANDED_DAMAGE = 1.35
export const TWO_HANDED_REACH = 1.2
export const TWO_HANDED_ARC = 1.3
export const TWO_HANDED_TIME = 1.2
export const CRIT_MULT = 1.5
export const FINISHER_MULT = 1.6
export const FINISHER_STAGGER = 3
export const FINISHER_CHILL = 240
export const FINISHER_BURN = 240
export const JUGGLE_MULT = 1.3
export const LAUNCH_TICKS = 50
export const COMBO_CHAIN_FRACTION = 0.5
export const BUF_ATTACK = 1
export const BUF_SWUNG = 2
export const ARMED_CHAIN = 1
export const FINISHER_CHAIN = 2

export const LOCK_RANGE = 170
export const LOCK_BREAK = 260
export const AIM_ASSIST_REACH = 1.6
export const AIM_ASSIST_ARC = 200
export const SHOT_SAMPLE_PX = 8

export const FOCUS_REGEN = 0.06
export const FOCUS_PER_HIT = 3
export const FOCUS_PERFECT = 30
export const FOCUS_PARRY = 35
export const SKILL_COST = 34
export const SKILL_TICKS = 24
export const SKILL_OFFSET = 14

export const HEAT_PER_HIT = 12
export const HEAT_HOLD = 90
export const HEAT_DECAY = 0.6
export const HEAT_DAMAGE = 0.5
export const ASHFORGED_HEAT = 50
export const INFERNO_RADIUS = 40

export const OUT_IGNORED = 0
export const OUT_DODGED = 1
export const OUT_HIT = 2
export const OUT_BLOCK = 3
export const OUT_PERFECT = 4
export const OUT_PARRY = 5
export const GUARD_ARC = 256

export const TIDE_PARRY_BONUS = 4
export const BLOCK_STAMINA_PER_DAMAGE = 1.6
export const STONE_BLOCK_FACTOR = 0.4
export const TWO_HANDED_LEAK = 0.5
export const PARRY_STAGGER = 70
export const COUNTER_MULT = 1.5

export const BOW_TICKS = 22
export const PLAYER_ARROW_SPEED = 5
export const PLAYER_ARROW_DAMAGE = 0.9
export const GRAPPLE_SPEED = 4
export const GRAPPLE_ARRIVE = 4

export const SKILL_RADIUS = table([40, 48, 36, 44])
export const SKILL_DAMAGE = table([2, 1.2, 1, 0.6])
export const SKILL_STAGGER = table([5, 1, 1, 1])
export const SKILL_HEAT_SCALE = 50
export const SKILL_CHILL = 180
export const SKILL_BURN = 240
export const GUST_PUSH = 6
export const ANSWER_SCALE = 0.5

export const DEFLECT_SCALE_GALE = 0.5
export const DEFLECT_SCALE_TIDE = 1
export const DEFLECT_SPEED = 1.3

export const KNOCKBACK = 2.4
export const KNOCKBACK_DECAY = 0.8
export const BOSS_KNOCKBACK = 0.2
export const GALE_KNOCKBACK = 1.6
export const CHILL_HIT = 40
export const BURN_HIT = 60
export const BURN_PERIOD = 30
export const BURN_DAMAGE = 0.25
export const FLASH_TICKS = 8
export const STONE_POISE_BONUS = 1
export const SHIELD_BLOCK = 0.1
export const SHIELD_ARC = 256
export const STAGGER_PER_POISE = 18
export const SEPARATION = 0.5
export const IDLE_COOLDOWN = 20
export const TRACK_FRACTION = 0.6
export const KEEP_AWAY = 0.55
export const CHAPTER_HP = table([1, 1, 1, 1.2, 1.2, 1.5, 1.7, 1.8, 1.8, 1.8, 1.8])
export const CHAPTER_DAMAGE = table([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
export const BOSS_DAMAGE = table([0.35, 0.3, 0.6, 0.45, 0.5])
export const ELITE_HP = 1.6
export const ELITE_DAMAGE = 1.3
export const RESIST_SCALE = 0.5
export const HOUND_EMBER_LIFE = 90

export const ENEMY_HP = table([50, 55, 100, 65, 135, 60, 50, 110, 550, 540, 1350, 1700, 3800])
export const ENEMY_TOUGHNESS = table([1, 1, 1, 1, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5])
export const ENEMY_SPEED = table([0.9, 0.8, 0.65, 1, 0.55, 1.6, 1, 0.7, 0.7, 0.6, 0.8, 0.9, 0.9])
export const ENEMY_RADIUS = table([6, 6, 7, 6, 8, 6, 6, 8, 12, 10, 12, 10, 10])
export const ENEMY_DAMAGE = table([8, 4, 14, 9, 12, 7, 8, 12, 0, 0, 0, 0, 0])
export const ENEMY_WINDUP = table([28, 36, 40, 26, 36, 18, 34, 36, 0, 0, 0, 0, 0])
export const ENEMY_STRIKE = table([8, 4, 10, 12, 10, 8, 4, 10, 0, 0, 0, 0, 0])
export const ENEMY_RECOVER = table([30, 30, 40, 34, 40, 26, 30, 36, 0, 0, 0, 0, 0])
export const ENEMY_RANGE = table([16, 110, 18, 40, 18, 26, 100, 44, 0, 0, 0, 0, 0])
export const ENEMY_AGGRO = table([120, 150, 120, 130, 110, 150, 150, 140, 240, 240, 240, 240, 260])
export const ENEMY_PROJ = table([-1, PROJ_ARROW, -1, -1, -1, -1, PROJ_BOLT, -1, -1, -1, -1, -1, -1])
export const ENEMY_POISE = table([1, 1, 2, 1, 2, 1, 1, 3, 9, 9, 9, 9, 9])
export const ENEMY_RESIST = table([ELEMENT_NONE, ELEMENT_NONE, ELEMENT_NONE, ELEMENT_NONE, ELEMENT_TIDE, ELEMENT_EMBER, ELEMENT_GALE, ELEMENT_NONE, ELEMENT_NONE, ELEMENT_NONE, ELEMENT_NONE, ELEMENT_NONE, ELEMENT_NONE])
export const ENEMY_COOLDOWN = table([40, 110, 60, 40, 50, 30, 70, 50, 50, 50, 50, 50, 50])
export const ENEMY_LUNGE = table([0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0])
export const ENEMY_ARC = table([220, 0, 220, 256, 220, 256, 0, 160, 0, 0, 0, 0, 0])
export const ENEMY_SHIELDED = table([0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
export const ENEMY_FLOATS = table([0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0])
export const ENEMY_BURNS = table([0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0])

export const ACT_MELEE = 0
export const ACT_SLAM = 1
export const ACT_VOLLEY = 2
export const ACT_RING = 3
export const ACT_CHARGE = 4
export const ACT_TELEPORT = 5
export const ACT_GUST = 6

const NO_PROJ = -1
const PATTERNS = [
  [ACT_MELEE, 40, 10, 36, 22, 34, NO_PROJ, 1, 1, 0, 256, 0],
  [ACT_SLAM, 52, 8, 44, 18, 30, PROJ_WAVE, 12, 1, 0, 1024, 2],
  [ACT_MELEE, 36, 30, 36, 18, 34, NO_PROJ, 1, 2, 20, 256, 0],
  [ACT_TELEPORT, 30, 6, 30, 12, 90, PROJ_TIDE, 5, 1, 0, 160, 2],
  [ACT_VOLLEY, 36, 40, 32, 12, 140, PROJ_TIDE, 3, 3, 16, 90, 2.2],
  [ACT_MELEE, 34, 10, 34, 18, 36, NO_PROJ, 1, 1, 0, 300, 0],
  [ACT_CHARGE, 40, 30, 40, 22, 16, NO_PROJ, 1, 1, 0, 0, 4],
  [ACT_VOLLEY, 34, 30, 34, 12, 150, PROJ_EMBER, 7, 2, 24, 260, 2.2],
  [ACT_MELEE, 38, 10, 36, 24, 30, NO_PROJ, 1, 1, 0, 256, 0],
  [ACT_CHARGE, 30, 18, 34, 18, 14, NO_PROJ, 1, 1, 0, 0, 5],
  [ACT_RING, 34, 24, 34, 10, 160, PROJ_BOLT, 12, 2, 20, 1024, 1.8],
  [ACT_GUST, 30, 40, 26, 0, 160, NO_PROJ, 1, 1, 0, 0, -1.2],
  [ACT_GUST, 26, 24, 30, 10, 50, NO_PROJ, 1, 1, 0, 0, 2.4],
  [ACT_MELEE, 30, 34, 34, 16, 30, NO_PROJ, 1, 3, 16, 220, 0],
  [ACT_MELEE, 24, 10, 30, 20, 40, NO_PROJ, 1, 1, 0, 120, 0],
  [ACT_CHARGE, 26, 14, 30, 18, 14, NO_PROJ, 1, 1, 0, 0, 4.5],
  [ACT_SLAM, 44, 8, 36, 18, 30, PROJ_WAVE, 10, 1, 0, 1024, 2.2],
  [ACT_VOLLEY, 34, 30, 30, 13, 150, PROJ_TIDE, 5, 1, 0, 140, 2.2],
  [ACT_VOLLEY, 32, 30, 30, 12, 150, PROJ_EMBER, 7, 2, 22, 240, 2.3],
  [ACT_CHARGE, 28, 16, 30, 18, 14, NO_PROJ, 1, 1, 0, 0, 5],
  [ACT_SLAM, 64, 10, 50, 30, 48, PROJ_WAVE, 16, 1, 0, 1024, 2],
  [ACT_RING, 46, 64, 40, 18, 200, PROJ_WAVE, 16, 3, 30, 1024, 1.7],
  [ACT_MELEE, 56, 12, 48, 28, 56, NO_PROJ, 1, 1, 0, 400, 0],
]

function column(index: number): Float64Array {
  return table(PATTERNS.map(row => row[index]!))
}

export const PATTERN_ACT = column(0)
export const PATTERN_WINDUP = column(1)
export const PATTERN_STRIKE = column(2)
export const PATTERN_RECOVER = column(3)
export const PATTERN_DAMAGE = column(4)
export const PATTERN_RANGE = column(5)
export const PATTERN_PROJ = column(6)
export const PATTERN_COUNT = column(7)
export const PATTERN_BURSTS = column(8)
export const PATTERN_INTERVAL = column(9)
export const PATTERN_SPREAD = column(10)
export const PATTERN_SPEED = column(11)

export const BOSS_PHASES = 3
export const SET_START = table([0, 0, 0, 3, 3, 3, 6, 6, 6, 9, 9, 9, 13, 16, 20])
export const SET_SIZE = table([3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 3, 4, 3])
export const SET_CYCLE = table([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0])
export const SET_TEMPO = table([1, 1, 1, 1, 1, 1, 1, 0.7, 0.7, 1, 1, 1, 1, 1, 1.3])
export const SET_SPEED = table([1, 1, 1, 1, 1, 1, 1, 1.3, 1.3, 1, 1, 1, 1, 1, 0.6])
export const SET_RADIUS = table([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.8])
export const SET_SCRIPT = table([
  SCRIPT_NONE, SCRIPT_NONE, SCRIPT_NONE, SCRIPT_NONE, SCRIPT_NONE, SCRIPT_NONE, SCRIPT_NONE, SCRIPT_NONE,
  SCRIPT_NONE, SCRIPT_NONE, SCRIPT_NONE, SCRIPT_NONE, SCRIPT_NONE, SCRIPT_VAREK_ELEMENTS, SCRIPT_VAREK_COLOSSUS,
])
export const BOSS_PHASE_AT = table([0.5, 0, 0.4, 0, 0.66])
export const BOSS_PHASE2_AT = table([0, 0, 0, 0, 0.33])
export const BOSS_SUMMONS = table([2, 0, 0, 0, 0])
export const SUMMON_OFFSET = 26
export const CHARGE_LIMIT = 140
export const MELEE_APPROACH = 0.8
export const BOSS_STAGGER_SCALE = 0.5

export const PROJ_RADIUS = table([3, 3, 4, 7, 4, 5])
export const PROJ_LIFE = table([120, 90, 150, 60, 120, 140])
export const PROJ_DEFLECTABLE = table([1, 0, 1, 0, 1, 1])
export const PROJ_UNBLOCKABLE = table([0, 0, 0, 1, 0, 0])
export const PROJ_PIERCES = table([0, 0, 0, 1, 0, 0])
export const PROJ_ELEMENT = table([ELEMENT_NONE, ELEMENT_NONE, ELEMENT_GALE, ELEMENT_STONE, ELEMENT_EMBER, ELEMENT_TIDE])
export const PROJ_SPEED = table([3, 5, 2.2, 2.4, 2, 2])

export const BOT_GUARD_LEAD = 4
export const BOT_HOLD_LEAD = 14
export const BOT_DODGE_LEAD = 6
export const BOT_PROJ_HORIZON = 30
export const BOT_NO_THREAT = 999
export const BOT_SKILL_RANGE = 26
export const BOT_APPROACH = 0.75
export const BOT_ATTACK_SLACK = 4
