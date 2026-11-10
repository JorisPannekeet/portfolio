import {
  CHOICE_COUNT,
  EVENT_CAP,
  GRID_CELLS,
  MAX_DRONES,
  MAX_ENEMIES,
  MAX_GEMS,
  MAX_POIS,
  MAX_PROPS,
  MAX_SHOTS,
  NEAR_CAP,
  PASSIVE_COUNT,
  PHASE_PLAYING,
  PLAYER_MAX_HP,
  PROP_GRID_CELL,
  PROP_GRID_CELLS,
  PROP_QUERY_PAD,
  PROP_RADIUS,
  START_X,
  START_Y,
  WEAPON_COUNT,
  WEAPON_RIFLE,
  XP_BASE,
} from './content.ts'
import { seedRng } from './prng.hot.ts'
import { placeProps } from './props.hot.ts'
import { placePois, zoneAt } from './world.hot.ts'

const PROP_CELL_SPAN = Math.floor((2 * (Math.max(...PROP_RADIUS) + PROP_QUERY_PAD)) / PROP_GRID_CELL) + 2
const PROP_CELL_ITEMS = MAX_PROPS * PROP_CELL_SPAN * PROP_CELL_SPAN

export interface State {
  seed: number
  tick: number
  phase: number

  px: number
  py: number
  ppx: number
  ppy: number
  faceX: number
  aimX: number
  aimY: number
  hp: number
  maxHp: number
  iframes: number
  level: number
  xp: number
  xpNext: number
  kills: number

  weaponLevel: Uint8Array
  weaponEvolved: Uint8Array
  passiveLevel: Uint8Array
  choices: Uint8Array
  choiceCount: number

  enemyCount: number
  eType: Uint8Array
  ex: Float32Array
  ey: Float32Array
  epx: Float32Array
  epy: Float32Array
  eHp: Float32Array
  eFlash: Uint8Array
  bossHp: number
  bossMaxHp: number

  shotCount: number
  sKind: Uint8Array
  sx: Float32Array
  sy: Float32Array
  spx: Float32Array
  spy: Float32Array
  svx: Float32Array
  svy: Float32Array

  gemCount: number
  gKind: Uint8Array
  gx: Float32Array
  gy: Float32Array

  droneCount: number
  droneX: Float32Array
  droneY: Float32Array
  dronePx: Float32Array
  dronePy: Float32Array
  auraRadius: number

  zone: number
  poiCount: number
  poiKind: Uint8Array
  poiZone: Uint8Array
  poiDone: Uint8Array
  poiX: Float32Array
  poiY: Float32Array
  poiProgress: Float32Array
  poiGuard: Uint8Array

  propCount: number
  propKind: Uint8Array
  propX: Float32Array
  propY: Float32Array
  propCellStart: Int32Array
  propCellItems: Int32Array
  bossKills: number

  evHead: number
  evType: Uint8Array
  evX: Float32Array
  evY: Float32Array
  evA: Float32Array
  evB: Float32Array

  rngA: number
  rngB: number
  rngC: number
  rngD: number

  aimTurn: number
  pendingLevels: number
  weaponTimer: Int32Array
  bladeRepeats: number
  bladeRepeatTimer: number
  vulcanCycle: number
  droneActive: number
  droneDock: number
  droneTurn: number
  spawnTimer: number
  bossCursor: number
  nextEnemyId: number
  shotSeq: number
  hitEvents: number
  killEvents: number
  pickupEvents: number
  poiCharge: Int32Array

  eId: Int32Array
  eMaxHp: Float32Array
  eKx: Float32Array
  eKy: Float32Array
  eDroneReady: Int32Array

  sLife: Int32Array
  sDamage: Float32Array
  sPierce: Uint8Array
  sRadius: Float32Array
  sArea: Float32Array
  sLastHit: Int32Array
  sTarget: Int32Array
  sTargetId: Int32Array
  sSeq: Int32Array

  gValue: Float32Array
  gAttract: Uint8Array

