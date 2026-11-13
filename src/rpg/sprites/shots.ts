import { bake, canvas, dot, ell, line, mat, poly, seg, type Canvas } from './sculpt.ts'

function shot(w: number, h: number, draw: (c: Canvas, cx: number, cy: number) => void): string[] {
  const c = canvas(w, h, h - 1)
  draw(c, w / 2, h / 2)
  return bake(c, true)
}

const shaft = mat('b', 'deh')
const head = mat('k', 'nopW', 0.2)

function arrow(fletch: string, tip: string): string[] {
  return shot(32, 12, (c, cx, cy) => {
    seg(c, shaft, cx - 10, cy, cx + 7, cy, 0.6)
    poly(c, head, [cx + 6, cy - 2.2, cx + 11.5, cy, cx + 6, cy + 2.2])
    dot(c, cx + 9, cy - 0.5, tip)
    for (let n = 0; n < 3; n++) {
      line(c, cx - 11 + n * 1.5, cy - 2.5, cx - 8 + n * 1.5, cy - 0.5, fletch)
      line(c, cx - 11 + n * 1.5, cy + 2.5, cx - 8 + n * 1.5, cy + 0.5, fletch)
    }
  })
}

export const arrowEnemy = arrow('S', 'q')
export const arrowPlayer = arrow('W', 'P')

const spark = mat('X', 'YZPW', 0.4)

function boltFrame(k: number): string[] {
  return shot(30, 16, (c, cx, cy) => {
    ell(c, spark, cx + 4, cy, 4.5, 3.2)
    ell(c, mat('Z', 'W'), cx + 4.5, cy - 0.5, 1.8, 1.3)
    let px = cx + 1
    let py = cy
    for (let n = 1; n <= 4; n++) {
      const x = cx + 1 - n * 3
      const y = cy + ((n + k) & 1 ? 2 : -2) * (n / 4 + 0.3)
      line(c, px, py, x, y, n & 1 ? 'Z' : 'Y')
      px = x
      py = y
    }
    dot(c, cx + 9, cy + (k ? -2 : 2), 'W')
  })
}

export const boltSpark = [boltFrame(0), boltFrame(1)]

const wave = mat('M', 'NOPW', 0.3)

function waveFrame(k: number): string[] {
  return shot(20, 32, (c, cx, cy) => {
    const pts: number[] = []
    for (let n = 0; n <= 10; n++) {
      const a = -1.25 + (n / 10) * 2.5
      pts.push(cx - 6 + Math.cos(a) * 12, cy + Math.sin(a) * 13)
    }
    for (let n = 10; n >= 0; n--) {
      const a = -1.15 + (n / 10) * 2.3
      pts.push(cx - 6 + Math.cos(a) * (8.5 - k), cy + Math.sin(a) * 11)
    }
    poly(c, wave, pts, { nx: 0.3, ny: -0.2 })
    for (let n = 0; n < 4; n++) dot(c, cx + 4.5 - Math.abs(n - 1.5), cy - 9 + n * 6 + k * 2, 'W')
  })
}

export const waveCrescent = [waveFrame(0), waveFrame(1)]

const fire = mat('6', 'STAU', 0.25)

function emberFrame(k: number): string[] {
  return shot(20, 20, (c, cx, cy) => {
    ell(c, fire, cx, cy + 1, 5.5, 5)
    for (let n = 0; n < 3; n++) seg(c, fire, cx - 3 + n * 3, cy - 1, cx - 3 + n * 3 + ((n + k) % 2 ? 1 : -1), cy - 6 - ((n + k) % 3), 1.4, 0.4, { join: true })
    ell(c, mat('A', 'UW', 0.5), cx - 0.5, cy + 1, 2.4, 2.2)
    dot(c, cx - 1, cy, 'W')
  })
}

export const emberOrb = [emberFrame(0), emberFrame(1), emberFrame(2)]

const tide = mat('J', 'LMNO', 0.1)

function tideFrame(k: number): string[] {
  return shot(20, 20, (c, cx, cy) => {
    ell(c, tide, cx, cy, 6, 6)
    ell(c, mat('N', 'OP', 0.3), cx - 1.5, cy - 1.5, 2.6, 2.4)
    dot(c, cx - 2, cy - 2.5, 'W')
    const a = k * 2.1
    line(c, cx + Math.cos(a) * 4, cy + Math.sin(a) * 4, cx + Math.cos(a + 1) * 4.5, cy + Math.sin(a + 1) * 4.5, 'P')
    dot(c, cx + Math.cos(a + 3) * 7.5, cy + Math.sin(a + 3) * 7.5, 'O')
  })
}

export const tideOrb = [tideFrame(0), tideFrame(1), tideFrame(2)]

function patchFrame(k: number): string[] {
  return shot(28, 22, (c, cx, cy) => {
    const xs = [-7, 0, 6.5, -3, 3]
    const hs = [5, 8, 4.5, 3, 3.5]
    xs.forEach((x, n) => {
      const h = hs[n]! + ((n + k) % 3) - 1
      const sway = ((n + k) & 1 ? 1 : -1) * 0.8
      ell(c, fire, cx + x, cy + 5, 2, 1.8)
      seg(c, fire, cx + x, cy + 5, cx + x + sway, cy + 5 - h, 1.6, 0.3, { join: true })
      dot(c, cx + x, cy + 4.5, n === 1 ? 'W' : 'U')
    })
  })
}

export const burnPatch = [patchFrame(0), patchFrame(1), patchFrame(2)]
