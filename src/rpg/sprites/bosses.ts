import { animate, arm, giant, joints, leg, pose, walkCycle, withLean, type Draw, type FoeArt, type Frame, type Pose } from './foe-rig.ts'
import { box, dot, ell, line, mat, poly, seg, type Canvas } from './sculpt.ts'

const BOSS_FALL = [0.25, 0.9, 1.5]
const BOSS_FADE = [0, 0.1, 0.45]

const steelDark = mat('0', 'klmno', -0.1)
const rustPlate = mat('0', 'l6mn7o', -0.15)
const royal = mat('B', 'Cga', -0.05)
const gold = mat('K', 'KAU', 0.15)
const leather = mat('b', 'cde')
const wood = mat('b', 'deh')
const cleaverSteel = mat('k', 'mnopq', 0.1)

function bossPoses(base: Pose, windup: Partial<Pose>, cast: Partial<Pose>, strike: Partial<Pose>, stride = 0.35): { idle: Pose[]; walk: Pose[]; windup: Pose; cast: Pose; strike: Pose; stagger: Pose } {
  return {
    idle: [base, pose({ bob: 1, head: base.head + 0.05 }, base)],
    walk: walkCycle(base, stride, 0.15, 4),
    windup: pose(windup, base),
    cast: pose(cast, base),
    strike: pose(strike, base),
    stagger: pose({ lean: -0.3, bob: 1, head: -0.3, hipN: 0.25, kneeN: 0.5, kneeF: 0.4, shN: -0.7, elN: -0.4, shF: -1.1, elF: -0.3, wpn: -1.6, open: 0 }, base),
  }
}

function tatters(c: Canvas, m: typeof royal, x0: number, x1: number, top: number, bottom: number, sway: number): void {
  const pts = [x0 + 2, top, x1, top]
  const n = 6
  for (let i = 0; i <= n; i++) {
    const x = x1 - ((x1 - x0) * i) / n + sway * (i / n)
    pts.push(x, bottom - (i & 1 ? 3 : 0) + (i === n ? -2 : 0))
  }
  poly(c, m, pts)
}

const KING: Frame = { w: 132, h: 116, fy: 112 }

