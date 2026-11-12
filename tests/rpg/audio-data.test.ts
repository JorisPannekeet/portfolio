import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EV_COUNT, EV_DEAD, EV_ENDING, EV_FINISHER, EV_HORN, EV_SKILL, EV_SWING, ENDING_REFORGE, ENDING_SHATTER, MELODY_COUNT } from '../../src/rpg/sim/content.ts'
import { NOTE_EMPTY, NOTE_OFF, parsePattern, STEPS_PER_BAR, VOICE_COUNT, VOICE_NAMES, VOICE_NOISE, VOICE_P1, VOICE_WAVE } from '../../src/game/audio/tracker.ts'
import { jingleFor, SFX_TABLE, SFX_VARIANT_STRIDE, SILENT_EVENTS, sfxVariant } from '../../src/rpg/audio/sfx.ts'
import {
  ARRANGEMENTS,
  GRID_STEPS,
  HORN_JINGLES,
  INSTRUMENTS,
  JINGLES,
  SONG_TABLES,
  SONGS,
  VOICE_RANGE_HIGH,
  VOICE_RANGE_LOW,
} from '../../src/rpg/audio/song.ts'

test('every song parses into whole bars on one shared grid', () => {
  assert.equal(SONGS.length, SONG_TABLES.length)
  for (const text of SONGS) assert.doesNotThrow(() => parsePattern(text))
  for (const table of SONG_TABLES) {
    assert.equal(table.steps % STEPS_PER_BAR, 0)
    assert.equal(GRID_STEPS % table.steps, 0, `a ${table.steps}-step song does not divide the ${GRID_STEPS}-step grid`)
  }
})

test('every note sits in its voice range and uses a real instrument', () => {
  for (const table of SONG_TABLES) {
    for (let i = 0; i < table.note.length; i++) {
      const note = table.note[i]!
      if (note === NOTE_EMPTY || note === NOTE_OFF) continue
      const voice = i % VOICE_COUNT
      assert.ok(note >= VOICE_RANGE_LOW[voice]! && note <= VOICE_RANGE_HIGH[voice]!, `${VOICE_NAMES[voice]} note ${note} out of range`)
      const ins = INSTRUMENTS[table.instrument[i]!]
      assert.ok(ins && ins.level > 0, `${VOICE_NAMES[voice]} uses missing instrument ${table.instrument[i]}`)
    }
  }
})

test('songs have different leads and bass lines', () => {
  const opening = (table: (typeof SONG_TABLES)[number], voice: number) => {
    const notes: number[] = []
    for (let row = 0; row < 2 * STEPS_PER_BAR; row++) notes.push(table.note[row * VOICE_COUNT + voice]!)
    return notes.join(',')
  }
  for (const voice of [VOICE_P1, VOICE_WAVE]) assert.equal(new Set(SONG_TABLES.map(table => opening(table, voice))).size, SONG_TABLES.length)
})

test('every arrangement plays a lead or bass line and some percussion or drone', () => {
  for (const [index, arrangement] of ARRANGEMENTS.entries()) {
    assert.ok(SONG_TABLES[arrangement.song], `arrangement ${index} points at a missing song`)
    assert.ok(((arrangement.voices >> VOICE_WAVE) & 1) === 1 || ((arrangement.voices >> VOICE_P1) & 1) === 1, `arrangement ${index} has no lead or bass`)
    assert.ok(arrangement.cutoff >= 800)
  }
  const noise = ARRANGEMENTS.filter(arrangement => ((arrangement.voices >> VOICE_NOISE) & 1) === 1)
  assert.ok(noise.length < ARRANGEMENTS.length, 'some arrangement drops the drums')
})

test('every event type makes a sound, plays a jingle or is listed as silent', () => {
  for (let type = 1; type < EV_COUNT; type++) {
    const sfx = (SFX_TABLE[type] ?? []).length > 0
    const jingle = jingleFor(type, type === EV_ENDING ? ENDING_REFORGE : 0) !== null
    const silent = SILENT_EVENTS.includes(type)
    assert.equal([sfx, jingle, silent].filter(Boolean).length, 1, `event ${type} must map to exactly one of sfx, jingle or silent`)
  }
})

test('sound definitions are sane and rate limited', () => {
  for (const variants of SFX_TABLE) {
    assert.ok(variants.length <= SFX_VARIANT_STRIDE - 1)
    for (const sound of variants) {
      assert.ok(sound.layers.length > 0)
      assert.ok(sound.priority >= 1 && sound.priority <= 9)
      assert.ok(sound.gapMs >= 0)
      for (const layer of sound.layers) {
        assert.ok(layer.level > 0 && layer.level <= 0.35)
        assert.ok(layer.startHz > 0 && layer.endHz > 0)
        assert.ok(layer.attack + layer.sustain + layer.decay + layer.delay < 2.5)
      }
    }
  }
})

test('variants resolve inside each table for any payload', () => {
  for (let type = 1; type < EV_COUNT; type++) {
    const variants = SFX_TABLE[type]!
    if (variants.length === 0) continue
    for (const a of [-1, 0, 1, 2, 3, 4, 5, 8, 12, 99]) {
      for (const b of [-1, 0, 1, 4]) assert.ok(variants[sfxVariant(type, a, b)], `event ${type} a=${a} b=${b} has no sound`)
    }
  }
})

test('swings, skills and finishers sound different per stance', () => {
  for (const type of [EV_SWING, EV_SKILL, EV_FINISHER]) {
    const variants = SFX_TABLE[type]!
    assert.equal(new Set(variants.map(sound => JSON.stringify(sound.layers))).size, variants.length)
  }
})

const notesOf = (line: readonly number[]) => line.filter((_, i) => i % 2 === 0)

test('the three war-horn calls are distinct five to eight note melodies', () => {
  assert.equal(HORN_JINGLES.length, MELODY_COUNT)
  for (let melody = 0; melody < MELODY_COUNT; melody++) {
    const notes = notesOf(jingleFor(EV_HORN, melody)!.lead)
    assert.ok(notes.length >= 5 && notes.length <= 8, `horn ${melody} has ${notes.length} notes`)
  }
  assert.equal(new Set(HORN_JINGLES.map(horn => notesOf(horn.lead).join(','))).size, MELODY_COUNT)
})

test('jingles are distinct, non-empty and playable', () => {
  assert.equal(new Set(JINGLES.map(jingle => notesOf(jingle.lead).join(','))).size, JINGLES.length)
  for (const jingle of JINGLES) {
    for (const line of [jingle.lead, jingle.bass]) {
      assert.ok(line.length >= 2 && line.length % 2 === 0)
      for (let i = 0; i < line.length; i += 2) {
        assert.ok(line[i]! >= 36 && line[i]! <= 100)
        assert.ok(line[i + 1]! > 0)
      }
    }
    assert.ok(INSTRUMENTS[jingle.leadIns]!.level > 0 && INSTRUMENTS[jingle.bassIns]!.level > 0)
  }
  assert.notEqual(jingleFor(EV_ENDING, ENDING_REFORGE), jingleFor(EV_ENDING, ENDING_SHATTER))
  assert.ok(jingleFor(EV_DEAD, 0))
})
