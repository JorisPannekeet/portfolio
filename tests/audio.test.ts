import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  BEACON_REWARD_HEAL,
  BULLET_KIND_COUNT,
  ENEMY_BOSS_FIRST,
  ENEMY_TANK,
  EVENT_CAP,
  ENEMY_COUNT,
  EV_BEACON,
  EV_BLAST,
  EV_BOSS,
  EV_DEAD,
  EV_ENEMY_FIRE,
  EV_EVOLVE,
  EV_HEAL,
  EV_HIT,
  EV_HURT,
  EV_KILL,
  EV_LEVEL,
  EV_PICKUP,
  EV_PULSE,
  EV_SHOOT,
  EV_SLASH,
  EV_WON,
  EV_ZONE,
  GEM_KIND_COUNT,
  POI_BEACON,
  TICK_HZ,
  WEAPON_COUNT,
  ZONE_COUNT,
  ZONE_CRYO,
  ZONE_FOUNDRY,
  ZONE_HANGAR,
  ZONE_SCRAPYARD,
} from '../src/game/sim/content.ts'
import { createState } from '../src/game/sim/state.ts'
import type { State } from '../src/game/sim/state.ts'
import { updateAudio } from '../src/game/audio/engine.hot.ts'
import { CHARGE_LEVEL, createRuntime, HUM_LEVEL } from '../src/game/audio/runtime.ts'
import type { AudioRuntime } from '../src/game/audio/runtime.ts'
import {
  BAR_SECONDS,
  DEFEAT_JINGLE,
  INS_ANVIL,
  INS_CRASH,
  INS_HAT,
  INS_METAL,
  INS_OPEN_HAT,
  INS_SHAKER,
  INS_SNARE,
  INSTRUMENTS,
  INTENSITY_COUNT,
  INTENSITY_LEVELS,
  intensityForTick,
  levelAllows,
  TENSION_LEVEL,
  THEME_TABLES,
  themeForZone,
  VICTORY_JINGLE,
  VOICE_RANGE_HIGH,
  VOICE_RANGE_LOW,
  ZONE_THEMES,
} from '../src/game/audio/song.ts'
import { SFX_TABLE, SFX_VARIANT_STRIDE, sfxVariant } from '../src/game/audio/sfx.ts'
import {
  NOTE_EMPTY,
  NOTE_OFF,
  parseNote,
  parsePattern,
  STEPS_PER_BAR,
  VOICE_ARP,
  VOICE_COUNT,
  VOICE_KICK,
  VOICE_NAMES,
  VOICE_NOISE,
  VOICE_P1,
  VOICE_P2,
  VOICE_PAD,
  VOICE_SUB,
  VOICE_WAVE,
} from '../src/game/audio/tracker.ts'
import { DUTY_STEPS, lfsrSequence, stepWaveCoefficients } from '../src/game/audio/waves.ts'

const HEADER = VOICE_NAMES.join(' | ')
const EMPTY_ROW = Array(VOICE_COUNT).fill('--- . ..').join(' | ')

test('every zone theme parses into a table', () => {
  assert.equal(ZONE_THEMES.length, ZONE_COUNT)
  assert.equal(THEME_TABLES.length, ZONE_COUNT)
  for (const pattern of ZONE_THEMES) assert.doesNotThrow(() => parsePattern(pattern))
})

test('all themes share the bar length and step count', () => {
  const steps = THEME_TABLES[0]!.steps
  assert.equal(steps % STEPS_PER_BAR, 0)
  for (const table of THEME_TABLES) {
    assert.equal(table.steps, steps)
    assert.equal(table.note.length, steps * VOICE_COUNT)
  }
})

