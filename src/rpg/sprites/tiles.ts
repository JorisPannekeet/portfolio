import { field, recolor, type Rows } from './paint.ts'
import { at, band, blob, canvas, hash, fill, gridOf, inked, line, noise, plot, rowsOf, shade, smooth, stamp, threshold, wrapPlot, type Grid } from './world-kit.ts'

export const N = 32
const H = N / 2

type Box = readonly [number, number, number, number]

function crack(g: Grid, x: number, y: number, len: number, seed: number, key: string, lit: string): void {
  let cx = x
  let cy = y
  let dx = noise(seed, 1, 7) < 0.5 ? 1 : -1
  for (let k = 0; k < len; k++) {
    if (at(g, cx, cy) === '.') return
    plot(g, cx, cy, key)
    if (lit && at(g, cx + 1, cy + 1) !== key) plot(g, cx + 1, cy + 1, lit)
    const n = noise(k, seed, 9)
    if (n < 0.45) cy++
    else if (n < 0.8) cx += dx
    else {
      cx += dx
      cy++
    }
    if (noise(k, seed, 11) < 0.15) dx = -dx
  }
}

function slabs(boxes: readonly Box[], seed: number): string[] {
  const g = canvas(N, N, '3')
  boxes.forEach(([bx, by, bw, bh], b) => {
    for (let y = by; y < by + bh; y++) {
      for (let x = bx; x < bx + bw; x++) {
        const lx = x - bx
        const ly = y - by
        if (lx === bw - 1 || ly === bh - 1) g[y]![x] = '2'
        else if (ly === 0 && lx > 0 && lx < Math.min(7, bw - 3)) g[y]![x] = '4'
      }
    }
    if (noise(b, 1, seed) < 0.16) crack(g, bx + 2 + Math.floor(noise(b, 2, seed) * (bw - 6)), by + 1, 5 + Math.floor(noise(b, 3, seed) * 6), seed + b * 13, '2', '')
    if (noise(b, 4, seed) < 0.1) {
      const mx = bx + bw - 1
      const my = by + bh - 1
      for (let k = -2; k <= 1; k++) {
        plot(g, mx + k, my, noise(k, b, seed + 5) < 0.5 ? '8' : '7')
        if (k > -2 && k < 1) plot(g, mx, my + k, '7')
      }
      plot(g, mx - 1, my - 1, '8')
      plot(g, mx, my - 1, '9')
    }
  })
  return rowsOf(g)
}

export const floorA = slabs([[0, 0, 20, 13], [20, 0, 12, 13], [0, 13, 11, 19], [11, 13, 21, 19]], 41)
export const floorB = slabs([[0, 0, 16, 16], [16, 0, 16, 16], [0, 16, 16, 16], [16, 16, 16, 16]], 42)
export const floorC = slabs([[0, 0, 18, 11], [18, 0, 14, 11], [0, 11, 9, 11], [9, 11, 23, 11], [0, 22, 26, 10], [26, 22, 6, 10]], 43)
export const floorD = slabs([[0, 0, 32, 16], [0, 16, 14, 16], [14, 16, 18, 16]], 44)

function capstones(seed: number): string[] {
  const g = canvas(N, N, '2')
  for (let y = 0; y < N; y++) {
    const course = y >> 4
    const ly = y & 15
    for (let x = 0; x < N; x++) {
      const sx = (x + (course ? 8 : 0)) & 31
      const lx = sx & 15
      const stone = (sx >> 4) + course * 2
      if (ly === 15 || lx === 15) g[y]![x] = '1'
      else if (ly === 0 || (lx === 0 && ly < 13)) g[y]![x] = '3'
      else if (ly === 14 || lx === 14) g[y]![x] = noise(stone, 2, seed) < 0.5 ? '1' : '2'
      else if (noise(stone, 1, seed) < 0.3 && ly < 3) g[y]![x] = '3'
    }
  }
  for (let k = 0; k < 1; k++) {
    const x = Math.floor(noise(k, 2, seed) * N)
    const y = noise(k, 3, seed) < 0.5 ? 15 : 31
    if (noise(k, 4, seed) < 0.6) {
      plot(g, x, y, '8')
      plot(g, x + 1, y, '7')
      plot(g, x, y - 1, '9')
    }
  }
  return rowsOf(g)
}

export const wallTop = capstones(21)

function brickFace(seed: number, mossy: number, cracked: boolean): string[] {
  const g = canvas(N, N, '2')
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (y === 0) g[y]![x] = '6'
      else if (y < 3) g[y]![x] = y === 1 ? '5' : '4'
      else if (y === 3) g[y]![x] = '1'
      else if (y >= 29) g[y]![x] = y === 29 ? '2' : '1'
      else {
        const course = Math.floor((y - 4) / 6)
        const ly = (y - 4) % 6
        const shift = course & 1 ? 6 : 0
        const lx = (x + shift) % 12
        const brick = Math.floor((x + shift) / 12) + course * 3
        const tone = noise(brick, 0, seed)
        if (ly === 5 || lx === 11) g[y]![x] = '2'
        else if (ly === 0) g[y]![x] = lx === 10 ? '4' : '5'
        else if (ly === 4) g[y]![x] = '3'
        else if (lx === 0) g[y]![x] = '5'
        else if (lx === 10) g[y]![x] = '3'
        else g[y]![x] = tone < 0.18 ? '3' : '4'
        if (mossy > 0 && noise(brick, 1, seed) < mossy && ly < 3 && lx < 11) {
          const n = noise(x, y, seed + 3)
          if (ly === 0 || n < 0.55) g[y]![x] = ly === 0 ? (n < 0.5 ? '9' : '8') : n < 0.3 ? '7' : '8'
        }
      }
    }
  }
  if (mossy > 0) {
    for (let k = 0; k < 4; k++) {
      const x = Math.floor(noise(k, 5, seed) * N)
      const len = 3 + Math.floor(noise(k, 6, seed) * 9)
      for (let j = 0; j < len; j++) plot(g, x + (j > 4 && noise(k, j, seed) < 0.3 ? 1 : 0), 3 + j, j === len - 1 ? '7' : '8')
    }
  }
  if (cracked) {
    crack(g, 12, 5, 22, seed, '1', '')
    crack(g, 20, 14, 9, seed + 1, '1', '')
  }
  return rowsOf(g)
}

export const wallFace = brickFace(51, 0, false)
export const wallFaceMoss = brickFace(52, 0.35, false)
export const wallFaceCrack = brickFace(53, 0.1, true)

export const pit = field(N, N, (x, y) => (smooth(x, y, 61, 8, 4) > 0.72 && threshold(x, y) < 0.18 ? 'k' : '0'))

export const pitEdge = field(N, N, (x, y) => {
  if (y === 0) return '4'
  if (y < 3) return y === 1 ? '3' : '2'
  if (y === 3) return '1'
  const depth = (y - 4) / 12
  if (depth < 1) {
    const strata = (x * 7 + Math.floor(noise(x >> 2, 0, 62) * 5)) % 9 === 0 ? 0.25 : 0
    return shade('01', 1 - depth + strata - 0.2, x, y)
  }
  return smooth(x, y, 61, 8, 4) > 0.72 && threshold(x, y) < 0.18 ? 'k' : '0'
})

const RUNE = [
  '...@...',
  '..@&@..',
  '.@&W&@.',
  '@&WWW&@',
  '.@&W&@.',
  '..@&@..',
  '...@...',
]

export const pillarSunk = (() => {
  const g = canvas(N, N, '3')
  fill(g, 0, 0, N, N, (x, y) => {
    if (x === N - 1 || y === N - 1) return '2'
    if (x < 3 || y < 3 || x > N - 4 || y > N - 4) return '3'
    if (y < 7 || x < 6) return x < 6 && y >= 7 ? (x === 3 ? '0' : '1') : y === 3 ? '0' : shade('01', 0.35 + (y - 3) * 0.12, x, y)
    if (x > N - 7) return x === N - 4 ? '1' : '2'
    if (y > N - 7) return y === N - 4 ? '2' : '3'
    return y === 7 || x === 6 ? '1' : '2'
  })
  stamp(g, recolor(RUNE, '&W', '@&'), 12, 14)
  return rowsOf(g)
})()

