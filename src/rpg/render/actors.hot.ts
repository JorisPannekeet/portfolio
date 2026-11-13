import type { State } from '../sim/state.ts'
import {
  AREA_COUNT, EVENT_CAP, EV_ENEMY_DIE, EV_HIT, EV_PLAYER_HURT, LOOT_ITEM, LOOT_RUNE, MAX_ENEMIES, MAX_OBJECTS, NPC_VILLAGER, OBJ_EXIT, OBJ_LOOT, OBJ_NONE,
  OBJ_NPC, TILE, TILE_BLOCKS_WALK, TILE_STAIRS, TILE_TREE,
} from '../sim/content.ts'
import { EXIT_CHAPTER_SHIFT } from '../sim/areas.ts'
import { LOOT_ITEM_TIER_MASK } from '../sim/loot-tables.ts'
import { DEPTH_ENEMY, DEPTH_LANDMARK, DEPTH_MARGIN, DEPTH_OBJECT, DEPTH_PLAYER, DEPTH_ROWS, DEPTH_TREE, FX_PARTICLE, type View } from './view.ts'
import { VARIANT_FLIP, VARIANT_NORMAL } from '../../game/render/atlas.ts'
import { NONE, SPR_MARKS, SPR_PROPS, SPR_TILES } from './sheet-ids.ts'
import {
  AREA_BANNER, ARG_LINEAR, LANDMARK_FRAME, LANDMARK_PART_END, LANDMARK_PART_START, PART_COLOR, PART_GLOW, PART_H, PART_KIND, PART_PENNANT, PART_W,
  PART_SMOKE, PART_X, PART_Y, PENNANT_FIRST, GLOW_GALE, GLOW_KEY, GLOW_SHARD, OBJ_ANIM_TICKS, OBJ_ARG_LIMIT, OBJ_ARG_MODE, OBJ_BASE, OBJ_BASE_ANIM, OBJ_BASE_STRIDE, OBJ_BOB,
  OBJ_FACE_PLAYER, OBJ_FLAT, OBJ_GLOW, OBJ_OVER, OBJ_OVER_ANIM, OBJ_OVER_STRIDE, OBJ_OVER_Y, OBJ_SHADOW, OBJ_SPRITE, OBJ_STATES, PROP_BANNER, ROT_EXIT,
} from './sheet-world.ts'
import { CAST_NPC_ALT } from './sheet-hero.ts'
import { FOOT, blitAt, blitCentered, blitFoot, disc, drawShadow, frameId, rect, snap } from './sprite.hot.ts'
import { C_GOLD, C_TEAL, C_WHITE, LOOT_GLINT, STANCE_COLOR, TIER_COLOR } from './colors.ts'
import { random, spawnFx } from './effects.hot.ts'
import { CORPSE_CAP, motion } from './motion.ts'
import { drawPlayer, drawPlayerGround } from './hero.hot.ts'
import { drawCorpses, drawEnemy, drawEnemyGround } from './foes.hot.ts'
import { drawTree, landmarkFoot, landmarkLead, landmarkOf, pushSmoke, treeFoot } from './tiles.hot.ts'
import { pushLight } from './light.hot.ts'

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