test('every note sits in its voice range and has an instrument', () => {
  for (const table of THEME_TABLES) {
    for (let i = 0; i < table.note.length; i++) {
      const note = table.note[i]!
      if (note === NOTE_EMPTY || note === NOTE_OFF) continue
      const voice = i % VOICE_COUNT
      assert.ok(note >= VOICE_RANGE_LOW[voice]! && note <= VOICE_RANGE_HIGH[voice]!, `${VOICE_NAMES[voice]} note ${note} out of range`)
      assert.ok(INSTRUMENTS[table.instrument[i]!]!.level > 0)
      assert.ok(table.length[i]! >= 1 && table.length[i]! <= STEPS_PER_BAR)
    }
  }
  for (const jingle of [DEFEAT_JINGLE, VICTORY_JINGLE]) {
    for (const line of [jingle.lead, jingle.bass]) {
      assert.equal(line.length % 2, 0)
      for (let i = 0; i < line.length; i += 2) assert.ok(line[i]! >= 36 && line[i]! <= 100)
    }
  }
})

function soundingAt(table: (typeof THEME_TABLES)[number], level: number, row: number, voice: number): boolean {
  const index = row * VOICE_COUNT + voice
  const note = table.note[index]!
  return note !== NOTE_EMPTY && note !== NOTE_OFF && levelAllows(level, voice, table.instrument[index]!)
}

test('every theme keeps lead, bass and hats audible at the quietest level', () => {
  for (const table of THEME_TABLES) {
    for (const voice of [VOICE_P1, VOICE_WAVE, VOICE_NOISE]) {
      let rows = 0
      for (let row = 0; row < 2 * STEPS_PER_BAR; row++) if (soundingAt(table, 0, row, voice)) rows++
      assert.ok(rows > 0, `${VOICE_NAMES[voice]} is silent in the first two bars at level 0`)
    }
  }
})

test('themes are different music', () => {
  const opening = (table: (typeof THEME_TABLES)[number], voice: number) => {
    const notes: number[] = []
    for (let row = 0; row < 2 * STEPS_PER_BAR; row++) notes.push(table.note[row * VOICE_COUNT + voice]!)
    return notes.join(',')
  }
  for (const voice of [VOICE_P1, VOICE_WAVE]) {
    const openings = new Set(THEME_TABLES.map(table => opening(table, voice)))
    assert.equal(openings.size, THEME_TABLES.length, `${VOICE_NAMES[voice]} openings repeat across themes`)
  }
})

test('notes parse to MIDI numbers', () => {
  assert.equal(parseNote('A-4'), 69)
  assert.equal(parseNote('C-4'), 60)
  assert.equal(parseNote('A#2'), 46)
  assert.equal(parseNote('---'), NOTE_EMPTY)
  assert.equal(parseNote('==='), NOTE_OFF)
  assert.throws(() => parseNote('H-4'))
})

test('note length runs to the next event and stops at the bar line', () => {
  const rows = [HEADER]
  for (let i = 0; i < STEPS_PER_BAR; i++) rows.push(EMPTY_ROW)
  rows[1] = rows[1]!.replace('--- . ..', 'C-5 1 V8')
  rows[5] = rows[5]!.replace('--- . ..', '=== . ..')
  rows[9] = rows[9]!.replace('--- . ..', 'D-5 1 ..')
  const table = parsePattern(rows.join('\n'))
  assert.equal(table.length[0], 4)
  assert.equal(table.length[8 * VOICE_COUNT], 8)
  assert.equal(table.effectArg[0], 8)
})

test('malformed patterns are rejected', () => {
  assert.throws(() => parsePattern(`${HEADER}\n${EMPTY_ROW}`))
  assert.throws(() => parsePattern(`P1 | P2\n${EMPTY_ROW}`))
  const noInstrument = [HEADER, EMPTY_ROW.replace('--- . ..', 'C-5 . ..')]
  for (let i = 1; i < STEPS_PER_BAR; i++) noInstrument.push(EMPTY_ROW)
  assert.throws(() => parsePattern(noInstrument.join('\n')))
})


test('theme follows the zone', () => {
  assert.equal(themeForZone(ZONE_HANGAR), 0)
  assert.equal(themeForZone(ZONE_SCRAPYARD), 1)
  assert.equal(themeForZone(ZONE_CRYO), 2)
  assert.equal(themeForZone(ZONE_FOUNDRY), 3)
  assert.equal(themeForZone(-1), 0)
  assert.equal(themeForZone(ZONE_COUNT), 0)
})

