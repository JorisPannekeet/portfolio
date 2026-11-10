import { writeFileSync } from 'node:fs'
import { crc32, deflateSync } from 'node:zlib'
import { buildAtlas } from '../src/game/render/atlas.ts'
import { SPRITE_DEFS } from '../src/game/render/sheet.ts'
import { createView } from '../src/game/render/view.ts'
import { drawFrame } from '../src/game/render/renderer.hot.ts'
import { createState, resetState } from '../src/game/sim/state.ts'
import { step } from '../src/game/sim/step.hot.ts'
import { botInput } from '../src/game/sim/bot.hot.ts'
import { PROP_RADIUS, PROPS_PER_SLOT, PROP_SLOTS_PER_ZONE, START_X, START_Y, WORLD_HALF, ZONE_COUNT } from '../src/game/sim/content.ts'

const [out, seedArg = '1', tickArg = '3600', widthArg = '195', heightArg = '422', upscaleArg = '3'] = process.argv.slice(2)
if (!out) {
  console.error('usage: node scripts/frame-preview.mjs <out.png> [seed=1] [tick=3600] [width=195] [height=422] [upscale=3]')
  console.error('env: SCALE=<css px per game px> PLAYER=<x,y> MOVING=1 FAKE=1|far|props EVENTS=beacon,zone,heal FX_AGE=<ticks>')
  console.error('     NEAR=<kind:dx:dy;...> props placed relative to the player, SHRINK=<n> renders n times larger and averages down')
  process.exit(1)
}
const shrink = Math.max(1, Number(process.env.SHRINK ?? 1) | 0)
const width = Number(widthArg) * shrink
const height = Number(heightArg) * shrink
const upscale = Number(upscaleArg)
const targetTick = Number(tickArg)
const FRAMES_DRAWN_BEFORE_CAPTURE = 90

const atlas = buildAtlas(SPRITE_DEFS)
const frame = new Uint8Array(width * height * 4)

let clip = [0, 0, width, height]

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

const softwareContext = {
  fillStyle: '#000000',
  strokeStyle: '#000000',
  globalAlpha: 1,
  lineWidth: 1,
  imageSmoothingEnabled: false,
  path: [],
  stack: [],
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
    this.path.push({ rect: [Math.round(x), Math.round(y), Math.round(x + w), Math.round(y + h)] })
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
    for (let py = Math.round(y); py < Math.round(y + h); py++) {
      for (let px = Math.round(x); px < Math.round(x + w); px++) blend(px, py, r, g, b, this.globalAlpha)
    }
  },
  beginPath() {
    this.path = []
  },
  arc(x, y, radius, a0, a1) {
    this.path.push({ x, y, rx: radius, ry: radius, a0, a1 })
  },
  ellipse(x, y, rx, ry, rotation, a0, a1) {
    this.path.push({ x, y, rx, ry, a0, a1 })
  },
  stroke() {
    const [r, g, b] = rgb(this.strokeStyle)
    const seen = new Set()
    for (const e of this.path) {
      if (e.rect) continue
      for (let w = 0; w < Math.max(1, Math.round(this.lineWidth)); w++) {
        const grow = w - (Math.max(1, Math.round(this.lineWidth)) - 1) / 2
        const rx = e.rx + grow
        const ry = e.ry + grow
        const steps = Math.max(8, Math.ceil(Math.max(rx, ry) * Math.abs(e.a1 - e.a0) * 1.5))
        for (let i = 0; i <= steps; i++) {
          const angle = e.a0 + ((e.a1 - e.a0) * i) / steps
          const px = Math.round(e.x + Math.cos(angle) * rx)
          const py = Math.round(e.y + Math.sin(angle) * ry)
          if (seen.has(py * 100000 + px)) continue
          seen.add(py * 100000 + px)
          blend(px, py, r, g, b, this.globalAlpha)
        }
      }
    }
  },
  fill() {
    const [r, g, b] = rgb(this.fillStyle)
    for (const e of this.path) {
      if (e.rect) continue
      for (let py = Math.floor(e.y - e.ry); py <= Math.ceil(e.y + e.ry); py++) {
        for (let px = Math.floor(e.x - e.rx); px <= Math.ceil(e.x + e.rx); px++) {
          const nx = (px - e.x) / e.rx
          const ny = (py - e.y) / e.ry
          if (nx * nx + ny * ny <= 1 && inSweep(Math.atan2(ny, nx), e.a0, e.a1)) blend(px, py, r, g, b, this.globalAlpha)
        }
      }
    }
  },
}

