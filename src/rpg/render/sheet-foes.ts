import { KIND_ACTOR, KIND_PLAIN, KIND_ROTATED, type SpriteDef } from '../../game/render/atlas.ts'
import {
  BOSS_BARROW_KING, BOSS_DROWNED_ABBOT, BOSS_FORGEMASTER, BOSS_STORM_ABBESS, BOSS_VAREK, ENEMY_ASH_HOUND, ENEMY_BOSS_FIRST, ENEMY_CHAINED, ENEMY_DROWNED,
  ENEMY_GALE_WISP, ENEMY_KIND_COUNT, ENEMY_WIGHT, PROJ_ARROW, PROJ_BOLT, PROJ_EMBER, PROJ_KIND_COUNT, PROJ_PLAYER_ARROW, PROJ_TIDE, PROJ_WAVE,
} from '../sim/content.ts'
import { recolor } from '../sprites/paint.ts'
import type { FoeArt } from '../sprites/foe-rig.ts'
import { archer, ashHound, chained, drowned, footman, galeWisp, knight, wight } from '../sprites/enemies.ts'
import { barrowKing, drownedAbbot, forgemaster, stormAbbess, varekColossus, varekKnight } from '../sprites/bosses.ts'
import * as shots from '../sprites/shots.ts'
import { derive, frameList, native, spriteDef, type Frames } from './frames.ts'
import { ART } from './art.ts'
import { C_EMBER, C_GOLD, C_GOLD_PALE, C_PALE, C_RED, C_SKY, C_SKY_LIGHT, C_TEAL, C_WHITE } from './colors.ts'
import { SPR_ENEMIES, SPR_SHOTS, SPR_SHOTS_ROTATED } from './sheet-ids.ts'

const ELITE_FROM = 'RrSMLNXVYutwOTAlm%@Z:;<>vj+'
const ELITE_TO = 'gCagCagCaBCgzzQCgCgQgagaaga'

const VAREK_WREATH_FROM = 'RrAUlK:S'
const VAREK_WREATH_TO = 'TSZWXYAU'

const ENEMY_ART: readonly FoeArt[] = [footman, archer, knight, wight, drowned, ashHound, galeWisp, chained, barrowKing, drownedAbbot, forgemaster, stormAbbess, varekKnight]

export const ENEMY_FIRST = new Uint16Array(ENEMY_KIND_COUNT)
export const ENEMY_IDLE_N = new Uint8Array(ENEMY_KIND_COUNT)
export const ENEMY_WALK_AT = new Uint8Array(ENEMY_KIND_COUNT)
export const ENEMY_WALK = new Uint8Array(ENEMY_KIND_COUNT)
export const ENEMY_WINDUP = new Uint8Array(ENEMY_KIND_COUNT)
export const ENEMY_CAST = new Uint8Array(ENEMY_KIND_COUNT)
export const ENEMY_STRIKE = new Uint8Array(ENEMY_KIND_COUNT)
export const ENEMY_STAGGER = new Uint8Array(ENEMY_KIND_COUNT)
export const ENEMY_DEATH = new Uint8Array(ENEMY_KIND_COUNT)
export const ENEMY_DEATH_N = new Uint8Array(ENEMY_KIND_COUNT)
export const ENEMY_HEIGHT = new Float32Array(ENEMY_KIND_COUNT)
export const VAREK_PHASE_FIRST = new Uint16Array(3)

function addArt(list: Frames, art: FoeArt, kind: number): number {
  const first = native(list, ...art.idle)
  ENEMY_IDLE_N[kind] = art.idle.length
  ENEMY_WALK_AT[kind] = list.rows.length - first
  ENEMY_WALK[kind] = art.walk.length
  native(list, ...art.walk)
  ENEMY_WINDUP[kind] = list.rows.length - first
  native(list, art.windup)
  ENEMY_CAST[kind] = list.rows.length - first - (art.cast === art.windup ? 1 : 0)
  if (art.cast !== art.windup) native(list, art.cast)
  ENEMY_STRIKE[kind] = list.rows.length - first
  native(list, art.strike)
  ENEMY_STAGGER[kind] = list.rows.length - first
  native(list, art.stagger)
  ENEMY_DEATH[kind] = list.rows.length - first
  ENEMY_DEATH_N[kind] = art.death.length
  native(list, ...art.death)
  ENEMY_HEIGHT[kind] = art.idle[0]!.length / ART
  return first
}

const enemyList = frameList()
for (let kind = 0; kind < ENEMY_KIND_COUNT; kind++) ENEMY_FIRST[kind] = addArt(enemyList, ENEMY_ART[kind]!, kind)
const varekFrames = enemyList.rows.length - ENEMY_FIRST[BOSS_VAREK]!
VAREK_PHASE_FIRST[0] = ENEMY_FIRST[BOSS_VAREK]!
VAREK_PHASE_FIRST[1] = derive(enemyList, enemyList, ENEMY_FIRST[BOSS_VAREK]!, varekFrames, rows => recolor(rows, VAREK_WREATH_FROM, VAREK_WREATH_TO))
const varekHeight = ENEMY_HEIGHT[BOSS_VAREK]!
VAREK_PHASE_FIRST[2] = addArt(enemyList, varekColossus, BOSS_VAREK)
if (enemyList.rows.length - VAREK_PHASE_FIRST[2] !== varekFrames) throw new Error('Varek phases need one frame layout')
export const VAREK_COLOSSUS_HEIGHT = ENEMY_HEIGHT[BOSS_VAREK]!
ENEMY_HEIGHT[BOSS_VAREK] = varekHeight
export const ENEMY_ELITE_OFFSET = enemyList.rows.length
derive(enemyList, enemyList, 0, ENEMY_FIRST[ENEMY_BOSS_FIRST]!, rows => recolor(rows, ELITE_FROM, ELITE_TO))

