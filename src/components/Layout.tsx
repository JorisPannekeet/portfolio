import { useLayoutEffect, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { gsap, ScrollTrigger, reducedMotion } from '@/lib/mech'
import { content } from '@/data/content'

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
        <Link to="/" className="site-head__brand press">
          <span className="site-head__unit" aria-hidden="true">JP</span>
          <span className="site-head__name">Joris Pannekeet</span>
        </Link>
        <span className="vent site-head__vent" aria-hidden="true" />
        <span className="decal site-head__decal" aria-hidden="true">UNIT JP-11</span>
        <nav className="site-nav" aria-label="Main">
          {navItems.map(({ to, label }) => (
            <NavLink key={to} to={to} className="press">{label}</NavLink>
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
        <span className="vent site-foot__vent" aria-hidden="true" />
        <span className="decal">
          UNIT JP-11 // © {new Date().getFullYear()} JORIS PANNEKEET
        </span>
        <ul className="site-foot__links">
          <li><a className="btn btn--frame press" href={content.links.github} target="_blank" rel="noopener noreferrer">GitHub</a></li>
          <li><a className="btn btn--frame press" href={content.links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
          <li><a className="btn btn--frame press" href={`mailto:${content.links.email}`}>Email</a></li>
        </ul>
      </div>
    </footer>
  )
}

function Struts() {
  return (
    <div className="struts" aria-hidden="true">
      <span className="strut strut--l"><i className="strut__conduit" /></span>
      <span className="strut strut--r"><i className="strut__conduit" /></span>
    </div>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    if (reducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.strut__conduit',
        { scaleY: 0 },
        { scaleY: 1, ease: 'steps(40)', scrollTrigger: { start: 0, end: 'max', scrub: true } },
      )
    })
    document.fonts.ready.then(() => ScrollTrigger.refresh())
    return () => ctx.revert()
  }, [])

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    ScrollTrigger.refresh()
  }, [pathname])

  return (
    <>
      <Struts />
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  )
}
