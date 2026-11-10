import type { State } from '../sim/state.ts'
import { BOSS_COUNT, ENEMY_BOSS_FIRST, PASSIVE_COUNT, TICK_HZ, WEAPON_COUNT } from '../sim/content.ts'
import type { View } from './view.ts'
import { GLYPH_DARK, GLYPH_LIGHT, GLYPH_RED, ICON_FULL, ICON_MINI } from './atlas.ts'
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
import { blitAt, drawChar, drawNumber, drawText, frameId, numberWidth } from './sprite.hot.ts'
import { drawNavigation } from './nav.hot.ts'
import { ARMOR, CORE, CYAN, CYAN_DEEP, INK, LINE } from './colors.ts'

const COLON = 58
const FULL_ICON_SCALE = 2
const BOSS_ROW_HEIGHT = 7
const BOSS_NAME_CHARS = 14
const HUD_BASE_HEIGHT = 13

function findBosses(v: View, s: State): number {
  const rows = v.bossRows
  for (let b = 0; b < BOSS_COUNT; b++) rows[b] = -1
  let alive = 0
  for (let i = 0; i < s.enemyCount; i++) {
    const boss = s.eType[i]! - ENEMY_BOSS_FIRST
    if (boss < 0 || boss >= BOSS_COUNT || s.eHp[i]! <= 0 || rows[boss]! >= 0) continue
    rows[boss] = i
    alive++
  }
  return alive
}

function drawBossRows(v: View, s: State, left: number, right: number, top: number, unit: number): void {
  const nameWidth = BOSS_NAME_CHARS * FONT_ADVANCE * unit
  const nameX = left + 7 * unit
  const barX = nameX + nameWidth + 2 * unit
  const barWidth = right - barX - unit
  let y = top
  for (let b = 0; b < BOSS_COUNT; b++) {
    const i = v.bossRows[b]!
    if (i < 0) continue
    blitAt(v, frameId(v, SPR_HUD_MARKS, HUD_MARK_KILLS, 0), left, y, unit)
    const name = v.bossNames[b]!
    drawText(v, name, GLYPH_DARK, nameX + unit, y + unit, unit)
    drawText(v, name, GLYPH_RED, nameX, y, unit)
    const max = s.eMaxHp[i]!
    bar(v, barX, y + unit, barWidth, 3 * unit, max > 0 ? s.eHp[i]! / max : 0, CORE, LINE)
    y += BOSS_ROW_HEIGHT * unit
  }
}

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
  v.hudBottom = owned + passives > 0 ? y - unit : v.height
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
  bar(v, x - 8, y + 14, 16, 2, fraction, fraction < 0.3 ? CORE : ARMOR, LINE)
}

export function drawHud(v: View, s: State, t: number, playerX: number, playerY: number): void {
  const unit = v.scale === 1 ? 2 : 1
  const left = 2 * unit
  const right = v.width - v.clearRight - 2 * unit
  const top = 2 * unit
  const barWidth = right - left
  const xpFraction = s.xpNext > 0 ? s.xp / s.xpNext : 0
  const bosses = findBosses(v, s)
  const stripHeight = (HUD_BASE_HEIGHT + bosses * BOSS_ROW_HEIGHT) * unit
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

  if (bosses > 0) drawBossRows(v, s, left, right, row + (FONT_HEIGHT + 2) * unit, unit)

  v.hudTop = stripHeight
  drawIconRow(v, s, unit)
  drawNavigation(v, s, t, playerX, playerY)
}
