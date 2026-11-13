import type { State } from '../sim/state.ts'
import {
  ELEMENT_COUNT, ELEMENT_EMBER, GUIDE_NONE, HEAT_MAX, MAX_ENEMIES, MAX_OBJECTS, OBJ_NONE, PHASE_PLAYING,
} from '../sim/content.ts'
import { enemyRadius } from '../sim/enemies.hot.ts'
import { skillCharge } from '../sim/player.hot.ts'
import { SKILL_COST } from '../sim/combat-tuning.ts'
import type { View } from './view.ts'
import { HELD_GLYPH, HELD_HEART } from './sheet-hero.ts'
import { FX_MARKER, FX_PIP, ROT_QUEST } from './sheet-world.ts'
import { SPR_FX, SPR_HELD, SPR_MARKS } from './sheet-ids.ts'
import { blitAt, blitCentered, frameId, rect, rotationIndex, snap } from './sprite.hot.ts'
import {
  C_BRASS, C_BRASS_LIGHT, C_CORRUPT_GLOW, C_EMBER, C_GOLD, C_GOLD_PALE, C_GREEN, C_GREEN_DEEP, C_GREEN_LIGHT, C_INK, C_NIGHT, C_PALE, C_RED,
  C_RED_DEEP, C_RED_LIGHT, C_RUST, C_SKY, C_SKY_DEEP, C_SKY_LIGHT, C_STONE_DARK, C_WHITE, STANCE_COLOR, STANCE_DEEP, STANCE_LIGHT,
} from './colors.ts'
import { motion } from './motion.ts'
import { activeBoss } from './boss.hot.ts'

const BAR_LEFT = 12
const BAR_WIDTH = 54
const PIP = 10
const EDGE = 10
const READY_FLASH_TICKS = 30
const CHARGE_SHADE = 0.72
const LAG_HOLD = 24
const LAG_DECAY = 0.01
export const HUD_HEIGHT = PIP + 5
export const HUD_WIDTH = BAR_LEFT + BAR_WIDTH + 5 + PIP * ELEMENT_COUNT

const PX = 0.5

function clampFraction(fraction: number): number {
  return fraction < 0 ? 0 : fraction > 1 ? 1 : fraction
}

function bar(v: View, x: number, y: number, w: number, h: number, fraction: number, fill: number, track: number): void {
  rect(v, C_INK, x - PX, y - PX, w + PX * 2, h + PX * 2)
  rect(v, track, x, y, w, h)
  rect(v, C_INK, x, y, w, PX)
  const filled = Math.round(w * clampFraction(fraction) * 2) / 2
  if (filled > 0) rect(v, fill, x, y, filled, h)
}

function bevel(v: View, x: number, y: number, w: number, h: number, fraction: number, light: number, dark: number): void {
  const filled = Math.round(w * clampFraction(fraction) * 2) / 2
  if (filled <= 0) return
  rect(v, light, x, y, filled, PX)
  if (h > 1) {
    v.ctx.globalAlpha = 0.45
    rect(v, C_WHITE, x, y + PX, filled, PX)
    v.ctx.globalAlpha = 1
  }
  rect(v, dark, x, y + h - PX, filled, PX)
  rect(v, C_WHITE, x + filled - PX, y, PX, h - PX)
}

function caps(v: View, x: number, y: number, w: number, h: number): void {
  rect(v, C_INK, x - 2, y - 1, 1.5, h + 2)
  rect(v, C_INK, x + w + PX, y - 1, 1.5, h + 2)
  rect(v, C_BRASS, x - 1.5, y - PX, PX * 2, h + 1)
  rect(v, C_BRASS, x + w + 1, y - PX, PX * 2, h + 1)
  rect(v, C_BRASS_LIGHT, x - 1.5, y - PX, PX, h)
  rect(v, C_BRASS_LIGHT, x + w + 1, y - PX, PX, PX)
}

function hpGhost(s: State, t: number, hp: number): number {
  const m = motion
  if (m.hpShown < 0 || hp >= m.hpLag) {
    m.hpLag = hp
  } else if (hp < m.hpShown) {
    m.hpLagAt = t
  } else if (t - m.hpLagAt > LAG_HOLD) {
    m.hpLag -= LAG_DECAY
    if (m.hpLag < hp) m.hpLag = hp
  }
  m.hpShown = hp
  return s.hp <= 0 ? 0 : m.hpLag
}

function drawTray(v: View, left: number, right: number): void {
  const x = left - 2
  const w = right - left + 3
  rect(v, C_INK, x - PX, 0, w + 1, PIP + 2)
  rect(v, C_BRASS, x, PX, w, PIP + 1)
  rect(v, C_BRASS_LIGHT, x, PX, w, PX)
  rect(v, C_BRASS_LIGHT, x, PX, PX, PIP + 1)
  rect(v, C_RUST, x + PX, PIP + 1, w - PX, PX)
  rect(v, C_INK, left - 1, 1, right - left + 1, PIP)
  rect(v, C_NIGHT, left - PX, 1.5, right - left, PIP - 1)
}