export const pillarRaised = (() => {
  const g = canvas(N, N, '.')
  fill(g, 0, 0, N, N, (x, y) => {
    if (y >= 30) return y === 30 ? '1' : '2'
    if (y >= 22) {
      if (x === 0 || x === N - 1) return '1'
      return y === 22 ? '2' : x < 3 ? '3' : y > 27 ? '2' : (x * 3) % 8 === 0 ? '2' : '3'
    }
    if (x === 0 || x === N - 1 || y === 0) return y === 0 ? '4' : '3'
    if (y === 1 || x === 1) return '6'
    if (y === 21 || x === N - 2) return '4'
    return x + y < 22 ? '5' : '4'
  })
  stamp(g, RUNE, 12, 7)
  return rowsOf(g)
})()

function floorBack(seed: number): Grid {
  return gridOf(slabs([[0, 0, 16, 16], [16, 0, 16, 16], [0, 16, 16, 16], [16, 16, 16, 16]], seed))
}

export const ash = (() => {
  const g = floorBack(71)
  blob(g, 16, 18, 15, 11, (x, y, nx, ny) => (nx * nx + ny * ny > 0.6 && threshold(x, y) > 0.55 ? at(g, x, y) : '2'))
  const lumps: readonly Box[] = [[11, 17, 7, 5], [20, 18, 6, 4], [15, 13, 5, 4], [8, 21, 5, 3], [22, 23, 5, 3]]
  for (const [cx, cy, rx, ry] of lumps) {
    blob(g, cx, cy, rx, ry, (x, y, nx, ny) => shade('0klm', 0.55 - nx * 0.3 - ny * 0.45 + (noise(x, y, 72) - 0.5) * 0.3, x, y))
  }
  for (let k = 0; k < 9; k++) {
    const x = 7 + Math.floor(noise(k, 0, 73) * 19)
    const y = 13 + Math.floor(noise(k, 1, 73) * 12)
    if (at(g, x, y) === 'k' || at(g, x, y) === '0') plot(g, x, y, k % 3 === 0 ? 'A' : k % 3 === 1 ? 'T' : 'S')
  }
  for (let k = 0; k < 10; k++) plot(g, 3 + Math.floor(noise(k, 2, 74) * 26), 6 + Math.floor(noise(k, 3, 74) * 24), 'm')
  return rowsOf(g)
})()

export const cracked = (() => {
  const g = floorBack(81)
  blob(g, 16, 29, 14, 3, '1')
  blob(g, 16, 17, 14.5, 13.5, (x, y, nx, ny) => {
    const light = 0.7 - nx * 0.3 - ny * 0.45 + (smooth(x, y, 82, 5, 32) - 0.5) * 0.25
    if (nx * nx + ny * ny > 0.86 && nx + ny > 0.2) return '1'
    return shade('12345', light, x, y)
  })
  const path: readonly (readonly [number, number])[] = [[16, 6], [14, 11], [17, 15], [13, 20], [15, 26], [12, 29]]
  for (let k = 0; k + 1 < path.length; k++) {
    const [x0, y0] = path[k]!
    const [x1, y1] = path[k + 1]!
    line(g, x0, y0, x1, y1, '0')
    line(g, x0 + 1, y0, x1 + 1, y1, '1')
  }
  line(g, 17, 15, 25, 12, '0')
  line(g, 17, 16, 25, 13, '1')
  line(g, 14, 11, 8, 9, '0')
  line(g, 13, 20, 7, 22, '0')
  for (const [x, y] of [[21, 20], [9, 14], [22, 8]] as const) {
    plot(g, x, y, '1')
    plot(g, x + 1, y, '5')
  }
  return rowsOf(g)
})()

export const rubble = (() => {
  const g = floorBack(91)
  const stones: readonly Box[] = [[8, 9, 5, 4], [21, 7, 4, 3], [14, 17, 6, 4], [25, 20, 4, 3], [7, 23, 4, 3], [18, 26, 3, 2], [11, 14, 2, 2], [26, 12, 2, 2]]
  for (const [cx, cy, rx, ry] of stones) {
    blob(g, cx + 1, cy + 1, rx, ry, '1')
    blob(g, cx, cy, rx, ry, (x, y, nx, ny) => shade('2345', 0.6 - nx * 0.35 - ny * 0.45, x, y))
  }
  for (let k = 0; k < 14; k++) plot(g, Math.floor(noise(k, 0, 92) * N), Math.floor(noise(k, 1, 92) * N), k & 1 ? '4' : '2')
  return rowsOf(g)
})()

function opening(inside: (x: number, y: number, top: number) => string): string[] {
  const g = gridOf(brickFace(54, 0, false))
  const top = (x: number) => {
    const u = (x + 0.5 - H) / 9
    return 7 + Math.round(5 * (1 - Math.sqrt(Math.max(0, 1 - u * u))))
  }
  for (let x = 5; x < 27; x++) {
    const ring = x < 7 || x > 24 ? 0 : top(x)
    for (let y = 3; y < N; y++) {
      const inOpening = x >= 7 && x <= 24 && y >= top(x)
      if (inOpening) g[y]![x] = inside(x, y, top(x))
      else if (x === 5 || x === 26 || (y >= ring - 2 && y < ring && x >= 7 && x <= 24)) g[y]![x] = y < 4 ? '1' : (x + y) % 5 === 0 ? '2' : x === 26 ? '3' : '5'
      else if (x === 6 || x === 25) g[y]![x] = x === 6 ? '4' : '2'
    }
  }
  return rowsOf(g)
}

function passage(x: number, y: number, top: number): string {
  const d = (y - top) / (N - top)
  if (x === 7 || x === 24) return '0'
  return shade('0k123', d * 1.05 - 0.1, x, y)
}

export const door = opening((x, y, top) => {
  if (y === top) return 'c'
  const lx = (x - 7) % 4
  if (y === 12 || y === 13 || y === 24 || y === 25) {
    if (lx === 1 && (y === 12 || y === 24)) return 'o'
    return y === 12 || y === 24 ? 'n' : 'm'
  }
  if (x >= 19 && x <= 21 && y >= 17 && y <= 20) return (x === 20 && (y === 17 || y === 20)) || ((x === 19 || x === 21) && (y === 18 || y === 19)) ? (x === 19 ? 'U' : 'A') : y === 18 && x === 20 ? 'K' : lx === 3 ? 'c' : 'e'
  if (y === N - 1) return 'c'
  if (lx === 3) return 'c'
  if (lx === 0) return 'f'
  return noise(x, y >> 2, 55) < 0.2 ? 'd' : 'e'
})

export const doorOpen = opening((x, y, top) => {
  if (x <= 9) return x === 9 ? 'c' : x === 8 ? 'e' : 'f'
  return passage(x, y, top)
})

export const gate = opening((x, y, top) => {
  const bar = (x - 8) % 4
  const back = passage(x, y, top)
  if (y === 15 || y === 26) return y === 15 ? 'F' : 'E'
  if (y === 16 || y === 27) return 'D'
  if (bar === 0) return 'F'
  if (bar === 1) return y === N - 1 ? 'D' : 'E'
  return back
})

export const gateOpen = opening((x, y, top) => {
  const bar = (x - 8) % 4
  if (y < top + 3) return bar === 0 ? 'F' : bar === 1 ? 'E' : y === top ? 'D' : passage(x, y, top)
  if (y === top + 3 && (bar === 0 || bar === 1)) return 'D'
  return passage(x, y, top)
})

