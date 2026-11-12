import {
  ELEMENT_STONE,
  EV_DIALOG,
  EV_ENDING,
  EV_VIGIL,
  ENDING_REFORGE,
  ENDING_SHATTER,
  MELODY_ROADS,
  MELODY_SEALS,
  MELODY_STABLE,
  PHASE_DIALOG,
  PHASE_ENDED,
  PHASE_PLAYING,
  SCRIPT_COUNT,
  SCRIPT_ENDS_IN_CHOICE,
  SCRIPT_LENGTH,
  SCRIPT_NONE,
} from './content.ts'
import type { State } from './state.ts'
import { emit } from './events.hot.ts'
import {
  ANY_CHAPTER,
  EFF_END,
  EFF_HORN,
  EFF_REFORGE,
  EFF_SEALS,
  EFF_SHATTER,
  EFF_STANCE_STONE,
  EFF_VIGIL,
  RESUME_CHAPTER,
  RESUME_COUNT,
  RESUME_ENDING,
  RESUME_SCRIPT,
  RESUME_SHARD,
  STORY_ARG,
  STORY_CHAPTER,
  STORY_EFFECTS,
  STORY_NEXT,
  STORY_ONCE,
  STORY_ROW_COUNT,
  STORY_SCRIPT,
  STORY_TRIGGER,
  TRG_CHOICE,
  TRG_SCRIPT,
} from './story-table.ts'
import { recomputeStats } from './stats.hot.ts'
import { updateGuide } from './guide.hot.ts'

export function startScript(s: State, script: number): void {
  if (script < 0 || script >= SCRIPT_COUNT) return
  s.phase = PHASE_DIALOG
  s.dialogScript = script
  s.dialogLine = 0
  emit(s, EV_DIALOG, script, 0, s.playerX, s.playerY)
}

function applyEffects(s: State, effects: number): void {
  if ((effects & EFF_STANCE_STONE) !== 0) s.stancesUnlocked |= 1 << ELEMENT_STONE
  if ((effects & EFF_HORN) !== 0) s.melodies |= (1 << MELODY_STABLE) | (1 << MELODY_ROADS)
  if ((effects & EFF_SEALS) !== 0) s.melodies |= 1 << MELODY_SEALS
  if ((effects & EFF_REFORGE) !== 0) s.ending = ENDING_REFORGE
  if ((effects & EFF_SHATTER) !== 0) s.ending = ENDING_SHATTER
  if ((effects & EFF_VIGIL) !== 0) {
    recomputeStats(s)
    s.hp = s.statMaxHp
    emit(s, EV_VIGIL, 0, 0, s.playerX, s.playerY)
  }
  if ((effects & EFF_END) !== 0) {
    s.phase = PHASE_ENDED
    emit(s, EV_ENDING, s.ending, 0, s.playerX, s.playerY)
  }
}

export function fireStory(s: State, trigger: number, arg: number): boolean {
  for (let r = 0; r < STORY_ROW_COUNT; r++) {
    const chapter = STORY_CHAPTER[r]!
    if (chapter !== ANY_CHAPTER && chapter !== s.chapter) continue
    if (STORY_TRIGGER[r] !== trigger || STORY_ARG[r] !== arg) continue
    const once = STORY_ONCE[r]!
    if (once >= 0 && s.flags[once] !== 0) continue
    if (once >= 0) s.flags[once] = 1
    const next = STORY_NEXT[r]!
    if (next >= 0 && next !== s.chapter) s.chapter = next
    applyEffects(s, STORY_EFFECTS[r]!)
    recomputeStats(s)
    startScript(s, STORY_SCRIPT[r]!)
    updateGuide(s)
    return true
  }
  return false
}

function closeDialog(s: State): number {
  const script = s.dialogScript
  s.phase = PHASE_PLAYING
  s.dialogScript = SCRIPT_NONE
  s.dialogLine = 0
  return script
}

export function advanceDialog(s: State): void {
  if (s.phase !== PHASE_DIALOG) return
  const script = s.dialogScript
  if (script < 0 || script >= SCRIPT_COUNT) {
    closeDialog(s)
    return
  }
  if (s.dialogLine + 1 < SCRIPT_LENGTH[script]!) {
    s.dialogLine++
    return
  }
  if (SCRIPT_ENDS_IN_CHOICE[script] !== 0) return
  fireStory(s, TRG_SCRIPT, closeDialog(s))
}

export function chooseDialog(s: State, choice: number): void {
  if (s.phase !== PHASE_DIALOG || choice < 0 || choice > 1) return
  const script = s.dialogScript
  if (script < 0 || script >= SCRIPT_COUNT || SCRIPT_ENDS_IN_CHOICE[script] === 0) return
  if (s.dialogLine !== SCRIPT_LENGTH[script]! - 1) return
  closeDialog(s)
  fireStory(s, TRG_CHOICE, choice)
}

export function resumeStory(s: State): void {
  for (let r = 0; r < RESUME_COUNT; r++) {
    if (RESUME_CHAPTER[r] !== s.chapter) continue
    const shard = RESUME_SHARD[r]!
    if (shard >= 0 && (s.shards & (1 << shard)) === 0) continue
    if (RESUME_ENDING[r] !== 0 && RESUME_ENDING[r] !== s.ending) continue
    startScript(s, RESUME_SCRIPT[r]!)
    return
  }
}

export function updateStory(s: State): void {
  updateGuide(s)
}
