import { recolor, type Rows } from './paint.ts'
import { MAN, animate, arm, joints, leg, pose, walkCycle, withLean, type Draw, type FoeArt, type Frame, type Pose } from './foe-rig.ts'
import { box, dot, ell, line, mat, poly, seg, type Canvas } from './sculpt.ts'
import { finish, grid, legsSide, legsSideA, legsSideB, legsSideBrace, legsSidePass, limb, paste, shoulder, type Grid, type Point } from './rig.ts'

const W = 14
const H = 20

export interface Kin {
  head: Rows
  headX: number
  headY: number
  torso: Rows
  torsoX: number
  torsoY: number
  legs: string
  near: string
  far: string
  pad: string
  back: Rows
  backX: number
  rest: readonly [Point, Point, number]
  windup: readonly [Point, Point, number]
  weapon: (g: Grid, hand: Point, angle: number, drawn: boolean) => void
  front: (g: Grid, off: Point, drawn: boolean) => void
}

const LEG_KEYS = 'EDldcb'

export function humanoid(kin: Kin): string[][] {
  const walk = [legsSideA, legsSidePass, legsSideB, legsSidePass]
  const frames: string[][] = []
  const make = (legs: Rows, bob: number, headDy: number, arms: readonly [Point, Point, number], drawn: boolean, lean: number) => {
    const g = grid(W, H)
    const ty = kin.torsoY + bob
    const sx = kin.torsoX + 3 + lean
    paste(g, kin.back, kin.backX + lean, ty + 1)
    limb(g, kin.torsoX + 1, ty + 2, [arms[1][0], arms[1][1] + bob], kin.far)
    paste(g, recolor(legs, LEG_KEYS, kin.legs), 4, H - legs.length)
    paste(g, kin.torso, kin.torsoX + lean, ty)
    paste(g, kin.head, kin.headX + lean, kin.headY + bob + headDy)
    const hand: Point = [arms[0][0], arms[0][1] + bob]
    kin.weapon(g, hand, arms[2], drawn)
    limb(g, sx, ty + 2, hand, kin.near)
    if (kin.pad) shoulder(g, sx, ty + 1, kin.pad)
    kin.front(g, [arms[1][0], arms[1][1] + bob], drawn)
    frames.push(finish(g))
  }
  make(legsSide, 0, 0, kin.rest, false, 0)
  make(legsSide, 0, 1, kin.rest, false, 0)
  walk.forEach((legs, n) => make(legs, n & 1 ? -1 : 0, 0, [[kin.rest[0][0] + (n === 0 ? -1 : n === 2 ? 1 : 0), kin.rest[0][1]], kin.rest[1], kin.rest[2]], false, 0))
  make(legsSideBrace, 1, 0, kin.windup, true, -1)
  return frames
}

export function blob(g: Grid, at: Point, angle: number, distance: number, rows: Rows): void {
  const x = Math.round(at[0] + Math.cos(angle) * distance) - (rows[0]!.length >> 1)
  const y = Math.round(at[1] + Math.sin(angle) * distance) - (rows.length >> 1)
  paste(g, rows, x, y)
}

export const none = () => {}

const steel = mat('k', 'mnopq')
const mail = mat('k', 'lmno', -0.1)
const red = mat('r', 'R:S;')
const skin = mat('b', 'Hji')
const leather = mat('b', 'cdef')
const boot = mat('0', 'kbcd')
const gold = mat('b', 'KAU')
const blade = mat('k', 'nopqW', 0.2)

function sword(c: Canvas, x: number, y: number, angle: number): void {
  const cx = Math.cos(angle)
  const cy = Math.sin(angle)
  seg(c, leather, x - cx * 2.5, y - cy * 2.5, x + cx * 1.5, y + cy * 1.5, 1)
  seg(c, gold, x + cx * 1.8 - cy * 3, y + cy * 1.8 + cx * 3, x + cx * 1.8 + cy * 3, y + cy * 1.8 - cx * 3, 0.9)
  seg(c, blade, x + cx * 2.5, y + cy * 2.5, x + cx * 15, y + cy * 15, 1.3, 0.6)
  line(c, x + cx * 3, y + cy * 3, x + cx * 13, y + cy * 13, 'W')
}

function kettleHead(c: Canvas, x: number, y: number): void {
  ell(c, skin, x + 1, y + 1.5, 5, 5.4, { bias: 0.25 })
  dot(c, x + 3.5, y + 1, '0')
  dot(c, x + 3.5, y + 2, '0')
  line(c, x + 2.5, y, x + 4.5, y, 'H')
  dot(c, x + 6, y + 2.5, 'j')
  line(c, x + 2.5, y + 4.5, x + 4.5, y + 4.5, 'H')
  ell(c, steel, x, y - 4.2, 5.8, 4.4)
  ell(c, steel, x + 0.5, y - 1.8, 8.8, 1.8, { join: true, flat: 0.3 })
  line(c, x - 4.5, y - 1.5, x + 5.5, y - 1.5, 'n')
  dot(c, x - 2, y - 6, 'W')
}

