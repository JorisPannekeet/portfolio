import { INPUT_IDLE } from '../sim/content.ts'
import { STICK_DEAD_ZONE, headingFromKeys, headingFromVector, keyBit } from './heading.ts'

export interface InputTarget {
  heading: number
}

export interface StickParts {
  field: HTMLElement
  base: HTMLElement
  knob: HTMLElement
  radius: () => number
}

export function attachMovement(target: InputTarget, parts: StickParts): () => void {
  let keys = 0
  let stickHeading = INPUT_IDLE
  let pointerId: number | null = null
  let originX = 0
  let originY = 0

  const sync = () => {
    target.heading = pointerId === null ? headingFromKeys(keys) : stickHeading
  }

  const placeStick = (x: number, y: number, knobX: number, knobY: number) => {
    parts.base.style.transform = `translate3d(${x}px, ${y}px, 0)`
    parts.knob.style.transform = `translate3d(${knobX}px, ${knobY}px, 0)`
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const bit = keyBit(e.code)
    if (bit === 0) return
    e.preventDefault()
    keys |= bit
    sync()
  }
  const onKeyUp = (e: KeyboardEvent) => {
    keys &= ~keyBit(e.code)
    sync()
  }

  const release = () => {
    pointerId = null
    stickHeading = INPUT_IDLE
    parts.field.dataset.stick = 'idle'
    sync()
  }

  const onBlur = () => {
    keys = 0
    release()
  }

  const onPointerDown = (e: PointerEvent) => {
    if (pointerId !== null || e.button > 0) return
    pointerId = e.pointerId
    parts.field.setPointerCapture(e.pointerId)
    const rect = parts.field.getBoundingClientRect()
    originX = e.clientX - rect.left
    originY = e.clientY - rect.top
    placeStick(originX, originY, originX, originY)
    parts.field.dataset.stick = 'held'
    stickHeading = INPUT_IDLE
    sync()
  }

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return
    const rect = parts.field.getBoundingClientRect()
    const dx = e.clientX - rect.left - originX
    const dy = e.clientY - rect.top - originY
    const radius = parts.radius()
    const length = Math.hypot(dx, dy)
    const clamp = length > radius ? radius / length : 1
    placeStick(originX, originY, originX + dx * clamp, originY + dy * clamp)
    stickHeading = headingFromVector(dx, dy, STICK_DEAD_ZONE)
    sync()
  }

  const onPointerEnd = (e: PointerEvent) => {
    if (e.pointerId === pointerId) release()
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', onBlur)
  parts.field.addEventListener('pointerdown', onPointerDown)
  parts.field.addEventListener('pointermove', onPointerMove)
  parts.field.addEventListener('pointerup', onPointerEnd)
  parts.field.addEventListener('pointercancel', onPointerEnd)
  parts.field.addEventListener('lostpointercapture', onPointerEnd)
  release()

  return () => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('blur', onBlur)
    parts.field.removeEventListener('pointerdown', onPointerDown)
    parts.field.removeEventListener('pointermove', onPointerMove)
    parts.field.removeEventListener('pointerup', onPointerEnd)
    parts.field.removeEventListener('pointercancel', onPointerEnd)
    parts.field.removeEventListener('lostpointercapture', onPointerEnd)
    target.heading = INPUT_IDLE
  }
}
