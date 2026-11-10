import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { pathToFileURL } from 'node:url'
import { buildAtlas } from '../src/game/render/atlas.ts'
import { SPRITE_DEFS } from '../src/game/render/sheet.ts'

const [out, scaleArg = '8', mode = 'sheet'] = process.argv.slice(2)
if (!out) {
  console.error('usage: node scripts/atlas-preview.mjs <out.png> [scale=8] [sheet|atlas]')
  process.exit(1)
}
const scale = Math.max(1, Number(scaleArg) | 0)
const only = process.env.ONLY ? process.env.ONLY.split(',') : null
const compareDefs = process.env.COMPARE
  ? [{ name: 'compare', kind: 1, frames: Object.values(await import(pathToFileURL(process.env.COMPARE).href)) }]
  : []
const defs = [...compareDefs, ...SPRITE_DEFS]
const atlas = buildAtlas(defs)
const background = [0x15, 0x18, 0x1d, 255]

function contactSheet() {
  const gap = 3
  const maxWidth = Number(process.env.SHEET_WIDTH ?? 200)
  const placements = []
  let x = gap
  let y = gap
  let rowHeight = 0
  let usedWidth = 0
  defs.forEach((def, sprite) => {
    if (only && !only.includes(def.name) && def.name !== 'compare') return
    const variants = atlas.variants[sprite]
    const shown = def.kind === 1 ? [0, 2] : def.kind === 4 ? [0, 1] : def.kind === 5 || (def.kind === 2 && process.env.ROTATIONS) ? [...Array(variants).keys()] : [0]
    def.frames.forEach((_, frame) => {
      for (const variant of shown) {
        if (def.kind === 1 && variant === 2 && frame > 0) continue
        const id = atlas.base[sprite] + frame * variants + variant
        const w = atlas.rw[id]
        const h = atlas.rh[id]
        if (x + w + gap > maxWidth) {
          x = gap
          y += rowHeight + gap
          rowHeight = 0
        }
        placements.push({ id, x, y })
        usedWidth = Math.max(usedWidth, x + w + gap)
        x += w + (def.kind === 3 ? 1 : gap)
        rowHeight = Math.max(rowHeight, h)
      }
    })
    x += gap * 2
  })
  return { width: usedWidth, height: y + rowHeight + gap, placements }
}

function compose() {
  if (mode === 'atlas') {
    return { width: atlas.width, height: atlas.height, placements: [{ whole: true, x: 0, y: 0 }] }
  }
  return contactSheet()
}

const layout = compose()
const W = layout.width * scale
const H = layout.height * scale
const image = new Uint8Array(W * H * 4)
for (let i = 0; i < W * H; i++) image.set(background, i * 4)

function blit(sx, sy, w, h, dx, dy) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const from = ((sy + y) * atlas.width + sx + x) * 4
      if (atlas.pixels[from + 3] === 0) continue
      for (let py = 0; py < scale; py++) {
        for (let px = 0; px < scale; px++) {
          const to = (((dy + y) * scale + py) * W + (dx + x) * scale + px) * 4
          image[to] = atlas.pixels[from]
          image[to + 1] = atlas.pixels[from + 1]
          image[to + 2] = atlas.pixels[from + 2]
          image[to + 3] = 255
        }
      }
    }
  }
}

for (const p of layout.placements) {
  if (p.whole) blit(0, 0, atlas.width, atlas.height, 0, 0)
  else blit(atlas.rx[p.id], atlas.ry[p.id], atlas.rw[p.id], atlas.rh[p.id], p.x, p.y)
}

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(bytes) {
  let c = 0xffffffff
  for (const b of bytes) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

const header = Buffer.alloc(13)
header.writeUInt32BE(W, 0)
header.writeUInt32BE(H, 4)
header[8] = 8
header[9] = 6
const raw = Buffer.alloc((W * 4 + 1) * H)
for (let y = 0; y < H; y++) Buffer.from(image.buffer, y * W * 4, W * 4).copy(raw, y * (W * 4 + 1) + 1)

writeFileSync(out, Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', header),
  chunk('IDAT', deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0)),
]))
console.log(`${out}: ${W}x${H} (atlas ${atlas.width}x${atlas.height}, ${atlas.rw.length} frames, ${defs.length} sprites)`)
