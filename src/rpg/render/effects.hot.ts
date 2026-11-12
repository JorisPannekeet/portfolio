import type { State } from '../sim/state.ts'
import {
  ELEMENT_COUNT, ELEMENT_EMBER, ELEMENT_GALE, ELEMENT_STONE, ELEMENT_TIDE, ENEMY_BOSS_FIRST, EVENT_CAP, EV_AREA, EV_BLOCK,
  EV_BOSS_PHASE, EV_CHEST, EV_DEAD, EV_DEFLECT, EV_DODGE, EV_DOOR, EV_ENEMY_DIE, EV_FINISHER, EV_FORGE, EV_HIT, EV_HORN,
  EV_ITEM_GAIN, EV_KEY_ITEM, EV_LEVEL_UP, EV_LOOT_DROP, EV_MOUNT, EV_PARRY, EV_PERFECT_BLOCK, EV_PICKUP, EV_PLAYER_HURT,
  EV_PUZZLE, EV_SHARD, EV_SKILL, EV_STANCE, EV_SWING, EV_TELEGRAPH, EV_VIGIL, LOOT_GOLD, LOOT_HEART, TIER_COUNT,
} from '../sim/content.ts'
import {
  FX_ARC, FX_CAP, FX_DISC, FX_GLINT, FX_NONE, FX_NUMBER, FX_PARTICLE, FX_PROP, FX_PUFF, FX_RING, FX_SPARK, type View,
} from './view.ts'
import { GLYPH_AMBER, GLYPH_DARK, GLYPH_GREEN, GLYPH_LIGHT, GLYPH_RED } from '../../game/render/atlas.ts'
import { FX_GLINT as GLINT_FRAME, FX_PUFF as PUFF_FRAME, FX_SPARK as SPARK_FRAME, PROP_KEY_ITEMS, SPR_FX, SPR_PROPS } from './sheet.ts'
import { blitCentered, disc, drawNumber, frameId, numberWidth, ring } from './sprite.hot.ts'
import {
  C_CORRUPT_GLOW, C_DUST, C_EMBER, C_GOLD, C_GOLD_PALE, C_PALE, C_RED, C_STEEL, C_TEAL, C_WHITE, HEX, STANCE_COLOR, STANCE_DEEP,
  STANCE_LIGHT, TIER_COLOR,
} from './colors.ts'

const TAU = Math.PI * 2
const MAX_NUMBERS_PER_FRAME = 4
const HEAVY_HIT = 30
const SKILL_RADIUS = 44
const BODY_LIFT = 5

export function random(v: View): number {
  let x = v.rng | 0
  x ^= x << 13
  x ^= x >>> 17
  x ^= x << 5
  v.rng = x >>> 0
  return v.rng / 4294967296
}

export function spawnFx(v: View, kind: number, x: number, y: number, birth: number, life: number, color: number, vx: number, vy: number): number {
  const i = v.fxNext
  v.fxNext = (i + 1) % FX_CAP
  v.fxKind[i] = kind
  v.fxX[i] = x
  v.fxY[i] = y
  v.fxVx[i] = vx
  v.fxVy[i] = vy
  v.fxA[i] = 0
  v.fxB[i] = 0
  v.fxColor[i] = color
  v.fxBirth[i] = birth
  v.fxLife[i] = life
  return i
}

function spawnRing(v: View, x: number, y: number, now: number, life: number, color: number, radius: number, width: number): void {
  const i = spawnFx(v, FX_RING, x, y, now, life, color, 0, 0)
  v.fxA[i] = radius
  v.fxB[i] = width
}

function spawnDisc(v: View, x: number, y: number, now: number, life: number, color: number, radius: number): void {
  const i = spawnFx(v, FX_DISC, x, y, now, life, color, 0, 0)
  v.fxA[i] = radius
}

function burst(v: View, x: number, y: number, now: number, count: number, color: number, speed: number, gravity: number): void {
  for (let n = 0; n < count; n++) {
    const angle = random(v) * TAU
    const velocity = speed * (0.35 + random(v) * 0.65)
    const i = spawnFx(v, FX_PARTICLE, x, y, now, 14 + random(v) * 14, color, Math.cos(angle) * velocity, Math.sin(angle) * velocity * 0.7)
    v.fxB[i] = gravity
    v.fxA[i] = random(v) < 0.3 ? 1 : 0
  }
}

