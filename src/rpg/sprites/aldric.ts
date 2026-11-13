import type { Rows } from './paint.ts'
import { blob, capsule, commit, dot, grid, layer, reach, stamp, toRows, tone, type Grid, type Layer, type Point } from './rig.ts'

export const HERO_W = 32
export const HERO_H = 44

export const HERO_SIDE = 0
export const HERO_FRONT = 1
export const HERO_BACK = 2

export const POSE_IDLE = 0
export const IDLE_FRAMES = 2
export const POSE_BLINK = 2
export const POSE_WALK = 3
export const WALK_FRAMES = 6
export const POSE_WINDUP = 9
export const POSE_STRIKE = 10
export const POSE_FOLLOW = 11
export const POSE_GUARD = 12
export const POSE_HURT = 13
export const POSES_PER_FACING = 14

export const HERO_BOW = POSES_PER_FACING * 3
export const HERO_MOUNTED = HERO_BOW + 2
export const HERO_DASH = HERO_MOUNTED + 1
export const HERO_BLOCK = HERO_DASH + 1
export const HERO_GREAT = HERO_BLOCK
export const HERO_ELDER = HERO_BLOCK * 2
export const HERO_ROLL = HERO_BLOCK * 4
export const ROLL_FRAMES = 4
export const HERO_DEAD = HERO_ROLL + ROLL_FRAMES
export const DEAD_FRAMES = 3
export const HERO_FALLS_ELDER = ROLL_FRAMES + DEAD_FRAMES

const SLEEVE = 'JLMN'
const BRACER = 'bcdef'
const GLOVE = 'bcde'
const PANTS = '~lDE'
const CLOAK = 'rR*S'

const youngFront = [
  '....bccccb....',
  '..bcdeffeddb..',
  '.bcefhhfeeddb.',
  '.cefhhffeeddcb',
  'bdfhffeefeddcb',
  'bdfe+i+eedeedb',
  'cde+_ii+eeddcc',
  'cd+_iiiii+edcc',
  'cd+ddiiiiddjdc',
  'jd+W0ii+i0Wjdj',
  '+j+iiii+iiijj^',
  '^^j+iii+jij^^.',
  '.^^j+ijHj+j^..',
  '..^jj+ii+jj^..',
  '...^^jjjj^^...',
  '.....^^^^.....',
]
export const FACE_FRONT = youngFront

const youngBack = [
  '....bccccb....',
  '..bcdefcedcb..',
  '.bcefhfcfeedb.',
  '.cefhhfcfeedcb',
  'bdfhffecffedcb',
  'bdffeefcfeddcb',
  'cdeffeedfeedcb',
  'cdefeeddfedccb',
  'cdeedeedeedccb',
  'jcdedeedeedcbj',
  '+bcdeddedeccb^',
  '^bcddcddcdccb^',
  '.bccdccdccbb..',
  '..bbcjjjjcb...',
  '....^jjjj^....',
  '.....^^^^.....',
]
const youngSide = [
  '....bccccb....',
  '..bcdeffedb...',
  '.bcefhhffeddb.',
  'bcefhhffeeeedb',
  'bdfhffeeefeedb',
  'bdffeefeeeefeb',
  'cdeffeefeedfeb',
  'cdeefeeedd+_i^',
  'cdeedeeedj+ddi',
  'bdeed+jdj+i0i^',
  'bcdd+Hjdj+iiii',
  'bcddjjdj+iii+^',
  '.bcddd^j+iiH^.',
  '..bcdd^jj+ij^.',
  '...bcc^^jjj^..',
  '......^^^^....',
]
const elderFront = [
  '....bccccb....',
  '..bcd&?eddb...',
  '.bcd=&feeeddb.',
  '.cde=?ffeeddcb',
  'bdfe&?eefeddcb',
  'bdf+_i+eedeedb',
  'cd+_iiii+eddcc',
  'cd+iiiiiii+dcc',
  'cdddd+ii+ddddc',
  'jd+W0ii+i0WHdj',
  '+j+iiii+iiHjj^',
  '^?j+ii+jij+?^.',
  '.?&?@HHH@?&?..',
  '..?&=?@?=&?^..',
  '...?&?&?&?^...',
  '....^??@?^....',
]
const elderBack = [
  '....bccccb....',
  '..bcde=cedcb..',
  '.bcefh=?feedb.',
  '.cefhh&?feedcb',
  'bdfhff&?ffedcb',
  'bdffeef?feddcb',
  'cdeffeedfeedcb',
  'cdefeeddfedccb',
  'cdeedeedeedccb',
  'jcdedeedeedcbj',
  '+bcdeddedeccb^',
  '^bcddcddcdccb^',
  '.bccdccdccbb..',
  '..bbcddddcb...',
  '...?^cddc^?...',
  '....^?cc?^....',
]
const elderSide = [
  '....bccccb....',
  '..bcd&?fedb...',
  '.bce=&hffeddb.',
  'bce=?hffeeeedb',
  'bd&?ffeeefeedb',
  'bdffeefeeeefeb',
  'cdeffeefeedfeb',
  'cdeefeeedd+_i^',
  'cdeedeeedjdddi',
  'bdeed+jdj+i0i^',
  'bcdd+Hjd?+iHii',
  'bcdd?&?&?+iH+^',
  '.bcd?&=?&?@?^.',
  '..bc?&?=&?@^..',
  '...bc?&?&?^...',
  '......^??^....',
]

