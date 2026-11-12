import type { State } from './state.ts'
import { blocksShot, blocksWalk } from './world.hot.ts'
import { TRIG_MASK, TURNS_PER_RADIAN, cosTurn, sinTurn } from '../../game/sim/trig.ts'

const DIAGONAL = 0.7071
const ATAN_A = -0.0464964749
const ATAN_B = 0.15931422
const ATAN_C = -0.327622764
const HALF_PI = Math.PI / 2

export function turnOf(dx: number, dy: number): number {
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  if (ax === 0 && ay === 0) return 0
  const a = ax > ay ? ay / ax : ax / ay
  const sq = a * a
  let r = ((ATAN_A * sq + ATAN_B) * sq + ATAN_C) * sq * a + a
  if (ay > ax) r = HALF_PI - r
  if (dx < 0) r = Math.PI - r
  if (dy < 0) r = -r
  return Math.round(r * TURNS_PER_RADIAN) & TRIG_MASK
}

function blockedAt(s: State, x: number, y: number, floats: number): number {
  return floats === 1 ? blocksShot(s, x, y) : blocksWalk(s, x, y)
}

export function blockedCircle(s: State, x: number, y: number, r: number, floats: number): number {
  const d = r * DIAGONAL
  if (blockedAt(s, x + r, y, floats) === 1 || blockedAt(s, x - r, y, floats) === 1) return 1
  if (blockedAt(s, x, y + r, floats) === 1 || blockedAt(s, x, y - r, floats) === 1) return 1
  if (blockedAt(s, x + d, y + d, floats) === 1 || blockedAt(s, x - d, y + d, floats) === 1) return 1
  return blockedAt(s, x + d, y - d, floats) === 1 || blockedAt(s, x - d, y - d, floats) === 1 ? 1 : 0
}

export function inArc(face: number, dx: number, dy: number, halfArc: number): number {
  if (halfArc >= 512) return 1
  const d = Math.sqrt(dx * dx + dy * dy)
  if (d < 0.001) return 1
  return cosTurn(face) * dx + sinTurn(face) * dy >= cosTurn(halfArc) * d ? 1 : 0
}
