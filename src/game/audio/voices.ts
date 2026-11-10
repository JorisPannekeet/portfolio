import { DUCK_CUTOFF, DUCK_LEVEL, MUSIC_LEVEL, OPEN_CUTOFF } from './runtime.ts'
import type { AudioRuntime } from './runtime.ts'
import { SFX_NOISE_LONG, SFX_NOISE_SHORT, SFX_PULSE, SFX_WAVE } from './sfx.ts'
import type { SfxDef } from './sfx.ts'
import { BAR_SECONDS, CHORD_MAJOR, INSTRUMENTS, NOISE_SHORT, SECTION_SYNTH_CUTOFF, SECTION_SYNTH_LEVEL } from './song.ts'
import type { Instrument, Jingle } from './song.ts'
import {
  FX_DUTY,
  FX_SLIDE_DOWN,
  FX_SLIDE_UP,
  FX_VOLUME,
  midiToHz,
  VOICE_ARP,
  VOICE_KICK,
  VOICE_NOISE,
  VOICE_P1,
  VOICE_P2,
  VOICE_PAD,
  VOICE_SUB,
  VOICE_WAVE,
} from './tracker.ts'

const NOISE_CLOCK_PER_HZ = 32
const KICK_DROP_SECONDS = 0.08
const PAD_DETUNE_CENTS = 7
const STEAL_FADE = 0.004

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
  osc.frequency.setValueAtTime(midiToHz(note), time)
  if (sweep !== 0) {
    osc.detune.setValueAtTime(0, time)
    osc.detune.linearRampToValueAtTime(sweep * 100, time + duration)
  }
  const env = ctx.createGain()
  const stopAt = shapeEnvelope(env.gain, time, peak, ins, time + duration)
  osc.connect(env)
  env.connect(destination)
  if (send) env.connect(send)
  osc.start(time)
  osc.stop(stopAt)
}

function noise(rt: AudioRuntime, note: number, peak: number, ins: Instrument, time: number, duration: number): void {
  const ctx = rt.ctx
  const src = ctx.createBufferSource()
  src.buffer = ins.noise === NOISE_SHORT ? rt.noiseShort : rt.noiseLong
  src.loop = true
  src.playbackRate.setValueAtTime(noiseRate(ctx, midiToHz(note)), time)
  const env = ctx.createGain()
  const stopAt = shapeEnvelope(env.gain, time, peak, ins, time + Math.min(duration, ins.decay))
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
  env.connect(rt.synthBus[rt.activeSynth]!)
  const third = ins.chord === CHORD_MAJOR ? 4 : 3
  const intervals = [0, third, 7, 12]
  for (const interval of intervals) {
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
  const synth = rt.synthBus[rt.activeSynth]!
  switch (voice) {
    case VOICE_P1:
      tone(rt, rt.pulseWaves[duty]!, 'square', note, peak, ins, sweep, time, duration, rt.chipBus, rt.delaySend)
      break
    case VOICE_P2:
      tone(rt, rt.pulseWaves[duty]!, 'square', note, peak, ins, sweep, time, duration, rt.chipBus, null)
      break
    case VOICE_WAVE:
      tone(rt, rt.bassWave, 'sine', note, peak, ins, sweep, time, duration, rt.chipBus, null)
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
      tone(rt, null, 'sine', note, peak, ins, sweep, time, duration, synth, null)
      break
    case VOICE_ARP:
      tone(rt, null, 'sawtooth', note, peak, ins, sweep, time, duration, synth, rt.delaySend)
      break
  }
}

export function playSfx(rt: AudioRuntime, slot: number, def: SfxDef, pitch: number, time: number): void {
  const ctx = rt.ctx
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
  const kill = ctx.createGain()
  source.connect(env)
  env.connect(kill)
  kill.connect(rt.sfxBus)
  source.start(time)
  source.stop(end)
  rt.sfxEnv[slot] = kill
  rt.sfxEnd[slot] = end
  rt.sfxPriority[slot] = def.priority
}

export function cutSfx(rt: AudioRuntime, slot: number, time: number): void {
  const kill = rt.sfxEnv[slot]
  if (kill) kill.gain.setTargetAtTime(0, time, STEAL_FADE)
  rt.sfxEnv[slot] = null
}

const JINGLE_LEAD = INSTRUMENTS[1]!
const JINGLE_BASS = INSTRUMENTS[5]!

function playLine(rt: AudioRuntime, line: readonly number[], jingle: Jingle, lead: boolean, time: number): void {
  let at = time
  for (let i = 0; i + 1 < line.length; i += 2) {
    const note = line[i]!
    const duration = line[i + 1]! * jingle.stepSeconds
    const last = i + 2 >= line.length
    if (lead) tone(rt, rt.pulseWaves[2]!, 'square', note, 0.16, JINGLE_LEAD, last ? jingle.finalSweep : 0, at, duration, rt.sfxBus, null)
    else tone(rt, rt.bassWave, 'sine', note, 0.2, JINGLE_BASS, 0, at, duration, rt.sfxBus, null)
    at += duration
  }
}

export function playJingle(rt: AudioRuntime, jingle: Jingle, time: number): void {
  playLine(rt, jingle.lead, jingle, true, time)
  playLine(rt, jingle.bass, jingle, false, time)
}

export function startMusic(rt: AudioRuntime, section: number, time: number): void {
  rt.musicBus.gain.setTargetAtTime(MUSIC_LEVEL, time, 0.02)
  rt.activeSynth = 0
  rt.synthBus[0]!.gain.setTargetAtTime(SECTION_SYNTH_LEVEL[section]!, time, 0.02)
  rt.synthBus[1]!.gain.setTargetAtTime(0, time, 0.02)
  rt.synthTone.frequency.setTargetAtTime(SECTION_SYNTH_CUTOFF[section]!, time, 0.02)
}

export function stopMusic(rt: AudioRuntime, time: number): void {
  rt.musicBus.gain.setTargetAtTime(0, time, 0.06)
}

export function crossfadeSynth(rt: AudioRuntime, section: number, time: number): void {
  const outgoing = rt.synthBus[rt.activeSynth]!
  rt.activeSynth = 1 - rt.activeSynth
  const incoming = rt.synthBus[rt.activeSynth]!
  outgoing.gain.setTargetAtTime(0, time, BAR_SECONDS / 4)
  incoming.gain.setTargetAtTime(SECTION_SYNTH_LEVEL[section]!, time, BAR_SECONDS / 6)
  rt.synthTone.frequency.setTargetAtTime(SECTION_SYNTH_CUTOFF[section]!, time, BAR_SECONDS / 3)
}

export function setDuck(rt: AudioRuntime, ducked: boolean, time: number): void {
  rt.duckFilter.frequency.setTargetAtTime(ducked ? DUCK_CUTOFF : OPEN_CUTOFF, time, 0.08)
  rt.duckGain.gain.setTargetAtTime(ducked ? DUCK_LEVEL : 1, time, 0.08)
}
