import { field, mirror } from './paint.ts'
import { at, band, blob, canvas, fill, hash, inked, plot, rowsOf, shade, smooth, threshold, type Grid } from './world-kit.ts'

const LX = -0.62
const LY = -0.78
const ROCK = 'klmno&p'
const STONE = 'lmnop'
const PALE = 'mnopq'
const SLATE = 'kDlmE'
const BRICK = 'klmD'
const MOSS = 'tuvw'
const GLOW = 'rRSTAU'
const BRONZE = 'bKfAU'
const SKYTILE = 32

function ridge(points: readonly number[], x: number): number {
  for (let i = 2; i < points.length; i += 2) {
    if (x <= points[i]!) {
      const x0 = points[i - 2]!
      const y0 = points[i - 1]!
      return y0 + ((points[i + 1]! - y0) * (x - x0)) / (points[i]! - x0)
    }
  }
  return points[points.length - 1]!
}

interface Facet {
  edge: number
  tilt: number
  up: number
  lit: boolean
}

function facets(cell: number, seed: number): (x: number, y: number) => Facet {
  const out: Facet = { edge: 0, tilt: 0, up: 0, lit: false }
  return (x, y) => {
    const gx = Math.floor(x / cell)
    const gy = Math.floor(y / cell)
    let d1 = 1e9
    let d2 = 1e9
    let bx = 0
    let by = 0
    let sx = 0
    let sy = 0
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const cx = (gx + i) * cell + hash(gx + i, gy + j, seed) * cell
        const cy = (gy + j) * cell + hash(gx + i, gy + j, seed + 1) * cell
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
        if (d < d1) {
          d2 = d1
          d1 = d
          bx = gx + i
          by = gy + j
          sx = cx
          sy = cy
        } else if (d < d2) d2 = d
      }
    }
    const angle = hash(bx, by, seed + 2) * Math.PI * 2
    const nx = Math.cos(angle) * 0.8
    const ny = Math.sin(angle) * 0.5 - 0.35
    out.edge = d2 - d1
    out.tilt = nx * LX + ny * LY
    out.up = -ny
    out.lit = (x + 0.5 - sx) * LX + (y + 0.5 - sy) * LY > 0
    return out
  }
}

function solid(g: Grid, x: number, y: number): boolean {
  return at(g, x, y) !== '.'
}

function rim(g: Grid, lit: string, dark: string, keep = ''): void {
  const h = g.length
  const w = g[0]!.length
  const edits: number[] = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!solid(g, x, y) || keep.includes(g[y]![x]!)) continue
      if (!solid(g, x, y - 1) || !solid(g, x - 1, y)) edits.push(x, y, 1)
      else if (!solid(g, x + 1, y) || !solid(g, x, y + 1)) edits.push(x, y, 0)
    }
  }
  for (let k = 0; k < edits.length; k += 3) plot(g, edits[k]!, edits[k + 1]!, edits[k + 2] ? lit : dark)
}

function courses(g: Grid, x0: number, y0: number, w: number, h: number, rows: number, seed: number, keys: string, mortar: string, light = 0.6): void {
  let course = 0
  for (let top = y0; top < y0 + h; top += rows) {
    let left = x0 - Math.floor(hash(course, 0, seed) * 10)
    let block = 0
    while (left < x0 + w) {
      const bw = 10 + Math.floor(hash(course, block, seed + 1) * 9)
      const tone = hash(course, block, seed + 2)
      for (let y = top; y < Math.min(top + rows, y0 + h); y++) {
        for (let x = Math.max(left, x0); x < Math.min(left + bw, x0 + w); x++) {
          const ly = y - top
          const lx = x - left
          if (ly === rows - 1 || lx === bw - 1) plot(g, x, y, mortar)
          else {
            const v = light - (x - x0) / (w * 3) + (tone - 0.5) * 0.4 + (ly === 0 || lx === 0 ? 0.18 : 0) - (ly === rows - 2 ? 0.1 : 0)
            plot(g, x, y, band(keys, v, x, y, 0.3))
          }
        }
      }
      left += bw
      block++
    }
    course++
  }
}

function arch(cx: number, top: number, half: number, pointed: boolean): (x: number, y: number) => number {
  return (x, y) => {
    const dx = Math.abs(x + 0.5 - cx)
    if (dx > half) return 99
    const spring = top + (pointed ? half * 1.48 : half)
    if (y + 0.5 >= spring) return half - dx
    if (pointed) {
      const r = half * 1.6
      const ox = cx + (x + 0.5 < cx ? r - half : half - r)
      const d = r - Math.hypot(x + 0.5 - ox, y + 0.5 - spring)
      return d
    }
    return half - Math.hypot(x + 0.5 - cx, y + 0.5 - spring)
  }
}

function inside(depth: number): boolean {
  return depth >= 0 && depth < 98
}

const PEAK = [0, 222, 16, 186, 32, 154, 48, 128, 64, 106, 80, 94, 96, 98, 112, 70, 128, 46, 144, 22, 160, 6, 176, 16, 192, 36, 208, 30, 224, 56, 240, 80, 256, 96, 272, 120, 288, 146, 304, 184, 320, 222]

