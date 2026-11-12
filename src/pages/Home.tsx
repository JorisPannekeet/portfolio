import { useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMechanics } from '@/lib/mech'
import { content } from '@/data/content'
import { Module } from '@/components/Module'
import { CaseStudyModule } from '@/components/CaseStudyModule'
import { getExperienceItems } from '../../lib/data'
import { caseStudies } from '@/data/caseStudies'

const CELLS = 8

const formatMonth = (date?: string | null) =>
  date ? new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : undefined

export function Home() {
  const scope = useRef<HTMLDivElement>(null)
  useMechanics(scope)

  const [active, setActive] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const onTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const count = content.skillTabs.length
    const next = (active + (e.key === 'ArrowRight' ? 1 : count - 1)) % count
    setActive(next)
    tabRefs.current[next]?.focus()
  }

  const experienceItems = getExperienceItems()
  const featuredCaseStudies = caseStudies.slice(0, 2)

  return (
    <div className="container stack" ref={scope}>
      <section className="hero" aria-label="Introduction">
        <Module as="div" entry="left" decal="JP-12 // PROFILE" vent className="hero__chest">
          <h1 className="hero__title">
            {content.hero.greeting}
            <span className="hero__role">{content.hero.role}</span>
          </h1>
          <p className="hero__intro">{content.hero.intro}</p>

          <div className="hero__actions">
            <Link to="/case-studies" className="btn btn--primary press">{content.hero.ctaPrimary}</Link>
            <Link to="/about" className="btn press">{content.hero.ctaSecondary}</Link>
          </div>

          <span className="lit-seam hero__seam" aria-hidden="true" data-lit="" />

          <div className="tabs" role="tablist" aria-label="Skill eras" onKeyDown={onTabKey}>
            {content.skillTabs.map((tab, i) => (
              <button
                key={tab.label}
                ref={(el) => { tabRefs.current[i] = el }}
                type="button"
                role="tab"
                id={`skills-tab-${i}`}
                aria-selected={i === active}
                aria-controls={`skills-panel-${i}`}
                tabIndex={i === active ? 0 : -1}
                className={i === active ? 'chip chip--core tab' : 'chip tab'}
                onClick={() => setActive(i)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="cells" role="tabpanel" id={`skills-panel-${active}`} aria-labelledby={`skills-tab-${active}`}>
            {content.skillTabs[active]?.skills.map((skill) => (
              <div className="cells__row" key={skill.name}>
                <span className="cells__name">{skill.name}</span>
                <span className="cells__bank" aria-hidden="true">
                  {Array.from({ length: CELLS }, (_, i) =>
                    i < skill.years
                      ? <i key={i} className="cell cell--on" data-lit="" />
                      : <i key={i} className="cell" />,
                  )}
                </span>
                <span className="cells__yrs">{skill.years}Y</span>
              </div>
            ))}
          </div>
          <span className="hazard hero__hazard" aria-hidden="true" />
        </Module>

        <Module as="figure" entry="right" tone="frame" hatch="diagonal" className="hero__cockpit">
          <span className="hero__frame">
            <img src="/me.jpeg" alt="Joris Pannekeet" width={1000} height={1200} />
            <span className="hero__rim" aria-hidden="true" />
          </span>
          <span className="hero__id" aria-hidden="true">
            <span className="decal">ENGINEER ID // J.PANNEKEET</span>
            <span className="decal">VER 12.0</span>
          </span>
        </Module>
      </section>

      <section className="bay" aria-labelledby="experience-title">
        <Module as="header" entry="left" decal="MOD-02 // SERVICE RECORD" className="bay__head">
          <h2 id="experience-title">Experience</h2>
        </Module>
        <ol className="spine">
          {experienceItems.map((exp, i) => (
            <Module as="li" key={exp.id} entry={i % 2 ? 'right' : 'left'} decal={`REC-${String(i + 1).padStart(2, '0')}`} className="job">
              <span className="job__period">
                {formatMonth(exp.startDate)} - {formatMonth(exp.endDate) ?? 'Present'}
              </span>
              <div className="job__main">
                <div>
                  <h3 className="job__role">{exp.title}</h3>
                  <div className="job__company">{exp.company}</div>
                </div>
                <span className="chip">{exp.type}</span>
              </div>
              <span className="job__clamp" aria-hidden="true" data-lit="" />
              <span className="job__feed" aria-hidden="true" data-lit="flow" />
            </Module>
          ))}
        </ol>
      </section>

      <section className="bay" aria-labelledby="work-title">
        <Module as="header" entry="right" decal="MOD-03 // SORTIE LOG" className="bay__head">
          <h2 id="work-title">Selected Work</h2>
          <Link to="/case-studies" className="btn press">View all →</Link>
        </Module>
        <div className="bay__stack">
          {featuredCaseStudies.map((study, i) => (
            <CaseStudyModule key={study.slug} study={study} index={i} />
          ))}
        </div>
      </section>

      <section className="bay" aria-labelledby="projects-title">
        <Module as="header" entry="left" decal="MOD-04 // SIDE PROJECTS" className="bay__head">
          <h2 id="projects-title">Side Projects</h2>
        </Module>
        <div className="bay__stack">
          {content.projects.map((project, i) => (
            <Module
              as="article"
              key={project.url}
              entry={i % 2 ? 'right' : 'left'}
              tone="frame"
              hatch="split"
              stencil={project.title}
              className="case project press"
            >
              <div>
                <div className="case__meta">
                  <span className="decal">PRJ-{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="case__title">
                  <a href={project.url} target="_blank" rel="noreferrer" className="case__link">
                    {project.title} ↗
                  </a>
                </h3>
                <p className="case__summary">{project.pitch}</p>
                <div className="tags">
                  {project.tags.map((tag) => (
                    <span className="chip" key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
              <img className="project__shot" src={project.image} alt="" width={1400} height={738} loading="lazy" />
            </Module>
          ))}
        </div>
      </section>

      <Module title="My Approach" entry="drop" decal="MOD-05 // DOCTRINE" vent className="approach">
        <div className="slats" data-ratchet="">
          {content.approach.map((item, i) => (
            <div className="slat subplate on-armor" key={item.title}>
              <span className="slat__led" aria-hidden="true" data-lit="" />
              <span className="decal slat__code" aria-hidden="true">SLAT {String(i + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </Module>
    </div>
  )
}
