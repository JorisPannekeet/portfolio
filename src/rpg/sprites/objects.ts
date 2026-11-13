import { mirrorHalf, recolor } from './paint.ts'
import { band, blob, canvas, fill, framed, hash, line, plot, rowsOf, stamp, type Grid } from './world-kit.ts'

function done(g: Grid): string[] {
  return framed(rowsOf(g))
}

function chestBody(g: Grid, top: number): void {
  for (let y = top; y < top + 13; y++) {
    const ly = (y - top) % 4
    for (let x = 0; x < 30; x++) {
      if (y === top + 12) g[y]![x] = x === 0 || x === 29 ? '.' : 'c'
      else g[y]![x] = ly === 0 ? 'f' : ly === 3 ? 'd' : x === 1 ? 'f' : x === 28 ? 'd' : 'e'
    }
  }
}

function straps(g: Grid, from: number, to: number): void {
  for (const sx of [2, 25]) {
    for (let y = from; y < to; y++) {
      plot(g, sx, y, 'o')
      plot(g, sx + 1, y, 'n')
      plot(g, sx + 2, y, 'm')
      if ((y - from) % 5 === 2) plot(g, sx + 1, y, 'p')
    }
  }
}

function lock(g: Grid, x: number, y: number): void {
  fill(g, x, y, 6, 7, (px, py) => (px === x || py === y ? 'U' : px === x + 5 || py === y + 6 ? 'K' : 'A'))
  plot(g, x + 2, y + 2, '0')
  plot(g, x + 3, y + 2, '0')
  plot(g, x + 2, y + 3, '0')
  plot(g, x + 2, y + 4, 'b')
}

export const chestClosed = (() => {
  const g = canvas(30, 24)
  for (let y = 0; y < 11; y++) {
    const inset = y === 0 ? 4 : y === 1 ? 2 : y === 2 ? 1 : 0
    for (let x = inset; x < 30 - inset; x++) {
      const key = y === 10 ? 'c' : y === 0 ? 'h' : y === 4 || y === 7 ? 'd' : y < 4 ? (x < 8 ? 'h' : 'f') : x === 0 ? 'f' : x === 29 ? 'd' : 'e'
      g[y]![x] = key
    }
  }
  chestBody(g, 11)
  straps(g, 1, 23)
  lock(g, 12, 8)
  return done(g)
})()

export const chestOpen = (() => {
  const g = canvas(30, 26)
  for (let y = 0; y < 7; y++) {
    const inset = y === 0 ? 3 : y === 1 ? 1 : 0
    for (let x = inset; x < 30 - inset; x++) g[y]![x] = y === 0 ? 'e' : y === 6 ? 'b' : y === 3 ? 'c' : 'd'
  }
  fill(g, 0, 7, 30, 6, (x, y) => (y === 7 ? 'c' : x < 2 || x > 27 ? 'd' : 'b'))
  blob(g, 15, 11, 12, 3.6, (x, y, nx, ny) => (ny > 0.3 ? 'K' : band('KAU', 0.75 - nx * 0.25 - ny * 0.5, x, y, 0.4)))
  for (const [x, y] of [[9, 9], [16, 8], [21, 10], [12, 11]] as const) {
    plot(g, x, y, 'W')
    plot(g, x + 1, y, 'U')
  }
  chestBody(g, 13)
  straps(g, 0, 25)
  lock(g, 12, 13)
  return done(g)
})()

function waystone(glyph: string, glow: string, core: string): string[] {
  const g = canvas(20, 38)
  for (let y = 0; y < 33; y++) {
    const p = y / 32
    const half = y < 5 ? 3 + y * 1.1 : 7.6 + p * 1.6
    for (let x = 0; x < 20; x++) {
      const t = (x + 0.5 - 10) / half
      if (Math.abs(t) > 1) continue
      const crack = hash(x >> 1, y >> 2, 31) < 0.07
      plot(g, x, y, crack ? 'm' : band('lmnop', 0.68 - t * 0.42 - (y < 3 ? -0.15 : 0) + (hash(x, y >> 3, 32) - 0.5) * 0.1, x, y, 0.2))
    }
  }
  for (let y = 8; y < 28; y++) plot(g, 10, y, y % 6 === 2 ? core : glyph)
  for (const y of [10, 16, 22]) {
    line(g, 7, y - 1, 9, y + 1, glyph)
    line(g, 13, y - 1, 11, y + 1, glow)
    plot(g, 10, y + 1, core)
  }
  fill(g, 1, 32, 18, 6, (x, y) => (y === 32 ? (x < 6 ? 'p' : 'o') : y === 37 ? 'l' : band('lmn', 0.7 - (x / 18) * 0.5, x, y, 0)))
  for (const [x, y] of [[2, 31], [3, 31], [4, 30], [15, 31], [16, 32], [5, 32]] as const) plot(g, x, y, y === 30 ? 'w' : 'v')
  return done(g)
}

