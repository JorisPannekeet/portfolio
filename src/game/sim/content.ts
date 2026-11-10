export const TICK_HZ = 60
export const RUN_TICKS = 8 * 60 * TICK_HZ
export const GAME_VERSION = 4

export const MAX_ENEMIES = 512
export const MAX_SHOTS = 256
export const MAX_GEMS = 512
export const MAX_DRONES = 8
export const EVENT_CAP = 256

export const SPAWN_RADIUS = 300
export const DESPAWN_RADIUS = 420

export const PHASE_PLAYING = 0
export const PHASE_LEVEL_UP = 1
export const PHASE_DEAD = 2
export const PHASE_WON = 3

export const INPUT_IDLE = 0
export const INPUT_DIRECTIONS = 16
export const INPUT_CHOICE = 32

export const PLAYER_SPEED = 1.25
export const PLAYER_MAX_HP = 100
export const PLAYER_RADIUS = 6
export const PLAYER_PICKUP_RADIUS = 40
export const PLAYER_IFRAMES = 40

export const WEAPON_RIFLE = 0
export const WEAPON_BLADE = 1
export const WEAPON_VULCAN = 2
export const WEAPON_MISSILE = 3
export const WEAPON_DRONE = 4
export const WEAPON_FIELD = 5
export const WEAPON_COUNT = 6
export const WEAPON_MAX_LEVEL = 6
export const WEAPON_SLOTS = 6
export const EVOLVED = 6

export const PASSIVE_TARGETING = 0
export const PASSIVE_SERVOS = 1
export const PASSIVE_AUTOLOADER = 2
export const PASSIVE_MULTILOCK = 3
export const PASSIVE_NEURAL = 4
export const PASSIVE_REACTOR = 5
export const PASSIVE_THRUSTERS = 6
export const PASSIVE_PLATING = 7
export const PASSIVE_MAGNET = 8
export const PASSIVE_COUNT = 9
export const PASSIVE_SLOTS = 6

export interface WeaponDef {
  readonly pairedPassive: number
  readonly speed: number
  readonly damage: readonly number[]
  readonly cooldown: readonly number[]
  readonly amount: readonly number[]
  readonly area: readonly number[]
  readonly pierce: readonly number[]
  readonly duration: readonly number[]
}

export const WEAPONS: readonly WeaponDef[] = [
  {
    pairedPassive: PASSIVE_TARGETING,
    speed: 5,
    damage: [18, 20, 23, 26, 30, 35, 55],
    cooldown: [40, 38, 36, 34, 32, 30, 26],
    amount: [1, 1, 2, 2, 3, 3, 4],
    area: [4, 4, 4, 5, 5, 5, 9],
    pierce: [1, 1, 1, 2, 2, 3, 99],
    duration: [90, 90, 90, 90, 90, 90, 90],
  },
  {
    pairedPassive: PASSIVE_SERVOS,
    speed: 0,
    damage: [24, 28, 33, 38, 44, 50, 80],
    cooldown: [60, 56, 52, 48, 44, 40, 34],
    amount: [1, 1, 1, 1, 2, 2, 2],
    area: [50, 54, 58, 64, 70, 76, 100],
    pierce: [99, 99, 99, 99, 99, 99, 99],
    duration: [8, 8, 8, 8, 8, 8, 10],
  },
  {
    pairedPassive: PASSIVE_AUTOLOADER,
    speed: 6,
    damage: [8, 9, 10, 12, 14, 16, 22],
    cooldown: [10, 10, 9, 9, 8, 8, 5],
    amount: [1, 1, 1, 2, 2, 2, 3],
    area: [3, 3, 3, 3, 3, 3, 4],
    pierce: [1, 1, 2, 2, 3, 3, 5],
    duration: [40, 40, 40, 40, 40, 40, 50],
  },
  {
    pairedPassive: PASSIVE_MULTILOCK,
    speed: 3,
    damage: [22, 26, 30, 35, 40, 46, 70],
    cooldown: [120, 112, 104, 96, 88, 80, 60],
    amount: [1, 2, 2, 3, 3, 4, 6],
    area: [26, 28, 30, 34, 38, 42, 60],
    pierce: [1, 1, 1, 1, 1, 1, 1],
    duration: [180, 180, 180, 180, 180, 180, 180],
  },
  {
    pairedPassive: PASSIVE_NEURAL,
    speed: 4,
    damage: [12, 14, 17, 20, 24, 28, 40],
    cooldown: [150, 140, 130, 120, 110, 100, 0],
    amount: [2, 2, 3, 3, 4, 4, 6],
    area: [56, 60, 64, 68, 72, 78, 92],
    pierce: [99, 99, 99, 99, 99, 99, 99],
    duration: [300, 300, 330, 330, 360, 360, 0],
  },
  {
    pairedPassive: PASSIVE_REACTOR,
    speed: 0,
    damage: [6, 8, 10, 12, 14, 17, 26],
    cooldown: [30, 30, 28, 28, 26, 24, 18],
    amount: [1, 1, 1, 1, 1, 1, 1],
    area: [44, 48, 52, 56, 60, 66, 90],
    pierce: [99, 99, 99, 99, 99, 99, 99],
    duration: [0, 0, 0, 0, 0, 0, 0],
  },
]