const drawFootman: Draw = (c, p) => {
  const j = joints(p)
  withLean(c, j.hipX, j.hipY, p.lean, () => {
    arm(c, j.shFX, j.shFY, p.shF, p.elF, 6, 5.5, 1.9, mail, leather)
  })
  leg(c, j.hipX - 2.5, j.hipY, p.hipF, p.kneeF, 8, 7.5, 2.4, leather, boot)
  leg(c, j.hipX + 2, j.hipY, p.hipN, p.kneeN, 8, 7.5, 2.4, leather, boot)
  withLean(c, j.hipX, j.hipY, p.lean, () => {
    ell(c, mail, j.hipX, j.hipY - 6, 6.5, 7)
    poly(c, red, [j.hipX - 5, j.hipY - 12, j.hipX + 5.5, j.hipY - 12, j.hipX + 6.5, j.hipY + 2, j.hipX + 4, j.hipY + 4, j.hipX + 1, j.hipY + 2.5, j.hipX - 2, j.hipY + 4, j.hipX - 6, j.hipY + 2])
    line(c, j.hipX - 2.5, j.hipY - 10, j.hipX - 2.5, j.hipY - 4, 'R')
    box(c, leather, j.hipX - 6.5, j.hipY - 3, 13.5, 2, { flat: 0.6 })
    dot(c, j.hipX + 2, j.hipY - 2, 'A')
    line(c, j.hipX + 1.5, j.hipY - 10.5, j.hipX + 1.5, j.hipY - 4.5, 'U')
    line(c, j.hipX - 0.5, j.hipY - 8.5, j.hipX + 3.5, j.hipY - 8.5, 'U')
    dot(c, j.hipX + 1.5, j.hipY - 8.5, 'A')
    withLean(c, j.headX, j.headY + 4, p.head, () => kettleHead(c, j.headX, j.headY))
    const [hx, hy] = arm(c, j.shNX, j.shNY, p.shN, p.elN, 6, 5.5, 2, mail, leather)
    sword(c, hx, hy, p.wpn)
    ell(c, leather, hx, hy, 1.7, 1.7)
    ell(c, steel, j.shNX, j.shNY + 0.5, 3, 2.4)
  })
}

const footmanBase = pose({})
export const footman: FoeArt = animate(MAN, drawFootman, {
  idle: [footmanBase, pose({ bob: 1, shN: 0.35, elN: -0.7, wpn: 1.2 })],
  walk: walkCycle(footmanBase, 0.45, 0.25),
  windup: pose({ lean: -0.2, hipN: 0.4, kneeN: 0.3, hipF: -0.35, shN: -2.4, elN: -0.6, shF: 0.4, elF: -0.8, wpn: -2.2, head: -0.1 }),
  strike: pose({ lean: 0.25, bob: 1, hipN: 0.55, kneeN: 0.6, hipF: -0.45, shN: 1.5, elN: 0.1, shF: -0.6, elF: -0.2, wpn: 0.45 }),
  stagger: pose({ lean: -0.35, bob: 1, head: -0.3, hipN: 0.25, kneeN: 0.5, hipF: -0.1, kneeF: 0.4, shN: -0.8, elN: -0.5, shF: -1.2, elF: -0.3, wpn: -1.4 }),
})

const hood = mat('s', 'tuvw')
const jerkin = mat('b', 'cdef')
const wood = mat('b', 'deh')
const feather = mat('r', 'SW')

function bow(c: Canvas, gx: number, gy: number, draw: number, pull: readonly [number, number] | null): void {
  const tipX = gx - 1.5 - draw
  seg(c, wood, gx, gy, gx + 1, gy - 5, 1, 0.9)
  seg(c, wood, gx + 1, gy - 5, tipX, gy - 10, 0.9, 0.6, { join: true })
  seg(c, wood, gx, gy, gx + 1, gy + 5, 1, 0.9, { join: true })
  seg(c, wood, gx + 1, gy + 5, tipX, gy + 10, 0.9, 0.6, { join: true })
  if (pull) {
    line(c, tipX, gy - 10, pull[0], pull[1], 'q')
    line(c, tipX, gy + 10, pull[0], pull[1], 'q')
    line(c, pull[0], pull[1], gx + 4, gy, 'f')
    dot(c, gx + 4, gy, 'p')
    dot(c, gx + 5, gy, 'W')
  } else line(c, tipX, gy - 10, tipX, gy + 10, 'q')
  dot(c, gx, gy, 'A')
}