function drawMeters(v: View, s: State, t: number): void {
  const hp = s.statMaxHp > 0 ? s.hp / s.statMaxHp : 0
  const low = hp < 0.25 && ((t / 12) | 0) % 2 === 0
  const beat = hp < 0.25 && !v.reducedMotion && ((t / 6) | 0) % 4 === 0 ? 1 : 0
  blitAt(v, frameId(v, SPR_HELD, HELD_HEART, 0), PX - beat * PX, -PX * beat, 1)
  const ghost = hpGhost(s, t, hp)
  caps(v, BAR_LEFT, 1.5, BAR_WIDTH, 3)
  bar(v, BAR_LEFT, 1.5, BAR_WIDTH, 3, ghost, C_PALE, C_RED_DEEP)
  const filled = Math.round(BAR_WIDTH * clampFraction(hp) * 2) / 2
  if (filled > 0) rect(v, low ? C_WHITE : C_RED, BAR_LEFT, 1.5, filled, 3)
  if (!low) bevel(v, BAR_LEFT, 1.5, BAR_WIDTH, 3, hp, C_RED_LIGHT, C_RED_DEEP)
  const stamina = s.statMaxStamina > 0 ? s.stamina / s.statMaxStamina : 0
  caps(v, BAR_LEFT, 6.5, BAR_WIDTH, 2)
  bar(v, BAR_LEFT, 6.5, BAR_WIDTH, 2, stamina, C_GREEN, C_STONE_DARK)
  bevel(v, BAR_LEFT, 6.5, BAR_WIDTH, 2, stamina, C_GREEN_LIGHT, C_GREEN_DEEP)
  const charge = skillCharge(s)
  const focus = s.statMaxFocus > 0 ? s.focus / s.statMaxFocus : 0
  caps(v, BAR_LEFT, 10.5, BAR_WIDTH, 2)
  bar(v, BAR_LEFT, 10.5, BAR_WIDTH, 2, focus, charge >= 1 ? C_WHITE : C_SKY, C_STONE_DARK)
  if (charge < 1) bevel(v, BAR_LEFT, 10.5, BAR_WIDTH, 2, focus, C_SKY_LIGHT, C_SKY_DEEP)
  if (s.statMaxFocus > 0) {
    const notch = BAR_LEFT + Math.round((BAR_WIDTH * SKILL_COST * 2) / s.statMaxFocus) / 2
    rect(v, C_INK, notch - PX, 9.5, PX * 3, 4)
    rect(v, C_GOLD_PALE, notch, 10, PX, 3)
  }
  if (charge < 1 || t < v.skillReadyAt) v.skillReadyAt = -1
  else if (v.skillReadyAt < 0) v.skillReadyAt = t
  if (s.stancesUnlocked === 0) return
  const left = BAR_LEFT + BAR_WIDTH + 5
  const right = left + PIP * ELEMENT_COUNT - 1
  drawTray(v, left, right)
  for (let e = 0; e < ELEMENT_COUNT; e++) {
    const x = left + e * PIP
    const unlocked = (s.stancesUnlocked & (1 << e)) !== 0
    if (e > 0) rect(v, C_BRASS, x - 1, 1.5, PX, PIP - 1)
    if (e === s.stance && unlocked) {
      rect(v, STANCE_COLOR[e]!, x - PX, 1.5, PIP - 1, PIP - 1)
      rect(v, STANCE_DEEP[e]!, x, 2, PIP - 2, PIP - 2)
      rect(v, STANCE_LIGHT[e]!, x - PX, 1.5, PIP - 1, PX)
    }
    v.ctx.globalAlpha = unlocked ? 1 : 0.22
    blitAt(v, frameId(v, SPR_HELD, HELD_GLYPH + e, 0), x - PX, 1.5, 1)
    v.ctx.globalAlpha = 1
    if (e !== s.stance || !unlocked) continue
    const shade = Math.round((PIP - 1) * (1 - charge) * 2) / 2
    if (shade > 0) {
      v.ctx.globalAlpha = CHARGE_SHADE
      rect(v, C_INK, x - PX, 1.5, PIP - 1, shade)
      v.ctx.globalAlpha = 1
      rect(v, C_WHITE, x - PX, 1 + shade, PIP - 1, PX)
    } else if (t - v.skillReadyAt < READY_FLASH_TICKS && (v.reducedMotion || ((t / 5) | 0) % 2 === 0)) {
      rect(v, C_WHITE, x - 1, 1, PIP, PX)
      rect(v, C_WHITE, x - 1, PIP + PX, PIP, PX)
      rect(v, C_WHITE, x - 1, 1, PX, PIP)
      rect(v, C_WHITE, x + PIP - 1.5, 1, PX, PIP)
    }
  }
  if (s.stance === ELEMENT_EMBER && (s.stancesUnlocked & (1 << ELEMENT_EMBER)) !== 0) {
    bar(v, left, PIP + 2.5, PIP * ELEMENT_COUNT - 1, 1.5, s.heat / HEAT_MAX, s.heat >= HEAT_MAX * 0.5 ? C_GOLD : C_EMBER, C_STONE_DARK)
  }
}

