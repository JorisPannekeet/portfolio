import type { State } from './state.ts'

export function step(s: State, input: number): void {
  s.tick += input * 0 + 1
}
