import type { State } from '../sim/state.ts'

export interface GameAudio {
  unlock(): void
  setMuted(muted: boolean): void
  setPaused(paused: boolean): void
  update(s: State): void
  dispose(): void
}

export function createAudio(): GameAudio {
  return {
    unlock() {},
    setMuted() {},
    setPaused() {},
    update() {},
    dispose() {},
  }
}