const drawKing: Draw = (c, p) => {
  giant(c, 1.55)
  const j = joints(p)
  withLean(c, j.hipX, j.hipY, p.lean, () => {
    tatters(c, royal, j.hipX - 13 + p.hipN * 2, j.hipX + 2, j.hipY - 13, j.hipY + 13, -3 - p.hipN * 4)
    line(c, j.hipX - 12, j.hipY + 8, j.hipX - 3, j.hipY + 10, 'K')
    arm(c, j.shFX, j.shFY, p.shF, p.elF, 6, 5.5, 2.2, rustPlate, steelDark)
  })
  leg(c, j.hipX - 2.5, j.hipY, p.hipF, p.kneeF, 8, 7.5, 2.7, rustPlate, steelDark)
  leg(c, j.hipX + 2, j.hipY, p.hipN, p.kneeN, 8, 7.5, 2.7, rustPlate, steelDark)
  withLean(c, j.hipX, j.hipY, p.lean, () => {
    ell(c, rustPlate, j.hipX, j.hipY - 7, 7.5, 7.8)
    poly(c, royal, [j.hipX - 5, j.hipY - 3, j.hipX + 6, j.hipY - 3, j.hipX + 7, j.hipY + 4, j.hipX + 3, j.hipY + 2.5, j.hipX, j.hipY + 5, j.hipX - 3, j.hipY + 2.5, j.hipX - 6, j.hipY + 4])
    box(c, gold, j.hipX - 7, j.hipY - 4.5, 14, 1.6, { flat: 0.6 })
    line(c, j.hipX - 3, j.hipY - 12, j.hipX + 4, j.hipY - 8, 'm')
    dot(c, j.hipX + 1, j.hipY - 8, '7')
    dot(c, j.hipX - 3, j.hipY - 6, '6')
    dot(c, j.hipX + 4, j.hipY - 5, '7')
    withLean(c, j.headX, j.headY + 4, p.head, () => {
      ell(c, steelDark, j.headX, j.headY, 5.5, 6)
      box(c, steelDark, j.headX - 1, j.headY - 1, 7, 6, { join: true, nx: 0.3, ny: 0 })
      line(c, j.headX + 1, j.headY + 0.5, j.headX + 6, j.headY + 0.5, '0')
      ell(c, mat('V', 'ZW', 0.6), j.headX + 4, j.headY + 0.5, 1, 0.6)
      line(c, j.headX + 3, j.headY + 2.5, j.headX + 6, j.headY + 2.5, 'k')
      poly(c, gold, [j.headX - 5, j.headY - 4, j.headX + 5, j.headY - 4, j.headX + 5.5, j.headY - 8.5, j.headX + 3.5, j.headY - 6, j.headX + 2, j.headY - 9.5, j.headX, j.headY - 6.5, j.headX - 2, j.headY - 9.5, j.headX - 3.5, j.headY - 6, j.headX - 5.5, j.headY - 8.5])
      dot(c, j.headX + 0, j.headY - 5, 'S')
      dot(c, j.headX + 3, j.headY - 5, 'Y')
    })
    ell(c, rustPlate, j.shNX, j.shNY, 4, 3)
    const [hx, hy] = arm(c, j.shNX, j.shNY + 1, p.shN, p.elN, 6, 5.5, 2.3, rustPlate, steelDark)
    const cx = Math.cos(p.wpn)
    const cy = Math.sin(p.wpn)
    seg(c, leather, hx - cx * 4, hy - cy * 4, hx + cx * 2, hy + cy * 2, 0.9)
    seg(c, gold, hx + cx * 2.5 - cy * 2.5, hy + cy * 2.5 + cx * 2.5, hx + cx * 2.5 + cy * 2.5, hy + cy * 2.5 - cx * 2.5, 0.9)
    const bx = hx + cx * 3
    const by = hy + cy * 3
    poly(c, cleaverSteel, [bx - cy * 1.5, by + cx * 1.5, bx + cx * 17 - cy * 1.5, by + cy * 17 + cx * 1.5, bx + cx * 19 + cy * 5, by + cy * 19 - cx * 5, bx + cx * 5 + cy * 5, by + cy * 5 - cx * 5], { nx: -0.2, ny: -0.3 })
    line(c, bx + cx * 6 + cy * 4.5, by + cy * 6 - cx * 4.5, bx + cx * 18 + cy * 4.5, by + cy * 18 - cx * 4.5, 'W')
    dot(c, bx + cx * 10 + cy * 1.5, by + cy * 10 - cx * 1.5, '7')
    dot(c, bx + cx * 13, by + cy * 13, '6')
  })
}

export const barrowKing: FoeArt = animate(KING, drawKing, bossPoses(
  pose({ shN: 0.5, elN: -0.9, wpn: -1.0, shF: -0.15, elF: -0.2 }),
  { lean: -0.2, hipN: 0.4, kneeN: 0.3, hipF: -0.35, shN: -2.5, elN: -0.5, shF: 0.5, elF: -0.8, wpn: -2.3, head: -0.1 },
  { lean: 0.05, bob: 2, hipN: 0.45, kneeN: 0.6, hipF: -0.45, kneeF: 0.5, shN: -3, elN: 0, shF: -2.6, elF: 0, wpn: -1.6 },
  { lean: 0.3, bob: 2, hipN: 0.55, kneeN: 0.6, hipF: -0.45, shN: 1.6, elN: 0.1, shF: -0.6, elF: -0.2, wpn: 0.4 },
), BOSS_FALL, BOSS_FADE)

const ABBOT: Frame = { w: 116, h: 120, fy: 116 }
const robe = mat('V', 'X<>', -0.05)
const stole = mat('k', 'pqW', 0.1)
const pale = mat('V', '<>Z', 0.2)
const water = mat('L', 'MNOP', 0.3)

