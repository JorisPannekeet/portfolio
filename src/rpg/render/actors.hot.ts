import type { State } from '../sim/state.ts'
import {
  AI_AIR, AI_WINDUP, AREA_COUNT, BOSS_FORGEMASTER, CH_EMBER, ELEMENT_COUNT, ELEMENT_EMBER, ENEMY_BOSS_FIRST, HEAT_MAX, LOOT_ITEM, LOOT_RUNE, MAX_ENEMIES,
  MAX_OBJECTS, OBJ_EXIT, OBJ_LOOT, OBJ_NONE, PL_ATTACK, PL_BOW, PL_DEAD, PL_DODGE, PL_GRAPPLE, PL_GUARD, PL_HURT, PL_SKILL, TILE,
  TILE_BLOCKS_WALK, TILE_STAIRS,
} from '../sim/content.ts'
import {
  ACT_MELEE, ACT_SLAM, MAX_COMBO, MOVE_ACTIVE, MOVE_WINDUP, PATTERN_ACT, PATTERN_RANGE, STANCE_PLAIN, TWO_HANDED_TIME,
} from '../sim/combat-tuning.ts'
import { enemyRadius } from '../sim/enemies.hot.ts'
import { EXIT_CHAPTER_SHIFT } from '../sim/areas.ts'
import { LOOT_ITEM_TIER_MASK } from '../sim/loot-tables.ts'
import { DEPTH_ENEMY, DEPTH_MARGIN, DEPTH_OBJECT, DEPTH_PLAYER, DEPTH_ROWS, FX_PARTICLE, type View } from './view.ts'
import { VARIANT_FLIP, VARIANT_NORMAL, VARIANT_WHITE } from '../../game/render/atlas.ts'
import {
  AREA_BANNER, ARG_LINEAR, ENEMY_ELITE_OFFSET, ENEMY_FIRST, ENEMY_FLYING, ENEMY_PHASED, ENEMY_WALK, ENEMY_WINDUP,
  FX_GLINT, FX_SHIELD_FRONT, GLOW_GALE, GLOW_KEY, GLOW_SHARD, HELD_BOW, HELD_SHIELD, NONE, OBJ_ANIM_TICKS, OBJ_ARG_LIMIT, OBJ_ARG_MODE,
  OBJ_BASE, OBJ_BASE_ANIM, OBJ_BASE_STRIDE, OBJ_BOB, OBJ_FACE_PLAYER, OBJ_FLAT, OBJ_GLOW, OBJ_OVER, OBJ_OVER_ANIM, OBJ_OVER_STRIDE,
  OBJ_OVER_Y, OBJ_SHADOW, OBJ_STATES, PL_ELDER, PL_FRAME_BACK, PL_FRAME_BOW, PL_FRAME_DEAD, PL_FRAME_FRONT, PL_FRAME_GUARD, PL_FRAME_HURT,
  PL_FRAME_IDLE, PL_FRAME_MOUNTED, PL_FRAME_ROLL, PL_FRAME_STRIKE, PL_FRAME_WALK, PL_FRAME_WINDUP, PROP_BANNER, PROP_HORSE, ROT_EXIT, ROT_GREATSWORD,
  ROT_SWORD, SPR_ALDRIC, SPR_ENEMIES, SPR_FX, SPR_HELD, SPR_PROPS, SPR_ROTATED, VAREK_PHASE_FIRST,
} from './sheet.ts'
import { blitCentered, blitFoot, disc, frameId, rect, ring, rotationIndex } from './sprite.hot.ts'
import {
  C_CORRUPT_GLOW, C_EMBER, C_GOLD, C_GOLD_PALE, C_INK, C_RED, C_SKY, C_STONE_DARK, C_TEAL, C_WHITE, LOOT_GLINT, STANCE_COLOR, TIER_COLOR,
} from './colors.ts'
import { random, spawnFx } from './effects.hot.ts'

const TAU = Math.PI * 2
const FOOT = 6
const SKILL_WINDUP = 5
const SKILL_SWING = 8
const SHADOW_ALPHA = 0.32
const AIR_LIFT = 10

