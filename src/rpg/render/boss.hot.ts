import type { State } from '../sim/state.ts'
import { AI_IDLE, ENEMY_BOSS_FIRST, MAX_ENEMIES } from '../sim/content.ts'

export function activeBoss(s: State): number {
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (s.eAlive[i]! !== 0 && s.eKind[i]! >= ENEMY_BOSS_FIRST && s.eState[i]! !== AI_IDLE) return i
  }
  return -1
}
