import { noise, outlined, pad, type Rows } from './paint.ts'

export type Grid = string[][]

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]

export function threshold(x: number, y: number): number {
  return (BAYER[(y & 3) * 4 + (x & 3)]! + 0.5) / 16
}

export function shade(keys: string, value: number, x: number, y: number): string {
  const v = value < 0 ? 0 : value > 0.999 ? 0.999 : value
  const f = v * (keys.length - 1)
  const i = Math.floor(f)
  return keys[i + (f - i > threshold(x, y) ? 1 : 0)]!
}

export function band(keys: string, value: number, x: number, y: number, seam = 0.3): string {
  const v = value < 0 ? 0 : value > 0.999 ? 0.999 : value
  const f = v * (keys.length - 1)
  const i = Math.floor(f)
  const frac = f - i
  const lo = 0.5 - seam / 2
  if (frac < lo || i + 1 >= keys.length) return keys[i]!
  if (frac > 1 - lo) return keys[i + 1]!
  return keys[i + ((frac - lo) / seam > threshold(x, y) ? 1 : 0)]!
}

export function step(keys: string, value: number): string {
  const v = value < 0 ? 0 : value > 0.999 ? 0.999 : value
  return keys[Math.floor(v * keys.length)]!
}

export function canvas(w: number, h: number, fill = '.'): Grid {
  return Array.from({ length: h }, () => Array<string>(w).fill(fill))
}

export function rowsOf(g: Grid): string[] {
  return g.map(row => row.join(''))
}

export function gridOf(rows: Rows): Grid {
  return rows.map(row => [...row])
}

export function plot(g: Grid, x: number, y: number, key: string): void {
  const xi = Math.round(x)
  const yi = Math.round(y)
  if (!key || yi < 0 || yi >= g.length || xi < 0 || xi >= g[0]!.length) return
  g[yi]![xi] = key
}

export function wrapPlot(g: Grid, x: number, y: number, key: string): void {
  const h = g.length
  const w = g[0]!.length
  g[(((Math.round(y) % h) + h) % h)]![(((Math.round(x) % w) + w) % w)] = key
}

export function at(g: Grid, x: number, y: number): string {
  return y < 0 || y >= g.length || x < 0 || x >= g[0]!.length ? '.' : g[y]![x]!
}

export function fill(g: Grid, x: number, y: number, w: number, h: number, pick: string | ((x: number, y: number, u: number, v: number) => string)): void {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) plot(g, x + i, y + j, typeof pick === 'string' ? pick : pick(x + i, y + j, i, j))
  }
}

export function blob(g: Grid, cx: number, cy: number, rx: number, ry: number, pick: string | ((x: number, y: number, nx: number, ny: number) => string)): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x + 0.5 - cx) / rx
      const ny = (y + 0.5 - cy) / ry
      if (nx * nx + ny * ny > 1) continue
      plot(g, x, y, typeof pick === 'string' ? pick : pick(x, y, nx, ny))
    }
  }
}

export function line(g: Grid, x0: number, y0: number, x1: number, y1: number, key: string | ((x: number, y: number, p: number) => string)): void {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))))
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / steps)
    const y = Math.round(y0 + ((y1 - y0) * i) / steps)
    plot(g, x, y, typeof key === 'string' ? key : key(x, y, i / steps))
  }
}

export function stamp(g: Grid, rows: Rows, x: number, y: number): void {
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j]!
    for (let i = 0; i < row.length; i++) if (row[i] !== '.') plot(g, x + i, y + j, row[i]!)
  }
}

export function map(g: Grid, pick: (key: string, x: number, y: number) => string): Grid {
  return g.map((row, y) => row.map((key, x) => pick(key, x, y)))
}

export function hash(x: number, y: number, seed: number): number {
  let h = Math.imul(x + 0x632be5ab, 0x9e3779b1) ^ Math.imul(y + 0x2545f491, 0x85ebca6b) ^ Math.imul(seed + 0x27d4eb2f, 0xc2b2ae35)
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d)
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39)
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296
}

export function smooth(x: number, y: number, seed: number, cell: number, period: number): number {
  const gx = x / cell
  const gy = y / cell
  const x0 = Math.floor(gx)
  const y0 = Math.floor(gy)
  const fx = gx - x0
  const fy = gy - y0
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const w = (n: number) => ((n % period) + period) % period
  const a = hash(w(x0), w(y0), seed)
  const b = hash(w(x0 + 1), w(y0), seed)
  const c = hash(w(x0), w(y0 + 1), seed)
  const d = hash(w(x0 + 1), w(y0 + 1), seed)
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
}

export function framed(rows: Rows, ink = '0', margin = 1): string[] {
  return outlined(pad(rows, margin, margin, rows[0]!.length + margin * 2, rows.length + margin * 2), ink)
}

export function inked(g: Grid, ink = '0'): string[] {
  return outlined(rowsOf(g), ink)
}

export { noise }
