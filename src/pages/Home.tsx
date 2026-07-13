import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap, reducedMotion, useReveals } from '@/lib/motion'
import { content } from '@/data/content'
import { getCaseStudies } from '../../lib/data'
import { Panel } from '@/components/Panel'
import { Sparkle } from '@/components/Sparkle'

const MAX_YEARS = 8

export function Home() {
  const scope = useRef<HTMLDivElement>(null)
  useReveals(scope)

  const caseStudies = getCaseStudies()

  // Power-up load sequence: panels lock in, decals flick on, sparkle punctuates.
  useLayoutEffect(() => {
    if (reducedMotion()) return
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('.hero__text', { x: -60, autoAlpha: 0, duration: 0.7 })
        .from('.pilot', { x: 60, autoAlpha: 0, duration: 0.7 }, 0.1)
        .from('.hero .stencil', { autoAlpha: 0, duration: 0.25, stagger: 0.06 }, 0.5)
        .from('.spec__row', { x: -24, autoAlpha: 0, stagger: 0.08, duration: 0.4 }, 0.55)
        .fromTo(
          '.hero__title .sparkle',
          { scale: 0, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: 0.45, ease: 'back.out(2.5)' },
          0.9,
        )
    }, scope)
    return () => ctx.revert()
  }, [])

  return (
    <div className="container" ref={scope}>
      <section className="hero" aria-label="Introduction">
        <div className="hero__text">
          <span className="stencil">PROJECT JP-11 // PROFILE</span>
          <h1 className="hero__title">
            {content.hero.greeting}
            <Sparkle />
            <span className="hero__role">{content.hero.role}</span>
          </h1>
          <p className="hero__intro">{content.hero.intro}</p>

          <div className="hero__actions">
            <Link to="/case-studies" className="mech-btn mech-btn--primary">
              {content.hero.ctaPrimary}
              <Sparkle />
            </Link>
            <Link to="/about" className="mech-btn">{content.hero.ctaSecondary}</Link>
          </div>

          <div className="spec" role="list" aria-label="Core skills">
            {content.skills.map((skill) => (
              <div className="spec__row" role="listitem" key={skill.name}>
                <span>{skill.name}</span>
                <span className="spec__bar" aria-hidden="true">
                  {Array.from({ length: MAX_YEARS }, (_, i) => (
                    <i key={i} className={`spec__seg${i < skill.years ? ' spec__seg--on' : ''}`} />
                  ))}
                </span>
                <span className="spec__yrs">{skill.years}Y</span>
              </div>
            ))}
          </div>
        </div>

        <figure className="cut pilot">
          <Sparkle />
          <img src="/me.jpeg" alt="Joris Pannekeet" width={360} height={480} />
          <figcaption className="pilot__id">
            <span className="stencil">PILOT ID // J.PANNEKEET</span>
            <span className="stencil stencil--ink">VER 11.0</span>
          </figcaption>
        </figure>
      </section>

      <Panel code="SEC-01 // SERVICE RECORD" title="Experience">
        <div className="service" data-reveal-stagger>
          {content.experience.map((exp) => (
            <article className="cut service__row" key={exp.company}>
              <span className="service__period">{exp.period}</span>
              <div>
                <div className="service__role">{exp.role}</div>
                <div className="service__company">{exp.company}</div>
              </div>
              <span className="chip">{exp.type}</span>
            </article>
          ))}
        </div>
      </Panel>

      <Panel
        code="SEC-02 // SORTIE LOG"
        title="Selected Work"
        meta={<Link to="/case-studies" className="backlink" style={{ margin: 0 }}>View all →</Link>}
      >
        <div style={{ display: 'grid', gap: 24, marginBottom: 8 }} data-reveal-stagger>
          {caseStudies.slice(0, 2).map((study) => (
            <Link key={study.slug} to={`/case-studies/${study.slug}`} className="cut plate">
              <Sparkle />
              <div className="plate__meta">
                <span className="chip chip--red">{study.company}</span>
                <span className="stencil stencil--ink">{study.year}</span>
              </div>
              <h3>{study.title}</h3>
              <p style={{ color: 'var(--ink-soft)', margin: 0 }}>{study.subtitle}</p>
              <div className="plate__tags">
                {study.tags.split(',').map((tag) => (
                  <span className="chip" key={tag.trim()}>{tag.trim()}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </Panel>

      <Panel code="SEC-03 // DOCTRINE" title="My Approach">
        <div className="doctrine" data-reveal-stagger>
          {content.approach.map((item) => (
            <div className="doctrine__item" key={item.title}>
              <span className="doctrine__vent" aria-hidden="true"><i /><i /><i /></span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
