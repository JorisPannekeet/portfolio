import { outlined, type Rows } from './paint.ts'

export type Grid = string[][]
export type Point = readonly [number, number]

export function grid(w: number, h: number): Grid {
  const out: Grid = []
  for (let y = 0; y < h; y++) out.push(Array<string>(w).fill('.'))
  return out
}

export function put(g: Grid, x: number, y: number, key: string): void {
  if (y >= 0 && y < g.length && x >= 0 && x < g[0]!.length && key !== '.') g[y]![x] = key
}

export function paste(g: Grid, rows: Rows, x: number, y: number): void {
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) put(g, x + i, y + j, row[i]!)
  })
}

export function limb(g: Grid, sx: number, sy: number, hand: Point, keys: string): void {
  const [hx, hy] = hand
  const steps = Math.max(Math.abs(hx - sx), Math.abs(hy - sy), 1)
  const flat = Math.abs(hx - sx) > Math.abs(hy - sy)
  for (let n = 0; n < steps; n++) {
    const x = Math.round(sx + ((hx - sx) * n) / steps)
    const y = Math.round(sy + ((hy - sy) * n) / steps)
    put(g, x, y, n === steps - 1 ? keys[2]! : keys[0]!)
    if (n < steps - 1) put(g, flat ? x : x + 1, flat ? y + 1 : y, keys[1]!)
  }
  put(g, hx, hy, keys[3]!)
}

export function shoulder(g: Grid, sx: number, sy: number, keys: string): void {
  paste(g, [keys.slice(0, 3), keys.slice(3, 6)], sx - 1, sy)
}

export function shaft(g: Grid, from: Point, angle: number, length: number, keys: string, back = 0): void {
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  for (let n = -back; n <= length; n++) {
    const at = n < 0 ? 0 : Math.min(keys.length - 1, Math.floor((n * keys.length) / (length + 1)))
    put(g, Math.round(from[0] + dx * n), Math.round(from[1] + dy * n), keys[at]!)
  }
}

export function finish(g: Grid): string[] {
  const w = g[0]!.length + 2
  return outlined(['.'.repeat(w), ...g.map(row => '.' + row.join('') + '.'), '.'.repeat(w)])
}

export const legsSide = ['.EDDl.', '.EDDl.', '.dcccb']
export const legsSideA = ['.EDDl..', 'EDl.EDl', 'dcb.dccb']
export const legsSidePass = ['.EDl..', '.EDl..', '.dccb.']
export const legsSideB = ['.EDDl..', 'EDl.EDl', 'dccbdcb']
export const legsSideBrace = ['EDl..EDl', 'EDl..EDl', 'dcb..dccb']

const RAMP_KEYS = 'klmnopqWbcdefhJLMNOPrRSTKAUVXYZBCgaQDEFstuvw@&HjiI%'
const RAMP_LIGHT = 'lmnopqWWcdefhhLMNOPWRSTAAUWXYZWCgaQWEFqtuvwI&&jiiI%'
const RAMP_DARK = '0klmnopq0bcdefJJLMNOrrRSbKAJVXYBBCgakDExstuvd@bHjws'

function ramp(key: string, table: string): string {
  const at = RAMP_KEYS.indexOf(key)
  return at < 0 ? key : table[at]!
}

export function rim(rows: Rows): string[] {
  const h = rows.length
  const w = rows[0]!.length
  const empty = (x: number, y: number) => x < 0 || y < 0 || x >= w || y >= h || rows[y]![x] === '.'
  return rows.map((row, y) => {
    let out = ''
    for (let x = 0; x < w; x++) {
      const key = row[x]!
      if (key === '.') out += key
      else if ((empty(x - 1, y) || empty(x, y - 1)) && x < w * 0.6) out += ramp(key, RAMP_LIGHT)
      else if (empty(x + 1, y) || empty(x, y + 1) || (x > w * 0.62 && (x + y) % 2 === 0 && empty(x + 2, y))) out += ramp(key, RAMP_DARK)
      else out += key
    }
    return out
  })
}

const SHADE = 'hf fe ed dc cb b0 _i i+ +j jH H^ ^0 PO ON NM ML LJ Jx TS S* *R Rr r0 Wq qp po on nm ml lk k0 UA AK Kb =& &? ?@ @~ FE ED Dl ~0 wv vu ut ts s0 ZY YX XV V0'
const EDGE = 'hb fb eb db cb b0 _^ i^ +^ j^ H^ ^0 PJ OJ NJ MJ LJ Jx Tr Sr *r Rr r0 Wk qk pk ok nk mk lk k0 Uc Ac Kc =~ &~ ?~ @~ F~ E~ D~ ~0 x0 ws vs us ts s0 ZV YV XV V0'