const torsoFront = [
  '....rR**Rr....',
  '..NNNr*S*rMLL.',
  '.NONNNr*rMMeLJ',
  '.NONNNMrMMedLJ',
  '.NNNNMMMMedMLJ',
  '.NNNMMMMedMMLJ',
  '..NNMMMedMMLJ.',
  '..NNMMedMMMLJ.',
  '..NMMedMMMLLJ.',
  '..cdddeKAKdcb.',
  '..bcccbAUAcfb.',
  '..NNMMLJcLedc.',
  '..NMMLJ..Lcbb.',
]
const torsoBack = [
  '....LMMML.....',
  '..NNNMMMMMLL..',
  '.NONNMMMMMMLJ.',
  '.NONNMMMMMMLJ.',
  '.NNNMMMMMMLLJ.',
  '.NNNMMMMMMLLJ.',
  '..NNMMMMMMLJ..',
  '..NNMMMMMMLJ..',
  '..NMMMMMMLLJ..',
  '..cdddedddcb..',
  '..bccccccccb..',
  '..cdeNMMLJLJ..',
  '..bcbNMLJ.LJ..',
]
const torsoSide = [
  '...rR*S...',
  '..NNr*SM..',
  '.NONNr*ML.',
  '.NONNMrML.',
  '.NNNMMMMLJ',
  '.NNNMMMMLJ',
  '..NNMMMLJ.',
  '..NNMMMLJ.',
  '..NMMMLLJ.',
  '..cdddKAc.',
  '.efbcccAb.',
  '.dcNMMLJ..',
  '.cbNML.LJ.',
]

const bootFront = ['.efd.', 'cfedc', 'cedcb', 'cedcb', 'bccbb']
const bootBack = ['.edc.', 'cedcb', 'cdccb', 'cdccb', 'bbbbb']
const bootSide = ['.efd...', '.fedc..', 'cfeddc.', 'cedddcb', 'bcccbbb']

const pauldronFront = ['.oppo.', 'oqWqpn', 'npqpnm', '.mnnm.']
const pauldronSide = ['.opo.', 'oqWpn', 'opqom', 'nooml', '.mml.']

interface Look {
  front: Rows
  back: Rows
  side: Rows
  broad: number
  hem: number
}

const YOUNG: Look = { front: youngFront, back: youngBack, side: youngSide, broad: 0, hem: 0 }
const ELDER: Look = { front: elderFront, back: elderBack, side: elderSide, broad: 1, hem: 7 }

