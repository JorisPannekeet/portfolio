import type { State } from '../sim/state.ts'
import {
  AI_AIR, AI_RECOVER, AI_STAGGER, AI_STRIKE, AI_WINDUP, BOSS_FORGEMASTER, BOSS_VAREK, ELEMENT_COUNT, ENEMY_BOSS_FIRST, MAX_PROJECTILES, PROJ_EMBER,
} from '../sim/content.ts'
import { ACT_CHARGE, ACT_MELEE, ACT_SLAM, PATTERN_ACT, PATTERN_RANGE } from '../sim/combat-tuning.ts'
import { enemyRadius, windupTicks } from '../sim/enemies.hot.ts'
import { FX_PARTICLE, type View } from './view.ts'
import { VARIANT_FLIP, VARIANT_NORMAL, VARIANT_WHITE } from '../../game/render/atlas.ts'
import { SPR_ENEMIES, SPR_SHOTS, SPR_SHOTS_ROTATED } from './sheet-ids.ts'
import {
  BURN_PATCH_FRAMES, ENEMY_CAST, ENEMY_DEATH, ENEMY_DEATH_N, ENEMY_ELITE_OFFSET, ENEMY_EYE_X, ENEMY_EYE_Y, ENEMY_FIRST, ENEMY_FLYING, ENEMY_GLOW,
  ENEMY_HEIGHT, ENEMY_IDLE_N, ENEMY_PHASED, ENEMY_STAGGER, ENEMY_STRIKE, ENEMY_TOUCH, ENEMY_WALK, ENEMY_WALK_AT, ENEMY_WINDUP, PROJ_ANIM, PROJ_FRAME,
  PROJ_ROTATED, PROJ_TRAIL, PROJ_TRAIL_LIGHT, SHOT_BURN_PATCH, TOUCH_EMBERS, TOUCH_EYES, TOUCH_NONE, TOUCH_SPARKS, VAREK_COLOSSUS_HEIGHT, VAREK_PHASE_FIRST,
} from './sheet-foes.ts'
import { FOOT, blitCentered, blitFootSized, disc, drawShadow, frameH, frameId, frameW, rect, ring, rotationIndex, snap } from './sprite.hot.ts'
import { C_CORRUPT_GLOW, C_EMBER, C_GOLD, C_GOLD_PALE, C_INK, C_RED, C_RED_DEEP, C_SKY, C_SKY_LIGHT, C_STONE_DARK, C_WHITE, STANCE_COLOR, STANCE_LIGHT } from './colors.ts'
import { random, spawnFx } from './effects.hot.ts'
import { CORPSE_CAP, motion } from './motion.ts'

const TAU = Math.PI * 2
const AIR_LIFT = 10
const CORPSE_LIFE = 30
const BOSS_CORPSE_LIFE = 100
const BOSS_DEATH_SHAKE = 40
const RECOVER_HOLD = 8
const CULL = 32
const PROJ_LIFT = 6
const PIP_W = 16

function enemyFirst(s: State, kind: number): number {
  if (ENEMY_PHASED[kind]! === 0) return ENEMY_FIRST[kind]!
  const phase = s.bossPhase < 0 ? 0 : s.bossPhase > 2 ? 2 : s.bossPhase
  return VAREK_PHASE_FIRST[phase]!
}

function enemyHeight(s: State, kind: number): number {
  return ENEMY_PHASED[kind]! !== 0 && s.bossPhase >= 2 ? VAREK_COLOSSUS_HEIGHT : ENEMY_HEIGHT[kind]!
}

function enemyLift(s: State, i: number, t: number): number {
  const kind = s.eKind[i]!
  let lift = ENEMY_FLYING[kind]! !== 0 ? 3 + Math.sin(t / 14 + i) * 1.5 : 0
  if (s.eState[i]! === AI_AIR) lift += AIR_LIFT
  return lift
}

function bossMelee(s: State, i: number): boolean {
  const act = PATTERN_ACT[s.eAttack[i]!] ?? ACT_MELEE
  return act === ACT_MELEE || act === ACT_CHARGE
}

function telegraphRadius(s: State, i: number): number {
  const kind = s.eKind[i]!
  const body = enemyRadius(s, i)
  if (kind < ENEMY_BOSS_FIRST) return body + 4
  const act = PATTERN_ACT[s.eAttack[i]!] ?? ACT_MELEE
  if (act === ACT_MELEE || act === ACT_SLAM) return body + (PATTERN_RANGE[s.eAttack[i]!] ?? 0) * 0.5
  return body + 4
}