test('intensity follows the run clock', () => {
  const at = (minutes: number, seconds: number) => intensityForTick((minutes * 60 + seconds) * TICK_HZ)
  assert.equal(at(0, 0), 0)
  assert.equal(intensityForTick(2 * 60 * TICK_HZ - 1), 0)
  assert.equal(at(2, 0), 1)
  assert.equal(intensityForTick(4 * 60 * TICK_HZ - 1), 1)
  assert.equal(at(4, 0), 2)
  assert.equal(intensityForTick(6 * 60 * TICK_HZ - 1), 2)
  assert.equal(at(6, 0), 3)
  assert.equal(at(7, 59), 3)
  assert.equal(at(9, 0), 3)
})

test('intensity masks silence the right voices and instruments', () => {
  assert.equal(INTENSITY_LEVELS.length, INTENSITY_COUNT)
  const lead = 1
  for (const voice of [VOICE_P1, VOICE_WAVE]) assert.ok(levelAllows(0, voice, lead))
  for (const ins of [INS_HAT, INS_SHAKER]) assert.ok(levelAllows(0, VOICE_NOISE, ins))
  for (const ins of [INS_SNARE, INS_OPEN_HAT, INS_CRASH, INS_METAL, INS_ANVIL]) assert.ok(!levelAllows(0, VOICE_NOISE, ins))
  for (const voice of [VOICE_P2, VOICE_KICK, VOICE_PAD, VOICE_SUB, VOICE_ARP]) assert.ok(!levelAllows(0, voice, lead))
  for (const voice of [VOICE_KICK, VOICE_PAD]) assert.ok(levelAllows(1, voice, lead))
  for (const ins of [INS_SNARE, INS_METAL, INS_ANVIL]) assert.ok(levelAllows(1, VOICE_NOISE, ins))
  for (const voice of [VOICE_P2, VOICE_SUB, VOICE_ARP]) assert.ok(!levelAllows(1, voice, lead))
  assert.ok(!levelAllows(1, VOICE_NOISE, INS_OPEN_HAT))
  for (const voice of [VOICE_P2, VOICE_SUB]) assert.ok(levelAllows(2, voice, lead))
  assert.ok(levelAllows(2, VOICE_NOISE, INS_OPEN_HAT))
  assert.ok(!levelAllows(2, VOICE_ARP, lead))
  assert.ok(!levelAllows(2, VOICE_NOISE, INS_CRASH))
  for (let level = 0; level + 1 < INTENSITY_COUNT; level++) {
    assert.ok(INTENSITY_LEVELS[level]!.synthLevel <= INTENSITY_LEVELS[level + 1]!.synthLevel)
    for (let voice = 0; voice < VOICE_COUNT; voice++) {
      for (let ins = 1; ins < INSTRUMENTS.length; ins++) {
        if (levelAllows(level, voice, ins)) assert.ok(levelAllows(level + 1, voice, ins), `level ${level + 1} drops ${VOICE_NAMES[voice]} instrument ${ins}`)
      }
    }
  }
  for (let voice = 0; voice < VOICE_COUNT; voice++) {
    for (let ins = 1; ins < INSTRUMENTS.length; ins++) assert.ok(levelAllows(INTENSITY_COUNT - 1, voice, ins))
  }
})

test('every sounding event type has sane sfx definitions', () => {
  const sounding = [EV_HIT, EV_KILL, EV_SHOOT, EV_SLASH, EV_BLAST, EV_PULSE, EV_PICKUP, EV_HURT, EV_LEVEL, EV_EVOLVE, EV_BOSS, EV_HEAL, EV_BEACON, EV_ZONE, EV_ENEMY_FIRE]
  for (const type of sounding) assert.ok(SFX_TABLE[type]!.length > 0, `event ${type} is silent`)
  assert.equal(SFX_TABLE[EV_DEAD]!.length, 0)
  assert.equal(SFX_TABLE[EV_WON]!.length, 0)
  for (const variants of SFX_TABLE) {
    assert.ok(variants.length <= SFX_VARIANT_STRIDE)
    for (const def of variants) {
      assert.ok(def.startHz >= 20 && def.startHz <= 12000)
      assert.ok(def.endHz >= 20 && def.endHz <= 12000)
      assert.ok(def.duty >= 0 && def.duty < DUTY_STEPS.length)
      assert.ok(def.attack >= 0 && def.sustain >= 0 && def.decay > 0)
      assert.ok(def.attack + def.sustain + def.decay <= 2)
      assert.ok(def.level > 0 && def.level <= 0.4)
      assert.ok(def.arpRatio >= 0.25 && def.arpRatio <= 4 && def.arpAt >= 0)
      assert.ok(def.vibratoHz >= 0 && def.vibratoHz <= 30 && def.vibratoCents >= 0 && def.vibratoCents <= 1200)
      assert.ok(def.priority >= 0 && def.priority <= 9)
      assert.ok(def.gapMs >= 0 && def.gapMs <= 2000)
    }
  }
})