interface Pose {
  facing: number
  bob: number
  lean: number
  headDy: number
  headDx: number
  blink: boolean
  near: Point
  far: Point
  main: Point | null
  off: Point | null
  shield: boolean
  sway: number
  lift: number
  mounted: boolean
}

interface Built {
  rows: string[]
  hand: readonly number[]
  behind: boolean
}

function widen(rows: Rows, by: number): string[] {
  if (by === 0) return [...rows]
  const mid = rows[0]!.length >> 1
  return rows.map(row => row.slice(0, 3) + row[3]!.repeat(by + 1) + row.slice(4, mid) + row[mid]!.repeat(by) + row.slice(mid))
}

function blinked(rows: Rows): string[] {
  return rows.map(row => row.replace(/W0/g, '++').replace(/0W/g, '++'))
}

function boot(l: Layer, rows: Rows, foot: Point): void {
  stamp(l, rows, Math.round(foot[0] - (rows[0]!.length === 7 ? 3 : 2.5)), Math.round(foot[1]) - 4)
}

function leg(g: Grid, hip: Point, foot: Point, side: boolean, far: boolean, sole: Rows): void {
  const l = layer(HERO_W, HERO_H)
  const ankle: Point = [foot[0], foot[1] - 3]
  const knee = side ? reach(hip, ankle, 4.6, 4.6, -1) : [hip[0] + (ankle[0] - hip[0]) * 0.5, hip[1] + (ankle[1] - hip[1]) * 0.5] as Point
  const bias = far ? -0.45 : 0
  capsule(l, hip, knee, 2.3, PANTS, bias)
  capsule(l, knee, ankle, 2, PANTS, bias)
  boot(l, sole, foot)
  commit(g, l)
}

function arm(g: Grid, shoulder: Point, hand: Point, bend: number, far: boolean, plate: Rows, plateAt: Point): Point {
  const l = layer(HERO_W, HERO_H)
  const elbow = reach(shoulder, hand, 5.2, 5.2, bend)
  const bias = far ? -0.5 : 0
  const wrist: Point = [elbow[0] + (hand[0] - elbow[0]) * 0.45, elbow[1] + (hand[1] - elbow[1]) * 0.45]
  capsule(l, shoulder, elbow, 1.6, SLEEVE, bias)
  capsule(l, elbow, wrist, 1.4, SLEEVE, bias)
  capsule(l, wrist, hand, 1.4, BRACER, bias)
  blob(l, hand[0], hand[1], 1.5, 1.5, GLOVE, bias + 0.3)
  stamp(l, plate, plateAt[0], plateAt[1])
  commit(g, l)
  return [(elbow[0] + hand[0]) / 2, (elbow[1] + hand[1]) / 2]
}

function cloakFront(g: Grid, look: Look, p: Pose): void {
  const l = layer(HERO_W, HERO_H)
  const top = 18 + p.bob
  const bottom = 31 + look.hem + p.bob - p.lift
  for (let y = top; y <= bottom; y++) {
    const t = (y - top) / (bottom - top)
    const half = 7.5 + look.broad + t * 2.5
    for (let x = Math.round(15.5 - half); x < Math.round(15.5 + half); x++) {
      const wave = Math.round(Math.sin((x + p.sway * 2) * 0.9))
      if (y === bottom && wave > 0) continue
      dot(l, x, y, x < 12 ? (t < 0.4 ? 'S' : '*') : x > 19 ? 'r' : 'R')
    }
  }
  commit(g, l)
}

function cloakBack(g: Grid, look: Look, p: Pose): void {
  const l = layer(HERO_W, HERO_H)
  const top = 17 + p.bob
  const bottom = 26 + look.hem + p.bob - p.lift
  for (let y = top; y <= bottom; y++) {
    const t = (y - top) / (bottom - top)
    const half = 6 + look.broad + t * 2 + (y === top ? -2 : 0)
    for (let x = Math.round(15.5 - half); x < Math.round(15.5 + half); x++) {
      const wave = Math.sin((x + p.sway * 2) * 0.9)
      if (y === bottom && wave > 0.3) continue
      const fold = Math.sin((x - 15.5) * 1.15 + p.sway * t * 1.6) * t
      const light = fold * 0.9 + (15.5 - x) * 0.09 - t * 0.55 + (y === top ? -0.6 : 0.25) + (y === bottom ? -0.5 : 0)
      dot(l, x, y, tone(CLOAK, light))
    }
  }
  commit(g, l)
}

