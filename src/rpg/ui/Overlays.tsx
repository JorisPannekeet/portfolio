import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type MutableRefObject, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Renderer } from '../render/renderer.ts'
import { IN_ATTACK, IN_DODGE, IN_GUARD, IN_INTERACT, IN_LOCK, IN_SKILL, OBJ_FORGE } from '../sim/content.ts'
import { HERO_NAME_MAX } from './save.ts'
import { strings } from './i18n.ts'
import { SKILL_CHARGE_STEPS, bossTitle, interactPrompt, type Hud, type ToastText } from './describe.ts'

export type PrimaryRef = MutableRefObject<HTMLButtonElement | null>

export function Modal({ labelId, primaryRef, variant, children }: {
  labelId: string
  primaryRef: PrimaryRef
  variant: string
  children: ReactNode
}) {
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    primaryRef.current?.focus()
    return () => previous?.focus()
  }, [primaryRef])
  return (
    <div className="play-overlay" role="dialog" aria-modal="true" aria-labelledby={labelId}>
      <div className={`play-panel rpg-panel rpg-panel--${variant}`}>{children}</div>
    </div>
  )
}

export function SoundToggle({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="btn btn--frame play-btn" onClick={onToggle}>
      {muted ? strings.mute : strings.unmute}
    </button>
  )
}

function ExitLink() {
  return (
    <Link to="/" className="btn btn--frame play-btn">
      {strings.exit}
    </Link>
  )
}

export function ItemIcon({ renderer, base, tier, className }: { renderer: Renderer | null; base: number; tier: number; className: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx || !renderer) return
    ctx.clearRect(0, 0, 16, 16)
    if (base >= 0) renderer.drawItemIcon(ctx, base, tier, 0, 0, 1)
  }, [renderer, base, tier])
  return <canvas ref={ref} className={className} width={16} height={16} aria-hidden="true" />
}

export function ElementIcon({ renderer, element, className }: { renderer: Renderer | null; element: number; className: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx || !renderer) return
    ctx.clearRect(0, 0, 16, 16)
    if (element >= 0) renderer.drawElementIcon(ctx, element, 0, 0, 1)
  }, [renderer, element])
  return <canvas ref={ref} className={className} width={16} height={16} aria-hidden="true" />
}

export function TitleOverlay({ primaryRef, coarsePointer, muted, heroName, canContinue, saveError, onNewGame, onContinue, onToggleSound }: {
  primaryRef: PrimaryRef
  coarsePointer: boolean
  muted: boolean
  heroName: string
  canContinue: boolean
  saveError: boolean
  onNewGame: (name: string) => void
  onContinue: () => void
  onToggleSound: () => void
}) {
  const [name, setName] = useState(heroName)
  const newGameRef = useRef<HTMLButtonElement | null>(null)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onNewGame(name)
  }
  return (
    <Modal labelId="rpg-title-heading" primaryRef={canContinue ? primaryRef : newGameRef} variant="title">
      <span className="play-decal">{strings.decal}</span>
      <h1 id="rpg-title-heading" className="play-title rpg-title">{strings.title}</h1>
      <p className="play-tagline">{strings.premise}</p>
      <form className="rpg-form" onSubmit={submit}>
        <label className="rpg-field">
          <span className="rpg-field-label">{strings.heroLabel}</span>
          <input
            className="rpg-input"
            value={name}
            maxLength={HERO_NAME_MAX}
            autoComplete="off"
            spellCheck={false}
            placeholder={strings.heroDefault}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.stopPropagation()}
          />
        </label>
        {saveError && <p className="rpg-error" role="alert">{strings.saveBroken}</p>}
        <p className="play-hint">{coarsePointer ? strings.controlsTouch : strings.controlsDesktop}</p>
        <div className="play-actions">
          {canContinue && (
            <button ref={primaryRef} type="button" className="btn btn--primary play-btn" onClick={onContinue}>
              {strings.continueGame}
            </button>
          )}
          <button ref={newGameRef} type="submit" className={`btn ${canContinue ? 'btn--frame' : 'btn--primary'} play-btn`}>
            {strings.newGame}
          </button>
          <SoundToggle muted={muted} onToggle={onToggleSound} />
          <ExitLink />
        </div>
      </form>
    </Modal>
  )
}