export const seal = opening((x, y, top) => {
  if (x === 7 || x === 24 || y === top) return '1'
  const dx = x + 0.5 - H
  const dy = y + 0.5 - 20
  const d = Math.hypot(dx, dy)
  if (d > 5.2 && d < 7) return d < 6.1 ? '9' : '8'
  if (d < 2.2) return d < 1.2 ? 'W' : '9'
  if ((Math.abs(dx) < 0.6 || Math.abs(dy) < 0.6) && d < 5.2) return '8'
  if (Math.abs(Math.abs(dx) - Math.abs(dy)) < 0.6 && d > 7 && d < 9.5) return '7'
  return shade('345', 0.55 - (x - 8) * 0.02 + (y < top + 3 ? 0.2 : 0), x, y)
})

export const sealOpen = opening((x, y, top) => {
  const back = passage(x, y, top)
  const stones: readonly Box[] = [[11, 28, 3, 2], [18, 29, 4, 2], [22, 26, 2, 2], [14, 25, 2, 1]]
  for (const [cx, cy, rx, ry] of stones) {
    const nx = (x + 0.5 - cx) / rx
    const ny = (y + 0.5 - cy) / ry
    if (nx * nx + ny * ny < 1) return shade('345', 0.6 - nx * 0.3 - ny * 0.4, x, y)
  }
  return back
})

export const stairs = field(N, N, (x, y) => {
  if (x < 3 || x > N - 4) {
    if (x === 0 || x === N - 1) return '1'
    return x === 1 || x === N - 3 ? '4' : '3'
  }
  if (x === 3 || x === N - 4) return '1'
  const stepIndex = Math.floor((y + 2) / 6)
  const ly = (y + 2) % 6
  const tread = '012344'[stepIndex]!
  if (ly === 0) return stepIndex === 0 ? '0' : '0123'[stepIndex - 1] ?? '3'
  if (ly === 1) return stepIndex === 0 ? '0' : '01234'[stepIndex - 1] ?? '3'
  if (ly === 5) return '012345'[stepIndex + 1] ?? '5'
  return x === 4 ? '012345'[stepIndex + 1] ?? tread : tread
})

export const barricade = (() => {
  const g = floorBack(101)
  fill(g, 0, 27, N, 4, (x, y) => (y === 27 ? '1' : threshold(x, y) < 0.5 ? '2' : at(g, x, y)))
  for (const py of [9, 19]) {
    fill(g, 0, py, N, 5, (x, y) => {
      const ly = y - py
      if (ly === 0) return 'h'
      if (ly === 4) return 'c'
      return (x * 5 + py) % 11 === 0 ? 'd' : ly === 1 ? 'f' : 'e'
    })
  }
  for (let k = 0; k < 4; k++) {
    const sx = 2 + k * 8
    const tipY = 1 + (k & 1) * 2
    for (let y = tipY; y < 29; y++) {
      const half = y - tipY < 3 ? (y - tipY) * 0.7 : 2.5
      for (let x = sx; x < sx + 5; x++) {
        const lx = x + 0.5 - (sx + 2.5)
        if (Math.abs(lx) > half) continue
        g[y]![x] = y - tipY < 2 ? 'h' : lx < -1 ? 'f' : lx > 1 ? 'c' : noise(x, y >> 1, 102) < 0.25 ? 'd' : 'e'
      }
    }
    for (const ry of [11, 21]) {
      plot(g, sx + 1, ry, 'h')
      plot(g, sx + 2, ry, '5')
      plot(g, sx + 3, ry, 'h')
      plot(g, sx + 2, ry + 1, 'f')
    }
  }
  return rowsOf(g)
})()

export const wallDecals: readonly Rows[] = (() => {
  const torch = (flame: readonly string[]) => {
    const g = canvas(10, 24)
    stamp(g, flame, 0, 0)
    fill(g, 3, 9, 4, 2, (_x, y) => (y === 9 ? 'n' : 'm'))
    fill(g, 4, 11, 2, 9, (x) => (x === 4 ? 'e' : 'c'))
    fill(g, 2, 14, 6, 2, (_x, y) => (y === 14 ? 'o' : 'm'))
    fill(g, 1, 20, 8, 2, (_x, y) => (y === 20 ? 'n' : 'm'))
    plot(g, 1, 19, 'm')
    plot(g, 8, 19, 'm')
    return inked(g, '0')
  }
  const flameA = [
    '....U.....',
    '...UA.....',
    '...AUA....',
    '..TAUAT...',
    '..TAUUT...',
    '..STUATS..',
    '..SAUAS...',
    '...STTS...',
    '....SS....',
  ]
  const flameB = [
    '.....U....',
    '.....AU...',
    '....AUA...',
    '...TAUT...',
    '..TAUUAT..',
    '..STAUTS..',
    '...SAUS...',
    '...STTS...',
    '....SS....',
  ]
  const banner = (() => {
    const g = canvas(16, 26)
    fill(g, 0, 0, 16, 2, (_x, y) => (y === 0 ? 'h' : 'd'))
    for (let y = 2; y < 26; y++) {
      for (let x = 1; x < 15; x++) {
        const tail = y > 19 && Math.abs(x + 0.5 - 8) < (y - 19) * 1.2
        if (tail) continue
        const fold = (x - 1) % 4
        g[y]![x] = x === 1 || x === 14 ? '7' : fold === 0 ? '9' : fold === 3 ? '7' : '8'
      }
    }
    const crest = ['..U..', '.UAU.', 'UAKAU', '.UAU.', '..U..']
    stamp(g, crest, 6, 8)
    return inked(g, '0')
  })()
  const vine = (() => {
    const g = canvas(10, 24)
    let x = 4
    for (let y = 0; y < 24; y++) {
      if (noise(y, 0, 111) < 0.3) x += noise(y, 1, 111) < 0.5 ? -1 : 1
      x = x < 2 ? 2 : x > 7 ? 7 : x
      plot(g, x, y, '7')
      if (y % 4 === 1) {
        const side = y % 8 === 1 ? 1 : -1
        plot(g, x + side, y, '8')
        plot(g, x + side * 2, y, '9')
        plot(g, x + side, y + 1, '8')
        plot(g, x + side * 2, y - 1, '8')
      }
    }
    return rowsOf(g)
  })()
  const chain = (() => {
    const g = canvas(5, 22)
    for (let k = 0; k < 7; k++) {
      const y = k * 3
      if (k & 1) {
        plot(g, 2, y, 'o')
        plot(g, 2, y + 1, 'n')
        plot(g, 2, y + 2, 'm')
      } else {
        plot(g, 1, y, 'n')
        plot(g, 3, y, 'm')
        plot(g, 1, y + 1, 'o')
        plot(g, 3, y + 1, 'm')
        plot(g, 2, y + 2, 'm')
        plot(g, 2, y - 1 < 0 ? 0 : y - 1, 'n')
      }
    }
    fill(g, 1, 21, 3, 1, 'm')
    return rowsOf(g)
  })()
  return [torch(flameA), torch(flameB), banner, vine, chain]
})()

export const WALL_TORCH = 0
export const WALL_BANNER = 2
export const WALL_VINE = 3
export const WALL_CHAIN = 4