function cloakSide(g: Grid, look: Look, p: Pose): void {
  const l = layer(HERO_W, HERO_H)
  const top = 18 + p.bob
  const bottom = 30 + look.hem + p.bob - p.lift
  for (let y = top; y <= bottom; y++) {
    const t = (y - top) / (bottom - top)
    const back = 11 + p.lean - Math.round(t * (2 + p.sway * 2.5))
    const front = 16 + p.lean - Math.round(t * 2)
    for (let x = back; x <= front; x++) {
      const key = x === back ? 'r' : x === back + 1 ? 'R' : t < 0.25 ? 'S' : (x + y) % 5 === 0 ? 'R' : '*'
      dot(l, x, y, key)
    }
  }
  commit(g, l)
}

function headRows(look: Look, p: Pose): Rows {
  const rows = p.facing === HERO_FRONT ? look.front : p.facing === HERO_BACK ? look.back : look.side
  return p.blink ? blinked(rows) : rows
}

function torsoRows(look: Look, facing: number): string[] {
  return widen(facing === HERO_FRONT ? torsoFront : facing === HERO_BACK ? torsoBack : torsoSide, facing === HERO_SIDE ? 0 : look.broad)
}

function paintStamp(g: Grid, rows: Rows, x: number, y: number): void {
  const l = layer(HERO_W, HERO_H)
  stamp(l, rows, x, y)
  commit(g, l)
}

function build(look: Look, p: Pose): Built {
  const g = grid(HERO_W, HERO_H)
  const hand = [0, 0, 0, 0]
  const y0 = p.bob
  const x0 = p.lean
  const b = look.broad
  const headY = 2 + y0 + p.headDy
  const torsoY = 17 + y0
  const store = (at: number, pt: Point) => {
    hand[at] = Math.floor(pt[0])
    hand[at + 1] = Math.floor(pt[1])
  }
  if (p.facing === HERO_SIDE) {
    cloakSide(g, look, p)
    const farShoulder: Point = [16 + x0, 19.5 + y0]
    const nearShoulder: Point = [14.5 + x0, 19.5 + y0]
    if (p.off) {
      const forearm = arm(g, farShoulder, p.off, 1, true, pauldronSide, [14 + x0, 17 + y0])
      store(2, p.shield ? forearm : p.off)
    }
    const hipY = 29.5 + y0
    if (p.mounted) {
      leg(g, [16 + x0, hipY], p.far, true, true, bootSide)
      leg(g, [15 + x0, hipY], p.near, true, false, bootSide)
    } else {
      leg(g, [16 + x0, hipY], p.far, true, true, bootSide)
      leg(g, [15 + x0, hipY], p.near, true, false, bootSide)
    }
    paintStamp(g, torsoRows(look, HERO_SIDE), 11 + x0, torsoY)
    paintStamp(g, headRows(look, p), 9 + x0 + p.headDx, headY)
    if (p.main) {
      arm(g, nearShoulder, p.main, 1, false, pauldronSide, [12 + x0, 17 + y0])
      store(0, p.main)
    }
  } else {
    const front = p.facing === HERO_FRONT
    if (front) cloakFront(g, look, p)
    const hipY = 29.5 + y0
    leg(g, [12.5 - b * 0.5 + x0, hipY], p.near, false, false, front ? bootFront : bootBack)
    leg(g, [19.5 + b * 0.5 + x0, hipY], p.far, false, false, front ? bootFront : bootBack)
    paintStamp(g, torsoRows(look, p.facing), 9 - b + x0, torsoY)
    const left: Point = [10 - b + x0, 19.5 + y0]
    const right: Point = [22 + b + x0, 19.5 + y0]
    const mainShoulder = front ? left : right
    const offShoulder = front ? right : left
    if (!front) {
      if (p.main) arm(g, mainShoulder, p.main, -1, false, pauldronFront, [mainShoulder[0] - 3, 17 + y0])
      if (p.off) {
        const forearm = arm(g, offShoulder, p.off, 1, false, pauldronFront, [offShoulder[0] - 3, 17 + y0])
        store(2, p.shield ? forearm : p.off)
      }
      cloakBack(g, look, p)
      paintStamp(g, headRows(look, p), 9 + x0 + p.headDx, headY)
    } else {
      paintStamp(g, headRows(look, p), 9 + x0 + p.headDx, headY)
      if (p.off) {
        const forearm = arm(g, offShoulder, p.off, -1, false, pauldronFront, [offShoulder[0] - 3, 17 + y0])
        store(2, p.shield ? forearm : p.off)
      }
      if (p.main) arm(g, mainShoulder, p.main, 1, false, pauldronFront, [mainShoulder[0] - 3, 17 + y0])
    }
    if (p.main) store(0, p.main)
  }
  return { rows: toRows(g), hand, behind: p.facing === HERO_BACK }
}