function push(v: View, kind: number, ref: number, footY: number): void {
  if (v.depthCount >= v.depthKind.length) return
  let row = footY + DEPTH_MARGIN
  if (row < 0) row = 0
  if (row >= DEPTH_ROWS) row = DEPTH_ROWS - 1
  const i = v.depthCount++
  v.depthKind[i] = kind
  v.depthRef[i] = ref
  v.depthRow[i] = row
}

function sortByRow(v: View): void {
  const start = v.depthStart
  for (let r = 0; r <= DEPTH_ROWS; r++) start[r] = 0
  const count = v.depthCount
  for (let i = 0; i < count; i++) start[v.depthRow[i]! + 1]!++
  for (let r = 1; r <= DEPTH_ROWS; r++) start[r]! += start[r - 1]!
  for (let i = 0; i < count; i++) v.depthOrder[start[v.depthRow[i]!]!++] = i
}

export function quadrant(face: number): number {
  return ((face + 128) & 1023) >> 8
}

function playerMoving(s: State): boolean {
  return s.playerX !== s.playerPrevX || s.playerY !== s.playerPrevY
}

function swingMove(s: State): number {
  const row = (s.stancesUnlocked & (1 << s.stance)) !== 0 ? s.stance : STANCE_PLAIN
  const step = s.playerCombo < 1 ? 0 : s.playerCombo > MAX_COMBO ? MAX_COMBO - 1 : s.playerCombo - 1
  return row * MAX_COMBO + step
}

function swingWindup(s: State): number {
  if (s.playerState !== PL_ATTACK) return SKILL_WINDUP
  return MOVE_WINDUP[swingMove(s)]! * (s.statTwoHanded !== 0 ? TWO_HANDED_TIME : 1)
}

function swingActive(s: State): number {
  if (s.playerState !== PL_ATTACK) return SKILL_SWING
  return MOVE_ACTIVE[swingMove(s)]! * (s.statTwoHanded !== 0 ? TWO_HANDED_TIME : 1)
}

export function playerFrame(s: State, t: number): number {
  const state = s.playerState
  const q = quadrant(s.playerFace)
  const moving = playerMoving(s)
  let frame = PL_FRAME_IDLE + (((t / 40) | 0) & 1)
  if (s.mounted !== 0) frame = PL_FRAME_MOUNTED
  else if (state === PL_DEAD) frame = PL_FRAME_DEAD
  else if (state === PL_DODGE) frame = PL_FRAME_ROLL + ((s.playerTimer >> 2) & 1)
  else if (state === PL_HURT) frame = PL_FRAME_HURT
  else if (q === 1 || q === 3) frame = (q === 1 ? PL_FRAME_FRONT : PL_FRAME_BACK) + (moving && state !== PL_GUARD ? 1 : 0)
  else if (state === PL_ATTACK || state === PL_SKILL) frame = s.playerTimer < swingWindup(s) ? PL_FRAME_WINDUP : PL_FRAME_STRIKE
  else if (state === PL_GUARD) frame = PL_FRAME_GUARD
  else if (state === PL_BOW || state === PL_GRAPPLE) frame = PL_FRAME_BOW
  else if (moving) frame = PL_FRAME_WALK + (((t / 6) | 0) & 3)
  return s.chapter >= CH_EMBER ? frame + PL_ELDER : frame
}

function playerVariant(s: State, t: number): number {
  const q = quadrant(s.playerFace)
  let flip = q === 2
  if ((q === 1 || q === 3) && s.mounted === 0 && playerMoving(s)) flip = (((t / 8) | 0) & 1) === 1
  const white = s.hurtFlashUntil > s.tick && ((s.tick >> 1) & 1) === 0
  return (flip ? VARIANT_FLIP : VARIANT_NORMAL) + (white ? VARIANT_WHITE : 0)
}

function drawBlade(v: View, frame: number, x: number, y: number, angle: number, reach: number): void {
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  blitCentered(v, frameId(v, SPR_ROTATED, frame, rotationIndex(dx, dy)), Math.round(x + dx * reach), Math.round(y + dy * reach))
}

