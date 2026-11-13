import { recolor, type Rows } from './paint.ts'
import { blob, capsule, commit, dot, grid, layer, stamp, toRows, tone, type Grid, type Layer, type Point } from './rig.ts'
import { FACE_FRONT } from './aldric.ts'

const W = 32
const H = 44
const GROUND = 41
const SKIN = '^Hj+i_'
const WOOL = '~@?&='
const BOOT = 'bcdef'

function paint(g: Grid, draw: (l: Layer) => void): void {
  const l = layer(W, H)
  draw(l)
  commit(g, l)
}

function body(l: Layer, top: number, bottom: number, half: (t: number) => number, ramp: string, folds: number): void {
  for (let y = top; y <= bottom; y++) {
    const t = (y - top) / Math.max(1, bottom - top)
    const w = half(t)
    for (let x = Math.round(15.5 - w); x < Math.round(15.5 + w); x++) {
      const across = (x + 0.5 - 15.5) / w
      const fold = folds > 0 ? Math.sin(across * folds * Math.PI) * 0.35 * t : 0
      dot(l, x, y, tone(ramp, -across * 0.75 - t * 0.5 + 0.35 + fold + (y === top ? -0.3 : 0)))
    }
  }
}

function boots(l: Layer, x: number, y: number, ramp: string): void {
  capsule(l, [x - 0.5, y - 4], [x - 0.5, y - 1], 2, ramp)
  capsule(l, [x - 0.5, y - 0.5], [x + 1, y - 0.5], 1.6, BOOT)
}

interface Folk {
  head: Rows
  headY: number
  torso: (l: Layer, bob: number) => void
  legs: string
  sleeve: string
  hand: string
  shoulder: number
  hands: readonly [Point, Point]
  hips: number
  prop?: (g: Grid, hand: Point, bob: number) => void
  front?: (l: Layer, bob: number) => void
}

function folk(f: Folk, bob: number, blink: boolean): string[] {
  const g = grid(W, H)
  if (f.legs !== '') {
    paint(g, l => {
      capsule(l, [13, f.hips], [13, GROUND - 3], 2.2, f.legs)
      capsule(l, [19, f.hips], [19, GROUND - 3], 2.2, f.legs, -0.3)
      boots(l, 13, GROUND, f.legs)
      boots(l, 19, GROUND, f.legs)
    })
  }
  paint(g, l => f.torso(l, bob))
  const head = blink ? f.head.map(row => row.replace(/W0/g, '++').replace(/0W/g, '++')) : f.head
  paint(g, l => stamp(l, head, 9, f.headY + bob))
  const [main, off] = f.hands
  const left: Point = [9.5, f.shoulder + bob]
  const right: Point = [22.5, f.shoulder + bob]
  for (const [from, to] of [[left, main], [right, off]] as const) {
    const at: Point = [to[0], to[1] + bob]
    paint(g, l => {
      const mid: Point = [(from[0] + at[0]) / 2 + (from[0] < 16 ? -0.5 : 0.5), (from[1] + at[1]) / 2]
      capsule(l, from, mid, 1.9, f.sleeve)
      capsule(l, mid, at, 1.7, f.sleeve)
      blob(l, at[0], at[1], 1.6, 1.6, f.hand, 0.3)
    })
  }
  if (f.front) paint(g, l => f.front!(l, bob))
  if (f.prop) f.prop(g, [main[0], main[1] + bob], bob)
  return toRows(g)
}

function cycle(f: Folk): string[][] {
  const a = folk(f, 0, false)
  const b = folk(f, 1, false)
  return [a, a, a, b, b, b, a, folk(f, 0, true)]
}

const marenHead = [
  '.....@??@.....',
  '...@?&==&?@...',
  '..@?&=&&&&?@..',
  '.@?&=&&&&&&?@.',
  '.@&=&????&&?@~',
  '@?&&?^jjj^?&?@',
  '@?&?^j+ii+j?&@',
  '@&&?j+_iii+j?@',
  '@&?^jHHiiHHj?@',
  '@&?^+W0ii0W+?@',
  '@&?^+iii+iij?@',
  '@?&?^+ii+ij^?@',
  '.@?&?^jHHj^?@~',
  '.@??&?^jj^?&@.',
  '..@@?&????&@~.',
  '...~@@@@@@@~..',
]

export const npcMaren = cycle({
  head: marenHead,
  headY: 2,
  torso: (l, bob) => {
    body(l, 16 + bob, GROUND, t => 6 + t * 3.5, WOOL, 2.5)
    for (let x = 10; x < 22; x++) dot(l, x, 27 + bob, x % 3 === 0 ? 'e' : 'f')
    capsule(l, [13, 28 + bob], [12.5, 34 + bob], 0.6, 'ef')
    blob(l, 12.5, 34.5 + bob, 1, 1, 'Ah')
  },
  legs: '',
  sleeve: WOOL,
  hand: SKIN,
  shoulder: 19.5,
  hands: [[8, 27], [20, 26]],
  hips: 29,
  prop: (g, hand) => paint(g, l => {
    capsule(l, [hand[0] - 0.5, 6], [hand[0] - 0.5, GROUND], 0.9, 'cdef')
    blob(l, hand[0] - 0.5, 5, 2.2, 2.2, 'KAU')
    dot(l, Math.round(hand[0] - 1), 4, 'W')
  }),
})