const FOOT_Y = 41

function pose(facing: number, part: Partial<Pose>): Pose {
  const side = facing === HERO_SIDE
  return {
    facing, bob: 0, lean: 0, headDy: 0, headDx: 0, blink: false,
    near: side ? [15, FOOT_Y] : [12.5, FOOT_Y], far: side ? [17.5, FOOT_Y] : [19.5, FOOT_Y],
    main: null, off: null, shield: true, sway: 0, lift: 0, mounted: false, ...part,
  }
}

type Hands = readonly [Point, Point]

interface Style {
  rest: readonly Hands[]
  windup: readonly Hands[]
  strike: readonly Hands[]
  follow: readonly Hands[]
  guard: readonly Hands[]
  hurt: readonly Hands[]
}

const SWORD: Style = {
  rest: [[[18, 29], [13, 28]], [[8, 29], [23, 29]], [[24, 29], [8, 29]]],
  windup: [[[12, 15], [17, 26]], [[5, 16], [23, 28]], [[27, 16], [9, 28]]],
  strike: [[[25, 24], [13, 27]], [[13, 31], [23, 28]], [[18, 15], [9, 28]]],
  follow: [[[21, 31], [12, 27]], [[22, 29], [24, 27]], [[9, 25], [8, 28]]],
  guard: [[[13, 28], [22, 23]], [[8, 28], [18, 25]], [[24, 28], [13, 22]]],
  hurt: [[[11, 26], [13, 24]], [[6, 24], [25, 24]], [[26, 24], [6, 24]]],
}

const GREAT: Style = {
  rest: [[[19, 28], [17, 28]], [[13, 29], [15, 29]], [[18, 28], [16, 28]]],
  windup: [[[12, 14], [13, 16]], [[7, 14], [9, 15]], [[24, 14], [22, 15]]],
  strike: [[[24, 23], [22, 23]], [[15, 31], [17, 30]], [[17, 15], [15, 16]]],
  follow: [[[20, 31], [18, 30]], [[22, 30], [20, 29]], [[10, 27], [12, 27]]],
  guard: [[[20, 24], [18, 25]], [[14, 25], [17, 25]], [[17, 24], [15, 24]]],
  hurt: [[[13, 26], [12, 25]], [[10, 25], [21, 25]], [[21, 25], [10, 25]]],
}

