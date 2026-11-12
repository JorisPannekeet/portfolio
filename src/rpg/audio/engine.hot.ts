import { NOTE_EMPTY, NOTE_OFF, STEPS_PER_BAR, VOICE_COUNT } from '../../game/audio/tracker.ts'
import { EV_PICKUP, EV_DIALOG, EV_SWING, EVENT_CAP, LOOT_GOLD, PHASE_DIALOG, PHASE_PLAYING } from '../sim/content.ts'
import type { State } from '../sim/state.ts'
import type { AudioRuntime } from './runtime.ts'
import { jingleFor, PICKUP_RATIOS, PICKUP_STREAK_SECONDS, SFX_TABLE, SFX_VARIANT_STRIDE, SFX_VOICES, sfxPitch, sfxVariant, syncCursor } from './sfx.ts'
import type { Sound } from './sfx.ts'
import { ARRANGEMENTS, GRID_STEPS, jingleSeconds, MIN_THEME_BARS, SONG_TABLES, STEP_SECONDS, themeFor } from './song.ts'
import { cutSfx, DUCK_JINGLE, DUCK_NONE, DUCK_PHASE, playJingle, playMusicNote, playSfx, setDuck, setMusicTone, startMusic } from './voices.ts'

const LOOKAHEAD_SECONDS = 0.12
const RESYNC_SECONDS = 0.25
const START_DELAY_SECONDS = 0.05
const SFX_LEAD_SECONDS = 0.005
const JINGLE_LEAD_SECONDS = 0.03
const JINGLE_TAIL_SECONDS = 0.4
const JINGLE_KEY = 7

function playRow(rt: AudioRuntime, time: number): void {
  const arrangement = ARRANGEMENTS[rt.theme]!
  const table = SONG_TABLES[arrangement.song]!
  const base = (rt.row % table.steps) * VOICE_COUNT
  for (let voice = 0; voice < VOICE_COUNT; voice++) {
    if (((arrangement.voices >> voice) & 1) === 0) continue
    const index = base + voice
    const note = table.note[index]!
    if (note === NOTE_EMPTY || note === NOTE_OFF) continue
    playMusicNote(rt, voice, note, table.instrument[index]!, table.effect[index]!, table.effectArg[index]!, arrangement.sour, table.length[index]! * STEP_SECONDS, time)
  }
}

function enterBar(rt: AudioRuntime, time: number): void {
  rt.bar++
  if (rt.pendingTheme === rt.theme || rt.bar - rt.themeSince < MIN_THEME_BARS) return
  rt.theme = rt.pendingTheme
  rt.themeSince = rt.bar
  setMusicTone(rt, ARRANGEMENTS[rt.theme]!.cutoff, time)
}

export function pumpMusic(rt: AudioRuntime): void {
  if (rt.synced === 0) return
  const now = rt.ctx.currentTime
  if (rt.nextStepTime < now - RESYNC_SECONDS) rt.nextStepTime = now + START_DELAY_SECONDS
  const horizon = now + LOOKAHEAD_SECONDS
  while (rt.nextStepTime < horizon) {
    if (rt.row % STEPS_PER_BAR === 0) enterBar(rt, rt.nextStepTime)
    playRow(rt, rt.nextStepTime)
    rt.row = (rt.row + 1) % GRID_STEPS
    rt.nextStepTime += STEP_SECONDS
  }
}

function beginRun(rt: AudioRuntime, s: State): void {
  const now = rt.ctx.currentTime
  rt.theme = themeFor(s)
  rt.pendingTheme = rt.theme
  rt.bar = 0
  rt.themeSince = -MIN_THEME_BARS
  rt.row = 0
  rt.nextStepTime = now + START_DELAY_SECONDS
  rt.jingleUntil = 0
  rt.pickupStreak = 0
  rt.lastPlayed.fill(-1000)
  rt.lastScript = s.dialogScript
  rt.lastLine = s.dialogLine
  setMusicTone(rt, ARRANGEMENTS[rt.theme]!.cutoff, now)
  startMusic(rt, now)
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

function trigger(rt: AudioRuntime, sound: Sound, key: number, pitch: number, now: number): void {
  if (now - rt.lastPlayed[key]! < sound.gapMs * 0.001) return
  const voice = claimSfxVoice(rt, sound.priority, now)
  if (voice < 0) return
  rt.lastPlayed[key] = now
  playSfx(rt, voice, sound, pitch, now + SFX_LEAD_SECONDS)
}

function playEvent(rt: AudioRuntime, type: number, a: number, b: number, now: number): void {
  const jingle = jingleFor(type, a)
  if (jingle !== null) {
    const key = type * SFX_VARIANT_STRIDE + JINGLE_KEY
    if (now - rt.lastPlayed[key]! < jingleSeconds(jingle)) return
    rt.lastPlayed[key] = now
    playJingle(rt, jingle, now + JINGLE_LEAD_SECONDS)
    const end = now + JINGLE_LEAD_SECONDS + jingleSeconds(jingle) + JINGLE_TAIL_SECONDS
    if (end > rt.jingleUntil) rt.jingleUntil = end
    return
  }
  const variants = SFX_TABLE[type]
  if (variants === undefined) return
  const variant = sfxVariant(type, a, b)
  const sound = variants[variant]
  if (sound === undefined) return
  const pitch = type === EV_PICKUP && a === LOOT_GOLD ? pickupPitch(rt, now) : sfxPitch(type, b)
  trigger(rt, sound, type * SFX_VARIANT_STRIDE + variant, pitch, now)
}

function consumeEvents(rt: AudioRuntime, s: State, now: number): void {
  const head = s.evHead
  while (rt.cursor < head) {
    const slot = rt.cursor % EVENT_CAP
    rt.cursor++
    const type = s.evType[slot]!
    const a = s.evA[slot]!
    playEvent(rt, type, type === EV_SWING && (s.stancesUnlocked & (1 << a)) === 0 ? -1 : a, s.evB[slot]!, now)
  }
}

function updateDialog(rt: AudioRuntime, s: State, now: number): void {
  if (s.phase === PHASE_DIALOG && s.dialogScript === rt.lastScript && s.dialogLine !== rt.lastLine) playEvent(rt, EV_DIALOG, s.dialogScript, s.dialogLine, now)
  rt.lastScript = s.dialogScript
  rt.lastLine = s.dialogLine
}

function updateDuck(rt: AudioRuntime, s: State, now: number): void {
  const duck = now < rt.jingleUntil ? DUCK_JINGLE : s.phase === PHASE_PLAYING ? DUCK_NONE : DUCK_PHASE
  if (duck !== rt.duck) setDuck(rt, duck, now)
}

export function updateAudio(rt: AudioRuntime, s: State): void {
  const now = rt.ctx.currentTime
  if (rt.synced === 0) {
    rt.synced = 1
    rt.cursor = s.evHead
    rt.lastTick = s.tick
    beginRun(rt, s)
  } else {
    const cursor = syncCursor(rt.cursor, s.evHead, s.tick, rt.lastTick)
    if (cursor < rt.cursor || s.tick < rt.lastTick) beginRun(rt, s)
    rt.cursor = cursor
  }
  rt.lastTick = s.tick
  rt.pendingTheme = themeFor(s)
  consumeEvents(rt, s, now)
  updateDialog(rt, s, now)
  updateDuck(rt, s, now)
  pumpMusic(rt)
}
