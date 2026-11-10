import { GAME_VERSION } from './content.ts'
import { createState, resetState, type State } from './state.ts'
import { step } from './step.hot.ts'

export interface RunRecord {
  readonly version: number
  readonly seed: number
  readonly inputs: readonly number[]
}

export function encodeInputs(inputs: ArrayLike<number>): number[] {
  const encoded: number[] = []
  let i = 0
  while (i < inputs.length) {
    const value = inputs[i]!
    let run = 1
    while (i + run < inputs.length && inputs[i + run] === value) run++
    encoded.push(value, run)
    i += run
  }
  return encoded
}

export function decodeInputs(encoded: readonly number[]): Uint8Array {
  if (encoded.length % 2 !== 0) throw new Error('Run-length input stream has an odd length.')
  let total = 0
  for (let k = 1; k < encoded.length; k += 2) {
    const run = encoded[k]!
    if (!Number.isInteger(run) || run < 1) throw new Error('Run-length input stream has an invalid run.')
    total += run
  }
  const inputs = new Uint8Array(total)
  let at = 0
  for (let k = 0; k < encoded.length; k += 2) {
    const value = encoded[k]!
    const run = encoded[k + 1]!
    inputs.fill(value, at, at + run)
    at += run
  }
  return inputs
}

export function createRecord(seed: number, inputs: ArrayLike<number>): RunRecord {
  return { version: GAME_VERSION, seed: seed >>> 0, inputs: encodeInputs(inputs) }
}

export function replay(record: RunRecord): State {
  if (record.version !== GAME_VERSION) throw new Error('Run record version does not match this build.')
  const s = createState()
  resetState(s, record.seed)
  const inputs = decodeInputs(record.inputs)
  for (let i = 0; i < inputs.length; i++) step(s, inputs[i]!)
  return s
}