export const PASSIVE_MAX_LEVEL: readonly number[] = [5, 5, 5, 2, 5, 5, 5, 5, 5]
export const PASSIVE_DAMAGE_PER_LEVEL = 0.1
export const PASSIVE_AREA_PER_LEVEL = 0.1
export const PASSIVE_COOLDOWN_PER_LEVEL = 0.07
export const PASSIVE_AMOUNT_PER_LEVEL = 1
export const PASSIVE_XP_PER_LEVEL = 0.08
export const PASSIVE_HP_PER_LEVEL = 20
export const PASSIVE_REGEN_PER_LEVEL = 0.1
export const PASSIVE_SPEED_PER_LEVEL = 0.08
export const PASSIVE_ARMOR_PER_LEVEL = 1
export const PASSIVE_PICKUP_PER_LEVEL = 0.3

export const WEAPON_FIRST_DELAY = 15
export const MIN_COOLDOWN_TICKS = 2
export const RIFLE_RANGE = 180
export const BLADE_HEIGHT_RATIO = 0.5
export const BLADE_REPEAT_DELAY = 12
export const VULCAN_FAN_STEP = 10
export const VULCAN_JITTER: readonly number[] = [0, 6, -4, 9, -8, 3, -10, 5]
export const MISSILE_RANGE = 200
export const MISSILE_SEEK_RANGE = 220
export const MISSILE_TURN = 0.15
export const MISSILE_LAUNCH_SPEED = 0.5
export const MISSILE_FAN_STEP = 96
export const MISSILE_HIT_RADIUS = 4
export const DRONE_HIT_RADIUS = 6
export const DRONE_REHIT_TICKS = 20
export const FIELD_KNOCKBACK = 1.28

export const ENEMY_SCOUT = 0
export const ENEMY_GRUNT = 1
export const ENEMY_STRIKER = 2
export const ENEMY_TANK = 3
export const ENEMY_HEAVY = 4
export const ENEMY_ACE = 5
export const ENEMY_DREADNOUGHT = 6
export const ENEMY_BOSS_FIRST = 6
export const BOSS_COUNT = 4
export const ENEMY_COUNT = 10

export const ENEMY_HP: readonly number[] = [6, 14, 10, 45, 90, 60, 1000, 800, 1200, 1100]
export const ENEMY_SPEED: readonly number[] = [0.75, 0.5, 1.1, 0.32, 0.42, 0.9, 0.4, 0.56, 0.3, 0.38]
export const ENEMY_DAMAGE: readonly number[] = [3, 6, 6, 10, 11, 10, 18, 16, 18, 24]
export const ENEMY_RADIUS: readonly number[] = [5, 7, 6, 9, 10, 8, 20, 18, 26, 22]
export const ENEMY_GEM: readonly number[] = [0, 0, 0, 1, 1, 1, 2, 2, 2, 2]
export const ENEMY_MAX_RADIUS = 26
export const ENEMY_HP_GROWTH_PER_MINUTE = 0.1
export const ENEMY_DAMAGE_GROWTH_PER_MINUTE = 0.12
export const ENEMY_SPEED_GROWTH_PER_MINUTE = 0.03
export const ENEMY_SURGE_START_MINUTE = 5.84
export const ENEMY_HP_SURGE_PER_MINUTE_SQUARED = 1.45
export const ENEMY_DAMAGE_SURGE_PER_MINUTE_SQUARED = 1.6
export const BOSS_SURGE_SCALE = 0
export const ENEMY_FLASH_TICKS = 4
export const ENEMY_STOP_FACTOR = 0.6
export const SEPARATION_STRENGTH = 0.3
export const KNOCKBACK_DECAY = 0.82
export const BOSS_KNOCKBACK_SCALE = 0.15