export function PauseOverlay({ primaryRef, muted, onResume, onToggleSound, onTitle }: {
  primaryRef: PrimaryRef
  muted: boolean
  onResume: () => void
  onToggleSound: () => void
  onTitle: () => void
}) {
  return (
    <Modal labelId="rpg-pause-heading" primaryRef={primaryRef} variant="pause">
      <h2 id="rpg-pause-heading" className="play-heading">{strings.paused}</h2>
      <div className="play-actions">
        <button ref={primaryRef} type="button" className="btn btn--primary play-btn" onClick={onResume}>
          {strings.resume}
        </button>
        <SoundToggle muted={muted} onToggle={onToggleSound} />
        <button type="button" className="btn btn--frame play-btn" onClick={onTitle}>
          {strings.toTitle}
        </button>
        <ExitLink />
      </div>
    </Modal>
  )
}

export function DeadOverlay({ primaryRef, onRespawn, onTitle }: { primaryRef: PrimaryRef; onRespawn: () => void; onTitle: () => void }) {
  return (
    <Modal labelId="rpg-dead-heading" primaryRef={primaryRef} variant="dead">
      <h2 id="rpg-dead-heading" className="play-heading">{strings.dead}</h2>
      <p className="play-tagline">{strings.deadHint}</p>
      <div className="play-actions">
        <button ref={primaryRef} type="button" className="btn btn--primary play-btn" onClick={onRespawn}>
          {strings.respawn}
        </button>
        <button type="button" className="btn btn--frame play-btn" onClick={onTitle}>
          {strings.toTitle}
        </button>
      </div>
    </Modal>
  )
}

export interface EndStats {
  ending: number
  time: string
  level: number
}

export function EndedOverlay({ primaryRef, stats, onNewGame }: { primaryRef: PrimaryRef; stats: EndStats; onNewGame: () => void }) {
  return (
    <Modal labelId="rpg-end-heading" primaryRef={primaryRef} variant="ended">
      <span className="play-decal">{strings.ended}</span>
      <h2 id="rpg-end-heading" className="play-heading">{strings.endingName[stats.ending] ?? strings.ended}</h2>
      <dl className="play-stats">
        <div><dt>{strings.statTime}</dt><dd>{stats.time}</dd></div>
        <div><dt>{strings.statLevel}</dt><dd>{stats.level}</dd></div>
      </dl>
      <div className="play-actions">
        <button ref={primaryRef} type="button" className="btn btn--primary play-btn" onClick={onNewGame}>
          {strings.playAgain}
        </button>
        <ExitLink />
      </div>
    </Modal>
  )
}

const CHOICE_ARM_MS = 600

export function StoryDialog({ primaryRef, speaker, text, choice, onAdvance, onChoose }: {
  primaryRef: PrimaryRef
  speaker: string
  text: string
  choice: boolean
  onAdvance: () => void
  onChoose: (index: number) => void
}) {
  const [armed, setArmed] = useState(!choice)
  useEffect(() => {
    if (!choice) return
    const timer = window.setTimeout(() => setArmed(true), CHOICE_ARM_MS)
    return () => window.clearTimeout(timer)
  }, [choice])
  const textRef = useRef<HTMLParagraphElement | null>(null)
  useEffect(() => {
    if (choice) textRef.current?.focus()
    else primaryRef.current?.focus()
  }, [primaryRef, choice])
  return (
    <div className="rpg-dialog" role="dialog" aria-modal="true" aria-labelledby="rpg-dialog-speaker" aria-describedby="rpg-dialog-text">
      <div className="rpg-dialog-panel" onClick={choice ? undefined : onAdvance}>
        <p id="rpg-dialog-speaker" className="rpg-dialog-speaker">{speaker}</p>
        <p id="rpg-dialog-text" ref={textRef} tabIndex={-1} className="rpg-dialog-text" aria-live="polite">{text}</p>
        {choice ? (
          <div className="rpg-choices">
            {strings.choice.map((label, index) => (
              <button
                key={label}
                type="button"
                className="rpg-choice"
                disabled={!armed}
                onClick={() => onChoose(index)}
              >
                <span className="rpg-choice-name">{label}</span>
                <span className="rpg-choice-hint">{strings.choiceHint[index]}</span>
              </button>
            ))}
          </div>
        ) : (
          <button
            ref={primaryRef}
            type="button"
            className="btn btn--primary play-btn rpg-advance"
            onClick={e => {
              e.stopPropagation()
              onAdvance()
            }}
          >
            {strings.advance}
          </button>
        )}
      </div>
    </div>
  )
}