  gridOx: number
  gridOy: number
  scratchCell: Int32Array
  scratchSepX: Float32Array
  scratchSepY: Float32Array
  scratchCellStart: Int32Array
  scratchCellCursor: Int32Array
  scratchCellItems: Int32Array
  scratchQuery: Int32Array
  scratchChoices: Uint8Array
  scratchNearIdx: Int32Array
  scratchNearDist: Float64Array
}

export function createState(): State {
  const s: State = {
    seed: 0,
    tick: 0,
    phase: PHASE_PLAYING,
    px: 0,
    py: 0,
    ppx: 0,
    ppy: 0,
    faceX: 1,
    aimX: 1,
    aimY: 0,
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP,
    iframes: 0,
    level: 1,
    xp: 0,
    xpNext: XP_BASE,
    kills: 0,
    weaponLevel: new Uint8Array(WEAPON_COUNT),
    weaponEvolved: new Uint8Array(WEAPON_COUNT),
    passiveLevel: new Uint8Array(PASSIVE_COUNT),
    choices: new Uint8Array(CHOICE_COUNT),
    choiceCount: 0,
    enemyCount: 0,
    eType: new Uint8Array(MAX_ENEMIES),
    ex: new Float32Array(MAX_ENEMIES),
    ey: new Float32Array(MAX_ENEMIES),
    epx: new Float32Array(MAX_ENEMIES),
    epy: new Float32Array(MAX_ENEMIES),
    eHp: new Float32Array(MAX_ENEMIES),
    eFlash: new Uint8Array(MAX_ENEMIES),
    bossHp: 0,
    bossMaxHp: 0,
    shotCount: 0,
    sKind: new Uint8Array(MAX_SHOTS),
    sx: new Float32Array(MAX_SHOTS),
    sy: new Float32Array(MAX_SHOTS),
    spx: new Float32Array(MAX_SHOTS),
    spy: new Float32Array(MAX_SHOTS),
    svx: new Float32Array(MAX_SHOTS),
    svy: new Float32Array(MAX_SHOTS),
    gemCount: 0,
    gKind: new Uint8Array(MAX_GEMS),
    gx: new Float32Array(MAX_GEMS),
    gy: new Float32Array(MAX_GEMS),
    droneCount: 0,
    droneX: new Float32Array(MAX_DRONES),
    droneY: new Float32Array(MAX_DRONES),
    dronePx: new Float32Array(MAX_DRONES),
    dronePy: new Float32Array(MAX_DRONES),
    auraRadius: 0,
    zone: 0,
    poiCount: 0,
    poiKind: new Uint8Array(MAX_POIS),
    poiZone: new Uint8Array(MAX_POIS),
    poiDone: new Uint8Array(MAX_POIS),
    poiX: new Float32Array(MAX_POIS),
    poiY: new Float32Array(MAX_POIS),
    poiProgress: new Float32Array(MAX_POIS),
    poiGuard: new Uint8Array(MAX_POIS),
    propCount: 0,
    propKind: new Uint8Array(MAX_PROPS),
    propX: new Float32Array(MAX_PROPS),
    propY: new Float32Array(MAX_PROPS),
    propCellStart: new Int32Array(PROP_GRID_CELLS + 1),
    propCellItems: new Int32Array(PROP_CELL_ITEMS),
    bossKills: 0,
    evHead: 0,
    evType: new Uint8Array(EVENT_CAP),
    evX: new Float32Array(EVENT_CAP),
    evY: new Float32Array(EVENT_CAP),
    evA: new Float32Array(EVENT_CAP),
    evB: new Float32Array(EVENT_CAP),
    rngA: 0,
    rngB: 0,
    rngC: 0,
    rngD: 0,
    aimTurn: 0,
    pendingLevels: 0,
    weaponTimer: new Int32Array(WEAPON_COUNT),
    bladeRepeats: 0,
    bladeRepeatTimer: 0,
    vulcanCycle: 0,
    droneActive: 0,
    droneDock: 0,
    droneTurn: 0,
    spawnTimer: 0,
    bossCursor: 0,
    nextEnemyId: 1,
    shotSeq: 0,
    hitEvents: 0,
    killEvents: 0,
    pickupEvents: 0,
    poiCharge: new Int32Array(MAX_POIS),
    eId: new Int32Array(MAX_ENEMIES),
    eMaxHp: new Float32Array(MAX_ENEMIES),
    eKx: new Float32Array(MAX_ENEMIES),
    eKy: new Float32Array(MAX_ENEMIES),
    eDroneReady: new Int32Array(MAX_ENEMIES),
    sLife: new Int32Array(MAX_SHOTS),
    sDamage: new Float32Array(MAX_SHOTS),
    sPierce: new Uint8Array(MAX_SHOTS),
    sRadius: new Float32Array(MAX_SHOTS),
    sArea: new Float32Array(MAX_SHOTS),
    sLastHit: new Int32Array(MAX_SHOTS),
    sTarget: new Int32Array(MAX_SHOTS),
    sTargetId: new Int32Array(MAX_SHOTS),
    sSeq: new Int32Array(MAX_SHOTS),
    gValue: new Float32Array(MAX_GEMS),
    gAttract: new Uint8Array(MAX_GEMS),
    gridOx: 0,
    gridOy: 0,
    scratchCell: new Int32Array(MAX_ENEMIES),
    scratchSepX: new Float32Array(MAX_ENEMIES),
    scratchSepY: new Float32Array(MAX_ENEMIES),
    scratchCellStart: new Int32Array(GRID_CELLS + 1),
    scratchCellCursor: new Int32Array(GRID_CELLS),
    scratchCellItems: new Int32Array(MAX_ENEMIES),
    scratchQuery: new Int32Array(MAX_ENEMIES),
    scratchChoices: new Uint8Array(64),
    scratchNearIdx: new Int32Array(NEAR_CAP),
    scratchNearDist: new Float64Array(NEAR_CAP),
  }
  resetState(s, 0)
  return s
}