export const mountain = (() => {
  const W = 320
  const H = 224
  const MX = W / 2
  const SPRING = H - 39
  const g = canvas(W, H)
  const face = facets(21, 311)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const top = ridge(PEAK, x) + (smooth(x, 3, 312, 4, 64) - 0.5) * 9
      if (y < top) continue
      const f = face(x, Math.floor(y * 0.72))
      const slope = (ridge(PEAK, x + 4) - ridge(PEAK, x - 4)) / 8
      let v = 0.52 + f.tilt * 0.2 - slope * 0.14 - (x / W - 0.42) * 0.3 - (y > H - 50 ? (y - H + 50) / 130 : 0) + (y - top < 8 ? 0.1 : 0)
      if (f.edge < 1.2 && !f.lit) v -= 0.32
      else if (f.edge < 2.4 && f.lit) v += 0.2
      const strata = (y + smooth(x, 9, 319, 12, 64) * 10 + x * 0.18) % 19
      if (strata < 1 && f.edge > 1.2) v -= 0.2
      g[y]![x] = band('klmnop', v, x, y, 0.3)
      if (f.up > 0.4 && f.edge > 2 && y > 60 && x < W * 0.62 && smooth(x, y, 313, 7, 64) > 0.6) g[y]![x] = band(MOSS, 0.45 + f.tilt * 0.5 - (x / W) * 0.3, x, y, 0.3)
    }
  }
  rim(g, 'q', 'k')
  const mouth = arch(MX, SPRING - 33, 33, false)
  const ring = arch(MX, SPRING - 43, 43, false)
  for (let y = SPRING - 46; y < H; y++) {
    for (let x = MX - 46; x < MX + 46; x++) {
      const d = mouth(x, y)
      const r = ring(x, y)
      if (inside(d)) {
        const u = (x + 0.5 - MX) / 33
        const step = Math.floor((H - 1 - y) / 7)
        const ly = (H - 1 - y) % 7
        let v = 0.42 - step * 0.09 - Math.abs(u) * 0.18 + (u > 0.55 ? 0.12 : 0)
        if (ly === 6 && step < 5) v += 0.16
        if (ly === 0) v -= 0.12
        if (d < 2.5) v = u < 0 ? 0.02 : 0.2
        g[y]![x] = v < 0.06 ? '0' : band('0klmn', v, x, y, 0.4)
      } else if (inside(r) && y < H - 1) {
        const angle = Math.atan2(y + 0.5 - SPRING, x + 0.5 - MX)
        const joint = y < SPRING ? (((angle + Math.PI) * 9) / Math.PI) % 1 : ((y - SPRING) % 11) / 11
        const key = y < SPRING && Math.abs(angle + Math.PI / 2) < 0.16
        const lit = (x + 0.5 - MX) * LX + (y + 0.5 - SPRING) * LY
        if (!key && (joint < 0.08 || r < 1.2)) g[y]![x] = r < 1.2 ? '0' : 'k'
        else if (r > 8.8) g[y]![x] = 'k'
        else g[y]![x] = band(key ? '@&pq' : STONE, 0.45 + lit / 90 + (r > 6 ? -0.15 : 0.08) + (hash(Math.floor(angle * 3), 0, 315) - 0.5) * 0.2, x, y, 0.3)
      }
    }
  }
  for (const [x, y] of [[-1, -38], [0, -37], [1, -36], [0, -35], [-1, -34], [1, -34]] as const) plot(g, MX + x, SPRING + y, 'e')
  menhir(g, MX - 140, H - 2, 9, 66, 316)
  menhir(g, MX + 138, H - 2, 8, 50, 320)
  cairn(g, MX + 62, H - 2)
  for (let k = 0; k < 44; k++) {
    const side = k & 1 ? 1 : -1
    const spread = hash(k, 0, 317)
    const px = MX + side * (52 + spread * 106)
    const r = 1.5 + hash(k, 1, 317) * (spread < 0.5 ? 4 : 2.2)
    const py = H - 3 - hash(k, 2, 317) * (14 - spread * 10)
    if (px < 2 || px > W - 3 || (py < ridge(PEAK, px) + 4 && spread > 0.8)) continue
    pebble(g, px, py, r, r * 0.75)
  }
  for (const [bx, r] of [[-120, 9], [-138, 6], [118, 8], [140, 5.5], [-96, 5]] as const) pebble(g, MX + bx, H - r * 0.75 - 1, r, r * 0.75)
  return inked(g)
})()

function pebble(g: Grid, cx: number, cy: number, rx: number, ry: number, keys = ROCK): void {
  blob(g, cx, cy, rx, ry, (x, y, nx, ny) => band(keys, 0.62 - nx * 0.3 - ny * 0.45, x, y, 0.3))
  plot(g, Math.round(cx - rx * 0.4), Math.round(cy - ry * 0.5), 'q')
}

function menhir(g: Grid, cx: number, foot: number, half: number, height: number, seed: number): void {
  const width = (y: number) => {
    const p = (y - (foot - height)) / height
    return [p, half * (0.62 + p * 0.38) + (smooth(0, y, seed, 6, 64) - 0.5) * 2, p < 0.12 ? Math.sqrt(p / 0.12) : 1] as const
  }
  for (let y = foot - height - 1; y <= foot; y++) {
    const [, hw, top] = width(Math.max(y, foot - height))
    for (let x = Math.floor(cx - hw - 1); x <= Math.ceil(cx + hw + 1); x++) if (Math.abs((x + 0.5 - cx) / (hw + 1)) <= top) plot(g, x, y, '0')
  }
  for (let y = foot - height; y <= foot; y++) {
    const [p, hw, top] = width(y)
    for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
      const nx = (x + 0.5 - cx) / hw
      if (Math.abs(nx) > top) continue
      let v = 0.72 - nx * 0.42 - p * 0.18 + (hash(x >> 2, y >> 2, seed) - 0.5) * 0.14
      if (nx < -0.75) v += 0.2
      g[y]![x] = band(ROCK, v, x, y, 0.3)
      if (nx < -0.1 && p < 0.35 && smooth(x, y, seed + 1, 4, 64) > 0.55) g[y]![x] = band(MOSS, 0.7 - p, x, y, 0.3)
    }
  }
  const rune = [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [-1, 1], [-2, 2], [-3, 3], [1, 1], [2, 2], [3, 3], [-1, 5], [-2, 6], [1, 5], [2, 6]] as const
  for (const [dx, dy] of rune) {
    plot(g, cx + dx, foot - height + 22 + dy, '&')
    plot(g, cx + dx + 1, foot - height + 23 + dy, 'k')
  }
}