function poseFrame(s: State, i: number, t: number, kind: number): number {
  const state = s.eState[i]!
  const boss = kind >= ENEMY_BOSS_FIRST
  if (state === AI_WINDUP) return boss && !bossMelee(s, i) ? ENEMY_CAST[kind]! : ENEMY_WINDUP[kind]!
  if (state === AI_STRIKE) return boss && !bossMelee(s, i) && PATTERN_ACT[s.eAttack[i]!] !== ACT_SLAM ? ENEMY_CAST[kind]! : ENEMY_STRIKE[kind]!
  if (state === AI_RECOVER && s.eTimer[i]! < RECOVER_HOLD) return ENEMY_STRIKE[kind]!
  if (state === AI_STAGGER || state === AI_AIR) return ENEMY_STAGGER[kind]!
  if (s.eX[i] !== s.ePrevX[i] || s.eY[i] !== s.ePrevY[i]) return ENEMY_WALK_AT[kind]! + (((t / 6 + i) | 0) % ENEMY_WALK[kind]!)
  return ((t / 26 + i * 7) | 0) % ENEMY_IDLE_N[kind]!
}

function drawTelegraph(v: View, s: State, i: number, t: number, x: number, y: number): void {
  const ticks = windupTicks(s, i)
  const k = ticks > 0 ? Math.min(1, s.eTimer[i]! / ticks) : 1
  const r = telegraphRadius(s, i)
  const gy = y + FOOT - 1
  const late = k > 0.75
  const blink = late && ((t / 2) | 0) % 2 === 0
  disc(v, x, gy, r * (0.35 + 0.65 * k), r * 0.45 * (0.35 + 0.65 * k), C_RED, 0.12 + k * 0.2)
  ring(v, x, gy, r, r * 0.45, C_INK, 1.5, 0.55)
  ring(v, x, gy, r, r * 0.45, blink ? C_WHITE : C_RED, 0.5, 0.95)
  const closing = r * (1.6 - 0.6 * k)
  ring(v, x, gy, closing, closing * 0.45, late ? C_GOLD_PALE : C_RED, 0.5, 0.4 + k * 0.5)
  v.ctx.globalAlpha = 1
}

function drawGlint(v: View, x: number, y: number, t: number): void {
  const arm = 1 + (((t / 3) | 0) & 1) * 1.5
  rect(v, C_WHITE, x - arm, y - 0.25, arm * 2, 0.5)
  rect(v, C_WHITE, x - 0.25, y - arm, 0.5, arm * 2)
  rect(v, C_GOLD_PALE, x - 0.5, y - 0.5, 1, 1)
}

export function drawEnemy(v: View, s: State, i: number, t: number, x: number, y: number): void {
  const kind = s.eKind[i]!
  const boss = kind >= ENEMY_BOSS_FIRST
  const state = s.eState[i]!
  let frame = enemyFirst(s, kind) + poseFrame(s, i, t, kind)
  if (!boss && s.eElite[i]! !== 0) frame += ENEMY_ELITE_OFFSET
  const face = s.eFace[i]! & 1023
  const west = face > 256 && face < 768
  const flash = s.eFlashUntil[i]! > s.tick
  const id = frameId(v, SPR_ENEMIES, frame, (west ? VARIANT_FLIP : VARIANT_NORMAL) + (flash ? VARIANT_WHITE : 0))
  const footY = snap(y + FOOT - enemyLift(s, i, t))
  if (state === AI_WINDUP) drawTelegraph(v, s, i, t, x, y)
  drawAura(v, s, i, kind, t, x, footY, true)
  const w = frameW(v, id)
  const h = frameH(v, id)
  const squash = flash && state !== AI_WINDUP ? 1 : 0
  const shake = state === AI_STAGGER ? (((t / 2) | 0) & 1) - 0.5 : 0
  blitFootSized(v, id, x + shake, footY, w + squash * 1.5, h - squash)
  const top = footY - enemyHeight(s, kind)
  drawTouch(v, s, i, kind, t, x, top, footY, west)
  drawAura(v, s, i, kind, t, x, footY, false)
  if (state === AI_WINDUP && ((t / 3) | 0) % 3 !== 0) drawGlint(v, x + (west ? 1 : -1) * w * 0.22, footY - h + 2, t)
  if (s.eBurn[i]! > s.tick) {
    for (let n = 0; n < 2; n++) {
      const fy = top + 2 + random(v) * (footY - top - 3)
      rect(v, (t | 0) & 2 ? C_EMBER : C_GOLD, x - 5 + random(v) * 10, fy, 0.5, 1 + random(v))
    }
    if (!v.reducedMotion && ((t | 0) + i) % 5 === 0) spawnFx(v, FX_PARTICLE, x + v.originX + random(v) * 8 - 4, top + v.originY + 4, t, 14, C_EMBER, 0, -0.4)
  }
  if (s.eChill[i]! > s.tick) {
    disc(v, x, (top + footY) / 2, w * 0.4, (footY - top) / 2, C_SKY, 0.2)
    v.ctx.globalAlpha = 1
    for (let n = 0; n < 4; n++) {
      const sx = x - w * 0.3 + ((n * 7 + i * 3) % 10) * w * 0.06
      const sy = top + 2 + ((n * 5 + i) % 7) * (footY - top - 3) / 7
      rect(v, n & 1 ? C_WHITE : C_SKY_LIGHT, sx, sy, 0.5, 0.5)
    }
  }
  if (!boss && s.eElite[i]! !== 0 && ((t | 0) % 7) === 0) spawnFx(v, FX_PARTICLE, x + v.originX + (random(v) * 12 - 6), footY + v.originY - 2, t, 22, C_CORRUPT_GLOW, 0, -0.45)
  const max = s.eMaxHp[i]!
  if (!boss && max > 0 && s.eHp[i]! < max) drawPips(v, x, top - 3.5, s.eHp[i]! / max, s.eElite[i]! !== 0)
}