const drawArcher: Draw = (c, p) => {
  const j = joints(p)
  withLean(c, j.hipX, j.hipY, p.lean, () => {
    seg(c, jerkin, j.hipX - 5, j.hipY - 13, j.hipX - 7, j.hipY - 1, 2.2, 2.4)
    for (let n = 0; n < 3; n++) seg(c, feather, j.hipX - 5 + n, j.hipY - 14 - n * 0.5, j.hipX - 4 + n, j.hipY - 18 + n, 0.8)
    seg(c, hood, j.hipX - 4, j.hipY - 12, j.hipX - 7, j.hipY + 2, 3, 3.6, { bias: -0.15 })
  })
  leg(c, j.hipX - 2.5, j.hipY, p.hipF, p.kneeF, 8, 7.5, 2.2, jerkin, boot)
  leg(c, j.hipX + 2, j.hipY, p.hipN, p.kneeN, 8, 7.5, 2.2, jerkin, boot)
  withLean(c, j.hipX, j.hipY, p.lean, () => {
    ell(c, jerkin, j.hipX, j.hipY - 6, 5.8, 7.2)
    poly(c, hood, [j.hipX - 5, j.hipY - 12, j.hipX + 5, j.hipY - 12, j.hipX + 3, j.hipY - 7, j.hipX - 5.5, j.hipY - 6])
    box(c, leather, j.hipX - 6, j.hipY - 3, 12.5, 2, { flat: 0.6 })
    dot(c, j.hipX + 1, j.hipY - 2, 'A')
    line(c, j.hipX - 4, j.hipY - 11, j.hipX + 4, j.hipY - 1, 'b')
    withLean(c, j.headX, j.headY + 4, p.head, () => {
      ell(c, hood, j.headX - 0.5, j.headY - 0.5, 6.2, 6.6)
      seg(c, hood, j.headX - 3, j.headY - 4, j.headX - 7, j.headY + 1, 2.2, 1, { join: true })
      ell(c, skin, j.headX + 2.5, j.headY + 1.5, 3.4, 4, { bias: -0.15 })
      dot(c, j.headX + 4, j.headY + 1, 'U')
      line(c, j.headX + 1.5, j.headY - 1, j.headX + 5, j.headY - 1, 's')
      line(c, j.headX + 5.5, j.headY - 2, j.headX + 5.5, j.headY + 4, 't')
    })
    const draw = p.open
    const [gx, gy] = arm(c, j.shFX + 2, j.shFY, p.shF, p.elF, 6, 5.5, 1.8, jerkin, leather)
    const [hx, hy] = arm(c, j.shNX, j.shNY, p.shN, p.elN, 6, 5, 1.9, jerkin, leather)
    bow(c, gx, gy, draw, draw > 0.5 ? [hx, hy] : null)
    ell(c, leather, hx, hy, 1.6, 1.6)
  })
}

export const archer: FoeArt = animate(MAN, drawArcher, {
  idle: [pose({ shF: 0.5, elF: -0.4, shN: 0.1, elN: -0.3 }), pose({ bob: 1, shF: 0.55, elF: -0.45, shN: 0.15, elN: -0.4 })],
  walk: walkCycle(pose({ shF: 0.5, elF: -0.4, shN: 0.1, elN: -0.3 }), 0.45, 0.2),
  windup: pose({ lean: -0.1, hipN: 0.35, hipF: -0.35, shF: 1.57, elF: 0, shN: 1.1, elN: 1.2, open: 3, head: 0.05 }),
  strike: pose({ lean: -0.05, hipN: 0.35, hipF: -0.35, shF: 1.57, elF: 0, shN: 0.6, elN: 2.2, open: 0 }),
  stagger: pose({ lean: -0.35, bob: 1, head: -0.3, hipN: 0.25, kneeN: 0.5, kneeF: 0.4, shN: -0.8, elN: -0.5, shF: -0.4, elF: -0.8 }),
})

const plate = mat('k', 'lmnopqW', -0.32)
const plume = mat('r', 'R:S;')
const shieldFace = mat('r', 'R:S', 0.1)
const shieldRim = mat('k', 'Knop', 0.2)

