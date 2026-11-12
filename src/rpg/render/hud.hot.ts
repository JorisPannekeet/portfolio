import type { State } from '../sim/state.ts'
import {
  AI_IDLE, ELEMENT_COUNT, ELEMENT_EMBER, ENEMY_BOSS_FIRST, GUIDE_NONE, HEAT_MAX, MAX_ENEMIES, MAX_OBJECTS, OBJ_NONE, PHASE_PLAYING,
} from '../sim/content.ts'
import { enemyRadius } from '../sim/enemies.hot.ts'
import { skillCharge } from '../sim/player.hot.ts'
import { SKILL_COST } from '../sim/combat-tuning.ts'
import type { View } from './view.ts'
import { ELEMENT_ICON_FIRST, FX_HEART, FX_MARKER, FX_PIP, ROT_QUEST, SPR_FX, SPR_ICONS, SPR_ROTATED } from './sheet.ts'
import { blitAt, blitCentered, frameId, rect, rotationIndex } from './sprite.hot.ts'
import {
  C_CORRUPT_GLOW, C_EMBER, C_GOLD, C_GOLD_PALE, C_GREEN, C_INK, C_RED, C_RED_DEEP, C_SKY, C_STONE_DARK, C_WHITE, STANCE_COLOR,
} from './colors.ts'

const BAR_LEFT = 12
const BAR_WIDTH = 54
const PIP = 10
const EDGE = 10
const READY_FLASH_TICKS = 30
const CHARGE_SHADE = 0.72
export const HUD_HEIGHT = PIP + 5
export const HUD_WIDTH = BAR_LEFT + BAR_WIDTH + 5 + PIP * ELEMENT_COUNT

function bar(v: View, x: number, y: number, w: number, h: number, fraction: number, fill: number, track: number): void {
  rect(v, C_INK, x - 1, y - 1, w + 2, h + 2)
  rect(v, track, x, y, w, h)
  const clamped = fraction < 0 ? 0 : fraction > 1 ? 1 : fraction
  const filled = Math.round(w * clamped)
  if (filled > 0) rect(v, fill, x, y, filled, h)
}

function drawMeters(v: View, s: State, t: number): void {
  blitAt(v, frameId(v, SPR_FX, FX_HEART, 0), 2, 1, 1)
  const hp = s.statMaxHp > 0 ? s.hp / s.statMaxHp : 0
  const low = hp < 0.25 && ((t / 12) | 0) % 2 === 0
  bar(v, BAR_LEFT, 2, BAR_WIDTH, 3, hp, low ? C_WHITE : C_RED, C_RED_DEEP)
  bar(v, BAR_LEFT, 7, BAR_WIDTH, 2, s.statMaxStamina > 0 ? s.stamina / s.statMaxStamina : 0, C_GREEN, C_STONE_DARK)
  const charge = skillCharge(s)
  bar(v, BAR_LEFT, 11, BAR_WIDTH, 2, s.statMaxFocus > 0 ? s.focus / s.statMaxFocus : 0, charge >= 1 ? C_WHITE : C_SKY, C_STONE_DARK)
  if (s.statMaxFocus > 0) rect(v, C_INK, BAR_LEFT + Math.round((BAR_WIDTH * SKILL_COST) / s.statMaxFocus), 10, 1, 4)
  if (charge < 1 || t < v.skillReadyAt) v.skillReadyAt = -1
  else if (v.skillReadyAt < 0) v.skillReadyAt = t
  if (s.stancesUnlocked === 0) return
  const left = BAR_LEFT + BAR_WIDTH + 5
  for (let e = 0; e < ELEMENT_COUNT; e++) {
    const x = left + e * PIP
    const unlocked = (s.stancesUnlocked & (1 << e)) !== 0
    if (e === s.stance && unlocked) {
      rect(v, C_INK, x - 1, 0, PIP + 1, PIP + 1)
      rect(v, STANCE_COLOR[e]!, x, 1, PIP - 1, PIP - 1)
    }
    v.ctx.globalAlpha = unlocked ? 1 : 0.22
    blitAt(v, frameId(v, SPR_ICONS, ELEMENT_ICON_FIRST + e, 0), x, 1, 1)
    v.ctx.globalAlpha = 1
    if (e !== s.stance || !unlocked) continue
    const shade = Math.round((PIP - 1) * (1 - charge))
    if (shade > 0) {
      v.ctx.globalAlpha = CHARGE_SHADE
      rect(v, C_INK, x, 1, PIP - 1, shade)
      v.ctx.globalAlpha = 1
      rect(v, C_WHITE, x, shade, PIP - 1, 1)
    } else if (t - v.skillReadyAt < READY_FLASH_TICKS && (v.reducedMotion || ((t / 5) | 0) % 2 === 0)) {
      rect(v, C_WHITE, x - 1, 0, PIP + 1, 1)
      rect(v, C_WHITE, x - 1, PIP, PIP + 1, 1)
      rect(v, C_WHITE, x - 1, 0, 1, PIP + 1)
      rect(v, C_WHITE, x + PIP - 1, 0, 1, PIP + 1)
    }
  }
  if (s.stance === ELEMENT_EMBER && (s.stancesUnlocked & (1 << ELEMENT_EMBER)) !== 0) {
    bar(v, left, PIP + 2, PIP * ELEMENT_COUNT - 1, 2, s.heat / HEAT_MAX, s.heat >= HEAT_MAX * 0.5 ? C_GOLD : C_EMBER, C_STONE_DARK)
  }
}

export function activeBoss(s: State): number {
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (s.eAlive[i]! !== 0 && s.eKind[i]! >= ENEMY_BOSS_FIRST && s.eState[i]! !== AI_IDLE) return i
  }
  return -1
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
  const x = Math.round(s.ePrevX[i]! + (s.eX[i]! - s.ePrevX[i]!) * alpha - v.originX)
  const y = Math.round(s.ePrevY[i]! + (s.eY[i]! - s.ePrevY[i]!) * alpha - v.originY - body * 0.8)
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
  const gx = Math.round(s.guideX - v.originX)
  const gy = Math.round(s.guideY - v.originY)
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
  let x = Math.round(cx + dx * k)
  let y = Math.round(cy + dy * k)
  if (x < left) x = left
  if (x > right) x = right
  if (y < top) y = top
  if (y > bottom) y = bottom
  const push = bob ? 1 : 0
  const len = Math.sqrt(dx * dx + dy * dy)
  blitCentered(v, frameId(v, SPR_ROTATED, ROT_QUEST, rotationIndex(dx, dy)), x + Math.round((dx / len) * push), y + Math.round((dy / len) * push))
}

function drawInteract(v: View, s: State, t: number): void {
  const i = s.interactObj
  if (i < 0 || i >= MAX_OBJECTS || s.objKind[i]! === OBJ_NONE || s.phase !== PHASE_PLAYING) return
  const x = Math.round(s.objX[i]! - v.originX)
  const y = Math.round(s.objY[i]! - v.originY)
  blitCentered(v, frameId(v, SPR_FX, FX_PIP, 0), x, y - 24 - (((t / 14) | 0) & 1))
}

export function drawHud(v: View, s: State, t: number, alpha: number): void {
  drawReticle(v, s, t, alpha)
  drawGuide(v, s, t)
  drawInteract(v, s, t)
  drawBoss(v, s)
  drawMeters(v, s, t)
}