function cairn(g: Grid, cx: number, foot: number): void {
  const stones = [[0, -8, 13, 8], [-2, -21, 10, 6.5], [2, -32, 8, 5], [0, -40, 5, 3.5]] as const
  for (const [dx, dy, rx, ry] of stones) {
    blob(g, cx + dx, foot + dy, rx, ry, (x, y, nx, ny) => {
      const v = 0.6 - nx * 0.32 - ny * 0.42 + (hash(x >> 1, y >> 1, 318) - 0.5) * 0.12
      return ny > 0.7 ? 'k' : band(ROCK, v, x, y, 0.3)
    })
    plot(g, cx + dx - rx * 0.45, foot + dy - ry * 0.55, 'q')
    plot(g, cx + dx - rx * 0.35, foot + dy - ry * 0.6, 'p')
  }
  blob(g, cx - 18, foot - 3, 5, 3.5, (x, y, nx, ny) => band(ROCK, 0.6 - nx * 0.3 - ny * 0.4, x, y, 0.3))
}

export const abbey = (() => {
  const W = 192
  const H = 192
  const g = canvas(W, H)
  for (let y = 56; y < 114; y++) {
    const inset = y < 60 ? 6 - (y - 56) : 0
    for (let x = 1 + inset; x < W - 1 - inset; x++) {
      const row = Math.floor((y - 60) / 6)
      const ly = (y - 60 + 60) % 6
      const off = row & 1 ? 5 : 0
      const lx = (x + off) % 10
      if (y < 61) {
        g[y]![x] = y === 56 ? 'n' : band('lmn', 0.7 - x / 400, x, y, 0)
        continue
      }
      const hole = smooth(x, y, 401, 9, 64) > 0.74 && y > 70 && y < 104
      if (hole) {
        g[y]![x] = (x % 12 < 3) ? 'd' : y % 6 < 2 ? 'c' : '0'
        continue
      }
      let v = 0.62 - (x / W) * 0.3 - (ly === 5 ? 0.35 : 0) + (ly === 0 ? 0.12 : 0) + (hash(Math.floor((x + off) / 10), row, 402) - 0.5) * 0.3
      if (lx === 9) v -= 0.25
      g[y]![x] = band(SLATE, v, x, y, 0.25)
      if (smooth(x, y, 403, 6, 64) > 0.66 && ly < 5) g[y]![x] = band('VX!', v, x, y, 0.3)
    }
  }
  for (let y = 0; y < 112; y++) {
    for (let x = 10; x < 58; x++) {
      const broken = x < 32 ? 8 + smooth(x, 0, 404, 3, 64) * 5 : 12 + (x - 32) * 0.55 + smooth(x, 1, 404, 3, 64) * 8
      if (y < broken) continue
      const row = Math.floor(y / 8)
      const lx = (x + (row & 1 ? 6 : 0)) % 12
      const ly = y % 8
      let v = 0.72 - (x - 10) / 70 + (hash(Math.floor((x + (row & 1 ? 6 : 0)) / 12), row, 405) - 0.5) * 0.25
      if (ly === 7 || lx === 11) v -= 0.3
      if (ly === 0 || lx === 0) v += 0.1
      if (x > 52) v -= 0.25
      g[y]![x] = band(PALE, v, x, y, 0.25)
      if (y - broken < 2) g[y]![x] = x < 34 ? 'q' : 'o'
    }
  }
  const belfry = arch(34, 26, 12, true)
  for (let y = 24; y < 66; y++) {
    for (let x = 18; x < 52; x++) {
      const d = belfry(x, y)
      if (y > 62) continue
      if (inside(d)) g[y]![x] = d < 1.5 ? (x < 34 ? 'k' : 'n') : y < 34 ? 'x' : 'J'
      else if (d > -3 && d < 0) g[y]![x] = x < 34 ? 'q' : 'n'
    }
  }
  fill(g, 22, 62, 26, 3, (_x, y) => (y === 62 ? 'q' : y === 63 ? 'o' : 'm'))
  fill(g, 24, 38, 22, 2, (x, y) => (y === 38 ? 'e' : x % 5 === 0 ? 'b' : 'c'))
  for (let y = 40; y < 58; y++) {
    const p = (y - 40) / 18
    const hw = 4 + p * p * 6
    for (let x = Math.floor(34 - hw); x <= Math.ceil(34 + hw); x++) {
      const nx = (x + 0.5 - 34) / hw
      if (Math.abs(nx) > 1) continue
      g[y]![x] = y > 55 ? (y === 57 ? 'b' : 'K') : band(BRONZE, 0.72 - nx * 0.45 - p * 0.2, x, y, 0.3)
    }
  }
  plot(g, 34, 58, 'K')
  plot(g, 34, 59, 'f')
  for (let y = 26; y < 112; y++) {
    const half = Math.max(0, (y - 30) * 0.95)
    for (let x = Math.floor(96 - half); x <= Math.ceil(96 + half); x++) {
      if (x < 52 || x > 140 || y < 30) continue
      const edge = half - Math.abs(x + 0.5 - 96)
      if (edge < 0) continue
      if (edge < 4) g[y]![x] = x < 96 ? (edge < 2 ? 'q' : 'p') : edge < 2 ? 'm' : 'n'
      else {
        const row = Math.floor(y / 8)
        const lx = (x + (row & 1 ? 7 : 0)) % 14
        const v = 0.62 - (x - 52) / 260 + (hash(Math.floor((x + (row & 1 ? 7 : 0)) / 14), row, 406) - 0.5) * 0.25 - (y % 8 === 7 || lx === 13 ? 0.3 : 0)
        g[y]![x] = band(PALE, v, x, y, 0.25)
      }
    }
  }
  fill(g, 94, 22, 4, 10, (x, y) => (y === 22 ? 'p' : x === 94 ? 'o' : 'm'))
  fill(g, 90, 25, 12, 3, (x, y) => (y === 25 ? 'p' : x === 90 ? 'o' : 'm'))
  rose(g, 96, 82, 14)
  courses(g, 1, 108, 190, 84, 8, 407, PALE, 'm', 0.62)
  for (let x = 1; x < 191; x++) {
    plot(g, x, 108, x < 96 ? 'q' : 'p')
    plot(g, x, 109, 'o')
    const drip = 4 + Math.floor(smooth(x, 0, 408, 4, 64) * 14)
    for (let y = 110; y < 110 + drip && hash(x, 0, 409) < 0.3; y++) if (y < 118) plot(g, x, y, y - 110 > drip - 3 ? 'V' : 'X')
    const stain = 168 + Math.floor(smooth(x, 1, 410, 5, 64) * 10)
    for (let y = stain; y < H; y++) {
      const k = g[y]![x]!
      if (k === 'm' || k === '.') continue
      g[y]![x] = y > 184 ? (hash(x, y, 411) < 0.3 ? 'X' : 'm') : (hash(x >> 1, y >> 1, 412) < 0.25 ? 'V' : k === 'q' || k === 'p' ? 'o' : 'n')
      if (hash(x, y, 413) < 0.012) g[y]![x] = 'q'
    }
  }
  buttress(g, 2, 104)
  buttress(g, 176, 104)
  lancet(g, 40, 126)
  lancet(g, 152, 126)
  const door = arch(96, 116, 27, true)
  for (let y = 112; y < H; y++) {
    for (let x = 62; x < 131; x++) {
      const d = door(x, y)
      if (inside(d)) {
        const p = (y - 116) / 76
        let k = shade('xJJL', p * 0.9 + (x > 96 ? 0.1 : 0), x, y)
        if (y > H - 14) k = (y + (x >> 2)) % 4 === 0 ? 'X' : y > H - 6 ? shade('LVX', (y - H + 6) / 6, x, y) : 'L'
        if (d < 2) k = x < 96 ? '0' : 'm'
        g[y]![x] = k
      } else if (d > -6 && d < 0) g[y]![x] = d > -1.2 ? '0' : x < 96 ? (d > -3.6 ? 'q' : 'p') : d > -3.6 ? 'o' : 'n'
    }
  }
  for (let y = H - 12; y < H; y += 4) {
    for (let x = 70; x < 122; x++) if (inside(door(x, y))) plot(g, x, y, y === H - 4 ? 'o' : 'n')
  }
  fill(g, 93, 108, 6, 6, (x, y) => (y === 108 ? 'q' : x === 93 ? 'p' : y === 113 ? 'l' : 'o'))
  return inked(g)
})()