export const floorDecals: readonly Rows[] = (() => {
  const crackDecal = (() => {
    const g = canvas(12, 12, '.')
    const pts: readonly (readonly [number, number])[] = [[0, 1], [3, 3], [4, 6], [7, 7], [8, 10], [11, 11]]
    for (let k = 0; k + 1 < pts.length; k++) line(g, pts[k]![0], pts[k]![1], pts[k + 1]![0], pts[k + 1]![1], '1')
    line(g, 4, 6, 1, 9, '1')
    plot(g, 4, 4, '4')
    plot(g, 8, 8, '4')
    return rowsOf(g)
  })()
  const moss = (() => {
    const g = canvas(12, 8)
    blob(g, 6, 4, 6, 3.6, (x, y, nx, ny) => (nx * nx + ny * ny > 0.55 && noise(x, y, 121) < 0.5 ? '.' : shade('789', 0.6 - nx * 0.3 - ny * 0.4, x, y)))
    return rowsOf(g)
  })()
  const puddle = (() => {
    const g = canvas(14, 8)
    blob(g, 7, 4, 7, 4, '2')
    blob(g, 7, 4, 6, 3, (_x, _y, nx, ny) => (ny < -0.4 ? 'L' : nx > 0.3 && ny > 0.1 ? 'N' : 'M'))
    plot(g, 4, 3, 'O')
    plot(g, 5, 3, 'P')
    plot(g, 9, 5, 'N')
    return rowsOf(g)
  })()
  const rune = (() => {
    const g = canvas(11, 11)
    blob(g, 5.5, 5.5, 5.5, 5.5, (x, y, nx, ny) => (nx * nx + ny * ny > 0.62 ? (threshold(x, y) < 0.7 ? '7' : '.') : '.'))
    line(g, 5, 2, 5, 8, '8')
    line(g, 3, 4, 7, 4, '8')
    plot(g, 5, 5, '9')
    return rowsOf(g)
  })()
  const pebbles = (() => {
    const g = canvas(12, 7)
    for (const [cx, cy, r] of [[3, 3, 2.4], [8, 4, 1.8], [10, 1.6, 1.2]] as const) {
      blob(g, cx + 0.6, cy + 0.8, r, r * 0.75, '2')
      blob(g, cx, cy, r, r * 0.75, (x, y, nx, ny) => shade('345', 0.6 - nx * 0.3 - ny * 0.5, x, y))
    }
    return rowsOf(g)
  })()
  const shards = [
    '..5.......',
    '.54.....4.',
    '..2...543.',
    '.......2..',
    '...4......',
    '..432.....',
  ]
  return [crackDecal, moss, puddle, rune, pebbles, shards]
})()

export const TEMPLATES: readonly Rows[] = [
  floorA, floorB, floorC, floorD, wallTop, wallFace, pit, pitEdge, pillarSunk, pillarRaised, ash, cracked, rubble, door, doorOpen, gate, gateOpen, seal, sealOpen, stairs, barricade, wallFaceMoss, wallFaceCrack,
]

export const T_FLOOR_A = 0
export const T_FLOOR_B = 1
export const T_FLOOR_C = 2
export const T_FLOOR_D = 3
export const T_WALL_TOP = 4
export const T_WALL_FACE = 5
export const T_PIT = 6
export const T_PIT_EDGE = 7
export const T_PILLAR_SUNK = 8
export const T_PILLAR_RAISED = 9
export const T_ASH = 10
export const T_CRACKED = 11
export const T_RUBBLE = 12
export const T_DOOR = 13
export const T_DOOR_OPEN = 14
export const T_GATE = 15
export const T_GATE_OPEN = 16
export const T_SEAL = 17
export const T_SEAL_OPEN = 18
export const T_STAIRS = 19
export const T_BARRICADE = 20
export const T_WALL_FACE_MOSS = 21
export const T_WALL_FACE_CRACK = 22

const RAMP_SYMBOLS = '123456789'

export const TILESET_RAMPS: readonly string[] = [
  'lmnopquvw',
  'klmnopt%v',
  'mnopqWVXY',
  '0klmnoRST',
  'mopqWWMNO',
  'klDEFpBCa',
  'c@&hqWXYZ',
]

export function paintTemplate(template: Rows, tileset: number): string[] {
  return recolor(template, RAMP_SYMBOLS, TILESET_RAMPS[tileset]!)
}

function tuftMark(g: Grid, x: number, y: number, big: boolean): void {
  wrapPlot(g, x, y, 'u')
  wrapPlot(g, x - 1, y - 1, 'u')
  wrapPlot(g, x + 1, y - 1, 'u')
  wrapPlot(g, x - 2, y - 2, 'w')
  wrapPlot(g, x + 2, y - 2, '2')
  if (big) {
    wrapPlot(g, x, y - 1, 'u')
    wrapPlot(g, x, y - 2, '2')
    wrapPlot(g, x, y - 3, 'w')
  }
}

function grassBase(seed: number): string[] {
  const g = canvas(N, N, 'v')
  for (let k = 0; k < 9; k++) {
    const x = Math.floor(noise(k, 0, seed) * N)
    const y = Math.floor(noise(k, 1, seed) * N)
    tuftMark(g, x, y, noise(k, 2, seed) < 0.4)
  }
  for (let k = 0; k < 7; k++) {
    const x = Math.floor(noise(k, 3, seed) * N)
    const y = Math.floor(noise(k, 4, seed) * N)
    wrapPlot(g, x, y, '2')
    wrapPlot(g, x + 1, y, noise(k, 5, seed) < 0.5 ? '2' : 'w')
  }
  return rowsOf(g)
}

export const grassFrames = [grassBase(71), grassBase(72), grassBase(73), grassBase(74)]

function shadowed(rows: Rows, cx: number, cy: number, rx: number, ry: number): string[] {
  return rows.map((row, y) => {
    let out = ''
    for (let x = 0; x < row.length; x++) {
      const dx = (x + 0.5 - cx) / rx
      const dy = (y + 0.5 - cy) / ry
      const d = dx * dx + dy * dy
      const key = row[x]!
      const deep = key === 'u' ? 't' : 'u'
      out += d < 0.45 ? deep : d < 1 && threshold(x, y) > (d - 0.45) / 0.55 ? (key === 'w' || key === '2' ? 'v' : deep) : key
    }
    return out
  })
}

export const treeGround = grassFrames.map(rows => shadowed(rows, 16.5, 27, 15, 5.5))

type Blade = readonly [number, number, number]

function tuft(list: readonly Blade[], swayBy: number, w: number, h: number, lit: string, dark: string): string[] {
  const g = canvas(w, h)
  list.forEach(([bx, height, lean], b) => {
    const keys = b % 2 === 0 ? lit : dark
    for (let k = 0; k < height; k++) {
      const p = k / Math.max(1, height - 1)
      const x = Math.round(bx + (lean + swayBy * (height > 4 ? 1 : 0.5)) * p * p)
      plot(g, x, h - 1 - k, shade(keys, 0.1 + p * 0.9, x, h - 1 - k))
    }
  })
  return rowsOf(g)
}

const TUFT_A: readonly Blade[] = [[2, 6, -2], [4, 10, -1.2], [5, 7, -0.4], [6, 11, 0.5], [7, 8, 1.2], [9, 9, 2], [10, 5, 2.5]]
const TUFT_B: readonly Blade[] = [[2, 7, -1.5], [4, 9, -0.5], [6, 6, 0.4], [7, 8, 1], [9, 6, 1.8]]
const REEDS: readonly Blade[] = [[2, 12, -1.5], [4, 17, -0.4], [5, 14, 0.4], [7, 16, 1.2], [9, 10, 2]]

function flowers(points: readonly (readonly [number, number])[], petal: string, shadow: string, heart: string, w: number, h: number): string[] {
  const g = canvas(w, h)
  for (const [x, y] of points) {
    line(g, x, y + 2, x + (x & 1 ? 1 : 0), h - 1, 'u')
    plot(g, x - 1, h - 1, '2')
    plot(g, x, y - 1, petal)
    plot(g, x - 1, y, petal)
    plot(g, x + 1, y, shadow)
    plot(g, x, y + 1, shadow)
    plot(g, x, y, heart)
  }
  return rowsOf(g)
}