function drawPips(v: View, x: number, y: number, k: number, elite: boolean): void {
  const left = x - PIP_W / 2
  rect(v, C_INK, left - 0.5, y - 0.5, PIP_W + 1, 2)
  rect(v, C_STONE_DARK, left, y, PIP_W, 1)
  const fill = Math.max(0.5, Math.round(PIP_W * k * 2) / 2)
  rect(v, elite ? C_CORRUPT_GLOW : C_RED_DEEP, left, y, fill, 1)
  rect(v, elite ? C_WHITE : C_RED, left, y, fill, 0.5)
  for (let n = 1; n < 4; n++) rect(v, C_INK, left + (PIP_W * n) / 4 - 0.25, y, 0.5, 1)
}

function drawAura(v: View, s: State, i: number, kind: number, t: number, x: number, footY: number, behind: boolean): void {
  const mid = footY - enemyHeight(s, kind) * 0.5
  if (kind === BOSS_FORGEMASTER && s.bossPhase === 1) {
    if (behind) {
      const flick = Math.sin(t * 0.4) * 1.5
      disc(v, x, mid, enemyRadius(s, i) + 6 + flick, enemyHeight(s, kind) * 0.55, C_EMBER, 0.16)
      disc(v, x + 1, mid - 5, 6 + flick, 4, C_GOLD, 0.22)
      v.ctx.globalAlpha = 1
    } else if (!v.reducedMotion && ((t | 0) + i) % 3 === 0) {
      spawnFx(v, FX_PARTICLE, x + v.originX + random(v) * 24 - 12, mid + v.originY + random(v) * 10, t, 20, random(v) < 0.5 ? C_EMBER : C_GOLD, (random(v) - 0.5) * 0.3, -0.5)
    }
    return
  }
  if (ENEMY_PHASED[kind]! === 0) return
  if (s.bossPhase === 1 && !behind) {
    for (let e = 0; e < ELEMENT_COUNT; e++) {
      const angle = t * 0.08 + (e * TAU) / ELEMENT_COUNT
      const ex = x + Math.cos(angle) * 18
      const ey = mid + Math.sin(angle) * 9
      const front = Math.sin(angle) > 0
      disc(v, ex - Math.cos(angle + 0.5) * 3, ey - Math.sin(angle + 0.5) * 1.5, 1.5, 1.5, STANCE_COLOR[e]!, 0.35)
      disc(v, ex, ey, front ? 3 : 2.5, front ? 3 : 2.5, STANCE_COLOR[e]!, 0.95)
      disc(v, ex - 0.5, ey - 0.5, 1, 1, STANCE_LIGHT[e]!, 1)
    }
    v.ctx.globalAlpha = 1
  } else if (s.bossPhase >= 2) {
    const crown = footY - VAREK_COLOSSUS_HEIGHT + 4
    if (behind) {
      disc(v, x - 1, crown, 12 + Math.sin(t * 0.3), 8, C_EMBER, 0.18)
      disc(v, x - 1, crown, 7, 4.5, C_GOLD_PALE, 0.22)
      v.ctx.globalAlpha = 1
    } else if (!v.reducedMotion && ((t | 0) + i) % 2 === 0) {
      spawnFx(v, FX_PARTICLE, x + v.originX + random(v) * 12 - 7, crown + v.originY - 2, t, 18, random(v) < 0.6 ? C_GOLD : C_EMBER, (random(v) - 0.5) * 0.2, -0.6)
    }
  }
}

