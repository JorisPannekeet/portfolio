import type { State } from '../sim/state.ts'
import {
  ENEMY_DREADNOUGHT,
  EVENT_CAP,
  EV_BLAST,
  EV_BOSS,
  EV_DEAD,
  EV_EVOLVE,
  EV_HEAL,
  EV_HIT,
  EV_HURT,
  EV_KILL,
  EV_LEVEL,
  EV_PICKUP,
  EV_PULSE,
  EV_SLASH,
  EV_WON,
} from '../sim/content.ts'
import {
  FX_BLAST,
  FX_CAP,
  FX_DEBRIS,
  FX_GLINT,
  FX_LEVEL_RING,
  FX_NONE,
  FX_NUMBER,
  FX_PULSE,
  FX_SLASH,
  FX_SPARK,
  type View,
} from './view.ts'
import { GLYPH_AMBER, GLYPH_DARK, GLYPH_GREEN, GLYPH_LIGHT, GLYPH_RED } from './atlas.ts'
import { SPR_DEBRIS, SPR_GLINT, SPR_SPARK } from './sheet.ts'
import { blitCentered, drawNumber, frameId, numberWidth } from './sprite.hot.ts'
import { AMBER, ARMOR, CORE, CYAN, CYAN_DEEP, PALE } from './colors.ts'

const TAU = Math.PI * 2
const MAX_NUMBERS_PER_FRAME = 3
const MAX_ACTIVE_NUMBERS = 28
const MAX_SPARKS_PER_FRAME = 10
const MAX_DEBRIS_KILLS_PER_FRAME = 14
const DEBRIS_PLAYER_FRAME = 7
const HEAVY_HIT = 40

export function random(v: View): number {
  let x = v.rng | 0
  x ^= x << 13
  x ^= x >>> 17
  x ^= x << 5
  v.rng = x >>> 0
  return v.rng / 4294967296
}

function spawn(v: View, kind: number, x: number, y: number, birth: number, life: number): number {
  const i = v.fxNext
  v.fxNext = (i + 1) % FX_CAP
  v.fxKind[i] = kind
  v.fxX[i] = x
  v.fxY[i] = y
  v.fxVx[i] = 0
  v.fxVy[i] = 0
  v.fxA[i] = 0
  v.fxB[i] = 0
  v.fxFrame[i] = 0
  v.fxBirth[i] = birth
  v.fxLife[i] = life
  return i
}

function spawnNumber(v: View, x: number, y: number, value: number, tint: number, birth: number): void {
  const i = spawn(v, FX_NUMBER, x + (random(v) * 6 - 3), y - 6, birth, 32)
  v.fxA[i] = value
  v.fxFrame[i] = tint
}

function spawnDebris(v: View, x: number, y: number, frame: number, count: number, speed: number, birth: number): void {
  for (let n = 0; n < count; n++) {
    const angle = random(v) * TAU
    const velocity = speed * (0.4 + random(v) * 0.6)
    const i = spawn(v, FX_DEBRIS, x, y, birth, 20 + random(v) * 12)
    v.fxVx[i] = Math.cos(angle) * velocity
    v.fxVy[i] = Math.sin(angle) * velocity
    v.fxFrame[i] = frame
  }
}

function startShake(v: View, until: number): void {
  if (v.reducedMotion) return
  if (until > v.shakeUntil) v.shakeUntil = until
}

function startFlash(v: View, color: string, now: number, life: number): void {
  v.flashColor = color
  v.flashStart = now
  v.flashUntil = now + life
}

export function clearEffects(v: View): void {
  v.fxKind.fill(FX_NONE)
  v.shakeUntil = 0
  v.flashUntil = 0
  v.activeNumbers = 0
}

