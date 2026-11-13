import { mkdirSync, writeFileSync } from 'node:fs'
import { crc32, deflateSync } from 'node:zlib'
import { layoutView, pickScale, rpgAtlas } from '../src/rpg/render/renderer.ts'
import { createView } from '../src/rpg/render/view.ts'
import { drawFrame } from '../src/rpg/render/renderer.hot.ts'
import { createState } from '../src/rpg/sim/state.ts'
import { newGame } from '../src/rpg/sim/game.ts'
import { blocksWalk, loadArea } from '../src/rpg/sim/world.hot.ts'
import { step, command } from '../src/rpg/sim/step.hot.ts'
import { AREAS } from '../src/rpg/sim/areas.ts'
import { emit } from '../src/rpg/sim/events.hot.ts'
import * as C from '../src/rpg/sim/content.ts'
import { WEATHER_FADE, WEATHER_SPAN, weatherFor } from '../src/rpg/render/ambient.ts'
import { ART } from '../src/rpg/render/art.ts'
import { HERO_DEFS } from '../src/rpg/render/sheet-hero.ts'
import { FOES_DEFS } from '../src/rpg/render/sheet-foes.ts'
import { WORLD_DEFS } from '../src/rpg/render/sheet-world.ts'
import { fontFrames, fontGlyphs } from '../src/game/sprites/font.ts'

const [out, scene = 'tiles:0', widthArg = '320', heightArg = '208', upscaleArg = '3'] = process.argv.slice(2)
if (!out) {
  console.error('usage: node scripts/rpg-frame-preview.mjs <out.png> [scene] [cssWidth=320] [cssHeight=208] [upscale=3]')
  console.error('       node scripts/rpg-frame-preview.mjs tour <outDir> [filter]')
  console.error('scenes: tiles:<tileset 0-6> combat elite bosses varek:<phase> stance:<element> night vigil corrupted hud')
  console.error('env: FX_AGE=<ticks after the events> CLOCK=<ticks> CHAPTER=<n> REDUCED=1 TOUCH=1 FOCUS=<n>')
  console.error('     PRIMS=sim rasterises ellipses, arcs and lines on the sim grid, as the 1x renderer did (for equivalence checks)')
  console.error('tour env: WEATHER=<0 clear 1 breezy 2 rain 3 mist> WARM=<frames to settle ambience> ZONES=0')
  console.error('       node scripts/rpg-frame-preview.mjs atlas <out.png> [top] [rows]')
  console.error('       node scripts/rpg-frame-preview.mjs sheet <out.png> <hero|foes|world> [upscale=3]   every frame of one owner, labelled sprite name and frame index, L = still legacy 1x art')
  process.exit(1)
}
const atlas = rpgAtlas()
let cssWidth = 0
let cssHeight = 0
let scale = 1
let width = 1
let height = 1
let frame = new Uint8Array(4)
let clip = [0, 0, 1, 1]

const SIM_PRIMS = process.env.PRIMS === 'sim'

function blend(x, y, r, g, b, a) {
  if (x < clip[0] || y < clip[1] || x >= clip[2] || y >= clip[3] || a <= 0) return
  const i = (y * width + x) * 4
  frame[i] += (r - frame[i]) * a
  frame[i + 1] += (g - frame[i + 1]) * a
  frame[i + 2] += (b - frame[i + 2]) * a
  frame[i + 3] = 255
}

