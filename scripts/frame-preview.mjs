import { writeFileSync } from 'node:fs'
import { crc32, deflateSync } from 'node:zlib'
import { buildAtlas } from '../src/game/render/atlas.ts'
import { SPRITE_DEFS } from '../src/game/render/sheet.ts'
import { createView } from '../src/game/render/view.ts'
import { drawFrame } from '../src/game/render/renderer.hot.ts'
import { createState, resetState } from '../src/game/sim/state.ts'
import { step } from '../src/game/sim/step.hot.ts'
import { botInput } from '../src/game/sim/bot.hot.ts'

const [out, seedArg = '1', tickArg = '3600', widthArg = '195', heightArg = '422', upscaleArg = '3'] = process.argv.slice(2)
if (!out) {
  console.error('usage: node scripts/frame-preview.mjs <out.png> [seed=1] [tick=3600] [width=195] [height=422] [upscale=3]')
  process.exit(1)
}
const width = Number(widthArg)
const height = Number(heightArg)
const upscale = Number(upscaleArg)
const targetTick = Number(tickArg)
const FRAMES_DRAWN_BEFORE_CAPTURE = 90

const atlas = buildAtlas(SPRITE_DEFS)
const frame = new Uint8Array(width * height * 4)

function blend(x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= width || y >= height || a <= 0) return
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
  drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
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
    for (const e of this.path) {
      const steps = Math.max(8, Math.ceil(Math.max(e.rx, e.ry) * (e.a1 - e.a0) * 1.5))
      let lastX = NaN
      let lastY = NaN
      for (let i = 0; i <= steps; i++) {
        const angle = e.a0 + ((e.a1 - e.a0) * i) / steps
        const px = Math.round(e.x + Math.cos(angle) * e.rx)
        const py = Math.round(e.y + Math.sin(angle) * e.ry)
        if (px === lastX && py === lastY) continue
        lastX = px
        lastY = py
        blend(px, py, r, g, b, this.globalAlpha)
      }
    }
  },
  fill() {
    const [r, g, b] = rgb(this.fillStyle)
    for (const e of this.path) {
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
view.scale = 2
view.clearRight = 20

const s = createState()
resetState(s, Number(seedArg))
let guard = 0
while (s.tick < targetTick && s.phase < 2 && guard++ < targetTick * 4) {
  step(s, botInput(s))
  if (targetTick - s.tick < FRAMES_DRAWN_BEFORE_CAPTURE) drawFrame(view, s, 1)
}
drawFrame(view, s, 1)

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data])
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const sum = Buffer.alloc(4)
  sum.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, sum])
}

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
writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]))
console.log(`${out}: ${W}x${H} seed ${s.seed} tick ${s.tick} phase ${s.phase} level ${s.level} kills ${s.kills} hostiles ${s.enemyCount} shots ${s.shotCount} gems ${s.gemCount} hp ${Math.round(s.hp)}/${s.maxHp}`)