export const GEM_SMALL = 0
export const GEM_MEDIUM = 1
export const GEM_LARGE = 2
export const GEM_REPAIR = 3
export const GEM_MAGNET = 4
export const GEM_KIND_COUNT = 5
export const GEM_XP: readonly number[] = [1, 5, 25, 0, 0]
export const REPAIR_HEAL = 30
export const REPAIR_DROP_CHANCE = 0.006
export const MAGNET_DROP_CHANCE = 0.002
export const GEM_PULL_SPEED = 4
export const GEM_COLLECT_RADIUS = 8

export const XP_BASE = 5
export const XP_PER_LEVEL = 7.7
export const XP_PER_LEVEL_CUBED = 0.08
export const XP_PER_LEVEL_QUARTIC = 0.0085

export const SHOT_BOLT = 0
export const SHOT_LANCE = 1
export const SHOT_VULCAN = 2
export const SHOT_MISSILE = 3
export const SHOT_KIND_COUNT = 4

export const WAVE_TICKS = 30 * TICK_HZ

export interface WaveDef {
  readonly interval: number
  readonly floor: number
  readonly batch: number
  readonly pool: readonly number[]
}

export const WAVES: readonly WaveDef[] = [
  { interval: 60, floor: 6, batch: 1, pool: [ENEMY_SCOUT] },
  { interval: 60, floor: 8, batch: 1, pool: [ENEMY_SCOUT, ENEMY_SCOUT, ENEMY_GRUNT] },
  { interval: 50, floor: 12, batch: 1, pool: [ENEMY_SCOUT, ENEMY_GRUNT] },
  { interval: 45, floor: 9, batch: 1, pool: [ENEMY_GRUNT, ENEMY_GRUNT, ENEMY_STRIKER] },
  { interval: 40, floor: 12, batch: 1, pool: [ENEMY_GRUNT, ENEMY_STRIKER, ENEMY_SCOUT] },
  { interval: 36, floor: 16, batch: 1, pool: [ENEMY_GRUNT, ENEMY_STRIKER, ENEMY_TANK] },
  { interval: 32, floor: 21, batch: 2, pool: [ENEMY_GRUNT, ENEMY_GRUNT, ENEMY_TANK, ENEMY_STRIKER] },
  { interval: 30, floor: 26, batch: 2, pool: [ENEMY_STRIKER, ENEMY_TANK, ENEMY_GRUNT] },
  { interval: 30, floor: 38, batch: 2, pool: [ENEMY_GRUNT, ENEMY_TANK, ENEMY_STRIKER, ENEMY_GRUNT] },
  { interval: 28, floor: 47, batch: 2, pool: [ENEMY_STRIKER, ENEMY_TANK, ENEMY_GRUNT, ENEMY_HEAVY] },
  { interval: 24, floor: 60, batch: 3, pool: [ENEMY_TANK, ENEMY_HEAVY, ENEMY_GRUNT, ENEMY_STRIKER] },
  { interval: 20, floor: 78, batch: 3, pool: [ENEMY_STRIKER, ENEMY_TANK, ENEMY_HEAVY, ENEMY_GRUNT] },
  { interval: 12, floor: 200, batch: 8, pool: [ENEMY_ACE, ENEMY_HEAVY, ENEMY_TANK, ENEMY_STRIKER] },
  { interval: 9, floor: 399, batch: 11, pool: [ENEMY_ACE, ENEMY_HEAVY, ENEMY_STRIKER] },
  { interval: 7, floor: 480, batch: 14, pool: [ENEMY_ACE, ENEMY_HEAVY, ENEMY_TANK] },
  { interval: 5, floor: 508, batch: 17, pool: [ENEMY_ACE, ENEMY_HEAVY, ENEMY_STRIKER, ENEMY_TANK] },
]