function rgb(style) {
  const n = parseInt(style.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function inSweep(angle, a0, a1) {
  if (a1 - a0 >= Math.PI * 2 - 1e-6) return true
  const tau = Math.PI * 2
  const from = ((a0 % tau) + tau) % tau
  const at = ((angle % tau) + tau) % tau
  return ((at - from + tau) % tau) <= a1 - a0
}

function blendCell(x, y, r, g, b, a, k) {
  for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) blend(x * k + i, y * k + j, r, g, b, a)
}

const softwareContext = {
  k: 1,
  fillStyle: '#000000',
  strokeStyle: '#000000',
  globalAlpha: 1,
  lineWidth: 1,
  imageSmoothingEnabled: false,
  path: [],
  stack: [],
  setTransform(a, b, c, d, e, f) {
    if (a !== d || b || c || e || f) throw new Error('software canvas only supports a uniform scale')
    this.k = a
  },
  save() {
    this.stack.push({ clip, fillStyle: this.fillStyle, strokeStyle: this.strokeStyle, globalAlpha: this.globalAlpha, lineWidth: this.lineWidth })
  },
  restore() {
    const top = this.stack.pop()
    if (!top) return
    clip = top.clip
    this.fillStyle = top.fillStyle
    this.strokeStyle = top.strokeStyle
    this.globalAlpha = top.globalAlpha
    this.lineWidth = top.lineWidth
  },
  rect(x, y, w, h) {
    const k = this.k
    this.path.push({ rect: [Math.round(x * k), Math.round(y * k), Math.round((x + w) * k), Math.round((y + h) * k)] })
  },
  clip() {
    for (const e of this.path) {
      if (!e.rect) continue
      clip = [Math.max(clip[0], e.rect[0]), Math.max(clip[1], e.rect[1]), Math.min(clip[2], e.rect[2]), Math.min(clip[3], e.rect[3])]
    }
  },
  draws: 0,
  drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
    this.draws++
    const k = this.k
    dx *= k
    dy *= k
    dw = Math.round(dw * k)
    dh = Math.round(dh * k)
    const kx = dw / sw
    const ky = dh / sh
    for (let y = 0; y < dh; y++) {
      for (let x = 0; x < dw; x++) {
        const i = ((sy + Math.floor(y / ky)) * image.width + sx + Math.floor(x / kx)) * 4
        blend(Math.round(dx) + x, Math.round(dy) + y, image.pixels[i], image.pixels[i + 1], image.pixels[i + 2], (image.pixels[i + 3] / 255) * this.globalAlpha)
      }
    }
  },
  fillRect(x, y, w, h) {
    const [r, g, b] = rgb(this.fillStyle)
    const k = this.k
    for (let py = Math.round(y * k); py < Math.round((y + h) * k); py++) {
      for (let px = Math.round(x * k); px < Math.round((x + w) * k); px++) blend(px, py, r, g, b, this.globalAlpha)
    }
  },
  beginPath() {
    this.path = []
  },
  moveTo(x, y) {
    const k = SIM_PRIMS ? 1 : this.k
    this.path.push({ move: [x * k, y * k] })
  },
  lineTo(x, y) {
    const k = SIM_PRIMS ? 1 : this.k
    const last = this.path[this.path.length - 1]
    const from = last?.move ?? last?.line?.slice(2)
    if (from) this.path.push({ line: [from[0], from[1], x * k, y * k] })
  },
  arc(x, y, radius, a0, a1) {
    const k = SIM_PRIMS ? 1 : this.k
    this.path.push({ x: x * k, y: y * k, rx: radius * k, ry: radius * k, a0, a1 })
  },
  ellipse(x, y, rx, ry, rotation, a0, a1) {
    const k = SIM_PRIMS ? 1 : this.k
    this.path.push({ x: x * k, y: y * k, rx: rx * k, ry: ry * k, a0, a1 })
  },
  stroke() {
    const [r, g, b] = rgb(this.strokeStyle)
    const cell = SIM_PRIMS ? this.k : 1
    const lineWidth = SIM_PRIMS ? this.lineWidth : this.lineWidth * this.k
    const seen = new Set()
    for (const e of this.path) {
      if (e.line) {
        const [x0, y0, x1, y1] = e.line
        const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))))
        for (let i = 0; i <= steps; i++) {
          const px = Math.floor(x0 + ((x1 - x0) * i) / steps)
          const py = Math.floor(y0 + ((y1 - y0) * i) / steps)
          if (seen.has(py * 100000 + px)) continue
          seen.add(py * 100000 + px)
          blendCell(px, py, r, g, b, this.globalAlpha, cell)
        }
        continue
      }
      if (e.rect || e.move) continue
      for (let w = 0; w < Math.max(1, Math.round(lineWidth)); w++) {
        const grow = w - (Math.max(1, Math.round(lineWidth)) - 1) / 2
        const rx = e.rx + grow
        const ry = e.ry + grow
        const steps = Math.max(8, Math.ceil(Math.max(rx, ry) * Math.abs(e.a1 - e.a0) * 1.5))
        for (let i = 0; i <= steps; i++) {
          const angle = e.a0 + ((e.a1 - e.a0) * i) / steps
          const px = Math.round(e.x + Math.cos(angle) * rx)
          const py = Math.round(e.y + Math.sin(angle) * ry)
          if (seen.has(py * 100000 + px)) continue
          seen.add(py * 100000 + px)
          blendCell(px, py, r, g, b, this.globalAlpha, cell)
        }
      }
    }
  },
  fill() {
    const [r, g, b] = rgb(this.fillStyle)
    const cell = SIM_PRIMS ? this.k : 1
    for (const e of this.path) {
      if (e.rect || e.move || e.line) continue
      for (let py = Math.floor(e.y - e.ry); py <= Math.ceil(e.y + e.ry); py++) {
        for (let px = Math.floor(e.x - e.rx); px <= Math.ceil(e.x + e.rx); px++) {
          const nx = (px - e.x) / e.rx
          const ny = (py - e.y) / e.ry
          if (nx * nx + ny * ny <= 1 && inSweep(Math.atan2(ny, nx), e.a0, e.a1)) blendCell(px, py, r, g, b, this.globalAlpha, cell)
        }
      }
    }
  },
}


const view = createView(softwareContext, atlas, atlas)