const smithHead = [
  '....^jjjj^....',
  '..^j+iiii+j^..',
  '.^j+i__iii+j^.',
  '.j+i_iiiiii+j^',
  '^j+iiiiiiii+j^',
  '^jbbiiiiiibbj^',
  '^bcdcbiibcdcb^',
  'jb+W0ii+i0W+bj',
  '+j+iiii+ii?jj^',
  '^j+ii+jj+i?+j^',
  '.cbccbHHbccbc.',
  '.cbdcbccbcdbc.',
  '..bcdcbbcdcb..',
  '...bccddccb...',
  '....bbccbb....',
  '.....^^^^.....',
]

export const npcSmith = cycle({
  head: smithHead,
  headY: 2,
  torso: (l, bob) => {
    body(l, 16 + bob, 29 + bob, t => 7.5 - t * 1.5, 'lDEF', 0)
    body(l, 20 + bob, 35 + bob, t => 4.5 + t * 1.5, 'bcdef', 1.5)
    for (let x = 11; x < 21; x++) dot(l, x, 24 + bob, 'b')
    stamp(l, ['cdc', 'bcb'], 15, 27 + bob)
    dot(l, 11, 18 + bob, 'c')
    dot(l, 20, 18 + bob, 'c')
    dot(l, 12, 19 + bob, 'c')
    dot(l, 19, 19 + bob, 'c')
    dot(l, 17, 31 + bob, '?')
    dot(l, 13, 29 + bob, '?')
  },
  legs: '~lDE',
  sleeve: SKIN,
  hand: SKIN,
  shoulder: 19.5,
  hands: [[8, 28], [23, 28]],
  hips: 33,
  prop: (g, hand) => paint(g, l => {
    capsule(l, [hand[0], hand[1] - 1], [hand[0] - 1, hand[1] + 7], 0.8, 'cde')
    stamp(l, ['lmnnm', 'mopqn', 'lmnnm'], Math.round(hand[0] - 3.5), Math.round(hand[1] + 7))
  }),
})

const childHead = recolor(FACE_FRONT, 'bcdefh', 'cKfhAU')

export const npcChild = cycle({
  head: childHead,
  headY: 12,
  torso: l => {
    body(l, 26, 34, t => 5 - t * 0.5 + (t > 0.8 ? 1 : 0), 'VXYZ', 0)
    for (let x = 11; x < 21; x++) dot(l, x, 32, x === 15 || x === 16 ? 'A' : 'c')
  },
  legs: '~lDE',
  sleeve: 'VXYZ',
  hand: SKIN,
  shoulder: 28,
  hands: [[10, 34], [21, 34]],
  hips: 35,
})

const villagerHead = recolor(FACE_FRONT, 'bcdefh', 'bbccde')

export const npcVillager = cycle({
  head: villagerHead,
  headY: 2,
  torso: (l, bob) => {
    body(l, 16 + bob, 32 + bob, t => 7 - t + (t > 0.7 ? 1.5 : 0), 'stuvw', 0)
    for (let x = 9; x < 23; x++) dot(l, x, 28 + bob, x === 15 || x === 16 ? 'A' : x % 2 ? 'c' : 'd')
    stamp(l, ['efd', 'dec', 'cbb'], 18, 29 + bob)
  },
  legs: 'bcde',
  sleeve: 'stuvw',
  hand: SKIN,
  shoulder: 19.5,
  hands: [[9, 30], [22, 30]],
  hips: 32,
})

const kerchief = [
  '....rR**Rr....',
  '..rR*SSS*Rr...',
  '.rR*STTSS*Rr..',
  '.R*STSSSS*RRr.',
  'r*SSSS**S*RRr.',
]
const villagerAltHead = [...kerchief, ...recolor(FACE_FRONT, 'bcdefh', 'rR*STT').slice(5)]

export const npcVillagerAlt = cycle({
  head: villagerAltHead,
  headY: 2,
  torso: (l, bob) => {
    body(l, 16 + bob, GROUND - 2, t => 6.5 + t * 2.5, 'lDEF', 2)
    body(l, 25 + bob, GROUND - 4, t => 3.5 + t * 1.5, 'opqW', 0)
    for (let x = 10; x < 22; x++) dot(l, x, 25 + bob, 'e')
  },
  legs: '',
  sleeve: 'lDEF',
  hand: SKIN,
  shoulder: 19.5,
  hands: [[9, 29], [22, 29]],
  hips: 32,
  front: l => {
    boots(l, 13, GROUND, BOOT)
    boots(l, 19, GROUND, BOOT)
  },
})

const HW = 48
const HH = 36
const COAT = 'bcdefh'