export const waystoneDark = waystone('l', 'k', 'l')
export const waystoneLit = waystone('Y', 'X', 'Z')

function forge(flame: readonly string[]): string[] {
  const g = canvas(40, 34)
  fill(g, 6, 0, 14, 10, (x, y) => (y === 0 ? 'm' : x === 6 ? 'l' : x === 19 ? 'k' : y < 3 ? 'k' : band('klm', 0.6 - (x - 6) * 0.04, x, y, 0)))
  for (let y = 9; y < 34; y++) {
    for (let x = 0; x < 26; x++) {
      const course = Math.floor((y - 9) / 5)
      const ly = (y - 9) % 5
      const lx = (x + (course & 1 ? 4 : 0)) % 8
      g[y]![x] = ly === 4 || lx === 7 ? 'k' : ly === 0 ? 'n' : band('lmn', 0.6 - x * 0.02 + (lx === 0 ? 0.2 : 0), x, y, 0)
    }
  }
  for (let y = 15; y < 29; y++) {
    for (let x = 5; x < 21; x++) {
      const u = (x + 0.5 - 13) / 8
      if (y < 15 + 4 * (1 - Math.sqrt(Math.max(0, 1 - u * u))) + 0.5) continue
      g[y]![x] = y > 25 ? (hash(x, y, 41) < 0.4 ? 'T' : 'S') : y > 23 ? 'R' : 'r'
    }
  }
  stamp(g, flame, 7, 15)
  fill(g, 4, 29, 18, 2, (_x, y) => (y === 29 ? 'o' : 'm'))
  fill(g, 29, 25, 9, 9, (x, y) => (y === 25 ? 'h' : y === 33 ? 'c' : x === 29 ? 'f' : x === 37 ? 'c' : hash(x, y >> 1, 42) < 0.2 ? 'd' : 'e'))
  fill(g, 28, 18, 12, 2, (x, y) => (y === 18 ? (x < 31 ? 'p' : 'o') : 'm'))
  fill(g, 31, 20, 6, 3, (x) => (x === 31 ? 'n' : 'm'))
  fill(g, 29, 23, 10, 2, (_x, y) => (y === 23 ? 'n' : 'l'))
  line(g, 26, 18, 28, 19, 'n')
  plot(g, 39, 19, 'l')
  return done(g)
}

const FLAME_A = [
  '.....U..U.....',
  '....UA..AU....',
  '...TAU.UAT....',
  '..TAUUAUUAT...',
  '..SAUWWUUAS...',
  '.STAUWWUAATS..',
  '.SATAUUATAS...',
  '..STTAATTS....',
]

const FLAME_B = [
  '..............',
  '......U.......',
  '.....UA..U....',
  '...TAUA.UAT...',
  '..TAUUWUUAT...',
  '.STAUWWUUATS..',
  '.SATAUUAATS...',
  '..STTAATTS....',
]

export const forgeA = forge(FLAME_A)
export const forgeB = forge(FLAME_B)