const drawAbbot: Draw = (c, p) => {
  giant(c, 1.5)
  const j = joints(p)
  const sway = p.hipN * 4
  withLean(c, j.hipX, j.hipY, p.lean, () => {
    const [gx, gy] = arm(c, j.shFX, j.shFY, p.shF, p.elF, 6, 5.5, 2.3, robe, pale)
    seg(c, gold, gx, gy - 14, gx, gy + 14, 0.8)
    seg(c, gold, gx, gy - 14, gx + 2, gy - 19, 0.9, 0.9, { join: true })
    seg(c, gold, gx + 2, gy - 19, gx + 6, gy - 18, 0.9, 0.9, { join: true })
    seg(c, gold, gx + 6, gy - 18, gx + 5.5, gy - 14.5, 0.8, 0.8, { join: true })
    dot(c, gx + 3, gy - 16, 'U')
    poly(c, robe, [j.hipX - 6, j.hipY - 13, j.hipX + 6, j.hipY - 13, j.hipX + 9 + sway * 0.3, j.hipY + 10, j.hipX + 6 + sway, j.hipY + 16, j.hipX + 1, j.hipY + 14.5, j.hipX - 4, j.hipY + 16, j.hipX - 10 + sway, j.hipY + 16, j.hipX - 14 + sway * 1.5, j.hipY + 15])
    poly(c, stole, [j.hipX - 1, j.hipY - 12, j.hipX + 3, j.hipY - 12, j.hipX + 3.5, j.hipY + 14, j.hipX - 0.5, j.hipY + 14])
    line(c, j.hipX + 1.5, j.hipY - 2, j.hipX + 1.5, j.hipY + 4, 'A')
    line(c, j.hipX - 0.5, j.hipY, j.hipX + 3.5, j.hipY, 'A')
    for (let n = 0; n < 4; n++) dot(c, j.hipX - 8 + n * 5 + sway * 0.5, j.hipY + 16.5, 'O')
    withLean(c, j.headX, j.headY + 4, p.head, () => {
      ell(c, pale, j.headX + 1.5, j.headY + 2, 4.8, 5)
      dot(c, j.headX + 3.5, j.headY + 1.5, 'W')
      dot(c, j.headX + 5, j.headY + 1.5, 'W')
      line(c, j.headX + 3, j.headY + 5, j.headX + 5.5, j.headY + 5, 'V')
      poly(c, stole, [j.headX - 4, j.headY - 1.5, j.headX + 5, j.headY - 1.5, j.headX + 4, j.headY - 9, j.headX + 0.5, j.headY - 13, j.headX - 3, j.headY - 9])
      line(c, j.headX + 0.5, j.headY - 10, j.headX + 0.5, j.headY - 3, 'A')
      line(c, j.headX - 1.5, j.headY - 7, j.headX + 2.5, j.headY - 7, 'A')
      line(c, j.headX - 4, j.headY - 2, j.headX + 5, j.headY - 2, 'K')
    })
    const [hx, hy] = arm(c, j.shNX, j.shNY + 1, p.shN, p.elN, 6, 5.5, 2.3, robe, pale)
    if (p.open > 0) {
      ell(c, water, hx + 1, hy - 3, 2.5 + p.open * 0.5, 2.5 + p.open * 0.5)
      dot(c, hx, hy - 4, 'W')
    }
  })
}

export const drownedAbbot: FoeArt = animate(ABBOT, drawAbbot, bossPoses(
  pose({ shF: 0.7, elF: -0.5, shN: 0.4, elN: -0.4, head: 0.1 }),
  { lean: -0.15, shF: 0.5, elF: -0.4, shN: -2.4, elN: -0.4, open: 1, head: -0.1 },
  { lean: 0.05, bob: -2, shF: 1.3, elF: -1.1, shN: -2.9, elN: -0.1, open: 3, head: -0.2 },
  { lean: 0.25, shF: 0.9, elF: -0.2, shN: 1.5, elN: 0, open: 2 },
  0.25,
), [0.12, 0.35, 0.5], [0.15, 0.4, 0.7])

const FORGE: Frame = { w: 136, h: 124, fy: 120 }
const blackIron = mat('0', 'klmDE', 0.05)
const furnace = mat('6', 'TAU', 0.4)
const apron = mat('b', 'cde', -0.1)

