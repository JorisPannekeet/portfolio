import type { State } from '../sim/state.ts'
import {
  AI_WINDUP, AREA_COUNT, CH_EMBER, DAY_TICKS, ELEMENT_COUNT, ENEMY_BOSS_FIRST, MAX_ENEMIES, MAX_OBJECTS, NIGHT_START_TICKS, OBJ_FORGE, OBJ_KEY, OBJ_PEDESTAL,
  OBJ_SHRINE, OBJ_WAYSTONE,
} from '../sim/content.ts'
import { LIGHT_CAP, LIGHT_COLS, type View } from './view.ts'
import { AREA_CORRUPTIBLE, AREA_DUNGEON, AREA_OUTDOOR } from './sheet-world.ts'
import { AREA_DARK, COLOR_RIM } from './ambient.ts'
import { C_CORRUPT, C_EMBER, C_GOLD, C_INK, C_NIGHT, C_RUST, C_TEAL, HEX, STANCE_COLOR } from './colors.ts'

const TWILIGHT = 40 * 60
const NIGHT_DARK = 0.56
const RAIN_DARK = 0.2
const FADE_TICKS = 24
const VIGNETTE_STEPS = 8
const VIGNETTE_ALPHA = 0.045
const DUNGEON_VIGNETTE = 0.9
const CELL = 2
const LEVELS = 8
const LEVEL_ALPHA = Float32Array.of(0, 0.07, 0.17, 0.3, 0.44, 0.58, 0.72, 0.86, 1)
const LEVEL_RADIUS = Float32Array.of(0.3, 0.41, 0.51, 0.6, 0.69, 0.78, 0.88, 1)
const ROW_JITTER = 0.965
const WARM_ALPHA = 0.1
const RIM_ALPHA = 0.07
const ENEMY_RIM = 18
const BOSS_RIM = 34
const ENEMY_FLOOR = 3
const WINDUP_RIM = 34
const BOSS_WINDUP_RIM = 64
const WINDUP_FLOOR = 1

export function nightAmount(clock: number): number {
  const c = ((clock % DAY_TICKS) + DAY_TICKS) % DAY_TICKS
  if (c < NIGHT_START_TICKS) return 0
  const into = (c - NIGHT_START_TICKS) / TWILIGHT
  const left = (DAY_TICKS - c) / TWILIGHT
  const amount = into < left ? into : left
  return amount > 1 ? 1 : amount
}

function duskAmount(clock: number): number {
  const c = ((clock % DAY_TICKS) + DAY_TICKS) % DAY_TICKS
  const d = Math.abs(c - NIGHT_START_TICKS)
  const dawn = c < TWILIGHT ? c : DAY_TICKS - c
  const near = d < dawn ? d : dawn
  return near < TWILIGHT ? 1 - near / TWILIGHT : 0
}

export function pushGlow(v: View, x: number, y: number, r: number, color: number, floor: number): void {
  if (v.lightCount >= LIGHT_CAP - 1 || x < -r || y < -r || x > v.width + r || y > v.height + r) return
  const i = v.lightCount++
  v.lightX[i] = x
  v.lightY[i] = y
  v.lightR[i] = r
  v.lightColor[i] = color
  v.lightFloor[i] = floor
}

export function pushLight(v: View, x: number, y: number, r: number, color: number): void {
  pushGlow(v, x, y, r, color, 0)
}

function tint(v: View, color: number, alpha: number): void {
  if (alpha <= 0) return
  v.ctx.globalAlpha = alpha
  v.ctx.fillStyle = HEX[color]!
  v.ctx.fillRect(0, 0, v.width, v.height)
}

function vignette(v: View, strength: number): void {
  const ctx = v.ctx
  const band = Math.max(1, Math.round(Math.min(v.width, v.height) / 40))
  ctx.fillStyle = HEX[C_INK]!
  ctx.globalAlpha = VIGNETTE_ALPHA * strength
  for (let k = 0; k < VIGNETTE_STEPS; k++) {
    const d = band * (VIGNETTE_STEPS - k)
    ctx.fillRect(0, 0, v.width, d)
    ctx.fillRect(0, v.height - d, v.width, d)
    ctx.fillRect(0, d, d, v.height - d * 2)
    ctx.fillRect(v.width - d, d, d, v.height - d * 2)
  }
}

function bandLit(v: View, cy: number): boolean {
  for (let k = 0; k < v.lightCount; k++) if (Math.abs(cy - v.lightY[k]!) < v.lightR[k]!) return true
  return false
}