function spawnNumber(v: View, x: number, y: number, value: number, tint: number, now: number): void {
  if (v.numbersThisFrame >= MAX_NUMBERS_PER_FRAME) return
  v.numbersThisFrame++
  const i = spawnFx(v, FX_NUMBER, x + (random(v) * 6 - 3), y - 10, now, 34, tint, 0, 0)
  v.fxA[i] = value
}

function shake(v: View, now: number, life: number, power: number): void {
  if (v.reducedMotion) return
  if (now + life > v.shakeUntil) v.shakeUntil = now + life
  if (power > v.shakePower || now >= v.shakeUntil - life) v.shakePower = power
}

function flash(v: View, color: number, now: number, life: number, strength: number): void {
  v.flashColor = color
  v.flashStart = now
  v.flashUntil = now + life
  v.flashStrength = strength
}

export function clearEffects(v: View): void {
  v.fxKind.fill(FX_NONE)
  v.shakeUntil = 0
  v.flashUntil = 0
}

function element(a: number): number {
  return a < 0 || a >= ELEMENT_COUNT ? -1 : a
}

function skillEffect(v: View, e: number, x: number, y: number, now: number, scale: number): void {
  const color = STANCE_COLOR[e]!
  const light = STANCE_LIGHT[e]!
  const deep = STANCE_DEEP[e]!
  const r = SKILL_RADIUS * scale
  if (e === ELEMENT_STONE) {
    spawnRing(v, x, y, now, 18, deep, r, 3)
    spawnRing(v, x, y, now + 2, 16, color, r * 0.75, 2)
    burst(v, x, y, now, 14, deep, 2.2, 0.12)
    shake(v, now, 12, 2)
  } else if (e === ELEMENT_TIDE) {
    spawnRing(v, x, y, now, 22, light, r, 2)
    spawnRing(v, x, y, now + 3, 20, color, r * 0.8, 1)
    burst(v, x, y, now, 16, light, 2.4, 0)
  } else if (e === ELEMENT_EMBER) {
    spawnDisc(v, x, y - BODY_LIFT, now, 12, light, r * 0.55)
    spawnRing(v, x, y, now, 16, color, r * 0.9, 3)
    burst(v, x, y - BODY_LIFT, now, 18, color, 2, -0.04)
    burst(v, x, y - BODY_LIFT, now, 8, light, 1.4, -0.04)
  } else if (e === ELEMENT_GALE) {
    spawnRing(v, x, y, now, 14, light, r * 0.6, 1)
    spawnRing(v, x, y, now + 4, 16, color, r, 1)
    spawnRing(v, x, y, now + 8, 16, light, r * 1.2, 1)
    burst(v, x, y - BODY_LIFT, now, 12, light, 2.8, 0)
  }
}