function bladeAngle(s: State): number {
  const face = (s.playerFace * TAU) / 1024
  const q = quadrant(s.playerFace)
  const state = s.playerState
  const side = (s.playerCombo & 1) === 1 ? 1 : -1
  if (state === PL_ATTACK || state === PL_SKILL) {
    const windup = swingWindup(s)
    if (s.playerTimer < windup) return face - side * 2
    let p = (s.playerTimer - windup) / swingActive(s)
    if (p > 1) p = 1
    p = 1 - (1 - p) * (1 - p)
    return face - side * 1.7 + side * 3.4 * p
  }
  if (state === PL_GUARD) {
    if (q === 0) return -1.3
    if (q === 2) return Math.PI + 1.3
    return q === 1 ? -2.2 : -0.9
  }
  if (s.statTwoHanded !== 0) return q === 2 ? -2.2 : -0.9
  if (q === 2) return Math.PI - 1.15
  if (q === 0) return 1.15
  return q === 1 ? 1.85 : -1
}

function swordHandX(s: State, q: number): number {
  if (q === 0) return 2
  if (q === 2) return -2
  const swinging = s.playerState === PL_ATTACK || s.playerState === PL_SKILL
  if (s.statTwoHanded !== 0) return q === 1 ? 1 : 0
  if (swinging) return q === 1 ? 3 : 0
  return q === 1 ? -4 : 4
}

function weaponVisible(s: State): boolean {
  const state = s.playerState
  return s.mounted === 0 && state !== PL_DEAD && state !== PL_DODGE && state !== PL_BOW && state !== PL_GRAPPLE
}

function drawShield(v: View, s: State, x: number, y: number, front: boolean): void {
  if (s.statTwoHanded !== 0 || s.mounted !== 0 || s.playerState === PL_DEAD || s.playerState === PL_DODGE) return
  const q = quadrant(s.playerFace)
  const guarding = s.playerState === PL_GUARD
  if (q === 1 || q === 3) {
    const side = guarding ? 1 : 4
    if (front === (q === 1)) blitCentered(v, frameId(v, SPR_FX, FX_SHIELD_FRONT, 0), x + (q === 1 ? side : -side), y - 6)
    return
  }
  const east = q === 0
  if (front !== guarding) return
  const dx = guarding ? (east ? 5 : -5) : east ? -5 : 5
  blitCentered(v, frameId(v, SPR_HELD, HELD_SHIELD, east ? VARIANT_NORMAL : VARIANT_FLIP), x + dx, y - 6)
}

function drawStanceAura(v: View, s: State, t: number, x: number, y: number): void {
  if (s.stancesUnlocked === 0 || s.stance < 0 || s.stance >= ELEMENT_COUNT || s.playerState === PL_DEAD) return
  const pulse = ((t / 10) | 0) & 1
  ring(v, x, y + FOOT - 1, 8 + pulse, 3, STANCE_COLOR[s.stance]!, 1, 0.45)
  if (s.stance === ELEMENT_EMBER && s.heat > 0) {
    const heat = s.heat / HEAT_MAX
    disc(v, x, y - 4, 5 + heat * 5, 6 + heat * 5, C_EMBER, 0.12 + heat * 0.18)
    if (heat > 0.5 && ((t | 0) & 3) === 0) spawnFx(v, FX_PARTICLE, x + v.originX + (random(v) * 10 - 5), y + v.originY - 2, t, 18, C_GOLD_PALE, (random(v) - 0.5) * 0.2, -0.5)
  }
  v.ctx.globalAlpha = 1
}

