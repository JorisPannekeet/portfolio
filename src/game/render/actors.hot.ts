import type { State } from '../sim/state.ts'
import { PHASE_DEAD } from '../sim/content.ts'
import { DEPTH_MARGIN, DEPTH_ROWS, type View } from './view.ts'
import { VARIANT_FLIP, VARIANT_NORMAL, VARIANT_WHITE, VARIANT_WHITE_FLIP } from './atlas.ts'
import {
  ENEMY_SPRITE,
  PLAYER_FRAME_IDLE,
  PLAYER_FRAME_IDLE_COUNT,
  PLAYER_FRAME_WALK,
  PLAYER_FRAME_WALK_COUNT,
  PROP_ANCHOR_X,
  PROP_ANCHOR_Y,
  PROP_FRAME_COUNT,
  PROP_FRAME_FIRST,
  PROP_SHADOW_X,
  PROP_SHADOW_Y,
  SPR_DRONE,
  SPR_PLAYER,
  SPR_PROPS,
  SPR_PROP_SHADOWS,
  SPR_SCOUT,
  SPR_THRUST,
  THRUST_FRAME_COUNT,
} from './sheet.ts'
import { blitAt, frameId } from './sprite.hot.ts'

const CULL = 48
const THRUST_LOW_X = -3
const THRUST_LOW_Y = 16
const THRUST_HIGH_X = -6
const THRUST_HIGH_Y = 10
const PLAYER_ID = -1
const PROP_ANIM_TICKS = 18
const SHADOW_ALPHA = 0.32
const SHADOW_OFFSET = 1
const GHOST_ALPHA = 0.45
const GHOST_COVERAGE = 0.4

function push(v: View, id: number, left: number, top: number, groundY: number): void {
  let row = groundY + DEPTH_MARGIN
  if (row < 0) row = 0
  if (row >= DEPTH_ROWS) row = DEPTH_ROWS - 1
  const i = v.depthCount++
  v.depthId[i] = id
  v.depthX[i] = left
  v.depthY[i] = top
  v.depthRow[i] = row
}

function visible(v: View, id: number, left: number, top: number): boolean {
  const a = v.atlas
  return left + a.rw[id]! > 0 && top + a.rh[id]! > 0 && left < v.width && top < v.height
}

export function drawPropShadows(v: View, s: State): void {
  const ox = v.originX
  const oy = v.originY
  v.ctx.globalAlpha = SHADOW_ALPHA
  for (let i = 0; i < s.propCount; i++) {
    const kind = s.propKind[i]!
    const id = frameId(v, SPR_PROP_SHADOWS, kind, 0)
    const left = Math.round(s.propX[i]! - ox) + SHADOW_OFFSET - PROP_SHADOW_X[kind]!
    const top = Math.round(s.propY[i]! - oy) + SHADOW_OFFSET - PROP_SHADOW_Y[kind]!
    if (visible(v, id, left, top)) blitAt(v, id, left, top, 1)
  }
  v.ctx.globalAlpha = 1
}

function collectProps(v: View, s: State, t: number): void {
  const ox = v.originX
  const oy = v.originY
  const beat = (t / PROP_ANIM_TICKS) | 0
  for (let i = 0; i < s.propCount; i++) {
    const kind = s.propKind[i]!
    const frames = PROP_FRAME_COUNT[kind]!
    const id = frameId(v, SPR_PROPS, PROP_FRAME_FIRST[kind]! + (frames > 1 ? (beat + i) % frames : 0), 0)
    const groundX = Math.round(s.propX[i]! - ox)
    const groundY = Math.round(s.propY[i]! - oy)
    const left = groundX - PROP_ANCHOR_X[kind]!
    const top = groundY - PROP_ANCHOR_Y[kind]!
    if (visible(v, id, left, top)) push(v, id, left, top, groundY)
  }
}

function collectEnemies(v: View, s: State, alpha: number, t: number): void {
  const a = v.atlas
  const ox = v.originX
  const oy = v.originY
  const right = v.width + CULL
  const bottom = v.height + CULL
  const step = (t / 14) | 0
  for (let i = 0; i < s.enemyCount; i++) {
    const wx = s.epx[i]! + (s.ex[i]! - s.epx[i]!) * alpha
    const wy = s.epy[i]! + (s.ey[i]! - s.epy[i]!) * alpha
    const x = Math.round(wx - ox)
    const y = Math.round(wy - oy)
    if (x < -CULL || y < -CULL || x > right || y > bottom) continue
    const type = s.eType[i]!
    const frame = (step + type + ((wx / 24) | 0)) & 1
    const variant = (s.px < wx ? VARIANT_FLIP : VARIANT_NORMAL) + (s.eFlash[i]! > 0 ? VARIANT_WHITE : 0)
    const id = frameId(v, ENEMY_SPRITE[type] ?? SPR_SCOUT, frame, variant)
    push(v, id, x - (a.rw[id]! >> 1), y - (a.rh[id]! >> 1), y)
  }
}