function configure(w, h, touch) {
  cssWidth = w
  cssHeight = h
  scale = pickScale(w, h)
  view.width = Math.ceil(w / scale)
  view.height = Math.ceil(h / scale)
  width = view.width * ART
  height = view.height * ART
  frame = new Uint8Array(width * height * 4)
  clip = [0, 0, width, height]
  softwareContext.setTransform(ART, 0, 0, ART, 0, 0)
  layoutView(view, w, h, scale, touch)
  view.reducedMotion = process.env.REDUCED === '1'
}

let s = createState()
const T = C.TILE

function legacyScene() {
  configure(Number(widthArg), Number(heightArg), process.env.TOUCH === '1')
  const AREA_FOR_TILESET = [C.AREA_VALDMERE, C.AREA_BARROW, C.AREA_SALTREACH, C.AREA_ASHFORGE, C.AREA_VELLIN, C.AREA_CITADEL, C.AREA_SHRINE]

  function map(w, h, fill, border = C.TILE_WALL) {
    s.mapW = w
    s.mapH = h
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) s.tiles[y * w + x] = x === 0 || y === 0 || x === w - 1 || y === h - 1 ? border : fill
  }
  function tile(x, y, kind) { s.tiles[y * s.mapW + x] = kind }
  function block(x, y, w, h, kind) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) tile(x + i, y + j, kind) }
  function player(tx, ty, face = 256) {
    s.playerX = s.playerPrevX = tx * T + 8
    s.playerY = s.playerPrevY = ty * T + 8
    s.playerFace = face
  }
  let objCount = 0
  function object(kind, tx, ty, state = 0, arg = 0, data = 0) {
    const i = objCount++
    s.objKind[i] = kind
    s.objState[i] = state
    s.objX[i] = tx * T + 8
    s.objY[i] = ty * T + 8
    s.objArg[i] = arg
    s.objData[i] = data
    return i
  }
  let enemyCount = 0
  function enemy(kind, x, y, opts = {}) {
    const i = enemyCount++
    s.eAlive[i] = 1
    s.eKind[i] = kind
    s.eX[i] = s.ePrevX[i] = x
    s.eY[i] = s.ePrevY[i] = y
    s.eFace[i] = opts.face ?? 512
    s.eState[i] = opts.state ?? C.AI_IDLE
    s.eElite[i] = opts.elite ?? 0
    s.eMaxHp[i] = opts.max ?? 100
    s.eHp[i] = opts.hp ?? s.eMaxHp[i]
    s.eFlashUntil[i] = opts.flash ? s.tick + 10 : 0
    s.eBurn[i] = opts.burn ? 60 : 0
    s.eChill[i] = opts.chill ? 60 : 0
    if (opts.moving) s.ePrevX[i] = x - 1
    return i
  }
  let projCount = 0
  function projectile(kind, x, y, vx, vy) {
    const i = projCount++
    s.prAlive[i] = 1
    s.prKind[i] = kind
    s.prX[i] = x
    s.prY[i] = y
    s.prPrevX[i] = x - vx
    s.prPrevY[i] = y - vy
    s.prVx[i] = vx
    s.prVy[i] = vy
  }

  s.tick = 600
  s.areaTick = 600
  s.hp = 72
  s.stamina = 60
  s.focus = 45
  s.stancesUnlocked = 15
  s.stance = C.ELEMENT_TIDE
  s.guideX = C.GUIDE_NONE
  s.guideY = C.GUIDE_NONE

  const [name, argText] = scene.split(':')
  const arg = Number(argText ?? 0)
  const events = []

  if (name === 'tiles') {
    s.area = AREA_FOR_TILESET[arg]
    map(30, 18, C.TILE_FLOOR)
    const kinds = []
    for (let k = 0; k < C.TILE_COUNT; k++) if (k !== C.TILE_FLOOR) kinds.push(k)
    kinds.forEach((kind, n) => block(2 + (n % 9) * 3, 2 + Math.floor(n / 9) * 3, 2, 2, kind))
    block(2, 11, 4, 1, C.TILE_WALL)
    tile(3, 11, C.TILE_DOOR)
    tile(5, 11, C.TILE_GATE_OPEN)
    const objects = [C.OBJ_EXIT, C.OBJ_NPC, C.OBJ_CHEST, C.OBJ_WAYSTONE, C.OBJ_FORGE, C.OBJ_WINDMILL, C.OBJ_SWITCH, C.OBJ_GRAPPLE, C.OBJ_PEDESTAL, C.OBJ_KEY, C.OBJ_SHRINE, C.OBJ_HORSE, C.OBJ_LOOT]
    objects.forEach((kind, n) => {
      object(kind, 8 + n * 1.6, 13.5, 0, kind === C.OBJ_KEY ? C.KEY_LONGBOW : n % 4, 3)
      object(kind, 8 + n * 1.6, 16, 1, kind === C.OBJ_LOOT ? C.LOOT_ITEM : kind === C.OBJ_KEY ? C.KEY_WARHAMMER : (n + 1) % 4, 4)
    })
    player(15, 9)
    s.stancesUnlocked = 0
  } else if (name === 'combat' || name === 'elite') {
    s.area = C.AREA_BARROW
    map(26, 16, C.TILE_FLOOR)
    block(6, 3, 3, 1, C.TILE_WALL)
    player(12, 8, 0)
    s.playerState = C.PL_ATTACK
    s.playerTimer = 9
    s.statTwoHanded = 0
    const elite = name === 'elite' ? 1 : 0
    for (let k = 0; k < 8; k++) {
      const x = 3 * T + k * 26
      enemy(k, x, 5 * T + 8, { elite, state: k % 3 === 0 ? C.AI_WINDUP : C.AI_CHASE, moving: k % 2 === 0, face: k % 2 ? 0 : 512, hp: k === 1 ? 40 : undefined })
    }
    enemy(C.ENEMY_FOOTMAN, 9 * T, 11 * T, { flash: 1, hp: 60, elite })
    enemy(C.ENEMY_KNIGHT, 11 * T, 12 * T, { burn: 1, elite })
    enemy(C.ENEMY_WIGHT, 14 * T, 11 * T, { chill: 1, elite })
    const air = enemy(C.ENEMY_FOOTMAN, 16 * T, 10 * T, { state: C.AI_AIR, elite })
    s.eTimer[air] = 6
    s.lockTarget = air
    const kinds = [C.PROJ_ARROW, C.PROJ_PLAYER_ARROW, C.PROJ_BOLT, C.PROJ_WAVE, C.PROJ_EMBER, C.PROJ_TIDE]
    kinds.forEach((kind, n) => projectile(kind, 6 * T + n * 22, 13 * T + 8, Math.cos(n) * 2, Math.sin(n) * 2))
    events.push([C.EV_SWING, C.ELEMENT_TIDE, 0, s.playerX, s.playerY], [C.EV_HIT, air, 34, 16 * T, 10 * T], [C.EV_HIT, 0, 12, 9 * T, 11 * T])
    s.guideX = 40 * T
    s.guideY = 2 * T
  } else if (name === 'bosses') {
    s.area = C.AREA_CITADEL
    map(26, 16, C.TILE_FLOOR)
    player(13, 12, 768)
    const kinds = [C.BOSS_BARROW_KING, C.BOSS_DROWNED_ABBOT, C.BOSS_FORGEMASTER, C.BOSS_STORM_ABBESS, C.BOSS_VAREK]
    kinds.forEach((kind, n) => enemy(kind, 3 * T + n * 52, 6 * T, { state: n === 1 ? C.AI_WINDUP : C.AI_IDLE, hp: 300, max: 500, elite: n === 3 ? 1 : 0 }))
  } else if (name === 'varek') {
    s.area = C.AREA_CITADEL
    map(20, 14, C.TILE_FLOOR)
    for (let x = 3; x < 17; x += 4) tile(x, 3, C.TILE_PILLAR_RAISED)
    player(10, 10, 768)
    s.bossPhase = arg
    const i = enemy(C.BOSS_VAREK, 10 * T + 8, 6 * T, { hp: 700 - arg * 200, max: 900, state: C.AI_WINDUP })
    s.lockTarget = i
    events.push([C.EV_TELEGRAPH, i, 0, 10 * T + 8, 6 * T])
  } else if (name === 'stance') {
    s.area = arg === C.ELEMENT_EMBER ? C.AREA_ASHFORGE : arg === C.ELEMENT_GALE ? C.AREA_VELLIN : arg === C.ELEMENT_TIDE ? C.AREA_SALTREACH : C.AREA_BARROW
    map(22, 14, C.TILE_FLOOR)
    player(10, 7, 0)
    s.stance = arg
    s.heat = arg === C.ELEMENT_EMBER ? 80 : 0
    s.statTwoHanded = arg % 2
    s.playerState = C.PL_SKILL
    s.playerTimer = 3
    for (let k = 0; k < 3; k++) enemy(k, 13 * T + k * 10, 6 * T + k * 14, { flash: k === 0 })
    events.push([C.EV_SKILL, arg, 0, s.playerX, s.playerY], [C.EV_SWING, arg, 1, s.playerX, s.playerY], [C.EV_FINISHER, arg, 0, 13 * T, 7 * T], [C.EV_PERFECT_BLOCK, 0, 0, s.playerX + 6, s.playerY])
  } else if (name === 'night' || name === 'vigil' || name === 'hud') {
    s.area = C.AREA_VALDMERE
    map(40, 24, C.TILE_GRASS, C.TILE_TREE)
    block(0, 11, 40, 2, C.TILE_ROAD)
    block(6, 3, 5, 3, C.TILE_HOUSE)
    block(26, 4, 8, 4, C.TILE_WATER)
    block(29, 4, 2, 4, C.TILE_BRIDGE)
    for (let k = 0; k < 14; k++) tile(2 + ((k * 7) % 36), 15 + (k % 6), k % 3 ? C.TILE_TREE : C.TILE_ROCK)
    player(16, 11, 0)
    object(C.OBJ_HORSE, 19, 12)
    object(C.OBJ_WAYSTONE, 13, 9, 1)
    const npc = object(C.OBJ_NPC, 12, 13, 0, C.NPC_MAREN)
    s.interactObj = npc
    s.clock = name === 'night' ? C.NIGHT_START_TICKS + 3000 : 0
    if (name === 'vigil') s.chapter = C.CH_EMBER
    s.guideX = 2 * T
    s.guideY = 30 * T
    s.stance = C.ELEMENT_EMBER
    s.heat = 70
    s.playerState = C.PL_IDLE
    s.playerPrevX = s.playerX - 1
    if (name === 'hud') {
      const boss = enemy(C.BOSS_FORGEMASTER, 22 * T, 9 * T, { hp: 260, max: 600 })
      s.lockTarget = boss
    }
  } else if (name === 'pose') {
    s.area = C.AREA_BRENNHOLD
    map(12, 12, C.TILE_FLOOR, C.TILE_FLOOR)
    player(6, 6, 0)
    s.stancesUnlocked = 0
    s.statTwoHanded = arg
    s.playerState = C.PL_IDLE
  } else if (name === 'corrupted') {
    s.area = C.AREA_SALTREACH
    s.areaVariant = 1
    s.chapter = C.CH_EMBER
    map(24, 14, C.TILE_FLOOR)
    block(3, 8, 6, 4, C.TILE_WATER)
    block(5, 8, 2, 4, C.TILE_ICE)
    block(14, 3, 1, 8, C.TILE_PILLAR_SUNK)
    block(16, 3, 1, 8, C.TILE_PILLAR_RAISED)
    player(11, 7, 512)
    s.playerState = C.PL_GUARD
    for (let k = 0; k < 4; k++) enemy([C.ENEMY_DROWNED, C.ENEMY_WIGHT, C.BOSS_DROWNED_ABBOT, C.ENEMY_ARCHER][k], (4 + k * 4) * T, 4 * T, { elite: 1 })
    object(C.OBJ_CHEST, 19, 11)
  }

  if (process.env.CLOCK) s.clock = Number(process.env.CLOCK)
  if (process.env.CHAPTER) s.chapter = Number(process.env.CHAPTER)
  if (process.env.STATE) s.playerState = Number(process.env.STATE)
  if (process.env.TIMER) s.playerTimer = Number(process.env.TIMER)
  if (process.env.FACE) s.playerFace = Number(process.env.FACE)
  if (process.env.FOCUS) s.focus = Number(process.env.FOCUS)

  for (let n = 0; n < 8; n++) drawFrame(view, s, 1)
  for (const [type, a, b, x, y] of events) emit(s, type, a, b, x, y)
  if (events.length > 0) {
    drawFrame(view, s, 1)
    s.tick += Number(process.env.FX_AGE ?? 6)
  }
  softwareContext.draws = 0
  drawFrame(view, s, 1)
  const drawCalls = softwareContext.draws


  writePng(out, Number(upscaleArg))
  console.log(`${out}: scene ${scene} ${width}x${height} game px at scale ${scale}, drawImage ${drawCalls}`)
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data])
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const sum = Buffer.alloc(4)
  sum.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, sum])
}

