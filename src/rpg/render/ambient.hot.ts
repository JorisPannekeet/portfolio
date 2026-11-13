import type { State } from '../sim/state.ts'
import {
  AREA_ASHFORGE, AREA_COUNT, AREA_SALTREACH, AREA_VELLIN, ELEMENT_COUNT, MAX_OBJECTS, OBJ_PEDESTAL, OBJ_SHRINE, OBJ_WAYSTONE, TILE, TILE_ASH,
  TILE_BRIDGE, TILE_FLOOR, TILE_GRASS, TILE_LAVA, TILE_ROAD, TILE_RUBBLE, TILE_TREE, TILE_WATER,
} from '../sim/content.ts'
import { AMB_CAP, BIRD_CAP, type View } from './view.ts'
import { snap } from './sprite.hot.ts'
import {
  AREA_CORRUPTIBLE, AREA_OUTDOOR, LANDMARK_PART_END, LANDMARK_PART_START, PART_COLOR, PART_DRIP, PART_DUST, PART_EMBER, PART_GLINT, PART_H, PART_KIND,
  PART_RATE, PART_RIPPLE, PART_W, PART_WISP, PART_X, PART_Y,
} from './sheet-world.ts'
import {
  AMB_BUBBLE, AMB_BUTTERFLY, AMB_DRIP, AMB_DUST, AMB_EMBER, AMB_FIREFLY, AMB_GLINT, AMB_LEAF, AMB_MOTE, AMB_NONE, AMB_PETAL, AMB_SMOKE, AMB_SPLASH,
  AREA_MOTE_ALT, AREA_MOTE_COLOR, AREA_MOTE_KIND, AREA_MOTE_RATE, COLOR_ASH, COLOR_BIRD, COLOR_BIRD_BELLY, COLOR_FIREFLY, COLOR_LEAF, COLOR_LEAF_DARK,
  COLOR_MIST, COLOR_RAIN, COLOR_RIM, COLOR_SMOKE, COLOR_WING, COLOR_WING_ALT, CORRUPT_MOTE_ALT, CORRUPT_MOTE_COLOR, WEATHER_BREEZY, WEATHER_MIST, WEATHER_RAIN,
  ashAmount, weatherAmount,
} from './ambient.ts'
import { random } from './effects.hot.ts'
import { nightAmount } from './light.hot.ts'
import { landmarkFoot, landmarkLead, landmarkOf, tileAt } from './tiles.hot.ts'
import { C_DUST, C_EMBER, C_GOLD, C_GOLD_PALE, C_PALE, C_RED, C_TEAL, C_WHITE, HEX, STANCE_LIGHT } from './colors.ts'
import { ART } from './art.ts'

const RAIN_DROPS = 150
const ASH_FLAKES = 46
const SPLASHES = 40
const SPLASH_PERIOD = 26
const STREAKS = 14
const BIRD_FLEE = 44
const STEP_TICKS = 9
const MAX_CATCHUP = 4

