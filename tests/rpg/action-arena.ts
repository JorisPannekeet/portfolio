import { AREA_SHRINE, CMD_ADVANCE, PHASE_DIALOG, PHASE_PLAYING, TILE, TILE_FLOOR } from '../../src/rpg/sim/content.ts'
import { combatBotInput } from '../../src/rpg/sim/bot-combat.hot.ts'
import { spawnEnemy } from '../../src/rpg/sim/enemies.hot.ts'
import { createState, type State } from '../../src/rpg/sim/state.ts'
import { command, step } from '../../src/rpg/sim/step.hot.ts'
import { seedRng } from '../../src/game/sim/prng.hot.ts'

export const ARENA_W = 40
export const ARENA_H = 30

export function arena(seed: number): State {
  const s = createState()
  s.seed = seed >>> 0
  seedRng(s)
  s.area = AREA_SHRINE
  s.mapW = ARENA_W
  s.mapH = ARENA_H
  s.tiles.fill(TILE_FLOOR, 0, ARENA_W * ARENA_H)
  s.playerX = (ARENA_W * TILE) / 2
  s.playerY = (ARENA_H * TILE) / 2
  s.playerPrevX = s.playerX
  s.playerPrevY = s.playerY
  s.phase = PHASE_PLAYING
  return s
}

export function tick(s: State, input: number): void {
  if (s.phase === PHASE_DIALOG) step(s, command(CMD_ADVANCE, 0))
  else step(s, input)
}

export function run(s: State, input: number, ticks: number): void {
  for (let k = 0; k < ticks; k++) tick(s, input)
}

export function spawnNear(s: State, kind: number, dx: number, dy: number, elite = 0): number {
  return spawnEnemy(s, kind, s.playerX + dx, s.playerY + dy, elite, -1)
}

export function events(s: State, type: number, since: number): number[] {
  const found: number[] = []
  for (let e = since; e < s.evHead; e++) {
    const slot = e % s.evType.length
    if (s.evType[slot] === type) found.push(e)
  }
  return found
}

export interface Duel {
  won: boolean
  ticks: number
  hp: number
}

export function duel(seed: number, kind: number, attack: number, maxTicks: number): Duel {
  const s = arena(seed)
  s.stancesUnlocked = 15
  s.statAttack = attack
  const boss = spawnNear(s, kind, 90, 0)
  let ticks = 0
  while (ticks < maxTicks && s.eAlive[boss] === 1 && s.phase !== 2) {
    tick(s, combatBotInput(s))
    ticks++
  }
  return { won: s.eAlive[boss] === 0, ticks, hp: s.hp }
}
