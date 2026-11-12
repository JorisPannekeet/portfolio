import { EVENT_CAP, PHASE_PLAYING, TICK_HZ } from './sim/content.ts'
import type { State } from './sim/state.ts'
import { step } from './sim/step.hot.ts'
import type { Renderer } from './render/renderer.ts'
import type { GameAudio } from './audio/audio.ts'
import { UI_EVENT_MASK, encodeInput } from './ui/controls.ts'

export const TICK_MS = 1000 / TICK_HZ
export const MAX_STEPS_PER_FRAME = 5
export const POLL_FRAMES = 6

export interface Loop {
  s: State
  renderer: Renderer
  audio: GameAudio
  heading: number
  held: number
  latched: number
  stanceSelect: number
  commands: Int32Array
  commandHead: number
  commandTail: number
  running: boolean
  accumulator: number
  lastTime: number
  alpha: number
  lastPhase: number
  frameHandle: number
  eventCursor: number
  frameCount: number
  onPhase: (phase: number) => void
  onEvent: (type: number, a: number, b: number) => void
  onCommand: () => void
  onPoll: () => void
}

let current: Loop | null = null

export function startLoop(loop: Loop): void {
  stopLoop()
  current = loop
  loop.lastTime = -1
  loop.frameHandle = requestAnimationFrame(frame)
}

export function stopLoop(): void {
  if (current !== null) cancelAnimationFrame(current.frameHandle)
  current = null
}

export function setLoopRunning(loop: Loop, running: boolean): void {
  loop.running = running
  loop.accumulator = 0
}

export function queueCommand(loop: Loop, input: number): void {
  if (loop.commandTail - loop.commandHead >= loop.commands.length) return
  loop.commands[loop.commandTail % loop.commands.length] = input
  loop.commandTail++
}

export function pressButton(loop: Loop, bit: number): void {
  loop.held |= bit
  loop.latched |= bit
}

export function releaseButton(loop: Loop, bit: number): void {
  loop.held &= ~bit
}

export function resetLoop(loop: Loop): void {
  loop.held = 0
  loop.latched = 0
  loop.stanceSelect = 0
  loop.commandHead = 0
  loop.commandTail = 0
  loop.accumulator = 0
  loop.lastPhase = PHASE_PLAYING
  loop.eventCursor = 0
}

function deliverCommands(loop: Loop): void {
  if (loop.commandHead === loop.commandTail) return
  while (loop.commandHead < loop.commandTail) {
    step(loop.s, loop.commands[loop.commandHead % loop.commands.length]!)
    loop.commandHead++
  }
  loop.commandHead = 0
  loop.commandTail = 0
  loop.onCommand()
}

function tick(loop: Loop): void {
  const input = encodeInput(loop.heading, loop.held | loop.latched, loop.stanceSelect)
  loop.latched = 0
  loop.stanceSelect = 0
  step(loop.s, input)
}

function readEvents(loop: Loop): void {
  const s = loop.s
  if (s.evHead < loop.eventCursor) loop.eventCursor = 0
  if (s.evHead - loop.eventCursor > EVENT_CAP) loop.eventCursor = s.evHead - EVENT_CAP
  while (loop.eventCursor < s.evHead) {
    const slot = loop.eventCursor % EVENT_CAP
    const type = s.evType[slot]!
    loop.eventCursor++
    if (UI_EVENT_MASK[type] === 1) loop.onEvent(type, s.evA[slot]!, s.evB[slot]!)
  }
}

function frame(now: number): void {
  const loop = current
  if (loop === null) return
  loop.frameHandle = requestAnimationFrame(frame)
  const elapsed = loop.lastTime < 0 ? 0 : now - loop.lastTime
  loop.lastTime = now
  deliverCommands(loop)
  if (loop.running) {
    loop.accumulator += elapsed
    let steps = 0
    while (loop.running && loop.s.phase === PHASE_PLAYING && loop.accumulator >= TICK_MS && steps < MAX_STEPS_PER_FRAME) {
      tick(loop)
      loop.accumulator -= TICK_MS
      steps++
    }
    if (loop.s.phase !== PHASE_PLAYING || loop.accumulator >= TICK_MS) loop.accumulator = 0
    loop.alpha = loop.accumulator / TICK_MS
  }
  if (loop.s.phase !== loop.lastPhase) {
    loop.lastPhase = loop.s.phase
    if (loop.s.phase !== PHASE_PLAYING) loop.running = false
    loop.onPhase(loop.s.phase)
  }
  readEvents(loop)
  loop.frameCount++
  if (loop.frameCount % POLL_FRAMES === 0) loop.onPoll()
  loop.renderer.draw(loop.s, loop.alpha)
  loop.audio.update(loop.s)
}
