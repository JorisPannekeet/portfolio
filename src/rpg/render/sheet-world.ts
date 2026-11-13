import { KIND_ACTOR, KIND_PLAIN, KIND_ROTATED, type SpriteDef } from '../../game/render/atlas.ts'
import {
  AREA_ASHFORGE, AREA_BARROW, AREA_BRENNHOLD, AREA_CITADEL, AREA_COUNT, AREA_SALTREACH, AREA_SHRINE, AREA_VALDMERE, AREA_VELLIN,
  ELEMENT_COUNT, OBJ_CHEST, OBJ_FORGE, OBJ_GRAPPLE, OBJ_HORSE, OBJ_KEY, OBJ_KIND_COUNT, OBJ_LOOT, OBJ_NPC, OBJ_PEDESTAL, OBJ_SHRINE,
  OBJ_SWITCH, OBJ_WAYSTONE, OBJ_WINDMILL, TILE_ASH, TILE_BARRICADE, TILE_BRIDGE, TILE_CHASM, TILE_COUNT, TILE_CRACKED, TILE_DOOR,
  TILE_DOOR_OPEN, TILE_FLOOR, TILE_GATE, TILE_GATE_OPEN, TILE_GRASS, TILE_HOUSE, TILE_ICE, TILE_LAVA, TILE_PILLAR_RAISED,
  TILE_PILLAR_SUNK, TILE_PIT, TILE_ROAD, TILE_ROCK, TILE_RUBBLE, TILE_SEAL, TILE_SEAL_OPEN, TILE_STAIRS, TILE_TREE, TILE_VOID,
  TILE_WALL, TILE_WATER,
} from '../sim/content.ts'
import { recolor, type Rows } from '../sprites/paint.ts'
import * as tiles from '../sprites/tiles.ts'
import * as obj from '../sprites/objects.ts'
import * as fx from '../sprites/fx.ts'
import * as lm from '../sprites/landmarks.ts'
import { RPG_PALETTE } from './palette.ts'
import { frameList, native, simWidth, spriteDef } from './frames.ts'
import { NONE, SPR_CAST, SPR_FX, SPR_MARKS, SPR_PROPS, SPR_TILES } from './sheet-ids.ts'
import { CAST_HORSE, CAST_NPC, CAST_NPC_FRAMES, HORSE_IDLE, castList } from './sheet-hero.ts'

export const TILESET_VILLAGE = 0
export const TILESET_COUNT = 7
export const AREA_TILESET = Uint8Array.of(0, 0, 1, 2, 3, 4, 5, 6)
export const AREA_OUTDOOR = new Uint8Array(AREA_COUNT)
AREA_OUTDOOR[AREA_BRENNHOLD] = 1
AREA_OUTDOOR[AREA_VALDMERE] = 1
export const AREA_DUNGEON = new Uint8Array(AREA_COUNT)
for (const area of [AREA_BARROW, AREA_SALTREACH, AREA_ASHFORGE, AREA_CITADEL, AREA_SHRINE]) AREA_DUNGEON[area] = 1
export const AREA_CORRUPTIBLE = new Uint8Array(AREA_COUNT)
AREA_CORRUPTIBLE[AREA_BARROW] = 1
AREA_CORRUPTIBLE[AREA_SALTREACH] = 1

const tileList = frameList()
const tileFrames = tileList.rows
function addTile(...rows: Rows[]): number {
  return native(tileList, ...rows)
}

export const TILE_FIRST = new Uint16Array(TILESET_COUNT * TILE_COUNT)
export const TILE_VARIANTS = new Uint8Array(TILESET_COUNT * TILE_COUNT)
export const TILE_ANIM = new Uint8Array(TILESET_COUNT * TILE_COUNT)
export const TILE_EDGE = new Uint16Array(TILESET_COUNT * TILE_COUNT).fill(NONE)
export const TILE_FACE = new Uint16Array(TILESET_COUNT * TILE_COUNT).fill(NONE)
export const TILE_FACE_VARIANTS = new Uint8Array(TILESET_COUNT * TILE_COUNT).fill(1)
export const TILE_GROUP = new Uint8Array(TILE_COUNT)

