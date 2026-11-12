import type { State } from './state.ts'

const FNV_OFFSET = 0x811c9dc5
const FNV_PRIME = 0x01000193
const SCRATCH_PREFIX = 'scratch'

const numberScratch = new Float64Array(1)
const numberBytes = new Uint8Array(numberScratch.buffer)

function mixBytes(hash: number, bytes: Uint8Array): number {
  let h = hash
  for (let i = 0; i < bytes.length; i++) h = Math.imul(h ^ bytes[i]!, FNV_PRIME)
  return h
}

export function hashState(s: State): number {
  const fields = s as unknown as Record<string, unknown>
  let h = FNV_OFFSET
  for (const key of Object.keys(fields).sort()) {
    if (key.startsWith(SCRATCH_PREFIX)) continue
    const value = fields[key]
    if (typeof value === 'number') {
      numberScratch[0] = value
      h = mixBytes(h, numberBytes)
    } else if (ArrayBuffer.isView(value)) {
      h = mixBytes(h, new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
    }
  }
  return h >>> 0
}