function collectDrones(v: View, s: State, alpha: number): void {
  const a = v.atlas
  const id = frameId(v, SPR_DRONE, 0, 0)
  for (let i = 0; i < s.droneCount; i++) {
    const x = Math.round(s.dronePx[i]! + (s.droneX[i]! - s.dronePx[i]!) * alpha - v.originX)
    const y = Math.round(s.dronePy[i]! + (s.droneY[i]! - s.dronePy[i]!) * alpha - v.originY)
    push(v, id, x - (a.rw[id]! >> 1), y - (a.rh[id]! >> 1), y)
  }
}

function drawThrust(v: View, frame: number, flip: boolean, left: number, top: number, relX: number, relY: number): void {
  const a = v.atlas
  const id = frameId(v, SPR_THRUST, frame, flip ? VARIANT_FLIP : VARIANT_NORMAL)
  const bodyW = a.rw[a.base[SPR_PLAYER]!]!
  const x = flip ? bodyW - relX - a.rw[id]! : relX
  blitAt(v, id, left + x, top + relY - (a.rh[id]! >> 1), 1)
}

function playerFrame(s: State, t: number): number {
  return s.px !== s.ppx || s.py !== s.ppy
    ? PLAYER_FRAME_WALK + (((t / 7) | 0) % PLAYER_FRAME_WALK_COUNT)
    : PLAYER_FRAME_IDLE + (((t / 30) | 0) % PLAYER_FRAME_IDLE_COUNT)
}

function playerHidden(s: State): boolean {
  return s.phase === PHASE_DEAD || (s.iframes > 0 && ((s.tick >> 2) & 1) === 1)
}

function drawPlayer(v: View, s: State, t: number, x: number, y: number): void {
  if (playerHidden(s)) return
  const moving = s.px !== s.ppx || s.py !== s.ppy
  const flip = s.faceX < 0
  const id = frameId(v, SPR_PLAYER, playerFrame(s, t), flip ? VARIANT_FLIP : VARIANT_NORMAL)
  const left = x - (v.atlas.rw[id]! >> 1)
  const top = y - (v.atlas.rh[id]! >> 1)
  if (moving) {
    const flare = ((t / 3) | 0) % THRUST_FRAME_COUNT
    drawThrust(v, flare, flip, left, top, THRUST_HIGH_X, THRUST_HIGH_Y)
    drawThrust(v, (flare + 1) % THRUST_FRAME_COUNT, flip, left, top, THRUST_LOW_X, THRUST_LOW_Y)
  }
  blitAt(v, id, left, top, 1)
}

function sortByRow(v: View): void {
  const start = v.depthStart
  let rows = v.height + DEPTH_MARGIN * 2
  if (rows > DEPTH_ROWS) rows = DEPTH_ROWS
  for (let r = 0; r <= rows; r++) start[r] = 0
  const count = v.depthCount
  for (let i = 0; i < count; i++) {
    const row = v.depthRow[i]! < rows ? v.depthRow[i]! : rows - 1
    v.depthRow[i] = row
    start[row + 1]!++
  }
  for (let r = 1; r <= rows; r++) start[r]! += start[r - 1]!
  for (let i = 0; i < count; i++) v.depthOrder[start[v.depthRow[i]!]!++] = i
}

function covers(v: View, id: number, left: number, top: number, playerLeft: number, playerTop: number, playerId: number): boolean {
  const a = v.atlas
  const pw = a.rw[playerId]!
  const ph = a.rh[playerId]!
  const w = Math.min(left + a.rw[id]!, playerLeft + pw) - Math.max(left, playerLeft)
  const h = Math.min(top + a.rh[id]!, playerTop + ph) - Math.max(top, playerTop)
  return w > 0 && h > 0 && w * h >= pw * ph * GHOST_COVERAGE
}

export function drawActors(v: View, s: State, alpha: number, t: number, playerX: number, playerY: number): void {
  v.depthCount = 0
  collectProps(v, s, t)
  const propsEnd = v.depthCount
  collectEnemies(v, s, alpha, t)
  collectDrones(v, s, alpha)
  push(v, PLAYER_ID, playerX, playerY, playerY)
  sortByRow(v)
  const ghostId = frameId(v, SPR_PLAYER, playerFrame(s, t), s.faceX < 0 ? VARIANT_WHITE_FLIP : VARIANT_WHITE)
  const ghostLeft = playerX - (v.atlas.rw[ghostId]! >> 1)
  const ghostTop = playerY - (v.atlas.rh[ghostId]! >> 1)
  let playerDrawn = false
  let covered = false
  for (let k = 0; k < v.depthCount; k++) {
    const i = v.depthOrder[k]!
    const id = v.depthId[i]!
    if (id === PLAYER_ID) {
      drawPlayer(v, s, t, v.depthX[i]!, v.depthY[i]!)
      playerDrawn = true
      continue
    }
    blitAt(v, id, v.depthX[i]!, v.depthY[i]!, 1)
    if (playerDrawn && !covered && i < propsEnd) covered = covers(v, id, v.depthX[i]!, v.depthY[i]!, ghostLeft, ghostTop, ghostId)
  }
  if (!covered || playerHidden(s)) return
  v.ctx.globalAlpha = GHOST_ALPHA
  blitAt(v, ghostId, ghostLeft, ghostTop, 1)
  v.ctx.globalAlpha = 1
}
