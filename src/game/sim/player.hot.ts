import { EV_HURT, PLAYER_IFRAMES } from './content.ts'
import { emit } from './events.hot.ts'
import { playerArmor } from './stats.hot.ts'
import type { State } from './state.ts'

export function hurtPlayer(s: State, raw: number, source: number): boolean {
  if (s.iframes > 0 || raw <= 0) return false
  const taken = Math.max(1, Math.round(raw - playerArmor(s)))
  s.hp = Math.max(0, s.hp - taken)
  s.iframes = PLAYER_IFRAMES
  s.damageBySource[source] = s.damageBySource[source]! + taken
  emit(s, EV_HURT, s.px, s.py, taken, 0)
  return true
}
