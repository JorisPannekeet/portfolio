import { band, blob, canvas, fill, framed, hash, line, plot, rowsOf } from './world-kit.ts'

function evenStar(size: number, ray: number, core: string, mid: string, tip: string, diagonal: number): string[] {
  const g = canvas(size, size)
  const c = size / 2 - 1
  for (let k = 0; k <= ray; k++) {
    const key = k < 1 ? core : k < ray * 0.55 ? mid : tip
    for (const [dx, dy] of [[-k, 0], [k + 1, 0], [-k, 1], [k + 1, 1]] as const) plot(g, c + dx, c + dy, key)
    for (const [dx, dy] of [[0, -k], [1, -k], [0, k + 1], [1, k + 1]] as const) plot(g, c + dx, c + dy, key)
  }
  for (let k = 1; k <= diagonal; k++) {
    plot(g, c - k, c - k, tip)
    plot(g, c + 1 + k, c - k, tip)
    plot(g, c - k, c + 1 + k, tip)
    plot(g, c + 1 + k, c + 1 + k, tip)
  }
  return rowsOf(g)
}

export const sparkFrames = [
  evenStar(10, 4, 'W', 'U', 'A', 2),
  evenStar(10, 2, 'W', 'U', 'A', 1),
  evenStar(10, 0, 'A', 'A', 'T', 0),
]

function cloud(lobes: readonly (readonly [number, number, number])[], scatter: number, seed: number): string[] {
  const g = canvas(10, 10)
  for (const [cx, cy, r] of lobes) {
    blob(g, cx, cy, r, r, (x, y, nx, ny) => (scatter > 0 && hash(x, y, seed) < scatter ? '.' : band('nopq', 0.7 - nx * 0.3 - ny * 0.45, x, y, 0.3)))
  }
  return rowsOf(g)
}

export const puffFrames = [
  cloud([[5, 5.5, 3], [3.5, 4.5, 2.2], [6.5, 4, 2.2]], 0, 0),
  cloud([[3, 6, 2.6], [7, 6, 2.6], [5, 3.5, 2.6]], 0.25, 1),
  cloud([[2, 7, 1.6], [8, 7, 1.6], [5, 2, 1.6], [1.5, 2, 1], [8.5, 2.5, 1]], 0.5, 2),
]

export const glintFrames = [
  evenStar(14, 6, 'W', 'W', 'U', 1),
  evenStar(14, 4, 'W', 'U', 'A', 1),
  evenStar(14, 1, 'U', 'A', 'A', 0),
]

export const questArrow = framed((() => {
  const g = canvas(16, 16)
  fill(g, 1, 6, 8, 4, (_x, y) => (y === 6 ? 'U' : y === 9 ? 'K' : 'A'))
  for (let x = 8; x < 16; x++) {
    const half = (15 - x) * 0.95
    for (let y = 0; y < 16; y++) {
      const dy = y + 0.5 - 8
      if (Math.abs(dy) > half) continue
      plot(g, x, y, dy < -half + 1.2 ? 'U' : dy > half - 1.2 ? 'K' : 'A')
    }
  }
  plot(g, 1, 7, 'W')
  return rowsOf(g)
})(), '0', 1)

export const exitChevron = framed((() => {
  const g = canvas(20, 16)
  for (const off of [0, 8]) {
    for (let k = 0; k < 8; k++) {
      line(g, off + k, k, off + k + 3, k, k < 2 ? 'W' : 'q')
      line(g, off + k, 15 - k, off + k + 3, 15 - k, k < 2 ? 'q' : 'p')
    }
  }
  return rowsOf(g)
})(), '0', 1)

export const questMarker = framed((() => {
  const g = canvas(12, 12)
  for (let y = 0; y < 12; y++) {
    const half = y < 5 ? y + 1 : 11 - y
    for (let x = 0; x < 12; x++) {
      const dx = x + 0.5 - 6
      if (Math.abs(dx) > half - 0.5) continue
      plot(g, x, y, dx < -1 && y < 6 ? 'U' : dx > 1 || y > 7 ? 'K' : 'A')
    }
  }
  plot(g, 4, 3, 'W')
  return rowsOf(g)
})(), '0', 1)

export const interactPip = framed((() => {
  const g = canvas(16, 18)
  blob(g, 8, 7, 8, 7, (_x, _y, nx, ny) => (nx + ny > 0.9 ? 'q' : 'W'))
  fill(g, 7, 13, 3, 2, 'W')
  plot(g, 8, 15, 'W')
  plot(g, 8, 16, 'q')
  fill(g, 7, 3, 2, 6, '0')
  fill(g, 7, 10, 2, 2, '0')
  return rowsOf(g)
})(), '0', 1)

export const hudHeart = framed((() => {
  const g = canvas(14, 14)
  for (let y = 0; y < 14; y++) {
    for (let x = 0; x < 14; x++) {
      const px = x + 0.5
      const py = y + 0.5
      const lobe = Math.hypot(px - 4, py - 4) < 3.8 || Math.hypot(px - 10, py - 4) < 3.8
      const wedge = py >= 4 && py <= 12.5 && Math.abs(px - 7) < (12.5 - py) * 0.85
      if (!lobe && !wedge) continue
      g[y]![x] = band('RST', 0.68 - (px - 7) * 0.06 - (py - 4) * 0.06, x, y, 0.2)
    }
  }
  plot(g, 3, 2, 'W')
  plot(g, 2, 3, 'U')
  plot(g, 4, 2, 'U')
  return rowsOf(g)
})(), '0', 2)
