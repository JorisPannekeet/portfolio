import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  AI_CHASE,
  AI_IDLE,
  AREA_ASHFORGE,
  AREA_BARROW,
  AREA_BRENNHOLD,
  AREA_CITADEL,
  AREA_SALTREACH,
  AREA_SHRINE,
  AREA_VALDMERE,
  AREA_VELLIN,
  BOSS_BARROW_KING,
  BOSS_VAREK,
  CH_BARROW,
  CH_EMBER,
  CH_VIGIL,
  ENEMY_CHAINED,
  EV_BLOCK,
  EV_HIT,
  EV_HORN,
  EV_SAVE,
  EVENT_CAP,
  NIGHT_START_TICKS,
  PHASE_DEAD,
  PHASE_DIALOG,
  PHASE_PLAYING,
  VAREK_PHASE_COLOSSUS,
  VAREK_PHASE_DUEL,
  VAREK_PHASE_ELEMENTS,
} from '../../src/rpg/sim/content.ts'
import { createState, resetState } from '../../src/rpg/sim/state.ts'
import type { State } from '../../src/rpg/sim/state.ts'
import { emit } from '../../src/rpg/sim/events.hot.ts'
import { updateAudio } from '../../src/rpg/audio/engine.hot.ts'
import { createRuntime } from '../../src/rpg/audio/runtime.ts'
import type { AudioRuntime } from '../../src/rpg/audio/runtime.ts'
import { syncCursor } from '../../src/rpg/audio/sfx.ts'
import {
  BAR_SECONDS,
  themeFor,
  TH_ASHFORGE,
  TH_BARROW,
  TH_BARROW_CORRUPT,
  TH_BOSS,
  TH_BRENNHOLD,
  TH_CITADEL,
  TH_SALTREACH,
  TH_SALTREACH_CORRUPT,
  TH_SHRINE,
  TH_VALDMERE,
  TH_VALDMERE_DARK,
  TH_VALDMERE_DARK_NIGHT,
  TH_VALDMERE_NIGHT,
  TH_VAREK,
  TH_VAREK_WAKENED,
  TH_VELLIN,
} from '../../src/rpg/audio/song.ts'
import { DUCK_JINGLE, DUCK_NONE, DUCK_PHASE } from '../../src/rpg/audio/voices.ts'

interface Place {
  area: number
  variant?: number
  clock?: number
  chapter?: number
  boss?: number
  bossPhase?: number
}

function stateAt(place: Place): State {
  const s = createState()
  s.area = place.area
  s.areaVariant = place.variant ?? 0
  s.clock = place.clock ?? 0
  s.chapter = place.chapter ?? CH_BARROW
  s.bossPhase = place.bossPhase ?? 0
  if (place.boss !== undefined) {
    s.eAlive[5] = 1
    s.eKind[5] = place.boss
    s.eState[5] = AI_CHASE
  }
  return s
}