export const grassDecals: readonly Rows[] = [
  tuft(TUFT_A, 0, 14, 12, 'u2w3', 'tuv2'),
  tuft(TUFT_A, 1.5, 14, 12, 'u2w3', 'tuv2'),
  tuft(TUFT_B, 0, 12, 10, 'uv2w', 'tuv2'),
  tuft(TUFT_B, 1.5, 12, 10, 'uv2w', 'tuv2'),
  (() => {
    const g = canvas(11, 8)
    for (const [cx, cy] of [[2.5, 3], [6, 2.5], [8.5, 5.5], [4, 6]] as const) {
      blob(g, cx - 1, cy, 1.4, 1.2, (x, y, nx, ny) => shade('uvw3', 0.6 - nx * 0.3 - ny * 0.5, x, y))
      blob(g, cx + 1, cy, 1.4, 1.2, (x, y, nx, ny) => shade('uvw3', 0.5 - nx * 0.3 - ny * 0.5, x, y))
      blob(g, cx, cy - 1.2, 1.4, 1.2, (x, y, nx, ny) => shade('uvw3', 0.7 - nx * 0.3 - ny * 0.5, x, y))
      plot(g, cx, cy, 'u')
    }
    return rowsOf(g)
  })(),
  flowers([[2, 2], [7, 4], [4, 7]], 'W', 'q', 'A', 10, 11),
  flowers([[2, 3], [6, 2], [8, 6]], 'U', 'A', 'K', 11, 10),
  flowers([[3, 2], [7, 5]], 'Q', 'a', 'W', 10, 9),
  (() => {
    const g = canvas(12, 10)
    blob(g, 6, 8.6, 5, 1.6, 'u')
    for (const [cx, cy, r] of [[4, 4.5, 3.2], [8.6, 6.2, 2.2]] as const) {
      fill(g, Math.round(cx) - 1, Math.round(cy), 2, Math.round(r + 1.4), (x) => (x === Math.round(cx) - 1 ? 'q' : 'p'))
      blob(g, cx, cy, r, r * 0.7, (x, y, nx, ny) => (ny > 0.45 ? 'R' : shade('RSS7', 0.75 - nx * 0.4 - ny * 0.5, x, y)))
      plot(g, cx - 1, cy - 1, 'W')
      plot(g, cx + 1, cy, 'q')
    }
    return rowsOf(g)
  })(),
  (() => {
    const g = canvas(12, 7)
    for (const [cx, cy, r] of [[3, 3.4, 2.6], [8.4, 4.2, 2], [10.2, 2, 1.2]] as const) {
      blob(g, cx + 0.7, cy + 1, r, r * 0.7, 'u')
      blob(g, cx, cy, r, r * 0.72, (x, y, nx, ny) => shade('mnop', 0.6 - nx * 0.3 - ny * 0.5, x, y))
    }
    return rowsOf(g)
  })(),
]

export const DECAL_TUFT_A = 0
export const DECAL_TUFT_B = 2
export const DECAL_CLOVER = 4
export const DECAL_DAISY = 5
export const DECAL_BUTTERCUP = 6
export const DECAL_BELL = 7
export const DECAL_MUSHROOM = 8
export const DECAL_PEBBLES = 9

export const reeds = [0, 1.5].map(swayBy => {
  const g = gridOf(tuft(REEDS, swayBy, 13, 18, 'u1v2w', 'tu1v'))
  for (const [x, len] of [[4, 4], [7, 3]] as const) {
    let top = 0
    while (top < 18 && g[top]![x] === '.') top++
    for (let k = 0; k < len; k++) plot(g, x + Math.round(swayBy * 0.6), top + k, k === 0 ? 'e' : 'd')
  }
  return rowsOf(g)
})

export const lily = (() => {
  const g = canvas(12, 8)
  blob(g, 6, 4.4, 6, 3.4, 'L')
  blob(g, 6, 4, 5.6, 3.2, (x, y, nx, ny) => (Math.abs(nx) < 0.18 && ny < 0 ? 'M' : shade('uvw', 0.55 - nx * 0.3 - ny * 0.5, x, y)))
  return rowsOf(g)
})()

export const lilyFlower = (() => {
  const g = gridOf(lily)
  stamp(g, ['.W.', 'QUQ', '.Q.'], 6, 1)
  return rowsOf(g)
})()

function roadFrame(seed: number, ruts: number): string[] {
  const g = canvas(N, N, 'e')
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const n = smooth(x, y, seed, 6, 32)
      const m = smooth(x, y, seed + 9, 4, 8)
      if (n > 0.74 && m > 0.45) g[y]![x] = 'f'
      else if (n < 0.16 && m < 0.5) g[y]![x] = 'd'
      else if (m > 0.86) g[y]![x] = 'f'
    }
  }
  if (ruts > 0) {
    for (let a = 0; a < N; a++) {
      for (const base of [8, 22]) {
        const wob = Math.round(Math.sin(((a + base) * Math.PI * 2) / 32) * 0.8)
        const b = base + wob
        const put = (p: number, q: number, key: string) => (ruts === 1 ? plot(g, p, q, key) : plot(g, q, p, key))
        put(a, b, noise(a, base, seed) < 0.15 ? 'c' : 'd')
        if (noise(a, base + 2, seed) < 0.55) put(a, b + 1, 'd')
        put(a, b + 2, noise(a, base + 1, seed) < 0.5 ? 'f' : 'e')
      }
    }
  }
  for (let k = 0; k < 6; k++) {
    const x = 1 + Math.floor(noise(k, 7, seed) * (N - 4))
    const y = 1 + Math.floor(noise(k, 8, seed) * (N - 4))
    if (k < 2) {
      plot(g, x, y, 'h')
      plot(g, x + 1, y, 'f')
      plot(g, x, y + 1, 'f')
      plot(g, x + 1, y + 1, 'd')
      plot(g, x + 2, y + 1, 'c')
      plot(g, x + 1, y + 2, 'c')
    } else if (k < 4) {
      plot(g, x, y, 'h')
      plot(g, x + 1, y, 'd')
      plot(g, x, y + 1, 'c')
    } else {
      plot(g, x, y, 'd')
      plot(g, x + 1, y, 'f')
    }
  }
  return rowsOf(g)
}

export const roadFrames = [roadFrame(81, 0), roadFrame(82, 0), roadFrame(83, 1), roadFrame(84, 2)]

function sideField(dir: number, pick: (a: number, b: number) => string): string[] {
  return field(N, N, (x, y) => {
    if (dir === 0) return pick(x, y)
    if (dir === 1) return pick(y, N - 1 - x)
    if (dir === 2) return pick(x, N - 1 - y)
    return pick(y, x)
  })
}

function grassFringe(dir: number): string[] {
  return sideField(dir, (a, b) => {
    const depth = 2 + Math.floor(smooth(a, dir, 91, 5, 32) * 4)
    const blade = noise(a, dir, 92)
    const tip = blade < 0.22 ? 3 : blade < 0.45 ? 1 : 0
    if (b < depth - 1) return noise(a, b, 93) < 0.06 ? 'u' : 'v'
    if (b === depth - 1) return tip ? 'v' : 'u'
    if (b < depth - 1 + tip) return b === depth - 2 + tip ? (blade < 0.1 ? 'w' : '2') : 'v'
    if (b === depth - 1 + tip && tip) return 'u'
    if (b === depth + (tip ? tip : 0) && threshold(a, b) < 0.5) return 'd'
    if (b === depth && !tip) return 'd'
    return '.'
  })
}

export const roadFringe = [0, 1, 2, 3].map(grassFringe)

