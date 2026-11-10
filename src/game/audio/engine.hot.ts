import { EV_PICKUP, EVENT_CAP, PHASE_DEAD, PHASE_LEVEL_UP, PHASE_WON } from '../sim/content.ts'
import type { State } from '../sim/state.ts'
import type { AudioRuntime } from './runtime.ts'
import { PICKUP_RATIOS, PICKUP_STREAK_SECONDS, SFX_TABLE, SFX_VARIANT_STRIDE, SFX_VOICES, sfxVariant } from './sfx.ts'
import { DEFEAT_JINGLE, SECTION_TABLES, sectionForTick, STEP_SECONDS, VICTORY_JINGLE } from './song.ts'
import { NOTE_EMPTY, NOTE_OFF, STEPS_PER_BAR, VOICE_COUNT } from './tracker.ts'
import { crossfadeSynth, cutSfx, playJingle, playMusicNote, playSfx, setDuck, startMusic, stopMusic } from './voices.ts'

const LOOKAHEAD_SECONDS = 0.12
const RESYNC_SECONDS = 0.25
const START_DELAY_SECONDS = 0.05
const SFX_LEAD_SECONDS = 0.005

function playRow(rt: AudioRuntime, row: number, time: number): void {
  const table = SECTION_TABLES[rt.section]!
  const base = row * VOICE_COUNT
  for (let voice = 0; voice < VOICE_COUNT; voice++) {
    const index = base + voice
    const note = table.note[index]!
    if (note === NOTE_EMPTY || note === NOTE_OFF) continue
    playMusicNote(rt, voice, note, table.instrument[index]!, table.effect[index]!, table.effectArg[index]!, table.length[index]! * STEP_SECONDS, time)
  }
}

export function pumpMusic(rt: AudioRuntime): void {
  if (rt.musicOn === 0) return
  const now = rt.ctx.currentTime
  if (rt.nextStepTime < now - RESYNC_SECONDS) rt.nextStepTime = now + START_DELAY_SECONDS
  const horizon = now + LOOKAHEAD_SECONDS
  while (rt.nextStepTime < horizon) {
    if (rt.row % STEPS_PER_BAR === 0 && rt.pendingSection !== rt.section) {
      rt.section = rt.pendingSection
      crossfadeSynth(rt, rt.section, rt.nextStepTime)
    }
    playRow(rt, rt.row, rt.nextStepTime)
    rt.row = (rt.row + 1) % SECTION_TABLES[rt.section]!.steps
    rt.nextStepTime += STEP_SECONDS
  }
}

function isTerminal(phase: number): boolean {
  return phase === PHASE_DEAD || phase === PHASE_WON
}

function beginRun(rt: AudioRuntime, s: State, cursor: number): void {
  const now = rt.ctx.currentTime
  rt.cursor = cursor
  rt.lastTick = s.tick
  rt.lastPhase = s.phase
  rt.pickupStreak = 0
  rt.lastPlayed.fill(-1000)
  rt.section = sectionForTick(s.tick)
  rt.pendingSection = rt.section
  rt.row = 0
  rt.nextStepTime = now + START_DELAY_SECONDS
  rt.ducked = s.phase === PHASE_LEVEL_UP ? 1 : 0
  setDuck(rt, rt.ducked === 1, now)
  if (isTerminal(s.phase)) {
    rt.musicOn = 0
    stopMusic(rt, now)
    return
  }
  rt.musicOn = 1
  startMusic(rt, rt.section, now)
}

function changePhase(rt: AudioRuntime, phase: number): void {
  const now = rt.ctx.currentTime
  const ducked = phase === PHASE_LEVEL_UP ? 1 : 0
  if (ducked !== rt.ducked) {
    rt.ducked = ducked
    setDuck(rt, ducked === 1, now)
  }
  if (isTerminal(phase) && rt.musicOn === 1) {
    rt.musicOn = 0
    stopMusic(rt, now)
    playJingle(rt, phase === PHASE_DEAD ? DEFEAT_JINGLE : VICTORY_JINGLE, now + 0.1)
  }
  rt.lastPhase = phase
}

function claimSfxVoice(rt: AudioRuntime, priority: number, now: number): number {
  let victim = -1
  for (let slot = 0; slot < SFX_VOICES; slot++) {
    if (rt.sfxEnd[slot]! <= now) return slot
    if (rt.sfxPriority[slot]! > priority) continue
    if (victim < 0 || rt.sfxPriority[slot]! < rt.sfxPriority[victim]! || (rt.sfxPriority[slot] === rt.sfxPriority[victim] && rt.sfxEnd[slot]! < rt.sfxEnd[victim]!)) {
      victim = slot
    }
  }
  if (victim >= 0) cutSfx(rt, victim, now)
  return victim
}

function pickupPitch(rt: AudioRuntime, now: number): number {
  if (now - rt.lastPickupTime < PICKUP_STREAK_SECONDS) {
    if (rt.pickupStreak < PICKUP_RATIOS.length - 1) rt.pickupStreak++
  } else {
    rt.pickupStreak = 0
  }
  rt.lastPickupTime = now
  return PICKUP_RATIOS[rt.pickupStreak]!
}

function consumeEvents(rt: AudioRuntime, s: State): void {
  const head = s.evHead
  if (head - rt.cursor > EVENT_CAP) rt.cursor = head - EVENT_CAP
  const now = rt.ctx.currentTime
  while (rt.cursor < head) {
    const slot = rt.cursor % EVENT_CAP
    rt.cursor++
    const type = s.evType[slot]!
    const variants = SFX_TABLE[type]
    if (variants === undefined) continue
    const variant = sfxVariant(type, s.evA[slot]!, s.evB[slot]!)
    const def = variants[variant]
    if (def === undefined) continue
    const key = type * SFX_VARIANT_STRIDE + variant
    if (now - rt.lastPlayed[key]! < def.gapMs * 0.001) continue
    const pitch = type === EV_PICKUP && variant === 0 ? pickupPitch(rt, now) : 1
    const voice = claimSfxVoice(rt, def.priority, now)
    if (voice < 0) continue
    rt.lastPlayed[key] = now
    playSfx(rt, voice, def, pitch, now + SFX_LEAD_SECONDS)
  }
}

export function updateAudio(rt: AudioRuntime, s: State): void {
  if (rt.synced === 0) {
    rt.synced = 1
    beginRun(rt, s, s.evHead)
  } else if (s.evHead < rt.cursor || s.tick < rt.lastTick || (isTerminal(rt.lastPhase) && !isTerminal(s.phase))) {
    beginRun(rt, s, 0)
  }
  rt.lastTick = s.tick
  if (s.phase !== rt.lastPhase) changePhase(rt, s.phase)
  if (rt.musicOn === 1) rt.pendingSection = sectionForTick(s.tick)
  consumeEvents(rt, s)
  pumpMusic(rt)
}