function rose(g: Grid, cx: number, cy: number, r: number): void {
  blob(g, cx, cy, r + 3, r + 3, (_x, _y, nx, ny) => (nx * LX + ny * LY > 0.2 ? 'q' : nx * LX + ny * LY < -0.4 ? 'm' : 'o'))
  blob(g, cx, cy, r, r, (x, y, nx, ny) => {
    const angle = Math.atan2(ny, nx)
    const sector = Math.floor(((angle + Math.PI) * 8) / (Math.PI * 2))
    const spoke = (((angle + Math.PI) * 8) / (Math.PI * 2)) % 1
    const d = Math.hypot(nx, ny)
    if (spoke < 0.12 || Math.abs(d - 0.5) < 0.08) return 'n'
    if (d < 0.25) return 'Y'
    return band(sector & 1 ? 'LMN' : 'MNO', 0.7 - ny * 0.4 - nx * 0.2, x, y, 0.3)
  })
  plot(g, cx - 4, cy - 5, 'P')
  plot(g, cx - 5, cy - 4, 'P')
}

function buttress(g: Grid, x0: number, y0: number): void {
  for (let y = y0; y < 192; y++) {
    const step = y < y0 + 30 ? 0 : y < y0 + 58 ? 2 : 4
    const left = x0 + 2 - step
    for (let x = left; x < x0 + 14 + step; x++) {
      const lx = x - left
      const w = 12 + step * 2
      let k = lx < 2 ? 'q' : lx < w * 0.6 ? 'p' : lx < w - 2 ? 'n' : 'm'
      if ((y - y0) % 9 === 8) k = 'm'
      if (y === y0 + 30 || y === y0 + 58 || y === y0) k = lx < w - 3 ? 'q' : 'o'
      if (y > 176 && hash(x, y >> 1, 414) < 0.35) k = 'X'
      plot(g, x, y, k)
    }
  }
}