function drawPlayer(v: View, s: State, t: number, x: number, y: number): void {
  const q = quadrant(s.playerFace)
  const behind = q === 3
  const hand = y - (s.statTwoHanded !== 0 ? 1 : 6)
  const reach = s.statTwoHanded !== 0 ? 8 : 6
  const bladeFrame = s.statTwoHanded !== 0 ? ROT_GREATSWORD : ROT_SWORD
  if (s.mounted !== 0) {
    const run = playerMoving(s) ? ((t / 6) | 0) & 1 : 0
    const flip = q === 2
    blitFoot(v, frameId(v, SPR_PROPS, PROP_HORSE + run, flip ? VARIANT_FLIP : VARIANT_NORMAL), x, y + FOOT)
    blitFoot(v, frameId(v, SPR_ALDRIC, playerFrame(s, t), playerVariant(s, t)), x + (flip ? 2 : -2), y + FOOT - 8)
    return
  }
  drawShield(v, s, x, y, false)
  if (weaponVisible(s) && behind) drawBlade(v, bladeFrame, x + swordHandX(s, q), hand, bladeAngle(s), reach)
  blitFoot(v, frameId(v, SPR_ALDRIC, playerFrame(s, t), playerVariant(s, t)), x, y + FOOT)
  if (weaponVisible(s) && !behind) drawBlade(v, bladeFrame, x + swordHandX(s, q), hand + 1, bladeAngle(s), reach)
  drawShield(v, s, x, y, true)
  if (s.playerState === PL_BOW) {
    const east = q !== 2
    blitCentered(v, frameId(v, SPR_HELD, HELD_BOW, east ? VARIANT_NORMAL : VARIANT_FLIP), x + (east ? 6 : -6), y - 5)
  }
}

function enemyFirst(s: State, kind: number): number {
  if (ENEMY_PHASED[kind]! === 0) return ENEMY_FIRST[kind]!
  const phase = s.bossPhase < 0 ? 0 : s.bossPhase > 2 ? 2 : s.bossPhase
  return VAREK_PHASE_FIRST[phase]!
}

function enemyLift(s: State, i: number, t: number): number {
  const kind = s.eKind[i]!
  let lift = ENEMY_FLYING[kind]! !== 0 ? 3 + (((t / 16 + i) | 0) & 1) : 0
  if (s.eState[i]! === AI_AIR) lift += AIR_LIFT
  return lift
}

function telegraphRadius(s: State, i: number): number {
  const kind = s.eKind[i]!
  const body = enemyRadius(s, i)
  if (kind < ENEMY_BOSS_FIRST) return body + 4
  const act = PATTERN_ACT[s.eAttack[i]!] ?? ACT_MELEE
  if (act === ACT_MELEE || act === ACT_SLAM) return body + (PATTERN_RANGE[s.eAttack[i]!] ?? 0) * 0.5
  return body + 4
}