function waterFrame(f: number, bank: boolean): string[] {
  return field(N, N, (x, y) => {
    if (bank) {
      if (y === 0) return noise(x >> 1, 0, 103) < 0.5 ? 'd' : 'c'
      if (y === 1) return noise(x, 1, 103) < 0.35 ? 'c' : 'J'
      if (y < 4) return 'J'
      if (y < 9) return 'L'
      if (y < 13) return shade('LM', (y - 9) / 4, x, y)
    }
    const row = y & 7
    const lane = y >> 3
    const off = Math.floor(hash(lane, 0, 105) * 32)
    const len = 4 + Math.floor(hash(lane, 1, 105) * 4)
    const lead = (x + f * 2 + off) & 31
    const second = (x + f * 2 + off + 13 + lane * 3) & 31
    if (row === 2 && (lead < len || second < len - 2)) return lead === 2 && f === lane ? 'P' : lead < len && lead > 0 && lead < 3 ? 'O' : 'N'
    if (row === 3 && (lead > 0 && lead < len - 1)) return 'L'
    const back = (x - f + Math.floor(hash(lane, 2, 105) * 32) + 64) & 31
    if (row === 6 && back < 3) return 'N'
    return 'M'
  })
}

export const waterFrames = [0, 1, 2, 3].map(f => waterFrame(f, false))
export const waterBankFrames = [0, 1, 2, 3].map(f => waterFrame(f, true))

function foam(dir: number, f: number): string[] {
  return sideField(dir, (a, b) => {
    const wave = ((a + f * 3) & 7) < 3
    const n = noise(a, f, 111 + dir)
    if (b === 0) return wave ? 'P' : 'O'
    if (b === 1) return n < 0.6 ? (wave ? 'O' : 'P') : 'N'
    if (b === 2) return n < 0.35 ? 'O' : 'N'
    if (b < 5) return noise(a, b + f, 115) < 0.3 - b * 0.05 ? 'O' : threshold(a, b) < 0.5 ? 'N' : '.'
    if (b < 8 && threshold(a, b) < 0.18) return 'N'
    return '.'
  })
}

export const foamFrames = [1, 2, 3].flatMap(dir => [foam(dir, 0), foam(dir, 1)])

export const ice = (() => {
  const g = gridOf(field(N, N, (x, y) => {
    const band = (x + y + 64) % 32
    if (band >= 6 && band < 10) return band === 7 || band === 8 ? 'P' : shade('OP', 0.5, x, y)
    if (band === 22) return threshold(x, y) < 0.5 ? 'P' : 'O'
    return smooth(x, y, 122, 8, 4) > 0.7 ? shade('NO', 0.7, x, y) : 'O'
  }))
  crack(g, 4, 18, 10, 123, 'N', 'P')
  crack(g, 22, 3, 8, 124, 'N', 'P')
  for (const [x, y] of [[9, 5], [25, 20], [15, 27]] as const) {
    plot(g, x, y, 'W')
    plot(g, x - 1, y, 'P')
    plot(g, x + 1, y, 'P')
    plot(g, x, y - 1, 'P')
  }
  return rowsOf(g)
})()

function lavaFrame(f: number): string[] {
  const seeds: number[] = []
  for (let iy = 0; iy < 3; iy++) for (let ix = 0; ix < 3; ix++) seeds.push(ix * 11 + 2 + noise(ix, iy, 131) * 7, iy * 11 + 2 + noise(ix, iy, 132) * 7)
  return field(N, N, (x, y) => {
    let first = 99
    let second = 99
    for (let k = 0; k < seeds.length; k += 2) {
      for (let oy = -N; oy <= N; oy += N) {
        for (let ox = -N; ox <= N; ox += N) {
          const d = Math.hypot(x + 0.5 - seeds[k]! - ox, y + 0.5 - seeds[k + 1]! - oy)
          if (d < first) {
            second = first
            first = d
          } else if (d < second) second = d
        }
      }
    }
    const gap = second - first
    const pulse = f === 1 ? 0.4 : f === 2 ? -0.3 : 0
    if (gap < 1 + pulse) return noise(x, y, 133 + f) < 0.5 ? 'U' : 'A'
    if (gap < 2 + pulse) return 'A'
    if (gap < 2.8 + pulse) return 'T'
    if (gap < 3.6) return 'S'
    if (gap < 4.4) return 'R'
    const lit = 0.55 - first / 14 + (smooth(x, y, 134, 4, 8) - 0.5) * 0.4
    return lit > 0.42 ? shade('rR', 0.4, x, y) : lit > 0.18 ? 'r' : threshold(x, y) < 0.5 ? 'k' : 'r'
  })
}

export const lavaFrames = [lavaFrame(0), lavaFrame(1), lavaFrame(2)]

function bridgeFrame(railA: boolean, railB: boolean, across: boolean): string[] {
  return field(N, N, (fx, fy) => {
    const x = across ? fy : fx
    const y = across ? fx : fy
    const rail = (x < 3 && railA) || (x > N - 4 && railB)
    if (rail) {
      if (x === 0 || x === N - 1) return 'b'
      const post = y % 16 < 3
      if (post) return y % 16 === 0 ? 'h' : x === 1 || x === N - 3 ? 'f' : 'd'
      return x === 1 || x === N - 3 ? 'e' : 'c'
    }
    const plank = Math.floor(y / 6)
    const ly = y % 6
    const tone = noise(plank, 0, 141)
    if (ly === 5) return 'b'
    if (ly === 4) return 'd'
    if (ly === 0) return tone < 0.3 ? 'f' : 'h'
    if ((x === 5 || x === N - 6) && ly === 2) return 'n'
    if (noise(x >> 2, y, 142 + plank) < 0.12) return 'd'
    return tone < 0.3 ? 'e' : tone > 0.8 ? shade('ef', 0.5, x, y) : 'f'
  })
}

export const BRIDGE_ACROSS = 4
export const BRIDGE_RAIL_A = 2
export const BRIDGE_RAIL_B = 1
export const bridgeFrames = [0, 1, 2, 3, 4, 5, 6, 7].map(k => bridgeFrame((k & BRIDGE_RAIL_A) !== 0, (k & BRIDGE_RAIL_B) !== 0, (k & BRIDGE_ACROSS) !== 0))

type Cluster = readonly [number, number, number]

function trunkInto(g: Grid, cx: number, top: number, bottom: number, width: number, seed: number): void {
  for (let y = top; y <= bottom; y++) {
    const flare = y > bottom - 5 ? (y - (bottom - 5)) * 1.2 : 0
    const half = width / 2 + flare
    for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) {
      const t = (x + 0.5 - cx) / half
      if (Math.abs(t) > 1) continue
      if (y === bottom && Math.abs(t) > 0.75 && hash(x, y, seed) < 0.5) continue
      const groove = hash(x, y >> 2, seed) < 0.16 && Math.abs(t) < 0.7
      const shadowed = y < top + 4
      let key = t < -0.5 ? 'f' : t < 0 ? 'e' : t < 0.55 ? 'd' : 'c'
      if (groove) key = key === 'f' ? 'e' : 'c'
      if (shadowed) key = key === 'f' || key === 'e' ? 'd' : 'c'
      plot(g, x, y, key)
    }
  }
}

function canopy(w: number, h: number, clusters: readonly Cluster[], trunkTop: number, trunkW: number, seed: number, keys = 'tuv2w3'): string[] {
  const g = canvas(w, h)
  let top = h
  let bottom = 0
  for (const [, cy, r] of clusters) {
    top = Math.min(top, cy - r)
    bottom = Math.max(bottom, cy + r)
  }
  if (trunkW > 0) trunkInto(g, w / 2, trunkTop, h - 1, trunkW, seed)
  const span = bottom - top
  clusters.forEach(([bx, by, r], c) => {
    for (let y = Math.floor(by - r - 1); y <= Math.ceil(by + r + 1); y++) {
      for (let x = Math.floor(bx - r - 1); x <= Math.ceil(bx + r + 1); x++) {
        const nx = (x + 0.5 - bx) / r
        const ny = (y + 0.5 - by) / r
        const d = Math.sqrt(nx * nx + ny * ny)
        const angle = Math.atan2(ny, nx)
        const edge = 1 + Math.sin(angle * 7 + c * 1.7) * 0.07 + (hash(x, y, seed + c) - 0.5) * 0.12
        if (d > edge) continue
        const global = 0.5 - (y - top) / span
        let light = 0.5 - nx * 0.22 - ny * 0.34 + global * 0.42
        if (d > edge - 0.22 && nx * 0.5 + ny > 0.05) light -= 0.26
        let key = band(keys, light, x, y, 0.34)
        if (light > 0.66 && d < edge - 0.25 && hash(x, y, seed + 40) < 0.14) {
          key = 'I'
          plot(g, x - 1, y + 1, 'w')
        }
        plot(g, x, y, key)
      }
    }
  })
  return inked(g, 's')
}