test('theme follows area, variant, night, the Vigil, bosses and Varek phases', () => {
  const night = NIGHT_START_TICKS
  const cases: [Place, number][] = [
    [{ area: AREA_BRENNHOLD }, TH_BRENNHOLD],
    [{ area: AREA_VALDMERE }, TH_VALDMERE],
    [{ area: AREA_VALDMERE, clock: night - 1 }, TH_VALDMERE],
    [{ area: AREA_VALDMERE, clock: night }, TH_VALDMERE_NIGHT],
    [{ area: AREA_VALDMERE, chapter: CH_VIGIL }, TH_VALDMERE],
    [{ area: AREA_VALDMERE, chapter: CH_EMBER }, TH_VALDMERE_DARK],
    [{ area: AREA_VALDMERE, chapter: CH_EMBER, clock: night }, TH_VALDMERE_DARK_NIGHT],
    [{ area: AREA_BARROW }, TH_BARROW],
    [{ area: AREA_BARROW, variant: 1 }, TH_BARROW_CORRUPT],
    [{ area: AREA_SALTREACH }, TH_SALTREACH],
    [{ area: AREA_SALTREACH, variant: 1 }, TH_SALTREACH_CORRUPT],
    [{ area: AREA_ASHFORGE }, TH_ASHFORGE],
    [{ area: AREA_VELLIN }, TH_VELLIN],
    [{ area: AREA_CITADEL }, TH_CITADEL],
    [{ area: AREA_SHRINE }, TH_SHRINE],
    [{ area: AREA_SHRINE, variant: 2 }, TH_SHRINE],
    [{ area: AREA_BARROW, boss: ENEMY_CHAINED }, TH_BARROW],
    [{ area: AREA_BARROW, boss: BOSS_BARROW_KING }, TH_BOSS],
    [{ area: AREA_BARROW, variant: 1, boss: BOSS_BARROW_KING }, TH_BOSS],
    [{ area: AREA_SHRINE, boss: BOSS_BARROW_KING }, TH_BOSS],
    [{ area: AREA_CITADEL, boss: BOSS_VAREK, bossPhase: VAREK_PHASE_DUEL }, TH_VAREK],
    [{ area: AREA_CITADEL, boss: BOSS_VAREK, bossPhase: VAREK_PHASE_ELEMENTS }, TH_VAREK_WAKENED],
    [{ area: AREA_CITADEL, boss: BOSS_VAREK, bossPhase: VAREK_PHASE_COLOSSUS }, TH_VAREK_WAKENED],
  ]
  for (const [place, theme] of cases) assert.equal(themeFor(stateAt(place)), theme, JSON.stringify(place))
})

test('a boss that has not noticed the player keeps the area theme', () => {
  const s = stateAt({ area: AREA_BARROW, boss: BOSS_BARROW_KING })
  s.eState[5] = AI_IDLE
  assert.equal(themeFor(s), TH_BARROW)
})

test('a dead boss slot does not hold the boss theme', () => {
  const s = stateAt({ area: AREA_BARROW, boss: BOSS_BARROW_KING })
  s.eAlive[5] = 0
  assert.equal(themeFor(s), TH_BARROW)
})

test('the event cursor keeps up, skips an overrun ring and restarts after a reset', () => {
  assert.equal(syncCursor(5, 9, 100, 99), 5)
  assert.equal(syncCursor(5, 5, 100, 100), 5)
  assert.equal(syncCursor(10, 10 + EVENT_CAP + 30, 100, 99), 10 + 30)
  assert.equal(syncCursor(500, 3, 100, 99), 0)
  assert.equal(syncCursor(500, 3, 0, 900), 0)
  assert.equal(syncCursor(40, 45, 2, 900), 0)
  assert.equal(syncCursor(500, EVENT_CAP + 7, 0, 900), 7)
})

interface FakeContext {
  currentTime: number
  readonly links: { from: object, to: object }[]
}