const drawKnight: Draw = (c, p) => {
  const j = joints(p)
  leg(c, j.hipX - 2.5, j.hipY, p.hipF, p.kneeF, 8, 7.5, 2.6, plate, plate)
  leg(c, j.hipX + 2, j.hipY, p.hipN, p.kneeN, 8, 7.5, 2.6, plate, plate)
  withLean(c, j.hipX, j.hipY, p.lean, () => {
    ell(c, plate, j.hipX, j.hipY - 6.5, 7, 7.5)
    line(c, j.hipX - 4, j.hipY - 9, j.hipX + 5, j.hipY - 9.5, 'm')
    line(c, j.hipX - 1, j.hipY - 12, j.hipX - 2, j.hipY - 6, 'p')
    poly(c, plume, [j.hipX - 5, j.hipY - 4, j.hipX + 5, j.hipY - 4, j.hipX + 6, j.hipY + 3, j.hipX - 6, j.hipY + 3])
    box(c, leather, j.hipX - 6.5, j.hipY - 4.5, 13, 1.8, { flat: 0.6 })
    withLean(c, j.headX, j.headY + 4, p.head, () => {
      ell(c, plate, j.headX, j.headY - 0.5, 6, 6.8)
      box(c, plate, j.headX - 1, j.headY - 1, 7.5, 6, { join: true, nx: 0.3, ny: 0 })
      line(c, j.headX + 1, j.headY + 0.5, j.headX + 6.5, j.headY + 0.5, '0')
      line(c, j.headX + 4, j.headY + 1, j.headX + 4, j.headY + 4, '0')
      dot(c, j.headX + 5, j.headY + 0.5, 'U')
      line(c, j.headX - 1, j.headY - 7, j.headX - 1, j.headY + 5, 'm')
      seg(c, plume, j.headX - 1, j.headY - 7, j.headX - 6, j.headY - 9, 2, 1.5)
      seg(c, plume, j.headX - 6, j.headY - 9, j.headX - 11, j.headY - 4, 1.5, 0.8, { join: true })
      for (let n = 0; n < 3; n++) dot(c, j.headX + 3 + n, j.headY + 3, 'k')
      ell(c, plate, j.headX + 0.5, j.headY + 6.5, 4.5, 1.6)
    })
    const [hx, hy] = arm(c, j.shNX - 1, j.shNY, p.shN, p.elN, 6, 5.5, 2.1, plate, plate)
    const cx = Math.cos(p.wpn)
    const cy = Math.sin(p.wpn)
    seg(c, wood, hx - cx * 2, hy - cy * 2, hx + cx * 9, hy + cy * 9, 0.9)
    ell(c, plate, hx + cx * 11, hy + cy * 11, 2.8, 2.8)
    dot(c, hx + cx * 11 - cy * 3.5, hy + cy * 11 + cx * 3.5, 'n')
    dot(c, hx + cx * 11 + cy * 3.5, hy + cy * 11 - cx * 3.5, 'n')
    dot(c, hx + cx * 14, hy + cy * 14, 'n')
    ell(c, plate, j.shNX - 1, j.shNY + 0.5, 3.4, 2.8)
    line(c, j.shNX - 3.5, j.shNY + 1.5, j.shNX + 1.5, j.shNY + 1.5, 'm')
    const [sx, sy] = arm(c, j.shFX + 2, j.shFY, p.shF, p.elF, 6, 5, 2, plate, plate)
    const tx = sx + 2.5
    const ty = sy - 2
    poly(c, shieldRim, [tx - 5, ty - 11, tx + 6, ty - 11, tx + 6.5, ty + 6, tx + 0.5, ty + 12, tx - 5.5, ty + 6])
    poly(c, shieldFace, [tx - 3.8, ty - 9.8, tx + 4.8, ty - 9.8, tx + 5.2, ty + 5.4, tx + 0.5, ty + 10.4, tx - 4.2, ty + 5.4], { nx: -0.1, ny: -0.2 })
    line(c, tx + 0.5, ty - 8, tx + 0.5, ty + 7, 'A')
    line(c, tx - 3, ty - 3, tx + 4, ty - 3, 'A')
    dot(c, tx + 0.5, ty - 3, 'U')
    line(c, tx - 4.5, ty - 10.5, tx + 5, ty - 10.5, 'q')
  })
}

export const knight: FoeArt = animate(MAN, drawKnight, {
  idle: [pose({ shF: 0.9, elF: 0.3, shN: 0.1, elN: -2, wpn: -1.75 }), pose({ bob: 1, shF: 0.9, elF: 0.3, shN: 0.15, elN: -2, wpn: -1.7 })],
  walk: walkCycle(pose({ shF: 0.9, elF: 0.3, shN: 0.1, elN: -2, wpn: -1.75 }), 0.35, 0.05),
  windup: pose({ lean: -0.1, hipN: 0.35, hipF: -0.35, kneeN: 0.2, shF: 1.1, elF: 0.2, shN: -2.5, elN: -0.4, wpn: -2.4 }),
  strike: pose({ lean: 0.2, bob: 1, hipN: 0.5, kneeN: 0.5, hipF: -0.4, shF: 0.8, elF: 0.4, shN: 1.6, elN: -0.1, wpn: 0.2 }),
  stagger: pose({ lean: -0.3, bob: 1, head: -0.25, hipN: 0.2, kneeN: 0.5, kneeF: 0.4, shF: -0.2, elF: -0.4, shN: -0.9, elN: -0.4, wpn: -1.8 }),
})

const bone = mat('0', '@&qW')
const shroud = mat('0', 'ky$', -0.1)
const rust = mat('b', 'He7')

