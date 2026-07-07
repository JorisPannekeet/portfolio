import { useLayoutEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollSmoother } from 'gsap/ScrollSmoother'

gsap.registerPlugin(ScrollTrigger, ScrollSmoother)

export { gsap, ScrollTrigger, ScrollSmoother }

export const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Scroll-triggered armor-panel reveals: any [data-reveal] element in scope
 * slides/locks into place when it enters the viewport. Elements with
 * [data-reveal-stagger] reveal their direct children with a stagger instead.
 */
export function useReveals(scope: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    if (reducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          y: 48,
          autoAlpha: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      })
      gsap.utils.toArray<HTMLElement>('[data-reveal-stagger]').forEach((el) => {
        gsap.from(el.children, {
          y: 36,
          autoAlpha: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        })
      })
    }, scope)
    return () => ctx.revert()
  }, [scope])
}