function pine(w: number, h: number, tiers: number, seed: number): string[] {
  const g = canvas(w, h)
  const owner = canvas(w, h, '')
  const cx = w / 2
  const crown = h - 9
  const stepY = crown / (tiers + 0.6)
  trunkInto(g, cx, crown - 6, h - 1, 5, seed)
  for (let k = tiers - 1; k >= 0; k--) {
    const top = Math.floor(k * stepY)
    const bottom = Math.floor(top + stepY * 1.6)
    const reach = 4 + (k + 1) * ((w / 2 - 4) / tiers)
    for (let y = top; y <= bottom; y++) {
      const p = (y - top) / (bottom - top)
      for (let x = 0; x < w; x++) {
        const dx = x + 0.5 - cx
        const span = (k === 0 ? 0.6 : reach * 0.3) + p * reach * (k === 0 ? 1 : 0.7)
        const tooth = ((x + k * 2) % 4) < 2 ? 1 : 0
        if (Math.abs(dx) > span - (p > 0.8 ? tooth : 0)) continue
        if (p > 0.9 && tooth && Math.abs(dx) < span - 2) continue
        const nx = dx / span
        const light = 0.66 - nx * 0.34 - p * 0.3 - k * 0.025 + (p < 0.2 ? 0.08 : 0)
        g[y]![x] = band('t!u1v2', light, x, y, 0.3)
        owner[y]![x] = String(k)
      }
    }
  }
  for (let y = h - 1; y > 1; y--) {
    for (let x = 0; x < w; x++) {
      const k = owner[y]![x]!
      if (!k) continue
      const above = owner[y - 1]![x]!
      const above2 = owner[y - 2]![x]!
      if (above && above < k) g[y]![x] = 't'
      else if (above2 && above2 < k) g[y]![x] = 'u'
    }
  }
  return inked(g, 's')
}

function sway(rows: Rows, dx: number): string[] {
  const h = rows.length
  return rows.map((row, y) => {
    const shift = y < h * 0.3 ? dx : y < h * 0.55 && dx > 1 ? dx - 1 : 0
    if (shift === 0) return row
    return ('.'.repeat(shift) + row).slice(0, row.length)
  })
}

const oak = canopy(62, 76, [
  [31, 13, 11], [19, 18, 10], [43, 18, 10],
  [11, 30, 10], [51, 30, 10], [25, 27, 12], [38, 28, 12],
  [17, 41, 11], [45, 41, 11], [31, 42, 12],
], 50, 8, 151)
const elm = canopy(50, 80, [
  [25, 11, 9], [17, 19, 9], [33, 19, 9],
  [12, 30, 9], [38, 30, 9], [25, 27, 11],
  [16, 41, 10], [34, 41, 10], [25, 46, 10],
], 52, 7, 152, 'tu12w3')
const bush = canopy(36, 26, [[11, 12, 8], [25, 12, 8], [18, 9, 8], [9, 17, 7], [27, 17, 7], [18, 17, 8]], 0, 0, 153)
const fir = pine(42, 80, 5, 154)

export const TREE_LOOKS = 4
export const treeFrames: readonly Rows[] = [oak, sway(oak, 1), elm, sway(elm, 1), fir, sway(fir, 1), bush, sway(bush, 1)]

function boulders(seed: number, face: boolean): string[] {
  const g = canvas(N, N)
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (face && y >= 26) g[y]![x] = y === 26 ? 't' : y === 27 ? 'u' : hash(x, y, seed) < 0.06 ? '2' : 'v'
      else g[y]![x] = smooth(x, y, seed + 7, 4, 8) < 0.4 ? '0' : 'k'
    }
  }
  const rocks: number[] = []
  const rows = face ? 1 : 2
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < 3; k++) {
      const jitter = hash(k, r, seed)
      rocks.push(3 + k * 13 + (jitter - 0.5) * 6, (face ? 9 : 8 + r * 16) + (hash(k, r + 5, seed) - 0.5) * 4, 7 + hash(k, r + 9, seed) * 3)
    }
  }
  for (let k = 0; k < rocks.length; k += 3) {
    const bx = rocks[k]!
    const by = rocks[k + 1]!
    const r = rocks[k + 2]!
    const depth = face ? 25 - by : r * 0.55
    for (let y = Math.floor(by - r); y <= Math.ceil(by + depth + 1); y++) {
      for (let x = Math.floor(bx - r - 1); x <= Math.ceil(bx + r + 1); x++) {
        const nx = (x + 0.5 - bx) / r
        const ny = (y + 0.5 - by) / (r * 0.85)
        const d = nx * nx + ny * ny
        const wx = ((x % N) + N) % N
        if (y < 0 || y >= N || (face && y >= 26)) continue
        if (d < 1 && ny < 0.35) {
          const moss = smooth(wx, y, seed + 5, 5, 8) - ny * 0.35 - nx * 0.15
          if (ny < -0.1 && moss > 0.62) g[y]![wx] = band('uv2w', 0.55 - nx * 0.3 - ny * 0.45, wx, y, 0.2)
          else g[y]![wx] = d > 0.8 && nx + ny > 0.35 ? 'm' : band('mno&p', 0.62 - nx * 0.32 - ny * 0.4, wx, y, 0.25)
        } else if (Math.abs(nx) < Math.sqrt(Math.max(0, 1 - 0.1225)) && y + 0.5 > by && y + 0.5 < by + depth) {
          g[y]![wx] = y + 1.5 > by + depth ? 'k' : band('klmn', 0.62 - nx * 0.4 - (y - by) / (depth * 2.2), wx, y, 0.25)
        }
      }
    }
  }
  return rowsOf(g)
}

export const rockTops = [boulders(161, false), boulders(162, false)]
export const rockFaces = [boulders(163, true), boulders(164, true)]

const ROOF_LOOKS = ['bcdefh5', 'kmDDEFp', 'b66778h']

