import { PHASE_DEAD, PHASE_WON, RUN_TICKS, TICK_HZ } from '../src/game/sim/content.ts'
import { botInput } from '../src/game/sim/bot.hot.ts'
import { createState, resetState, type State } from '../src/game/sim/state.ts'
import { step } from '../src/game/sim/step.hot.ts'

export const STEP_LIMIT = RUN_TICKS * 4

export function isTerminal(s: State): boolean {
  return s.phase === PHASE_DEAD || s.phase === PHASE_WON
}

export interface BotRun {
  readonly state: State
  readonly inputs: number[]
}

export function runBot(seed: number, maxTicks = RUN_TICKS, onTick?: (s: State) => void): BotRun {
  const state = createState()
  resetState(state, seed)
  const inputs: number[] = []
  while (!isTerminal(state) && state.tick < maxTicks && inputs.length < STEP_LIMIT) {
    const input = botInput(state)
    const before = state.tick
    step(state, input)
    inputs.push(input)
    if (onTick && state.tick !== before) onTick(state)
  }
  return { state, inputs }
}

export function minutes(tick: number): string {
  const seconds = Math.floor(tick / TICK_HZ)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