const drawWight: Draw = (c, p) => {
  const j = joints(p)
  withLean(c, j.hipX, j.hipY, p.lean, () => {
    poly(c, shroud, [j.hipX - 5, j.hipY - 13, j.hipX - 9, j.hipY - 2, j.hipX - 11, j.hipY + 8, j.hipX - 8, j.hipY + 5, j.hipX - 7, j.hipY + 10, j.hipX - 4, j.hipY + 6, j.hipX - 1, j.hipY + 2])
    const [fx, fy] = arm(c, j.shFX, j.shFY, p.shF, p.elF, 6, 5.5, 1, bone, bone)
    seg(c, bone, fx, fy, fx + 2, fy + 2, 0.6)
  })
  leg(c, j.hipX - 2.5, j.hipY, p.hipF, p.kneeF, 8, 7.5, 1.2, bone, bone)
  leg(c, j.hipX + 2, j.hipY, p.hipN, p.kneeN, 8, 7.5, 1.2, bone, bone)
  withLean(c, j.hipX, j.hipY, p.lean, () => {
    ell(c, bone, j.hipX, j.hipY - 0.5, 4, 2)
    seg(c, bone, j.hipX, j.hipY - 1, j.hipX + 0.5, j.hipY - 12, 1)
    for (let r = 0; r < 4; r++) {
      const y = j.hipY - 10 + r * 2
      seg(c, bone, j.hipX - 4 + r * 0.4, y + 1, j.hipX + 4.5 - r * 0.4, y, 0.7)
    }
    poly(c, shroud, [j.hipX - 6, j.hipY - 13, j.hipX + 2, j.hipY - 13, j.hipX - 2, j.hipY - 5, j.hipX - 4, j.hipY + 4, j.hipX - 6, j.hipY + 1, j.hipX - 7, j.hipY + 7])
    withLean(c, j.headX, j.headY + 4, p.head, () => {
      ell(c, bone, j.headX + 0.5, j.headY - 0.5, 5, 5.2)
      box(c, bone, j.headX + 0.5, j.headY + 2, 4.5, 3.2, { join: true })
      ell(c, shroud, j.headX + 3, j.headY - 0.5, 1.6, 1.4)
      dot(c, j.headX + 3, j.headY - 0.5, 'Z')
      dot(c, j.headX + 3.5, j.headY - 1.5, 'W')
      ell(c, shroud, j.headX - 0.5, j.headY - 0.5, 1.2, 1.4)
      dot(c, j.headX - 0.5, j.headY - 0.5, 'Y')
      for (let n = 0; n < 4; n++) dot(c, j.headX + 1 + n, j.headY + 3.5, n & 1 ? 'k' : 'q')
      poly(c, shroud, [j.headX - 6, j.headY - 7, j.headX + 2, j.headY - 7.5, j.headX - 1, j.headY - 4, j.headX - 4, j.headY + 6, j.headX - 7, j.headY + 3])
    })
    const [hx, hy] = arm(c, j.shNX, j.shNY, p.shN, p.elN, 6, 5.5, 1.1, bone, bone)
    const cx = Math.cos(p.wpn)
    const cy = Math.sin(p.wpn)
    seg(c, rust, hx + cx * 1.5, hy + cy * 1.5, hx + cx * 13, hy + cy * 13, 1.2, 0.7)
    line(c, hx + cx * 3, hy + cy * 3, hx + cx * 7, hy + cy * 7, 'n')
    seg(c, leather, hx - cx * 2, hy - cy * 2, hx + cx, hy + cy, 0.8)
    ell(c, bone, hx, hy, 1.1, 1.1)
  })
}

export const wight: FoeArt = animate(MAN, drawWight, {
  idle: [pose({ lean: 0.08, head: 0.1, shN: 0.35, elN: -0.4, wpn: 1.3 }), pose({ lean: 0.1, bob: 1, head: 0.2, shN: 0.4, elN: -0.5, wpn: 1.35 })],
  walk: walkCycle(pose({ lean: 0.12, shN: 0.35, elN: -0.4, wpn: 1.3 }), 0.4, 0.3),
  windup: pose({ lean: -0.15, bob: 2, hipN: 0.6, kneeN: 0.9, hipF: -0.5, kneeF: 0.5, shN: -2.2, elN: -0.8, shF: 0.9, elF: -0.4, wpn: -2.6, head: 0.15 }),
  strike: pose({ lean: 0.45, bob: 2, hipN: 0.8, kneeN: 0.9, hipF: -0.7, shN: 1.7, elN: 0, shF: -0.9, elF: 0, wpn: 0.15, head: 0.2 }),
  stagger: pose({ lean: -0.35, bob: 1, head: -0.35, hipN: 0.25, kneeN: 0.5, kneeF: 0.4, shN: -0.8, elN: -0.5, shF: -1.2, elF: -0.3, wpn: -1.5 }),
}, [0.3, 0.8, 1.45, 1.57], [0, 0.15, 0.4, 0.7])

const bloat = mat('V', 'X<>Y', -0.05)
const kelp = mat('s', 'tuv')
const rag = mat('V', 'XY<', -0.1)

