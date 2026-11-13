import { KIND_ACTOR, KIND_ROTATED, type SpriteDef } from '../../game/render/atlas.ts'
import { HERO_FRAMES } from '../sprites/aldric.ts'
import * as npcs from '../sprites/npcs.ts'
import * as gear from '../sprites/gear.ts'
import { hudGlyphs, hudHeart } from '../sprites/hud.ts'
import { frameList, native, spriteDef } from './frames.ts'
import { SPR_ALDRIC, SPR_BLADES, SPR_CAST, SPR_HELD } from './sheet-ids.ts'

const heroList = frameList()
native(heroList, ...HERO_FRAMES)

const bladeList = frameList()
export const ROT_SWORD = native(bladeList, gear.bladeSword)
export const ROT_GREATSWORD = native(bladeList, gear.bladeGreatsword)
export const ROT_HAMMER = native(bladeList, gear.bladeHammer)

const heldList = frameList()
export const HELD_SHIELD = native(heldList, gear.shieldSide)
export const HELD_BOW = native(heldList, gear.bowHeld)
export const HELD_SHIELD_FRONT = native(heldList, gear.shieldFront)
export const HELD_SHIELD_BACK = native(heldList, gear.shieldBack)
export const HELD_FIST = native(heldList, gear.heldFist)
export const HELD_HEART = native(heldList, hudHeart)
export const HELD_GLYPH = native(heldList, ...hudGlyphs)

export const castList = frameList()
export const CAST_KEY_ITEMS = native(castList, gear.warhammer, gear.grappleChain, gear.longbow)
export const CAST_HORSE = native(castList, ...npcs.horseFrames)
export const CAST_NPC = native(castList, ...npcs.npcMaren, ...npcs.npcSmith, ...npcs.npcChild, ...npcs.npcVillager)
export const CAST_NPC_ALT = native(castList, ...npcs.npcVillagerAlt)
export const CAST_NPC_FRAMES = npcs.npcMaren.length
export const HORSE_IDLE = npcs.HORSE_IDLE

export const REST_ANGLE = Float32Array.of(0.6, 2.55, 0.95, -1.2, -1.95, -1.2)
export const GUARD_ANGLE = Float32Array.of(0.6, 2.55, 0.95, -1.45, 3.14, 0)
export const WINDUP_ANGLE = Float32Array.of(-2, 2, 0.67)
export const SWEEP_SIDE = Int8Array.of(1, -1, -1)

export const HERO_DEFS: readonly (readonly [number, SpriteDef])[] = [
  [SPR_ALDRIC, spriteDef('aldric', KIND_ACTOR, heroList)],
  [SPR_BLADES, spriteDef('blades', KIND_ROTATED, bladeList)],
  [SPR_HELD, spriteDef('held', KIND_ACTOR, heldList)],
  [SPR_CAST, spriteDef('cast', KIND_ACTOR, castList)],
]