export const BOSS_TICKS: readonly number[] = [4 * 60 * TICK_HZ, 7 * 60 * TICK_HZ]
export const BOSS_SPAWN_RESERVE = 4
export const SPAWN_TOPUP_PER_TICK = 12
export const RECYCLE_MIN_RADIUS = 120

export const CHOICE_COUNT = 3
export const OWNED_CHOICE_WEIGHT = 3
export const CHOICE_WEAPON = 0
export const CHOICE_PASSIVE = 16
export const CHOICE_EVOLVE = 32
export const CHOICE_REPAIR = 48

export const EV_HIT = 0
export const EV_KILL = 1
export const EV_SHOOT = 2
export const EV_SLASH = 3
export const EV_BLAST = 4
export const EV_PULSE = 5
export const EV_PICKUP = 6
export const EV_HURT = 7
export const EV_LEVEL = 8
export const EV_EVOLVE = 9
export const EV_BOSS = 10
export const EV_HEAL = 11
export const EV_DEAD = 12
export const EV_WON = 13
export const EV_BEACON = 14
export const EV_ZONE = 15
export const EV_ENEMY_FIRE = 16

export const WORLD_HALF = 1024
export const ZONE_COUNT = 4
export const ZONE_HANGAR = 0
export const ZONE_SCRAPYARD = 1
export const ZONE_CRYO = 2
export const ZONE_FOUNDRY = 3

export const POI_BEACON = 0
export const POI_LAIR = 1
export const BEACONS_PER_ZONE = 2
export const MAX_POIS = ZONE_COUNT * (BEACONS_PER_ZONE + 1)
export const BEACON_RADIUS = 26
export const BEACON_CAPTURE_TICKS = 4 * TICK_HZ
export const LAIR_RADIUS = 110
export const BEACON_REWARD_HEAL = -1

export const START_X = -160
export const START_Y = -160

export const MAX_PROPS = 96
export const PROP_SLOTS_PER_ZONE = 4
export const PROP_KIND_COUNT = ZONE_COUNT * PROP_SLOTS_PER_ZONE
export const PROP_HANGAR = 0
export const PROP_GENERATOR = 1
export const PROP_FUEL_TANK = 2
export const PROP_CRATES = 3
export const PROP_HOUSE = 4
export const PROP_WRECK = 5
export const PROP_ROCK = 6
export const PROP_CACTUS = 7
export const PROP_DOME = 8
export const PROP_ICE_BOULDER = 9
export const PROP_PINE = 10
export const PROP_MAST = 11
export const PROP_POWER_PLANT = 12
export const PROP_SMELTER = 13
export const PROP_SPIRE = 14
export const PROP_PYLON = 15
export const PROP_RADIUS: readonly number[] = [30, 12, 10, 8, 20, 16, 10, 5, 20, 10, 6, 5, 28, 14, 9, 5]
export const PROPS_PER_SLOT: readonly number[] = [2, 3, 6, 8]
export const BEACON_CHARGE_RISE = 2
export const BEACON_CHARGE_DRAIN = 1
export const BEACON_CHARGE_FULL = BEACON_CAPTURE_TICKS * BEACON_CHARGE_RISE
export const POI_EDGE_MARGIN = 96
export const POI_BORDER_MARGIN = 80
export const BEACON_MIN_ORIGIN_DIST = 220
export const BEACON_MIN_SPACING = 260
export const LAIR_MIN_ORIGIN_DIST = 450
export const LAIR_MIN_BEACON_DIST = 200
export const POI_PLACE_ATTEMPTS = 64

export const PROP_MIN_GAP = 56
export const PROP_BORDER_MARGIN = PROP_MIN_GAP / 2
export const PROP_EDGE_MARGIN = PROP_MIN_GAP
export const PROP_START_CLEARANCE = 150
export const PROP_BEACON_GAP = 70
export const PROP_LAIR_CLEARANCE = 150
export const PROP_PLACE_ATTEMPTS = 96
export const PROP_SCAN_STEP = 8
export const PROP_GRID_CELL = 64
export const PROP_GRID_DIM = (2 * WORLD_HALF) / PROP_GRID_CELL
export const PROP_GRID_CELLS = PROP_GRID_DIM * PROP_GRID_DIM
export const PROP_QUERY_PAD = ENEMY_MAX_RADIUS
export const PROP_SLIDE_NUDGE = 0.5
export const GEM_PROP_CLEARANCE = 3

