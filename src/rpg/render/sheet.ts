import { KIND_ACTOR, KIND_GLYPH, KIND_PLAIN, KIND_ROTATED, type SpriteDef } from '../../game/render/atlas.ts'
import { fontFrames } from '../../game/sprites/font.ts'
import {
  AREA_ASHFORGE, AREA_BARROW, AREA_BRENNHOLD, AREA_CITADEL, AREA_COUNT, AREA_SALTREACH, AREA_SHRINE, AREA_VALDMERE, AREA_VELLIN,
  BOSS_STORM_ABBESS, BOSS_VAREK, ELEMENT_COUNT, ENEMY_GALE_WISP, ENEMY_KIND_COUNT, ITEM_BASE_COUNT,
  ITEM_GREATSWORD, ITEM_SWORD, OBJ_CHEST, OBJ_FORGE, OBJ_GRAPPLE, OBJ_HORSE, OBJ_KEY, OBJ_KIND_COUNT, OBJ_LOOT, OBJ_NPC,
  OBJ_PEDESTAL, OBJ_SHRINE, OBJ_SWITCH, OBJ_WAYSTONE, OBJ_WINDMILL, PROJ_ARROW, PROJ_BOLT, PROJ_EMBER, PROJ_KIND_COUNT,
  PROJ_PLAYER_ARROW, PROJ_TIDE, PROJ_WAVE, TILE_ASH, TILE_BARRICADE, TILE_BRIDGE, TILE_CHASM, TILE_COUNT, TILE_CRACKED, TILE_DOOR,
  TILE_DOOR_OPEN, TILE_FLOOR, TILE_GATE, TILE_GATE_OPEN, TILE_GRASS, TILE_HOUSE, TILE_ICE, TILE_LAVA, TILE_PILLAR_RAISED,
  TILE_PILLAR_SUNK, TILE_PIT, TILE_ROAD, TILE_ROCK, TILE_RUBBLE, TILE_SEAL, TILE_SEAL_OPEN, TILE_STAIRS, TILE_TREE, TILE_VOID,
  TILE_WALL, TILE_WATER,
} from '../sim/content.ts'
import { recolor, type Rows } from '../sprites/paint.ts'
import * as tiles from '../sprites/tiles.ts'
import { ALDRIC_FRAMES, elder } from '../sprites/aldric.ts'
import { archer, ashHound, chained, drowned, footman, galeWisp, knight, wight } from '../sprites/enemies.ts'
import { barrowKing, drownedAbbot, forgemaster, stormAbbess, varekColossus, varekKnight } from '../sprites/bosses.ts'
import * as obj from '../sprites/objects.ts'
import * as gear from '../sprites/gear.ts'
import { armorIcons, elementEmber, elementGale, elementStone, elementTide, iconGreatsword, iconSword } from '../sprites/items.ts'

export const SPR_TILES = 0
export const SPR_ALDRIC = 1
export const SPR_ENEMIES = 2
export const SPR_PROPS = 3
export const SPR_ICONS = 4
export const SPR_ROTATED = 5
export const SPR_FX = 6
export const SPR_HELD = 7
export const SPR_DIGITS = 8

export const NONE = 0xffff

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
export const AREA_SKY = new Uint8Array(AREA_COUNT)
AREA_SKY[AREA_VELLIN] = 1