export const windmillTower = (() => {
  const g = canvas(28, 48)
  for (let y = 9; y < 48; y++) {
    const half = 7 + ((y - 9) / 38) * 6
    for (let x = 0; x < 28; x++) {
      const t = (x + 0.5 - 14) / half
      if (Math.abs(t) > 1) continue
      const beam = y === 20 || y === 33 || Math.abs(t) > 0.92
      g[y]![x] = beam ? 'd' : band('npqq', 0.75 - t * 0.45, x, y, 0.2)
    }
  }
  fill(g, 11, 38, 6, 10, (x, y) => (y === 38 ? 'c' : x === 11 ? 'f' : x === 16 ? 'c' : (x & 1) ? 'd' : 'e'))
  plot(g, 15, 43, 'A')
  fill(g, 12, 24, 4, 5, (x, y) => (y === 24 || x === 12 ? 'd' : x === 13 && y === 25 ? 'N' : 'L'))
  for (let y = 0; y < 11; y++) {
    const half = 2 + y * 0.95
    for (let x = 0; x < 28; x++) {
      const t = (x + 0.5 - 14) / half
      if (Math.abs(t) > 1) continue
      g[y]![x] = y === 10 ? '6' : band('678', 0.72 - t * 0.5 - (y % 3 === 2 ? 0.2 : 0), x, y, 0.2)
    }
  }
  return done(g)
})()

function sails(start: number): string[] {
  const g = canvas(46, 46)
  for (let arm = 0; arm < 4; arm++) {
    const a = start + (arm * Math.PI) / 2
    const dx = Math.cos(a)
    const dy = Math.sin(a)
    for (let t = 3; t <= 21; t += 0.5) {
      plot(g, 23 + dx * t, 23 + dy * t, t > 20 ? 'c' : 'd')
      if (t < 7) continue
      for (let sOff = 1; sOff <= 6; sOff += 0.5) {
        const x = 23 + dx * t - dy * sOff
        const y = 23 + dy * t + dx * sOff
        const lattice = Math.abs(t % 4) < 0.6 || sOff > 5.6
        plot(g, x, y, lattice ? 'e' : sOff < 3 ? 'q' : 'p')
      }
    }
  }
  blob(g, 23, 23, 3, 3, (_x, _y, nx, ny) => (nx + ny < -0.4 ? 'U' : nx + ny > 0.6 ? 'K' : 'A'))
  return done(g)
}

export const windmillBladesX = sails(Math.PI / 4)
export const windmillBladesPlus = sails(0)

function target(outer: string, inner: string, shade: string): string[] {
  const g = canvas(16, 30)
  fill(g, 6, 13, 4, 15, (x) => (x === 6 ? 'f' : x === 9 ? 'c' : 'e'))
  fill(g, 3, 27, 10, 3, (x, y) => (y === 27 ? 'f' : x === 3 || x === 12 ? 'c' : 'd'))
  blob(g, 8, 7.5, 7.5, 7, (_x, _y, nx, ny) => {
    const d = Math.sqrt(nx * nx + ny * ny)
    const dark = nx * 0.5 + ny > 0.45
    if (d > 0.84) return dark ? shade : outer
    if (d > 0.6) return 'W'
    if (d > 0.34) return dark ? shade : outer
    return d < 0.15 ? 'W' : inner
  })
  return done(g)
}

export const switchIdle = target('S', 'S', 'R')
export const switchTripped = target('G', 'I', 'v')

export const grapplePost = (() => {
  const g = canvas(18, 32)
  fill(g, 6, 9, 6, 20, (x, y) => (y === 12 || y === 13 ? (x === 6 ? 'o' : y === 12 ? 'n' : 'm') : x === 6 ? 'f' : x === 11 ? 'c' : hash(x, y >> 2, 51) < 0.2 ? 'd' : 'e'))
  blob(g, 9, 5, 5.5, 5, (_x, _y, nx, ny) => {
    const d = Math.sqrt(nx * nx + ny * ny)
    if (d < 0.55) return '.'
    return nx + ny < -0.3 ? 'p' : nx + ny > 0.5 ? 'm' : 'n'
  })
  fill(g, 7, 9, 4, 1, 'm')
  fill(g, 2, 28, 14, 4, (x, y) => (y === 28 ? (x < 8 ? 'o' : 'n') : y === 31 ? 'l' : 'm'))
  return done(g)
})()

export const pedestal = (() => {
  const g = canvas(24, 22)
  fill(g, 0, 0, 24, 5, (x, y) => (y === 0 ? 'q' : y === 4 ? 'm' : x < 2 ? 'p' : band('nop', 0.8 - x * 0.025, x, y, 0)))
  fill(g, 5, 5, 14, 12, (x, y) => (y === 5 ? 'l' : band('mnop', 0.85 - (x - 5) * 0.06, x, y, 0.2)))
  for (let y = 7; y < 15; y += 3) {
    plot(g, 11, y, '&')
    plot(g, 12, y + 1, '@')
  }
  fill(g, 2, 17, 20, 5, (x, y) => (y === 17 ? 'o' : y === 21 ? 'l' : band('mno', 0.75 - x * 0.03, x, y, 0)))
  return done(g)
})()

