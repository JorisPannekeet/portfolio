export const VOICE_P1 = 0
export const VOICE_P2 = 1
export const VOICE_WAVE = 2
export const VOICE_NOISE = 3
export const VOICE_KICK = 4
export const VOICE_PAD = 5
export const VOICE_SUB = 6
export const VOICE_ARP = 7
export const VOICE_COUNT = 8
export const VOICE_NAMES: readonly string[] = ['P1', 'P2', 'WV', 'NZ', 'BD', 'PAD', 'SUB', 'ARP']

export const NOTE_EMPTY = 0
export const NOTE_OFF = 255

export const FX_NONE = 0
export const FX_VOLUME = 86
export const FX_DUTY = 68
export const FX_SLIDE_DOWN = 83
export const FX_SLIDE_UP = 85
const FX_LETTERS = 'VDSU'

export const STEPS_PER_BAR = 16

export interface PatternTable {
  readonly steps: number
  readonly note: Uint8Array
  readonly instrument: Uint8Array
  readonly effect: Uint8Array
  readonly effectArg: Uint8Array
  readonly length: Uint8Array
}

const SEMITONES: Readonly<Record<string, number>> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

export function parseNote(text: string): number {
  if (text === '---') return NOTE_EMPTY
  if (text === '===') return NOTE_OFF
  const base = SEMITONES[text[0] ?? '']
  const accidental = text[1]
  const octave = Number(text[2])
  if (text.length !== 3 || base === undefined || (accidental !== '-' && accidental !== '#') || !Number.isInteger(octave)) {
    throw new Error(`bad note "${text}"`)
  }
  const midi = (octave + 1) * 12 + base + (accidental === '#' ? 1 : 0)
  if (midi < 1 || midi > 127) throw new Error(`note out of MIDI range "${text}"`)
  return midi
}

function parseHex(text: string, what: string): number {
  const value = parseInt(text, 16)
  if (text.length !== 1 || Number.isNaN(value)) throw new Error(`bad ${what} "${text}"`)
  return value
}

export function parsePattern(text: string): PatternTable {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  const header = lines.shift()?.split('|').map(name => name.trim())
  if (!header || header.join(',') !== VOICE_NAMES.join(',')) throw new Error(`pattern header must be ${VOICE_NAMES.join(' | ')}`)
  const steps = lines.length
  if (steps === 0 || steps % STEPS_PER_BAR !== 0) throw new Error(`pattern has ${steps} rows, not a whole number of bars`)
  const size = steps * VOICE_COUNT
  const note = new Uint8Array(size)
  const instrument = new Uint8Array(size)
  const effect = new Uint8Array(size)
  const effectArg = new Uint8Array(size)
  const length = new Uint8Array(size)
  lines.forEach((line, row) => {
    const cells = line.split('|')
    if (cells.length !== VOICE_COUNT) throw new Error(`row ${row}: expected ${VOICE_COUNT} cells, got ${cells.length}`)
    cells.forEach((cell, voice) => {
      const parts = cell.trim().split(/\s+/)
      const [noteText, instrumentText, effectText] = parts
      if (parts.length !== 3 || !noteText || !instrumentText || !effectText || effectText.length !== 2) {
        throw new Error(`row ${row} voice ${VOICE_NAMES[voice]}: bad cell "${cell}"`)
      }
      const index = row * VOICE_COUNT + voice
      const midi = parseNote(noteText)
      note[index] = midi
      if (instrumentText !== '.') instrument[index] = parseHex(instrumentText, 'instrument')
      if (midi !== NOTE_EMPTY && midi !== NOTE_OFF && instrument[index] === 0) {
        throw new Error(`row ${row} voice ${VOICE_NAMES[voice]}: note without instrument`)
      }
      if (effectText !== '..') {
        if (!FX_LETTERS.includes(effectText[0]!)) throw new Error(`row ${row}: unknown effect "${effectText}"`)
        effect[index] = effectText.charCodeAt(0)
        effectArg[index] = parseHex(effectText[1]!, 'effect argument')
      }
    })
  })
  for (let voice = 0; voice < VOICE_COUNT; voice++) {
    for (let row = 0; row < steps; row++) {
      const index = row * VOICE_COUNT + voice
      if (note[index] === NOTE_EMPTY || note[index] === NOTE_OFF) continue
      const barEnd = (Math.floor(row / STEPS_PER_BAR) + 1) * STEPS_PER_BAR
      let end = row + 1
      while (end < barEnd && note[end * VOICE_COUNT + voice] === NOTE_EMPTY) end++
      length[index] = end - row
    }
  }
  return { steps, note, instrument, effect, effectArg, length }
}

export function midiToHz(note: number): number {
  return 440 * 2 ** ((note - 69) / 12)
}
