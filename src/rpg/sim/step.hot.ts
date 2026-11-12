import { COMMAND_ARG_MASK, COMMAND_OPCODE_MASK, COMMAND_OPCODE_SHIFT, IN_COMMAND, PHASE_PLAYING } from './content.ts'
import type { State } from './state.ts'
import { applyCommand } from './commands.hot.ts'
import { updateWorld } from './world.hot.ts'
import { updatePlayer } from './player.hot.ts'
import { updateEnemies } from './enemies.hot.ts'
import { updateProjectiles } from './projectiles.hot.ts'
import { updateStory } from './story.hot.ts'

export function step(s: State, input: number): void {
  if ((input & IN_COMMAND) !== 0) {
    applyCommand(s, (input >> COMMAND_OPCODE_SHIFT) & COMMAND_OPCODE_MASK, input & COMMAND_ARG_MASK)
    s.prevInput = 0
    return
  }
  if (s.phase !== PHASE_PLAYING) {
    s.prevInput = input
    return
  }
  updateWorld(s, input)
  updatePlayer(s, input)
  updateEnemies(s)
  updateProjectiles(s)
  updateStory(s)
  s.prevInput = input
  s.tick++
  s.areaTick++
}

export function command(opcode: number, arg: number): number {
  return IN_COMMAND | (opcode << COMMAND_OPCODE_SHIFT) | (arg & COMMAND_ARG_MASK)
}