function scanEvents(s: State): void {
  const m = motion
  if (s.evHead < m.cursor || s.tick < m.lastTick) {
    m.cursor = s.evHead
    m.corpseKind.fill(-1)
    m.trailTick.fill(-1e9)
    m.hpShown = -1
  }
  m.lastTick = s.tick
  if (s.evHead - m.cursor > EVENT_CAP) m.cursor = s.evHead - EVENT_CAP
  for (let n = m.cursor; n < s.evHead; n++) {
    const slot = n % EVENT_CAP
    const type = s.evType[slot]!
    if (type === EV_HIT) m.hitAt = s.tick
    else if (type === EV_PLAYER_HURT) m.hurtAt = s.tick
    else if (type === EV_ENEMY_DIE) {
      const i = m.corpseNext
      m.corpseNext = (i + 1) % CORPSE_CAP
      m.corpseKind[i] = s.evA[slot]!
      m.corpseElite[i] = s.evB[slot]! !== 0 ? 1 : 0
      m.corpseX[i] = s.evX[slot]!
      m.corpseY[i] = s.evY[slot]!
      m.corpseFlip[i] = s.playerX < s.evX[slot]! ? 1 : 0
      m.corpseBorn[i] = s.tick
    }
  }
  m.cursor = s.evHead
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
  const base = kind === OBJ_NPC && arg === NPC_VILLAGER && (i & 1) === 1 ? CAST_NPC_ALT - arg * OBJ_BASE_STRIDE[slot]! : OBJ_BASE[slot]!
  const id = frameId(v, OBJ_SPRITE[slot]!, base + arg * OBJ_BASE_STRIDE[slot]! + (beat % OBJ_BASE_ANIM[slot]!), variant)
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

function drawChevron(v: View, i: number, t: number, heading: number, x: number, y: number): void {
  const dx = heading === 0 ? 1 : heading === 8 ? -1 : 0
  const dy = heading === 4 ? 1 : heading === 12 ? -1 : 0
  const pulse = ((t / 10 + i) | 0) % 3
  v.ctx.globalAlpha = 0.55 + pulse * 0.15
  blitCentered(v, frameId(v, SPR_MARKS, ROT_EXIT, heading), x + dx * pulse, y + dy * pulse)
  v.ctx.globalAlpha = 1
}

function drawExit(v: View, s: State, i: number, t: number, x: number, y: number): void {
  if (s.chapter < s.objData[i]! >> EXIT_CHAPTER_SHIFT || landmarkOf(s, i) >= 0) return
  const heading = exitHeading(s, i)
  drawBanner(v, s, i, heading, x, y)
  drawChevron(v, i, t, heading, x, y)
}

function drawLandmark(v: View, s: State, i: number, t: number): void {
  const area = s.objArg[i]!
  const x = snap(s.objX[i]! + TILE / 2 - v.originX)
  const foot = snap(landmarkFoot(s, i) - v.originY)
  blitFoot(v, frameId(v, SPR_TILES, LANDMARK_FRAME[area]!, 0), x, foot)
  const flap = v.reducedMotion ? 0 : ((t / 9) | 0) & 1
  for (let p = LANDMARK_PART_START[area]!; p < LANDMARK_PART_END[area]!; p++) {
    const kind = PART_KIND[p]!
    const px = x + PART_X[p]!
    const py = foot + PART_Y[p]!
    if (kind === PART_SMOKE) {
      if (!v.reducedMotion) pushSmoke(v, px + PART_W[p]! / 2 + v.originX, py + v.originY, PART_COLOR[p]!, 2)
    } else if (kind === PART_PENNANT) blitAt(v, frameId(v, SPR_TILES, PENNANT_FIRST + ((flap + p) & 1), 0), px, py, 1)
    else if (kind === PART_GLOW) {
      const flicker = v.reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.21 + p * 1.9) * Math.sin(t * 0.077 + p)
      v.ctx.globalAlpha = 0.1 + flicker * 0.22
      rect(v, PART_COLOR[p]!, px, py, PART_W[p]!, PART_H[p]!)
      if (v.night > 0.2) pushLight(v, px + PART_W[p]! / 2, py + PART_H[p]! / 2, 18 + PART_W[p]! + flicker * 4, PART_COLOR[p]!)
    }
  }
  v.ctx.globalAlpha = 1
  if (s.chapter < s.objData[i]! >> EXIT_CHAPTER_SHIFT) return
  const heading = exitHeading(s, i)
  drawChevron(v, i, t, heading, x - TILE / 2, foot - TILE / 2)
  drawChevron(v, i, t, heading, x + TILE / 2, foot - TILE / 2)
}

export function drawFlatObjects(v: View, s: State, t: number): void {
  const ox = v.originX
  const oy = v.originY
  for (let i = 0; i < MAX_OBJECTS; i++) {
    if (s.objKind[i]! === OBJ_NONE) continue
    if (s.objKind[i]! === OBJ_EXIT) {
      const x = snap(s.objX[i]! - ox)
      const y = snap(s.objY[i]! - oy)
      if (x > -24 && y > -24 && x < v.width + 24 && y < v.height + 24) drawExit(v, s, i, t, x, y)
      continue
    }
    const slot = objectSlot(s, i)
    if (OBJ_BASE[slot]! === NONE || OBJ_FLAT[slot]! === 0) continue
    const x = snap(s.objX[i]! - ox)
    const y = snap(s.objY[i]! - oy)
    if (x < -24 || y < -24 || x > v.width + 24 || y > v.height + 24) continue
    drawObject(v, s, i, t, x, y)
  }
  v.ctx.globalAlpha = 1
}