const drawDrowned: Draw = (c, p) => {
  const j = joints(p)
  withLean(c, j.hipX, j.hipY, p.lean, () => {
    arm(c, j.shFX, j.shFY + 1, p.shF, p.elF, 6.5, 6, 2.2, bloat, bloat)
  })
  leg(c, j.hipX - 2.5, j.hipY, p.hipF, p.kneeF, 7, 7.5, 2.6, rag, bloat)
  leg(c, j.hipX + 2.5, j.hipY, p.hipN, p.kneeN, 7, 7.5, 2.6, rag, bloat)
  withLean(c, j.hipX, j.hipY, p.lean, () => {
    ell(c, bloat, j.hipX + 1, j.hipY - 6, 8, 8.5)
    poly(c, rag, [j.hipX - 7, j.hipY - 2, j.hipX + 8, j.hipY - 3, j.hipX + 7, j.hipY + 3, j.hipX + 4, j.hipY + 1, j.hipX + 2, j.hipY + 4, j.hipX - 1, j.hipY + 1, j.hipX - 4, j.hipY + 4, j.hipX - 7, j.hipY + 2])
    for (let n = 0; n < 3; n++) seg(c, kelp, j.hipX - 5 + n * 4, j.hipY - 13 + n, j.hipX - 6 + n * 4.5, j.hipY - 1 + n * 2, 0.9, 0.6)
    dot(c, j.hipX + 4, j.hipY - 9, 'P')
    dot(c, j.hipX - 2, j.hipY - 5, 'P')
    withLean(c, j.headX, j.headY + 6, p.head, () => {
      ell(c, bloat, j.headX + 1.5, j.headY + 2, 5.4, 5)
      ell(c, kelp, j.headX - 1, j.headY - 1.5, 5, 3, { flat: 0.3 })
      seg(c, kelp, j.headX - 4, j.headY - 1, j.headX - 5, j.headY + 6, 1.4, 0.7, { join: true })
      seg(c, kelp, j.headX + 1, j.headY - 2, j.headX + 1, j.headY + 3, 1, 0.6, { join: true })
      dot(c, j.headX + 4, j.headY + 1.5, 'W')
      dot(c, j.headX + 4, j.headY + 2.5, 'P')
      ell(c, shroud, j.headX + 4.5, j.headY + 5, 1.2, 0.9)
    })
    const [hx, hy] = arm(c, j.shNX, j.shNY + 1, p.shN, p.elN, 6.5, 6, 2.3, bloat, bloat)
    seg(c, kelp, hx - 1, hy, hx - 1.5, hy + 4, 0.6)
    dot(c, hx + 1, hy + 2.5, 'O')
  })
}

export const drowned: FoeArt = animate(MAN, drawDrowned, {
  idle: [pose({ lean: 0.15, head: 0.25, shN: 0.15, elN: 0.1, shF: -0.05, elF: 0.1 }), pose({ lean: 0.18, bob: 1, head: 0.3, shN: 0.2, elN: 0.15, shF: 0, elF: 0.15 })],
  walk: walkCycle(pose({ lean: 0.18, head: 0.2, shN: 0.2, elN: 0.2, shF: 0, elF: 0.1 }), 0.3, 0.12),
  windup: pose({ lean: -0.2, head: -0.15, hipN: 0.3, hipF: -0.3, shN: -2.7, elN: -0.3, shF: -2.9, elF: -0.2 }),
  strike: pose({ lean: 0.4, bob: 2, hipN: 0.5, kneeN: 0.5, hipF: -0.4, shN: 1.9, elN: 0.2, shF: 1.6, elF: 0.3, head: 0.3 }),
  stagger: pose({ lean: -0.35, bob: 1, head: -0.35, hipN: 0.25, kneeN: 0.5, kneeF: 0.4, shN: -0.8, elN: -0.5, shF: -1.2, elF: -0.3 }),
}, [0.25, 0.7, 1.35, 1.5], [0, 0, 0.2, 0.55])

const brute = mat('b', 'Hj+i', 0.05)
const iron = mat('0', 'lmno')
const ragBrown = mat('b', 'cde')

function chainLink(c: Canvas, ax: number, ay: number, bx: number, by: number): void {
  const n = Math.max(2, Math.round(Math.hypot(bx - ax, by - ay) / 2))
  for (let k = 0; k <= n; k++) dot(c, ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n, k & 1 ? 'n' : 'p')
}

const drawChained: Draw = (c, p) => {
  const j = joints(p)
  const bx = j.hipX - 0.5
  withLean(c, bx, j.hipY, p.lean, () => {
    arm(c, j.shFX - 2, j.shFY - 1, p.shF, p.elF, 6.5, 6, 2.8, brute, brute)
  })
  leg(c, bx - 3, j.hipY, p.hipF, p.kneeF, 7.5, 7.5, 3, ragBrown, iron)
  leg(c, bx + 2.5, j.hipY, p.hipN, p.kneeN, 7.5, 7.5, 3, ragBrown, iron)
  withLean(c, bx, j.hipY, p.lean, () => {
    ell(c, brute, bx, j.hipY - 8, 8.5, 8.5)
    line(c, bx + 1, j.hipY - 12, bx + 1, j.hipY - 4, 'H')
    line(c, bx - 4, j.hipY - 9, bx + 6, j.hipY - 10, 'H')
    poly(c, ragBrown, [bx - 7, j.hipY - 3, bx + 7, j.hipY - 3, bx + 8, j.hipY + 3, bx + 4, j.hipY + 1, bx, j.hipY + 4, bx - 4, j.hipY + 1, bx - 8, j.hipY + 3])
    box(c, iron, bx - 7.5, j.hipY - 4, 15, 2, { flat: 0.5 })
    withLean(c, j.headX, j.headY + 4, p.head, () => {
      ell(c, brute, j.headX + 1.5, j.headY + 1, 5.2, 5.4)
      ell(c, ragBrown, j.headX - 0.5, j.headY - 2.5, 4.5, 2.6, { flat: 0.4 })
      line(c, j.headX + 2.5, j.headY, j.headX + 6, j.headY + 0.5, 'H')
      dot(c, j.headX + 4.5, j.headY + 1, 'A')
      dot(c, j.headX + 4.5, j.headY + 1.9, 'S')
      line(c, j.headX + 3.5, j.headY + 4.5, j.headX + 6, j.headY + 4.5, 'b')
      dot(c, j.headX + 4, j.headY + 3.8, 'W')
      ell(c, iron, j.headX + 0.5, j.headY + 7, 6.5, 2.2, { flat: 0.3 })
      dot(c, j.headX - 1, j.headY + 6.5, 'p')
      dot(c, j.headX + 3, j.headY + 6.5, 'p')
      chainLink(c, j.headX - 4, j.headY + 8, j.headX - 7, j.headY + 13)
    })
    const [hx, hy] = arm(c, j.shNX + 1, j.shNY, p.shN, p.elN, 6.5, 6, 3, brute, brute)
    box(c, iron, hx - 2.5, hy - 4.5, 5, 2.4, { flat: 0.5 })
    const reach = 6 + p.open
    const ballX = hx + Math.cos(p.wpn) * reach
    const ballY = hy + Math.sin(p.wpn) * reach
    chainLink(c, hx, hy, ballX, ballY)
    ell(c, iron, ballX, ballY, 4.2, 4.2)
    dot(c, ballX - 2, ballY - 4.6, 'n')
    dot(c, ballX + 4.6, ballY, 'n')
    dot(c, ballX - 4.6, ballY + 1, 'm')
    ell(c, iron, j.shNX + 1, j.shNY - 0.5, 3.6, 2.5)
  })
}