function drawEnemy(v: View, s: State, i: number, t: number, x: number, y: number): void {
  const kind = s.eKind[i]!
  const first = enemyFirst(s, kind)
  const state = s.eState[i]!
  const moving = s.eX[i] !== s.ePrevX[i] || s.eY[i] !== s.ePrevY[i]
  let frame = first
  if (state === AI_WINDUP) frame = first + ENEMY_WINDUP[kind]!
  else if (moving && ENEMY_WALK[kind]! > 1) frame = first + (((t / 8 + i) | 0) & 1)
  if (s.eElite[i]! !== 0) frame += ENEMY_ELITE_OFFSET
  const face = s.eFace[i]! & 1023
  const west = face > 256 && face < 768
  const flash = s.eFlashUntil[i]! > s.tick
  const id = frameId(v, SPR_ENEMIES, frame, (west ? VARIANT_FLIP : VARIANT_NORMAL) + (flash ? VARIANT_WHITE : 0))
  const bob = kind >= ENEMY_BOSS_FIRST && state !== AI_WINDUP ? ((t / 24 + i) | 0) & 1 : 0
  const footY = y + FOOT - enemyLift(s, i, t) - bob
  if (state === AI_WINDUP) {
    const pulse = ((t / 3) | 0) & 1
    const r = telegraphRadius(s, i)
    ring(v, x, y + FOOT - 1, r + pulse * 2, r * 0.45 + pulse, C_RED, pulse + 1, 0.85)
    v.ctx.globalAlpha = 1
  }
  blitFoot(v, id, x, footY)
  const top = footY - v.atlas.rh[id]!
  if (kind === BOSS_FORGEMASTER && s.bossPhase === 1) {
    disc(v, x, (top + footY) >> 1, enemyRadius(s, i) + 3 + (((t / 4) | 0) & 1), (footY - top) >> 1, C_EMBER, 0.22)
    v.ctx.globalAlpha = 1
  }
  if (ENEMY_PHASED[kind]! !== 0 && s.bossPhase === 1) {
    const mid = (top + footY) >> 1
    for (let e = 0; e < ELEMENT_COUNT; e++) {
      const angle = t * 0.08 + (e * TAU) / ELEMENT_COUNT
      disc(v, x + Math.cos(angle) * 15, mid + Math.sin(angle) * 8, 2, 2, STANCE_COLOR[e]!, 0.9)
    }
    v.ctx.globalAlpha = 1
  }
  if (state === AI_WINDUP && ((t / 4) | 0) % 2 === 0) blitCentered(v, frameId(v, SPR_FX, FX_GLINT, 0), x + (west ? -4 : 4), top + 3)
  if (s.eBurn[i]! > s.tick && ((t | 0) & 1) === 0) {
    rect(v, (t | 0) & 2 ? C_EMBER : C_GOLD, x + ((random(v) * 10) | 0) - 5, top + 2 + ((random(v) * (footY - top - 4)) | 0), 1, 2)
  }
  if (s.eChill[i]! > s.tick) {
    disc(v, x, (top + footY) >> 1, 6, (footY - top) >> 1, C_SKY, 0.25)
    v.ctx.globalAlpha = 1
    rect(v, C_WHITE, x - 4, top + 3, 1, 1)
    rect(v, C_WHITE, x + 3, footY - 4, 1, 1)
  }
  if (s.eElite[i]! !== 0 && ((t | 0) % 9) === 0) spawnFx(v, FX_PARTICLE, x + v.originX + (random(v) * 12 - 6), footY + v.originY - 2, t, 22, C_CORRUPT_GLOW, 0, -0.45)
  const max = s.eMaxHp[i]!
  if (kind < ENEMY_BOSS_FIRST && max > 0 && s.eHp[i]! < max) {
    const w = 12
    rect(v, C_INK, x - (w >> 1) - 1, top - 4, w + 2, 3)
    rect(v, C_STONE_DARK, x - (w >> 1), top - 3, w, 1)
    rect(v, s.eElite[i]! !== 0 ? C_CORRUPT_GLOW : C_RED, x - (w >> 1), top - 3, Math.max(1, Math.round((w * s.eHp[i]!) / max)), 1)
  }
}

function objectArg(s: State, i: number, kind: number): number {
  const mode = OBJ_ARG_MODE[kind]!
  const limit = OBJ_ARG_LIMIT[kind]!
  let arg = 0
  if (mode === ARG_LINEAR) arg = s.objArg[i]!
  return arg < 0 ? 0 : arg >= limit ? limit - 1 : arg
}

function objectSlot(s: State, i: number): number {
  const state = s.objState[i]! > 0 ? 1 : 0
  return s.objKind[i]! * OBJ_STATES + state
}