export function consumeEvents(v: View, s: State): void {
  if (s.evHead < v.eventCursor || s.tick < v.lastTick) {
    v.eventCursor = 0
    clearEffects(v)
  }
  v.lastTick = s.tick
  if (s.evHead - v.eventCursor > EVENT_CAP) v.eventCursor = s.evHead - EVENT_CAP
  v.numbersThisFrame = 0
  v.sparksThisFrame = 0
  v.debrisThisFrame = 0
  const now = s.tick
  for (let n = v.eventCursor; n < s.evHead; n++) {
    const slot = n % EVENT_CAP
    const type = s.evType[slot]!
    const x = s.evX[slot]!
    const y = s.evY[slot]!
    const a = s.evA[slot]!
    const b = s.evB[slot]!
    if (type === EV_HIT) {
      if (v.sparksThisFrame < MAX_SPARKS_PER_FRAME) {
        v.sparksThisFrame++
        spawn(v, FX_SPARK, x + (random(v) * 6 - 3), y + (random(v) * 6 - 3), now, 9)
      }
      if (v.numbersThisFrame < MAX_NUMBERS_PER_FRAME && v.activeNumbers < MAX_ACTIVE_NUMBERS) {
        v.numbersThisFrame++
        v.activeNumbers++
        spawnNumber(v, x, y, a, a >= HEAVY_HIT ? GLYPH_AMBER : GLYPH_LIGHT, now)
      }
    } else if (type === EV_KILL) {
      if (a === ENEMY_DREADNOUGHT) {
        spawnDebris(v, x, y, a, 24, 2.4, now)
        const ring = spawn(v, FX_BLAST, x, y, now, 20)
        v.fxA[ring] = 48
        startShake(v, now + 24)
        startFlash(v, AMBER, now, 14)
      } else if (v.debrisThisFrame < MAX_DEBRIS_KILLS_PER_FRAME) {
        v.debrisThisFrame++
        spawnDebris(v, x, y, a, 4, 1.2, now)
      }
    } else if (type === EV_SLASH) {
      const i = spawn(v, FX_SLASH, x, y, now, 10)
      v.fxA[i] = a
      v.fxB[i] = b
    } else if (type === EV_BLAST) {
      const i = spawn(v, FX_BLAST, x, y, now, 14)
      v.fxA[i] = a
    } else if (type === EV_PULSE) {
      const i = spawn(v, FX_PULSE, x, y, now, 12)
      v.fxA[i] = a
    } else if (type === EV_PICKUP) {
      if (v.sparksThisFrame < MAX_SPARKS_PER_FRAME) {
        v.sparksThisFrame++
        spawn(v, FX_GLINT, x, y - 2, now, 9)
      }
    } else if (type === EV_HURT) {
      startShake(v, now + 10)
      spawnNumber(v, x, y - 6, a, GLYPH_RED, now)
    } else if (type === EV_LEVEL) {
      startFlash(v, ARMOR, now, 10)
      spawn(v, FX_LEVEL_RING, x, y, now, 18)
    } else if (type === EV_EVOLVE) {
      startFlash(v, AMBER, now, 18)
      spawn(v, FX_LEVEL_RING, x, y, now, 24)
    } else if (type === EV_BOSS) {
      startFlash(v, CORE, now, 16)
      startShake(v, now + 20)
    } else if (type === EV_HEAL) {
      spawnNumber(v, x, y - 6, a, GLYPH_GREEN, now)
    } else if (type === EV_DEAD) {
      spawnDebris(v, x, y, DEBRIS_PLAYER_FRAME, 18, 2, now)
      const i = spawn(v, FX_BLAST, x, y, now, 24)
      v.fxA[i] = 40
      startShake(v, now + 20)
      startFlash(v, CORE, now, 20)
    } else if (type === EV_WON) {
      startFlash(v, ARMOR, now, 30)
      spawn(v, FX_LEVEL_RING, x, y, now, 30)
    }
  }
  v.eventCursor = s.evHead
}

function stepAlpha(fade: number): number {
  return Math.ceil(fade * 4) / 4
}

function drawSlash(v: View, x: number, y: number, reach: number, side: number, p: number): void {
  const ctx = v.ctx
  const sweep = p < 0.6 ? p / 0.6 : 1
  const start = -Math.PI / 2
  const end = side < 0 ? start - Math.PI * sweep : start + Math.PI * sweep
  ctx.globalAlpha = p < 0.6 ? 1 : stepAlpha((1 - p) / 0.4)
  ctx.beginPath()
  ctx.ellipse(x, y, reach * 0.9, reach * 0.45, 0, start, end, side < 0)
  ctx.strokeStyle = CORE
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.strokeStyle = ARMOR
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(x, y, reach * 0.62, reach * 0.31, 0, start, end, side < 0)
  ctx.strokeStyle = CORE
  ctx.stroke()
}

function drawRing(v: View, x: number, y: number, radius: number, color: string, width: number, alpha: number): void {
  const ctx = v.ctx
  ctx.globalAlpha = alpha
  ctx.beginPath()
  ctx.arc(x, y, radius < 1 ? 1 : radius, 0, TAU)
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.stroke()
}