function facingPoses(facing: number, style: Style, two: boolean): Pose[] {
  const at = (hands: readonly Hands[]) => ({ main: hands[facing]![0], off: hands[facing]![1] })
  const side = facing === HERO_SIDE
  const rest = at(style.rest)
  const out: Pose[] = [
    pose(facing, rest),
    pose(facing, { ...rest, bob: 1, headDy: 0, sway: 0.3 }),
    pose(facing, { ...rest, blink: facing !== HERO_BACK }),
  ]
  for (let k = 0; k < WALK_FRAMES; k++) {
    const a = (k / WALK_FRAMES) * Math.PI * 2
    const c = Math.cos(a)
    const s = Math.sin(a)
    const bob = Math.abs(c) < 0.6 ? -1 : 0
    const swing = two ? 0 : 1
    const main = rest.main
    const off = rest.off
    if (side) {
      out.push(pose(facing, {
        bob, sway: 0.6 + 0.4 * s,
        near: [16 + c * 5, FOOT_Y - Math.max(0, s) * 2.5], far: [16 - c * 5, FOOT_Y - Math.max(0, -s) * 2.5],
        main: [main[0] - c * 3 * swing, main[1] + bob], off: [off[0] + c * 3 * swing, off[1] + bob],
      }))
    } else {
      out.push(pose(facing, {
        bob, sway: s,
        near: [12.5, FOOT_Y - Math.max(0, s) * 2.5], far: [19.5, FOOT_Y - Math.max(0, -s) * 2.5],
        main: [main[0], main[1] + bob - s * swing * 1.5], off: [off[0], off[1] + bob + s * swing * 1.5],
      }))
    }
  }
  const brace = side ? { near: [12, FOOT_Y] as Point, far: [21, FOOT_Y] as Point } : { near: [11, FOOT_Y] as Point, far: [21, FOOT_Y] as Point }
  const lunge = side ? { near: [20, FOOT_Y] as Point, far: [11, FOOT_Y] as Point } : brace
  out.push(pose(facing, { ...at(style.windup), ...brace, lean: side ? -1 : 0, sway: 0.2 }))
  out.push(pose(facing, { ...at(style.strike), ...lunge, lean: side ? 1 : 0, bob: 1, sway: 1.4 }))
  out.push(pose(facing, { ...at(style.follow), ...lunge, lean: side ? 1 : 0, bob: 1, sway: 1 }))
  out.push(pose(facing, { ...at(style.guard), ...brace, bob: 1, sway: 0.3 }))
  out.push(pose(facing, { ...at(style.hurt), ...brace, lean: side ? -1 : 0, headDx: side ? -1 : 0, headDy: 1, sway: 1.6, lift: 2 }))
  return out
}

function block(look: Look, style: Style, two: boolean): Built[] {
  const out: Built[] = []
  for (const facing of [HERO_SIDE, HERO_FRONT, HERO_BACK]) {
    for (const p of facingPoses(facing, style, two)) out.push(build(look, p))
  }
  out.push(build(look, pose(HERO_SIDE, { near: [12, FOOT_Y], far: [20, FOOT_Y], main: [14, 22], off: [26, 22], shield: false, sway: 0.4 })))
  out.push(build(look, pose(HERO_SIDE, { near: [12, FOOT_Y], far: [20, FOOT_Y], main: [19, 22], off: [26, 22], shield: false, sway: 0.4 })))
  out.push(build(look, pose(HERO_SIDE, { mounted: true, near: [20, 40], far: [21, 39], main: [22, 27], off: [23, 26], bob: 1, sway: 0.5 })))
  out.push(build(look, pose(HERO_SIDE, { near: [10, FOOT_Y - 1], far: [22, FOOT_Y], main: [11, 29], off: [12, 28], lean: 2, bob: 1, headDx: 1, sway: 2 })))
  return out
}

function rotate(rows: Rows, turns: number): string[] {
  let out = [...rows]
  for (let n = 0; n < turns; n++) {
    const h = out.length
    const w = out[0]!.length
    const next: string[] = []
    for (let x = 0; x < w; x++) {
      let row = ''
      for (let y = h - 1; y >= 0; y--) row += out[y]![x]!
      next.push(row)
    }
    out = next
  }
  return out
}