const drawForge: Draw = (c, p) => {
  giant(c, 1.6)
  const j = joints(p)
  withLean(c, j.hipX, j.hipY, p.lean, () => {
    arm(c, j.shFX - 2, j.shFY - 1, p.shF, p.elF, 6.5, 6, 3, blackIron, blackIron)
  })
  leg(c, j.hipX - 3, j.hipY, p.hipF, p.kneeF, 7.5, 7.5, 3.2, blackIron, blackIron)
  leg(c, j.hipX + 2.5, j.hipY, p.hipN, p.kneeN, 7.5, 7.5, 3.2, blackIron, blackIron)
  withLean(c, j.hipX, j.hipY, p.lean, () => {
    ell(c, blackIron, j.hipX, j.hipY - 8, 9.5, 9)
    poly(c, apron, [j.hipX - 5, j.hipY - 4, j.hipX + 7, j.hipY - 4, j.hipX + 8, j.hipY + 8, j.hipX - 4, j.hipY + 8])
    box(c, furnace, j.hipX - 2, j.hipY - 14, 8, 7)
    for (let n = 0; n < 4; n++) line(c, j.hipX - 2 + n * 2.2, j.hipY - 14, j.hipX - 2 + n * 2.2, j.hipY - 7, 'k')
    line(c, j.hipX - 2.5, j.hipY - 14.5, j.hipX + 6.5, j.hipY - 14.5, 'D')
    line(c, j.hipX - 2.5, j.hipY - 6.5, j.hipX + 6.5, j.hipY - 6.5, 'l')
    dot(c, j.hipX + 1.5, j.hipY - 10, 'W')
    withLean(c, j.headX, j.headY + 5, p.head, () => {
      box(c, blackIron, j.headX - 4.5, j.headY - 3, 10, 9.5)
      ell(c, blackIron, j.headX + 0.5, j.headY - 3, 5, 2.4, { join: true })
      line(c, j.headX + 1, j.headY + 1.5, j.headX + 5.5, j.headY + 1.5, 'T')
      dot(c, j.headX + 4, j.headY + 1.5, 'U')
      line(c, j.headX + 3, j.headY + 3, j.headX + 3, j.headY + 5.5, 'k')
    })
    ell(c, blackIron, j.shNX + 1, j.shNY - 1, 5, 3.5)
    dot(c, j.shNX + 1, j.shNY - 2.5, 'E')
    const [hx, hy] = arm(c, j.shNX + 1, j.shNY + 1, p.shN, p.elN, 6.5, 6, 3, blackIron, blackIron)
    const cx = Math.cos(p.wpn)
    const cy = Math.sin(p.wpn)
    seg(c, wood, hx - cx * 3, hy - cy * 3, hx + cx * 13, hy + cy * 13, 1)
    const tx = hx + cx * 15
    const ty = hy + cy * 15
    poly(c, blackIron, [tx - cy * 6 - cx * 3, ty + cx * 6 - cy * 3, tx - cy * 6 + cx * 3, ty + cx * 6 + cy * 3, tx + cy * 6 + cx * 3, ty - cx * 6 + cy * 3, tx + cy * 6 - cx * 3, ty - cx * 6 - cy * 3], { nx: -0.2, ny: -0.3 })
    line(c, tx - cy * 5 - cx * 2.5, ty + cx * 5 - cy * 2.5, tx + cy * 5 - cx * 2.5, ty - cx * 5 - cy * 2.5, 'D')
    if (p.open > 0) {
      dot(c, tx + cy * 6, ty - cx * 6, 'T')
      dot(c, tx - cy * 6, ty + cx * 6, 'A')
    }
  })
}

export const forgemaster: FoeArt = animate(FORGE, drawForge, bossPoses(
  pose({ lean: 0.05, shN: 0.3, elN: -0.2, wpn: 1.45, shF: -0.1, elF: 0.2 }),
  { lean: -0.25, hipN: 0.45, kneeN: 0.3, hipF: -0.4, shN: -2.6, elN: -0.3, shF: 0.4, elF: -0.6, wpn: -2.1, open: 1 },
  { lean: -0.1, bob: 1, hipN: 0.5, kneeN: 0.5, hipF: -0.5, kneeF: 0.4, shN: -3.1, elN: 0, shF: -2.8, elF: 0, wpn: -1.57, open: 1 },
  { lean: 0.35, bob: 3, hipN: 0.6, kneeN: 0.8, hipF: -0.5, kneeF: 0.3, shN: 1.4, elN: 0.2, shF: 1, elF: 0.2, wpn: 1.2, open: 1 },
  0.3,
), BOSS_FALL, BOSS_FADE)

const ABBESS: Frame = { w: 128, h: 124, fy: 120 }
const habit = mat('J', 'LMN', -0.05)
const veil = mat('n', 'opqW', 0.05)
const face = mat('b', 'jiW', 0.2)

function bolt(c: Canvas, ax: number, ay: number, bx: number, by: number, seed: number): void {
  let px = ax
  let py = ay
  for (let n = 1; n <= 5; n++) {
    const x = ax + ((bx - ax) * n) / 5 + (n < 5 ? (((seed * 7 + n * 13) % 5) - 2) * 0.9 : 0)
    const y = ay + ((by - ay) * n) / 5 + (n < 5 ? (((seed * 11 + n * 5) % 5) - 2) * 0.9 : 0)
    line(c, px, py, x, y, n & 1 ? 'W' : 'P')
    px = x
    py = y
  }
}

