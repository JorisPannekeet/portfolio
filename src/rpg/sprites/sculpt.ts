import { noise } from './paint.ts'

export interface Mat {
  readonly ink: string
  readonly tones: string
  readonly bias: number
}

export function mat(ink: string, tones: string, bias = 0): Mat {
  return { ink, tones, bias }
}

export interface Canvas {
  readonly w: number
  readonly h: number
  readonly fx: number
  readonly fy: number
  readonly part: Int16Array
  readonly lum: Float32Array
  readonly fixed: string[]
  readonly mats: Mat[]
  readonly t: number[]
  current: number
}

export interface Shape {
  flat?: number
  join?: boolean
  bias?: number
}

const LX = -0.55
const LY = -0.72
const LZ = 0.42

export function canvas(w: number, h: number, fy = h - 2): Canvas {
  return { w, h, fx: w >> 1, fy, part: new Int16Array(w * h).fill(-1), lum: new Float32Array(w * h), fixed: Array<string>(w * h).fill(''), mats: [], t: [1, 0, 0, 1, 0, 0], current: -1 }
}

export function turn(c: Canvas, angle: number, px: number, py: number, dx = 0, dy = 0): void {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const [a, b, cc, d, e, f] = c.t as [number, number, number, number, number, number]
  const qx = px - (cos * px - sin * py) + dx
  const qy = py - (sin * px + cos * py) + dy
  c.t.splice(0, 6, a * cos + cc * sin, b * cos + d * sin, -a * sin + cc * cos, -b * sin + d * cos, a * qx + cc * qy + e, b * qx + d * qy + f)
}

export function scale(c: Canvas, sx: number, sy: number, px: number, py: number): void {
  const [a, b, cc, d, e, f] = c.t as [number, number, number, number, number, number]
  const qx = px - sx * px
  const qy = py - sy * py
  c.t.splice(0, 6, a * sx, b * sx, cc * sy, d * sy, a * qx + cc * qy + e, b * qx + d * qy + f)
}

export function save(c: Canvas): number[] {
  return [...c.t]
}

export function restore(c: Canvas, t: readonly number[]): void {
  c.t.splice(0, 6, ...t)
}

function begin(c: Canvas, m: Mat | null, o: Shape | undefined): number {
  if (m === null) return -1
  if (o?.join && c.current >= 0 && c.mats[c.current] === m) return c.current
  c.mats.push(m)
  c.current = c.mats.length - 1
  return c.current
}

type Probe = (x: number, y: number, out: number[]) => boolean

const probeOut = [0, 0, 1]

function raster(c: Canvas, m: Mat | null, o: Shape | undefined, x0: number, y0: number, x1: number, y1: number, probe: Probe): void {
  const id = begin(c, m, o)
  const [a, b, cc, d, e, f] = c.t as [number, number, number, number, number, number]
  const det = a * d - b * cc
  const corners = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of corners) {
    const wx = a * x! + cc * y! + e
    const wy = b * x! + d * y! + f
    minX = Math.min(minX, wx)
    minY = Math.min(minY, wy)
    maxX = Math.max(maxX, wx)
    maxY = Math.max(maxY, wy)
  }
  const flat = o?.flat ?? 0
  const bias = (o?.bias ?? 0) + (m?.bias ?? 0)
  for (let py = Math.max(0, Math.floor(minY) - 1); py <= Math.min(c.h - 1, Math.ceil(maxY) + 1); py++) {
    for (let px = Math.max(0, Math.floor(minX) - 1); px <= Math.min(c.w - 1, Math.ceil(maxX) + 1); px++) {
      const wx = px + 0.5 - e
      const wy = py + 0.5 - f
      const lx = (d * wx - cc * wy) / det
      const ly = (-b * wx + a * wy) / det
      if (!probe(lx, ly, probeOut)) continue
      const at = py * c.w + px
      if (id < 0) {
        c.part[at] = -1
        c.fixed[at] = ''
        continue
      }
      let nx = probeOut[0]! * (1 - flat)
      let ny = probeOut[1]! * (1 - flat)
      let nz = probeOut[2]! * (1 - flat) + flat
      const wnx = a * nx + cc * ny
      const wny = b * nx + d * ny
      const len = Math.hypot(wnx, wny, nz) || 1
      nx = wnx / len
      ny = wny / len
      nz /= len
      c.part[at] = id
      c.fixed[at] = ''
      c.lum[at] = nx * LX + ny * LY + nz * LZ + bias
    }
  }
}

