import { EVENT_CAP } from './content.ts'
import type { State } from './state.ts'

export function emit(s: State, type: number, a: number, b: number, x: number, y: number): void {
  const slot = s.evHead % EVENT_CAP
  s.evType[slot] = type
  s.evA[slot] = a
  s.evB[slot] = b
  s.evX[slot] = x
  s.evY[slot] = y
  s.evHead++
}

export function pressed(s: State, input: number, bit: number): boolean {
  return (input & bit) !== 0 && (s.prevInput & bit) === 0
}