function drawBoss(v: View, s: State): void {
  const boss = activeBoss(s)
  if (boss < 0) return
  let w = Math.round(v.width * 0.5)
  if (w > 200) w = 200
  const x = (v.width - w) >> 1
  const y = v.bossBarY
  const max = s.eMaxHp[boss]!
  bar(v, x, y, w, 3, max > 0 ? s.eHp[boss]! / max : 0, s.eElite[boss]! !== 0 ? C_CORRUPT_GLOW : C_RED, C_RED_DEEP)
  rect(v, C_GOLD, x - 2, y - 2, 2, 7)
  rect(v, C_GOLD, x + w, y - 2, 2, 7)
}

function drawReticle(v: View, s: State, t: number, alpha: number): void {
  const i = s.lockTarget
  if (i < 0 || i >= MAX_ENEMIES || s.eAlive[i]! === 0) return
  const body = enemyRadius(s, i)
  const x = snap(s.ePrevX[i]! + (s.eX[i]! - s.ePrevX[i]!) * alpha - v.originX)
  const y = snap(s.ePrevY[i]! + (s.eY[i]! - s.ePrevY[i]!) * alpha - v.originY - body * 0.8)
  const r = Math.round(body + 4) + (((t / 8) | 0) & 1)
  for (let c = 0; c < 4; c++) {
    const sx = c & 1 ? 1 : -1
    const sy = c & 2 ? 1 : -1
    const cx = x + sx * r
    const cy = y + sy * r
    rect(v, C_INK, cx - (sx > 0 ? 3 : 0) - 1, cy - 1, 5, 3)
    rect(v, C_INK, cx - 1, cy - (sy > 0 ? 3 : 0) - 1, 3, 5)
  }
  for (let c = 0; c < 4; c++) {
    const sx = c & 1 ? 1 : -1
    const sy = c & 2 ? 1 : -1
    const cx = x + sx * r
    const cy = y + sy * r
    rect(v, C_GOLD_PALE, cx - (sx > 0 ? 3 : 0), cy, 4, 1)
    rect(v, C_GOLD_PALE, cx, cy - (sy > 0 ? 3 : 0), 1, 4)
  }
}

function edgeStep(from: number, delta: number, low: number, high: number, k: number): number {
  if (delta > 0 && high > from) return Math.min(k, (high - from) / delta)
  if (delta < 0 && low < from) return Math.min(k, (low - from) / delta)
  return k
}

function drawGuide(v: View, s: State, t: number): void {
  if (s.guideX === GUIDE_NONE && s.guideY === GUIDE_NONE) return
  const gx = snap(s.guideX - v.originX)
  const gy = snap(s.guideY - v.originY)
  const bob = ((t / 12) | 0) & 1
  const left = EDGE
  const right = v.width - EDGE
  const top = v.textBottom + EDGE
  const bottom = v.height - EDGE - v.clearBottom
  if (gx >= left && gx <= right && gy - 18 >= top && gy <= bottom) {
    blitCentered(v, frameId(v, SPR_FX, FX_MARKER, 0), gx, gy - 18 - bob * 2)
    return
  }
  const cx = v.playerX
  const cy = v.playerY
  const dx = gx - cx
  const dy = gy - cy
  if (dx === 0 && dy === 0) return
  let k = edgeStep(cx, dx, left, right, 1e9)
  k = edgeStep(cy, dy, top, bottom, k)
  if (k > 1e8) k = 0
  let x = snap(cx + dx * k)
  let y = snap(cy + dy * k)
  if (x < left) x = left
  if (x > right) x = right
  if (y < top) y = top
  if (y > bottom) y = bottom
  const push = bob ? 1 : 0
  const len = Math.sqrt(dx * dx + dy * dy)
  blitCentered(v, frameId(v, SPR_MARKS, ROT_QUEST, rotationIndex(dx, dy)), x + Math.round((dx / len) * push), y + Math.round((dy / len) * push))
}

function drawInteract(v: View, s: State, t: number): void {
  const i = s.interactObj
  if (i < 0 || i >= MAX_OBJECTS || s.objKind[i]! === OBJ_NONE || s.phase !== PHASE_PLAYING) return
  const x = snap(s.objX[i]! - v.originX)
  const y = snap(s.objY[i]! - v.originY)
  blitCentered(v, frameId(v, SPR_FX, FX_PIP, 0), x, y - 24 - (((t / 14) | 0) & 1))
}

export function drawHud(v: View, s: State, t: number, alpha: number): void {
  drawReticle(v, s, t, alpha)
  drawGuide(v, s, t)
  drawInteract(v, s, t)
  drawBoss(v, s)
  drawMeters(v, s, t)
}