function drawObject(v: View, s: State, i: number, t: number, x: number, y: number): void {
  const kind = s.objKind[i]!
  const slot = objectSlot(s, i)
  const arg = objectArg(s, i, kind)
  const beat = ((t / OBJ_ANIM_TICKS[slot]!) | 0) + i
  const variant = OBJ_FACE_PLAYER[slot]! !== 0 && v.playerX < x ? VARIANT_FLIP : VARIANT_NORMAL
  const glow = OBJ_GLOW[slot]!
  if (glow >= 0) {
    const pulse = ((t / 20) | 0) & 1
    const color = glow === GLOW_SHARD ? STANCE_COLOR[arg]! : glow === GLOW_GALE ? C_TEAL : C_GOLD
    disc(v, x, y + 2, 10 + pulse, 4 + pulse, color, glow === GLOW_KEY ? 0.18 + pulse * 0.08 : 0.22)
    v.ctx.globalAlpha = 1
  }
  const base = OBJ_BASE[slot]!
  const id = frameId(v, SPR_PROPS, base + arg * OBJ_BASE_STRIDE[slot]! + (beat % OBJ_BASE_ANIM[slot]!), variant)
  const bob = OBJ_BOB[slot]! * (((t / 20 + i) | 0) & 1)
  const lift = OBJ_OVER[slot]! === NONE ? bob : 0
  blitFoot(v, id, x, y + FOOT - lift)
  if (OBJ_OVER[slot]! !== NONE) {
    const over = frameId(v, SPR_PROPS, OBJ_OVER[slot]! + arg * OBJ_OVER_STRIDE[slot]! + (beat % OBJ_OVER_ANIM[slot]!), VARIANT_NORMAL)
    blitCentered(v, over, x, y + FOOT + OBJ_OVER_Y[slot]! - bob)
  }
  if (kind === OBJ_LOOT && ((t / 6 + i * 5) | 0) % 14 === 0) {
    const color = arg === LOOT_ITEM ? TIER_COLOR[s.objData[i]! & LOOT_ITEM_TIER_MASK] ?? C_WHITE : arg === LOOT_RUNE ? STANCE_COLOR[s.objData[i]!] ?? C_WHITE : LOOT_GLINT[arg]!
    spawnFx(v, FX_PARTICLE, x + v.originX + (random(v) * 6 - 3), y + v.originY - 2, t, 14, color, 0, -0.3)
  }
}

function drawShadow(v: View, x: number, y: number, w: number): void {
  disc(v, x, y + FOOT - 1, w * 0.5, w * 0.2 + 1, C_INK, SHADOW_ALPHA)
}

function tileKind(s: State, tx: number, ty: number): number {
  return tx < 0 || ty < 0 || tx >= s.mapW || ty >= s.mapH ? -1 : s.tiles[ty * s.mapW + tx]!
}

function walkBlocked(s: State, tx: number, ty: number): boolean {
  const kind = tileKind(s, tx, ty)
  return kind < 0 || TILE_BLOCKS_WALK[kind]! !== 0
}

export function exitHeading(s: State, i: number): number {
  const tx = Math.floor(s.objX[i]! / TILE)
  const ty = Math.floor(s.objY[i]! / TILE)
  const up = walkBlocked(s, tx, ty - 1)
  const down = walkBlocked(s, tx, ty + 1)
  const left = walkBlocked(s, tx - 1, ty)
  const right = walkBlocked(s, tx + 1, ty)
  if (down && !up && tileKind(s, tx, ty - 1) !== TILE_STAIRS) return 4
  if (up && !down && tileKind(s, tx, ty + 1) !== TILE_STAIRS) return 12
  if (right && !left) return 0
  if (left && !right) return 8
  return 4
}

function drawBanner(v: View, s: State, i: number, heading: number, x: number, y: number): void {
  const tx = Math.floor(s.objX[i]! / TILE)
  const ty = Math.floor(s.objY[i]! / TILE)
  const area = s.objArg[i]!
  if (area < 0 || area >= AREA_COUNT || AREA_BANNER[area]! < 0 || s.tiles[ty * s.mapW + tx] !== TILE_STAIRS) return
  const vertical = heading === 0 || heading === 8
  const nx = vertical ? tx : tx - 1
  const ny = vertical ? ty - 1 : ty
  if (nx >= 0 && ny >= 0 && s.tiles[ny * s.mapW + nx] === TILE_STAIRS) return
  const bx = vertical ? x + (heading === 0 ? 12 : -12) : x - 14
  const by = vertical ? y - 10 : y - 10
  blitFoot(v, frameId(v, SPR_PROPS, PROP_BANNER + AREA_BANNER[area]!, VARIANT_NORMAL), bx, by)
}