function lancet(g: Grid, cx: number, top: number): void {
  const win = arch(cx, top, 5, true)
  for (let y = top - 3; y < top + 32; y++) {
    for (let x = cx - 9; x < cx + 9; x++) {
      const d = win(x, y)
      if (y > top + 28) continue
      if (inside(d)) plot(g, x, y, d < 1.2 ? 'x' : (x + y) % 9 === 0 ? 'N' : y < top + 10 ? 'J' : 'L')
      else if (d > -3 && d < 0) plot(g, x, y, x < cx ? 'q' : 'n')
    }
  }
  fill(g, cx - 7, top + 29, 14, 2, (_x, y) => (y === top + 29 ? 'q' : 'm'))
  plot(g, cx - 1, top + 6, 'Y')
}

export const forgeHall = (() => {
  const W = 256
  const H = 192
  const g = canvas(W, H)
  chimney(g, 22, 0, 28, 82, 501)
  chimney(g, 112, 4, 32, 76, 502)
  chimney(g, 206, 12, 26, 70, 503)
  for (let y = 46; y < 76; y++) {
    for (let x = 1; x < W - 1; x++) {
      const merlon = (x - 4) % 22 < 14
      if (y < 58 && !merlon) continue
      const lx = (x - 4) % 22
      let v = 0.55 - x / 700 + (y < 58 ? 0.08 : -0.1)
      if (y === 46 || (y === 58 && !merlon)) v += 0.3
      if (lx === 0 && y < 58) v += 0.2
      if (lx === 13 && y < 58) v -= 0.3
      if (y > 70) v -= 0.25
      g[y]![x] = band(BRICK, v, x, y, 0.3)
    }
    if (y === 46) for (let x = 4; x < W - 4; x += 22) { plot(g, x + 6, 43, 'n'); plot(g, x + 6, 44, 'm'); plot(g, x + 6, 45, 'l'); plot(g, x + 7, 44, 'l') }
  }
  courses(g, 1, 76, W - 2, H - 76, 12, 504, 'klmDn', 'k', 0.48)
  for (let x = 1; x < W - 1; x++) {
    for (const band0 of [96, 148]) {
      plot(g, x, band0, 'm')
      plot(g, x, band0 + 1, 'l')
      plot(g, x, band0 + 2, 'k')
      if ((x - 8) % 12 === 0) {
        plot(g, x, band0 + 1, 'A')
        plot(g, x + 1, band0 + 1, 'K')
        plot(g, x, band0, 'U')
      }
    }
    const soot = smooth(x, 0, 505, 6, 64)
    for (let y = 76; y < 76 + soot * 10; y++) if (threshold(x, y) < 0.35) plot(g, x, y, 'k')
  }
  for (const wx of [18, 46, 196, 224]) {
    barred(g, wx, 106)
    barred(g, wx, 158)
  }
  for (const wx of [72, 170]) barred(g, wx, 106)
  const gate = arch(128, 104, 34, false)
  const frame = arch(128, 92, 46, false)
  for (let y = 88; y < H; y++) {
    for (let x = 80; x < 177; x++) {
      const d = gate(x, y)
      const r = frame(x, y)
      if (inside(d)) {
        const p = (y - 104) / 88
        let v = 0.15 + p * 0.85 - Math.abs(x + 0.5 - 128) / 120
        if (d < 3) v -= 0.3
        let k = band(GLOW, v, x, y, 0.4)
        if (y < 134) {
          const bar = (x - 96) % 7
          if (bar === 0 || bar === 1) k = bar === 0 ? '0' : 'l'
          if (y === 118 || y === 128) k = 'k'
          if (y > 130 && bar > 1) k = band(GLOW, v, x, y, 0.4)
          if (y === 133 && (bar === 0 || bar === 1)) k = 'm'
        }
        if (y > 178 && (y - 178) % 5 === 0) k = 'R'
        g[y]![x] = k
      } else if (inside(r)) {
        const angle = Math.atan2(y + 0.5 - 138, x + 0.5 - 128)
        const joint = y < 138 ? (((angle + Math.PI) * 7) / Math.PI) % 1 : ((y - 138) % 14) / 14
        const lit = (x + 0.5 - 128) * LX + (y + 0.5 - 138) * LY
        if (r < 1.2) g[y]![x] = '0'
        else if (joint < 0.07) g[y]![x] = 'k'
        else g[y]![x] = band('lmnoD', 0.4 + lit / 110 + (r < 4 ? 0.12 : 0), x, y, 0.3)
      }
    }
  }
  emblem(g, 128, 98)
  spout(g, 10, 166, 1)
  spout(g, W - 11, 166, -1)
  for (let x = 1; x < W - 1; x++) {
    if (inside(gate(x, H - 2))) continue
    for (let y = H - 6; y < H; y++) if (hash(x >> 1, y, 506) < 0.4) plot(g, x, y, hash(x, y, 507) < 0.5 ? 'k' : 'l')
  }
  return inked(g)
})()