export function ell(c: Canvas, m: Mat | null, cx: number, cy: number, rx: number, ry: number, o?: Shape): void {
  raster(c, m, o, cx - rx, cy - ry, cx + rx, cy + ry, (x, y, out) => {
    const dx = (x - cx) / rx
    const dy = (y - cy) / ry
    const r = dx * dx + dy * dy
    if (r > 1) return false
    out[0] = dx
    out[1] = dy
    out[2] = Math.sqrt(1 - r)
    return true
  })
}

export function seg(c: Canvas, m: Mat | null, ax: number, ay: number, bx: number, by: number, ra: number, rb = ra, o?: Shape): void {
  const vx = bx - ax
  const vy = by - ay
  const ll = vx * vx + vy * vy || 1
  const r = Math.max(ra, rb)
  raster(c, m, o, Math.min(ax, bx) - r, Math.min(ay, by) - r, Math.max(ax, bx) + r, Math.max(ay, by) + r, (x, y, out) => {
    const k = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / ll))
    const dx = x - (ax + vx * k)
    const dy = y - (ay + vy * k)
    const rad = ra + (rb - ra) * k
    const dist = Math.hypot(dx, dy)
    if (dist > rad) return false
    const q = dist / (rad || 1)
    out[0] = dist > 0 ? (dx / dist) * q : 0
    out[1] = dist > 0 ? (dy / dist) * q : 0
    out[2] = Math.sqrt(Math.max(0, 1 - q * q))
    return true
  })
}

export function poly(c: Canvas, m: Mat | null, pts: readonly number[], o?: Shape & { nx?: number; ny?: number }): void {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (let i = 0; i < pts.length; i += 2) {
    minX = Math.min(minX, pts[i]!)
    maxX = Math.max(maxX, pts[i]!)
    minY = Math.min(minY, pts[i + 1]!)
    maxY = Math.max(maxY, pts[i + 1]!)
  }
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const hw = (maxX - minX) / 2 || 1
  const hh = (maxY - minY) / 2 || 1
  const bulge = o?.nx === undefined ? 0.7 : 0
  raster(c, m, o, minX, minY, maxX, maxY, (x, y, out) => {
    let inside = false
    for (let i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) {
      const xi = pts[i]!
      const yi = pts[i + 1]!
      const xj = pts[j]!
      const yj = pts[j + 1]!
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
    }
    if (!inside) return false
    out[0] = (o?.nx ?? 0) + ((x - cx) / hw) * bulge * 0.6
    out[1] = (o?.ny ?? 0) + ((y - cy) / hh) * bulge * 0.45
    out[2] = 1
    return true
  })
}

export function box(c: Canvas, m: Mat | null, x: number, y: number, w: number, h: number, o?: Shape & { nx?: number; ny?: number }): void {
  poly(c, m, [x, y, x + w, y, x + w, y + h, x, y + h], o)
}

export function dot(c: Canvas, x: number, y: number, key: string): void {
  const [a, b, cc, d, e, f] = c.t as [number, number, number, number, number, number]
  const px = Math.floor(a * x + cc * y + e)
  const py = Math.floor(b * x + d * y + f)
  if (px < 0 || py < 0 || px >= c.w || py >= c.h) return
  const at = py * c.w + px
  if (c.part[at]! < 0) {
    c.mats.push(mat('0', key))
    c.part[at] = c.mats.length - 1
  }
  c.fixed[at] = key
}

export function line(c: Canvas, ax: number, ay: number, bx: number, by: number, key: string): void {
  const k = Math.max(Math.hypot(c.t[0]!, c.t[1]!), Math.hypot(c.t[2]!, c.t[3]!))
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * k))
  for (let n = 0; n <= steps; n++) dot(c, ax + ((bx - ax) * n) / steps, ay + ((by - ay) * n) / steps, key)
}

