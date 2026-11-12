import { FX_DUTY, FX_SLIDE_DOWN, FX_SLIDE_UP, FX_VOLUME, midiToHz, VOICE_ARP, VOICE_KICK, VOICE_NOISE, VOICE_P1, VOICE_P2, VOICE_PAD, VOICE_SUB, VOICE_WAVE } from '../../game/audio/tracker.ts'
import { MUSIC_LEVEL } from './runtime.ts'
import type { AudioRuntime } from './runtime.ts'
import { SFX_NOISE_LONG, SFX_NOISE_SHORT, SFX_PULSE, SFX_WAVE } from './sfx.ts'
import type { SfxLayer, Sound } from './sfx.ts'
import { BAR_SECONDS, CHORD_MAJOR, DUCK_CUTOFF, DUCK_LEVEL, INSTRUMENTS, JINGLE_DUCK_LEVEL, NOISE_SHORT, OPEN_CUTOFF } from './song.ts'
import type { Instrument, Jingle } from './song.ts'

const NOISE_CLOCK_PER_HZ = 32
const KICK_DROP_SECONDS = 0.08
const PAD_DETUNE_CENTS = 7
const STEAL_FADE = 0.004
const BEND_SECONDS = 0.04
const RING_MIX = 0.35
const JINGLE_LEAD_LEVEL = 0.16
const JINGLE_BASS_LEVEL = 0.2

export const DUCK_NONE = 0
export const DUCK_PHASE = 1
export const DUCK_JINGLE = 2

function shapeEnvelope(param: AudioParam, time: number, peak: number, ins: Instrument, end: number): number {
  const attackEnd = time + ins.attack
  const releaseAt = Math.max(end, attackEnd)
  param.setValueAtTime(0, time)
  param.linearRampToValueAtTime(peak, attackEnd)
  param.setTargetAtTime(peak * ins.sustain, attackEnd, Math.max(ins.decay, 0.001) / 3)
  param.setTargetAtTime(0, releaseAt, Math.max(ins.release, 0.001) / 5)
  return releaseAt + ins.release + 0.02
}

function noiseRate(ctx: AudioContext, hz: number): number {
  return Math.min(16, Math.max(0.005, (hz * NOISE_CLOCK_PER_HZ) / ctx.sampleRate))
}

function tone(
  rt: AudioRuntime,
  wave: PeriodicWave | null,
  type: OscillatorType,
  note: number,
  peak: number,
  ins: Instrument,
  cents: number,
  sweep: number,
  time: number,
  duration: number,
  destination: AudioNode,
  send: AudioNode | null,
): void {
  const ctx = rt.ctx
  const osc = ctx.createOscillator()
  if (wave) osc.setPeriodicWave(wave)
  else osc.type = type
  const hz = midiToHz(note)
  if (ins.bend !== 0) {
    osc.frequency.setValueAtTime(hz * 2 ** (ins.bend / 12), time)
    osc.frequency.exponentialRampToValueAtTime(hz, time + BEND_SECONDS)
  } else {
    osc.frequency.setValueAtTime(hz, time)
  }
  osc.detune.setValueAtTime(cents, time)
  if (sweep !== 0) osc.detune.linearRampToValueAtTime(cents + sweep * 100, time + duration)
  const env = ctx.createGain()
  const stopAt = shapeEnvelope(env.gain, time, peak, ins, time + duration)
  osc.connect(env)
  env.connect(destination)
  if (send) env.connect(send)
  osc.start(time)
  osc.stop(stopAt)
  if (ins.ring > 0) {
    const partial = ctx.createOscillator()
    partial.frequency.setValueAtTime(hz * ins.ring, time)
    const mix = ctx.createGain()
    mix.gain.value = RING_MIX
    partial.connect(mix)
    mix.connect(env)
    partial.start(time)
    partial.stop(stopAt)
  }
}

function noise(rt: AudioRuntime, note: number, peak: number, ins: Instrument, time: number, duration: number): void {
  const ctx = rt.ctx
  const src = ctx.createBufferSource()
  src.buffer = ins.noise === NOISE_SHORT ? rt.noiseShort : rt.noiseLong
  src.loop = true
  src.playbackRate.setValueAtTime(noiseRate(ctx, midiToHz(note)), time)
  const env = ctx.createGain()
  const stopAt = shapeEnvelope(env.gain, time, peak, ins, time + Math.min(duration, ins.attack + ins.decay))
  if (ins.highpass > 0) {
    const highpass = ctx.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = ins.highpass
    src.connect(highpass)
    highpass.connect(env)
  } else {
    src.connect(env)
  }
  env.connect(rt.noiseBus)
  src.start(time, Math.random() * src.buffer.duration)
  src.stop(stopAt)
}

