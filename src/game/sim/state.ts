import {
  CHOICE_COUNT,
  EVENT_CAP,
  MAX_DRONES,
  MAX_ENEMIES,
  MAX_GEMS,
  MAX_SHOTS,
  PASSIVE_COUNT,
  PHASE_PLAYING,
  PLAYER_MAX_HP,
  WEAPON_COUNT,
  WEAPON_RIFLE,
  XP_BASE,
} from './content.ts'

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

  evHead: number
  evType: Uint8Array
  evX: Float32Array
  evY: Float32Array
  evA: Float32Array
  evB: Float32Array
}

export function createState(): State {
  return {
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
    evHead: 0,
    evType: new Uint8Array(EVENT_CAP),
    evX: new Float32Array(EVENT_CAP),
    evY: new Float32Array(EVENT_CAP),
    evA: new Float32Array(EVENT_CAP),
    evB: new Float32Array(EVENT_CAP),
  }
}

export function resetState(s: State, seed: number): void {
  s.seed = seed >>> 0
  s.tick = 0
  s.phase = PHASE_PLAYING
  s.px = 0
  s.py = 0
  s.ppx = 0
  s.ppy = 0
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
  s.weaponLevel.fill(0)
  s.weaponEvolved.fill(0)
  s.passiveLevel.fill(0)
  s.weaponLevel[WEAPON_RIFLE] = 1
  s.choices.fill(0)
  s.choiceCount = 0
  s.enemyCount = 0
  s.bossHp = 0
  s.bossMaxHp = 0
  s.shotCount = 0
  s.gemCount = 0
  s.droneCount = 0
  s.auraRadius = 0
  s.evHead = 0
}