function writePng(file, upscale) {
  const W = width * upscale
  const H = height * upscale
  const raw = Buffer.alloc((W * 4 + 1) * H)
  for (let y = 0; y < H; y++) {
    const row = y * (W * 4 + 1)
    for (let x = 0; x < W; x++) {
      const from = (Math.floor(y / upscale) * width + Math.floor(x / upscale)) * 4
      raw.set(frame.subarray(from, from + 3), row + 1 + x * 4)
      raw[row + 4 + x * 4] = 255
    }
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(W, 0)
  header.writeUInt32BE(H, 4)
  header.set([8, 6, 0, 0, 0], 8)
  writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]))
}

const STANCES_BY_CHAPTER = [0, 1, 1, 1, 3, 3, 7, 15, 15, 15, 15]
const KEYS_BY_CHAPTER = [0, 0, 0, 1, 3, 3, 7, 7, 7, 7, 7]
const TOUR = [
  { name: 'brennhold', area: C.AREA_BRENNHOLD, chapter: C.CH_RAID },
  { name: 'brennhold-night', area: C.AREA_BRENNHOLD, chapter: C.CH_BARROW, clock: C.NIGHT_START_TICKS + 4000, focus: ['spawn', 'forge'] },
  { name: 'brennhold-vigil', area: C.AREA_BRENNHOLD, chapter: C.CH_EMBER, focus: ['spawn', 'forge'] },
  { name: 'valdmere', area: C.AREA_VALDMERE, chapter: C.CH_BARROW },
  { name: 'valdmere-night', area: C.AREA_VALDMERE, chapter: C.CH_BARROW, clock: C.NIGHT_START_TICKS + 4000, focus: ['spawn', 'waystone', 'shrine'] },
  { name: 'valdmere-vigil', area: C.AREA_VALDMERE, chapter: C.CH_GALE, focus: ['spawn', 'seal', 'gate', 'chasm'] },
  { name: 'valdmere-landmark', area: C.AREA_VALDMERE, chapter: C.CH_GALE, landmarks: true },
  { name: 'valdmere-landmark-night', area: C.AREA_VALDMERE, chapter: C.CH_GALE, clock: C.NIGHT_START_TICKS + 4000, landmarks: true, focus: ['near4', 'near5'] },
  { name: 'barrow', area: C.AREA_BARROW, chapter: C.CH_BARROW },
  { name: 'barrow-corrupt', area: C.AREA_BARROW, chapter: C.CH_EMBER, focus: ['spawn', 'boss'] },
  { name: 'saltreach', area: C.AREA_SALTREACH, chapter: C.CH_TIDE },
  { name: 'saltreach-corrupt', area: C.AREA_SALTREACH, chapter: C.CH_EMBER, focus: ['spawn', 'boss'] },
  { name: 'ashforge', area: C.AREA_ASHFORGE, chapter: C.CH_EMBER },
  { name: 'vellin', area: C.AREA_VELLIN, chapter: C.CH_GALE },
  { name: 'citadel', area: C.AREA_CITADEL, chapter: C.CH_CITADEL },
  { name: 'citadel-elements', area: C.AREA_CITADEL, chapter: C.CH_CITADEL, focus: ['boss'], boss: 1 },
  { name: 'citadel-colossus', area: C.AREA_CITADEL, chapter: C.CH_CITADEL, focus: ['boss'], boss: 2 },
  { name: 'barrow-fight', area: C.AREA_BARROW, chapter: C.CH_BARROW, focus: ['boss'], boss: 0 },
  { name: 'shrine0', area: C.AREA_SHRINE, spawn: 0, chapter: C.CH_GALE, waves: true },
  { name: 'shrine1', area: C.AREA_SHRINE, spawn: 1, chapter: C.CH_GALE, waves: true, focus: ['arena'] },
  { name: 'shrine2', area: C.AREA_SHRINE, spawn: 2, chapter: C.CH_GALE, waves: true, focus: ['arena'] },
  { name: 'shrine3', area: C.AREA_SHRINE, spawn: 3, chapter: C.CH_CITADEL, waves: true, focus: ['arena'] },
]
const OBJECT_FOCUS = [
  ['waystone', C.OBJ_WAYSTONE], ['pedestal', C.OBJ_PEDESTAL], ['key', C.OBJ_KEY], ['chest', C.OBJ_CHEST], ['grapple', C.OBJ_GRAPPLE],
  ['switch', C.OBJ_SWITCH], ['windmill', C.OBJ_WINDMILL], ['npc', C.OBJ_NPC], ['forge', C.OBJ_FORGE], ['shrine', C.OBJ_SHRINE], ['horse', C.OBJ_HORSE],
]
const TILE_FOCUS = [
  ['pillar', C.TILE_PILLAR_SUNK], ['cracked', C.TILE_CRACKED], ['gate', C.TILE_GATE], ['barricade', C.TILE_BARRICADE], ['seal', C.TILE_SEAL],
  ['door', C.TILE_DOOR], ['chasm', C.TILE_CHASM], ['lava', C.TILE_LAVA], ['water', C.TILE_WATER], ['stairs', C.TILE_STAIRS],
]