export function consumeEvents(v: View, s: State): void {
  if (s.evHead < v.eventCursor || s.tick < v.lastTick) {
    v.eventCursor = s.evHead
    clearEffects(v)
  }
  v.lastTick = s.tick
  if (s.evHead - v.eventCursor > EVENT_CAP) v.eventCursor = s.evHead - EVENT_CAP
  v.numbersThisFrame = 0
  const now = s.tick
  for (let n = v.eventCursor; n < s.evHead; n++) {
    const slot = n % EVENT_CAP
    const type = s.evType[slot]!
    const x = s.evX[slot]!
    const y = s.evY[slot]!
    const a = s.evA[slot]!
    const b = s.evB[slot]!
    if (type === EV_SWING) {
      const e = (s.stancesUnlocked & (1 << a)) !== 0 ? element(a) : -1
      const i = spawnFx(v, FX_ARC, s.playerX, s.playerY, now, 10, e < 0 ? C_PALE : STANCE_COLOR[e]!, 0, 0)
      v.fxA[i] = (s.playerFace * TAU) / 1024
      v.fxB[i] = (b & 1) === 0 ? 1 : -1
    } else if (type === EV_HIT) {
      spawnFx(v, FX_SPARK, x + (random(v) * 6 - 3), y - BODY_LIFT + (random(v) * 6 - 3), now, 9, C_WHITE, 0, 0)
      burst(v, x, y - BODY_LIFT, now, 4, b >= HEAVY_HIT ? C_GOLD : C_WHITE, 1.6, 0.08)
      spawnNumber(v, x, y, b, b >= HEAVY_HIT ? GLYPH_AMBER : GLYPH_LIGHT, now)
      if (b >= HEAVY_HIT) shake(v, now, 6, 1)
    } else if (type === EV_PLAYER_HURT) {
      spawnNumber(v, x, y, a, GLYPH_RED, now)
      burst(v, x, y - BODY_LIFT, now, 6, C_RED, 1.4, 0.1)
      shake(v, now, a >= HEAVY_HIT ? 14 : 8, a >= HEAVY_HIT ? 3 : 2)
      flash(v, C_RED, now, 8, 0.18)
    } else if (type === EV_BLOCK) {
      spawnFx(v, FX_SPARK, x, y - BODY_LIFT, now, 8, C_STEEL, 0, 0)
      burst(v, x, y - BODY_LIFT, now, 5, C_STEEL, 1.5, 0.1)
      spawnRing(v, x, y - BODY_LIFT, now, 8, C_STEEL, 9, 1)
    } else if (type === EV_PERFECT_BLOCK || type === EV_PARRY) {
      const color = type === EV_PARRY ? STANCE_LIGHT[ELEMENT_TIDE]! : C_WHITE
      spawnFx(v, FX_GLINT, x, y - BODY_LIFT, now, 12, color, 0, 0)
      spawnRing(v, x, y - BODY_LIFT, now, 12, color, 18, 2)
      burst(v, x, y - BODY_LIFT, now, 10, color, 2.2, 0)
      flash(v, color, now, 6, 0.22)
      shake(v, now, 5, 1)
    } else if (type === EV_DODGE) {
      const color = a === 1 ? STANCE_LIGHT[ELEMENT_GALE]! : C_DUST
      burst(v, x, y + BODY_LIFT, now, a === 1 ? 10 : 5, color, a === 1 ? 1.8 : 0.8, -0.02)
      if (a === 1) spawnRing(v, x, y, now, 10, STANCE_COLOR[ELEMENT_GALE]!, 14, 1)
    } else if (type === EV_SKILL) {
      const e = element(a)
      if (e >= 0) skillEffect(v, e, x, y, now, 1)
    } else if (type === EV_STANCE) {
      const e = element(a)
      if (e >= 0) {
        spawnRing(v, s.playerX, s.playerY - BODY_LIFT, now, 12, STANCE_COLOR[e]!, 14, 1)
        burst(v, s.playerX, s.playerY - BODY_LIFT, now, 6, STANCE_LIGHT[e]!, 1.2, -0.05)
      }
    } else if (type === EV_FINISHER) {
      const e = element(a)
      if (e >= 0) {
        skillEffect(v, e, x, y, now, 0.8)
        spawnFx(v, FX_GLINT, x, y - BODY_LIFT, now, 12, C_WHITE, 0, 0)
        flash(v, STANCE_LIGHT[e]!, now, 10, 0.25)
      }
      shake(v, now, 12, 3)
    } else if (type === EV_ENEMY_DIE) {
      const boss = a >= ENEMY_BOSS_FIRST
      spawnFx(v, FX_PUFF, x, y - BODY_LIFT, now, 15, C_PALE, 0, 0)
      burst(v, x, y - BODY_LIFT, now, boss ? 30 : 8, b !== 0 ? C_CORRUPT_GLOW : C_PALE, boss ? 2.6 : 1.2, -0.02)
      if (boss) {
        spawnRing(v, x, y, now, 26, C_WHITE, 56, 3)
        flash(v, C_WHITE, now, 24, 0.4)
        shake(v, now, 26, 4)
      }
    } else if (type === EV_TELEGRAPH) {
      spawnFx(v, FX_GLINT, x, y - 12, now, 10, C_RED, 0, 0)
    } else if (type === EV_DEFLECT) {
      spawnFx(v, FX_SPARK, x, y, now, 8, C_TEAL, 0, 0)
      spawnRing(v, x, y, now, 8, C_TEAL, 8, 1)
    } else if (type === EV_BOSS_PHASE) {
      spawnRing(v, x, y, now, 30, C_CORRUPT_GLOW, 64, 3)
      burst(v, x, y - 12, now, 24, C_GOLD, 2.6, 0)
      flash(v, C_WHITE, now, 20, 0.45)
      shake(v, now, 30, 4)
    } else if (type === EV_DEAD) {
      burst(v, x, y - BODY_LIFT, now, 14, C_RED, 1.6, 0.08)
      flash(v, C_RED, now, 30, 0.35)
      shake(v, now, 16, 3)
    } else if (type === EV_LOOT_DROP || type === EV_ITEM_GAIN) {
      const tier = b < 0 ? 0 : b >= TIER_COUNT ? TIER_COUNT - 1 : b
      spawnFx(v, FX_GLINT, type === EV_ITEM_GAIN ? s.playerX : x, (type === EV_ITEM_GAIN ? s.playerY : y) - 8, now, 14, TIER_COLOR[tier]!, 0, 0)
      burst(v, x, y, now, 6, TIER_COLOR[tier]!, 1, -0.03)
    } else if (type === EV_PICKUP) {
      spawnFx(v, FX_GLINT, x, y - 4, now, 10, C_GOLD_PALE, 0, 0)
      if (a === LOOT_GOLD && b > 0) spawnNumber(v, x, y, b, GLYPH_AMBER, now)
      else if (a === LOOT_HEART && b > 0) spawnNumber(v, x, y, b, GLYPH_GREEN, now)
    } else if (type === EV_LEVEL_UP) {
      spawnRing(v, s.playerX, s.playerY, now, 24, C_GOLD_PALE, 30, 2)
      burst(v, s.playerX, s.playerY, now, 16, C_GOLD, 1.4, -0.06)
      flash(v, C_GOLD_PALE, now, 14, 0.3)
    } else if (type === EV_PUZZLE) {
      const e = element(a)
      const color = e < 0 ? C_DUST : STANCE_COLOR[e]!
      spawnRing(v, x, y, now, 18, color, 14, 2)
      spawnFx(v, FX_PUFF, x, y, now, 15, C_PALE, 0, 0)
      burst(v, x, y, now, 10, color, 1.6, 0.06)
      shake(v, now, 8, 1)
    } else if (type === EV_DOOR || type === EV_MOUNT) {
      spawnFx(v, FX_PUFF, x, y, now, 14, C_PALE, 0, 0)
      burst(v, x, y + 4, now, 6, C_DUST, 0.9, 0)
    } else if (type === EV_CHEST || type === EV_KEY_ITEM) {
      spawnFx(v, FX_GLINT, x, y - 8, now, 16, C_GOLD_PALE, 0, 0)
      burst(v, x, y - 4, now, 14, C_GOLD, 1.8, 0.02)
      if (type === EV_KEY_ITEM && a > 0) {
        const held = spawnFx(v, FX_PROP, s.playerX, s.playerY - 22, now, 70, C_GOLD_PALE, 0, 0)
        v.fxA[held] = PROP_KEY_ITEMS + 31 - Math.clz32(a)
        flash(v, C_GOLD_PALE, now, 16, 0.3)
      }
    } else if (type === EV_SHARD) {
      const e = element(a)
      const color = e < 0 ? C_WHITE : STANCE_LIGHT[e]!
      spawnRing(v, x, y, now, 30, color, 48, 3)
      spawnRing(v, x, y, now + 8, 30, C_WHITE, 32, 1)
      burst(v, x, y - 8, now, 24, color, 2.2, -0.04)
      flash(v, color, now, 30, 0.5)
      shake(v, now, 18, 2)
    } else if (type === EV_VIGIL) {
      flash(v, C_WHITE, now, 90, 0.8)
    } else if (type === EV_HORN) {
      spawnRing(v, s.playerX, s.playerY - BODY_LIFT, now, 22, C_TEAL, 26, 1)
      spawnRing(v, s.playerX, s.playerY - BODY_LIFT, now + 7, 22, C_TEAL, 26, 1)
      spawnRing(v, s.playerX, s.playerY - BODY_LIFT, now + 14, 22, C_GOLD_PALE, 26, 1)
    } else if (type === EV_FORGE) {
      if (b !== 0) burst(v, x, y - 6, now, 14, C_EMBER, 1.8, 0.1)
    } else if (type === EV_AREA) {
      clearEffects(v)
    }
  }
  v.eventCursor = s.evHead
}