function chimney(g: Grid, x0: number, top: number, w: number, bottom: number, seed: number): void {
  for (let y = top + 6; y < bottom; y++) {
    const course = Math.floor(y / 5)
    for (let x = x0; x < x0 + w; x++) {
      const lx = (x - x0 + (course & 1 ? 4 : 0)) % 8
      let v = 0.62 - (x - x0) / (w * 1.4) + (hash((x - x0 + (course & 1 ? 4 : 0)) >> 3, course, seed) - 0.5) * 0.3
      if (y % 5 === 4 || lx === 7) v -= 0.35
      if (x - x0 < 2) v += 0.25
      let k = band(BRICK, v, x, y, 0.3)
      if ((y - top) % 22 === 12) k = 'k'
      if ((y - top) % 22 === 11) k = x - x0 < w / 2 ? 'H' : '6'
      g[y]![x] = k
    }
  }
  for (let y = top; y < top + 6; y++) {
    for (let x = x0 - 3; x < x0 + w + 3; x++) {
      const inner = y > top + 1 && y < top + 5 && x > x0 + 1 && x < x0 + w - 2
      g[y]![x] = inner ? band('RSTA', (y - top - 2) / 3 + 0.2 - Math.abs(x - x0 - w / 2) / w, x, y, 0.4) : y === top ? 'n' : x < x0 + 2 ? 'm' : 'l'
    }
  }
}

function barred(g: Grid, x0: number, y0: number): void {
  const w = 16
  const h = 24
  fill(g, x0 - 2, y0 - 3, w + 4, 3, (_x, y) => (y === y0 - 3 ? 'm' : 'k'))
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const p = (y - y0) / h
      const lx = x - x0
      let k = band(GLOW, 0.3 + p * 0.65 - Math.abs(lx + 0.5 - w / 2) / 20, x, y, 0.4)
      if (lx % 5 === 1) k = '0'
      else if (lx % 5 === 2) k = 'l'
      if (y === y0 + 9) k = lx % 5 === 1 ? '0' : 'k'
      if (lx === 0 || y === y0) k = 'k'
      g[y]![x] = k
    }
  }
  fill(g, x0 - 2, y0 + h, w + 4, 3, (x, y) => (y === y0 + h ? (x < x0 + 6 ? 'o' : 'n') : y === y0 + h + 1 ? 'm' : 'l'))
  for (let x = x0; x < x0 + w; x++) {
    for (let y = y0 + h + 3; y < y0 + h + 9; y++) if (threshold(x, y) < 0.4 - (y - y0 - h - 3) * 0.06) plot(g, x, y, 'H')
  }
}

function emblem(g: Grid, cx: number, cy: number): void {
  blob(g, cx, cy, 9, 8, (_x, _y, nx, ny) => (Math.hypot(nx, ny) > 0.8 ? (nx + ny < 0 ? 'n' : 'k') : 'l'))
  const flame = [
    '...U...',
    '..UA...',
    '..AAT..',
    '.TAUAT.',
    '.TAUAS.',
    '..STS..',
  ]
  for (let j = 0; j < flame.length; j++) for (let i = 0; i < 7; i++) if (flame[j]![i] !== '.') plot(g, cx - 3 + i, cy - 3 + j, flame[j]![i]!)
}

function spout(g: Grid, x: number, y: number, dir: number): void {
  for (let i = 0; i < 9; i++) {
    plot(g, x + i * dir * 0.6, y, 'm')
    plot(g, x + i * dir * 0.6, y + 1, 'l')
    plot(g, x + i * dir * 0.6, y + 2, 'k')
  }
  for (let yy = y + 3; yy < 192; yy++) {
    const wob = Math.round(Math.sin(yy * 0.7) * 0.6)
    plot(g, x + wob - 1, yy, 'S')
    plot(g, x + wob, yy, yy % 4 === 0 ? 'U' : 'A')
    plot(g, x + wob + 1, yy, 'T')
  }
  for (let k = 0; k < 6; k++) plot(g, x + (k - 3) * 1.5, 189 + (k & 1), k & 1 ? 'A' : 'T')
}