function crop(rows: Rows): string[] {
  let top = 0
  while (top < rows.length && !/[^.]/.test(rows[top]!)) top++
  let bottom = rows.length - 1
  while (bottom > top && !/[^.]/.test(rows[bottom]!)) bottom--
  let left = rows[0]!.length
  let right = 0
  for (let y = top; y <= bottom; y++) {
    const row = rows[y]!
    const a = row.search(/[^.]/)
    if (a >= 0 && a < left) left = a
    for (let x = row.length - 1; x > right; x--) if (row[x] !== '.') right = x
  }
  return rows.slice(top, bottom + 1).map(row => row.slice(left, right + 1))
}

function onGround(rows: Rows, w: number, h: number): string[] {
  const body = crop(rows)
  const left = (w - body[0]!.length) >> 1
  const top = h - 2 - body.length
  const out: string[] = []
  for (let y = 0; y < h; y++) {
    const row = body[y - top]
    out.push(row === undefined ? '.'.repeat(w) : '.'.repeat(left) + row + '.'.repeat(w - left - row.length))
  }
  return out
}

function ball(look: Look): string[] {
  const g = grid(HERO_W, HERO_H)
  const back = layer(HERO_W, HERO_H)
  blob(back, 15, 26, 9 + look.broad, 9, CLOAK, 0.2)
  commit(g, back)
  const body = layer(HERO_W, HERO_H)
  blob(body, 17, 27, 6, 6.5, 'JLMNO')
  commit(g, body)
  const legs = layer(HERO_W, HERO_H)
  capsule(legs, [14, 30], [21, 31], 2.4, PANTS)
  capsule(legs, [21, 31], [21, 34], 2, PANTS)
  stamp(legs, bootSide, 18, 32)
  commit(g, legs)
  const head = layer(HERO_W, HERO_H)
  stamp(head, look.side.slice(0, 13), 10, 13)
  commit(g, head)
  const hands = layer(HERO_W, HERO_H)
  blob(hands, 21, 25, 1.6, 1.6, GLOVE, 0.3)
  capsule(hands, [16, 22], [21, 25], 1.5, SLEEVE)
  stamp(hands, pauldronSide, 13, 19)
  commit(g, hands)
  return toRows(g)
}

function falls(look: Look): Built[] {
  const tuck = ball(look)
  const out: string[][] = []
  for (let n = 0; n < ROLL_FRAMES; n++) out.push(onGround(rotate(tuck, n), HERO_W, HERO_H))
  const kneel = build(look, pose(HERO_SIDE, { near: [21, FOOT_Y], far: [14, 39], main: [21, 38], off: [19, 37], bob: 8, lean: 1, headDy: 2, headDx: 1, sway: 0.5, lift: 4 })).rows
  const slump = build(look, pose(HERO_SIDE, { near: [21, FOOT_Y], far: [12, FOOT_Y], main: [25, 40], off: [24, 40], bob: 12, lean: 3, headDy: 3, headDx: 2, sway: 0.2, lift: 6 })).rows
  const limp = build(look, pose(HERO_SIDE, { near: [14, FOOT_Y], far: [17, FOOT_Y], main: [17, 30], off: [15, 30], sway: 0 })).rows
  out.push(onGround(kneel, HERO_W, HERO_H), onGround(slump, HERO_W, HERO_H), onGround(rotate(limp, 1), HERO_H, HERO_H))
  return out.map(rows => ({ rows, hand: [0, 0, 0, 0], behind: false }))
}

const BUILT: Built[] = [
  ...block(YOUNG, SWORD, false), ...block(YOUNG, GREAT, true), ...block(ELDER, SWORD, false), ...block(ELDER, GREAT, true),
  ...falls(YOUNG), ...falls(ELDER),
]

export const HERO_FRAMES: readonly Rows[] = BUILT.map(built => built.rows)
export const HERO_HAND = Uint8Array.from(BUILT.flatMap(built => built.hand))
export const HERO_BEHIND = Uint8Array.from(BUILT.map(built => (built.behind ? 1 : 0)))