export function dissolve(c: Canvas, amount: number, seed: number, grain = 2): void {
  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      const at = y * c.w + x
      if (c.part[at]! < 0) continue
      const n = noise((x / grain) | 0, (y / grain) | 0, seed) * 0.7 + noise(x, y, seed + 1) * 0.3
      const fall = (y - (c.fy - 40)) / 80
      if (n < amount * 1.25 - fall * 0.3) {
        c.part[at] = -1
        c.fixed[at] = ''
      } else if (n < amount * 1.25 + 0.12) c.lum[at] = -1
    }
  }
}

function toneOf(c: Canvas, at: number): number {
  const m = c.mats[c.part[at]!]!
  const n = m.tones.length
  const v = 0.38 + 0.62 * c.lum[at]!
  return Math.max(0, Math.min(n - 1, Math.floor(v * n)))
}

export function bake(c: Canvas, centered = false): string[] {
  const { w, h, part } = c
  const tone = new Int8Array(w * h)
  for (let i = 0; i < w * h; i++) if (part[i]! >= 0) tone[i] = toneOf(c, i)
  const id = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? -1 : part[y * w + x]!)
  const next = new Int8Array(tone)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const at = y * w + x
      const p = part[at]!
      if (p < 0 || c.fixed[at]) continue
      const top = c.mats[p]!.tones.length - 1
      const up = id(x, y - 1)
      const left = id(x - 1, y)
      const down = id(x, y + 1)
      const right = id(x + 1, y)
      let t = tone[at]!
      if (up < 0 || left < 0) t += up < 0 && left < 0 ? 2 : 1
      else if ((up !== p && up < p) || (left !== p && left < p)) t += 1
      if (down < 0 || right < 0) t -= 1
      else if ((down !== p && down < p) || (right !== p && right < p)) t = Math.min(t, 0)
      else if ((down !== p && down > p) || (right !== p && right > p)) t -= 1
      next[at] = Math.max(0, Math.min(top, t))
    }
  }
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const at = y * w + x
      const p = part[at]!
      if (p < 0 || c.fixed[at]) continue
      const ns = [at - 1, at + 1, at - w, at + w]
      let same = 0
      let alone = true
      let other = -1
      for (const n of ns) {
        if (part[n] !== p) continue
        same++
        if (next[n] === next[at]) alone = false
        else other = next[n]!
      }
      if (same >= 3 && alone && other >= 0) next[at] = other
    }
  }
  const key = (at: number) => (c.fixed[at] ? c.fixed[at]! : c.mats[part[at]!]!.tones[next[at]!]!)
  const rows: string[] = []
  for (let y = 0; y < h; y++) {
    let row = ''
    for (let x = 0; x < w; x++) {
      const at = y * w + x
      if (part[at]! >= 0) {
        row += key(at)
        continue
      }
      const ink = [id(x, y + 1), id(x + 1, y), id(x - 1, y), id(x, y - 1)].find(n => n >= 0)
      row += ink === undefined ? '.' : c.mats[ink]!.ink
    }
    rows.push(row)
  }
  return centered ? centre(rows) : crop(rows, c.fx, c.fy)
}

function centre(rows: readonly string[]): string[] {
  const cy = rows.length >> 1
  const cx = rows[0]!.length >> 1
  let ry = 1
  let rx = 1
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '.') continue
      ry = Math.max(ry, y < cy ? cy - y : y + 1 - cy)
      rx = Math.max(rx, x < cx ? cx - x : x + 1 - cx)
    }
  })
  return rows.slice(cy - ry, cy + ry).map(row => row.slice(cx - rx, cx + rx))
}

export function crop(rows: readonly string[], fx: number, fy: number): string[] {
  let minX = Infinity
  let maxX = -1
  let minY = Infinity
  rows.forEach((row, y) => {
    if (y > fy) return
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '.') continue
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
    }
  })
  const r = Math.max(fx - minX, maxX + 1 - fx, 1)
  const out: string[] = []
  for (let y = Math.min(minY, fy); y <= fy; y++) {
    let row = ''
    for (let x = fx - r; x < fx + r; x++) row += rows[y]?.[x] ?? '.'
    out.push(row.length ? row : '.')
  }
  return out
}
