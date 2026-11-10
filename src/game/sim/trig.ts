import { INPUT_DIRECTIONS } from './content.ts'

export const TRIG_SIZE = 1024
export const TRIG_MASK = TRIG_SIZE - 1
export const HEADING_TURNS = TRIG_SIZE / INPUT_DIRECTIONS
export const TURNS_PER_RADIAN = TRIG_SIZE / (2 * Math.PI)

const QUANTUM = 65536

function quantise(value: number): number {
  return Math.round(value * QUANTUM) / QUANTUM
}

export const SIN_TABLE = new Float64Array(TRIG_SIZE)
export const COS_TABLE = new Float64Array(TRIG_SIZE)

for (let i = 0; i < TRIG_SIZE; i++) {
  const angle = (i * 2 * Math.PI) / TRIG_SIZE
  SIN_TABLE[i] = quantise(Math.sin(angle))
  COS_TABLE[i] = quantise(Math.cos(angle))
}

export function sinTurn(turn: number): number {
  return SIN_TABLE[Math.floor(turn) & TRIG_MASK]!
}

export function cosTurn(turn: number): number {
  return COS_TABLE[Math.floor(turn) & TRIG_MASK]!
}