const GROUP_WALL = 1
const GROUP_HOUSE = 2
const GROUP_WATER = 3
const GROUP_PIT = 4
const GROUP_CHASM = 5
const GROUP_ROCK = 6
for (const kind of [TILE_WALL, TILE_DOOR, TILE_DOOR_OPEN, TILE_GATE, TILE_GATE_OPEN, TILE_SEAL, TILE_SEAL_OPEN, TILE_VOID]) TILE_GROUP[kind] = GROUP_WALL
TILE_GROUP[TILE_HOUSE] = GROUP_HOUSE
TILE_GROUP[TILE_WATER] = GROUP_WATER
TILE_GROUP[TILE_ICE] = GROUP_WATER
TILE_GROUP[TILE_PIT] = GROUP_PIT
TILE_GROUP[TILE_PILLAR_SUNK] = GROUP_PIT
TILE_GROUP[TILE_CHASM] = GROUP_CHASM
TILE_GROUP[TILE_ROCK] = GROUP_ROCK

const grass = addTile(...tiles.grassFrames)
const treeGround = addTile(...tiles.treeGround)
const road = addTile(...tiles.roadFrames)
const rock = addTile(...tiles.rockTops)
const rockFace = addTile(...tiles.rockFaces)
const water = addTile(...tiles.waterFrames)
const waterEdge = addTile(...tiles.waterBankFrames)
const ice = addTile(tiles.ice)
const lava = addTile(...tiles.lavaFrames)
const bridge = addTile(...tiles.bridgeFrames)
export const HOUSE_ROOF_FIRST = addTile(...tiles.roofFrames)
export const HOUSE_FACE_FIRST = addTile(...tiles.faceFrames)
const voidTile = addTile(tiles.voidTile)
const chasm = addTile(tiles.chasm)
const chasmEdge = addTile(tiles.chasmEdge)
export const GRASS_DECAL_FIRST = addTile(...tiles.grassDecals)
export const ROAD_FRINGE_FIRST = addTile(...tiles.roadFringe)
export const FOAM_FIRST = addTile(...tiles.foamFrames)
export const REEDS_FIRST = addTile(...tiles.reeds)
export const LILY_FIRST = addTile(tiles.lily, tiles.lilyFlower)
export const TREE_FIRST = addTile(...tiles.treeFrames)
export const CHIMNEY = addTile(tiles.chimney)
export const ROAD_RUT_H = 2
export const ROAD_RUT_V = 3
export const WATER_FRAMES = tiles.waterFrames.length
export const WALL_DECAL_FIRST = new Uint16Array(TILESET_COUNT)
export const FLOOR_DECAL_FIRST = new Uint16Array(TILESET_COUNT)
export const FLOOR_DECAL_COUNT = tiles.floorDecals.length

function setTile(tileset: number, kind: number, first: number, variants = 1, anim = 1): void {
  const i = tileset * TILE_COUNT + kind
  TILE_FIRST[i] = first
  TILE_VARIANTS[i] = variants
  TILE_ANIM[i] = anim
}