const view = createView(softwareContext, atlas, atlas)
view.width = width
view.height = height
view.scale = Number(process.env.SCALE ?? 2)
view.clearRight = Math.ceil(40 / view.scale)

const s = createState()
resetState(s, Number(seedArg))
let guard = 0
while (s.tick < targetTick && s.phase < 2 && guard++ < targetTick * 4) {
  step(s, botInput(s))
  if (targetTick - s.tick < FRAMES_DRAWN_BEFORE_CAPTURE) drawFrame(view, s, 1)
}
if (process.env.PLAYER) {
  const [x, y] = process.env.PLAYER.split(',').map(Number)
  const dx = x - s.px
  const dy = y - s.py
  s.px = s.ppx = x
  s.py = s.ppy = y
  if (process.env.MOVING) s.ppx = x - 1
  s.zone = (x >= 0 ? 1 : 0) + (y >= 0 ? 2 : 0)
  for (let i = 0; i < s.enemyCount; i++) {
    s.ex[i] += dx
    s.ey[i] += dy
    s.epx[i] += dx
    s.epy[i] += dy
  }
  for (let i = 0; i < s.gemCount; i++) {
    s.gx[i] += dx
    s.gy[i] += dy
  }
  for (let i = 0; i < s.droneCount; i++) {
    s.droneX[i] += dx
    s.droneY[i] += dy
    s.dronePx[i] += dx
    s.dronePy[i] += dy
  }
  s.shotCount = 0
}
function fakeRandom(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), a | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function addProp(kind, x, y) {
  const i = s.propCount++
  s.propKind[i] = kind
  s.propX[i] = x
  s.propY[i] = y
}

function fakeProps(seed) {
  const random = fakeRandom(seed)
  const placed = []
  const margin = 96
  const free = (x, y, r) => placed.every(p => Math.hypot(p.x - x, p.y - y) >= p.r + r + 20) && Math.hypot(x - START_X, y - START_Y) > r + 50
  for (let zone = 0; zone < ZONE_COUNT; zone++) {
    const zx = zone & 1 ? 0 : -WORLD_HALF
    const zy = zone & 2 ? 0 : -WORLD_HALF
    const inside = (x, y, r) => x - r > zx + margin && x + r < zx + WORLD_HALF - margin && y - r > zy + margin && y + r < zy + WORLD_HALF - margin
    const clusters = []
    while (clusters.length < 3) {
      const x = zx + margin + 60 + random() * (WORLD_HALF - 2 * margin - 120)
      const y = zy + margin + 60 + random() * (WORLD_HALF - 2 * margin - 120)
      if (clusters.every(c => Math.hypot(c.x - x, c.y - y) > 300)) clusters.push({ x, y })
    }
    console.error(`zone ${zone} clusters ${clusters.map(c => `${Math.round(c.x)},${Math.round(c.y)}`).join('  ')}`)
    const reach = [[0, 30], [50, 110], [40, 160], [30, 230]]
    for (let slot = 0; slot < PROP_SLOTS_PER_ZONE; slot++) {
      const kind = zone * PROP_SLOTS_PER_ZONE + slot
      const r = PROP_RADIUS[kind]
      for (let n = 0; n < PROPS_PER_SLOT[slot]; n++) {
        for (let attempt = 0; attempt < 400; attempt++) {
          const c = clusters[(n + slot + attempt) % clusters.length]
          const d = reach[slot][0] + random() * (reach[slot][1] - reach[slot][0])
          const angle = random() * Math.PI * 2
          const x = Math.round(c.x + Math.cos(angle) * d)
          const y = Math.round(c.y + Math.sin(angle) * d)
          if (!inside(x, y, r) || !free(x, y, r)) continue
          placed.push({ x, y, r })
          addProp(kind, x, y)
          if (slot < 2) console.error(`  prop ${kind} at ${x},${y}`)
          break
        }
      }
    }
  }
}

