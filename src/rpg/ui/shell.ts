import { PHASE_DEAD, PHASE_DIALOG, PHASE_ENDED, PHASE_PLAYING } from '../sim/content.ts'

export type ShellMode = 'title' | 'playing' | 'dialog' | 'menu' | 'paused' | 'dead' | 'ended'

export type MenuTab = 'gear' | 'skills' | 'forge' | 'horn'

export type ShellEvent =
  | 'launch'
  | 'pause'
  | 'resume'
  | 'closeMenu'
  | 'exit'
  | 'relaunch'
  | 'simPlaying'
  | 'simDialog'
  | 'simDead'
  | 'simEnded'
  | MenuTab

export interface Shell {
  mode: ShellMode
  tab: MenuTab
}

export const SHELL_MODES: readonly ShellMode[] = ['title', 'playing', 'dialog', 'menu', 'paused', 'dead', 'ended']

export const MENU_TABS: readonly MenuTab[] = ['gear', 'skills', 'forge', 'horn']

export const SHELL_EVENTS: readonly ShellEvent[] = [
  'launch', 'pause', 'resume', 'closeMenu', 'exit', 'relaunch', 'simPlaying', 'simDialog', 'simDead', 'simEnded', ...MENU_TABS,
]

const openMenu = { gear: 'menu', skills: 'menu', forge: 'menu', horn: 'menu' } as const

export const SHELL_TRANSITIONS: Readonly<Record<ShellMode, Readonly<Partial<Record<ShellEvent, ShellMode>>>>> = {
  title: { launch: 'playing' },
  playing: { pause: 'paused', simDialog: 'dialog', simDead: 'dead', simEnded: 'ended', ...openMenu },
  dialog: { simPlaying: 'playing', simDead: 'dead', simEnded: 'ended' },
  menu: { closeMenu: 'playing', simDialog: 'dialog', simDead: 'dead', simEnded: 'ended', ...openMenu },
  paused: { resume: 'playing', exit: 'title' },
  dead: { simPlaying: 'playing', exit: 'title' },
  ended: { relaunch: 'playing', exit: 'title' },
}

export const INITIAL_SHELL: Shell = { mode: 'title', tab: 'gear' }

function isTab(event: ShellEvent): event is MenuTab {
  return (MENU_TABS as readonly string[]).includes(event)
}

export function shellReduce(shell: Shell, event: ShellEvent): Shell {
  const mode = SHELL_TRANSITIONS[shell.mode][event]
  if (mode === undefined) return shell
  return { mode, tab: isTab(event) ? event : shell.tab }
}

export function eventForPhase(phase: number): ShellEvent | null {
  if (phase === PHASE_PLAYING) return 'simPlaying'
  if (phase === PHASE_DIALOG) return 'simDialog'
  if (phase === PHASE_DEAD) return 'simDead'
  if (phase === PHASE_ENDED) return 'simEnded'
  return null
}
