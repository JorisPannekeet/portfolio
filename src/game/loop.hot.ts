import { INPUT_CHOICE, PHASE_PLAYING, TICK_HZ } from './sim/content.ts'
import type { State } from './sim/state.ts'
import { step } from './sim/step.hot.ts'
import type { Renderer } from './render/renderer.ts'
import type { GameAudio } from './audio/audio.ts'

export const TICK_MS = 1000 / TICK_HZ
export const MAX_STEPS_PER_FRAME = 5
export const NO_PENDING_INPUT = -1

export interface Loop {
  s: State
  renderer: Renderer
  audio: GameAudio
  inputLog: Uint8Array
  inputLogLength: number
  heading: number
  pendingInput: number
  active: boolean
  accumulator: number
  lastTime: number
  alpha: number
  lastPhase: number
  frameHandle: number
  onPhase: (phase: number) => void
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

export function setLoopActive(loop: Loop, active: boolean): void {
  loop.active = active
  loop.accumulator = 0
}

function stepOnce(loop: Loop): void {
  const s = loop.s
  const input = loop.pendingInput === NO_PENDING_INPUT ? loop.heading : loop.pendingInput
  loop.pendingInput = NO_PENDING_INPUT
  if (loop.inputLogLength < loop.inputLog.length) {
    loop.inputLog[loop.inputLogLength] = input
    loop.inputLogLength++
  }
  step(s, input)
  if (s.phase !== loop.lastPhase || input >= INPUT_CHOICE) {
    loop.lastPhase = s.phase
    if (s.phase !== PHASE_PLAYING) loop.active = false
    loop.onPhase(s.phase)
  }
}

function frame(now: number): void {
  const loop = current
  if (loop === null) return
  loop.frameHandle = requestAnimationFrame(frame)
  const elapsed = loop.lastTime < 0 ? 0 : now - loop.lastTime
  loop.lastTime = now
  if (loop.active) {
    loop.accumulator += elapsed
    let steps = 0
    while (loop.active && loop.accumulator >= TICK_MS && steps < MAX_STEPS_PER_FRAME) {
      stepOnce(loop)
      loop.accumulator -= TICK_MS
      steps++
    }
    if (!loop.active || loop.accumulator >= TICK_MS) loop.accumulator = 0
    loop.alpha = loop.accumulator / TICK_MS
  }
  loop.renderer.draw(loop.s, loop.alpha)
  loop.audio.update(loop.s)
}