if (process.env.FAKE) {
  s.propCount = 0
  fakeProps(Number(seedArg))
}
if (process.env.NEAR) {
  for (const entry of process.env.NEAR.split(';')) {
    const [kind, dx, dy] = entry.split(':').map(Number)
    addProp(kind, s.px + dx, s.py + dy)
  }
}
if (process.env.FAKE && process.env.FAKE !== 'props') {
  const beacons = [
    [-58, -78, 0.35, 0], [62, -70, 0.8, 0], [-60, 74, 1, 1], [64, 70, 0, 0],
    [300, -420, 0, 0], [-520, 340, 0, 0], [600, 500, 0, 0],
  ]
  const lairs = [[0, 150, 0], [-560, -260, 0], [0, -150, 1]]
  if (process.env.FAKE === 'far') {
    beacons.splice(0, 4)
    lairs.splice(0, 1)
  }
  s.poiCount = 0
  for (const [dx, dy, progress, done] of beacons) {
    const i = s.poiCount++
    s.poiKind[i] = 0
    s.poiX[i] = s.px + dx
    s.poiY[i] = s.py + dy
    s.poiProgress[i] = progress
    s.poiDone[i] = done
  }
  for (const [dx, dy, done] of lairs) {
    const i = s.poiCount++
    s.poiKind[i] = 1
    s.poiX[i] = s.px + dx
    s.poiY[i] = s.py + dy
    s.poiProgress[i] = 0
    s.poiDone[i] = done
  }
  const bosses = [[6, -62, 30], [7, 62, 28], [8, -60, -26], [9, 58, -30], [9, 420, 320]]
  for (const [type, dx, dy] of process.env.FAKE === 'far' ? bosses.slice(4) : bosses) {
    const i = s.enemyCount++
    s.eType[i] = type
    s.ex[i] = s.epx[i] = s.px + dx
    s.ey[i] = s.epy[i] = s.py + dy
    s.eFlash[i] = 0
  }
  s.bossHp = 1700
  s.bossMaxHp = 2500
}
if (process.env.EVENTS) {
  const kinds = { beacon: [14, 62, -70, 2, 1], heal: [14, -58, -78, -1, 0], zone: [15, 0, 0, s.zone, 0] }
  for (const name of process.env.EVENTS.split(',')) {
    const [type, dx, dy, a, b] = kinds[name]
    const slot = s.evHead % s.evType.length
    s.evType[slot] = type
    s.evX[slot] = s.px + dx
    s.evY[slot] = s.py + dy
    s.evA[slot] = a
    s.evB[slot] = b
    s.evHead++
  }
  drawFrame(view, s, 1)
  s.tick += Number(process.env.FX_AGE ?? 10)
}
softwareContext.draws = 0
drawFrame(view, s, 1)
const drawCalls = softwareContext.draws

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data])
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const sum = Buffer.alloc(4)
  sum.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, sum])
}

const outW = width / shrink
const outH = height / shrink
const small = new Uint8Array(outW * outH * 4)
for (let y = 0; y < outH; y++) {
  for (let x = 0; x < outW; x++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0
      for (let j = 0; j < shrink; j++) for (let i = 0; i < shrink; i++) sum += frame[((y * shrink + j) * width + x * shrink + i) * 4 + c]
      small[(y * outW + x) * 4 + c] = Math.round(sum / (shrink * shrink))
    }
  }
}
const W = outW * upscale
const H = outH * upscale
const raw = Buffer.alloc((W * 4 + 1) * H)
for (let y = 0; y < H; y++) {
  const row = y * (W * 4 + 1)
  for (let x = 0; x < W; x++) {
    const from = (Math.floor(y / upscale) * outW + Math.floor(x / upscale)) * 4
    raw.set(small.subarray(from, from + 3), row + 1 + x * 4)
    raw[row + 4 + x * 4] = 255
  }
}
const header = Buffer.alloc(13)
header.writeUInt32BE(W, 0)
header.writeUInt32BE(H, 4)
header.set([8, 6, 0, 0, 0], 8)
writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]))
console.log(`${out}: ${W}x${H} seed ${s.seed} tick ${s.tick} phase ${s.phase} level ${s.level} kills ${s.kills} hostiles ${s.enemyCount} shots ${s.shotCount} gems ${s.gemCount} hp ${Math.round(s.hp)}/${s.maxHp} props ${s.propCount} drawImage ${drawCalls}`)