test('sfx variants resolve for every weapon, enemy and gem', () => {
  for (let weapon = 0; weapon < WEAPON_COUNT; weapon++) {
    for (const evolved of [0, 1]) assert.ok(SFX_TABLE[EV_SHOOT]![sfxVariant(EV_SHOOT, weapon, evolved)])
  }
  assert.notEqual(sfxVariant(EV_SHOOT, 0, 0), sfxVariant(EV_SHOOT, 0, 1))
  for (let enemy = 0; enemy < ENEMY_COUNT; enemy++) {
    assert.ok(SFX_TABLE[EV_KILL]![sfxVariant(EV_KILL, enemy, 0)])
    assert.equal(sfxVariant(EV_KILL, enemy, 0), enemy >= ENEMY_BOSS_FIRST ? 1 : 0)
  }
  for (let zone = 0; zone < ZONE_COUNT; zone++) {
    assert.ok(SFX_TABLE[EV_BOSS]![sfxVariant(EV_BOSS, zone, 0)])
    assert.ok(SFX_TABLE[EV_ZONE]![sfxVariant(EV_ZONE, zone, 0)])
  }
  assert.equal(sfxVariant(EV_BEACON, 3, 2), 0)
  assert.equal(sfxVariant(EV_BEACON, BEACON_REWARD_HEAL, 0), 1)
  const confirm = SFX_TABLE[EV_BEACON]![0]!
  const heal = SFX_TABLE[EV_BEACON]![1]!
  assert.ok(confirm.endHz > confirm.startHz && heal.endHz > heal.startHz)
  assert.ok(heal.level < confirm.level)
  for (let gem = 0; gem < GEM_KIND_COUNT; gem++) assert.ok(SFX_TABLE[EV_PICKUP]![sfxVariant(EV_PICKUP, gem, 0)])
})

test('instruments have sane envelopes', () => {
  assert.ok(INSTRUMENTS.length <= 31)
  for (const ins of INSTRUMENTS) {
    assert.ok(ins.level >= 0 && ins.level <= 0.5)
    assert.ok(ins.sustain >= 0 && ins.sustain <= 1)
    assert.ok(ins.attack >= 0 && ins.decay > 0 && ins.release > 0)
    assert.ok(Math.abs(ins.bend) <= 12 && ins.ring >= 0 && ins.ring <= 8)
  }
})

test('noise registers are maximal length', () => {
  for (const [width, period] of [[15, 32767], [7, 127]] as const) {
    const sequence = lfsrSequence(width)
    assert.equal(sequence.length, period)
    let sum = 0
    for (const value of sequence) sum += value
    assert.equal(Math.abs(sum), 1)
  }
})

test('pulse duty tables produce distinct spectra', () => {
  const firsts = DUTY_STEPS.map(steps => {
    const { real, imag } = stepWaveCoefficients(steps, 8)
    return Math.hypot(real[1]!, imag[1]!)
  })
  assert.ok(firsts[0]! < firsts[1]! && firsts[1]! < firsts[2]!)
  assert.ok(Math.abs(firsts[1]! - firsts[3]!) < 1e-6)
})

interface ParamCall {
  readonly method: string
  readonly value: number
  readonly time: number
}

interface FakeParam {
  value: number
  readonly calls: ParamCall[]
}

interface FakeContext {
  currentTime: number
  readonly starts: number[]
  readonly links: { from: object, to: object }[]
}