export const skyCastle = (() => {
  const W = 192
  const H = 224
  const g = canvas(W, H)
  for (let y = 26; y < 150; y++) {
    for (let x = 42; x < 150; x++) {
      const row = Math.floor(y / 8)
      const lx = (x + (row & 1 ? 6 : 0)) % 12
      let v = 0.66 - (x - 42) / 220 + (hash(Math.floor((x + (row & 1 ? 6 : 0)) / 12), row, 601) - 0.5) * 0.22
      if (y % 8 === 7 || lx === 11) v -= 0.25
      if (y < 36) {
        const merlon = (x - 42) % 12 < 7
        if (y < 30 && !merlon) continue
        v = y === 26 || (y === 30 && !merlon) ? 0.95 : 0.6
      }
      g[y]![x] = band(PALE, v, x, y, 0.25)
    }
  }
  cone(g, 96, 0, 40, 16, 602)
  for (const wx of [76, 116]) {
    const win = arch(wx, 64, 5, false)
    for (let y = 60; y < 84; y++) for (let x = wx - 8; x < wx + 8; x++) {
      const d = win(x, y)
      if (y > 80) continue
      if (inside(d)) plot(g, x, y, d < 1.2 ? 'x' : y < 70 ? 'J' : 'L')
      else if (d > -2.5 && d < 0) plot(g, x, y, x < wx ? 'W' : 'o')
    }
  }
  tower(g, 22, 60, 22, 603)
  tower(g, 170, 60, 22, 604)
  for (let y = 128; y < H; y++) {
    for (let x = 30; x < 162; x++) {
      if (y < 138) {
        const merlon = (x - 30) % 14 < 9
        if (y < 132 && !merlon) continue
        g[y]![x] = y === 128 || (y === 132 && !merlon) ? (x < 96 ? 'W' : 'q') : (x - 30) % 14 === 0 ? 'q' : (x - 30) % 14 === 8 ? 'n' : 'p'
      }
    }
  }
  courses(g, 30, 138, 132, H - 138, 9, 605, PALE, 'n', 0.72)
  for (let x = 30; x < 162; x++) plot(g, x, 138, 'm')
  const gate = arch(96, 158, 25, false)
  for (let y = 150; y < H; y++) {
    for (let x = 64; x < 129; x++) {
      const d = gate(x, y)
      if (inside(d)) {
        const p = (y - 158) / 66
        let k = shade('xJLM', p * 0.8 + (x > 96 ? 0.15 : 0), x, y)
        if (Math.abs(x + 0.5 - 96) > 17) k = band('cdef', 0.4 + (x < 96 ? 0.3 : -0.1) + ((x & 3) === 0 ? -0.3 : 0), x, y, 0.2)
        if (d < 1.5) k = '0'
        if (y > H - 10 && (y - H + 10) % 4 === 0) k = 'n'
        g[y]![x] = k
      } else if (d > -5 && d < 0) g[y]![x] = d > -1 ? '0' : x < 96 ? (d > -3 ? 'W' : 'q') : d > -3 ? 'o' : 'n'
    }
  }
  fill(g, 92, 146, 9, 8, (x, y) => (y === 146 ? 'W' : x === 92 ? 'q' : y === 153 ? 'm' : 'p'))
  plot(g, 96, 149, 'Y')
  plot(g, 95, 150, 'Y')
  plot(g, 97, 150, 'Z')
  plot(g, 96, 151, 'X')
  hanging(g, 48, 144)
  hanging(g, 144, 144)
  for (let k = 0; k < 10; k++) {
    const px = 24 + hash(k, 0, 606) * 144
    if (px > 66 && px < 126) continue
    pebble(g, px, H - 3, 2 + hash(k, 1, 606) * 2, 1.6 + hash(k, 2, 606), STONE)
  }
  return inked(g)
})()

function cone(g: Grid, cx: number, apex: number, base: number, half: number, seed: number): void {
  for (let y = apex; y < base; y++) {
    const p = (y - apex) / (base - apex)
    const hw = 1 + p * half
    for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
      const nx = (x + 0.5 - cx) / hw
      if (Math.abs(nx) > 1) continue
      const row = Math.floor((y - apex) / 5)
      const scale = ((x - cx) * 6) / hw
      let v = 0.62 - nx * 0.42 + (hash(Math.floor(scale + (row & 1 ? 0.5 : 0)), row, seed) - 0.5) * 0.18
      if ((y - apex) % 5 === 4) v -= 0.22
      if (y === base - 1) v = 0.05
      g[y]![x] = band('JLMNO', v, x, y, 0.3)
    }
  }
  for (let y = apex - 2; y < apex + 3; y++) plot(g, cx, y, y < apex ? 'K' : 'n')
}

function tower(g: Grid, cx: number, top: number, r: number, seed: number): void {
  for (let y = top; y < 224; y++) {
    const row = Math.floor(y / 8)
    for (let x = cx - r; x <= cx + r; x++) {
      const nx = (x + 0.5 - cx) / r
      if (Math.abs(nx) > 1) continue
      const around = Math.asin(nx) * 4 + (row & 1 ? 0.5 : 0)
      const joint = around - Math.floor(around) < 0.09
      let v = 0.66 - nx * 0.42 - Math.abs(nx) * Math.abs(nx) * 0.15 + (hash(Math.floor(around), row, seed) - 0.5) * 0.18
      if (y % 8 === 7 || joint) v -= 0.22
      if (y < top + 10) v += 0.08
      g[y]![x] = band(PALE, v, x, y, 0.25)
    }
  }
  for (const sy of [92, 140, 182]) {
    fill(g, cx - 2, sy, 3, 12, (x, y) => (y === sy ? 'q' : x === cx - 2 ? 'x' : 'J'))
  }
  for (let x = cx - r - 3; x <= cx + r + 3; x++) {
    for (let y = top - 6; y < top + 2; y++) {
      const merlon = ((x - cx + 40) % 8) < 5
      if (y < top - 2 && !merlon) continue
      plot(g, x, y, y === top - 6 || (y === top - 2 && !merlon) ? (x < cx ? 'W' : 'q') : x < cx ? 'p' : 'n')
    }
  }
  cone(g, cx, top - 46, top - 4, r + 4, seed + 1)
}

function hanging(g: Grid, cx: number, top: number): void {
  for (let y = top; y < top + 42; y++) {
    const tail = y - (top + 34)
    for (let x = cx - 7; x <= cx + 7; x++) {
      if (tail > 0 && Math.abs(x - cx) < tail) continue
      const lx = x - (cx - 7)
      let k = band('VXYZ', 0.75 - lx / 18 + (y === top ? 0.3 : 0), x, y, 0.3)
      if (lx === 0 || lx === 14) k = lx === 0 ? 'Z' : 'V'
      g[y]![x] = k
    }
  }
  fill(g, cx - 9, top - 2, 19, 2, (x, y) => (y === top - 2 ? (x < cx ? 'h' : 'f') : 'd'))
  const swirl = [[0, -4], [2, -3], [3, -1], [2, 1], [0, 2], [-2, 1], [-2, -1], [-1, -2], [1, -1], [1, 0]] as const
  for (const [dx, dy] of swirl) plot(g, cx + dx, top + 16 + dy, 'W')
  for (let y = top + 22; y < top + 30; y++) plot(g, cx + ((y >> 1) & 1 ? 1 : -1), y, 'P')
}