export const chained: FoeArt = animate(MAN, drawChained, {
  idle: [pose({ lean: 0.1, shN: 0.2, elN: 0, shF: -0.1, elF: 0.2, wpn: 1.45, open: 2 }), pose({ lean: 0.12, bob: 1, shN: 0.25, elN: 0, shF: -0.1, elF: 0.25, wpn: 1.5, open: 2 })],
  walk: walkCycle(pose({ lean: 0.12, shN: 0.2, elN: 0, shF: -0.1, elF: 0.2, wpn: 1.3, open: 2 }), 0.35, 0.2),
  windup: pose({ lean: -0.2, hipN: 0.4, hipF: -0.4, kneeN: 0.3, shN: -2.6, elN: -0.2, shF: 0.6, elF: -0.5, wpn: -2.4, open: 6 }),
  strike: pose({ lean: 0.3, bob: 2, hipN: 0.6, kneeN: 0.6, hipF: -0.5, shN: 1.6, elN: 0, shF: -0.5, elF: 0, wpn: 0.15, open: 14 }),
  stagger: pose({ lean: -0.3, bob: 1, head: -0.3, hipN: 0.25, kneeN: 0.5, kneeF: 0.4, shN: -0.6, elN: -0.4, shF: -1, elF: -0.3, wpn: 1.9, open: 3 }),
})

const HOUND: Frame = { w: 64, h: 44, fy: 40 }
const char = mat('0', 'klmn', -0.05)
const ember = mat('r', 'TAU', 0.3)

function crack(c: Canvas, pts: readonly number[], hot: string): void {
  for (let i = 0; i + 3 < pts.length; i += 2) line(c, pts[i]!, pts[i + 1]!, pts[i + 2]!, pts[i + 3]!, i % 4 === 0 ? hot : 'T')
}

const drawHound: Draw = (c, p) => {
  const y = 26 + p.bob
  const hx = 23
  const fx = 36
  withLean(c, 30, y, p.lean, () => {
    seg(c, char, hx - 4, y - 2, hx - 11, y - 8 + p.head * 3, 1.6, 0.7)
    ell(c, ember, hx - 11, y - 8.5 + p.head * 3, 1, 1)
    leg(c, hx - 1, y + 1, p.hipF, p.kneeF - 0.5, 5.5, 6, 1.5, char, char)
    leg(c, fx - 1, y + 1, p.shF, -0.15, 5.5, 6, 1.4, char, char)
    ell(c, char, hx, y - 0.5, 6.5, 4.6)
    ell(c, char, fx - 1, y - 1.5, 7.5, 5.2, { join: true })
    leg(c, hx + 1.5, y + 1.5, p.hipN, p.kneeN - 0.5, 5.5, 6, 1.7, char, char)
    leg(c, fx + 1.5, y + 1.5, p.shN, -0.15, 5.5, 6, 1.6, char, char)
    crack(c, [hx - 3, y - 3, hx, y - 1, hx + 3, y - 3, hx + 5, y], 'A')
    crack(c, [fx - 4, y - 4, fx - 2, y - 1, fx + 1, y - 3, fx + 3, y + 1], 'U')
    dot(c, fx + 4, y - 4, 'T')
    withLean(c, fx + 4, y - 4, p.head, () => {
      seg(c, char, fx + 3, y - 3, fx + 7, y - 8, 2.8, 2.4)
      ell(c, char, fx + 8, y - 9, 3.6, 3.2, { join: true })
      poly(c, char, [fx + 6, y - 11, fx + 6.5, y - 16, fx + 9, y - 11.5])
      seg(c, char, fx + 9, y - 8.5 + p.open * 0.3, fx + 14, y - 7.5 + p.open, 1.6, 1.2)
      seg(c, char, fx + 9, y - 9.5, fx + 14, y - 9.5, 1.5, 1.2)
      dot(c, fx + 14.5, y - 10, '0')
      dot(c, fx + 9, y - 10.5, 'U')
      dot(c, fx + 10, y - 10.5, 'A')
      if (p.open > 1) {
        line(c, fx + 10, y - 8, fx + 13, y - 8 + p.open * 0.7, 'S')
        dot(c, fx + 12, y - 8.5, 'W')
      }
      line(c, fx + 6, y - 7, fx + 8, y - 5, 'T')
    })
  })
}

