import { ENEMY_BOSS_FIRST, EV_PICKUP, EVENT_CAP, PHASE_DEAD, PHASE_LEVEL_UP, PHASE_PLAYING, PHASE_WON, POI_BEACON } from '../sim/content.ts'
import type { State } from '../sim/state.ts'
import { CHARGE_LEVEL, CHARGE_LOW_HZ, CHARGE_OCTAVES, CHARGE_SPAN_TICKS, HUM_HOLD_FRAMES, HUM_LEVEL, HUM_LOW_HZ, HUM_OCTAVES } from './runtime.ts'
import type { AudioRuntime } from './runtime.ts'
import { PICKUP_RATIOS, PICKUP_STREAK_SECONDS, SFX_TABLE, SFX_VARIANT_STRIDE, SFX_VOICES, sfxVariant } from './sfx.ts'
import { DEFEAT_JINGLE, intensityForTick, levelAllows, MIN_THEME_BARS, STEP_SECONDS, THEME_TABLES, themeForZone, VICTORY_JINGLE } from './song.ts'
import { NOTE_EMPTY, NOTE_OFF, STEPS_PER_BAR, VOICE_COUNT } from './tracker.ts'
import {
  applyIntensity,
  crossfadeSynth,
  cutSfx,
  playJingle,
  playMusicNote,
  playSfx,
  playTension,
  setDuck,
  setTension,
  silenceTension,
  startMusic,
  stopMusic,
} from './voices.ts'

const LOOKAHEAD_SECONDS = 0.12
const RESYNC_SECONDS = 0.25
const START_DELAY_SECONDS = 0.05
const SFX_LEAD_SECONDS = 0.005
const HUM_GLIDE_SECONDS = 0.03
const HUM_RELEASE_SECONDS = 0.08

function playRow(rt: AudioRuntime, row: number, time: number): void {
  const table = THEME_TABLES[rt.theme]!
  const base = row * VOICE_COUNT
  for (let voice = 0; voice < VOICE_COUNT; voice++) {
    const index = base + voice
    const note = table.note[index]!
    if (note === NOTE_EMPTY || note === NOTE_OFF) continue
    const instrument = table.instrument[index]!
    if (!levelAllows(rt.level, voice, instrument)) continue
    playMusicNote(rt, voice, note, instrument, table.effect[index]!, table.effectArg[index]!, table.length[index]! * STEP_SECONDS, time)
  }
  if (rt.tensionOn === 1 || time < rt.tensionEnd) playTension(rt, row, time)
}

function enterBar(rt: AudioRuntime, time: number): void {
  rt.bar++
  const levelChanged = rt.pendingLevel !== rt.level
  rt.level = rt.pendingLevel
  if (rt.pendingTheme !== rt.theme && rt.bar - rt.themeSince >= MIN_THEME_BARS) {
    rt.theme = rt.pendingTheme
    rt.themeSince = rt.bar
    crossfadeSynth(rt, time)
  } else if (levelChanged) {
    applyIntensity(rt, time)
  }
}

export function pumpMusic(rt: AudioRuntime): void {
  if (rt.musicOn === 0) return
  const now = rt.ctx.currentTime
  if (rt.nextStepTime < now - RESYNC_SECONDS) rt.nextStepTime = now + START_DELAY_SECONDS
  const horizon = now + LOOKAHEAD_SECONDS
  while (rt.nextStepTime < horizon) {
    if (rt.row % STEPS_PER_BAR === 0) enterBar(rt, rt.nextStepTime)
    playRow(rt, rt.row, rt.nextStepTime)
    rt.row = (rt.row + 1) % THEME_TABLES[rt.theme]!.steps
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
  rt.theme = themeForZone(s.zone)
  rt.pendingTheme = rt.theme
  rt.level = intensityForTick(s.tick)
  rt.pendingLevel = rt.level
  rt.bar = 0
  rt.themeSince = -MIN_THEME_BARS
  rt.row = 0
  rt.nextStepTime = now + START_DELAY_SECONDS
  rt.ducked = s.phase === PHASE_LEVEL_UP ? 1 : 0
  setDuck(rt, rt.ducked === 1, now)
  silenceTension(rt, now)
  for (let i = 0; i < rt.poiLast.length; i++) rt.poiLast[i] = s.poiProgress[i]!
  rt.humFrames = HUM_HOLD_FRAMES
  if (isTerminal(s.phase)) {
    rt.musicOn = 0
    stopMusic(rt, now)
    return
  }
  rt.musicOn = 1
  startMusic(rt, now)
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

function updateHum(rt: AudioRuntime, s: State): void {
  let rising = -1
  for (let i = 0; i < s.poiCount; i++) {
    const progress = s.poiProgress[i]!
    if (s.poiKind[i] === POI_BEACON && progress > 0 && progress < 1 && progress > rt.poiLast[i]! && progress > rising) rising = progress
    rt.poiLast[i] = progress
  }
  const now = rt.ctx.currentTime
  if (rising >= 0) {
    rt.humFrames = 0
    const hz = HUM_LOW_HZ * 2 ** (rising * HUM_OCTAVES)
    rt.humOsc.frequency.setTargetAtTime(hz, now, HUM_GLIDE_SECONDS)
    rt.humTone.frequency.setTargetAtTime(hz * 3, now, HUM_GLIDE_SECONDS)
  } else if (rt.humFrames < HUM_HOLD_FRAMES) {
    rt.humFrames++
  }
  const on = s.phase === PHASE_PLAYING && rt.humFrames < HUM_HOLD_FRAMES ? 1 : 0
  if (on === rt.humOn) return
  rt.humOn = on
  rt.humGain.gain.setTargetAtTime(on === 1 ? HUM_LEVEL : 0, now, on === 1 ? HUM_GLIDE_SECONDS : HUM_RELEASE_SECONDS)
}

function soonestBossVolley(s: State): number {
  if (s.bossMaxHp <= 0) return 0
  let soonest = 0
  for (let i = 0; i < s.enemyCount; i++) {
    const aim = s.eAim[i]!
    if (aim > 0 && s.eType[i]! >= ENEMY_BOSS_FIRST && (soonest === 0 || aim < soonest)) soonest = aim
  }
  return soonest
}

function updateCharge(rt: AudioRuntime, s: State): void {
  const aim = s.phase === PHASE_PLAYING ? soonestBossVolley(s) : 0
  const now = rt.ctx.currentTime
  if (aim > 0) {
    const left = aim < CHARGE_SPAN_TICKS ? aim / CHARGE_SPAN_TICKS : 1
    rt.chargeOsc.frequency.setTargetAtTime(CHARGE_LOW_HZ * 2 ** ((1 - left) * CHARGE_OCTAVES), now, HUM_GLIDE_SECONDS)
  }
  const on = aim > 0 ? 1 : 0
  if (on === rt.chargeOn) return
  rt.chargeOn = on
  rt.chargeGain.gain.setTargetAtTime(on === 1 ? CHARGE_LEVEL : 0, now, on === 1 ? HUM_GLIDE_SECONDS : HUM_RELEASE_SECONDS)
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
  if (rt.musicOn === 1) {
    rt.pendingTheme = themeForZone(s.zone)
    rt.pendingLevel = intensityForTick(s.tick)
  }
  const boss = rt.musicOn === 1 && s.bossMaxHp > 0 ? 1 : 0
  if (boss !== rt.tensionOn) setTension(rt, boss === 1, rt.ctx.currentTime)
  consumeEvents(rt, s)
  updateHum(rt, s)
  updateCharge(rt, s)
  pumpMusic(rt)
}
