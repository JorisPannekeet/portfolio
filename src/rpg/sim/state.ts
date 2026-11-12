import {
  AFFIX_SLOTS,
  ELEMENT_COUNT,
  ELEMENT_STONE,
  ENDING_NONE,
  EVENT_CAP,
  FLAG_COUNT,
  INV_CAP,
  MAX_ENEMIES,
  MAX_OBJECTS,
  MAX_PROJECTILES,
  MAX_TILES,
  NODE_COUNT,
  PHASE_PLAYING,
  PL_IDLE,
  SCRIPT_NONE,
  SET_NONE,
  SLOT_COUNT,
} from './content.ts'

export interface State {
  seed: number
  tick: number
  phase: number
  rngA: number
  rngB: number
  rngC: number
  rngD: number
  prevInput: number

  chapter: number
  ending: number
  shards: number
  stancesUnlocked: number
  keyItems: number
  melodies: number
  waystones: number
  level: number
  xp: number
  skillPoints: number
  gold: number
  ore: number
  clock: number
  checkpointArea: number
  checkpointSpawn: number
  flags: Uint8Array
  nodes: Uint8Array
  runes: Uint8Array
  equipped: Int8Array
  invBase: Int8Array
  invTier: Uint8Array
  invLevel: Uint8Array
  invRune: Int8Array
  invAffix: Int8Array
  invAffixValue: Int16Array

  statMaxHp: number
  statMaxStamina: number
  statMaxFocus: number
  statAttack: number
  statArmor: number
  statParryTicks: number
  statStaminaRegen: number
  statFocusGain: number
  statCrit: number
  statTwoHanded: number
  statSet: number
  statElement: Float32Array

  playerX: number
  playerY: number
  playerPrevX: number
  playerPrevY: number
  playerFace: number
  playerState: number
  playerTimer: number
  playerCombo: number
  playerChain: number
  hp: number
  stamina: number
  focus: number
  heat: number
  stance: number
  mounted: number
  lockTarget: number
  guardStart: number
  iframesUntil: number
  hurtFlashUntil: number
  grappleX: number
  grappleY: number
  interactObj: number
  interactUsed: number
  playerBuffer: number
  heatHoldUntil: number

  area: number
  areaVariant: number
  areaTick: number
  mapW: number
  mapH: number
  tiles: Uint8Array
  dialogScript: number
  dialogLine: number
  nearForge: number
  bossPhase: number
  goal: number
  guideX: number
  guideY: number

  objKind: Uint8Array
  objState: Uint8Array
  objX: Float32Array
  objY: Float32Array
  objArg: Int16Array
  objData: Int32Array
  objFlag: Int16Array

  eAlive: Uint8Array
  eKind: Uint8Array
  eElite: Uint8Array
  eState: Uint8Array
  eTimer: Int32Array
  eX: Float32Array
  eY: Float32Array
  ePrevX: Float32Array
  ePrevY: Float32Array
  eVx: Float32Array
  eVy: Float32Array
  eFace: Int16Array
  eHp: Float32Array
  eMaxHp: Float32Array
  eFlashUntil: Int32Array
  eBurn: Int32Array
  eChill: Int32Array
  eObj: Int16Array
  eAttack: Uint8Array
  eCooldown: Int32Array

  prAlive: Uint8Array
  prKind: Uint8Array
  prOwner: Uint8Array
  prX: Float32Array
  prY: Float32Array
  prPrevX: Float32Array
  prPrevY: Float32Array
  prVx: Float32Array
  prVy: Float32Array
  prDamage: Float32Array
  prLife: Int32Array

  evHead: number
  evType: Uint8Array
  evA: Int32Array
  evB: Int32Array
  evX: Float32Array
  evY: Float32Array
}