function darkness(v: View, alpha: number): void {
  const ctx = v.ctx
  ctx.fillStyle = HEX[C_NIGHT]!
  const cols = Math.min(LIGHT_COLS, Math.ceil(v.width / CELL))
  const rows = Math.ceil(v.height / CELL)
  const level = v.lightLevel
  for (let r = 0; r < rows; r++) {
    const cy = r * CELL + CELL * 0.5
    if (!bandLit(v, cy)) {
      let end = r
      while (end + 1 < rows && !bandLit(v, (end + 1) * CELL + CELL * 0.5)) end++
      ctx.globalAlpha = alpha
      ctx.fillRect(0, r * CELL, v.width, (end - r + 1) * CELL)
      r = end
      continue
    }
    const jitter = (r & 1) === 1 ? ROW_JITTER : 1
    for (let c = 0; c < cols; c++) level[c] = LEVELS
    for (let k = 0; k < v.lightCount; k++) {
      const dy = cy - v.lightY[k]!
      const lr = v.lightR[k]! * jitter
      const floor = v.lightFloor[k]!
      for (let m = LEVELS - 1; m >= floor; m--) {
        const rm = lr * LEVEL_RADIUS[m]!
        if (Math.abs(dy) >= rm) break
        const half = Math.sqrt(rm * rm - dy * dy)
        let c0 = Math.floor((v.lightX[k]! - half) / CELL + 0.5)
        let c1 = Math.floor((v.lightX[k]! + half) / CELL - 0.5)
        if (c0 < 0) c0 = 0
        if (c1 > cols - 1) c1 = cols - 1
        for (let c = c0; c <= c1; c++) if (level[c]! > m) level[c] = m
      }
    }
    let c = 0
    while (c < cols) {
      const m = level[c]!
      let end = c
      while (end + 1 < cols && level[end + 1] === m) end++
      if (m > 0) {
        ctx.globalAlpha = alpha * LEVEL_ALPHA[m]!
        ctx.fillRect(c * CELL, r * CELL, end === cols - 1 ? v.width - c * CELL : (end - c + 1) * CELL, CELL)
      }
      c = end + 1
    }
  }
}

function warmth(v: View, dark: number): void {
  const ctx = v.ctx
  for (let k = 0; k < v.lightCount; k++) {
    const color = v.lightColor[k]!
    if (color === C_INK) continue
    const rim = color === COLOR_RIM
    const r = v.lightR[k]! * (rim ? 0.6 : 0.45)
    ctx.globalAlpha = (rim ? RIM_ALPHA : WARM_ALPHA) * (0.4 + dark)
    ctx.fillStyle = HEX[color]!
    ctx.beginPath()
    ctx.ellipse(v.lightX[k]!, v.lightY[k]!, r, r * 0.75, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

function objectLights(v: View, s: State, t: number): void {
  const ox = v.originX
  const oy = v.originY
  const flicker = v.reducedMotion ? 0 : ((t / 5) | 0) & 1
  for (let i = 0; i < MAX_OBJECTS; i++) {
    const kind = s.objKind[i]!
    const x = s.objX[i]! - ox
    const y = s.objY[i]! - oy
    if (kind === OBJ_FORGE) pushLight(v, x - 2, y - 4, 46 + flicker * 2, C_EMBER)
    else if (kind === OBJ_WAYSTONE && s.objState[i]! > 0) pushLight(v, x, y - 6, 30, C_TEAL)
    else if (kind === OBJ_SHRINE && s.objState[i]! === 0) pushLight(v, x, y - 6, 34, C_TEAL)
    else if (kind === OBJ_PEDESTAL && s.objState[i]! === 0) {
      const e = s.objArg[i]!
      pushLight(v, x, y - 8, 30, e >= 0 && e < ELEMENT_COUNT ? STANCE_COLOR[e]! : C_GOLD)
    } else if (kind === OBJ_KEY) pushLight(v, x, y - 4, 22, C_GOLD)
  }
}

function enemyLights(v: View, s: State, t: number): void {
  const a = t - s.tick
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (s.eAlive[i]! === 0) continue
    const x = s.ePrevX[i]! + (s.eX[i]! - s.ePrevX[i]!) * a - v.originX
    const y = s.ePrevY[i]! + (s.eY[i]! - s.ePrevY[i]!) * a - v.originY
    const boss = s.eKind[i]! >= ENEMY_BOSS_FIRST
    if (s.eState[i]! === AI_WINDUP) pushGlow(v, x, y, boss ? BOSS_WINDUP_RIM : WINDUP_RIM, COLOR_RIM, WINDUP_FLOOR)
    else pushGlow(v, x, y - (boss ? 8 : 4), boss ? BOSS_RIM : ENEMY_RIM, COLOR_RIM, ENEMY_FLOOR)
  }
}

export function drawLighting(v: View, s: State, t: number): void {
  const area = s.area >= 0 && s.area < AREA_COUNT ? s.area : 0
  const outdoor = AREA_OUTDOOR[area]! !== 0
  const vigil = s.chapter >= CH_EMBER && outdoor
  let dark = AREA_DARK[area]!
  if (outdoor) {
    tint(v, C_EMBER, duskAmount(s.clock) * 0.1)
    dark = v.night * NIGHT_DARK + v.rain * RAIN_DARK + (vigil ? 0.12 : 0)
  }
  if (vigil) tint(v, C_RUST, 0.14)
  if (AREA_CORRUPTIBLE[area]! !== 0 && s.areaVariant === 1) tint(v, C_CORRUPT, 0.16)
  if (dark > 0.02) {
    objectLights(v, s, t)
    enemyLights(v, s, t)
    if (!outdoor || v.night >= 0.3) {
      const i = v.lightCount++
      v.lightX[i] = v.playerX
      v.lightY[i] = v.playerY - 6
      v.lightR[i] = (outdoor ? 52 : 60) + (v.reducedMotion ? 0 : ((t / 30) | 0) & 1)
      v.lightColor[i] = C_INK
      v.lightFloor[i] = 0
    }
    darkness(v, dark)
    warmth(v, dark)
  }
  if (AREA_DUNGEON[area]! !== 0) vignette(v, DUNGEON_VIGNETTE)
  else if (v.night > 0 || vigil) vignette(v, v.night + (vigil ? 0.5 : 0))
  if (s.areaTick < FADE_TICKS) tint(v, C_INK, 1 - s.areaTick / FADE_TICKS)
  v.ctx.globalAlpha = 1
}