export const GUARD_SQUAD_SIZE: readonly number[] = [8, 12, 16, 20, 25, 30, 36, 42]
export const GUARD_RING_MIN = 130
export const GUARD_RING_SPREAD = 40
export const GUARD_ELITE_MIN_SQUAD = 8
export const GUARD_ELITE_EVERY = 3
export const GUARD_ELITE_WAVE_LOOKAHEAD = 2
export const GUARD_TANK_EVERY = 4

export const GRID_CELL = 32
export const GRID_DIM = 30
export const GRID_CELLS = GRID_DIM * GRID_DIM
export const NEAR_CAP = 8

export const HIT_EVENTS_PER_TICK = 48
export const KILL_EVENTS_PER_TICK = 64
export const PICKUP_EVENTS_PER_TICK = 32

export const BOT_SCAN_RADIUS = 110
export const BOT_LOOKAHEAD = 28
export const BOT_SOFTEN = 64
export const BOT_GEM_RADIUS = 250
export const BOT_GEM_WEIGHT = 0.02
export const BOT_BOSS_WEIGHT = 4
export const BOT_CORE_WEAPONS = 3
export const BOT_PAIR_WEAPON_LEVEL = 3
export const BOT_STEADY_BONUS = 0.004
export const BOT_THREAT_LIMIT = 0.02
export const BOT_SAFE_HP_FRACTION = 0.5
export const BOT_GOAL_WEIGHT = 0.04
export const BOT_LAIR_LEVEL = 22
export const BOT_LAIR_MARGIN = 40
export const BOT_LAIR_AVOID_WEIGHT = 0.5
export const BOT_EDGE_BAND = 160
export const BOT_EDGE_WEIGHT = 0.03
export const BOT_BEACON_LEVEL: readonly number[] = [2, 6, 10, 15, 20, 26, 32, 38]
export const BOT_BREAK_HP_FRACTION = 0.35
export const BOT_BEACON_HOLD = 30
export const BOT_BEACON_AVOID_MARGIN = 24
export const BOT_BEACON_AVOID_WEIGHT = 0.5
export const BOT_PROP_CLEARANCE = 14
export const BOT_PROP_WEIGHT = 0.2
export const BOT_DETOUR_CLEARANCE = 20

export const MAX_BULLETS = 512
export const BULLET_ORB = 0
export const BULLET_SHELL = 1
export const BULLET_SHARD = 2
export const BULLET_KIND_COUNT = 3
export const BULLET_RADIUS: readonly number[] = [4, 3, 2]
export const BULLET_DAMAGE: readonly number[] = [10, 8, 7]
export const BULLET_LIFE: readonly number[] = [520, 170, 220]
export const BULLET_DAMAGE_GROWTH_PER_MINUTE = 0.06

export const DAMAGE_CONTACT = 0
export const DAMAGE_SHELL = 1
export const DAMAGE_BOSS_BULLET = 2
export const DAMAGE_SOURCE_COUNT = 3

export const TANK_FIRE_MIN_RANGE = 60
export const TANK_FIRE_MAX_RANGE = 190
export const TANK_WINDUP_TICKS = 30
export const TANK_RELOAD_TICKS = 210
export const TANK_FIRST_RELOAD_TICKS = 60
export const TANK_RELOAD_SPREAD = 150
export const TANK_SHELL_SPEED = 1.9
export const MAX_TANKS_AIMING = 4

export const VOLLEY_FAN = 0
export const VOLLEY_RING = 1
export const VOLLEY_WALL = 2
export const AIM_PLAYER = 0
export const AIM_SPIN = 1

export interface BossVolley {
  readonly kind: number
  readonly shape: number
  readonly count: number
  readonly spread: number
  readonly arms: number
  readonly gaps: number
  readonly gapWidth: number
  readonly speed: number
  readonly aim: number
  readonly spin: number
  readonly bursts: number
  readonly interval: number
  readonly rest: number
  readonly windup: number
}