function fakeContext(): FakeContext & AudioContext {
  const links: { from: object, to: object }[] = []
  const param = (): object => {
    const p: Record<string, unknown> = { value: 0 }
    for (const method of ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime', 'setTargetAtTime', 'cancelScheduledValues']) p[method] = () => p
    return p
  }
  const node = (): object => {
    const params = new Map<string | symbol, object>()
    const base: Record<string | symbol, unknown> = {
      type: '',
      loop: false,
      buffer: null,
      connect: (to: object) => (links.push({ from: proxy, to }), to),
      start: () => undefined,
      stop: () => undefined,
      setPeriodicWave: () => undefined,
    }
    const proxy: object = new Proxy(base, {
      get(target, key) {
        if (key in target) return target[key]
        if (!params.has(key)) params.set(key, param())
        return params.get(key)
      },
    })
    return proxy
  }
  const ctx = {
    currentTime: 0,
    links,
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

function rig(area = AREA_BRENNHOLD) {
  const ctx = fakeContext()
  const rt: AudioRuntime = createRuntime(ctx)
  const s = stateAt({ area })
  updateAudio(rt, s)
  const sfxSends = () => ctx.links.filter(link => link.to === rt.sfxBus).length
  const frame = (seconds = 1 / 60) => {
    ctx.currentTime += seconds
    s.tick++
    updateAudio(rt, s)
  }
  return { ctx, rt, s, sfxSends, frame }
}

test('events sound once each and a burst of hits is rate limited', () => {
  const { s, sfxSends, frame } = rig()
  frame()
  let before = sfxSends()
  emit(s, EV_HIT, 0, 10, 0, 0)
  emit(s, EV_BLOCK, 0, 0, 0, 0)
  emit(s, EV_SAVE, 0, 0, 0, 0)
  frame()
  assert.equal(sfxSends() - before, 3)
  frame(1)
  before = sfxSends()
  for (let i = 0; i < 40; i++) emit(s, EV_HIT, i, 10, 0, 0)
  frame()
  assert.equal(sfxSends() - before, 1)
})

test('audio survives an event ring overrun and keeps playing new events', () => {
  const { rt, s, sfxSends, frame } = rig()
  for (let i = 0; i < EVENT_CAP * 3 + 5; i++) emit(s, EV_HIT, i, 1, 0, 0)
  frame()
  assert.equal(rt.cursor, s.evHead)
  frame(1)
  const before = sfxSends()
  emit(s, EV_SAVE, 0, 0, 0, 0)
  frame()
  assert.equal(sfxSends() - before, 1)
})

test('a state reset rewinds the cursor so the new run is heard', () => {
  const { rt, s, sfxSends, frame } = rig()
  for (let i = 0; i < 30; i++) {
    emit(s, EV_HIT, 0, 1, 0, 0)
    frame(0.2)
  }
  resetState(s, 7)
  s.area = AREA_BRENNHOLD
  emit(s, EV_SAVE, 0, 0, 0, 0)
  const before = sfxSends()
  updateAudio(rt, s)
  assert.equal(rt.cursor, 1)
  assert.equal(sfxSends() - before, 1)
})

test('music changes theme only on bar lines and ducks for dialog, death and jingles', () => {
  const { rt, s, frame } = rig(AREA_BRENNHOLD)
  assert.equal(rt.theme, TH_BRENNHOLD)
  frame(0.7)
  s.area = AREA_VALDMERE
  let lastBar = rt.bar
  let switchedAt = -1
  for (let i = 0; i < 60 * 4 * BAR_SECONDS; i++) {
    const theme = rt.theme
    frame()
    if (rt.theme !== theme) {
      assert.notEqual(rt.bar, lastBar, 'theme switched off a bar line')
      switchedAt = i
    }
    lastBar = rt.bar
  }
  assert.ok(switchedAt >= 0)
  assert.equal(rt.theme, TH_VALDMERE)
  assert.equal(rt.duck, DUCK_NONE)
  s.phase = PHASE_DIALOG
  frame()
  assert.equal(rt.duck, DUCK_PHASE)
  s.phase = PHASE_DEAD
  frame()
  assert.equal(rt.duck, DUCK_PHASE)
  s.phase = PHASE_PLAYING
  frame()
  assert.equal(rt.duck, DUCK_NONE)
  emit(s, EV_HORN, 1, 0, 0, 0)
  frame()
  assert.equal(rt.duck, DUCK_JINGLE)
  for (let i = 0; i < 60 * 3; i++) frame()
  assert.equal(rt.duck, DUCK_NONE)
})

test('advancing a dialog line blips', () => {
  const { s, sfxSends, frame } = rig()
  s.phase = PHASE_DIALOG
  s.dialogScript = 2
  s.dialogLine = 0
  frame()
  const before = sfxSends()
  s.dialogLine = 1
  frame()
  assert.equal(sfxSends() - before, 1)
})