function focusPoints(a) {
  const points = [['spawn', a.spawnX[0], a.spawnY[0]]]
  if (a.bossX >= 0) points.push(['boss', a.bossX, a.bossY])
  for (const [name, kind] of OBJECT_FOCUS) {
    for (let k = 0; k < a.objCount; k++) if (a.oKind[k] === kind) { points.push([name, a.oX[k], a.oY[k]]); break }
  }
  for (let k = 0; k < a.objCount; k++) {
    if (a.oKind[k] === C.OBJ_EXIT) points.push(['exit' + a.oArg[k], a.oX[k], a.oY[k] - 2 * T])
    if (a.oKind[k] === C.OBJ_TRIGGER && a.oArg[k] === 8) points.push(['arena', a.oX[k], a.oY[k]])
  }
  for (const [name, kind] of TILE_FOCUS) {
    for (let i = 0; i < a.w * a.h; i++) if (a.tiles[i] === kind) { points.push([name, (i % a.w) * T + 8, Math.floor(i / a.w) * T + 8]); break }
  }
  const out = []
  for (const p of points) if (!out.some(q => q[0] === p[0] || (Math.abs(q[1] - p[1]) < 6 * T && Math.abs(q[2] - p[2]) < 4 * T))) out.push(p)
  return out
}