function fakeParam(): FakeParam {
  const calls: ParamCall[] = []
  const param = {
    value: 0,
    calls,
    setValueAtTime: (value: number, time: number) => (calls.push({ method: 'set', value, time }), param),
    linearRampToValueAtTime: (value: number, time: number) => (calls.push({ method: 'linear', value, time }), param),
    exponentialRampToValueAtTime: (value: number, time: number) => (calls.push({ method: 'exp', value, time }), param),
    setTargetAtTime: (value: number, time: number) => (calls.push({ method: 'target', value, time }), param),
    cancelScheduledValues: (time: number) => (calls.push({ method: 'cancel', value: 0, time }), param),
  }
  return param
}

function fakeContext(): FakeContext & AudioContext {
  const fake: FakeContext = { currentTime: 0, starts: [], links: [] }
  const node = (): object => {
    const params = new Map<string | symbol, FakeParam>()
    const base: Record<string | symbol, unknown> = {
      type: '',
      loop: false,
      buffer: null,
      connect: (to: object) => (fake.links.push({ from: proxy, to }), to),
      disconnect: () => undefined,
      start: (time = fake.currentTime) => fake.starts.push(time),
      stop: () => undefined,
      setPeriodicWave: () => undefined,
    }
    const proxy: object = new Proxy(base, {
      get(target, key) {
        if (key in target) return target[key]
        if (!params.has(key)) params.set(key, fakeParam())
        return params.get(key)
      },
    })
    return proxy
  }
  const ctx = {
    get currentTime() {
      return fake.currentTime
    },
    set currentTime(value: number) {
      fake.currentTime = value
    },
    starts: fake.starts,
    links: fake.links,
    sampleRate: 48000,
    state: 'running',
    destination: node(),
    createGain: node,
    createBiquadFilter: node,
    createDynamicsCompressor: node,
    createDelay: node,
    createOscillator: node,
    createBufferSource: node,
    createPeriodicWave: () => ({}),
    createBuffer: (_channels: number, length: number, rate: number) => ({ duration: length / rate, getChannelData: () => new Float32Array(length) }),
  }
  return ctx as unknown as FakeContext & AudioContext
}

function paramCalls(param: AudioParam): ParamCall[] {
  return (param as unknown as FakeParam).calls
}

function lastTarget(param: AudioParam): number {
  const calls = paramCalls(param).filter(call => call.method === 'target' || call.method === 'set')
  return calls[calls.length - 1]!.value
}

function frame(ctx: FakeContext, rt: AudioRuntime, s: State): void {
  ctx.currentTime += 1 / 60
  s.tick++
  updateAudio(rt, s)
}

test('music changes theme with the zone only on bar lines and at most every two bars', () => {
  const ctx = fakeContext()
  const rt = createRuntime(ctx)
  const s = createState()
  const walk: [number, number][] = [[0, ZONE_HANGAR], [5, ZONE_SCRAPYARD]]
  for (let hop = 0; hop < 13; hop++) walk.push([12 + hop * 0.6, hop % 2 === 0 ? ZONE_FOUNDRY : ZONE_SCRAPYARD])
  walk.push([20, ZONE_FOUNDRY], [24, ZONE_CRYO], [25, ZONE_FOUNDRY], [25.4, ZONE_CRYO])
  const seen: number[] = [rt.theme]
  const noteStarts = ctx.starts.length
  s.zone = ZONE_HANGAR
  updateAudio(rt, s)
  while (ctx.currentTime < 36) {
    let zone = ZONE_HANGAR
    for (const [at, z] of walk) if (ctx.currentTime >= at) zone = z
    s.zone = zone
    frame(ctx, rt, s)
    if (rt.theme !== seen[seen.length - 1]) seen.push(rt.theme)
  }
  assert.equal(rt.theme, ZONE_CRYO)
  assert.deepEqual([seen[0], seen[1]], [ZONE_HANGAR, ZONE_SCRAPYARD])
  assert.ok(seen.includes(ZONE_FOUNDRY))
  assert.ok(seen.indexOf(ZONE_FOUNDRY) < seen.lastIndexOf(ZONE_CRYO))
  const firstRow = Math.min(...ctx.starts.slice(noteStarts))
  const switches: number[] = []
  for (const bus of rt.synthBus) {
    for (const call of paramCalls(bus.gain)) if (call.method === 'target' && call.value > 0 && call.time > firstRow) switches.push(call.time)
  }
  switches.sort((a, b) => a - b)
  assert.equal(switches.length, seen.length - 1)
  const bars = switches.map(time => (time - firstRow) / BAR_SECONDS)
  for (const bar of bars) assert.ok(Math.abs(bar - Math.round(bar)) < 1e-6, `switch at bar ${bar} is off the bar line`)
  for (let i = 1; i < bars.length; i++) assert.ok(Math.round(bars[i]!) - Math.round(bars[i - 1]!) >= 2, 'themes switched less than two bars apart')
})

