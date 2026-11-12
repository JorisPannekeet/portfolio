import { AREA_BRENNHOLD, ITEM_SWORD, SET_NONE, SLOT_PLATE, SLOT_WEAPON, SCRIPT_INTRO, TIER_COMMON, armorBase } from './content.ts'
import { resetState, type State } from './state.ts'
import { seedRng } from '../../game/sim/prng.hot.ts'
import { grantItem } from './loot.hot.ts'
import { restoreProgress } from './progress.ts'
import { recomputeStats } from './stats.hot.ts'
import { resumeStory, startScript } from './story.hot.ts'
import { loadArea } from './world.hot.ts'

function fillMeters(s: State): void {
  recomputeStats(s)
  s.hp = s.statMaxHp
  s.stamina = s.statMaxStamina
  s.focus = 0
}

export function newGame(s: State, seed: number): void {
  resetState(s, seed)
  seedRng(s)
  s.equipped[SLOT_WEAPON] = grantItem(s, ITEM_SWORD, TIER_COMMON)
  s.equipped[SLOT_PLATE] = grantItem(s, armorBase(SET_NONE, SLOT_PLATE), TIER_COMMON)
  s.checkpointArea = AREA_BRENNHOLD
  s.checkpointSpawn = 0
  fillMeters(s)
  loadArea(s, AREA_BRENNHOLD, 0)
  startScript(s, SCRIPT_INTRO)
}

export function continueGame(s: State, seed: number, save: string): boolean {
  resetState(s, seed)
  seedRng(s)
  if (!restoreProgress(s, save)) {
    newGame(s, seed)
    return false
  }
  fillMeters(s)
  loadArea(s, s.checkpointArea, s.checkpointSpawn)
  resumeStory(s)
  return true
}