const shardTemplate = (() => {
  const g = canvas(10, 18)
  for (let y = 0; y < 18; y++) {
    const half = y < 7 ? 1 + y * 0.6 : 5 - (y - 7) * 0.42
    for (let x = 0; x < 10; x++) {
      const t = (x + 0.5 - 5) / half
      if (Math.abs(t) > 1) continue
      g[y]![x] = t < -0.35 ? '9' : t < 0.15 ? (y < 8 ? '9' : '8') : t < 0.6 ? '8' : '7'
    }
  }
  plot(g, 3, 5, 'W')
  plot(g, 3, 6, 'W')
  plot(g, 4, 9, 'W')
  return rowsOf(g)
})()

export const SHARD_TINTS: readonly string[] = ['h@e', 'OMN', 'UTS', 'ZXY']

export const shards = SHARD_TINTS.map(tint => framed(recolor(shardTemplate, '978', tint)))

export const plinth = (() => {
  const g = canvas(20, 7)
  fill(g, 0, 0, 20, 7, (x, y) => (y === 0 ? 'p' : y === 6 ? 'l' : y === 1 ? 'o' : band('mno', 0.7 - x * 0.03, x, y, 0)))
  return done(g)
})()

export const doorKey = (() => {
  const g = canvas(18, 9)
  blob(g, 4.5, 4.5, 4.5, 4.5, (_x, _y, nx, ny) => {
    const d = Math.sqrt(nx * nx + ny * ny)
    if (d < 0.45) return '.'
    return nx + ny < -0.3 ? 'U' : nx + ny > 0.5 ? 'K' : 'A'
  })
  fill(g, 9, 3, 9, 3, (_x, y) => (y === 3 ? 'U' : y === 5 ? 'K' : 'A'))
  fill(g, 13, 6, 2, 3, (x) => (x === 13 ? 'A' : 'K'))
  fill(g, 16, 6, 2, 2, (x) => (x === 16 ? 'A' : 'K'))
  return done(g)
})()

const shrineHalf = (() => {
  const g = canvas(15, 38)
  fill(g, 1, 4, 6, 28, (x, y) => (y === 4 ? 'p' : x === 1 ? 'o' : x === 6 ? 'l' : (y - 4) % 7 === 6 ? 'l' : band('mno', 0.75 - (x - 1) * 0.12, x, y, 0)))
  fill(g, 0, 0, 15, 4, (x, y) => (y === 0 ? 'p' : y === 3 ? 'l' : x === 0 ? 'o' : 'n'))
  fill(g, 0, 32, 15, 6, (x, y) => (y === 32 ? 'o' : y === 37 ? 'k' : band('lmn', 0.7 - y * 0.01 - x * 0.01, x, y, 0)))
  for (let y = 10; y < 30; y++) {
    const half = y < 20 ? (y - 10) * 0.5 : (30 - y) * 0.5
    for (let x = 0; x < 15; x++) {
      const t = 14.5 - x
      if (t > half) continue
      g[y]![x] = t > half - 1 ? '7' : y < 20 ? '8' : '7'
    }
  }
  plot(g, 12, 15, 'W')
  plot(g, 13, 16, '8')
  return rowsOf(g)
})()

export const shrineActive = framed(recolor(mirrorHalf(shrineHalf), '78', 'YZ'))
export const shrineDone = framed(recolor(mirrorHalf(shrineHalf), '78W', 'lmm'))

export const coins = (() => {
  const g = canvas(18, 13)
  const coin = (x: number, y: number) => {
    blob(g, x, y + 1, 4, 2, 'K')
    fill(g, x - 4, y, 9, 2, (px, py) => (Math.abs(px + 0.5 - x) > 3.8 ? '.' : py === y + 1 ? 'K' : 'A'))
    blob(g, x, y, 3.6, 1.7, (_x, _y, nx, ny) => (nx * nx + ny * ny > 0.55 ? 'A' : nx + ny < -0.2 ? 'U' : 'A'))
    plot(g, x - 2, y - 1, 'W')
  }
  coin(5, 10)
  coin(5, 8)
  coin(5, 6)
  coin(5, 4)
  coin(12, 10)
  coin(12, 8)
  coin(13, 3)
  return done(g)
})()