function strands(l: Layer, root: Point, dir: Point, count: number, length: number, sway: number, keys: string): void {
  for (let n = 0; n < count; n++) {
    const sx = root[0] + dir[0] * n
    const sy = root[1] + dir[1] * n
    for (let k = 0; k < length; k++) {
      const x = Math.round(sx - k * 0.6 + Math.sin(n * 1.7 + k * 0.6) * 0.6 * sway)
      dot(l, x, Math.round(sy + k), keys[(n + k) % keys.length]!)
    }
  }
}

interface Gait {
  legs: readonly (readonly [Point, Point])[]
  head: number
  tail: number
  mane: number
  rise: number
}

function horse(gait: Gait): string[] {
  const g = grid(HW, HH)
  const y = gait.rise
  const paintH = (draw: (l: Layer) => void) => {
    const l = layer(HW, HH)
    draw(l)
    commit(g, l)
  }
  paintH(l => {
    for (const [n, [knee, hoof]] of gait.legs.entries()) {
      if (n % 2 === 1) continue
      const hip: Point = [n < 2 ? 13 : 32, 19 + y]
      capsule(l, hip, knee, 1.8, COAT, -0.6)
      capsule(l, knee, hoof, 1.2, COAT, -0.6)
      stamp(l, ['kl', '0k'], Math.round(hoof[0] - 1), Math.round(hoof[1]))
    }
  })
  paintH(l => {
    const sway = gait.tail
    for (let k = 0; k < 12; k++) {
      capsule(l, [8 - k * 0.35 - sway * k * 0.12, 14 + y + k], [8 - k * 0.35 - sway * k * 0.12 - 1, 15 + y + k], 1.4 - k * 0.04, 'bcd')
    }
  })
  paintH(l => {
    blob(l, 22, 17 + y, 15, 7.5, COAT, 0.1)
    const hy = gait.head
    capsule(l, [31, 16 + y], [37, 6 + y + hy * 0.4], 4.4, COAT, 0.25)
    capsule(l, [37, 5 + y + hy * 0.5], [44, 12 + y + hy], 2.5, COAT, 0.15)
    blob(l, 44.5, 12.5 + y + hy, 2.3, 2, 'bcde', 0)
    dot(l, 36, 1 + y, 'd')
    dot(l, 36, 2 + y, 'e')
    dot(l, 37, 2 + y, 'd')
  })
  paintH(l => {
    for (const [n, [knee, hoof]] of gait.legs.entries()) {
      if (n % 2 === 0) continue
      const hip: Point = [n < 2 ? 14 : 31, 20 + y]
      capsule(l, hip, knee, 2, COAT)
      capsule(l, knee, hoof, 1.3, COAT)
      stamp(l, ['lm', 'kl'], Math.round(hoof[0] - 1), Math.round(hoof[1]))
    }
  })
  paintH(l => {
    stamp(l, ['..RRRRRRRRR..', '.R*SSSSSSS*R.', '.R*SAAAAAS*R.', '.RR*S*S*S*RR.', '..rrrrrrrrr..'], 17, 9 + y)
    stamp(l, ['.cdeffedc.', 'bcdeffedcb'], 18, 8 + y)
    capsule(l, [43, 11 + y + gait.head], [32, 12 + y], 0.4, 'b')
  })
  paintH(l => {
    dot(l, 39, Math.round(7 + y + gait.head * 0.6), '0')
    dot(l, 46, Math.round(12 + y + gait.head), 'b')
  })
  paintH(l => strands(l, [35, 3 + y], [-0.45, 1.1], 9, 5, gait.mane, 'bcbdc'))
  return toRows(g)
}

const STAND: readonly (readonly [Point, Point])[] = [[[12, 27], [12, 32]], [[15, 27], [15, 32]], [[32, 27], [33, 32]], [[35, 27], [36, 32]]]

function gallop(k: number): Gait {
  const a = (k / 4) * Math.PI * 2
  const leg = (base: number, phase: number, front: boolean): readonly [Point, Point] => {
    const c = Math.cos(a + phase)
    const s = Math.sin(a + phase)
    const hoofX = base + c * 5
    const lift = Math.max(0, s) * 4
    return [[base + c * 2.5 + (front ? 1 : -1) * lift * 0.4, 27 - lift * 0.5], [hoofX, 32 - lift]]
  }
  return {
    legs: [leg(12, 0, false), leg(15, 0.6, false), leg(33, Math.PI, true), leg(36, Math.PI + 0.6, true)],
    head: k % 2 === 0 ? 1 : -1,
    tail: k % 2 === 0 ? 2 : 0.5,
    mane: k % 2 === 0 ? 1.5 : -1,
    rise: k % 2 === 0 ? 0 : -2,
  }
}

export const horseFrames = [
  ...[0, 1, 2, 3].map(k => horse(gallop(k))),
  horse({ legs: STAND, head: 0, tail: 0, mane: 0, rise: 0 }),
  horse({ legs: STAND, head: 2, tail: 0.6, mane: 0.6, rise: 0 }),
]
export const HORSE_IDLE = 4
