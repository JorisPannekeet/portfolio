import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { gsap, ScrollSmoother, ScrollTrigger, reducedMotion } from '@/lib/motion'
import { content } from '@/data/content'
import { Backdrop } from './Backdrop'

const navItems = [
  { to: '/case-studies', label: 'Work' },
  { to: '/how-i-work', label: 'Approach' },
  { to: '/about', label: 'About' },
] as const

function Header() {
  return (
    <header className="site-head">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="container site-head__bar">
        <Link to="/" className="site-head__brand">
          <span className="site-head__unit" aria-hidden="true">JP</span>
          <span className="site-head__name">Joris Pannekeet</span>
        </Link>
        <nav className="site-nav" aria-label="Main">
          {navItems.map(({ to, label }) => (
            <NavLink key={to} to={to}>{label}</NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="site-foot">
      <div className="container site-foot__bar">
        <span className="stencil stencil--ink">
          UNIT JP-11 // © {new Date().getFullYear()} JORIS PANNEKEET
        </span>
        <ul className="site-foot__links">
          <li><a href={content.links.github} target="_blank" rel="noopener noreferrer">GitHub</a></li>
          <li><a href={content.links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
          <li><a href={`mailto:${content.links.email}`}>Email</a></li>
        </ul>
      </div>
    </footer>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const smoother = useRef<ScrollSmoother | null>(null)

  // Site-wide smooth scroll + gears reacting to scroll.
  useLayoutEffect(() => {
    if (reducedMotion()) return
    const ctx = gsap.context(() => {
      smoother.current = ScrollSmoother.create({
        wrapper: '#smooth-wrapper',
        content: '#smooth-content',
        smooth: 1,
      })
    })
    // Gear rotation is tied to absolute scroll pixels, not page-height
    // progress — lazy-loaded routes change document height after mount,
    // which made a ScrollTrigger-scrubbed range unreliable. The smoother's
    // eased scrollTop gives the rotation its inertia for free.
    const spins = gsap.utils.toArray<SVGElement>('.gear').map((gear, i) => ({
      set: gsap.quickSetter(gear, 'rotation', 'deg') as (v: number) => void,
      speed: i % 2 ? -0.05 : 0.05,
    }))
    const spin = () => {
      const y = smoother.current?.scrollTop() ?? window.scrollY
      spins.forEach(({ set, speed }) => set(y * speed))
    }
    gsap.ticker.add(spin)
    return () => {
      gsap.ticker.remove(spin)
      smoother.current?.kill()
      smoother.current = null
      ctx.revert()
    }
  }, [])

  // Route change: jump back to top before paint.
  useLayoutEffect(() => {
    if (smoother.current) smoother.current.scrollTop(0)
    else window.scrollTo(0, 0)
    ScrollTrigger.refresh()
  }, [pathname])

  return (
    <>
      <Backdrop />
      <Header />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <main id="main-content">{children}</main>
          <Footer />
        </div>
      </div>
    </>
  )
}
