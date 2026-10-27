import { useLayoutEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
gsap.config({ nullTargetWarn: false })

export { gsap, ScrollTrigger }

export const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

let openBootGate = () => {}
const bootGate = new Promise<void>((resolve) => { openBootGate = resolve })
export const releaseBoot = () => openBootGate()

export type Entry = 'left' | 'right' | 'drop' | 'rise'
type Recipe = (el: HTMLElement) => gsap.core.Timeline
type Axis = 'x' | 'y'

const atStart = { immediateRender: false }

const own = (el: HTMLElement, selector: string) =>
  [el, ...el.querySelectorAll<HTMLElement>(selector)].filter(
    (node) => node.matches(selector) && node.closest('[data-module]') === el,
  )

const docks: Record<Entry, { axis: Axis; from: 1 | -1; ease: string }> = {
  left: { axis: 'x', from: -1, ease: 'power4.in' },
  right: { axis: 'x', from: 1, ease: 'power4.in' },
  drop: { axis: 'y', from: -1, ease: 'steps(5)' },
  rise: { axis: 'y', from: 1, ease: 'power4.in' },
}

const travel = (axis: Axis) =>
  axis === 'x' ? Math.min(window.innerWidth * 0.42, 520) : Math.min(window.innerHeight * 0.24, 200)

const dock = (entry: Entry): Recipe => (el) => {
  const { axis, from, ease } = docks[entry]
  const lock: Axis = axis === 'x' ? 'y' : 'x'
  const bolts = own(el, '.bolt')
  gsap.set(el, { opacity: 0 })
  gsap.set(bolts, { rotation: -90 })
  return gsap.timeline()
    .set(el, { [axis]: from * travel(axis), [lock]: -4, opacity: 1, ...atStart })
    .to(el, { [axis]: 0, duration: 0.36, ease })
    .set(el, { [axis]: from * 7, [lock]: -2 })
    .to(el, { [axis]: 0, [lock]: -4, duration: 0.06, ease: 'steps(2)' })
    .to(el, { [lock]: 0, duration: 0.08, ease: 'steps(2)' }, '+=0.1')
    .to(bolts, { rotation: 0, duration: 0.12, ease: 'steps(3)' }, '<')
}

export const entries: Record<Entry, Recipe> = {
  left: dock('left'),
  right: dock('right'),
  drop: dock('drop'),
  rise: dock('rise'),
}

const ratchet = (rack: HTMLElement, entry: Entry) => {
  const { axis, from } = docks[entry]
  const parts = [...rack.children] as HTMLElement[]
  gsap.set(parts, { opacity: 0 })
  const tl = gsap.timeline()
  parts.forEach((part, i) => {
    tl.set(part, { [axis]: from * 56, opacity: 1, ...atStart }, i * 0.11)
      .to(part, { [axis]: 0, duration: 0.18, ease: 'steps(3)' }, i * 0.11)
      .set(part, { [axis]: -from * 4 })
      .set(part, { [axis]: 0 }, '+=0.04')
  })
  return tl
}

const bootText = (els: HTMLElement[]) => {
  gsap.set(els, { clipPath: 'inset(0 100% 0 0)' })
  return gsap.timeline().to(els, { clipPath: 'inset(0 0% 0 0)', duration: 0.24, ease: 'steps(6)', stagger: 0.05 })
}

export const hatch: Recipe = (el) => {
  const [a, b] = own(el, '.hatch__plate') as [HTMLElement, HTMLElement]
  const edge = parseFloat(getComputedStyle(el).getPropertyValue('--edge')) || 20
  const open = (plate: HTMLElement) => plate.offsetWidth - edge
  const bloom = own(el, '.hatch__bloom')
  const lips = own(el, '.hatch__lip')
  const latches = own(el, '.hatch__latch')
  const stencils = own(el, '.hatch__stencil')
  const interior = own(el, '.module__body > *')
  gsap.set(el, { attr: { 'data-hatch': 'closed' } })
  gsap.set(bloom, { opacity: 0 })
  gsap.set(lips, { opacity: 0.35 })
  return gsap.timeline()
    .to(latches, { rotation: 90, duration: 0.1, ease: 'steps(3)' })
    .to(lips, { keyframes: { opacity: [1, 0.4, 1], easeEach: 'steps(1)' }, duration: 0.12 }, '<')
    .to(a, { x: -6, duration: 0.06, ease: 'none' })
    .to(b, { x: 6, duration: 0.06, ease: 'none' }, '<')
    .to(bloom, { opacity: 1, duration: 0.06, ease: 'steps(2)' }, '<')
    .to(a, { x: () => -open(a), duration: 0.3, ease: 'power4.in' }, '+=0.1')
    .to(b, { x: () => open(b), duration: 0.3, ease: 'power4.in' }, '<')
    .set(a, { x: () => -open(a) + 7 })
    .set(b, { x: () => open(b) - 7 }, '<')
    .set(stencils, { opacity: 0 }, '<')
    .to(a, { x: () => -open(a), duration: 0.06, ease: 'steps(2)' })
    .to(b, { x: () => open(b), duration: 0.06, ease: 'steps(2)' }, '<')
    .to(bloom, { opacity: 0.3, duration: 0.24, ease: 'steps(3)' })
    .add(bootText(interior), '<')
    .set(el, { attr: { 'data-hatch': 'open' } })
    .set([a, b, ...latches], { clearProps: 'transform' })
    .set([...bloom, ...lips, ...stencils], { clearProps: 'opacity' })
    .set(interior, { clearProps: 'clipPath' })
}

const lights: Record<'flicker' | 'flow', (els: HTMLElement[]) => gsap.core.Timeline> = {
  flicker: (els) => {
    gsap.set(els, { opacity: 0 })
    return gsap.timeline()
      .to(els, { keyframes: { opacity: [1, 0.3, 1], easeEach: 'steps(1)' }, duration: 0.18, stagger: 0.035 })
      .set(els, { clearProps: 'opacity' })
  },
  flow: (els) => {
    gsap.set(els, { scaleY: 0, transformOrigin: '50% 0%' })
    return gsap.timeline()
      .to(els, { scaleY: 1, duration: 0.28, ease: 'steps(4)' })
      .set(els, { clearProps: 'transform' })
  },
}

const dockLine = (el: HTMLElement) => () =>
  Math.min(
    el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.82,
    ScrollTrigger.maxScroll(window) - 1,
  )

function assemble(el: HTMLElement) {
  const entry = (el.dataset.entry as Entry | undefined) ?? 'rise'
  const tl = gsap.timeline({ paused: true }).add(entries[entry](el))
  own(el, '[data-ratchet]').forEach((rack) => tl.add(ratchet(rack, entry), '-=0.14'))
  const lit = own(el, '[data-lit]')
  tl.add(lights.flicker(lit.filter((n) => n.dataset.lit !== 'flow')), '-=0.02')
  tl.add(lights.flow(lit.filter((n) => n.dataset.lit === 'flow')), '<')
  tl.add(bootText(own(el, '.module__title')), '<')
  if (el.dataset.hatch) tl.add(hatch(el), '-=0.1')
  return tl.set(el, { clearProps: 'transform,opacity' })
}

export function useMechanics(scope: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    if (reducedMotion()) return
    let live = true
    const ctx = gsap.context(() => {
      const unhooks = gsap.utils.toArray<HTMLElement>('[data-module]').map((el) => {
        const tl = assemble(el)
        const finish = () => tl.progress(1)
        el.addEventListener('focusin', finish, { once: true })
        ScrollTrigger.create({
          trigger: el,
          start: dockLine(el),
          once: true,
          onEnter: () => { bootGate.then(() => { if (live) tl.play() }) },
        })
        return () => el.removeEventListener('focusin', finish)
      })
      ScrollTrigger.refresh()
      return () => unhooks.forEach((unhook) => unhook())
    }, scope)
    return () => {
      live = false
      ctx.revert()
    }
  }, [scope])
}