function drawTouch(v: View, s: State, i: number, kind: number, t: number, x: number, top: number, footY: number, west: boolean): void {
  const touch = ENEMY_TOUCH[kind]!
  if (touch === TOUCH_NONE) return
  if (touch === TOUCH_EYES || ((touch === TOUCH_EMBERS) && ENEMY_EYE_Y[kind]! > 0)) {
    const pulse = 0.5 + Math.sin(t / 9 + i) * 0.5
    const ex = x + (west ? -1 : 1) * ENEMY_EYE_X[kind]!
    const ey = footY - ENEMY_EYE_Y[kind]!
    const elite = s.eElite[i]! !== 0 && kind < ENEMY_BOSS_FIRST
    disc(v, ex, ey, 2 + pulse, 1.2 + pulse * 0.5, elite ? C_CORRUPT_GLOW : ENEMY_GLOW[kind]!, 0.3)
    v.ctx.globalAlpha = 1
    if (touch === TOUCH_EYES) return
  }
  if (v.reducedMotion) return
  const every = touch === TOUCH_EMBERS ? 5 : touch === TOUCH_SPARKS ? 9 : 17
  if ((((t | 0) + i * 5) % every) !== 0) return
  if (touch === TOUCH_EMBERS) {
    spawnFx(v, FX_PARTICLE, x + v.originX + (random(v) * 14 - 7) + (west ? 4 : -4), footY + v.originY - 2 - random(v) * (footY - top) * 0.6, t, 14 + random(v) * 10, random(v) < 0.5 ? C_EMBER : C_GOLD, (west ? 0.25 : -0.25) + (random(v) - 0.5) * 0.2, -0.3 - random(v) * 0.2)
    return
  }
  if (touch === TOUCH_SPARKS) {
    spawnFx(v, FX_PARTICLE, x + v.originX + random(v) * 16 - 8, top + v.originY + random(v) * (footY - top), t, 12, random(v) < 0.5 ? C_SKY_LIGHT : C_WHITE, (random(v) - 0.5) * 0.6, -0.2)
    return
  }
  const drip = spawnFx(v, FX_PARTICLE, x + v.originX + (random(v) * 8 - 4), top + v.originY + (footY - top) * (0.3 + random(v) * 0.4), t, 14, C_SKY, 0, 0.1)
  v.fxB[drip] = 0.04
}

export function drawCorpses(v: View, t: number): void {
  const m = motion
  for (let i = 0; i < CORPSE_CAP; i++) {
    const kind = m.corpseKind[i]!
    if (kind < 0) continue
    const boss = kind >= ENEMY_BOSS_FIRST
    const life = boss ? BOSS_CORPSE_LIFE : CORPSE_LIFE
    const age = t - m.corpseBorn[i]!
    if (age >= life || age < 0) {
      if (age >= life) m.corpseKind[i] = -1
      continue
    }
    let x = snap(m.corpseX[i]! - v.originX)
    const y = snap(m.corpseY[i]! - v.originY)
    if (x < -64 || y < -24 || x > v.width + 64 || y > v.height + 96) continue
    const first = (kind === BOSS_VAREK ? VAREK_PHASE_FIRST[2]! : ENEMY_FIRST[kind]!) + (!boss && m.corpseElite[i]! !== 0 ? ENEMY_ELITE_OFFSET : 0)
    const deaths = ENEMY_DEATH_N[kind]!
    let frame = first + ENEMY_DEATH[kind]!
    let white = false
    let alpha = 1
    if (boss && age < BOSS_DEATH_SHAKE) {
      frame = first + ENEMY_STAGGER[kind]!
      white = ((age / 3) | 0) % 2 === 0
      x += (((age | 0) & 1) - 0.5) * 1.5
      if (!v.reducedMotion && ((age | 0) & 1) === 0) {
        const h = kind === BOSS_VAREK ? VAREK_COLOSSUS_HEIGHT : ENEMY_HEIGHT[kind]!
        spawnFx(v, FX_PARTICLE, x + v.originX + random(v) * 24 - 12, y + FOOT + v.originY - random(v) * h, t, 24, random(v) < 0.5 ? ENEMY_GLOW[kind]! : C_WHITE, (random(v) - 0.5) * 0.8, -0.4 - random(v) * 0.4)
      }
    } else {
      const k = boss ? (age - BOSS_DEATH_SHAKE) / (life - BOSS_DEATH_SHAKE) : age / life
      const step = Math.min(deaths - 1, (k * (deaths + 0.6)) | 0)
      frame += step
      white = !boss && age < 3
      alpha = k > 0.8 ? (1 - k) * 5 : 1
    }
    const id = frameId(v, SPR_ENEMIES, frame, (m.corpseFlip[i]! !== 0 ? VARIANT_FLIP : VARIANT_NORMAL) + (white ? VARIANT_WHITE : 0))
    const lift = ENEMY_FLYING[kind]! !== 0 ? 3 : 0
    v.ctx.globalAlpha = alpha
    blitFootSized(v, id, x, y + FOOT - lift, frameW(v, id), frameH(v, id))
  }
  v.ctx.globalAlpha = 1
}

