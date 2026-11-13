import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { CMD_ADVANCE, CMD_CHOICE, CMD_HORN, CMD_RESPAWN, EV_SAVE, IN_INTERACT, OBJ_FORGE, PHASE_ENDED, PHASE_PLAYING, SCRIPT_ENDS_IN_CHOICE, SCRIPT_LENGTH } from '@/rpg/sim/content.ts'
import { createState } from '@/rpg/sim/state.ts'
import { command } from '@/rpg/sim/step.hot.ts'
import { continueGame, newGame } from '@/rpg/sim/game.ts'
import { serializeProgress } from '@/rpg/sim/progress.ts'
import { createAudio } from '@/rpg/audio/audio.ts'
import type { Renderer } from '@/rpg/render/renderer.ts'
import { pressButton, queueCommand, releaseButton, resetLoop, setLoopRunning, startLoop, stopLoop, type Loop } from '@/rpg/loop.hot.ts'
import { attachMovement } from '@/game/ui/input.ts'
import { keyAction, mouseButtonBit, nextStance } from '@/rpg/ui/controls.ts'
import { INITIAL_SHELL, eventForPhase, shellReduce, type ShellEvent } from '@/rpg/ui/shell.ts'
import { strings } from '@/rpg/ui/i18n.ts'
import { EMPTY_HUD, dialogLine, formatClock, readHud, sameHud, toastFor, type Hud } from '@/rpg/ui/describe.ts'
import { browserStore, cleanHeroName, readSave, writeSave, type SaveData } from '@/rpg/ui/save.ts'
import {
  DeadOverlay,
  EndedOverlay,
  HudText,
  PauseOverlay,
  StoryDialog,
  TitleOverlay,
  Toasts,
  TouchControls,
  TOAST_HOLD_MS,
  type ArtState,
  type EndStats,
  type Toast,
  type TouchHandlers,
} from '@/rpg/ui/Overlays.tsx'
import { MenuOverlay } from '@/rpg/ui/Menu.tsx'
import '@/game/ui/play.css'
import '@/rpg/ui/rpg.css'

const MUTE_STORAGE_KEY = 'shards-fourfold-crown-muted'
const TOAST_MAX = 3
const COMMAND_QUEUE = 16

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

function loadValidSave(): SaveData | null {
  const save = readSave(browserStore(), strings.heroDefault)
  if (!save) return null
  try {
    return continueGame(createState(), 0, save.progress) ? save : null
  } catch {
    return null
  }
}

function isActivatable(element: Element | null): boolean {
  return element instanceof HTMLButtonElement || element instanceof HTMLAnchorElement || element instanceof HTMLInputElement
}