export const heart = (() => {
  const g = canvas(14, 13)
  for (let y = 0; y < 13; y++) {
    for (let x = 0; x < 14; x++) {
      const px = x + 0.5
      const py = y + 0.5
      const lobe = Math.hypot(px - 4, py - 4) < 3.8 || Math.hypot(px - 10, py - 4) < 3.8
      const wedge = py >= 4 && py <= 12.5 && Math.abs(px - 7) < (12.5 - py) * 0.85
      if (!lobe && !wedge) continue
      g[y]![x] = band('RST', 0.7 - (px - 7) * 0.06 - (py - 4) * 0.06, x, y, 0.2)
    }
  }
  plot(g, 3, 2, 'W')
  plot(g, 2, 3, 'q')
  plot(g, 4, 2, 'q')
  return done(g)
})()

export const ore = (() => {
  const g = canvas(15, 12)
  blob(g, 7.5, 7.5, 7.5, 4.5, (x, y, nx, ny) => band('lmno', 0.62 - nx * 0.3 - ny * 0.4, x, y, 0.2))
  const crystals: readonly (readonly [number, number, number])[] = [[5, 2, 4], [9, 3, 3], [11, 6, 2]]
  for (const [cx, top, half] of crystals) {
    for (let y = top; y < top + 6; y++) {
      const w = Math.min(half, (y - top) * 0.9 + 0.5)
      for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) {
        if (Math.abs(x + 0.5 - cx) > w) continue
        plot(g, x, y, x < cx - 0.5 ? 'P' : x < cx + 0.5 ? 'O' : 'N')
      }
    }
  }
  return done(g)
})()

export const lootBag = (() => {
  const g = canvas(14, 16)
  blob(g, 7, 10.5, 6.8, 5.5, (x, y, nx, ny) => band('cdefh', 0.62 - nx * 0.32 - ny * 0.35, x, y, 0.2))
  fill(g, 4, 2, 6, 3, (x, y) => (y === 2 ? (x & 1 ? 'f' : 'h') : x === 4 ? 'f' : 'e'))
  fill(g, 5, 5, 4, 1, (x) => (x === 5 ? 'U' : 'A'))
  plot(g, 9, 6, 'K')
  plot(g, 10, 7, 'A')
  plot(g, 6, 3, 'U')
  return done(g)
})()

export const runestone = (() => {
  const g = canvas(14, 14)
  blob(g, 7, 7.5, 6.5, 6.2, (x, y, nx, ny) => band('mnop', 0.68 - nx * 0.3 - ny * 0.4, x, y, 0.2))
  line(g, 7, 3, 7, 11, 'z')
  line(g, 7, 5, 10, 3, 'z')
  line(g, 7, 7, 4, 5, 'a')
  line(g, 7, 9, 10, 11, 'a')
  plot(g, 7, 4, 'Q')
  return done(g)
})()

export const banner = (() => {
  const g = canvas(18, 30)
  fill(g, 1, 0, 2, 30, (x, y) => (y === 0 ? 'U' : x === 1 ? 'f' : 'd'))
  fill(g, 0, 28, 5, 2, (x, y) => (y === 28 ? 'n' : x === 0 ? 'm' : 'l'))
  fill(g, 3, 3, 15, 2, (_x, y) => (y === 3 ? 'h' : 'd'))
  for (let y = 5; y < 24; y++) {
    for (let x = 4; x < 17; x++) {
      if (y > 18 && Math.abs(x + 0.5 - 10.5) < (y - 18) * 1.3) continue
      const fold = (x - 4) % 4
      g[y]![x] = x === 16 ? 'R' : fold === 0 ? 'T' : fold === 3 ? 'R' : 'S'
    }
  }
  stamp(g, ['..U..', '.UAU.', 'UAKAU', '.UAU.', '..U..'], 8, 9)
  return done(g)
})()

export const BANNER_TEMPLATE_KEYS = 'TSR'