export function resetState(s: State, seed: number): void {
  const fields = s as unknown as Record<string, unknown>
  for (const key of Object.keys(fields)) {
    const value = fields[key]
    if (ArrayBuffer.isView(value)) (value as Uint8Array).fill(0)
  }
  s.seed = seed >>> 0
  s.tick = 0
  s.phase = PHASE_PLAYING
  s.px = START_X
  s.py = START_Y
  s.ppx = START_X
  s.ppy = START_Y
  s.faceX = 1
  s.aimX = 1
  s.aimY = 0
  s.hp = PLAYER_MAX_HP
  s.maxHp = PLAYER_MAX_HP
  s.iframes = 0
  s.level = 1
  s.xp = 0
  s.xpNext = XP_BASE
  s.kills = 0
  s.weaponLevel[WEAPON_RIFLE] = 1
  s.choiceCount = 0
  s.enemyCount = 0
  s.bossHp = 0
  s.bossMaxHp = 0
  s.shotCount = 0
  s.gemCount = 0
  s.droneCount = 0
  s.auraRadius = 0
  s.zone = zoneAt(s.px, s.py)
  s.poiCount = 0
  s.propCount = 0
  s.bossKills = 0
  s.evHead = 0
  s.aimTurn = 0
  s.pendingLevels = 0
  s.bladeRepeats = 0
  s.bladeRepeatTimer = 0
  s.vulcanCycle = 0
  s.droneActive = 0
  s.droneDock = 0
  s.droneTurn = 0
  s.spawnTimer = 0
  s.bossCursor = 0
  s.nextEnemyId = 1
  s.shotSeq = 0
  s.hitEvents = 0
  s.killEvents = 0
  s.pickupEvents = 0
  s.gridOx = 0
  s.gridOy = 0
  seedRng(s)
  placePois(s)
  placeProps(s)
}
