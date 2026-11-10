import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EV_BLAST, EV_BOSS, EV_DEAD, EV_EVOLVE, EV_HEAL, EV_HIT, EV_HURT, EV_KILL, EV_LEVEL, EV_PICKUP, EV_PULSE, EV_SHOOT, EV_SLASH, EV_WON, GEM_KIND_COUNT, ENEMY_COUNT, TICK_HZ, WEAPON_COUNT } from '../src/game/sim/content.ts'
import { DEFEAT_JINGLE, INSTRUMENTS, SECTION_COUNT, SECTION_PATTERNS, SECTION_TABLES, sectionForTick, VICTORY_JINGLE, VOICE_RANGE_HIGH, VOICE_RANGE_LOW } from '../src/game/audio/song.ts'
import { SFX_TABLE, SFX_VARIANT_STRIDE, sfxVariant } from '../src/game/audio/sfx.ts'
import { NOTE_EMPTY, NOTE_OFF, parseNote, parsePattern, STEPS_PER_BAR, VOICE_COUNT, VOICE_NAMES } from '../src/game/audio/tracker.ts'
import { DUTY_STEPS, lfsrSequence, stepWaveCoefficients } from '../src/game/audio/waves.ts'

const HEADER = VOICE_NAMES.join(' | ')
const EMPTY_ROW = Array(VOICE_COUNT).fill('--- . ..').join(' | ')

test('every section pattern parses into a table', () => {
  assert.equal(SECTION_TABLES.length, SECTION_COUNT)
  for (const pattern of SECTION_PATTERNS) assert.doesNotThrow(() => parsePattern(pattern))
})

test('all sections share the bar length and step count', () => {
  const steps = SECTION_TABLES[0]!.steps
  assert.equal(steps % STEPS_PER_BAR, 0)
  for (const table of SECTION_TABLES) {
    assert.equal(table.steps, steps)
    assert.equal(table.note.length, steps * VOICE_COUNT)
  }
})

test('every note sits in its voice range and has an instrument', () => {
  for (const table of SECTION_TABLES) {
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

test('section follows the run clock', () => {
  const at = (minutes: number, seconds: number) => sectionForTick((minutes * 60 + seconds) * TICK_HZ)
  assert.equal(at(0, 0), 0)
  assert.equal(at(1, 59), 0)
  assert.equal(at(2, 0), 1)
  assert.equal(at(4, 0), 2)
  assert.equal(at(6, 0), 3)
  assert.equal(at(7, 59), 3)
})

test('every sounding event type has sane sfx definitions', () => {
  const sounding = [EV_HIT, EV_KILL, EV_SHOOT, EV_SLASH, EV_BLAST, EV_PULSE, EV_PICKUP, EV_HURT, EV_LEVEL, EV_EVOLVE, EV_BOSS, EV_HEAL]
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
  for (let enemy = 0; enemy < ENEMY_COUNT; enemy++) assert.ok(SFX_TABLE[EV_KILL]![sfxVariant(EV_KILL, enemy, 0)])
  for (let gem = 0; gem < GEM_KIND_COUNT; gem++) assert.ok(SFX_TABLE[EV_PICKUP]![sfxVariant(EV_PICKUP, gem, 0)])
})

test('instruments have sane envelopes', () => {
  assert.equal(INSTRUMENTS.length, 16)
  for (const ins of INSTRUMENTS) {
    assert.ok(ins.level >= 0 && ins.level <= 0.5)
    assert.ok(ins.sustain >= 0 && ins.sustain <= 1)
    assert.ok(ins.attack >= 0 && ins.decay > 0 && ins.release > 0)
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