function kick(rt: AudioRuntime, note: number, peak: number, ins: Instrument, time: number): void {
  const ctx = rt.ctx
  const osc = ctx.createOscillator()
  const hz = midiToHz(note)
  osc.frequency.setValueAtTime(hz * 2 ** (-ins.sweep / 12), time)
  osc.frequency.exponentialRampToValueAtTime(hz, time + KICK_DROP_SECONDS)
  const env = ctx.createGain()
  const stopAt = shapeEnvelope(env.gain, time, peak, ins, time + ins.decay)
  osc.connect(env)
  env.connect(rt.drumBus)
  osc.start(time)
  osc.stop(stopAt)
}

function pad(rt: AudioRuntime, note: number, peak: number, ins: Instrument, time: number, duration: number): void {
  const ctx = rt.ctx
  const env = ctx.createGain()
  const stopAt = shapeEnvelope(env.gain, time, peak, ins, time + duration)
  env.connect(rt.synthBus)
  const third = ins.chord === CHORD_MAJOR ? 4 : 3
  for (const interval of [0, third, 7, 12]) {
    for (const side of [-1, 1]) {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(midiToHz(note + interval), time)
      osc.detune.value = side * PAD_DETUNE_CENTS
      osc.connect(env)
      osc.start(time)
      osc.stop(stopAt)
    }
  }
}

export function playMusicNote(
  rt: AudioRuntime,
  voice: number,
  note: number,
  instrumentIndex: number,
  effect: number,
  effectArg: number,
  sour: number,
  duration: number,
  time: number,
): void {
  const ins = INSTRUMENTS[instrumentIndex]
  if (!ins) return
  let peak = ins.level
  let duty = ins.duty
  let sweep = 0
  if (effect === FX_VOLUME) peak *= effectArg / 15
  else if (effect === FX_DUTY) duty = effectArg & 3
  else if (effect === FX_SLIDE_DOWN) sweep = -effectArg
  else if (effect === FX_SLIDE_UP) sweep = effectArg
  switch (voice) {
    case VOICE_P1:
      tone(rt, rt.pulseWaves[duty]!, 'square', note, peak, ins, 0, sweep, time, duration, rt.chipBus, rt.delaySend)
      break
    case VOICE_P2:
      tone(rt, rt.pulseWaves[duty]!, 'square', note, peak, ins, sour, sweep, time, duration, rt.chipBus, null)
      break
    case VOICE_WAVE:
      tone(rt, rt.bassWave, 'sine', note, peak, ins, 0, sweep, time, duration, rt.chipBus, null)
      break
    case VOICE_NOISE:
      noise(rt, note, peak, ins, time, duration)
      break
    case VOICE_KICK:
      kick(rt, note, peak, ins, time)
      break
    case VOICE_PAD:
      pad(rt, note, peak, ins, time, duration)
      break
    case VOICE_SUB:
      tone(rt, null, 'sine', note, peak, ins, 0, sweep, time, duration, rt.synthBus, null)
      break
    case VOICE_ARP:
      tone(rt, null, 'sawtooth', note, peak, ins, -sour, sweep, time, duration, rt.synthBus, rt.delaySend)
      break
  }
}

