import type { State } from '../sim/state.ts'
import { pumpMusic, updateAudio } from './engine.hot.ts'
import { createRuntime, MASTER_LEVEL } from './runtime.ts'
import type { AudioRuntime } from './runtime.ts'

export interface GameAudio {
  unlock(): void
  setMuted(muted: boolean): void
  setPaused(paused: boolean): void
  update(s: State): void
  dispose(): void
}

const PUMP_INTERVAL_MS = 25
const MUTE_FADE_SECONDS = 0.03

type AudioContextConstructor = new (options?: AudioContextOptions) => AudioContext

function audioContextConstructor(): AudioContextConstructor | undefined {
  if (typeof window === 'undefined') return undefined
  const legacy = window as unknown as { webkitAudioContext?: AudioContextConstructor }
  return window.AudioContext ?? legacy.webkitAudioContext
}

function ignore(): void {}

function primeIosOutput(ctx: AudioContext): void {
  const source = ctx.createBufferSource()
  source.buffer = ctx.createBuffer(1, 1, ctx.sampleRate)
  source.connect(ctx.destination)
  source.start(0)
}

export function createAudio(): GameAudio {
  let rt: AudioRuntime | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let muted = false
  let paused = false

  function applyMute(): void {
    if (!rt) return
    rt.master.gain.setTargetAtTime(muted ? 0 : MASTER_LEVEL, rt.ctx.currentTime, MUTE_FADE_SECONDS)
  }

  function resume(): void {
    if (rt && !paused && rt.ctx.state !== 'running' && rt.ctx.state !== 'closed') rt.ctx.resume().catch(ignore)
  }

  return {
    unlock() {
      if (!rt) {
        const Context = audioContextConstructor()
        if (!Context) return
        let ctx: AudioContext
        try {
          ctx = new Context({ latencyHint: 'interactive' })
        } catch {
          return
        }
        const runtime = createRuntime(ctx)
        rt = runtime
        primeIosOutput(ctx)
        applyMute()
        timer = setInterval(() => pumpMusic(runtime), PUMP_INTERVAL_MS)
        if (paused) ctx.suspend().catch(ignore)
      }
      resume()
    },
    setMuted(next) {
      muted = next
      applyMute()
    },
    setPaused(next) {
      paused = next
      if (!rt) return
      if (paused) rt.ctx.suspend().catch(ignore)
      else resume()
    },
    update(s) {
      if (rt) updateAudio(rt, s)
    },
    dispose() {
      if (timer !== null) clearInterval(timer)
      timer = null
      if (rt) rt.ctx.close().catch(ignore)
      rt = null
    },
  }
}