const houndBase = pose({ hipN: 0.2, hipF: -0.2, shN: 0.15, shF: -0.15, kneeN: 0, kneeF: 0, head: 0 })
function houndRun(n: number): Pose {
  const a = (n / 4) * Math.PI * 2
  const s = Math.sin(a)
  const k = Math.cos(a)
  return pose({ bob: k > 0.5 ? -1 : 0, lean: s * 0.06, hipN: 0.7 * s, hipF: 0.7 * s - 0.35, shN: -0.8 * s, shF: -0.8 * s + 0.35, kneeN: 0.3, kneeF: 0.3, head: -0.05 * s, open: 1 }, houndBase)
}

export const ashHound: FoeArt = animate(HOUND, drawHound, {
  idle: [houndBase, pose({ bob: 1, head: 0.08, open: 1 }, houndBase)],
  walk: [0, 1, 2, 3].map(houndRun),
  windup: pose({ bob: 3, lean: 0.12, hipN: 0.9, hipF: 0.6, kneeN: 0.9, kneeF: 0.9, shN: -0.4, shF: -0.6, head: 0.25, open: 3 }, houndBase),
  strike: pose({ bob: -3, lean: -0.15, hipN: -0.9, hipF: -1.1, shN: 1.2, shF: 1, head: -0.15, open: 5 }, houndBase),
  stagger: pose({ bob: 1, lean: 0.25, hipN: 0.5, hipF: 0.3, shN: 0.6, shF: 0.4, head: 0.5, open: 2 }, houndBase),
}, [0, 0.15, 0.3, 0.3], [0, 0.25, 0.5, 0.8])

const WISP: Frame = { w: 56, h: 56, fy: 52 }
const gale = mat('V', 'XYZP', 0.1)
const galeCore = mat('Y', 'ZPW', 0.4)

const drawWisp: Draw = (c, p) => {
  const cx = 28 + p.head * 3
  const cy = 22 + p.bob
  const size = 1 + p.open * 0.12
  for (let n = 6; n >= 1; n--) {
    const k = n / 6
    ell(c, gale, cx - k * 6 + Math.sin(p.lean + k * 4) * 3 * k, cy + 6 + k * 19, (1 - k) * 5 + 1.2, (1 - k) * 4 + 1.5, { join: n < 6 })
  }
  for (let s = -1; s <= 1; s += 2) {
    seg(c, gale, cx + s * 5 * size, cy + 2, cx + s * (9 + p.open) * size, cy - 3 - p.open * 1.5 + Math.sin(p.lean) * s, 1.8, 0.7)
  }
  ell(c, gale, cx, cy, 7.5 * size, 8 * size)
  ell(c, galeCore, cx - 0.5, cy + 0.5, 3.6 * size, 3.8 * size)
  ell(c, galeCore, cx - 1, cy - 0.5, 1.6 * size, 1.8 * size)
  dot(c, cx - 1, cy - 1, 'W')
  dot(c, cx + 1.5, cy - 4.5, '0')
  dot(c, cx + 4.5, cy - 4.5, '0')
  dot(c, cx + 1.5, cy - 5.5, 'W')
  dot(c, cx + 4.5, cy - 5.5, 'W')
  for (let r = 0; r < 3; r++) {
    const a = p.lean + r * 2.1
    line(c, cx + Math.cos(a) * 11, cy + Math.sin(a) * 9, cx + Math.cos(a + 0.6) * 12, cy + Math.sin(a + 0.6) * 10, 'Z')
  }
  if (p.open > 2) for (let r = 0; r < 6; r++) dot(c, cx + Math.cos(r) * 13, cy + Math.sin(r) * 11, r & 1 ? 'W' : 'Z')
}

export const galeWisp: FoeArt = animate(WISP, drawWisp, {
  idle: [pose({ lean: 0 }), pose({ lean: 1.6, bob: 1 }), pose({ lean: 3.2 })],
  walk: [0, 1, 2, 3].map(n => pose({ lean: n * 1.57, bob: n & 1, head: 0.5 })),
  windup: pose({ lean: 0.8, open: 5, bob: -2 }),
  strike: pose({ lean: 2, open: 1, head: 1.5, bob: 0 }),
  stagger: pose({ lean: 4, open: 0, head: -1, bob: 2 }),
}, [0, 0, 0, 0], [0.2, 0.45, 0.65, 0.85])
