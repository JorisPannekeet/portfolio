import { useEffect, useRef, type ReactNode, type MutableRefObject } from 'react'
import { Link } from 'react-router-dom'
import type { Renderer } from '../render/renderer.ts'
import { BEACON_REWARD_HEAL, CHOICE_PASSIVE, CHOICE_REPAIR, EV_BEACON } from '../sim/content.ts'
import type { Card } from './cards.ts'
import { strings } from './i18n.ts'

export interface RunStats {
  time: string
  kills: number
  level: number
  beacons: number
  seed: number
}

export interface Notice {
  id: number
  type: number
  a: number
  b: number
}

function Dialog({ labelId, primaryRef, variant, children }: {
  labelId: string
  primaryRef: MutableRefObject<HTMLButtonElement | null>
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
      <div className={`play-panel play-panel--${variant}`}>{children}</div>
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

export function TitleOverlay({ primaryRef, coarsePointer, muted, onLaunch, onToggleSound }: {
  primaryRef: MutableRefObject<HTMLButtonElement | null>
  coarsePointer: boolean
  muted: boolean
  onLaunch: () => void
  onToggleSound: () => void
}) {
  return (
    <Dialog labelId="play-title-heading" primaryRef={primaryRef} variant="title">
      <span className="play-decal">{strings.unit}</span>
      <h1 id="play-title-heading" className="play-title">{strings.title}</h1>
      <p className="play-tagline">{strings.tagline}</p>
      <p className="play-tagline play-tagline--map">{strings.mapHint}</p>
      <p className="play-hint">{coarsePointer ? strings.controlsMobile : strings.controlsDesktop}</p>
      <div className="play-actions">
        <button ref={primaryRef} type="button" className="btn btn--primary play-btn" onClick={onLaunch}>
          {strings.start}
        </button>
        <SoundToggle muted={muted} onToggle={onToggleSound} />
        <ExitLink />
      </div>
    </Dialog>
  )
}

export function PauseOverlay({ primaryRef, muted, onResume, onToggleSound }: {
  primaryRef: MutableRefObject<HTMLButtonElement | null>
  muted: boolean
  onResume: () => void
  onToggleSound: () => void
}) {
  return (
    <Dialog labelId="play-pause-heading" primaryRef={primaryRef} variant="pause">
      <span className="play-decal">{strings.unit}</span>
      <h2 id="play-pause-heading" className="play-heading">{strings.paused}</h2>
      <div className="play-actions">
        <button ref={primaryRef} type="button" className="btn btn--primary play-btn" onClick={onResume}>
          {strings.resume}
        </button>
        <SoundToggle muted={muted} onToggle={onToggleSound} />
        <ExitLink />
      </div>
    </Dialog>
  )
}

function ChoiceIcon({ choice, renderer, className }: { choice: number; renderer: Renderer | null; className: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx || !renderer) return
    ctx.clearRect(0, 0, 16, 16)
    renderer.drawIcon(ctx, choice, 0, 0, 1)
  }, [choice, renderer])
  return <canvas ref={canvasRef} className={className} width={16} height={16} aria-hidden="true" />
}

export function LevelUpOverlay({ primaryRef, cards, renderer, onPick }: {
  primaryRef: MutableRefObject<HTMLButtonElement | null>
  cards: readonly Card[]
  renderer: Renderer | null
  onPick: (index: number) => void
}) {
  return (
    <Dialog labelId="play-level-heading" primaryRef={primaryRef} variant="level">
      <h2 id="play-level-heading" className="play-heading">{strings.levelUp}</h2>
      <p className="play-hint">{strings.levelUpHint}</p>
      <div className="play-cards">
        {cards.map((card, index) => (
          <button
            key={`${index}-${card.choice}`}
            ref={index === 0 ? primaryRef : undefined}
            type="button"
            className="play-card"
            data-evolution={card.evolution || undefined}
            onClick={() => onPick(index)}
          >
            <span className="play-card-key" aria-hidden="true">{index + 1}</span>
            <ChoiceIcon choice={card.choice} renderer={renderer} className="play-card-icon" />
            <span className="play-card-name">{card.name}</span>
            <span className="play-card-tag">{card.tag}</span>
            <span className="play-card-body">
              {card.blurb && <span className="play-card-blurb">{card.blurb}</span>}
              <span className="play-card-lines" role="list">
                {card.lines.map((line, lineIndex) => <span key={lineIndex} className="play-card-line" role="listitem">{line}</span>)}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Dialog>
  )
}

export function EndOverlay({ primaryRef, won, stats, onRelaunch }: {
  primaryRef: MutableRefObject<HTMLButtonElement | null>
  won: boolean
  stats: RunStats
  onRelaunch: () => void
}) {
  return (
    <Dialog labelId="play-end-heading" primaryRef={primaryRef} variant={won ? 'won' : 'dead'}>
      <span className="play-decal">{strings.unit}</span>
      <h2 id="play-end-heading" className="play-heading">{won ? strings.won : strings.dead}</h2>
      <dl className="play-stats">
        <div><dt>{strings.statTime}</dt><dd>{stats.time}</dd></div>
        <div><dt>{strings.statKills}</dt><dd>{stats.kills}</dd></div>
        <div><dt>{strings.statLevel}</dt><dd>{stats.level}</dd></div>
        <div><dt>{strings.statBeacons}</dt><dd>{stats.beacons}</dd></div>
        <div><dt>{strings.statSeed}</dt><dd>{stats.seed}</dd></div>
      </dl>
      <div className="play-actions">
        <button ref={primaryRef} type="button" className="btn btn--primary play-btn" onClick={onRelaunch}>
          {strings.retry}
        </button>
        <ExitLink />
      </div>
    </Dialog>
  )
}

function NoticeBody({ notice, renderer }: { notice: Notice; renderer: Renderer | null }) {
  if (notice.type !== EV_BEACON) {
    return (
      <>
        <span className="play-toast-label">{strings.toastEntering}</span>
        <span className="play-toast-text">{strings.zoneName[notice.a] ?? ''}</span>
      </>
    )
  }
  const repaired = notice.a === BEACON_REWARD_HEAL
  return (
    <>
      <ChoiceIcon choice={repaired ? CHOICE_REPAIR : CHOICE_PASSIVE + notice.a} renderer={renderer} className="play-toast-icon" />
      <span className="play-toast-label">{strings.toastBeacon}</span>
      <span className="play-toast-text">
        {repaired ? strings.toastBeaconRepair : `${strings.passiveName[notice.a] ?? ''} ${strings.tagLevel} ${notice.b}`}
      </span>
    </>
  )
}

export function NoticeToast({ notice, renderer }: { notice: Notice | null; renderer: Renderer | null }) {
  return (
    <div className="play-toast-region" role="status" aria-live="polite" aria-atomic="true">
      {notice && (
        <div key={notice.id} className="play-toast" data-kind={notice.type === EV_BEACON ? 'beacon' : 'zone'}>
          <NoticeBody notice={notice} renderer={renderer} />
        </div>
      )}
    </div>
  )
}