const drawAbbess: Draw = (c, p) => {
  giant(c, 1.5)
  const j = joints(p)
  const whip = p.hipN * 5
  withLean(c, j.hipX, j.hipY, p.lean, () => {
    poly(c, veil, [j.headX - 2, j.headY - 6, j.headX - 12 + whip, j.headY - 3, j.headX - 20 + whip * 1.5, j.headY + 6, j.headX - 13 + whip, j.headY + 4, j.headX - 16 + whip, j.headY + 13, j.headX - 6, j.headY + 6])
    const [fx, fy] = arm(c, j.shFX, j.shFY, p.shF, p.elF, 6, 5.5, 2, habit, face)
    poly(c, habit, [j.hipX - 6, j.hipY - 13, j.hipX + 6, j.hipY - 13, j.hipX + 8, j.hipY + 2, j.hipX + 4, j.hipY + 12, j.hipX - 1, j.hipY + 9, j.hipX - 8 + whip, j.hipY + 14, j.hipX - 12 + whip, j.hipY + 8, j.hipX - 16 + whip * 1.4, j.hipY + 10, j.hipX - 9, j.hipY - 2])
    line(c, j.hipX - 3, j.hipY - 8, j.hipX - 7 + whip * 0.5, j.hipY + 9, 'J')
    box(c, mat('K', 'AU'), j.hipX - 6, j.hipY - 4, 13, 1.4, { flat: 0.6 })
    withLean(c, j.headX, j.headY + 4, p.head, () => {
      ell(c, veil, j.headX - 0.5, j.headY, 5.8, 6.2)
      ell(c, face, j.headX + 2.2, j.headY + 1.5, 3.8, 4.3)
      line(c, j.headX + 2.5, j.headY, j.headX + 3.5, j.headY, 'L')
      line(c, j.headX + 4.5, j.headY, j.headX + 5.5, j.headY, 'L')
      dot(c, j.headX + 3, j.headY + 0.8, 'P')
      dot(c, j.headX + 5, j.headY + 0.8, 'P')
      line(c, j.headX + 3, j.headY + 3.5, j.headX + 4.5, j.headY + 3.5, 'j')
      line(c, j.headX - 3, j.headY - 5, j.headX + 3, j.headY - 5.5, 'W')
    })
    const [hx, hy] = arm(c, j.shNX, j.shNY + 1, p.shN, p.elN, 6, 5.5, 2, habit, face)
    if (p.open > 0) {
      bolt(c, hx, hy, fx, fy, 1)
      bolt(c, hx, hy, fx, fy - 2, 2)
      ell(c, mat('N', 'PW', 0.5), hx, hy, 1.4, 1.4)
      ell(c, mat('N', 'PW', 0.5), fx, fy, 1.4, 1.4)
      if (p.open > 1) {
        bolt(c, hx, hy, hx + 3, hy - 9, 3)
        bolt(c, fx, fy, fx - 4, fy - 8, 4)
      }
    }
  })
}

const abbessBase = pose({ bob: -2, shN: 0.9, elN: -1.1, shF: 1.3, elF: -1.2, open: 1, head: 0 })
export const stormAbbess: FoeArt = animate(ABBESS, drawAbbess, {
  idle: [abbessBase, pose({ bob: -1, hipN: 0.5, open: 1 }, abbessBase)],
  walk: [0, 1, 2, 3].map(n => pose({ bob: -2 + (n & 1), hipN: Math.sin(n * 1.57) * 0.8, lean: 0.12 }, abbessBase)),
  windup: pose({ bob: -4, lean: -0.1, shN: -2.6, elN: -0.2, shF: -2.2, elF: -0.3, open: 2, hipN: 0.6 }, abbessBase),
  cast: pose({ bob: -3, lean: 0.05, shN: -1.6, elN: -0.4, shF: 2.2, elF: -0.4, open: 2, hipN: -0.6 }, abbessBase),
  strike: pose({ bob: -2, lean: 0.25, shN: 1.6, elN: -0.1, shF: 1.5, elF: 0, open: 2, hipN: 1 }, abbessBase),
  stagger: pose({ bob: -1, lean: -0.35, head: -0.3, shN: -0.7, elN: -0.4, shF: -1, elF: -0.3, open: 0, hipN: -0.8 }, abbessBase),
}, [0.1, 0.3, 0.45], [0.15, 0.45, 0.75])