const tileFrames: Rows[] = []
function addTile(...rows: Rows[]): number {
  const first = tileFrames.length
  tileFrames.push(...rows)
  return first
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

const grass = addTile(tiles.grassA, tiles.grassA, tiles.grassA, tiles.grassB, tiles.grassA, tiles.grassA, tiles.grassB, tiles.grassC)
const road = addTile(tiles.roadA, tiles.roadB)
const tree = addTile(tiles.tree, tiles.treeB)
const rock = addTile(tiles.rockTop)
const rockFace = addTile(tiles.rockFace)
const water = addTile(tiles.waterA, tiles.waterB)
const waterEdge = addTile(tiles.waterEdgeA, tiles.waterEdgeB)
const ice = addTile(tiles.ice)
const lava = addTile(tiles.lavaA, tiles.lavaB)
const bridge = addTile(tiles.bridge)
const roof = addTile(tiles.roof)
const houseFront = addTile(tiles.houseFront, tiles.houseFront, tiles.houseDoor)
const voidTile = addTile(tiles.voidTile)
const chasm = addTile(tiles.chasm)
const chasmEdge = addTile(tiles.chasmEdge)

function setTile(tileset: number, kind: number, first: number, variants = 1, anim = 1): void {
  const i = tileset * TILE_COUNT + kind
  TILE_FIRST[i] = first
  TILE_VARIANTS[i] = variants
  TILE_ANIM[i] = anim
}

for (let tileset = 0; tileset < TILESET_COUNT; tileset++) {
  const base = tileFrames.length
  for (const template of tiles.TEMPLATES) tileFrames.push(tiles.paintTemplate(template, tileset))
  const at = (template: number) => base + template
  const i = (kind: number) => tileset * TILE_COUNT + kind
  setTile(tileset, TILE_VOID, voidTile)
  setTile(tileset, TILE_FLOOR, addTile(tileFrames[at(tiles.T_FLOOR_A)]!, tileFrames[at(tiles.T_FLOOR_A)]!, tileFrames[at(tiles.T_FLOOR_B)]!, tileFrames[at(tiles.T_FLOOR_C)]!), 4)
  setTile(tileset, TILE_WALL, at(tiles.T_WALL_TOP))
  TILE_FACE[i(TILE_WALL)] = at(tiles.T_WALL_FACE)
  setTile(tileset, TILE_GRASS, grass, 8)
  setTile(tileset, TILE_ROAD, road, 2)
  setTile(tileset, TILE_TREE, tree, 2)
  setTile(tileset, TILE_ROCK, rock)
  TILE_FACE[i(TILE_ROCK)] = rockFace
  setTile(tileset, TILE_WATER, water, 1, 2)
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
  setTile(tileset, TILE_LAVA, lava, 1, 2)
  setTile(tileset, TILE_BRIDGE, bridge)
  setTile(tileset, TILE_HOUSE, roof)
  TILE_FACE[i(TILE_HOUSE)] = houseFront
  TILE_FACE_VARIANTS[i(TILE_HOUSE)] = 3
  setTile(tileset, TILE_CHASM, chasm)
  TILE_EDGE[i(TILE_CHASM)] = chasmEdge
  setTile(tileset, TILE_STAIRS, at(tiles.T_STAIRS))
}

export const PL_FRAME_IDLE = 0
export const PL_FRAME_WALK = 2
export const PL_FRAME_WINDUP = 6
export const PL_FRAME_STRIKE = 7
export const PL_FRAME_GUARD = 8
export const PL_FRAME_ROLL = 9
export const PL_FRAME_HURT = 11
export const PL_FRAME_DEAD = 12
export const PL_FRAME_BOW = 13
export const PL_FRAME_MOUNTED = 14
export const PL_FRAME_FRONT = 15
export const PL_FRAME_BACK = 17
export const PL_ELDER = ALDRIC_FRAMES.length
export const PL_HAND_X = 9
export const PL_HAND_Y = 11

const ELITE_FROM = 'RrSMLNXVYutwOTA'
const ELITE_TO = 'gCagCagCaBCgzzQ'

function elite(frames: Rows[]): string[][] {
  return frames.map(rows => recolor(rows, ELITE_FROM, ELITE_TO))
}

const VAREK_WREATH_FROM = 'RrAUl'
const VAREK_WREATH_TO = 'TSZWX'

const ENEMY_ART: readonly (readonly Rows[])[] = [
  footman, archer, knight, wight, drowned, ashHound, galeWisp, chained,
  barrowKing, drownedAbbot, forgemaster, stormAbbess, varekKnight,
]
const VAREK_ELEMENTS = varekKnight.map(rows => recolor(rows, VAREK_WREATH_FROM, VAREK_WREATH_TO))

export const ENEMY_FIRST = new Uint16Array(ENEMY_KIND_COUNT)
export const ENEMY_WALK = new Uint8Array(ENEMY_KIND_COUNT)
export const ENEMY_WINDUP = new Uint8Array(ENEMY_KIND_COUNT)
export const VAREK_PHASE_FIRST = new Uint16Array(3)

const enemyFrames: Rows[] = []
for (let kind = 0; kind < ENEMY_KIND_COUNT; kind++) {
  const art = ENEMY_ART[kind]!
  ENEMY_FIRST[kind] = enemyFrames.length
  ENEMY_WALK[kind] = art.length > 2 ? 2 : 1
  ENEMY_WINDUP[kind] = art.length - 1
  enemyFrames.push(...art)
}
VAREK_PHASE_FIRST[0] = ENEMY_FIRST[BOSS_VAREK]!
VAREK_PHASE_FIRST[1] = enemyFrames.length
enemyFrames.push(...VAREK_ELEMENTS)
VAREK_PHASE_FIRST[2] = enemyFrames.length
enemyFrames.push(...varekColossus)
export const ENEMY_ELITE_OFFSET = enemyFrames.length
enemyFrames.push(...elite(enemyFrames.slice()))

export const ENEMY_FLYING = new Uint8Array(ENEMY_KIND_COUNT)
export const ENEMY_PHASED = new Uint8Array(ENEMY_KIND_COUNT)
ENEMY_PHASED[BOSS_VAREK] = 1
ENEMY_FLYING[ENEMY_GALE_WISP] = 1
ENEMY_FLYING[BOSS_STORM_ABBESS] = 1

const propFrames: Rows[] = []
function addProp(...rows: Rows[]): number {
  const first = propFrames.length
  propFrames.push(...rows)
  return first
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
export const PROP_KEY_ITEMS = addProp(obj.warhammer, obj.grappleChain, obj.longbow)
const P_DOOR_KEY = addProp(obj.doorKey)
const BANNER_CLOTH = ['&e', 'NM', 'TS', 'YX', 'ag']
export const PROP_BANNER = addProp(...BANNER_CLOTH.map(cloth => recolor(obj.banner, 'SR', cloth)))
export const AREA_BANNER = new Int8Array(AREA_COUNT).fill(-1)
AREA_BANNER[AREA_BARROW] = 0
AREA_BANNER[AREA_SALTREACH] = 1
AREA_BANNER[AREA_ASHFORGE] = 2
AREA_BANNER[AREA_VELLIN] = 3
AREA_BANNER[AREA_CITADEL] = 4
const P_SHRINE = addProp(obj.shrineActive, obj.shrineDone)
const P_HORSE = addProp(obj.horseIdle, obj.horseRun)
const P_LOOT = addProp(obj.coins, obj.heart, obj.ore, obj.lootBag, obj.runestone)
const P_NPC = addProp(...obj.npcMaren, ...obj.npcSmith, ...obj.npcChild, ...obj.npcVillager)

export const PROP_HORSE = P_HORSE

export const ARG_LINEAR = 1

export const OBJ_STATES = 2
const OBJ_SLOTS = OBJ_KIND_COUNT * OBJ_STATES
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
  OBJ_SHADOW[i] = art.shadow ?? (art.base === undefined || art.flat ? 0 : propFrames[art.base]![0]!.length - 4)
}

function both(kind: number, art: ObjectArt): void {
  setObject(kind, 0, art)
  setObject(kind, 1, art)
}

both(OBJ_NPC, { base: P_NPC, baseStride: obj.npcMaren.length, baseAnim: obj.npcMaren.length, face: 1 })
OBJ_ARG_MODE[OBJ_NPC] = ARG_LINEAR
OBJ_ARG_LIMIT[OBJ_NPC] = 4
setObject(OBJ_CHEST, 0, { base: P_CHEST })
setObject(OBJ_CHEST, 1, { base: P_CHEST + 1 })
setObject(OBJ_WAYSTONE, 0, { base: P_WAYSTONE })
setObject(OBJ_WAYSTONE, 1, { base: P_WAYSTONE + 1, glow: GLOW_GALE })
both(OBJ_FORGE, { base: P_FORGE, baseAnim: 2 })
setObject(OBJ_WINDMILL, 0, { base: P_WINDMILL, over: P_BLADES, overY: -17 })
setObject(OBJ_WINDMILL, 1, { base: P_WINDMILL, over: P_BLADES, overAnim: 2, overY: -17, animTicks: 5 })
setObject(OBJ_SWITCH, 0, { base: P_SWITCH })
setObject(OBJ_SWITCH, 1, { base: P_SWITCH + 1 })
both(OBJ_GRAPPLE, { base: P_GRAPPLE })
setObject(OBJ_PEDESTAL, 0, { base: P_PEDESTAL, over: P_SHARDS, overStride: 1, overY: -12, bob: 2, glow: GLOW_SHARD })
setObject(OBJ_PEDESTAL, 1, { base: P_PEDESTAL })
OBJ_ARG_MODE[OBJ_PEDESTAL] = ARG_LINEAR
OBJ_ARG_LIMIT[OBJ_PEDESTAL] = ELEMENT_COUNT
both(OBJ_KEY, { base: P_PLINTH, over: P_DOOR_KEY, overY: -6, bob: 1, glow: GLOW_KEY })
setObject(OBJ_SHRINE, 0, { base: P_SHRINE, glow: GLOW_GALE })
setObject(OBJ_SHRINE, 1, { base: P_SHRINE + 1 })
both(OBJ_HORSE, { base: P_HORSE, face: 1 })
both(OBJ_LOOT, { base: P_LOOT, baseStride: 1, bob: 1, shadow: 5 })
OBJ_ARG_MODE[OBJ_LOOT] = ARG_LINEAR
OBJ_ARG_LIMIT[OBJ_LOOT] = 5

export const ITEM_ICON = new Uint8Array(ITEM_BASE_COUNT)
const iconFrames: Rows[] = [iconSword, iconGreatsword, ...armorIcons]
ITEM_ICON[ITEM_SWORD] = 0
ITEM_ICON[ITEM_GREATSWORD] = 1
for (let base = ITEM_GREATSWORD + 1; base < ITEM_BASE_COUNT; base++) ITEM_ICON[base] = base
export const ELEMENT_ICON_FIRST = iconFrames.length
iconFrames.push(elementStone, elementTide, elementEmber, elementGale)

export const ROT_SWORD = 0
export const ROT_GREATSWORD = 1
export const ROT_HAMMER = 2
export const ROT_ARROW = 3
export const ROT_PLAYER_ARROW = 4
export const ROT_BOLT = 5
export const ROT_WAVE = 6
export const ROT_QUEST = 7
export const ROT_EXIT = 8

export const FX_SPARK = 0
export const FX_PUFF = 3
export const FX_GLINT = 6
export const FX_EMBER_ORB = 9
export const FX_TIDE_ORB = 11
export const FX_MARKER = 13
export const FX_PIP = 14
export const FX_HEART = 15
export const FX_SHIELD_FRONT = 16

export const HELD_SHIELD = 0
export const HELD_BOW = 1

export const PROJ_ROTATED = new Uint8Array(PROJ_KIND_COUNT)
export const PROJ_FRAME = new Uint8Array(PROJ_KIND_COUNT)
export const PROJ_ANIM = new Uint8Array(PROJ_KIND_COUNT).fill(1)
function setProjectile(kind: number, rotated: number, frame: number, anim: number): void {
  PROJ_ROTATED[kind] = rotated
  PROJ_FRAME[kind] = frame
  PROJ_ANIM[kind] = anim
}
setProjectile(PROJ_ARROW, 1, ROT_ARROW, 1)
setProjectile(PROJ_PLAYER_ARROW, 1, ROT_PLAYER_ARROW, 1)
setProjectile(PROJ_BOLT, 1, ROT_BOLT, 1)
setProjectile(PROJ_WAVE, 1, ROT_WAVE, 1)
setProjectile(PROJ_EMBER, 0, FX_EMBER_ORB, 2)
setProjectile(PROJ_TIDE, 0, FX_TIDE_ORB, 2)

export const FONT_ADVANCE = 4

export const SPRITE_DEFS: readonly SpriteDef[] = [
  { name: 'tiles', kind: KIND_PLAIN, frames: tileFrames },
  { name: 'aldric', kind: KIND_ACTOR, frames: [...ALDRIC_FRAMES, ...ALDRIC_FRAMES.map(elder)] },
  { name: 'enemies', kind: KIND_ACTOR, frames: enemyFrames },
  { name: 'props', kind: KIND_ACTOR, frames: propFrames },
  { name: 'icons', kind: KIND_PLAIN, frames: iconFrames },
  {
    name: 'rotated',
    kind: KIND_ROTATED,
    frames: [gear.bladeSword, gear.bladeGreatsword, gear.bladeHammer, gear.arrowEnemy, gear.arrowPlayer, gear.boltSpark, gear.waveCrescent, gear.questArrow, gear.exitChevron],
  },
  {
    name: 'fx',
    kind: KIND_PLAIN,
    frames: [
      ...gear.sparkFrames, ...gear.puffFrames, ...gear.glintFrames, gear.emberOrbA, gear.emberOrbB, gear.tideOrbA, gear.tideOrbB,
      gear.questMarker, gear.interactPip, gear.hudHeart, gear.shieldFront,
    ],
  },
  { name: 'held', kind: KIND_ACTOR, frames: [gear.shieldSide, gear.bowHeld] },
  { name: 'digits', kind: KIND_GLYPH, frames: fontFrames.slice(0, 10) },
]