const SPIRAL = { kind: BULLET_ORB, shape: VOLLEY_FAN, count: 1, spread: 0, gaps: 0, gapWidth: 0, aim: AIM_SPIN }
const AIMED_FAN = { shape: VOLLEY_FAN, arms: 1, gaps: 0, gapWidth: 0, aim: AIM_PLAYER, spin: 0 }
const SPUN_RING = { kind: BULLET_ORB, shape: VOLLEY_RING, spread: 0, arms: 1, aim: AIM_SPIN }
const WALL = { kind: BULLET_ORB, shape: VOLLEY_WALL, arms: 1, aim: AIM_PLAYER, spin: 0 }

export const BOSS_PATTERNS: readonly (readonly (readonly BossVolley[])[])[] = [
  [
    [
      { ...SPIRAL, arms: 2, speed: 0.85, spin: 36, bursts: 20, interval: 7, rest: 40, windup: 36 },
      { ...AIMED_FAN, kind: BULLET_SHARD, count: 3, spread: 40, speed: 1.9, bursts: 2, interval: 18, rest: 50, windup: 30 },
    ],
    [
      { ...SPIRAL, arms: 3, speed: 0.85, spin: 36, bursts: 24, interval: 6, rest: 30, windup: 30 },
      { ...AIMED_FAN, kind: BULLET_SHARD, count: 3, spread: 40, speed: 1.9, bursts: 3, interval: 14, rest: 36, windup: 24 },
    ],
  ],
  [
    [
      { ...AIMED_FAN, kind: BULLET_SHARD, count: 7, spread: 26, speed: 1.7, bursts: 2, interval: 30, rest: 40, windup: 36 },
      { ...SPUN_RING, count: 24, gaps: 1, gapWidth: 3, speed: 0.9, spin: 160, bursts: 3, interval: 45, rest: 60, windup: 36 },
    ],
    [
      { ...AIMED_FAN, kind: BULLET_SHARD, count: 7, spread: 26, speed: 1.7, bursts: 3, interval: 22, rest: 30, windup: 30 },
      { ...SPUN_RING, count: 24, gaps: 1, gapWidth: 3, speed: 0.9, spin: 160, bursts: 4, interval: 36, rest: 45, windup: 30 },
    ],
  ],
  [
    [
      { ...SPUN_RING, count: 24, gaps: 0, gapWidth: 0, speed: 0.7, spin: 21, bursts: 3, interval: 40, rest: 50, windup: 40 },
      { ...WALL, count: 24, spread: 12, gaps: 2, gapWidth: 3, speed: 0.6, bursts: 1, interval: 60, rest: 80, windup: 40 },
    ],
    [
      { ...SPUN_RING, count: 24, gaps: 0, gapWidth: 0, speed: 0.7, spin: 21, bursts: 4, interval: 32, rest: 40, windup: 32 },
      { ...WALL, count: 24, spread: 12, gaps: 2, gapWidth: 3, speed: 0.6, bursts: 2, interval: 60, rest: 60, windup: 32 },
    ],
  ],
  [
    [
      { ...AIMED_FAN, kind: BULLET_SHARD, count: 3, spread: 18, speed: 2.1, bursts: 4, interval: 10, rest: 40, windup: 30 },
      { ...SPUN_RING, count: 32, gaps: 2, gapWidth: 2, speed: 1, spin: 100, bursts: 1, interval: 30, rest: 70, windup: 40 },
    ],
    [
      { ...AIMED_FAN, kind: BULLET_SHARD, count: 5, spread: 18, speed: 2.1, bursts: 5, interval: 8, rest: 30, windup: 24 },
      { ...SPUN_RING, count: 32, gaps: 2, gapWidth: 2, speed: 1, spin: 100, bursts: 2, interval: 30, rest: 50, windup: 32 },
    ],
  ],
]
export const BOSS_PHASE_COUNT = 2
export const BOSS_PHASE_TWO_FRACTION = 0.5
export const BOSS_FIRE_RANGE = 280
export const BOSS_FIRST_VOLLEY_DELAY = 60

export const BOT_BULLET_SCAN = 170
export const BOT_BULLET_HORIZON = 30
export const BOT_BULLET_MARGIN = 5
export const BOT_BULLET_WEIGHT = 0.15
export const BOT_COVER_RANGE = 300
export const BOT_COVER_SEARCH = 140
export const BOT_COVER_GAP = 6
export const BOT_COVER_WEIGHT = 0.03