for (let tileset = 0; tileset < TILESET_COUNT; tileset++) {
  const base = tileFrames.length
  for (const template of tiles.TEMPLATES) addTile(tiles.paintTemplate(template, tileset))
  const at = (template: number) => base + template
  const i = (kind: number) => tileset * TILE_COUNT + kind
  const face = at(tiles.T_WALL_FACE)
  const faces = addTile(tileFrames[face]!, tileFrames[face]!, tileFrames[at(tiles.T_WALL_FACE_MOSS)]!, tileFrames[face]!, tileFrames[at(tiles.T_WALL_FACE_CRACK)]!, tileFrames[face]!)
  WALL_DECAL_FIRST[tileset] = addTile(...tiles.wallDecals.map(rows => tiles.paintTemplate(rows, tileset)))
  FLOOR_DECAL_FIRST[tileset] = addTile(...tiles.floorDecals.map(rows => tiles.paintTemplate(rows, tileset)))
  setTile(tileset, TILE_VOID, voidTile)
  setTile(tileset, TILE_FLOOR, at(tiles.T_FLOOR_A), 4)
  setTile(tileset, TILE_WALL, at(tiles.T_WALL_TOP))
  TILE_FACE[i(TILE_WALL)] = faces
  TILE_FACE_VARIANTS[i(TILE_WALL)] = 6
  setTile(tileset, TILE_GRASS, grass, tiles.grassFrames.length)
  setTile(tileset, TILE_ROAD, road, 2)
  setTile(tileset, TILE_TREE, treeGround, tiles.treeGround.length)
  setTile(tileset, TILE_ROCK, rock, tiles.rockTops.length)
  TILE_FACE[i(TILE_ROCK)] = rockFace
  TILE_FACE_VARIANTS[i(TILE_ROCK)] = tiles.rockFaces.length
  setTile(tileset, TILE_WATER, water, 1, tiles.waterFrames.length)
  TILE_EDGE[i(TILE_WATER)] = waterEdge
  setTile(tileset, TILE_ICE, ice)
  setTile(tileset, TILE_PIT, at(tiles.T_PIT))
  TILE_EDGE[i(TILE_PIT)] = at(tiles.T_PIT_EDGE)
  setTile(tileset, TILE_PILLAR_SUNK, at(tiles.T_PILLAR_SUNK))
  setTile(tileset, TILE_PILLAR_RAISED, at(tiles.T_PILLAR_RAISED))
  setTile(tileset, TILE_BARRICADE, at(tiles.T_BARRICADE))
  setTile(tileset, TILE_ASH, at(tiles.T_ASH))
  setTile(tileset, TILE_CRACKED, at(tiles.T_CRACKED))
  setTile(tileset, TILE_RUBBLE, at(tiles.T_RUBBLE))
  setTile(tileset, TILE_DOOR, at(tiles.T_DOOR))
  setTile(tileset, TILE_DOOR_OPEN, at(tiles.T_DOOR_OPEN))
  setTile(tileset, TILE_GATE, at(tiles.T_GATE))
  setTile(tileset, TILE_GATE_OPEN, at(tiles.T_GATE_OPEN))
  setTile(tileset, TILE_SEAL, at(tiles.T_SEAL))
  setTile(tileset, TILE_SEAL_OPEN, at(tiles.T_SEAL_OPEN))
  setTile(tileset, TILE_LAVA, lava, 1, tiles.lavaFrames.length)
  setTile(tileset, TILE_BRIDGE, bridge)
  setTile(tileset, TILE_HOUSE, HOUSE_ROOF_FIRST)
  TILE_FACE[i(TILE_HOUSE)] = HOUSE_FACE_FIRST
  setTile(tileset, TILE_CHASM, chasm)
  TILE_EDGE[i(TILE_CHASM)] = chasmEdge
  setTile(tileset, TILE_STAIRS, at(tiles.T_STAIRS))
}

export const AREA_SKY_KIND = new Int8Array(AREA_COUNT).fill(-1)
AREA_SKY_KIND[AREA_VALDMERE] = TILE_VOID
AREA_SKY_KIND[AREA_VELLIN] = TILE_CHASM
export const SKY_FIRST = addTile(...lm.skyFrames)
export const SKY_VARIANTS = lm.skyFrames.length
export const UNDERSIDE_FIRST = addTile(...lm.undersideFrames)
export const UNDERSIDE_VARIANTS = lm.undersideFrames.length
export const CLOUD_FIRST = addTile(...lm.clouds)
export const CLOUD_LOOKS = lm.clouds.length
export const PENNANT_FIRST = addTile(...lm.pennantFrames)
export const LIP_FIRST = addTile(...lm.lipFrames)
const scorch = addTile(...lm.scorchFrames)
setTile(TILESET_VILLAGE, TILE_ASH, scorch, lm.scorchFrames.length)

export const PART_PENNANT = 0
export const PART_GLOW = 1
export const PART_SMOKE = 2
export const PART_EMBER = 3
export const PART_DUST = 4
export const PART_RIPPLE = 5
export const PART_GLINT = 6
export const PART_DRIP = 7
export const PART_WISP = 8

type Part = readonly [kind: number, x: number, y: number, w: number, h: number, rate: number, color: string]
interface Landmark {
  area: number
  rows: Rows
  parts: readonly Part[]
}