const CANOPY_TILES = 3

function pushTrees(v: View, s: State): void {
  const x0 = Math.floor(v.originX / TILE) - 1
  const x1 = Math.floor((v.originX + v.width) / TILE) + 1
  const y0 = Math.floor(v.originY / TILE)
  const y1 = Math.floor((v.originY + v.height) / TILE) + CANOPY_TILES
  for (let ty = y0 < 0 ? 0 : y0; ty <= y1 && ty < s.mapH; ty++) {
    for (let tx = x0 < 0 ? 0 : x0; tx <= x1 && tx < s.mapW; tx++) {
      const cell = ty * s.mapW + tx
      if (s.tiles[cell] === TILE_TREE) push(v, DEPTH_TREE, cell, treeFoot(v, tx, ty))
    }
  }
}

export function drawActors(v: View, s: State, alpha: number, t: number): void {
  const ox = v.originX
  const oy = v.originY
  v.depthCount = 0
  scanEvents(s)
  drawCorpses(v, t)
  for (let i = 0; i < MAX_OBJECTS; i++) {
    if (s.objKind[i]! === OBJ_NONE) continue
    if (landmarkOf(s, i) >= 0) {
      if (!landmarkLead(s, i)) continue
      const x = s.objX[i]! - ox
      const foot = landmarkFoot(s, i) - oy
      if (x > -140 && x < v.width + 140 && foot > -8 && foot < v.height + 130) push(v, DEPTH_LANDMARK, i, foot - FOOT)
      continue
    }
    const slot = objectSlot(s, i)
    if (OBJ_BASE[slot]! === NONE || OBJ_FLAT[slot]! !== 0) continue
    const x = snap(s.objX[i]! - ox)
    const y = snap(s.objY[i]! - oy)
    if (x < -40 || y < -24 || x > v.width + 40 || y > v.height + 64) continue
    if (OBJ_SHADOW[slot]! > 0) drawShadow(v, x, y, OBJ_SHADOW[slot]!, 0)
    push(v, DEPTH_OBJECT, i, y)
  }
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (s.eAlive[i]! === 0) continue
    const x = snap(s.ePrevX[i]! + (s.eX[i]! - s.ePrevX[i]!) * alpha - ox)
    const y = snap(s.ePrevY[i]! + (s.eY[i]! - s.ePrevY[i]!) * alpha - oy)
    if (x < -48 || y < -24 || x > v.width + 48 || y > v.height + 72) continue
    drawEnemyGround(v, s, i, t, x, y)
    push(v, DEPTH_ENEMY, i, y)
  }
  drawPlayerGround(v, s, t)
  push(v, DEPTH_PLAYER, 0, v.playerY)
  pushTrees(v, s)
  v.ctx.globalAlpha = 1
  sortByRow(v)
  for (let k = 0; k < v.depthCount; k++) {
    const d = v.depthOrder[k]!
    const kind = v.depthKind[d]!
    const ref = v.depthRef[d]!
    if (kind === DEPTH_PLAYER) drawPlayer(v, s, t, v.playerX, v.playerY)
    else if (kind === DEPTH_TREE) drawTree(v, ref % s.mapW, (ref / s.mapW) | 0, t)
    else if (kind === DEPTH_LANDMARK) drawLandmark(v, s, ref, t)
    else if (kind === DEPTH_ENEMY) {
      drawEnemy(
        v, s, ref, t,
        snap(s.ePrevX[ref]! + (s.eX[ref]! - s.ePrevX[ref]!) * alpha - ox),
        snap(s.ePrevY[ref]! + (s.eY[ref]! - s.ePrevY[ref]!) * alpha - oy),
      )
    } else drawObject(v, s, ref, t, snap(s.objX[ref]! - ox), snap(s.objY[ref]! - oy))
    v.ctx.globalAlpha = 1
  }
}