function landmarkPoints(a) {
  const out = []
  const T2 = T / 2
  const tileOf = (x, y) => a.tiles[Math.floor(y / T) * a.w + Math.floor(x / T)]
  for (let k = 0; k < a.objCount; k++) {
    if (a.oKind[k] !== C.OBJ_EXIT || a.oArg[k] < C.AREA_BARROW || a.oArg[k] > C.AREA_VELLIN) continue
    if (tileOf(a.oX[k] - T, a.oY[k]) === C.TILE_STAIRS) continue
    const x = a.oX[k] + T2
    const foot = a.oY[k] + T2
    out.push(['near' + a.oArg[k], x, foot + 24, 0])
    const far = [128, 112, 144, 96, 160].find(d => !C.TILE_BLOCKS_WALK[tileOf(x, foot + d)] && !C.TILE_BLOCKS_WALK[tileOf(x - T, foot + d)])
    if (far !== undefined) out.push(['far' + a.oArg[k], x, foot + far, 0])
    out.push(['side' + a.oArg[k], x, foot - 40, 0])
  }
  return out
}

function settle(ticks) {
  for (let n = 0; n < ticks; n++) {
    let guard = 0
    while (s.phase === C.PHASE_DIALOG && guard++ < 20) step(s, command(C.CMD_ADVANCE, 0))
    if (s.phase !== C.PHASE_PLAYING) return
    step(s, C.INPUT_IDLE)
  }
}