export function createState(): State {
  const s: State = {
    seed: 0,
    tick: 0,
    phase: PHASE_PLAYING,
    rngA: 0,
    rngB: 0,
    rngC: 0,
    rngD: 0,
    prevInput: 0,

    chapter: 0,
    ending: ENDING_NONE,
    shards: 0,
    stancesUnlocked: 0,
    keyItems: 0,
    melodies: 0,
    waystones: 0,
    level: 1,
    xp: 0,
    skillPoints: 0,
    gold: 0,
    ore: 0,
    clock: 0,
    checkpointArea: 0,
    checkpointSpawn: 0,
    flags: new Uint8Array(FLAG_COUNT),
    nodes: new Uint8Array(NODE_COUNT),
    runes: new Uint8Array(ELEMENT_COUNT),
    equipped: new Int8Array(SLOT_COUNT),
    invBase: new Int8Array(INV_CAP),
    invTier: new Uint8Array(INV_CAP),
    invLevel: new Uint8Array(INV_CAP),
    invRune: new Int8Array(INV_CAP),
    invAffix: new Int8Array(INV_CAP * AFFIX_SLOTS),
    invAffixValue: new Int16Array(INV_CAP * AFFIX_SLOTS),

    statMaxHp: 100,
    statMaxStamina: 100,
    statMaxFocus: 100,
    statAttack: 10,
    statArmor: 0,
    statParryTicks: 8,
    statStaminaRegen: 0.5,
    statFocusGain: 1,
    statCrit: 0,
    statTwoHanded: 0,
    statSet: SET_NONE,
    statElement: new Float32Array(ELEMENT_COUNT),

    playerX: 0,
    playerY: 0,
    playerPrevX: 0,
    playerPrevY: 0,
    playerFace: 0,
    playerState: PL_IDLE,
    playerTimer: 0,
    playerCombo: 0,
    playerChain: 0,
    hp: 100,
    stamina: 100,
    focus: 0,
    heat: 0,
    stance: ELEMENT_STONE,
    mounted: 0,
    lockTarget: -1,
    guardStart: 0,
    iframesUntil: 0,
    hurtFlashUntil: 0,
    grappleX: 0,
    grappleY: 0,
    interactObj: -1,
    interactUsed: 0,
    playerBuffer: 0,
    heatHoldUntil: 0,

    area: 0,
    areaVariant: 0,
    areaTick: 0,
    mapW: 0,
    mapH: 0,
    tiles: new Uint8Array(MAX_TILES),
    dialogScript: SCRIPT_NONE,
    dialogLine: 0,
    nearForge: 0,
    bossPhase: 0,
    goal: 0,
    guideX: -1,
    guideY: -1,

    objKind: new Uint8Array(MAX_OBJECTS),
    objState: new Uint8Array(MAX_OBJECTS),
    objX: new Float32Array(MAX_OBJECTS),
    objY: new Float32Array(MAX_OBJECTS),
    objArg: new Int16Array(MAX_OBJECTS),
    objData: new Int32Array(MAX_OBJECTS),
    objFlag: new Int16Array(MAX_OBJECTS),

    eAlive: new Uint8Array(MAX_ENEMIES),
    eKind: new Uint8Array(MAX_ENEMIES),
    eElite: new Uint8Array(MAX_ENEMIES),
    eState: new Uint8Array(MAX_ENEMIES),
    eTimer: new Int32Array(MAX_ENEMIES),
    eX: new Float32Array(MAX_ENEMIES),
    eY: new Float32Array(MAX_ENEMIES),
    ePrevX: new Float32Array(MAX_ENEMIES),
    ePrevY: new Float32Array(MAX_ENEMIES),
    eVx: new Float32Array(MAX_ENEMIES),
    eVy: new Float32Array(MAX_ENEMIES),
    eFace: new Int16Array(MAX_ENEMIES),
    eHp: new Float32Array(MAX_ENEMIES),
    eMaxHp: new Float32Array(MAX_ENEMIES),
    eFlashUntil: new Int32Array(MAX_ENEMIES),
    eBurn: new Int32Array(MAX_ENEMIES),
    eChill: new Int32Array(MAX_ENEMIES),
    eObj: new Int16Array(MAX_ENEMIES),
    eAttack: new Uint8Array(MAX_ENEMIES),
    eCooldown: new Int32Array(MAX_ENEMIES),

    prAlive: new Uint8Array(MAX_PROJECTILES),
    prKind: new Uint8Array(MAX_PROJECTILES),
    prOwner: new Uint8Array(MAX_PROJECTILES),
    prX: new Float32Array(MAX_PROJECTILES),
    prY: new Float32Array(MAX_PROJECTILES),
    prPrevX: new Float32Array(MAX_PROJECTILES),
    prPrevY: new Float32Array(MAX_PROJECTILES),
    prVx: new Float32Array(MAX_PROJECTILES),
    prVy: new Float32Array(MAX_PROJECTILES),
    prDamage: new Float32Array(MAX_PROJECTILES),
    prLife: new Int32Array(MAX_PROJECTILES),

    evHead: 0,
    evType: new Uint8Array(EVENT_CAP),
    evA: new Int32Array(EVENT_CAP),
    evB: new Int32Array(EVENT_CAP),
    evX: new Float32Array(EVENT_CAP),
    evY: new Float32Array(EVENT_CAP),
  }
  s.equipped.fill(-1)
  s.invBase.fill(-1)
  s.invRune.fill(-1)
  s.invAffix.fill(-1)
  s.objFlag.fill(-1)
  s.eObj.fill(-1)
  return s
}

export function resetState(s: State, seed: number): void {
  const fresh = createState()
  const target = s as unknown as Record<string, unknown>
  const source = fresh as unknown as Record<string, unknown>
  for (const key of Object.keys(source)) {
    const value = source[key]
    const held = target[key]
    if (ArrayBuffer.isView(value) && ArrayBuffer.isView(held)) (held as Uint8Array).set(value as Uint8Array)
    else target[key] = value
  }
  s.seed = seed >>> 0
}
