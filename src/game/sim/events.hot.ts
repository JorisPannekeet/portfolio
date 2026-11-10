import { EVENT_CAP } from './content.ts'
import type { State } from './state.ts'

export function emit(s: State, type: number, x: number, y: number, a: number, b: number): void {
  const slot = s.evHead % EVENT_CAP
  s.evType[slot] = type
  s.evX[slot] = x
  s.evY[slot] = y
  s.evA[slot] = a
  s.evB[slot] = b
  s.evHead++
}