function prepare(stop) {
  s = createState()
  newGame(s, 12345)
  settle(1)
  s.chapter = stop.chapter
  s.stancesUnlocked = STANCES_BY_CHAPTER[stop.chapter]
  s.shards = s.stancesUnlocked & ~(stop.chapter <= C.CH_BARROW ? 1 : 0)
  s.keyItems = KEYS_BY_CHAPTER[stop.chapter]
  s.melodies = stop.chapter >= C.CH_BARROW ? 3 : 0
  s.stance = s.stancesUnlocked & 4 ? C.ELEMENT_EMBER : s.stancesUnlocked & 2 ? C.ELEMENT_TIDE : C.ELEMENT_STONE
  s.heat = 60
  s.clock = stop.clock ?? 0
  loadArea(s, stop.area, stop.spawn ?? 0)
  if (stop.waves) {
    const a = AREAS[stop.area]
    for (let k = 0; k < a.objCount; k++) if (a.oKind[k] === C.OBJ_TRIGGER) { s.playerX = s.playerPrevX = a.oX[k]; s.playerY = s.playerPrevY = a.oY[k]; break }
  }
  settle(stop.waves ? 140 : 90)
  if (stop.boss !== undefined) {
    for (let i = 0; i < C.MAX_ENEMIES; i++) {
      if (!s.eAlive[i] || s.eKind[i] < C.ENEMY_BOSS_FIRST) continue
      s.bossPhase = stop.boss
      s.eState[i] = C.AI_WINDUP
      s.eHp[i] = s.eMaxHp[i] * (1 - stop.boss * 0.3)
      s.lockTarget = i
    }
  }
  s.hp = Math.round(s.statMaxHp * 0.8)
  s.focus = 40
  if (process.env.WEATHER) {
    const want = Number(process.env.WEATHER)
    for (let cycle = 1; cycle < 500; cycle++) {
      s.tick = cycle * WEATHER_SPAN + WEATHER_FADE + 60
      if (weatherFor(s) === want) break
    }
  }
}

function outline(x0, y0, x1, y1, rgb) {
  for (let x = Math.max(0, x0); x < Math.min(width, x1); x++) {
    if (y0 >= 0 && y0 < height) blend(x, y0, rgb[0], rgb[1], rgb[2], 0.8)
    if (y1 - 1 >= 0 && y1 - 1 < height) blend(x, y1 - 1, rgb[0], rgb[1], rgb[2], 0.8)
  }
  for (let y = Math.max(0, y0); y < Math.min(height, y1); y++) {
    if (x0 >= 0 && x0 < width) blend(x0, y, rgb[0], rgb[1], rgb[2], 0.8)
    if (x1 - 1 >= 0 && x1 - 1 < width) blend(x1 - 1, y, rgb[0], rgb[1], rgb[2], 0.8)
  }
}

function drawZones(touch) {
  outline(width - view.clearRight * ART, 0, width, view.clearTop * ART, [255, 0, 255])
  outline(0, 0, width, view.hudTop * ART, [0, 255, 255])
  outline(0, view.hudTop * ART, width, view.textBottom * ART, [255, 255, 0])
  if (touch) {
    outline(0, height - view.clearBottom * ART, width >> 1, height, [255, 0, 255])
    outline(width >> 1, height - view.clearBottom * ART, width, height, [255, 0, 255])
  }
}