const FORGE_WINDOWS: readonly (readonly [number, number])[] = [[18, 106], [46, 106], [72, 106], [170, 106], [196, 106], [224, 106], [18, 158], [46, 158], [196, 158], [224, 158]]

const LANDMARKS: readonly Landmark[] = [
  {
    area: AREA_BARROW,
    rows: lm.mountain,
    parts: [[PART_DUST, -60, -70, 110, 40, 0.05, '&'], [PART_GLINT, -80, -72, 150, 50, 0.025, 'q'], [PART_DUST, -16, -38, 32, 4, 0.04, '@']],
  },
  {
    area: AREA_SALTREACH,
    rows: lm.abbey,
    parts: [[PART_RIPPLE, -136, -92, 272, 184, 0.3, 'P'], [PART_DRIP, -44, -40, 88, 4, 0.06, 'Z'], [PART_GLINT, -8, -62, 16, 14, 0.02, 'Z']],
  },
  {
    area: AREA_ASHFORGE,
    rows: lm.forgeHall,
    parts: [
      [PART_SMOKE, -52, -96, 12, 0, 0, 'o'], [PART_SMOKE, -6, -94, 14, 0, 0, 'n'], [PART_SMOKE, 40, -90, 11, 0, 0, 'o'],
      [PART_EMBER, -52, -96, 12, 2, 0.05, 'A'], [PART_EMBER, -6, -94, 14, 2, 0.06, 'T'], [PART_EMBER, 40, -90, 11, 2, 0.05, 'A'],
      [PART_EMBER, -112, 0, 64, 32, 0.06, 'T'], [PART_EMBER, 48, 0, 64, 32, 0.06, 'A'], [PART_EMBER, -16, -30, 32, 30, 0.04, 'U'],
      [PART_GLOW, -17, -44, 34, 44, 0, 'T'],
      ...FORGE_WINDOWS.map(([x, y]) => [PART_GLOW, (x - 128) / 2, (y - 192) / 2, 8, 12, 0, 'A'] as const),
    ],
  },
  {
    area: AREA_VELLIN,
    rows: lm.skyCastle,
    parts: [[PART_PENNANT, -37, -107, 0, 0, 0, 'Y'], [PART_PENNANT, 37, -107, 0, 0, 0, 'Y'], [PART_PENNANT, 0, -113, 0, 0, 0, 'Y'], [PART_WISP, -200, -140, 40, 260, 0.06, 'W']],
  },
]

export const LANDMARK_FRAME = new Int16Array(AREA_COUNT).fill(-1)
export const LANDMARK_PART_START = new Uint8Array(AREA_COUNT)
export const LANDMARK_PART_END = new Uint8Array(AREA_COUNT)
const partCount = LANDMARKS.reduce((n, l) => n + l.parts.length, 0)
export const PART_KIND = new Uint8Array(partCount)
export const PART_X = new Float32Array(partCount)
export const PART_Y = new Float32Array(partCount)
export const PART_W = new Float32Array(partCount)
export const PART_H = new Float32Array(partCount)
export const PART_RATE = new Float32Array(partCount)
export const PART_COLOR = new Uint8Array(partCount)
{
  let n = 0
  for (const landmark of LANDMARKS) {
    LANDMARK_FRAME[landmark.area] = addTile(landmark.rows)
    LANDMARK_PART_START[landmark.area] = n
    for (const [kind, x, y, w, h, rate, color] of landmark.parts) {
      PART_KIND[n] = kind
      PART_X[n] = x
      PART_Y[n] = y
      PART_W[n] = w
      PART_H[n] = h
      PART_RATE[n] = rate
      PART_COLOR[n] = RPG_PALETTE.keys.indexOf(color)
      n++
    }
    LANDMARK_PART_END[landmark.area] = n
  }
}

const propList = frameList()
function addProp(...rows: Rows[]): number {
  return native(propList, ...rows)
}

