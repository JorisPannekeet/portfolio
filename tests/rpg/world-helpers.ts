import { CMD_ADVANCE, MAX_OBJECTS, PHASE_DIALOG, TILE } from '../../src/rpg/sim/content.ts'
import { AREAS } from '../../src/rpg/sim/areas.ts'
import { applyCommand } from '../../src/rpg/sim/commands.hot.ts'
import { newGame } from '../../src/rpg/sim/game.ts'
import { createState, type State } from '../../src/rpg/sim/state.ts'
import { updateWorld } from '../../src/rpg/sim/world.hot.ts'

export function finishDialog(s: State): void {
  for (let n = 0; s.phase === PHASE_DIALOG && n < 200; n++) applyCommand(s, CMD_ADVANCE, 0)
}

export function freshGame(seed = 1): State {
  const s = createState()
  newGame(s, seed)
  finishDialog(s)
  return s
}

export function charTiles(area: number, ch: string): [number, number][] {
  const out: [number, number][] = []
  const rows = AREAS[area]!.def.rows
  for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y]!.length; x++) if (rows[y]![x] === ch) out.push([x, y])
  return out
}

export function charCenter(area: number, ch: string): [number, number] {
  const tiles = charTiles(area, ch)
  if (tiles.length === 0) throw new Error('char ' + ch + ' not on map ' + area)
  return [(tiles[0]![0] + 0.5) * TILE, (tiles[0]![1] + 0.5) * TILE]
}

export function objectsOf(s: State, kind: number, arg = -9999): number[] {
  const out: number[] = []
  for (let i = 0; i < MAX_OBJECTS; i++) if (s.objKind[i] === kind && (arg === -9999 || s.objArg[i] === arg)) out.push(i)
  return out
}

export function standAt(s: State, x: number, y: number): void {
  s.playerX = x
  s.playerY = y
  s.playerPrevX = x
  s.playerPrevY = y
}

export function worldTick(s: State, input: number): void {
  updateWorld(s, input)
  s.prevInput = input
}

export function tileIndexAt(s: State, x: number, y: number): number {
  return Math.floor(y / TILE) * s.mapW + Math.floor(x / TILE)
}
