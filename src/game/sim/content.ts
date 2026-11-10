export const TICK_HZ = 60
export const RUN_TICKS = 8 * 60 * TICK_HZ
export const GAME_VERSION = 1

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
export const PLAYER_PICKUP_RADIUS = 30
export const PLAYER_IFRAMES = 30

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
    damage: [10, 12, 14, 17, 20, 24, 40],
    cooldown: [60, 55, 50, 45, 40, 35, 30],
    amount: [1, 1, 2, 2, 3, 3, 4],
    area: [4, 4, 4, 5, 5, 5, 9],
    pierce: [1, 1, 1, 2, 2, 3, 99],
    duration: [90, 90, 90, 90, 90, 90, 90],
  },
  {
    pairedPassive: PASSIVE_SERVOS,
    speed: 0,
    damage: [14, 17, 20, 24, 28, 33, 55],
    cooldown: [80, 76, 72, 68, 64, 60, 50],
    amount: [1, 1, 1, 1, 2, 2, 2],
    area: [44, 48, 52, 58, 64, 70, 92],
    pierce: [99, 99, 99, 99, 99, 99, 99],
    duration: [8, 8, 8, 8, 8, 8, 10],
  },
  {
    pairedPassive: PASSIVE_AUTOLOADER,
    speed: 6,
    damage: [5, 6, 7, 8, 9, 10, 14],
    cooldown: [10, 10, 9, 9, 8, 8, 5],
    amount: [1, 1, 1, 2, 2, 2, 3],
    area: [3, 3, 3, 3, 3, 3, 4],
    pierce: [1, 1, 1, 1, 1, 2, 3],
    duration: [40, 40, 40, 40, 40, 40, 50],
  },
  {
    pairedPassive: PASSIVE_MULTILOCK,
    speed: 3,
    damage: [18, 22, 26, 30, 35, 40, 60],
    cooldown: [150, 140, 130, 120, 110, 100, 70],
    amount: [1, 2, 2, 3, 3, 4, 6],
    area: [26, 28, 30, 34, 38, 42, 60],
    pierce: [1, 1, 1, 1, 1, 1, 1],
    duration: [180, 180, 180, 180, 180, 180, 180],
  },
  {
    pairedPassive: PASSIVE_NEURAL,
    speed: 4,
    damage: [8, 10, 12, 14, 16, 19, 30],
    cooldown: [180, 170, 160, 150, 140, 130, 0],
    amount: [2, 2, 3, 3, 4, 4, 6],
    area: [40, 42, 44, 48, 52, 56, 70],
    pierce: [99, 99, 99, 99, 99, 99, 99],
    duration: [240, 240, 270, 270, 300, 300, 0],
  },
  {
    pairedPassive: PASSIVE_REACTOR,
    speed: 0,
    damage: [4, 5, 6, 7, 8, 10, 16],
    cooldown: [30, 30, 28, 28, 26, 24, 18],
    amount: [1, 1, 1, 1, 1, 1, 1],
    area: [34, 38, 42, 46, 50, 56, 76],
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

export const ENEMY_SCOUT = 0
export const ENEMY_GRUNT = 1
export const ENEMY_STRIKER = 2
export const ENEMY_TANK = 3
export const ENEMY_HEAVY = 4
export const ENEMY_ACE = 5
export const ENEMY_DREADNOUGHT = 6
export const ENEMY_COUNT = 7

export const ENEMY_HP: readonly number[] = [6, 14, 10, 60, 140, 90, 2500]
export const ENEMY_SPEED: readonly number[] = [0.75, 0.5, 1.1, 0.32, 0.42, 0.9, 0.4]
export const ENEMY_DAMAGE: readonly number[] = [4, 6, 6, 10, 14, 12, 25]
export const ENEMY_RADIUS: readonly number[] = [5, 7, 6, 9, 10, 8, 20]
export const ENEMY_GEM: readonly number[] = [0, 0, 0, 1, 1, 1, 2]
export const ENEMY_HP_GROWTH_PER_MINUTE = 0.25

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

export const XP_BASE = 5
export const XP_PER_LEVEL = 4

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
  { interval: 50, floor: 8, batch: 1, pool: [ENEMY_SCOUT] },
  { interval: 40, floor: 14, batch: 2, pool: [ENEMY_SCOUT, ENEMY_SCOUT, ENEMY_GRUNT] },
  { interval: 36, floor: 22, batch: 2, pool: [ENEMY_SCOUT, ENEMY_GRUNT] },
  { interval: 32, floor: 30, batch: 3, pool: [ENEMY_GRUNT, ENEMY_GRUNT, ENEMY_STRIKER] },
  { interval: 28, floor: 40, batch: 3, pool: [ENEMY_GRUNT, ENEMY_STRIKER, ENEMY_SCOUT] },
  { interval: 26, floor: 55, batch: 4, pool: [ENEMY_GRUNT, ENEMY_STRIKER, ENEMY_TANK] },
  { interval: 24, floor: 70, batch: 4, pool: [ENEMY_GRUNT, ENEMY_GRUNT, ENEMY_TANK, ENEMY_STRIKER] },
  { interval: 22, floor: 90, batch: 5, pool: [ENEMY_STRIKER, ENEMY_TANK, ENEMY_GRUNT] },
  { interval: 20, floor: 110, batch: 5, pool: [ENEMY_GRUNT, ENEMY_TANK, ENEMY_HEAVY, ENEMY_STRIKER] },
  { interval: 18, floor: 140, batch: 6, pool: [ENEMY_STRIKER, ENEMY_HEAVY, ENEMY_GRUNT, ENEMY_ACE] },
  { interval: 16, floor: 170, batch: 6, pool: [ENEMY_TANK, ENEMY_HEAVY, ENEMY_ACE, ENEMY_GRUNT] },
  { interval: 14, floor: 200, batch: 7, pool: [ENEMY_STRIKER, ENEMY_ACE, ENEMY_HEAVY, ENEMY_GRUNT] },
  { interval: 12, floor: 240, batch: 8, pool: [ENEMY_ACE, ENEMY_HEAVY, ENEMY_TANK, ENEMY_STRIKER] },
  { interval: 10, floor: 290, batch: 9, pool: [ENEMY_ACE, ENEMY_HEAVY, ENEMY_STRIKER] },
  { interval: 8, floor: 350, batch: 10, pool: [ENEMY_ACE, ENEMY_HEAVY, ENEMY_TANK] },
  { interval: 6, floor: 420, batch: 12, pool: [ENEMY_ACE, ENEMY_HEAVY, ENEMY_STRIKER, ENEMY_TANK] },
]

export const BOSS_TICKS: readonly number[] = [4 * 60 * TICK_HZ, 7 * 60 * TICK_HZ]

export const CHOICE_COUNT = 3
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