const P_CHEST = addProp(obj.chestClosed, obj.chestOpen)
const P_WAYSTONE = addProp(obj.waystoneDark, obj.waystoneLit)
const P_FORGE = addProp(obj.forgeA, obj.forgeB)
const P_WINDMILL = addProp(obj.windmillTower)
const P_BLADES = addProp(obj.windmillBladesX, obj.windmillBladesPlus)
const P_SWITCH = addProp(obj.switchIdle, obj.switchTripped)
const P_GRAPPLE = addProp(obj.grapplePost)
const P_PEDESTAL = addProp(obj.pedestal)
const P_SHARDS = addProp(...obj.shards)
const P_PLINTH = addProp(obj.plinth)
const P_DOOR_KEY = addProp(obj.doorKey)
const BANNER_CLOTH = ['q&@', 'ONM', 'ATS', 'ZYX', 'Qag']
export const PROP_BANNER = addProp(...BANNER_CLOTH.map(cloth => recolor(obj.banner, obj.BANNER_TEMPLATE_KEYS, cloth)))
export const AREA_BANNER = new Int8Array(AREA_COUNT).fill(-1)
AREA_BANNER[AREA_BARROW] = 0
AREA_BANNER[AREA_SALTREACH] = 1
AREA_BANNER[AREA_ASHFORGE] = 2
AREA_BANNER[AREA_VELLIN] = 3
AREA_BANNER[AREA_CITADEL] = 4
const P_SHRINE = addProp(obj.shrineActive, obj.shrineDone)
const P_LOOT = addProp(obj.coins, obj.heart, obj.ore, obj.lootBag, obj.runestone)

export const ARG_LINEAR = 1

export const OBJ_STATES = 2
const OBJ_SLOTS = OBJ_KIND_COUNT * OBJ_STATES
export const OBJ_SPRITE = new Uint8Array(OBJ_SLOTS).fill(SPR_PROPS)
export const OBJ_BASE = new Uint16Array(OBJ_SLOTS).fill(NONE)
export const OBJ_BASE_STRIDE = new Uint8Array(OBJ_SLOTS)
export const OBJ_BASE_ANIM = new Uint8Array(OBJ_SLOTS).fill(1)
export const OBJ_OVER = new Uint16Array(OBJ_SLOTS).fill(NONE)
export const OBJ_OVER_STRIDE = new Uint8Array(OBJ_SLOTS)
export const OBJ_OVER_ANIM = new Uint8Array(OBJ_SLOTS).fill(1)
export const OBJ_OVER_Y = new Int8Array(OBJ_SLOTS)
export const OBJ_BOB = new Uint8Array(OBJ_SLOTS)
export const OBJ_FLAT = new Uint8Array(OBJ_SLOTS)
export const OBJ_FACE_PLAYER = new Uint8Array(OBJ_SLOTS)
export const OBJ_GLOW = new Int8Array(OBJ_SLOTS).fill(-1)
export const OBJ_ANIM_TICKS = new Uint8Array(OBJ_SLOTS).fill(12)
export const OBJ_SHADOW = new Uint8Array(OBJ_SLOTS)
export const OBJ_ARG_MODE = new Uint8Array(OBJ_KIND_COUNT)
export const OBJ_ARG_LIMIT = new Uint8Array(OBJ_KIND_COUNT).fill(1)

export const GLOW_GALE = 0
export const GLOW_SHARD = 1
export const GLOW_KEY = 2

interface ObjectArt {
  sprite?: number
  base?: number
  baseStride?: number
  baseAnim?: number
  over?: number
  overStride?: number
  overAnim?: number
  overY?: number
  bob?: number
  flat?: number
  face?: number
  glow?: number
  animTicks?: number
  shadow?: number
}

function setObject(kind: number, state: number, art: ObjectArt): void {
  const i = kind * OBJ_STATES + state
  const sprite = art.sprite ?? SPR_PROPS
  OBJ_SPRITE[i] = sprite
  OBJ_BASE[i] = art.base ?? NONE
  OBJ_BASE_STRIDE[i] = art.baseStride ?? 0
  OBJ_BASE_ANIM[i] = art.baseAnim ?? 1
  OBJ_OVER[i] = art.over ?? NONE
  OBJ_OVER_STRIDE[i] = art.overStride ?? 0
  OBJ_OVER_ANIM[i] = art.overAnim ?? 1
  OBJ_OVER_Y[i] = art.overY ?? 0
  OBJ_BOB[i] = art.bob ?? 0
  OBJ_FLAT[i] = art.flat ?? 0
  OBJ_FACE_PLAYER[i] = art.face ?? 0
  OBJ_GLOW[i] = art.glow ?? -1
  OBJ_ANIM_TICKS[i] = art.animTicks ?? 12
  OBJ_SHADOW[i] = art.shadow ?? (art.base === undefined || art.flat ? 0 : simWidth(sprite === SPR_CAST ? castList : propList, art.base) - 4)
}