function drawBlast(v: View, x: number, y: number, radius: number, p: number): void {
  const grow = p * 1.8 < 1 ? p * 1.8 : 1
  const r = radius * (0.3 + 0.7 * grow)
  if (p < 0.25) {
    const ctx = v.ctx
    ctx.globalAlpha = 0.5
    ctx.beginPath()
    ctx.arc(x, y, r * 0.7, 0, TAU)
    ctx.fillStyle = PALE
    ctx.fill()
  }
  drawRing(v, x, y, r, AMBER, p < 0.5 ? 2 : 1, stepAlpha(1 - p))
}

function drawFloatingNumber(v: View, x: number, y: number, value: number, tint: number): void {
  const width = numberWidth(value, 1, 1)
  const left = x - (width >> 1)
  drawNumber(v, value, 1, GLYPH_DARK, left + 1, y + 1, 1)
  drawNumber(v, value, 1, tint, left, y, 1)
}

export function drawEffects(v: View, t: number, playerX: number, playerY: number): void {
  const ctx = v.ctx
  const ox = v.originX
  const oy = v.originY
  const right = v.width + 64
  const bottom = v.height + 64
  let numbers = 0
  for (let i = 0; i < FX_CAP; i++) {
    const kind = v.fxKind[i]!
    if (kind === FX_NONE) continue
    const age = t - v.fxBirth[i]!
    const life = v.fxLife[i]!
    if (age >= life || age < -1) {
      v.fxKind[i] = FX_NONE
      continue
    }
    const p = age < 0 ? 0 : age / life
    let x = v.fxX[i]! - ox
    let y = v.fxY[i]! - oy
    if (kind === FX_SLASH) {
      drawSlash(v, playerX, playerY, v.fxA[i]!, v.fxB[i]!, p)
      continue
    }
    if (x < -64 || y < -64 || x > right || y > bottom) continue
    if (kind === FX_SPARK) {
      blitCentered(v, frameId(v, SPR_SPARK, p < 0.34 ? 0 : p < 0.67 ? 1 : 2, 0), Math.round(x), Math.round(y))
    } else if (kind === FX_GLINT) {
      blitCentered(v, frameId(v, SPR_GLINT, p < 0.34 ? 0 : p < 0.67 ? 1 : 2, 0), Math.round(x), Math.round(y))
    } else if (kind === FX_DEBRIS) {
      const travel = age * (1 - p * 0.5)
      x += v.fxVx[i]! * travel
      y += v.fxVy[i]! * travel
      if (p < 0.75 || ((age >> 1) & 1) === 0) {
        blitCentered(v, frameId(v, SPR_DEBRIS, v.fxFrame[i]!, 0), Math.round(x), Math.round(y))
      }
    } else if (kind === FX_NUMBER) {
      numbers++
      const rise = age < 12 ? age * 0.75 : 9
      drawFloatingNumber(v, Math.round(x), Math.round(y - rise), v.fxA[i]!, v.fxFrame[i]!)
    } else if (kind === FX_BLAST) {
      drawBlast(v, x, y, v.fxA[i]!, p)
    } else if (kind === FX_PULSE) {
      drawRing(v, x, y, v.fxA[i]! * (0.2 + 0.8 * p), CYAN, 2, stepAlpha(1 - p))
      drawRing(v, x, y, v.fxA[i]! * (0.1 + 0.8 * p), CYAN_DEEP, 1, stepAlpha(1 - p))
    } else if (kind === FX_LEVEL_RING) {
      drawRing(v, playerX, playerY, 6 + p * 44, ARMOR, 2, stepAlpha(1 - p))
    }
  }
  v.activeNumbers = numbers
  ctx.globalAlpha = 1
}

export function drawFlash(v: View, t: number): void {
  if (t >= v.flashUntil) return
  const span = v.flashUntil - v.flashStart
  const fade = span > 0 ? (v.flashUntil - t) / span : 0
  const ctx = v.ctx
  ctx.globalAlpha = stepAlpha(fade) * 0.3
  ctx.fillStyle = v.flashColor
  ctx.fillRect(0, 0, v.width, v.height)
  ctx.globalAlpha = 1
}

export function shakeOffset(v: View, t: number): number {
  if (v.reducedMotion || t >= v.shakeUntil) return 0
  return Math.floor(random(v) * 5) - 2
}