function roofFrame(look: number, ridge: boolean, edge: number): string[] {
  const keys = ROOF_LOOKS[look]!
  const ramp = keys.slice(1)
  return field(N, N, (x, y) => {
    const n = noise(x, y, 171 + look)
    if (edge === -1 && x < 2) return x === 0 ? keys[0]! : keys[2]!
    if (edge === 1 && x > N - 3) return x === N - 1 ? keys[0]! : keys[1]!
    if (ridge && y < 7) {
      if (y === 0) return keys[0]!
      if (y === 6) return keys[0]!
      if (y === 5) return keys[1]!
      return shade(ramp, y === 1 ? 0.95 : 0.8 - (y - 2) * 0.08 + ((x >> 2) & 1 ? -0.06 : 0), x, y)
    }
    if (!ridge && y >= N - 4) {
      if (y === N - 1) return keys[0]!
      if (look === 0) return noise(x, 3, 176) < 0.5 || y === N - 4 ? keys[2]! : keys[1]!
      return y === N - 2 ? keys[1]! : shade(ramp, 0.35, x, y)
    }
    const ry = ridge ? y - 7 : y + 25
    let lift = 0.82 - ry * 0.005
    if (edge === -1 && x < 5) lift += 0.06
    if (edge === 1 && x > N - 6) lift -= 0.2
    if (look === 0) {
      const course = Math.floor(ry / 8)
      const ly = ry % 8
      const fringe = ly === 7 || (ly === 6 && noise(x, course, 175) < 0.45)
      if (fringe) return n < 0.5 ? keys[1]! : keys[2]!
      const streak = noise(x, course, 177) < 0.3 ? -0.18 : noise(x, course, 178) < 0.15 ? 0.12 : 0
      return shade(ramp, lift - ly * 0.05 + streak, x, y)
    }
    if (look === 1) {
      const course = Math.floor(ry / 6)
      const ly = ry % 6
      const lx = (x + (course & 1 ? 4 : 0)) % 8
      const slate = Math.floor((x + (course & 1 ? 4 : 0)) / 8) + course * 5
      const tone = (noise(slate, 0, 179) - 0.5) * 0.22
      if (ly === 5) return keys[1]!
      if (lx === 7) return band(ramp, lift - 0.5, x, y, 0)
      if (ly === 0) return band(ramp, lift + 0.08 + tone, x, y, 0)
      return band(ramp, lift - 0.2 + tone, x, y, 0)
    }
    const course = Math.floor(ry / 7)
    const ly = ry % 7
    const lx = (x + (course & 1 ? 3 : 0)) % 6
    const bottom = lx === 0 || lx === 5 ? 4 : lx === 1 || lx === 4 ? 5 : 6
    if (ly > bottom) return keys[1]!
    if (ly === bottom) return keys[2]!
    return band(ramp, lift - 0.15 + (lx < 2 ? 0.12 : lx > 3 ? -0.2 : 0), x, y, 0)
  })
}

const WALL_LOOKS = ['qpdc', 'onml', 'qpec']

function faceFrame(look: number, kind: number, lit: boolean): string[] {
  const [hi, lo, beam, dark] = WALL_LOOKS[look]!
  return field(N, N, (x, y) => {
    const n = noise(x, y, 181 + look)
    if (y < 2) return 'b'
    if (y < 4) return beam!
    if (y === 4 && !(kind === 4 && x >= 9 && x <= 22)) return dark!
    if (y >= 28) return y === 28 ? 'l' : shade('klm', 0.5 + ((x + (y & 1) * 4) % 8 === 0 ? -0.4 : 0.1), x, y)
    if (kind === 0 && x < 3) return x === 0 ? dark! : beam!
    if (kind === 1 && x > N - 4) return x === N - 1 ? dark! : beam!
    if (kind === 4 && x >= 9 && x <= 22 && y >= 5) {
      const u = (x + 0.5 - H) / 7
      const archTop = 6 + Math.round(4 * (1 - Math.sqrt(Math.max(0, 1 - u * u))))
      if (y < archTop) return hi!
      if (y === archTop || x === 9 || x === 22) return dark!
      if (y === 27) return 'l'
      if ((y === 10 || y === 22) && (x < 13 || x > 18)) return y === 10 ? 'n' : 'm'
      if (x === 19 && (y === 16 || y === 17)) return y === 16 ? 'U' : 'A'
      const lx = (x - 10) % 3
      return lx === 2 ? 'c' : lx === 0 ? 'f' : 'e'
    }
    if ((kind === 2 || kind === 5) && x >= 8 && x <= 23 && y >= 8 && y <= 22) {
      if (x < 11 || x > 20) {
        if (y === 8 || y === 22) return beam!
        return (x === 8 || x === 23) ? dark! : (y & 1) && x !== 10 && x !== 21 ? 'e' : 'd'
      }
      if (y === 22) return 'h'
      if (y === 21) return 'f'
      if (x === 11 || x === 20 || y === 8) return 'c'
      if (x === 15 || x === 16 || y === 14) return 'd'
      if (lit) return (x < 15 && y < 14) || n < 0.25 ? 'U' : x > 16 && y > 14 ? 'A' : '#'
      return x < 15 && y < 14 ? (x - y > -2 ? 'N' : 'M') : x - y > 4 ? 'L' : 'M'
    }
    if (look === 1) {
      const course = Math.floor((y - 5) / 5)
      const ly = (y - 5) % 5
      const lx = (x + (course & 1 ? 5 : 0)) % 10
      const stone = Math.floor((x + (course & 1 ? 5 : 0)) / 10) + course * 4
      if (ly === 4 || lx === 9) return dark!
      const tone = (noise(stone, 0, 185) - 0.5) * 0.3
      return band('mno', 0.6 - (ly === 0 ? -0.2 : ly === 3 ? 0.2 : 0) + (lx === 0 ? 0.15 : 0) + tone, x, y, 0)
    }
    if (y === 15 || y === 16) return y === 15 ? beam! : dark!
    if (kind === 3 && ((x === 4 || x === 27) || (Math.abs(x - 4 - (y - 5)) < 1.2 && y < 15) || (Math.abs(27 - x - (y - 5)) < 1.2 && y < 15))) return beam!
    if (kind !== 3 && (x === 1 || x === N - 2)) return beam!
    return smooth(x, y, 186 + look, 5, 32) > 0.84 ? lo! : hi!
  })
}

export const HOUSE_LOOKS = 3
export const ROOF_FRAMES = 6
export const FACE_FRAMES = 6
export const FACE_LEFT = 0
export const FACE_RIGHT = 1
export const FACE_WINDOW = 2
export const FACE_PLAIN = 3
export const FACE_DOOR = 4
export const FACE_WINDOW_LIT = 5

export const roofFrames: Rows[] = []
export const faceFrames: Rows[] = []
for (let look = 0; look < HOUSE_LOOKS; look++) {
  for (const ridge of [true, false]) for (const edge of [-1, 0, 1]) roofFrames.push(roofFrame(look, ridge, edge))
  for (let kind = 0; kind < 5; kind++) faceFrames.push(faceFrame(look, kind, false))
  faceFrames.push(faceFrame(look, 5, true))
}

export const chimney = field(14, 22, (x, y) => {
  if (y < 3) {
    if (x === 0 || x === 13) return y === 0 ? '.' : 'l'
    if (y === 0) return x < 2 || x > 11 ? '.' : x > 3 && x < 10 ? '0' : 'o'
    return y === 1 ? (x > 3 && x < 10 ? '0' : 'p') : 'n'
  }
  if (x === 0 || x === 13) return '.'
  if (y === 3) return 'k'
  const course = Math.floor((y - 4) / 4)
  const ly = (y - 4) % 4
  const lx = (x + (course & 1 ? 3 : 0)) % 6
  if (ly === 3 || lx === 5) return 'l'
  return shade('mno', 0.75 - x * 0.05 - ly * 0.08, x, y)
})

export const voidTile = field(N, N, () => 'x')

export const chasm = field(N, N, (x, y) => {
  const mist = smooth(x, y, 11, 8, 4)
  if (noise(x, y, 12) < 0.006) return 'L'
  return mist > 0.68 && threshold(x, y) < (mist - 0.68) * 3 ? 'J' : 'x'
})

export const chasmEdge = field(N, N, (x, y) => {
  if (y === 0) return 'o'
  if (y === 1) return 'n'
  if (y === 2) return 'm'
  const bottom = 16 + Math.round(smooth(x, 0, 13, 4, 8) * 6)
  if (y < bottom) {
    const strata = (y + Math.round(smooth(x, y, 14, 6, 32) * 3)) % 5
    const depth = (y - 3) / (bottom - 3)
    if (strata === 0) return depth < 0.5 ? 'k' : '0'
    return shade('0klm', 0.85 - depth * 0.9 - (x % 9 === 0 ? 0.15 : 0), x, y)
  }
  const mist = smooth(x, y, 11, 8, 4)
  return y < bottom + 3 ? (threshold(x, y) < 0.4 ? '0' : 'x') : mist > 0.68 && threshold(x, y) < (mist - 0.68) * 3 ? 'J' : 'x'
})