test('boss tension layer fades in with a boss and out after it', () => {
  const ctx = fakeContext()
  const rt = createRuntime(ctx)
  const s = createState()
  updateAudio(rt, s)
  const tensionNotes = () => ctx.links.filter(link => link.to === rt.tensionBus).length
  for (let i = 0; i < 60; i++) frame(ctx, rt, s)
  assert.equal(tensionNotes(), 0)
  s.bossMaxHp = 2500
  for (let i = 0; i < 120; i++) frame(ctx, rt, s)
  assert.equal(lastTarget(rt.tensionBus.gain), TENSION_LEVEL)
  assert.ok(tensionNotes() > 0)
  s.bossMaxHp = 0
  frame(ctx, rt, s)
  assert.equal(lastTarget(rt.tensionBus.gain), 0)
  for (let i = 0; i < 60 * 6; i++) frame(ctx, rt, s)
  const settled = tensionNotes()
  for (let i = 0; i < 120; i++) frame(ctx, rt, s)
  assert.equal(tensionNotes(), settled)
})

test('beacon hum rises with capture progress and stops when progress stalls', () => {
  const ctx = fakeContext()
  const rt = createRuntime(ctx)
  const s = createState()
  s.poiCount = 2
  s.poiKind[0] = POI_BEACON
  s.poiKind[1] = POI_BEACON
  updateAudio(rt, s)
  assert.equal(rt.humOn, 0)
  const pitches: number[] = []
  for (let i = 1; i <= 30; i++) {
    s.poiProgress[1] = i / 60
    frame(ctx, rt, s)
    pitches.push(lastTarget(rt.humOsc.frequency))
  }
  assert.equal(lastTarget(rt.humGain.gain), HUM_LEVEL)
  for (let i = 1; i < pitches.length; i++) assert.ok(pitches[i]! > pitches[i - 1]!)
  for (let i = 0; i < 10; i++) frame(ctx, rt, s)
  assert.equal(lastTarget(rt.humGain.gain), 0)
  for (let i = 0; i < 10; i++) {
    s.poiProgress[1] = s.poiProgress[1]! - 0.01
    frame(ctx, rt, s)
  }
  assert.equal(rt.humOn, 0)
  s.poiProgress[0] = 1
  frame(ctx, rt, s)
  assert.equal(rt.humOn, 0)
})

const signature = (def: (typeof SFX_TABLE)[number][number]) => `${def.wave}:${def.duty}:${def.startHz}:${def.endHz}`

test('each hostile bullet kind has its own volley sound, unlike any player weapon', () => {
  const variants = new Set<number>()
  const sounds = new Set<string>()
  const weapons = new Set(SFX_TABLE[EV_SHOOT]!.map(signature))
  const hurt = SFX_TABLE[EV_HURT]![0]!.priority
  const level = SFX_TABLE[EV_LEVEL]![0]!.priority
  for (let kind = 0; kind < BULLET_KIND_COUNT; kind++) {
    const variant = sfxVariant(EV_ENEMY_FIRE, ENEMY_BOSS_FIRST, kind)
    variants.add(variant)
    const def = SFX_TABLE[EV_ENEMY_FIRE]![variant]!
    assert.ok(!weapons.has(signature(def)), `bullet kind ${kind} sounds like a player weapon`)
    sounds.add(signature(def))
    assert.ok(def.priority < hurt && def.priority < level, `bullet kind ${kind} could mask hurt or level-up`)
    assert.ok(def.gapMs >= 60, `bullet kind ${kind} is not rate limited`)
  }
  assert.equal(variants.size, BULLET_KIND_COUNT)
  assert.equal(sounds.size, BULLET_KIND_COUNT)
  assert.equal(sfxVariant(EV_ENEMY_FIRE, ENEMY_TANK, 99), sfxVariant(EV_ENEMY_FIRE, ENEMY_TANK, 0))
})