function both(kind: number, art: ObjectArt): void {
  setObject(kind, 0, art)
  setObject(kind, 1, art)
}

both(OBJ_NPC, { sprite: SPR_CAST, base: CAST_NPC, baseStride: CAST_NPC_FRAMES, baseAnim: CAST_NPC_FRAMES, face: 1 })
OBJ_ARG_MODE[OBJ_NPC] = ARG_LINEAR
OBJ_ARG_LIMIT[OBJ_NPC] = 4
setObject(OBJ_CHEST, 0, { base: P_CHEST })
setObject(OBJ_CHEST, 1, { base: P_CHEST + 1 })
setObject(OBJ_WAYSTONE, 0, { base: P_WAYSTONE })
setObject(OBJ_WAYSTONE, 1, { base: P_WAYSTONE + 1, glow: GLOW_GALE })
both(OBJ_FORGE, { base: P_FORGE, baseAnim: 2 })
setObject(OBJ_WINDMILL, 0, { base: P_WINDMILL, over: P_BLADES, overY: -20 })
setObject(OBJ_WINDMILL, 1, { base: P_WINDMILL, over: P_BLADES, overAnim: 2, overY: -20, animTicks: 5 })
setObject(OBJ_SWITCH, 0, { base: P_SWITCH })
setObject(OBJ_SWITCH, 1, { base: P_SWITCH + 1 })
both(OBJ_GRAPPLE, { base: P_GRAPPLE })
setObject(OBJ_PEDESTAL, 0, { base: P_PEDESTAL, over: P_SHARDS, overStride: 1, overY: -18, bob: 2, glow: GLOW_SHARD })
setObject(OBJ_PEDESTAL, 1, { base: P_PEDESTAL })
OBJ_ARG_MODE[OBJ_PEDESTAL] = ARG_LINEAR
OBJ_ARG_LIMIT[OBJ_PEDESTAL] = ELEMENT_COUNT
both(OBJ_KEY, { base: P_PLINTH, over: P_DOOR_KEY, overY: -8, bob: 1, glow: GLOW_KEY })
setObject(OBJ_SHRINE, 0, { base: P_SHRINE, glow: GLOW_GALE })
setObject(OBJ_SHRINE, 1, { base: P_SHRINE + 1 })
both(OBJ_HORSE, { sprite: SPR_CAST, base: CAST_HORSE + HORSE_IDLE, baseAnim: 2, animTicks: 40, face: 1 })
both(OBJ_LOOT, { base: P_LOOT, baseStride: 1, bob: 1, shadow: 5 })
OBJ_ARG_MODE[OBJ_LOOT] = ARG_LINEAR
OBJ_ARG_LIMIT[OBJ_LOOT] = 5

const fxList = frameList()
export const FX_SPARK = native(fxList, ...fx.sparkFrames)
export const FX_PUFF = native(fxList, ...fx.puffFrames)
export const FX_GLINT = native(fxList, ...fx.glintFrames)
export const FX_MARKER = native(fxList, fx.questMarker)
export const FX_PIP = native(fxList, fx.interactPip)
export const FX_HEART = native(fxList, fx.hudHeart)

const markList = frameList()
export const ROT_QUEST = native(markList, fx.questArrow)
export const ROT_EXIT = native(markList, fx.exitChevron)

export const WORLD_DEFS: readonly (readonly [number, SpriteDef])[] = [
  [SPR_TILES, spriteDef('tiles', KIND_PLAIN, tileList)],
  [SPR_PROPS, spriteDef('props', KIND_ACTOR, propList)],
  [SPR_FX, spriteDef('fx', KIND_PLAIN, fxList)],
  [SPR_MARKS, spriteDef('marks', KIND_ROTATED, markList)],
]