const VAREK: Frame = { w: 128, h: 116, fy: 112 }
const ornate = mat('x', 'klmDEF', -0.1)
const cape = mat('r', 'R:S', -0.1)
const longsword = mat('k', 'nopqW', 0.2)
const eyes = mat('r', 'SA', 0.6)

function plateFigure(c: Canvas, p: Pose, armour: typeof ornate, glow: typeof eyes, crown: boolean): void {
  const j = joints(p)
  withLean(c, j.hipX, j.hipY, p.lean, () => {
    tatters(c, cape, j.hipX - 12 - p.hipN * 2, j.hipX + 3, j.hipY - 13, j.hipY + 14, -4 - p.hipN * 5)
    arm(c, j.shFX, j.shFY, p.shF, p.elF, 6, 5.5, 2.3, armour, armour)
  })
  plateLeg(c, j.hipX - 2.5, j.hipY, p.hipF, p.kneeF, armour)
  plateLeg(c, j.hipX + 2, j.hipY, p.hipN, p.kneeN, armour)
  withLean(c, j.hipX, j.hipY, p.lean, () => {
    ell(c, armour, j.hipX, j.hipY - 7, 7.5, 8)
    for (let n = 0; n < 3; n++) poly(c, armour, [j.hipX - 6 + n * 0.3, j.hipY - 2 + n * 2.2, j.hipX + 7 - n * 0.2, j.hipY - 2 + n * 2.2, j.hipX + 7.5, j.hipY + 0.5 + n * 2.2, j.hipX - 6.5, j.hipY + 0.5 + n * 2.2], { nx: 0, ny: -0.1 })
    line(c, j.hipX - 2, j.hipY - 13, j.hipX - 3, j.hipY - 4, 'E')
    line(c, j.hipX - 6, j.hipY - 1.8, j.hipX + 7, j.hipY - 1.8, 'A')
    line(c, j.hipX + 1, j.hipY - 13, j.hipX + 1, j.hipY - 3, 'K')
    line(c, j.hipX - 3, j.hipY - 10, j.hipX + 5, j.hipY - 10, 'K')
    dot(c, j.hipX + 1, j.hipY - 10, 'U')
    withLean(c, j.headX, j.headY + 4, p.head, () => {
      ell(c, armour, j.headX + 0.5, j.headY + 6, 5, 2)
      ell(c, armour, j.headX, j.headY, 5.5, 6.2)
      poly(c, armour, [j.headX - 0.5, j.headY - 2, j.headX + 5, j.headY - 2.5, j.headX + 6.5, j.headY + 1, j.headX + 5.5, j.headY + 5.5, j.headX - 0.5, j.headY + 5.5])
      line(c, j.headX + 1, j.headY + 0.5, j.headX + 6, j.headY + 0.5, '0')
      line(c, j.headX + 4, j.headY - 2.5, j.headX + 6.3, j.headY + 1, 'E')
      ell(c, glow, j.headX + 4, j.headY + 0.5, 1.1, 0.6)
      for (let n = 0; n < 3; n++) dot(c, j.headX + 3 + n * 1.2, j.headY + 3.2, 'k')
      if (crown) {
        poly(c, mat('6', 'TAUW', 0.4), [j.headX - 5, j.headY - 4, j.headX + 5, j.headY - 4, j.headX + 6, j.headY - 10, j.headX + 3, j.headY - 7, j.headX + 1, j.headY - 12, j.headX - 1, j.headY - 7, j.headX - 4, j.headY - 11, j.headX - 4, j.headY - 7, j.headX - 6.5, j.headY - 9])
        line(c, j.headX - 5, j.headY - 4.5, j.headX + 5, j.headY - 4.5, 'K')
      } else {
        seg(c, gold, j.headX - 3, j.headY - 5, j.headX - 7, j.headY - 10, 1, 0.5)
        seg(c, gold, j.headX + 2, j.headY - 5.5, j.headX + 5, j.headY - 10.5, 1, 0.5)
        line(c, j.headX - 1, j.headY - 6, j.headX - 1, j.headY + 5, 'K')
      }
    })
    ell(c, armour, j.shNX, j.shNY + 2.5, 3.6, 2.4)
    ell(c, armour, j.shNX, j.shNY + 0.8, 4, 2.6)
    ell(c, armour, j.shNX, j.shNY - 0.8, 4.4, 2.8)
    line(c, j.shNX - 3.5, j.shNY - 2.5, j.shNX + 3, j.shNY - 3, 'A')
    dot(c, j.shNX + 1, j.shNY - 1, 'E')
    const [hx, hy] = arm(c, j.shNX, j.shNY + 1, p.shN, p.elN, 6, 5.5, 2.3, armour, armour)
    const cx = Math.cos(p.wpn)
    const cy = Math.sin(p.wpn)
    seg(c, leather, hx - cx * 3, hy - cy * 3, hx + cx * 1.5, hy + cy * 1.5, 0.9)
    ell(c, gold, hx - cx * 3.5, hy - cy * 3.5, 1.1, 1.1)
    seg(c, gold, hx + cx * 2 - cy * 3.5, hy + cy * 2 + cx * 3.5, hx + cx * 2 + cy * 3.5, hy + cy * 2 - cx * 3.5, 0.9)
    seg(c, longsword, hx + cx * 2.5, hy + cy * 2.5, hx + cx * 21, hy + cy * 21, 1.5, 0.5)
    line(c, hx + cx * 3, hy + cy * 3, hx + cx * 18, hy + cy * 18, crown ? 'A' : 'W')
  })
}