function pushEvent(s: State, type: number, a: number, b: number): void {
  const slot = s.evHead % EVENT_CAP
  s.evType[slot] = type
  s.evX[slot] = 0
  s.evY[slot] = 0
  s.evA[slot] = a
  s.evB[slot] = b
  s.evHead++
}

test('volley sounds hold their rate limit per bullet kind under a burst', () => {
  const ctx = fakeContext()
  const rt = createRuntime(ctx)
  const s = createState()
  updateAudio(rt, s)
  const played = () => ctx.links.filter(link => link.to === rt.sfxBus).length
  const before = played()
  for (let n = 0; n < 40; n++) for (let kind = 0; kind < BULLET_KIND_COUNT; kind++) pushEvent(s, EV_ENEMY_FIRE, ENEMY_BOSS_FIRST, kind)
  frame(ctx, rt, s)
  assert.equal(played() - before, BULLET_KIND_COUNT)
  const kind = 0
  const gap = SFX_TABLE[EV_ENEMY_FIRE]![sfxVariant(EV_ENEMY_FIRE, ENEMY_BOSS_FIRST, kind)]!.gapMs
  const start = played()
  const seconds = 3
  for (let i = 0; i < 60 * seconds; i++) {
    pushEvent(s, EV_ENEMY_FIRE, ENEMY_BOSS_FIRST, kind)
    pushEvent(s, EV_ENEMY_FIRE, ENEMY_BOSS_FIRST, kind)
    frame(ctx, rt, s)
  }
  const plays = played() - start
  assert.ok(plays <= Math.ceil((seconds * 1000) / gap) + 1, `${plays} orb chirps in ${seconds}s`)
  assert.ok(plays >= Math.floor((seconds * 1000) / (gap + 1000 / 60)) - 1)
  pushEvent(s, EV_HURT, 10, 0)
  const hurtBefore = played()
  frame(ctx, rt, s)
  assert.equal(played() - hurtBefore, 1)
})

test('boss charge tone rises while a boss winds up and stops when it fires', () => {
  const ctx = fakeContext()
  const rt = createRuntime(ctx)
  const s = createState()
  s.enemyCount = 2
  s.eType[0] = ENEMY_TANK
  s.eType[1] = ENEMY_BOSS_FIRST + 1
  updateAudio(rt, s)
  s.eAim[0] = 30
  frame(ctx, rt, s)
  assert.equal(rt.chargeOn, 0)
  s.eAim[1] = 40
  frame(ctx, rt, s)
  assert.equal(rt.chargeOn, 0, 'no scan without a living boss')
  s.bossMaxHp = 2500
  const pitches: number[] = []
  for (let aim = 40; aim > 0; aim--) {
    s.eAim[1] = aim
    frame(ctx, rt, s)
    pitches.push(lastTarget(rt.chargeOsc.frequency))
  }
  assert.equal(rt.chargeOn, 1)
  assert.equal(lastTarget(rt.chargeGain.gain), CHARGE_LEVEL)
  for (let i = 1; i < pitches.length; i++) assert.ok(pitches[i]! > pitches[i - 1]!)
  s.eAim[1] = 0
  frame(ctx, rt, s)
  assert.equal(rt.chargeOn, 0)
  assert.equal(lastTarget(rt.chargeGain.gain), 0)
  s.eAim[1] = 20
  frame(ctx, rt, s)
  assert.equal(rt.chargeOn, 1)
  s.bossMaxHp = 0
  frame(ctx, rt, s)
  assert.equal(rt.chargeOn, 0)
})