function pairs(table: string, key: string, missing: string): string {
  for (let i = 0; i < table.length; i += 3) if (table[i] === key) return table[i + 1]!
  return missing
}

export function darker(key: string): string {
  return pairs(SHADE, key, key)
}

export function edgeOf(key: string): string {
  return pairs(EDGE, key, '0')
}

export interface Layer {
  readonly w: number
  readonly h: number
  readonly keys: string[]
}

export function layer(w: number, h: number): Layer {
  return { w, h, keys: Array<string>(w * h).fill('') }
}

export function dot(l: Layer, x: number, y: number, key: string): void {
  if (x >= 0 && y >= 0 && x < l.w && y < l.h && key !== '.') l.keys[y * l.w + x] = key
}

export function stamp(l: Layer, rows: Rows, x: number, y: number): void {
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) dot(l, x + i, y + j, row[i]!)
  })
}

export function commit(g: Grid, l: Layer, ring = true): void {
  const h = g.length
  const w = g[0]!.length
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < l.w && y < l.h && l.keys[y * l.w + x] !== ''
  if (ring) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (inside(x, y)) continue
        const n = inside(x, y + 1) ? l.keys[(y + 1) * l.w + x]! : inside(x + 1, y) ? l.keys[y * l.w + x + 1]! : inside(x - 1, y) ? l.keys[y * l.w + x - 1]! : inside(x, y - 1) ? l.keys[(y - 1) * l.w + x]! : ''
        if (n === '') continue
        const under = g[y]![x]!
        g[y]![x] = under === '.' ? edgeOf(n) : darker(under)
      }
    }
  }
  for (let y = 0; y < Math.min(h, l.h); y++) {
    for (let x = 0; x < Math.min(w, l.w); x++) if (inside(x, y)) g[y]![x] = l.keys[y * l.w + x]!
  }
}

const LX = -0.6
const LY = -0.8

export function tone(ramp: string, light: number): string {
  const k = light < -1 ? -1 : light > 1 ? 1 : light
  return ramp[Math.round(((k + 1) / 2) * (ramp.length - 1))]!
}

export function capsule(l: Layer, a: Point, b: Point, r: number, ramp: string, bias = 0): void {
  const [ax, ay] = a
  const [bx, by] = b
  const vx = bx - ax
  const vy = by - ay
  const len2 = vx * vx + vy * vy || 1
  const x0 = Math.floor(Math.min(ax, bx) - r - 1)
  const x1 = Math.ceil(Math.max(ax, bx) + r + 1)
  const y0 = Math.floor(Math.min(ay, by) - r - 1)
  const y1 = Math.ceil(Math.max(ay, by) + r + 1)
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const px = x + 0.5 - ax
      const py = y + 0.5 - ay
      let t = (px * vx + py * vy) / len2
      t = t < 0 ? 0 : t > 1 ? 1 : t
      const dx = px - vx * t
      const dy = py - vy * t
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d > r) continue
      dot(l, x, y, tone(ramp, ((dx * LX + dy * LY) / r) * 1.15 + bias))
    }
  }
}

export function blob(l: Layer, cx: number, cy: number, rx: number, ry: number, ramp: string, bias = 0): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x + 0.5 - cx) / rx
      const ny = (y + 0.5 - cy) / ry
      if (nx * nx + ny * ny > 1) continue
      dot(l, x, y, tone(ramp, (nx * LX + ny * LY) * 1.1 + bias))
    }
  }
}

export function reach(root: Point, target: Point, upper: number, lower: number, bend: number): Point {
  const dx = target[0] - root[0]
  const dy = target[1] - root[1]
  const d = Math.min(Math.sqrt(dx * dx + dy * dy) || 0.01, upper + lower - 0.01)
  const cos = (upper * upper + d * d - lower * lower) / (2 * upper * d)
  const turn = Math.acos(cos < -1 ? -1 : cos > 1 ? 1 : cos) * bend
  const base = Math.atan2(dy, dx)
  return [root[0] + Math.cos(base + turn) * upper, root[1] + Math.sin(base + turn) * upper]
}

export function toRows(g: Grid): string[] {
  return g.map(row => row.join(''))
}
