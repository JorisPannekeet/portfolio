import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { INPUT_CHOICE, INPUT_IDLE, PHASE_PLAYING, RUN_TICKS, TICK_HZ } from '@/game/sim/content.ts'
import { createState, resetState } from '@/game/sim/state.ts'
import { createRenderer } from '@/game/render/renderer.ts'
import { createAudio } from '@/game/audio/audio.ts'
import { NO_PENDING_INPUT, setLoopActive, startLoop, stopLoop, type Loop } from '@/game/loop.hot.ts'
import { describeChoice, formatClock, parseSeed, type Card } from '@/game/ui/cards.ts'
import { eventForPhase, shellReduce, type ShellEvent } from '@/game/ui/shell.ts'
import { attachMovement } from '@/game/ui/input.ts'
import { strings } from '@/game/ui/i18n.ts'
import { EndOverlay, LevelUpOverlay, PauseOverlay, TitleOverlay, type RunStats } from '@/game/ui/Overlays.tsx'
import '@/game/ui/play.css'

const MUTE_STORAGE_KEY = 'last-sortie-muted'
const INPUT_LOG_SLACK = 4096

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, muted ? '1' : '0')
  } catch {
    return
  }
}

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]!
}

function isActivatable(element: Element | null): boolean {
  return element instanceof HTMLButtonElement || element instanceof HTMLAnchorElement
}