export function drawEnemyGround(v: View, s: State, i: number, t: number, x: number, y: number): void {
  drawShadow(v, x, y, enemyRadius(s, i) * 2, enemyLift(s, i, t))
}

function drawTrail(v: View, kind: number, x: number, y: number, vx: number, vy: number, t: number, i: number): void {
  const speed = Math.hypot(vx, vy)
  if (speed < 0.01) return
  const ux = vx / speed
  const uy = vy / speed
  for (let n = 1; n <= 5; n++) {
    const back = n * (2 + speed * 0.6)
    const wob = ((((t / 2) | 0) + n + i) & 1) * 0.5 - 0.25
    rect(v, n < 3 ? PROJ_TRAIL_LIGHT[kind]! : PROJ_TRAIL[kind]!, x - ux * back - uy * wob - 0.25, y - uy * back + ux * wob - 0.25, 0.5, 0.5)
  }
}

export function drawProjectiles(v: View, s: State, alpha: number, t: number): void {
  const ox = v.originX
  const oy = v.originY
  for (let i = 0; i < MAX_PROJECTILES; i++) {
    if (s.prAlive[i]! === 0) continue
    const kind = s.prKind[i]!
    const x = snap(s.prPrevX[i]! + (s.prX[i]! - s.prPrevX[i]!) * alpha - ox)
    const y = snap(s.prPrevY[i]! + (s.prY[i]! - s.prPrevY[i]!) * alpha - oy)
    if (x < -CULL || y < -CULL || x > v.width + CULL || y > v.height + CULL) continue
    const anim = ((t / 4 + i) | 0) % PROJ_ANIM[kind]!
    if (kind === PROJ_EMBER && s.prVx[i]! === 0 && s.prVy[i]! === 0) {
      const flicker = Math.sin(t * 0.5 + i)
      disc(v, x, y + 1, 9 + flicker * 0.5, 4, C_EMBER, 0.28)
      disc(v, x, y + 1, 5, 2, C_GOLD, 0.35 + flicker * 0.1)
      v.ctx.globalAlpha = 1
      blitCentered(v, frameId(v, SPR_SHOTS, SHOT_BURN_PATCH + (((t / 5 + i) | 0) % BURN_PATCH_FRAMES), 0), x, y - 2)
      if (!v.reducedMotion && ((t | 0) + i) % 6 === 0) spawnFx(v, FX_PARTICLE, x + ox + random(v) * 12 - 6, y + oy - 2, t, 16, random(v) < 0.5 ? C_EMBER : C_GOLD, 0, -0.4)
      continue
    }
    disc(v, x, y, 3, 1, C_INK, 0.3)
    v.ctx.globalAlpha = 1
    drawTrail(v, kind, x, y - PROJ_LIFT, s.prVx[i]!, s.prVy[i]!, t, i)
    const id = PROJ_ROTATED[kind]! !== 0
      ? frameId(v, SPR_SHOTS_ROTATED, PROJ_FRAME[kind]! + anim, rotationIndex(s.prVx[i]!, s.prVy[i]!))
      : frameId(v, SPR_SHOTS, PROJ_FRAME[kind]! + anim, 0)
    blitCentered(v, id, x, y - PROJ_LIFT)
  }
}