export interface Toast extends ToastText {
  id: number
}

export function Toasts({ toasts, renderer }: { toasts: readonly Toast[]; renderer: Renderer | null }) {
  return (
    <div className="rpg-toasts" role="status" aria-live="polite">
      {toasts.map(toast => (
        <div key={toast.id} className="play-toast rpg-toast" data-kind={toast.kind} data-tier={toast.tier >= 0 ? toast.tier : undefined}>
          {toast.base >= 0 && <ItemIcon renderer={renderer} base={toast.base} tier={toast.tier} className="play-toast-icon rpg-toast-icon" />}
          <span className="play-toast-label">{toast.label}</span>
          <span className="play-toast-text">{toast.text}</span>
        </div>
      ))}
    </div>
  )
}

export function HudText({ hud, coarsePointer, showPrompt }: { hud: Hud; coarsePointer: boolean; showPrompt: boolean }) {
  const prompt = showPrompt && hud.interact >= 0 ? interactPrompt(strings, hud.interact) : ''
  return (
    <>
      {hud.boss >= 0 && <p className="rpg-boss">{bossTitle(strings, hud.boss, hud.bossPhase)}</p>}
      {hud.boss < 0 && hud.goal >= 0 && <p className="rpg-goal">{strings.goal[hud.goal]}</p>}
      {prompt && (
        <p className="rpg-prompt" data-touch={coarsePointer || undefined}>
          {!coarsePointer && <kbd className="rpg-key">{strings.interactKey}</kbd>}
          <span>{hud.interact === OBJ_FORGE ? `${prompt} · ${strings.tabs.forge}` : prompt}</span>
        </p>
      )}
    </>
  )
}

export interface TouchHandlers {
  press: (bit: number) => void
  release: (bit: number) => void
  stance: () => void
}

function HoldButton({ bit, label, className, handlers, charge }: { bit: number; label: string; className: string; handlers: TouchHandlers; charge?: number }) {
  return (
    <button
      type="button"
      className={`rpg-touch-btn ${className}`}
      data-charging={charge !== undefined && charge < 1 ? true : undefined}
      style={charge === undefined ? undefined : ({ '--charge': charge } as CSSProperties)}
      tabIndex={-1}
      aria-label={label}
      onPointerDown={e => {
        e.currentTarget.setPointerCapture(e.pointerId)
        handlers.press(bit)
      }}
      onPointerUp={() => handlers.release(bit)}
      onPointerCancel={() => handlers.release(bit)}
      onLostPointerCapture={() => handlers.release(bit)}
      onContextMenu={e => e.preventDefault()}
    />
  )
}

export function TouchControls({ hud, renderer, handlers }: { hud: Hud; renderer: Renderer | null; handlers: TouchHandlers }) {
  const showInteract = hud.interact >= 0 || hud.longbow
  return (
    <div className="rpg-cluster">
      {showInteract && <HoldButton bit={IN_INTERACT} label={strings.buttons.interact} className="rpg-touch-btn--interact" handlers={handlers} />}
      <HoldButton bit={IN_SKILL} label={strings.buttons.skill} className="rpg-touch-btn--skill" handlers={handlers} charge={hud.skill / SKILL_CHARGE_STEPS} />
      <HoldButton bit={IN_LOCK} label={strings.buttons.lock} className="rpg-touch-btn--lock" handlers={handlers} />
      {hud.stances !== 0 && (
        <button
          type="button"
          className="rpg-touch-btn rpg-touch-btn--stance"
          tabIndex={-1}
          aria-label={strings.buttons.stance}
          onPointerDown={handlers.stance}
          onContextMenu={e => e.preventDefault()}
        >
          <ElementIcon renderer={renderer} element={hud.stance} className="rpg-touch-icon" />
        </button>
      )}
      <HoldButton bit={IN_GUARD} label={strings.buttons.guard} className="rpg-touch-btn--guard" handlers={handlers} />
      <HoldButton bit={IN_DODGE} label={strings.buttons.dodge} className="rpg-touch-btn--dodge" handlers={handlers} />
      <HoldButton bit={IN_ATTACK} label={strings.buttons.attack} className="rpg-touch-btn--attack" handlers={handlers} />
    </div>
  )
}