export function Play() {
  const [shell, dispatch] = useReducer(shellReduce, 'title')
  const [cards, setCards] = useState<Card[]>([])
  const [stats, setStats] = useState<RunStats>({ time: formatClock(0, TICK_HZ), kills: 0, level: 1, seed: 0 })
  const [muted, setMuted] = useState(readMuted)
  const [coarsePointer] = useState(() => window.matchMedia('(pointer: coarse)').matches)
  const fieldRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stickRef = useRef<HTMLDivElement | null>(null)
  const knobRef = useRef<HTMLDivElement | null>(null)
  const primaryRef = useRef<HTMLButtonElement | null>(null)
  const loopRef = useRef<Loop | null>(null)

  useEffect(() => {
    const previousTitle = document.title
    const previousOverflow = document.body.style.overflow
    document.title = strings.title
    document.body.style.overflow = 'hidden'
    return () => {
      document.title = previousTitle
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    const field = fieldRef.current
    const canvas = canvasRef.current
    const stick = stickRef.current
    const knob = knobRef.current
    if (!field || !canvas || !stick || !knob) return
    const renderer = createRenderer(canvas)
    const audio = createAudio()
    const loop: Loop = {
      s: createState(),
      renderer,
      audio,
      inputLog: new Uint8Array(RUN_TICKS + INPUT_LOG_SLACK),
      inputLogLength: 0,
      heading: INPUT_IDLE,
      pendingInput: NO_PENDING_INPUT,
      active: false,
      accumulator: 0,
      lastTime: -1,
      alpha: 0,
      lastPhase: PHASE_PLAYING,
      frameHandle: 0,
      onPhase(phase) {
        const s = loop.s
        const event = eventForPhase(phase)
        if (event === 'levelUp') {
          const next: Card[] = []
          for (let i = 0; i < s.choiceCount; i++) next.push(describeChoice(s.choices[i]!, s.weaponLevel, s.passiveLevel, strings))
          setCards(next)
        } else if (event !== null) {
          setStats({ time: formatClock(s.tick, TICK_HZ), kills: s.kills, level: s.level, seed: s.seed })
        }
        if (event !== null) dispatch(event)
      },
    }
    loopRef.current = loop

    const resize = new ResizeObserver(entries => {
      const box = entries[0]?.contentRect
      if (box) renderer.resize(box.width, box.height)
    })
    resize.observe(field)

    const detachMovement = attachMovement(loop, { field, base: stick, knob, radius: () => stick.offsetWidth / 2 })

    const unlock = () => {
      audio.unlock()
      window.removeEventListener('pointerdown', unlock, true)
      window.removeEventListener('keydown', unlock, true)
    }
    window.addEventListener('pointerdown', unlock, true)
    window.addEventListener('keydown', unlock, true)

    startLoop(loop)
    return () => {
      stopLoop()
      resize.disconnect()
      detachMovement()
      window.removeEventListener('pointerdown', unlock, true)
      window.removeEventListener('keydown', unlock, true)
      audio.dispose()
      loopRef.current = null
    }
  }, [])

  useEffect(() => {
    const loop = loopRef.current
    if (!loop) return
    setLoopActive(loop, shell === 'playing')
    loop.audio.setPaused(shell === 'paused' || shell === 'title')
  }, [shell])

  useEffect(() => {
    loopRef.current?.audio.setMuted(muted)
    writeMuted(muted)
  }, [muted])

  useEffect(() => {
    const pause = () => dispatch('pause')
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') pause()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', pause)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', pause)
    }
  }, [])

  const start = useCallback((event: ShellEvent) => {
    const loop = loopRef.current
    if (!loop) return
    resetState(loop.s, parseSeed(window.location.search) ?? randomSeed())
    loop.inputLogLength = 0
    loop.pendingInput = NO_PENDING_INPUT
    loop.lastPhase = PHASE_PLAYING
    dispatch(event)
  }, [])

  const pick = useCallback((index: number) => {
    const loop = loopRef.current
    if (!loop || index >= cards.length) return
    loop.pendingInput = INPUT_CHOICE + index
    dispatch('pick')
  }, [cards.length])

  const toggleSound = useCallback(() => setMuted(value => !value), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'Escape' || e.code === 'KeyP') {
        dispatch(shell === 'paused' ? 'resume' : 'pause')
        return
      }
      if (shell === 'levelUp') {
        const index = ['Digit1', 'Digit2', 'Digit3'].indexOf(e.code.replace('Numpad', 'Digit'))
        if (index >= 0) {
          e.preventDefault()
          pick(index)
          return
        }
      }
      if ((e.code === 'Enter' || e.code === 'Space') && shell !== 'playing' && !isActivatable(document.activeElement)) {
        e.preventDefault()
        primaryRef.current?.click()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shell, pick])

  const inRun = shell === 'playing' || shell === 'paused' || shell === 'levelUp'

  return (
    <div className="play" data-shell={shell}>
      <div className="play-field" ref={fieldRef} data-stick="idle">
        <canvas className="play-canvas" ref={canvasRef} role="img" aria-label={strings.canvasLabel} />
        <div className="play-stick" ref={stickRef} aria-hidden="true" />
        <div className="play-knob" ref={knobRef} aria-hidden="true" />
      </div>
      {inRun && (
        <div className="play-hud">
          <button type="button" className="play-hud-btn play-hud-btn--pause" aria-label={strings.pause} onClick={() => dispatch('pause')} />
          <button
            type="button"
            className="play-hud-btn play-hud-btn--sound"
            data-muted={muted || undefined}
            aria-label={muted ? strings.mute : strings.unmute}
            onClick={toggleSound}
          />
        </div>
      )}
      {shell === 'title' && (
        <TitleOverlay primaryRef={primaryRef} coarsePointer={coarsePointer} muted={muted} onLaunch={() => start('launch')} onToggleSound={toggleSound} />
      )}
      {shell === 'paused' && (
        <PauseOverlay primaryRef={primaryRef} muted={muted} onResume={() => dispatch('resume')} onToggleSound={toggleSound} />
      )}
      {shell === 'levelUp' && (
        <LevelUpOverlay primaryRef={primaryRef} cards={cards} renderer={loopRef.current?.renderer ?? null} onPick={pick} />
      )}
      {(shell === 'dead' || shell === 'won') && (
        <EndOverlay primaryRef={primaryRef} won={shell === 'won'} stats={stats} onRelaunch={() => start('relaunch')} />
      )}
    </div>
  )
}