function pennantFrame(phase: number): string[] {
  const g = canvas(22, 10)
  for (let x = 0; x < 22; x++) {
    const wave = Math.sin(x * 0.45 + phase) * 1.4
    const half = 3.6 * (1 - x / 24)
    for (let y = 0; y < 10; y++) {
      const dy = y + 0.5 - (5 + wave)
      if (Math.abs(dy) > half) continue
      if (x > 17 && Math.abs(dy) < (x - 17) * 0.8) continue
      g[y]![x] = band('XYZ', 0.6 - dy / 8 + Math.cos(x * 0.45 + phase) * 0.25, x, y, 0.3)
    }
  }
  return inked(g)
}

export const pennantFrames = [pennantFrame(0), pennantFrame(2.2)]

function cloud(w: number, h: number, puffs: readonly (readonly [number, number, number])[]): string[] {
  const g = canvas(w, h)
  const base = h - 4
  for (const [cx, cy, r] of puffs) blob(g, cx, cy, r, r * 0.82, (_x, y) => (y > base ? '.' : 'P'))
  const out = canvas(w, h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!solid(g, x, y)) continue
      let above = 0
      while (above < 6 && solid(g, x, y - above - 1)) above++
      let left = 0
      while (left < 6 && solid(g, x - left - 1, y)) left++
      out[y]![x] = y >= base - 1 ? 'F' : y >= base - 3 ? 'P' : above < 3 ? (left < 2 ? 'P' : 'W') : above < 6 && left > 2 ? shade('PW', 0.6, x, y) : 'P'
    }
  }
  return rowsOf(out)
}

export const clouds = [
  cloud(112, 40, [[16, 28, 13], [36, 20, 17], [60, 17, 16], [82, 24, 13], [98, 30, 9]]),
  cloud(76, 30, [[14, 21, 10], [32, 14, 13], [52, 18, 12], [66, 23, 7]]),
  cloud(46, 20, [[11, 14, 8], [24, 10, 9], [36, 14, 7]]),
]

function skyFrame(seed: number): string[] {
  return field(SKYTILE, SKYTILE, (x, y) => {
    const puff = hash(Math.floor(x / 4), Math.floor(y / 3), seed)
    return puff < 0.025 && x > 2 && x < SKYTILE - 3 && y % 3 === 1 ? 'P' : 'O'
  })
}

export const skyFrames = [skyFrame(701), skyFrame(702), skyFrame(703)]

function undersideFrame(seed: number): string[] {
  const g = canvas(SKYTILE, SKYTILE)
  for (let x = 0; x < SKYTILE; x++) {
    const taper = Math.min(x, SKYTILE - 1 - x)
    const depth = 7 + smooth(x, 0, seed, 5, 64) * 10 + (taper > 3 ? smooth(x, 1, seed + 1, 3, 64) * 9 : 0) + (hash(x >> 1, 0, seed) < 0.12 ? 5 : 0)
    for (let y = 0; y < depth; y++) {
      const p = y / depth
      let k = y < 2 ? (y === 0 ? 'u' : 't') : band('bcde', 0.7 - p * 0.7 - (x / SKYTILE) * 0.2, x, y, 0.3)
      if (y > 3 && smooth(x, y, seed + 2, 4, 64) > 0.62) k = band('klmn', 0.65 - p * 0.6, x, y, 0.3)
      if (y > depth - 2) k = 'b'
      g[y]![x] = k
    }
    if (hash(x, 3, seed) < 0.1) for (let y = Math.floor(depth); y < depth + 4 + hash(x, 4, seed) * 5; y++) plot(g, x, y, 'c')
  }
  return rowsOf(g)
}

export const undersideFrames = [undersideFrame(711), undersideFrame(712)]

function lipFrame(seed: number): string[] {
  const g = canvas(SKYTILE, SKYTILE)
  for (let y = 0; y < SKYTILE; y++) {
    const reach = 1 + Math.floor(smooth(0, y, seed, 4, 64) * 4)
    for (let x = 0; x < reach; x++) g[y]![x] = x === reach - 1 ? 'b' : hash(x, y, seed) < 0.5 ? 'u' : 'v'
    if (hash(1, y, seed) < 0.12) for (let x = reach; x < reach + 2; x++) plot(g, x, y, 'u')
  }
  return rowsOf(g)
}

export const lipFrames = [lipFrame(721), mirror(lipFrame(722))]

function scorchFrame(seed: number): string[] {
  return field(SKYTILE, SKYTILE, (x, y) => {
    const v = smooth(x, y, 731, 8, 4) * 0.6 + smooth(x, y, seed, 4, 8) * 0.4
    const n = hash(x, y, seed)
    if (n < 0.005) return hash(x, y, seed + 2) < 0.5 ? 'T' : 'S'
    if (n < 0.012) return 'R'
    if (n > 0.985) return 'm'
    return v > 0.66 ? band('cl@', (v - 0.66) * 3, x, y, 0.4) : band('kbc', 0.2 + v * 1.1, x, y, 0.5)
  })
}

export const scorchFrames = [scorchFrame(741), scorchFrame(742), scorchFrame(743), scorchFrame(744)]
