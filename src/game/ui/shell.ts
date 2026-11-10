import { PHASE_DEAD, PHASE_LEVEL_UP, PHASE_WON } from '../sim/content.ts'

export type ShellState = 'title' | 'playing' | 'levelUp' | 'paused' | 'dead' | 'won'

export type ShellEvent = 'launch' | 'pause' | 'resume' | 'levelUp' | 'pick' | 'die' | 'win' | 'relaunch' | 'exit'

export const SHELL_STATES: readonly ShellState[] = ['title', 'playing', 'levelUp', 'paused', 'dead', 'won']

export const SHELL_EVENTS: readonly ShellEvent[] = ['launch', 'pause', 'resume', 'levelUp', 'pick', 'die', 'win', 'relaunch', 'exit']

export const SHELL_TRANSITIONS: Readonly<Record<ShellState, Readonly<Partial<Record<ShellEvent, ShellState>>>>> = {
  title: { launch: 'playing' },
  playing: { pause: 'paused', levelUp: 'levelUp', die: 'dead', win: 'won' },
  levelUp: { pick: 'playing' },
  paused: { resume: 'playing', exit: 'title' },
  dead: { relaunch: 'playing', exit: 'title' },
  won: { relaunch: 'playing', exit: 'title' },
}

export function shellReduce(state: ShellState, event: ShellEvent): ShellState {
  return SHELL_TRANSITIONS[state][event] ?? state
}

export function eventForPhase(phase: number): ShellEvent | null {
  if (phase === PHASE_LEVEL_UP) return 'levelUp'
  if (phase === PHASE_DEAD) return 'die'
  if (phase === PHASE_WON) return 'win'
  return null
}