export function Rpg() {
  const [shell, dispatch] = useReducer(shellReduce, INITIAL_SHELL)
  const [version, bump] = useReducer((n: number) => n + 1, 0)
  const [hud, setHud] = useState<Hud>(EMPTY_HUD)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [muted, setMuted] = useState(readMuted)
  const [coarsePointer] = useState(() => window.matchMedia('(pointer: coarse)').matches)
  const [save, setSave] = useState<SaveData | null>(loadValidSave)
  const [saveError, setSaveError] = useState(false)
  const [heroName, setHeroName] = useState(() => save?.name ?? strings.heroDefault)
  const [endStats, setEndStats] = useState<EndStats>({ ending: 0, time: formatClock(0), level: 1 })
  const [art, setArt] = useState<ArtState>('loading')
  const fieldRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const zoneRef = useRef<HTMLDivElement | null>(null)
  const stickRef = useRef<HTMLDivElement | null>(null)
  const knobRef = useRef<HTMLDivElement | null>(null)
  const primaryRef = useRef<HTMLButtonElement | null>(null)
  const loopRef = useRef<Loop | null>(null)
  const heroRef = useRef(heroName)
  const toastCount = useRef(0)

  useEffect(() => {
    heroRef.current = heroName
  }, [heroName])

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
    const zone = zoneRef.current
    const stick = stickRef.current
    const knob = knobRef.current
    if (!field || !canvas || !zone || !stick || !knob) return
    let cancelled = false
    let unmount: (() => void) | null = null
    import('@/rpg/render/renderer.ts')
      .then(({ createRenderer }) => {
        if (cancelled) return
        unmount = mount(createRenderer(canvas), field, zone, stick, knob)
        setArt('ready')
      })
      .catch(() => {
        if (!cancelled) setArt('failed')
      })
    return () => {
      cancelled = true
      unmount?.()
    }
  }, [])

  function mount(renderer: Renderer, field: HTMLDivElement, zone: HTMLDivElement, stick: HTMLDivElement, knob: HTMLDivElement): () => void {
    const audio = createAudio()
    const loop: Loop = {
      s: createState(),
      renderer,
      audio,
      heading: 0,
      held: 0,
      latched: 0,
      stanceSelect: 0,
      commands: new Int32Array(COMMAND_QUEUE),
      commandHead: 0,
      commandTail: 0,
      running: false,
      accumulator: 0,
      lastTime: -1,
      alpha: 0,
      lastPhase: PHASE_PLAYING,
      frameHandle: 0,
      eventCursor: 0,
      frameCount: 0,
      onPhase(phase) {
        const s = loop.s
        if (phase === PHASE_ENDED) setEndStats({ ending: s.ending, time: formatClock(s.tick), level: s.level })
        const event = eventForPhase(phase)
        if (event !== null) dispatch(event)
        bump()
      },
      onEvent(type, a, b) {
        const s = loop.s
        if (type === EV_SAVE) {
          const data = { name: heroRef.current, progress: serializeProgress(s) }
          if (writeSave(browserStore(), data)) setSave(data)
        }
        const text = toastFor(strings, s, type, a, b)
        if (text) {
          toastCount.current++
          const toast = { ...text, id: toastCount.current, born: performance.now() }
          setToasts(list => [...list, toast].slice(-TOAST_MAX))
        }
        bump()
      },
      onCommand() {
        bump()
      },
      onPoll() {
        const next = readHud(loop.s)
        setHud(previous => (sameHud(previous, next) ? previous : next))
      },
    }
    loopRef.current = loop

    const resize = new ResizeObserver(entries => {
      const box = entries[0]?.contentRect
      if (box) renderer.resize(box.width, box.height)
    })
    resize.observe(field)

    const detachMovement = attachMovement(loop, { field: zone, base: stick, knob, radius: () => stick.offsetWidth / 2 })

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
  }

  useEffect(() => {
    const loop = loopRef.current
    if (!loop) return
    setLoopRunning(loop, shell.mode === 'playing')
    if (shell.mode !== 'playing') {
      loop.held = 0
      loop.latched = 0
    }
    loop.audio.setPaused(shell.mode === 'paused' || shell.mode === 'menu')
  }, [shell.mode, art])

  useEffect(() => {
    if (toasts.length === 0) return
    const oldest = toasts[0]!
    const timer = window.setTimeout(
      () => setToasts(list => list.filter(toast => toast.id !== oldest.id)),
      Math.max(0, oldest.born + TOAST_HOLD_MS - performance.now()),
    )
    return () => window.clearTimeout(timer)
  }, [toasts])

  useEffect(() => {
    loopRef.current?.audio.setMuted(muted)
    writeMuted(muted)
  }, [muted, art])

  useEffect(() => {
    const pause = () => {
      if (loopRef.current) loopRef.current.held = 0
      dispatch('pause')
    }
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

  const begin = useCallback((event: ShellEvent, progress: string | null) => {
    const loop = loopRef.current
    if (!loop) return false
    const seed = randomSeed()
    if (progress === null) newGame(loop.s, seed)
    else if (!continueGame(loop.s, seed, progress)) return false
    resetLoop(loop)
    loop.lastPhase = loop.s.phase
    setToasts([])
    setHud(readHud(loop.s))
    bump()
    dispatch(event)
    const phaseEvent = eventForPhase(loop.s.phase)
    if (phaseEvent !== null && phaseEvent !== 'simPlaying') dispatch(phaseEvent)
    return true
  }, [])

  const startNew = useCallback((name: string) => {
    const clean = cleanHeroName(name, strings.heroDefault)
    setHeroName(clean)
    heroRef.current = clean
    setSaveError(false)
    begin('launch', null)
  }, [begin])

  const startContinue = useCallback(() => {
    if (!save) return
    setHeroName(save.name)
    heroRef.current = save.name
    if (!begin('launch', save.progress)) {
      setSave(null)
      setSaveError(true)
    }
  }, [begin, save])

  const send = useCallback((input: number) => {
    const loop = loopRef.current
    if (loop) queueCommand(loop, input)
  }, [])

  const playHorn = useCallback((arg: number) => {
    send(command(CMD_HORN, arg))
    dispatch('closeMenu')
  }, [send])

  const toTitle = useCallback(() => {
    setSave(loadValidSave())
    dispatch('exit')
  }, [])

  const toggleSound = useCallback(() => setMuted(value => !value), [])

  const touch: TouchHandlers = {
    press(bit) {
      const loop = loopRef.current
      if (!loop || shell.mode !== 'playing') return
      if (bit === IN_INTERACT && hud.interact === OBJ_FORGE) dispatch('forge')
      else pressButton(loop, bit)
    },
    release(bit) {
      if (loopRef.current) releaseButton(loopRef.current, bit)
    },
    stance() {
      const loop = loopRef.current
      if (!loop) return
      const element = nextStance(loop.stanceSelect > 0 ? loop.stanceSelect - 1 : loop.s.stance, loop.s.stancesUnlocked)
      if (element >= 0) loop.stanceSelect = element + 1
    },
  }

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const loop = loopRef.current
      if (!loop || e.target instanceof HTMLInputElement) return
      const action = keyAction(e.code)
      const mode = shell.mode
      if (mode === 'playing') {
        if (!action) return
        e.preventDefault()
        if (e.repeat) return
        if (action.kind === 'button') {
          if (action.bit === IN_INTERACT && hud.interact === OBJ_FORGE) dispatch('forge')
          else pressButton(loop, action.bit)
        } else if (action.kind === 'stance') {
          loop.stanceSelect = action.element + 1
        } else if (action.action !== 'advance') {
          dispatch(action.action)
        }
        return
      }
      if (mode === 'menu') {
        if (action?.kind !== 'ui' || action.action === 'advance') return
        dispatch(action.action === 'pause' || action.action === shell.tab ? 'closeMenu' : action.action)
        return
      }
      if (mode === 'paused' && action?.kind === 'ui' && action.action === 'pause') {
        dispatch('resume')
        return
      }
      if ((e.code === 'Enter' || e.code === 'Space') && !e.repeat && !isActivatable(document.activeElement)) {
        e.preventDefault()
        primaryRef.current?.click()
      }
    }
    const onUp = (e: KeyboardEvent) => {
      const action = keyAction(e.code)
      if (action?.kind === 'button' && loopRef.current) releaseButton(loopRef.current, action.bit)
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [shell, hud.interact])

  useEffect(() => {
    const field = fieldRef.current
    if (!field) return
    const onDown = (e: PointerEvent) => {
      const loop = loopRef.current
      const bit = e.pointerType === 'mouse' ? mouseButtonBit(e.button) : 0
      if (!loop || bit === 0 || shell.mode !== 'playing') return
      e.preventDefault()
      pressButton(loop, bit)
    }
    const onUp = (e: PointerEvent) => {
      const bit = e.pointerType === 'mouse' ? mouseButtonBit(e.button) : 0
      if (bit !== 0 && loopRef.current) releaseButton(loopRef.current, bit)
    }
    const onMenu = (e: MouseEvent) => e.preventDefault()
    field.addEventListener('pointerdown', onDown)
    field.addEventListener('contextmenu', onMenu)
    window.addEventListener('pointerup', onUp)
    return () => {
      field.removeEventListener('pointerdown', onDown)
      field.removeEventListener('contextmenu', onMenu)
      window.removeEventListener('pointerup', onUp)
    }
  }, [shell.mode])

  const loop = loopRef.current
  const s = loop?.s ?? null
  const renderer = loop?.renderer ?? null
  const inGame = shell.mode !== 'title'
  const keys = coarsePointer ? strings.keysTouch : strings.keysDesktop
  const line = shell.mode === 'dialog' && s ? dialogLine(strings, s.dialogScript, s.dialogLine, heroName, keys) : null
  const choiceLine = s !== null && SCRIPT_ENDS_IN_CHOICE[s.dialogScript] === 1 && s.dialogLine === (SCRIPT_LENGTH[s.dialogScript] ?? 0) - 1

  return (
    <div className="play rpg" data-shell={shell.mode} data-touch={coarsePointer || undefined}>
      <div className="play-field" ref={fieldRef}>
        <canvas className="play-canvas" ref={canvasRef} role="img" aria-label={strings.canvasLabel} />
        <div className="rpg-stick-zone" ref={zoneRef} data-stick="idle">
          <div className="play-stick" ref={stickRef} aria-hidden="true" />
          <div className="play-knob" ref={knobRef} aria-hidden="true" />
        </div>
      </div>
      {(shell.mode === 'playing' || shell.mode === 'dialog') && <HudText hud={hud} coarsePointer={coarsePointer} showPrompt={shell.mode === 'playing'} />}
      {inGame && <Toasts toasts={toasts} renderer={renderer} />}
      {shell.mode === 'playing' && coarsePointer && <TouchControls hud={hud} renderer={renderer} handlers={touch} />}
      {(shell.mode === 'playing' || shell.mode === 'dialog') && (
        <div className="play-hud rpg-hud">
          <button type="button" className="play-hud-btn rpg-hud-btn--menu" aria-label={strings.menu} disabled={shell.mode !== 'playing'} onClick={() => dispatch('gear')} />
          <button type="button" className="play-hud-btn play-hud-btn--pause" aria-label={strings.pause} disabled={shell.mode !== 'playing'} onClick={() => dispatch('pause')} />
          <button
            type="button"
            className="play-hud-btn play-hud-btn--sound"
            data-muted={muted || undefined}
            aria-label={muted ? strings.mute : strings.unmute}
            onClick={toggleSound}
          />
        </div>
      )}
      {shell.mode === 'title' && (
        <TitleOverlay
          primaryRef={primaryRef}
          coarsePointer={coarsePointer}
          muted={muted}
          heroName={heroName}
          canContinue={save !== null}
          saveError={saveError}
          art={art}
          onRetryArt={() => window.location.reload()}
          onNewGame={startNew}
          onContinue={startContinue}
          onToggleSound={toggleSound}
        />
      )}
      {line && (
        <StoryDialog
          key={`${s?.dialogScript}-${s?.dialogLine}`}
          primaryRef={primaryRef}
          speaker={line.speaker}
          text={line.text}
          choice={choiceLine}
          onAdvance={() => send(command(CMD_ADVANCE, 0))}
          onChoose={index => send(command(CMD_CHOICE, index))}
        />
      )}
      {shell.mode === 'menu' && s && (
        <MenuOverlay
          s={s}
          tab={shell.tab}
          version={version}
          renderer={renderer}
          onTab={tab => dispatch(tab)}
          onClose={() => dispatch('closeMenu')}
          send={send}
          onHorn={playHorn}
        />
      )}
      {shell.mode === 'paused' && (
        <PauseOverlay primaryRef={primaryRef} muted={muted} onResume={() => dispatch('resume')} onToggleSound={toggleSound} onTitle={toTitle} />
      )}
      {shell.mode === 'dead' && <DeadOverlay primaryRef={primaryRef} onRespawn={() => send(command(CMD_RESPAWN, 0))} onTitle={toTitle} />}
      {shell.mode === 'ended' && <EndedOverlay primaryRef={primaryRef} stats={endStats} onNewGame={() => begin('relaunch', null)} />}
    </div>
  )
}