function stepAlpha(fade: number): number {
  return Math.ceil(fade * 4) / 4
}

function drawArc(v: View, x: number, y: number, facing: number, side: number, color: number, p: number): void {
  const ctx = v.ctx
  const sweep = p < 0.5 ? p / 0.5 : 1
  const start = facing - 1.6
  const span = 3.2 * sweep
  const a0 = side > 0 ? start : start + 3.2 - span
  const a1 = a0 + span
  ctx.globalAlpha = p < 0.5 ? 1 : stepAlpha((1 - p) / 0.5)
  ctx.beginPath()
  ctx.ellipse(x, y, 15, 11, 0, a0, a1)
  ctx.strokeStyle = HEX[color]!
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(x, y, 15, 11, 0, a0, a1)
  ctx.strokeStyle = HEX[C_WHITE]!
  ctx.lineWidth = 1
  ctx.stroke()
}

export function drawEffects(v: View, t: number): void {
  const ox = v.originX
  const oy = v.originY
  const right = v.width + 64
  const bottom = v.height + 64
  for (let i = 0; i < FX_CAP; i++) {
    const kind = v.fxKind[i]!
    if (kind === FX_NONE) continue
    const age = t - v.fxBirth[i]!
    const life = v.fxLife[i]!
    if (age >= life) {
      v.fxKind[i] = FX_NONE
      continue
    }
    if (age < 0) continue
    const p = age / life
    let x = v.fxX[i]! - ox
    let y = v.fxY[i]! - oy
    if (x < -64 || y < -64 || x > right || y > bottom) continue
    const color = v.fxColor[i]!
    if (kind === FX_ARC) drawArc(v, Math.round(x), Math.round(y - BODY_LIFT), v.fxA[i]!, v.fxB[i]!, color, p)
    else if (kind === FX_RING) {
      const r = v.fxA[i]! * (0.25 + 0.75 * (1 - (1 - p) * (1 - p)))
      ring(v, x, y, r, r * 0.6, color, p < 0.5 ? v.fxB[i]! : 1, stepAlpha(1 - p))
    } else if (kind === FX_DISC) disc(v, x, y, v.fxA[i]! * (0.5 + p * 0.5), v.fxA[i]! * (0.4 + p * 0.4), color, stepAlpha(1 - p) * 0.6)
    else if (kind === FX_SPARK) blitCentered(v, frameId(v, SPR_FX, SPARK_FRAME + ((p * 3) | 0), 0), Math.round(x), Math.round(y))
    else if (kind === FX_PUFF) blitCentered(v, frameId(v, SPR_FX, PUFF_FRAME + ((p * 3) | 0), 0), Math.round(x), Math.round(y - age * 0.3))
    else if (kind === FX_GLINT) {
      blitCentered(v, frameId(v, SPR_FX, GLINT_FRAME + ((p * 3) | 0), 0), Math.round(x), Math.round(y))
      if (color !== C_WHITE && p < 0.6) disc(v, x, y, 4, 4, color, 0.35)
    } else if (kind === FX_NUMBER) {
      const value = v.fxA[i]!
      const rise = age < 14 ? age * 0.7 : 10
      const w = numberWidth(value, 1)
      const left = Math.round(x) - (w >> 1)
      const top = Math.round(y - rise)
      if (p < 0.8 || ((age | 0) & 2) === 0) {
        drawNumber(v, value, GLYPH_DARK, left + 1, top + 1, 1)
        drawNumber(v, value, color, left, top, 1)
      }
    } else if (kind === FX_PROP) {
      const lift = age < 10 ? age : 10
      blitCentered(v, frameId(v, SPR_PROPS, v.fxA[i]!, 0), Math.round(x), Math.round(y - lift))
    } else if (kind === FX_PARTICLE) {
      x += v.fxVx[i]! * age
      y += v.fxVy[i]! * age + v.fxB[i]! * age * age * 0.5
      v.ctx.globalAlpha = p < 0.6 ? 1 : stepAlpha((1 - p) / 0.4)
      v.ctx.fillStyle = HEX[color]!
      const size = v.fxA[i]! > 0 ? 2 : 1
      v.ctx.fillRect(Math.round(x), Math.round(y), size, size)
    }
    v.ctx.globalAlpha = 1
  }
  v.ctx.globalAlpha = 1
}

export function drawFlash(v: View, t: number): void {
  if (t >= v.flashUntil) return
  const span = v.flashUntil - v.flashStart
  const fade = span > 0 ? (v.flashUntil - t) / span : 0
  const ctx = v.ctx
  ctx.globalAlpha = stepAlpha(fade) * v.flashStrength
  ctx.fillStyle = HEX[v.flashColor]!
  ctx.fillRect(0, 0, v.width, v.height)
  ctx.globalAlpha = 1
}

export function shakeOffset(v: View, t: number): number {
  if (v.reducedMotion || t >= v.shakeUntil) return 0
  return Math.floor(random(v) * (v.shakePower * 2 + 1)) - v.shakePower
}