async function tour(dir, filter) {
  mkdirSync(dir, { recursive: true })
  const sizes = [[1280, 720, 'desk', false], [390, 700, 'phone', true], [245, 245, 'card', false]]
  for (const stop of TOUR) {
    if (filter && !stop.name.startsWith(filter)) continue
    prepare(stop)
    const points = (stop.landmarks ? landmarkPoints(AREAS[stop.area]) : focusPoints(AREAS[stop.area])).filter(p => !stop.focus || stop.focus.includes(p[0]))
    for (const [label, x, y] of points) {
      for (const [w, h, tag, touch] of sizes) {
        if (tag !== 'desk' && label !== 'spawn' && label !== 'boss' && label !== 'arena') continue
        configure(w, h, touch)
        const keepX = s.playerX
        const keepY = s.playerY
        const near = label === 'spawn' || label === 'arena' || stop.landmarks ? 0 : [40, -40, 28, -28].find(d => !blocksWalk(s, x, y + d)) ?? 0
        s.playerX = s.playerPrevX = x
        s.playerY = s.playerPrevY = y + near
        view.eventCursor = s.evHead
        const warm = Number(process.env.WARM ?? 3)
        for (let n = 0; n < warm; n++) {
          if (n > 2) s.tick++
          drawFrame(view, s, 1)
        }
        if (process.env.ZONES !== '0') drawZones(touch)
        const file = `${dir}/${stop.name}-${label}-${tag}.png`
        writePng(file, tag === 'desk' ? 3 : 2)
        console.log(file)
        s.playerX = s.playerPrevX = keepX
        s.playerY = s.playerPrevY = keepY
      }
    }
  }
}

function atlasSheet(file, top = 0, rows = atlas.height) {
  width = atlas.width
  height = Math.min(rows, atlas.height - top)
  frame = new Uint8Array(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    const from = (top * width + i) * 4
    const a = atlas.pixels[from + 3] / 255
    const bg = ((i % width) >> 3) + ((i / width) >> 3) & 1 ? 70 : 90
    for (let c = 0; c < 3; c++) frame[i * 4 + c] = atlas.pixels[from + c] * a + bg * (1 - a)
  }
  writePng(file, Number(process.env.UPSCALE ?? 3))
  console.log(`${file}: atlas ${atlas.width}x${atlas.height}`)
}

const OWNERS = { hero: HERO_DEFS, foes: FOES_DEFS, world: WORLD_DEFS }
const SHEET_WIDTH = 720
const GAP = 6

function label(text, x, y) {
  let cursor = x
  for (const ch of text.toUpperCase()) {
    const glyph = fontFrames[fontGlyphs.indexOf(ch)]
    if (glyph) glyph.forEach((row, gy) => [...row].forEach((key, gx) => { if (key !== '.') blend(cursor + gx, y + gy, 235, 230, 215, 1) }))
    cursor += 4
  }
}

function ownerSheet(file, owner, upscale) {
  const defs = OWNERS[owner]
  if (!defs) throw new Error(`owner must be one of ${Object.keys(OWNERS).join(', ')}`)
  const cells = []
  let x = GAP
  let y = GAP
  let row = 0
  for (const [sprite, def] of defs) {
    if (x > GAP) { x = GAP; y += row + GAP; row = 0 }
    cells.push({ text: `${def.name} (sprite ${sprite})`, x, y })
    y += 5 + GAP
    for (let f = 0; f < def.frames.length; f++) {
      const id = atlas.base[sprite] + f * atlas.variants[sprite]
      const text = `${f}${atlas.scale[id] > 1 ? 'L' : ''}`
      const w = Math.max(atlas.rw[id], text.length * 4)
      if (x + w > SHEET_WIDTH - GAP) { x = GAP; y += row + GAP; row = 0 }
      cells.push({ id, text, x, y })
      row = Math.max(row, atlas.rh[id] + 7)
      x += w + GAP
    }
  }
  width = SHEET_WIDTH
  height = y + row + GAP
  frame = new Uint8Array(width * height * 4)
  clip = [0, 0, width, height]
  for (let i = 0; i < width * height; i++) frame.fill(((i % width) >> 3) + ((i / width) >> 3) & 1 ? 92 : 104, i * 4, i * 4 + 3)
  for (const cell of cells) {
    if (cell.id === undefined) { label(cell.text, cell.x, cell.y); continue }
    const { id } = cell
    for (let py = 0; py < atlas.rh[id]; py++) {
      for (let px = 0; px < atlas.rw[id]; px++) {
        const from = ((atlas.ry[id] + py) * atlas.width + atlas.rx[id] + px) * 4
        blend(cell.x + px, cell.y + py, atlas.pixels[from], atlas.pixels[from + 1], atlas.pixels[from + 2], atlas.pixels[from + 3] / 255)
      }
    }
    label(cell.text, cell.x, cell.y + atlas.rh[id] + 2)
  }
  writePng(file, upscale)
  console.log(`${file}: ${owner}, ${cells.filter(c => c.id !== undefined).length} frames, ${width}x${height} art px at ${upscale}x`)
}

if (out === 'tour') await tour(scene, process.argv[4] ?? '')
else if (out === 'sheet') ownerSheet(scene, widthArg, Number(process.argv[5] ?? 3))
else if (out === 'atlas') atlasSheet(scene, Number(widthArg === '320' ? 0 : widthArg), Number(heightArg === '208' ? atlas.height : heightArg))
else legacyScene()
