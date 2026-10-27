import { useLayoutEffect, useRef, useState } from 'react'
import { gsap, reducedMotion, releaseBoot } from '@/lib/mech'

const BOOTED = 'jp-booted'
const TEETH = 9
const DEPTH = 26

const seamEdge: Array<[number, number]> = []
for (let i = 0; i < TEETH; i += 2) {
  const x = (f: number) => +(((i + f) / TEETH) * 100).toFixed(3)
  seamEdge.push([x(0.12), 0], [x(0.3), 1], [x(0.7), 1], [x(0.88), 0])
}

const topClip = `polygon(0 0, 100% 0, 100% calc(100% - ${DEPTH}px), ${[...seamEdge]
  .reverse()
  .map(([x, d]) => `${x}% calc(100% - ${DEPTH - d * DEPTH}px)`)
  .join(', ')}, 0 calc(100% - ${DEPTH}px))`

const bottomClip = `polygon(0 0, ${seamEdge
  .map(([x, d]) => `${x}% ${d * DEPTH}px`)
  .join(', ')}, 100% 0, 100% 100%, 0 100%)`

const seamPath = ['0,0', ...seamEdge.map(([x, d]) => `${x},${d * DEPTH}`), `100,0`].join(' ')

const shouldBoot = () => !reducedMotion() && !sessionStorage.getItem(BOOTED)

export function BlastDoors() {
  const [show, setShow] = useState(shouldBoot)
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!show) {
      releaseBoot()
      return
    }
    sessionStorage.setItem(BOOTED, '1')
    const ctx = gsap.context(() => {
      const short = window.innerHeight * (window.innerWidth < 768 ? 0.08 : 0.12)
      const tl = gsap.timeline({ onComplete: () => setShow(false) })
        .set('.door__decal', { opacity: 0 })
        .to('.door__decal', { keyframes: { opacity: [1, 0.3, 1], easeEach: 'steps(1)' }, duration: 0.18, stagger: 0.04 }, 0.08)
        .to('.doors__seam', { keyframes: { opacity: [1, 0.4, 1], easeEach: 'steps(1)' }, duration: 0.15 }, 0.12)
        .to('.doors__latch--l', { xPercent: -110, duration: 0.15, ease: 'steps(3)' }, 0.26)
        .to('.doors__latch--r', { xPercent: 110, duration: 0.15, ease: 'steps(3)' }, '<')
        .to('.door--top', { y: -8, duration: 0.06, ease: 'none' }, 0.44)
        .to('.door--bottom', { y: 8, duration: 0.06, ease: 'none' }, '<')
        .to('.doors__flood', { opacity: 1, duration: 0.06, ease: 'steps(2)' }, '<')
        .to('.doors__seam', { opacity: 0, duration: 0.06, ease: 'steps(1)' }, '<')
        .to('.door--top', { y: -short, duration: 0.2, ease: 'steps(4)' }, 0.64)
        .to('.door--bottom', { y: short, duration: 0.2, ease: 'steps(4)' }, '<')
        .set('.door--top', { y: -short + 5 })
        .set('.door--bottom', { y: short - 5 }, '<')
        .to('.door--top', { y: -short, duration: 0.05, ease: 'steps(2)' })
        .to('.door--bottom', { y: short, duration: 0.05, ease: 'steps(2)' }, '<')
        .call(releaseBoot, [], 1.0)
        .to('.door--top', { yPercent: -101, duration: 0.34, ease: 'power4.in' }, 1.02)
        .to('.door--bottom', { yPercent: 101, duration: 0.34, ease: 'power4.in' }, '<')
        .to('.doors__flood', { opacity: 0, duration: 0.3, ease: 'steps(3)' }, 1.2)
      const skip = () => tl.progress(1)
      const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const
      events.forEach((type) => window.addEventListener(type, skip, { once: true, passive: true }))
      return () => events.forEach((type) => window.removeEventListener(type, skip))
    }, ref)
    return () => ctx.revert()
  }, [show])

  if (!show) return null

  return (
    <div className="doors" ref={ref} aria-hidden="true">
      <span className="doors__flood" />
      <svg className="doors__seam" viewBox={`0 0 100 ${DEPTH}`} preserveAspectRatio="none">
        <polyline points={seamPath} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="door door--top on-armor" style={{ clipPath: topClip }}>
        <span className="door__face" style={{ clipPath: topClip }} />
        <span className="door__line door__line--1" />
        <span className="door__line door__line--2" />
        <span className="door__line door__line--v" />
        <span className="door__stencil">JP-11</span>
        <span className="decal door__decal door__decal--a">BAY 01 // LAUNCH DECK</span>
        <span className="decal door__decal door__decal--b">PRESSURE SEAL ENGAGED</span>
        <span className="vent door__vent" />
        <i className="bolt door__bolt" style={{ left: '6%', bottom: 58 }} />
        <i className="bolt door__bolt" style={{ left: '30%', bottom: 58 }} />
        <i className="bolt door__bolt" style={{ right: '30%', bottom: 58 }} />
        <i className="bolt door__bolt" style={{ right: '6%', bottom: 58 }} />
      </div>
      <div className="door door--bottom on-armor" style={{ clipPath: bottomClip }}>
        <span className="door__face" style={{ clipPath: bottomClip }} />
        <span className="door__line door__line--1" />
        <span className="door__line door__line--2" />
        <span className="hazard door__hazard" />
        <span className="decal door__decal door__decal--c">CAUTION // MOVING PLATES</span>
        <span className="decal door__decal door__decal--d">UNIT JP-11 // SYSTEM BOOT</span>
        <i className="bolt door__bolt" style={{ left: '6%', top: 58 }} />
        <i className="bolt door__bolt" style={{ left: '30%', top: 58 }} />
        <i className="bolt door__bolt" style={{ right: '30%', top: 58 }} />
        <i className="bolt door__bolt" style={{ right: '6%', top: 58 }} />
      </div>
      <span className="doors__latch doors__latch--l" />
      <span className="doors__latch doors__latch--r" />
    </div>
  )
}
