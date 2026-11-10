import type { State } from '../sim/state.ts'
import { PASSIVE_COUNT, TICK_HZ, WEAPON_COUNT } from '../sim/content.ts'
import type { View } from './view.ts'
import { GLYPH_DARK, GLYPH_LIGHT, ICON_FULL, ICON_MINI } from './atlas.ts'
import {
  FONT_ADVANCE,
  FONT_HEIGHT,
  HUD_MARK_KILLS,
  HUD_MARK_LEVEL,
  ICON_EVOLVED_FIRST,
  ICON_PASSIVE_FIRST,
  ICON_SIZE,
  SPR_HUD_MARKS,
  SPR_ICONS,
} from './sheet.ts'
import { blitAt, drawChar, drawNumber, frameId, numberWidth } from './sprite.hot.ts'
import { AMBER, ARMOR, CORE, CORE_DEEP, CYAN, CYAN_DEEP, INK, LINE } from './colors.ts'

const COLON = 58
const FULL_ICON_SCALE = 2

function bar(v: View, x: number, y: number, w: number, h: number, fraction: number, fill: string, track: string): void {
  const ctx = v.ctx
  ctx.fillStyle = INK
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2)
  ctx.fillStyle = track
  ctx.fillRect(x, y, w, h)
  const clamped = fraction < 0 ? 0 : fraction > 1 ? 1 : fraction
  const filled = Math.round(w * clamped)
  if (filled > 0) {
    ctx.fillStyle = fill
    ctx.fillRect(x, y, filled, h)
  }
}

function shadowNumber(v: View, n: number, minDigits: number, tint: number, x: number, y: number, k: number): number {
  drawNumber(v, n, minDigits, GLYPH_DARK, x + k, y + k, k)
  return drawNumber(v, n, minDigits, tint, x, y, k)
}

function drawClock(v: View, seconds: number, x: number, y: number, k: number): void {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds - minutes * 60
  let cursor = shadowNumber(v, minutes, 2, GLYPH_LIGHT, x, y, k)
  drawChar(v, COLON, GLYPH_DARK, cursor + k, y + k, k)
  drawChar(v, COLON, GLYPH_LIGHT, cursor, y, k)
  cursor += FONT_ADVANCE * k
  shadowNumber(v, rest, 2, GLYPH_LIGHT, cursor, y, k)
}

function drawIconRow(v: View, s: State, unit: number): void {
  const mini = v.scale !== FULL_ICON_SCALE
  const variant = mini ? ICON_MINI : ICON_FULL
  const size = (mini ? ICON_SIZE >> 1 : ICON_SIZE) * unit
  const gap = size + unit
  let owned = 0
  for (let w = 0; w < WEAPON_COUNT; w++) if (s.weaponLevel[w]! > 0) owned++
  let passives = 0
  for (let p = 0; p < PASSIVE_COUNT; p++) if (s.passiveLevel[p]! > 0) passives++
  const perRow = Math.max(1, Math.floor((v.width - 4) / gap))
  const split = owned + passives > perRow
  let x = 2
  let y = v.height - 2 - size - (split ? gap : 0)
  for (let w = 0; w < WEAPON_COUNT; w++) {
    if (s.weaponLevel[w]! === 0) continue
    const frame = s.weaponEvolved[w]! > 0 ? ICON_EVOLVED_FIRST + w : w
    blitAt(v, frameId(v, SPR_ICONS, frame, variant), x, y, unit)
    x += gap
  }
  if (split) {
    x = 2
    y += gap
  }
  for (let p = 0; p < PASSIVE_COUNT; p++) {
    if (s.passiveLevel[p]! === 0) continue
    blitAt(v, frameId(v, SPR_ICONS, ICON_PASSIVE_FIRST + p, variant), x, y, unit)
    x += gap
  }
}

export function drawPlayerArmor(v: View, s: State, x: number, y: number): void {
  const fraction = s.maxHp > 0 ? s.hp / s.maxHp : 0
  bar(v, x - 7, y + 11, 14, 2, fraction, fraction < 0.3 ? CORE : ARMOR, LINE)
}

export function drawHud(v: View, s: State): void {
  const unit = v.scale === 1 ? 2 : 1
  const left = 2 * unit
  const right = v.width - v.clearRight - 2 * unit
  const top = 2 * unit
  const barWidth = right - left
  const xpFraction = s.xpNext > 0 ? s.xp / s.xpNext : 0
  const stripHeight = (s.bossMaxHp > 0 ? 20 : 13) * unit
  v.ctx.globalAlpha = 0.6
  v.ctx.fillStyle = INK
  v.ctx.fillRect(0, 0, right + 2 * unit, stripHeight)
  v.ctx.globalAlpha = 1
  bar(v, left, top, barWidth, 2 * unit, xpFraction, CYAN, CYAN_DEEP)
  v.ctx.fillStyle = LINE
  v.ctx.fillRect(left, top + 2 * unit, barWidth, unit)

  const row = top + 5 * unit
  blitAt(v, frameId(v, SPR_HUD_MARKS, HUD_MARK_LEVEL, 0), left, row, unit)
  shadowNumber(v, s.level, 1, GLYPH_LIGHT, left + 6 * unit, row, unit)

  const clockWidth = (5 * FONT_ADVANCE - 1) * unit
  drawClock(v, Math.floor(s.tick / TICK_HZ), left + ((barWidth - clockWidth) >> 1), row, unit)

  const killsWidth = numberWidth(s.kills, 1, unit)
  const killsX = right - killsWidth
  shadowNumber(v, s.kills, 1, GLYPH_LIGHT, killsX, row, unit)
  blitAt(v, frameId(v, SPR_HUD_MARKS, HUD_MARK_KILLS, 0), killsX - 7 * unit, row, unit)

  if (s.bossMaxHp > 0) {
    const bossRow = row + (FONT_HEIGHT + 4) * unit
    const bossWidth = Math.min(barWidth - 16 * unit, 140 * unit)
    const bossX = left + ((barWidth - bossWidth) >> 1)
    blitAt(v, frameId(v, SPR_HUD_MARKS, HUD_MARK_KILLS, 0), bossX - 7 * unit, bossRow - unit, unit)
    bar(v, bossX, bossRow, bossWidth, 2 * unit, s.bossHp / s.bossMaxHp, CORE, CORE_DEEP)
    v.ctx.fillStyle = AMBER
    v.ctx.fillRect(bossX, bossRow + 2 * unit, bossWidth, unit)
  }

  drawIconRow(v, s, unit)
}