function hashf(i: number, k: number): number {
  let h = Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(k + 7, 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d)
  h = Math.imul(h ^ (h >>> 13), 0x297a2d39)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function wrap(value: number, span: number): number {
  return ((value % span) + span) % span
}

export function updateWeather(v: View, s: State): void {
  const area = s.area >= 0 && s.area < AREA_COUNT ? s.area : 0
  const outdoor = AREA_OUTDOOR[area]! !== 0
  v.night = outdoor ? nightAmount(s.clock) : 0
  v.rain = weatherAmount(s, WEATHER_RAIN)
  v.mist = weatherAmount(s, WEATHER_MIST)
  v.wind = outdoor ? 0.25 + weatherAmount(s, WEATHER_BREEZY) * 0.75 + v.rain * 0.3 : area === AREA_VELLIN ? 0.8 : 0
  v.ash = ashAmount(s)
}

function spawn(v: View, kind: number, x: number, y: number, vx: number, vy: number, life: number, color: number, now: number): void {
  const i = v.ambNext
  v.ambNext = (i + 1) % AMB_CAP
  v.ambKind[i] = kind
  v.ambX[i] = x
  v.ambY[i] = y
  v.ambVx[i] = vx
  v.ambVy[i] = vy
  v.ambLife[i] = life
  v.ambColor[i] = color
  v.ambBirth[i] = now
}

export function ambientLive(v: View, t: number): number {
  let live = 0
  for (let i = 0; i < AMB_CAP; i++) if (v.ambKind[i]! !== AMB_NONE && t - v.ambBirth[i]! < v.ambLife[i]!) live++
  return live
}

function randomTile(v: View, s: State): number {
  const tx = Math.floor((v.originX + random(v) * v.width) / TILE)
  const ty = Math.floor((v.originY + random(v) * v.height) / TILE)
  return tileAt(s, tx, ty) < 0 ? -1 : ty * s.mapW + tx
}

function nearKind(s: State, cell: number, kind: number): boolean {
  const tx = cell % s.mapW
  const ty = (cell / s.mapW) | 0
  return tileAt(s, tx - 1, ty) === kind || tileAt(s, tx + 1, ty) === kind || tileAt(s, tx, ty - 1) === kind || tileAt(s, tx, ty + 1) === kind
}

function cellX(s: State, cell: number, v: View): number {
  return (cell % s.mapW) * TILE + random(v) * TILE
}

function cellY(s: State, cell: number, v: View): number {
  return ((cell / s.mapW) | 0) * TILE + random(v) * TILE
}

function spawnAreaMotes(v: View, s: State, area: number, now: number, thin: number): void {
  const corrupt = AREA_CORRUPTIBLE[area]! !== 0 && s.areaVariant === 1
  const outdoor = AREA_OUTDOOR[area]! !== 0
  const rate = (AREA_MOTE_RATE[area]! * (outdoor ? 1 - v.night * 0.7 - v.rain * 0.8 : 1) + (corrupt ? 0.3 : 0)) * thin
  if (random(v) >= rate) return
  const alt = random(v) < 0.3
  const color = corrupt && random(v) < 0.7 ? (alt ? CORRUPT_MOTE_ALT : CORRUPT_MOTE_COLOR) : alt ? AREA_MOTE_ALT[area]! : AREA_MOTE_COLOR[area]!
  const kind = corrupt ? AMB_MOTE : AREA_MOTE_KIND[area]!
  const x = v.originX + random(v) * v.width
  const y = v.originY + random(v) * v.height
  if (kind === AMB_EMBER) {
    const cell = randomTile(v, s)
    if (cell >= 0 && s.tiles[cell] === TILE_LAVA) spawn(v, AMB_EMBER, cellX(s, cell, v), cellY(s, cell, v), (random(v) - 0.5) * 0.2, -0.3 - random(v) * 0.4, 70 + random(v) * 60, color, now)
    else spawn(v, AMB_EMBER, x, v.originY + v.height + 4, (random(v) - 0.5) * 0.3, -0.35 - random(v) * 0.3, 160, color, now)
  } else if (kind === AMB_DRIP) {
    const cell = randomTile(v, s)
    if (cell >= 0 && s.tiles[cell] === TILE_WATER) spawn(v, AMB_BUBBLE, cellX(s, cell, v), cellY(s, cell, v), 0, -0.12, 50, color, now)
    else if (cell >= 0 && s.tiles[cell] === TILE_FLOOR) spawn(v, AMB_DRIP, cellX(s, cell, v), cellY(s, cell, v), 0, 0, 40, color, now)
  } else if (kind === AMB_PETAL) spawn(v, AMB_PETAL, v.originX - 4, y, 0.6 + random(v) * 0.5, 0.12 + random(v) * 0.15, 260, color, now)
  else if (kind === AMB_GLINT) spawn(v, AMB_GLINT, x, y, 0, 0, 40, color, now)
  else spawn(v, AMB_MOTE, x, y, (random(v) - 0.5) * 0.12, -0.03 - random(v) * 0.06, 180 + random(v) * 140, color, now)
}

function spawnOutdoor(v: View, s: State, now: number, thin: number): void {
  if (random(v) < v.wind * 0.12 * thin) {
    spawn(v, AMB_LEAF, v.originX + random(v) * v.width - 30, v.originY - 4, 0.3 + v.wind * 0.7, 0.22 + random(v) * 0.15, 240, random(v) < 0.5 ? COLOR_LEAF : COLOR_LEAF_DARK, now)
  }
  if (v.night > 0.3 && random(v) < 0.12 * v.night * thin) {
    const cell = randomTile(v, s)
    if (cell >= 0 && s.tiles[cell] === TILE_GRASS && (nearKind(s, cell, TILE_TREE) || nearKind(s, cell, TILE_WATER))) {
      spawn(v, AMB_FIREFLY, cellX(s, cell, v), cellY(s, cell, v), 0, 0, 220 + random(v) * 120, COLOR_FIREFLY, now)
    }
  }
  if (v.night < 0.2 && v.rain < 0.3 && random(v) < 0.01 * thin) {
    const cell = randomTile(v, s)
    if (cell >= 0 && s.tiles[cell] === TILE_GRASS) spawn(v, AMB_BUTTERFLY, cellX(s, cell, v), cellY(s, cell, v), random(v) < 0.5 ? 0.25 : -0.25, 0, 420, random(v) < 0.5 ? COLOR_WING : COLOR_WING_ALT, now)
  }
  if (v.night > 0.4 && v.lightCount > 0 && random(v) < 0.03 * thin) {
    const k = (random(v) * v.lightCount) | 0
    if (v.lightColor[k]! === COLOR_RIM || v.lightFloor[k]! !== 0) return
    spawn(v, AMB_BUTTERFLY, v.lightX[k]! + v.originX, v.lightY[k]! + v.originY - 6, 0.2, 0, 200, COLOR_MIST, now)
  }
}

function spawnSteps(v: View, s: State, now: number): void {
  if (s.playerX === s.playerPrevX && s.playerY === s.playerPrevY) return
  if (s.tick % STEP_TICKS !== 0 || s.mounted !== 0) return
  const kind = tileAt(s, Math.floor(s.playerX / TILE), Math.floor(s.playerY / TILE))
  const fx = s.playerX + (random(v) - 0.5) * 4
  const fy = s.playerY + 6
  if (v.rain > 0.3 && AREA_OUTDOOR[s.area]! !== 0) spawn(v, AMB_SPLASH, fx, fy, 0, 0, 14, COLOR_RAIN, now)
  else if (kind === TILE_ROAD || kind === TILE_ASH || kind === TILE_RUBBLE || kind === TILE_BRIDGE || kind === TILE_FLOOR) {
    spawn(v, AMB_DUST, fx - 2, fy, -0.15, -0.08, 18, C_DUST, now)
    spawn(v, AMB_DUST, fx + 2, fy, 0.15, -0.08, 18, C_DUST, now)
  } else if (kind === TILE_GRASS) {
    spawn(v, AMB_DUST, fx, fy - 1, (random(v) - 0.5) * 0.4, -0.35, 14, COLOR_LEAF, now)
  }
}

function spawnObjectSparkles(v: View, s: State, now: number, thin: number): void {
  for (let i = 0; i < MAX_OBJECTS; i++) {
    const kind = s.objKind[i]!
    const lit = (kind === OBJ_WAYSTONE && s.objState[i]! > 0) || (kind === OBJ_SHRINE && s.objState[i]! === 0) || (kind === OBJ_PEDESTAL && s.objState[i]! === 0)
    if (!lit || random(v) >= 0.05 * thin) continue
    const x = s.objX[i]!
    const y = s.objY[i]!
    if (x < v.originX - 16 || x > v.originX + v.width + 16 || y < v.originY - 16 || y > v.originY + v.height + 32) continue
    const e = s.objArg[i]!
    const color = kind === OBJ_PEDESTAL && e >= 0 && e < ELEMENT_COUNT ? STANCE_LIGHT[e]! : random(v) < 0.5 ? C_TEAL : C_WHITE
    spawn(v, AMB_GLINT, x + (random(v) - 0.5) * 12, y - 4 - random(v) * 14, 0, -0.1, 36, color, now)
  }
}

function spawnPart(v: View, s: State, p: number, x: number, y: number, now: number): void {
  const kind = PART_KIND[p]!
  const color = PART_COLOR[p]!
  if (kind === PART_EMBER) spawn(v, AMB_EMBER, x, y, (random(v) - 0.5) * 0.24, -0.3 - random(v) * 0.35, 60 + random(v) * 60, color, now)
  else if (kind === PART_DUST) spawn(v, AMB_DUST, x, y, (random(v) - 0.5) * 0.1, 0.1 + random(v) * 0.08, 50, color, now)
  else if (kind === PART_GLINT) spawn(v, AMB_GLINT, x, y, 0, 0, 40, color, now)
  else if (kind === PART_DRIP) spawn(v, AMB_DRIP, x, y + 14, 0, 0, 40, color, now)
  else if (kind === PART_WISP) spawn(v, AMB_PETAL, x, y, 0.5 + random(v) * 0.5, (random(v) - 0.5) * 0.1, 260, color, now)
  else if (kind === PART_RIPPLE && tileAt(s, Math.floor(x / TILE), Math.floor(y / TILE)) === TILE_WATER) spawn(v, AMB_SPLASH, x, y, 0, 0, 40, color, now)
}

function spawnLandmarks(v: View, s: State, now: number, thin: number): void {
  for (let i = 0; i < MAX_OBJECTS; i++) {
    const area = landmarkOf(s, i)
    if (area < 0 || !landmarkLead(s, i)) continue
    const ax = s.objX[i]! + TILE / 2
    const ay = landmarkFoot(s, i)
    if (ax < v.originX - 240 || ax > v.originX + v.width + 240 || ay < v.originY - 40 || ay > v.originY + v.height + 260) continue
    for (let p = LANDMARK_PART_START[area]!; p < LANDMARK_PART_END[area]!; p++) {
      if (random(v) >= PART_RATE[p]! * thin) continue
      spawnPart(v, s, p, ax + PART_X[p]! + random(v) * PART_W[p]!, ay + PART_Y[p]! + random(v) * PART_H[p]!, now)
    }
  }
}

function updateBirds(v: View, s: State, outdoor: boolean, thin: number): void {
  const px = s.playerX
  const py = s.playerY
  for (let i = 0; i < BIRD_CAP; i++) {
    const state = v.birdState[i]!
    if (state === 0) {
      if (!outdoor || v.night > 0.5 || v.rain > 0.5 || random(v) >= 0.004 * thin) continue
      const cell = randomTile(v, s)
      if (cell < 0 || s.tiles[cell] !== TILE_GRASS) continue
      const bx = cellX(s, cell, v)
      const by = cellY(s, cell, v)
      if (Math.abs(bx - px) + Math.abs(by - py) < BIRD_FLEE * 2) continue
      v.birdState[i] = 1
      v.birdX[i] = bx
      v.birdY[i] = by
      v.birdT[i] = s.tick + random(v) * 60
    } else if (state === 1) {
      const dx = v.birdX[i]! - px
      const dy = v.birdY[i]! - py
      if (Math.abs(dx) + Math.abs(dy) < BIRD_FLEE || v.rain > 0.6) {
        v.birdState[i] = 2
        v.birdVx[i] = (dx < 0 ? -1 : 1) * (0.9 + random(v) * 0.6)
        v.birdVy[i] = -0.8 - random(v) * 0.5
      } else if (!outdoor || Math.abs(dx) > 400 || Math.abs(dy) > 300) v.birdState[i] = 0
    } else {
      v.birdX[i] = v.birdX[i]! + v.birdVx[i]!
      v.birdY[i] = v.birdY[i]! + v.birdVy[i]!
      const sx = v.birdX[i]! - v.originX
      const sy = v.birdY[i]! - v.originY
      if (sx < -40 || sy < -40 || sx > v.width + 40 || sy > v.height + 40) v.birdState[i] = 0
    }
  }
}

export function updateAmbient(v: View, s: State): void {
  if (s.tick < v.ambTick || v.ambTick < 0) {
    v.ambKind.fill(AMB_NONE)
    v.birdState.fill(0)
    v.ambTick = s.tick
  }
  let steps = s.tick - v.ambTick
  if (steps > MAX_CATCHUP) steps = MAX_CATCHUP
  v.ambTick = s.tick
  const area = s.area >= 0 && s.area < AREA_COUNT ? s.area : 0
  const outdoor = AREA_OUTDOOR[area]! !== 0
  const thin = v.reducedMotion ? 0.12 : 1
  for (let n = 0; n < steps; n++) {
    const now = s.tick - steps + n + 1
    spawnAreaMotes(v, s, area, now, thin)
    if (outdoor) spawnOutdoor(v, s, now, thin)
    else if (area === AREA_ASHFORGE && random(v) < 0.08 * thin) {
      const cell = randomTile(v, s)
      if (cell >= 0 && s.tiles[cell] === TILE_LAVA) spawn(v, AMB_SMOKE, cellX(s, cell, v), cellY(s, cell, v), 0.05, -0.25, 90, COLOR_SMOKE, now)
    } else if (area === AREA_SALTREACH && random(v) < 0.1 * thin) {
      const cell = randomTile(v, s)
      if (cell >= 0 && s.tiles[cell] === TILE_WATER) spawn(v, AMB_SPLASH, cellX(s, cell, v), cellY(s, cell, v), 0, 0, 30, C_PALE, now)
    }
    spawnObjectSparkles(v, s, now, thin)
    if (outdoor) spawnLandmarks(v, s, now, thin)
    updateBirds(v, s, outdoor, thin)
  }
  if (steps > 0) spawnSteps(v, s, s.tick)
}

const PX = 1 / ART

function px(v: View, color: number, alpha: number, x: number, y: number, w: number, h: number): void {
  v.ctx.globalAlpha = alpha
  v.ctx.fillStyle = HEX[color]!
  v.ctx.fillRect(snap(x), snap(y), w * PX, h * PX)
}

function ringDots(v: View, color: number, alpha: number, x: number, y: number, r: number): void {
  px(v, color, alpha, x - r, y, 1, 1)
  px(v, color, alpha, x + r, y, 1, 1)
  px(v, color, alpha * 0.8, x - r * 0.7, y - r * 0.35, 1, 1)
  px(v, color, alpha * 0.8, x + r * 0.7, y - r * 0.35, 1, 1)
  px(v, color, alpha * 0.8, x - r * 0.7, y + r * 0.35, 1, 1)
  px(v, color, alpha * 0.8, x + r * 0.7, y + r * 0.35, 1, 1)
  if (r > 1.5) {
    px(v, color, alpha * 0.6, x, y - r * 0.5, 1, 1)
    px(v, color, alpha * 0.6, x, y + r * 0.5, 1, 1)
  }
}

function tumble(v: View, color: number, dark: number, alpha: number, x: number, y: number, phase: number): void {
  if (phase === 0) px(v, color, alpha, x, y, 2, 1)
  else if (phase === 1) {
    px(v, color, alpha, x, y, 1, 1)
    px(v, dark, alpha, x + PX, y + PX, 1, 1)
  } else if (phase === 2) px(v, color, alpha, x, y, 1, 2)
  else px(v, dark, alpha, x, y, 1, 1)
}

function drawPool(v: View, t: number): void {
  const ox = v.originX
  const oy = v.originY
  for (let i = 0; i < AMB_CAP; i++) {
    const kind = v.ambKind[i]!
    if (kind === AMB_NONE) continue
    const age = t - v.ambBirth[i]!
    const life = v.ambLife[i]!
    if (age >= life) {
      v.ambKind[i] = AMB_NONE
      continue
    }
    if (age < 0) continue
    const p = age / life
    const fade = p < 0.15 ? p / 0.15 : p > 0.75 ? (1 - p) / 0.25 : 1
    let x = v.ambX[i]! + v.ambVx[i]! * age - ox
    let y = v.ambY[i]! + v.ambVy[i]! * age - oy
    if (x < -20 || y < -40 || x > v.width + 20 || y > v.height + 20) continue
    const color = v.ambColor[i]!
    if (kind === AMB_MOTE) {
      x += Math.sin(age * 0.03 + i) * 3
      px(v, color, fade * (0.5 + 0.3 * Math.sin(age * 0.1 + i)), x, y, 1, 1)
    } else if (kind === AMB_EMBER) {
      x += Math.sin(age * 0.08 + i) * 2
      const hot = p < 0.3 ? C_GOLD_PALE : p < 0.62 ? C_GOLD : C_EMBER
      px(v, hot, fade, x, y, 1, 1)
      px(v, p < 0.5 ? C_GOLD : C_RED, fade * 0.45, x, y + PX, 1, 1)
    } else if (kind === AMB_LEAF || kind === AMB_PETAL) {
      x += Math.sin(age * 0.06 + i) * 4
      tumble(v, color, kind === AMB_LEAF ? COLOR_LEAF_DARK : C_WHITE, fade * 0.95, x, y, ((age / 7 + i) | 0) & 3)
    } else if (kind === AMB_DUST) {
      px(v, color, (1 - p) * 0.7, x, y, p < 0.4 ? 2 : 1, 1)
      if (p < 0.5) px(v, color, (1 - p) * 0.4, x + PX * (v.ambVx[i]! < 0 ? -1 : 2), y - PX, 1, 1)
    } else if (kind === AMB_SPLASH || kind === AMB_BUBBLE) {
      if (kind === AMB_BUBBLE && p < 0.7) {
        x += Math.sin(age * 0.2 + i) * 0.5
        px(v, color, 0.65, x, y, 1, 1)
        px(v, C_WHITE, 0.5, x - PX, y - PX, 1, 1)
      } else {
        const q = kind === AMB_BUBBLE ? (p - 0.7) / 0.3 : p
        if (q < 0.15) px(v, color, 0.8, x, y - 1 - q * 8, 1, 2)
        ringDots(v, color, (1 - q) * 0.75, x, y, 0.5 + q * 3)
      }
    } else if (kind === AMB_DRIP) {
      if (p < 0.45) px(v, color, 0.75, x, y - 14 + (p / 0.45) * 14, 1, 3)
      else ringDots(v, color, (1 - p) * 1.2, x, y, 0.5 + (p - 0.45) * 5)
    } else if (kind === AMB_FIREFLY) {
      x += Math.sin(age * 0.023 + i * 1.7) * 9
      y += Math.sin(age * 0.031 + i) * 5
      const glow = fade * (0.55 + 0.45 * Math.sin(age * 0.09 + i))
      px(v, color, glow * 0.1, x - 2 * PX, y - 2 * PX, 5, 5)
      px(v, color, glow * 0.25, x - PX, y - PX, 3, 3)
      px(v, glow > 0.8 ? C_WHITE : color, glow, x, y, 1, 1)
    } else if (kind === AMB_SMOKE) {
      x += Math.sin(age * 0.04 + i) * 2 + age * v.wind * 0.1
      const size = 3 + ((p * 7) | 0)
      px(v, color, (1 - p) * 0.26, x - size * PX * 0.5, y, size, size - 1)
    } else if (kind === AMB_BUTTERFLY) {
      x += Math.sin(age * 0.05 + i) * 10 - v.ambVx[i]! * age * 0.6
      y += Math.sin(age * 0.11 + i * 2) * 4 - 6
      const open = ((age / 4) | 0) & 1
      px(v, color, fade, x - (open ? 2 : 1) * PX, y - PX, open ? 2 : 1, open ? 2 : 1)
      px(v, color, fade, x + PX, y - PX, open ? 2 : 1, open ? 2 : 1)
      px(v, COLOR_BIRD, fade, x, y - PX, 1, 2)
    } else if (kind === AMB_GLINT) {
      const a = p < 0.5 ? p * 2 : (1 - p) * 2
      px(v, color, a, x, y, 1, 1)
      if (a > 0.5) {
        px(v, color, a * 0.6, x - 2 * PX, y, 5, 1)
        px(v, color, a * 0.6, x, y - 2 * PX, 1, 5)
      }
    }
  }
}

function drawBirds(v: View, t: number): void {
  for (let i = 0; i < BIRD_CAP; i++) {
    const state = v.birdState[i]!
    if (state === 0) continue
    const x = snap(v.birdX[i]! - v.originX)
    const y = snap(v.birdY[i]! - v.originY)
    if (state === 1) {
      const peck = ((t - v.birdT[i]!) / 25 | 0) % 5 === 0 ? 1 : 0
      px(v, COLOR_BIRD, 1, x - 2 * PX, y - 3 * PX, 5, 3)
      px(v, COLOR_BIRD_BELLY, 1, x - PX, y - PX, 3, 1)
      px(v, COLOR_BIRD, 1, x + 2 * PX, y - (5 - peck * 2) * PX, 2, 2)
      px(v, COLOR_BIRD_BELLY, 1, x + 4 * PX, y - (4 - peck * 2) * PX, 1, 1)
      px(v, COLOR_BIRD, 1, x - 3 * PX, y - 4 * PX, 2, 1)
    } else {
      const flap = ((t / 4 + i) | 0) & 1
      px(v, COLOR_BIRD, 1, x - PX, y, 3, 2)
      px(v, COLOR_BIRD, 1, x - 4 * PX, y - (flap ? 2 : -1) * PX, 3, 1)
      px(v, COLOR_BIRD, 1, x + 2 * PX, y - (flap ? 2 : -1) * PX, 3, 1)
      px(v, COLOR_BIRD, 1, x - 5 * PX, y - (flap ? 3 : -2) * PX, 1, 1)
      px(v, COLOR_BIRD, 1, x + 5 * PX, y - (flap ? 3 : -2) * PX, 1, 1)
    }
  }
}

function drawRain(v: View, t: number, amount: number): void {
  const count = (RAIN_DROPS * amount * (v.reducedMotion ? 0.1 : 1)) | 0
  const w = v.width + 60
  const h = v.height + 40
  const fall = v.reducedMotion ? 0 : t
  for (let i = 0; i < count; i++) {
    const speed = 4 + hashf(i, 3) * 1.5
    const x = wrap(hashf(i, 1) * w - fall * 1.1 - v.originX * 0.2, w) - 30
    const y = wrap(hashf(i, 2) * h + fall * speed, h) - 20
    const a = 0.3 + hashf(i, 4) * 0.3
    px(v, COLOR_RAIN, a, x, y, 1, 3)
    px(v, COLOR_RAIN, a * 0.7, x - PX, y + 3 * PX, 1, 3)
  }
  const splashes = (SPLASHES * amount * (v.reducedMotion ? 0.1 : 1)) | 0
  for (let i = 0; i < splashes; i++) {
    const clock = fall + i * 13
    const cycle = (clock / SPLASH_PERIOD) | 0
    const p = (clock - cycle * SPLASH_PERIOD) / SPLASH_PERIOD
    if (p > 0.5) continue
    const x = hashf(i, cycle) * v.width
    const y = hashf(i, cycle + 9999) * v.height
    const a = (0.5 - p) * 1.4
    ringDots(v, COLOR_RAIN, a, x, y, 0.5 + p * 6)
    if (p < 0.2) {
      px(v, COLOR_RAIN, a, x - PX - p * 6, y - 1 - p * 8, 1, 1)
      px(v, COLOR_RAIN, a, x + PX + p * 6, y - 1 - p * 8, 1, 1)
    }
  }
}

function drawAsh(v: View, t: number): void {
  const count = (ASH_FLAKES * (v.reducedMotion ? 0.1 : 1)) | 0
  const w = v.width + 20
  const h = v.height + 20
  const fall = v.reducedMotion ? 0 : t
  for (let i = 0; i < count; i++) {
    const x = wrap(hashf(i, 5) * w + fall * 0.2 + Math.sin(fall * 0.02 + i) * 6 - v.originX * 0.5, w) - 10
    const y = wrap(hashf(i, 6) * h + fall * (0.25 + hashf(i, 7) * 0.2) - v.originY * 0.5, h) - 10
    const ember = i % 9 === 0
    px(v, ember ? (((fall / 9 + i) | 0) & 1 ? C_EMBER : C_GOLD) : COLOR_ASH, ember ? 0.85 : 0.55, x, y, i % 4 === 0 && !ember ? 2 : 1, 1)
  }
}

function drawMist(v: View, t: number, amount: number): void {
  const drift = v.reducedMotion ? 0 : t * 0.08
  v.ctx.fillStyle = HEX[COLOR_MIST]!
  v.ctx.globalAlpha = amount * 0.05
  for (let k = 0; k < 6; k++) {
    const bandY = wrap(hashf(k, 11) * v.height * 1.3 - v.originY * 0.3, v.height + 40) - 20
    const bandW = v.width * (0.5 + hashf(k, 12) * 0.5)
    const x = wrap(hashf(k, 13) * v.width + drift * (0.6 + hashf(k, 14)) - v.originX * 0.3, v.width + bandW) - bandW
    for (let j = 0; j < 4; j++) v.ctx.fillRect(snap(x + j * 10), snap(bandY + j * 4 - 6), bandW - j * 20, 22 - j * 5)
  }
}

function drawStreaks(v: View, t: number, amount: number): void {
  if (v.reducedMotion) return
  for (let i = 0; i < STREAKS; i++) {
    const len = 12 + ((hashf(i, 21) * 20) | 0)
    const x = wrap(hashf(i, 22) * v.width * 2 + t * (3 + hashf(i, 23) * 2), v.width * 2) - v.width * 0.5
    const y = wrap(hashf(i, 24) * v.height - v.originY * 0.4, v.height)
    px(v, C_PALE, amount * 0.22, x, y, len, 1)
    px(v, C_PALE, amount * 0.12, x + len * PX * 0.3, y - PX, len >> 1, 1)
  }
}

function drawSmoke(v: View, t: number): void {
  for (let k = 0; k < v.smokeCount; k++) {
    const scale = v.smokeScale[k]!
    const color = v.smokeColor[k]!
    const puffs = 7 * scale
    for (let j = 0; j < puffs; j++) {
      const phase = wrap(t * 0.35 + (j * 60) / puffs + k * 7, 60) / 60
      const x = v.smokeX[k]! - v.originX + phase * 14 * scale * (0.3 + v.wind) + Math.sin(t * 0.03 + j) * 1.5 * scale
      const y = v.smokeY[k]! - v.originY - phase * 28 * scale
      const size = (3 + ((phase * 8) | 0)) * scale
      px(v, color, (1 - phase) * 0.5, x - size * PX * 0.5, y, size, size - 1)
      if (phase < 0.5) px(v, C_WHITE, (0.5 - phase) * 0.4, x - size * PX * 0.5 + PX, y, size >> 1, 1)
    }
  }
}

function drawFishRings(v: View, s: State, t: number): void {
  for (let i = 0; i < 4; i++) {
    const clock = t + i * 97
    const cycle = (clock / 220) | 0
    const p = (clock - cycle * 220) / 60
    if (p > 1) continue
    const wx = v.originX + hashf(i, cycle + 31) * v.width
    const wy = v.originY + hashf(i, cycle + 77) * v.height
    if (tileAt(s, Math.floor(wx / TILE), Math.floor(wy / TILE)) !== TILE_WATER) continue
    ringDots(v, C_PALE, (1 - p) * 0.6, wx - v.originX, wy - v.originY, 1 + p * 5)
    if (p > 0.3) ringDots(v, C_PALE, (1 - p) * 0.35, wx - v.originX, wy - v.originY, (p - 0.3) * 5)
  }
}

export function drawAmbientLow(v: View, s: State, t: number): void {
  if (AREA_OUTDOOR[s.area]! !== 0 && !v.reducedMotion) drawFishRings(v, s, t)
  v.ctx.globalAlpha = 1
}

export function drawAmbient(v: View, s: State, t: number): void {
  drawSmoke(v, t)
  drawPool(v, t)
  drawBirds(v, t)
  if (v.rain > 0.01) drawRain(v, t, v.rain)
  if (v.ash > 0) drawAsh(v, t)
  if (v.mist > 0.01) drawMist(v, t, v.mist)
  if (s.area === AREA_VELLIN || v.wind > 0.8) drawStreaks(v, t, s.area === AREA_VELLIN ? 1 : v.wind - 0.8)
  v.ctx.globalAlpha = 1
}
