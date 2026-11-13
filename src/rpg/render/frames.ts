import type { SpriteDef } from '../../game/render/atlas.ts'
import type { Rows } from '../sprites/paint.ts'
import { ART } from './art.ts'

export interface Frames {
  readonly rows: Rows[]
  readonly scale: number[]
}

export function frameList(): Frames {
  return { rows: [], scale: [] }
}

function put(list: Frames, scale: number, rows: readonly Rows[]): number {
  const first = list.rows.length
  for (const frame of rows) {
    list.rows.push(frame)
    list.scale.push(scale)
  }
  return first
}

export function native(list: Frames, ...rows: Rows[]): number {
  return put(list, 1, rows)
}

export function legacy(list: Frames, ...rows: Rows[]): number {
  return put(list, ART, rows)
}

export function derive(list: Frames, from: Frames, first: number, count: number, paint: (rows: Rows) => Rows): number {
  const at = list.rows.length
  for (let i = first; i < first + count; i++) put(list, from.scale[i]!, [paint(from.rows[i]!)])
  return at
}

export function simWidth(list: Frames, frame: number): number {
  return (list.rows[frame]![0]!.length * list.scale[frame]!) / ART
}

export function spriteDef(name: string, kind: number, list: Frames): SpriteDef {
  return { name, kind, frames: list.rows, scale: list.scale }
}

export type AddFrames = typeof legacy
