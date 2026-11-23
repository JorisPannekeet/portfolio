export const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)'

const MOVE_MS = 280
const UNFOLD_MS = 300
const SLIDE_LIMIT = 320
const STAGGER_MS = [0, 50, 90, 120, 140]
const LATE_MS = 150
const INSET = 16

export type Box = { left: number; top: number; width: number; height: number }
export type Origin = { from: Box; ghost?: HTMLElement; solid?: boolean }
export type Landing = Origin & { id: string }

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max))

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function launch(source: HTMLElement, className: string): Origin | undefined {
  if (reducedMotion()) return undefined
  const from = source.getBoundingClientRect()
  const ghost = source.cloneNode(true) as HTMLElement
  ghost.className = className
  ghost.inert = true
  ghost.setAttribute('aria-hidden', 'true')
  Object.assign(ghost.style, { position: 'fixed', left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`, zIndex: '60', pointerEvents: 'none', willChange: 'transform' })
  document.body.append(ghost)
  return { from, ghost }
}

export function slide(element: HTMLElement, dx: number, dy: number): void {
  element.animate([{ transform: `translate(${dx}px, ${clamp(dy, -SLIDE_LIMIT, SLIDE_LIMIT)}px)` }, { transform: 'translate(0px, 0px)' }], { duration: MOVE_MS, easing: EASE, composite: 'add' })
}

export function appear(element: HTMLElement, order: number): void {
  element.animate(
    [
      { opacity: 0, transform: 'scale(0.98)' },
      { opacity: 1, transform: 'scale(1)' },
    ],
    { duration: MOVE_MS, easing: EASE, delay: STAGGER_MS[order] ?? LATE_MS, fill: 'backwards' },
  )
}

export function fade(element: HTMLElement): void {
  element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: LATE_MS, easing: EASE })
}

function unfold(element: HTMLElement, footprint: Box, delay: number, solid = false): void {
  const { width, height } = element.getBoundingClientRect()
  const w = Math.min(footprint.width, width)
  const h = Math.min(footprint.height, height)
  const left = clamp(footprint.left, 0, width - w)
  const top = clamp(footprint.top, 0, height - h)
  element.animate(
    [
      { clipPath: `inset(${top}px ${width - left - w}px ${height - top - h}px ${left}px round 8px)`, opacity: solid ? 1 : 0 },
      { opacity: 1, offset: 0.3 },
      { clipPath: 'inset(0px 0px 0px 0px round 0px)', opacity: 1 },
    ],
    { duration: UNFOLD_MS, easing: EASE, delay, fill: 'backwards' },
  )
}

export function land(element: HTMLElement, { from, ghost, solid }: Origin, scroller: HTMLElement | null): void {
  const rect = element.getBoundingClientRect()
  if (!ghost) return unfold(element, { left: from.left - rect.left, top: from.top - rect.top, width: from.width, height: from.height }, 0, solid)

  const duration = clamp(Math.hypot(rect.left + INSET - from.left, rect.top + INSET - from.top) / 2.5, 240, 360)
  unfold(element, { left: INSET, top: INSET, width: from.width, height: from.height }, duration * 0.7)

  const timing = new KeyframeEffect(null, null, { duration, easing: EASE, fill: 'forwards' })
  const clock = new Animation(timing)
  clock.play()
  const frame = () => {
    if (!element.isConnected) return ghost.remove()
    const progress = timing.getComputedTiming().progress ?? 1
    const block = element.getBoundingClientRect()
    const view = scroller?.getBoundingClientRect()
    const top = view ? clamp(block.top + INSET, view.top + 8, view.bottom - from.height - 8) : block.top + INSET
    const lift = Math.min(1, progress * 4)
    ghost.style.transform = `translate3d(${(block.left + INSET - from.left) * progress}px, ${(top - from.top) * progress}px, 0) scale(${1 + 0.03 * lift}) rotate(${-2 * lift}deg)`
    if (clock.playState !== 'finished') return void requestAnimationFrame(frame)
    ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: LATE_MS, easing: EASE, fill: 'forwards' }).finished.then(() => ghost.remove(), () => ghost.remove())
  }
  frame()
}