function plateLeg(c: Canvas, x: number, y: number, hip: number, knee: number, armour: typeof ornate): void {
  leg(c, x, y, hip, knee, 8, 7.5, 2.8, armour, armour)
  ell(c, armour, x + Math.sin(hip) * 8 + 0.5, y + Math.cos(hip) * 8, 2.4, 2)
  dot(c, x + Math.sin(hip) * 8 + 0.5, y + Math.cos(hip) * 8 - 0.5, 'A')
}

const varekBase = pose({ shN: 0.4, elN: -1.1, wpn: -0.9, shF: -0.1, elF: -0.3 })
const varekSet = (k: number, armour: typeof ornate, crown: boolean): Draw => (c, p) => {
  giant(c, k)
  plateFigure(c, p, armour, eyes, crown)
}

export const varekKnight: FoeArt = animate(VAREK, varekSet(1.5, ornate, false), bossPoses(
  varekBase,
  { lean: -0.2, hipN: 0.45, kneeN: 0.3, hipF: -0.4, shN: -2.3, elN: -0.6, shF: 0.4, elF: -0.8, wpn: -2.5, head: -0.1 },
  { lean: 0.1, bob: 1, hipN: 0.5, kneeN: 0.4, hipF: -0.5, shN: 1.5, elN: -1.9, shF: 1.1, elF: -0.5, wpn: -1.3 },
  { lean: 0.35, bob: 2, hipN: 0.6, kneeN: 0.6, hipF: -0.5, shN: 1.7, elN: 0, shF: -0.7, elF: -0.2, wpn: 0.3 },
  0.4,
), BOSS_FALL, BOSS_FADE)

const COLOSSUS: Frame = { w: 184, h: 168, fy: 164 }
const colossusPlate = mat('x', 'klmDEF', -0.06)
const crownEyes = mat('6', 'AUW', 0.6)

export const varekColossus: FoeArt = animate(COLOSSUS, (c, p) => {
  giant(c, 2.45)
  plateFigure(c, p, colossusPlate, crownEyes, true)
}, bossPoses(
  pose({ shN: 0.35, elN: -0.4, wpn: 1.25, shF: -0.2, elF: -0.2, lean: 0.05 }),
  { lean: -0.2, hipN: 0.4, kneeN: 0.3, hipF: -0.4, shN: -2.6, elN: -0.3, shF: 0.5, elF: -0.7, wpn: -2, head: -0.1 },
  { lean: -0.05, bob: 1, hipN: 0.45, kneeN: 0.5, hipF: -0.45, kneeF: 0.4, shN: -3.1, elN: 0, shF: -2.9, elF: 0, wpn: -1.57 },
  { lean: 0.35, bob: 3, hipN: 0.6, kneeN: 0.8, hipF: -0.5, kneeF: 0.3, shN: 1.4, elN: 0.2, shF: 0.9, elF: 0.2, wpn: 1.15 },
  0.25,
), [0.1, 0.25, 0.3], [0.1, 0.35, 0.65])