function drawExit(v: View, s: State, i: number, t: number, x: number, y: number): void {
  if (s.chapter < s.objData[i]! >> EXIT_CHAPTER_SHIFT) return
  const heading = exitHeading(s, i)
  drawBanner(v, s, i, heading, x, y)
  const dx = heading === 0 ? 1 : heading === 8 ? -1 : 0
  const dy = heading === 4 ? 1 : heading === 12 ? -1 : 0
  const pulse = ((t / 10 + i) | 0) % 3
  v.ctx.globalAlpha = 0.55 + pulse * 0.15
  blitCentered(v, frameId(v, SPR_ROTATED, ROT_EXIT, heading), x + dx * pulse, y + dy * pulse)
  v.ctx.globalAlpha = 1
}

export function drawFlatObjects(v: View, s: State, t: number): void {
  const ox = v.originX
  const oy = v.originY
  for (let i = 0; i < MAX_OBJECTS; i++) {
    if (s.objKind[i]! === OBJ_NONE) continue
    if (s.objKind[i]! === OBJ_EXIT) {
      const x = Math.round(s.objX[i]! - ox)
      const y = Math.round(s.objY[i]! - oy)
      if (x > -24 && y > -24 && x < v.width + 24 && y < v.height + 24) drawExit(v, s, i, t, x, y)
      continue
    }
    const slot = objectSlot(s, i)
    if (OBJ_BASE[slot]! === NONE || OBJ_FLAT[slot]! === 0) continue
    const x = Math.round(s.objX[i]! - ox)
    const y = Math.round(s.objY[i]! - oy)
    if (x < -24 || y < -24 || x > v.width + 24 || y > v.height + 24) continue
    drawObject(v, s, i, t, x, y)
  }
  v.ctx.globalAlpha = 1
}

export function drawActors(v: View, s: State, alpha: number, t: number): void {
  const ox = v.originX
  const oy = v.originY
  v.depthCount = 0
  for (let i = 0; i < MAX_OBJECTS; i++) {
    if (s.objKind[i]! === OBJ_NONE) continue
    const slot = objectSlot(s, i)
    if (OBJ_BASE[slot]! === NONE || OBJ_FLAT[slot]! !== 0) continue
    const x = Math.round(s.objX[i]! - ox)
    const y = Math.round(s.objY[i]! - oy)
    if (x < -40 || y < -24 || x > v.width + 40 || y > v.height + 64) continue
    if (OBJ_SHADOW[slot]! > 0) drawShadow(v, x, y, OBJ_SHADOW[slot]!)
    push(v, DEPTH_OBJECT, i, y)
  }
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (s.eAlive[i]! === 0) continue
    const x = Math.round(s.ePrevX[i]! + (s.eX[i]! - s.ePrevX[i]!) * alpha - ox)
    const y = Math.round(s.ePrevY[i]! + (s.eY[i]! - s.ePrevY[i]!) * alpha - oy)
    if (x < -48 || y < -24 || x > v.width + 48 || y > v.height + 72) continue
    drawShadow(v, x, y, enemyRadius(s, i) * 2)
    push(v, DEPTH_ENEMY, i, y)
  }
  drawShadow(v, v.playerX, v.playerY, s.mounted !== 0 ? 18 : 9)
  drawStanceAura(v, s, t, v.playerX, v.playerY)
  push(v, DEPTH_PLAYER, 0, v.playerY)
  v.ctx.globalAlpha = 1
  sortByRow(v)
  for (let k = 0; k < v.depthCount; k++) {
    const d = v.depthOrder[k]!
    const kind = v.depthKind[d]!
    const ref = v.depthRef[d]!
    if (kind === DEPTH_PLAYER) drawPlayer(v, s, t, v.playerX, v.playerY)
    else if (kind === DEPTH_ENEMY) {
      drawEnemy(
        v, s, ref, t,
        Math.round(s.ePrevX[ref]! + (s.eX[ref]! - s.ePrevX[ref]!) * alpha - ox),
        Math.round(s.ePrevY[ref]! + (s.eY[ref]! - s.ePrevY[ref]!) * alpha - oy),
      )
    } else drawObject(v, s, ref, t, Math.round(s.objX[ref]! - ox), Math.round(s.objY[ref]! - oy))
    v.ctx.globalAlpha = 1
  }
}