export const ENEMY_FLYING = new Uint8Array(ENEMY_KIND_COUNT)
export const ENEMY_PHASED = new Uint8Array(ENEMY_KIND_COUNT)
ENEMY_PHASED[BOSS_VAREK] = 1
ENEMY_FLYING[ENEMY_GALE_WISP] = 1
ENEMY_FLYING[BOSS_STORM_ABBESS] = 1

export const TOUCH_NONE = 0
export const TOUCH_EYES = 1
export const TOUCH_EMBERS = 2
export const TOUCH_DRIP = 3
export const TOUCH_SPARKS = 4
export const ENEMY_TOUCH = new Uint8Array(ENEMY_KIND_COUNT)
export const ENEMY_EYE_X = new Float32Array(ENEMY_KIND_COUNT)
export const ENEMY_EYE_Y = new Float32Array(ENEMY_KIND_COUNT)
function touch(kind: number, kindTouch: number, eyeX: number, eyeY: number): void {
  ENEMY_TOUCH[kind] = kindTouch
  ENEMY_EYE_X[kind] = eyeX
  ENEMY_EYE_Y[kind] = eyeY
}
touch(ENEMY_WIGHT, TOUCH_EYES, 2, 17.5)
touch(ENEMY_DROWNED, TOUCH_DRIP, 0, 0)
touch(ENEMY_ASH_HOUND, TOUCH_EMBERS, 4.5, 8.5)
touch(ENEMY_GALE_WISP, TOUCH_SPARKS, 0, 0)
touch(ENEMY_CHAINED, TOUCH_EYES, 2.5, 16.5)
touch(BOSS_BARROW_KING, TOUCH_EYES, 3.5, 26.5)
touch(BOSS_DROWNED_ABBOT, TOUCH_DRIP, 0, 0)
touch(BOSS_FORGEMASTER, TOUCH_EMBERS, 3.5, 27)
touch(BOSS_STORM_ABBESS, TOUCH_SPARKS, 0, 0)

const shotRotatedList = frameList()
const SHOT_ARROW = native(shotRotatedList, shots.arrowEnemy)
const SHOT_PLAYER_ARROW = native(shotRotatedList, shots.arrowPlayer)
const SHOT_BOLT = native(shotRotatedList, ...shots.boltSpark)
const SHOT_WAVE = native(shotRotatedList, ...shots.waveCrescent)

const shotList = frameList()
const SHOT_EMBER_ORB = native(shotList, ...shots.emberOrb)
const SHOT_TIDE_ORB = native(shotList, ...shots.tideOrb)
export const SHOT_BURN_PATCH = native(shotList, ...shots.burnPatch)
export const BURN_PATCH_FRAMES = shots.burnPatch.length

export const PROJ_ROTATED = new Uint8Array(PROJ_KIND_COUNT)
export const PROJ_FRAME = new Uint8Array(PROJ_KIND_COUNT)
export const PROJ_ANIM = new Uint8Array(PROJ_KIND_COUNT).fill(1)
function setProjectile(kind: number, rotated: number, frame: number, anim: number): void {
  PROJ_ROTATED[kind] = rotated
  PROJ_FRAME[kind] = frame
  PROJ_ANIM[kind] = anim
}
setProjectile(PROJ_ARROW, 1, SHOT_ARROW, 1)
setProjectile(PROJ_PLAYER_ARROW, 1, SHOT_PLAYER_ARROW, 1)
setProjectile(PROJ_BOLT, 1, SHOT_BOLT, shots.boltSpark.length)
setProjectile(PROJ_WAVE, 1, SHOT_WAVE, shots.waveCrescent.length)
setProjectile(PROJ_EMBER, 0, SHOT_EMBER_ORB, shots.emberOrb.length)
setProjectile(PROJ_TIDE, 0, SHOT_TIDE_ORB, shots.tideOrb.length)

export const FOES_DEFS: readonly (readonly [number, SpriteDef])[] = [
  [SPR_ENEMIES, spriteDef('enemies', KIND_ACTOR, enemyList)],
  [SPR_SHOTS, spriteDef('shots', KIND_PLAIN, shotList)],
  [SPR_SHOTS_ROTATED, spriteDef('shots-rotated', KIND_ROTATED, shotRotatedList)],
]

export const ENEMY_GLOW = Uint8Array.of(C_GOLD, C_GOLD, C_GOLD_PALE, C_TEAL, C_SKY, C_EMBER, C_SKY_LIGHT, C_GOLD, C_TEAL, C_SKY, C_EMBER, C_SKY_LIGHT, C_RED)
export const PROJ_TRAIL = Uint8Array.of(C_PALE, C_SKY_LIGHT, C_TEAL, C_SKY, C_EMBER, C_SKY)
export const PROJ_TRAIL_LIGHT = Uint8Array.of(C_WHITE, C_WHITE, C_SKY_LIGHT, C_WHITE, C_GOLD_PALE, C_SKY_LIGHT)