function playLayer(rt: AudioRuntime, def: SfxLayer, pitch: number, start: number, out: AudioNode): number {
  const ctx = rt.ctx
  const time = start + def.delay
  const total = def.attack + def.sustain + def.decay
  const end = time + total + 0.03
  let source: AudioScheduledSourceNode
  let frequency: AudioParam
  let detune: AudioParam
  let scale = 1
  if (def.wave === SFX_NOISE_LONG || def.wave === SFX_NOISE_SHORT) {
    const src = ctx.createBufferSource()
    src.buffer = def.wave === SFX_NOISE_SHORT ? rt.noiseShort : rt.noiseLong
    src.loop = true
    scale = NOISE_CLOCK_PER_HZ / ctx.sampleRate
    source = src
    frequency = src.playbackRate
    detune = src.detune
  } else {
    const osc = ctx.createOscillator()
    if (def.wave === SFX_PULSE) osc.setPeriodicWave(rt.pulseWaves[def.duty]!)
    else if (def.wave === SFX_WAVE) osc.setPeriodicWave(rt.bassWave)
    else osc.type = 'sawtooth'
    source = osc
    frequency = osc.frequency
    detune = osc.detune
  }
  frequency.setValueAtTime(def.startHz * pitch * scale, time)
  if (def.endHz !== def.startHz) frequency.exponentialRampToValueAtTime(def.endHz * pitch * scale, time + total)
  if (def.arpRatio !== 1) detune.setValueAtTime(1200 * Math.log2(def.arpRatio), time + def.arpAt)
  if (def.vibratoCents > 0) {
    const lfo = ctx.createOscillator()
    lfo.frequency.value = def.vibratoHz
    const depth = ctx.createGain()
    depth.gain.value = def.vibratoCents
    lfo.connect(depth)
    depth.connect(detune)
    lfo.start(time)
    lfo.stop(end)
  }
  const env = ctx.createGain()
  env.gain.setValueAtTime(0, time)
  env.gain.linearRampToValueAtTime(def.level, time + def.attack)
  env.gain.setValueAtTime(def.level, time + def.attack + def.sustain)
  env.gain.setTargetAtTime(0, time + def.attack + def.sustain, def.decay / 4)
  source.connect(env)
  env.connect(out)
  source.start(time)
  source.stop(end)
  return end
}

export function playSfx(rt: AudioRuntime, slot: number, sound: Sound, pitch: number, time: number): void {
  const kill = rt.ctx.createGain()
  kill.connect(rt.sfxBus)
  let end = time
  for (const def of sound.layers) end = Math.max(end, playLayer(rt, def, pitch, time, kill))
  rt.sfxEnv[slot] = kill
  rt.sfxEnd[slot] = end
  rt.sfxPriority[slot] = sound.priority
}

export function cutSfx(rt: AudioRuntime, slot: number, time: number): void {
  const kill = rt.sfxEnv[slot]
  if (kill) kill.gain.setTargetAtTime(0, time, STEAL_FADE)
  rt.sfxEnv[slot] = null
}

function playLine(rt: AudioRuntime, line: readonly number[], jingle: Jingle, lead: boolean, time: number): void {
  const ins = INSTRUMENTS[lead ? jingle.leadIns : jingle.bassIns]!
  let at = time
  for (let i = 0; i + 1 < line.length; i += 2) {
    const duration = line[i + 1]! * jingle.stepSeconds
    const sweep = lead && i + 2 >= line.length ? jingle.finalSweep : 0
    if (lead) tone(rt, rt.pulseWaves[ins.duty]!, 'square', line[i]!, JINGLE_LEAD_LEVEL, ins, 0, sweep, at, duration, rt.sfxBus, null)
    else tone(rt, rt.bassWave, 'sine', line[i]!, JINGLE_BASS_LEVEL, ins, 0, 0, at, duration, rt.sfxBus, null)
    at += duration
  }
}

export function playJingle(rt: AudioRuntime, jingle: Jingle, time: number): void {
  playLine(rt, jingle.lead, jingle, true, time)
  playLine(rt, jingle.bass, jingle, false, time)
}

export function startMusic(rt: AudioRuntime, time: number): void {
  rt.musicBus.gain.setTargetAtTime(MUSIC_LEVEL, time, 0.05)
}

export function setMusicTone(rt: AudioRuntime, cutoff: number, time: number): void {
  rt.musicTone.frequency.setTargetAtTime(cutoff, time, BAR_SECONDS / 3)
}

export function setDuck(rt: AudioRuntime, duck: number, time: number): void {
  rt.duck = duck
  const level = duck === DUCK_JINGLE ? JINGLE_DUCK_LEVEL : duck === DUCK_PHASE ? DUCK_LEVEL : 1
  rt.duckFilter.frequency.setTargetAtTime(duck === DUCK_NONE ? OPEN_CUTOFF : DUCK_CUTOFF, time, 0.08)
  rt.duckGain.gain.setTargetAtTime(level, time, 0.08)
}
