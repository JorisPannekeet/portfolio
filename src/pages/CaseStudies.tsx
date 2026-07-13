import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useReveals } from '@/lib/motion'
import { content } from '@/data/content'
import { caseStudies } from '@/data/caseStudies'
import { Sparkle } from '@/components/Sparkle'

export function CaseStudies() {
  const scope = useRef<HTMLDivElement>(null)
  useReveals(scope)

  return (
    <div className="container" ref={scope}>
      <header className="page-head" data-reveal>
        <span className="stencil">SORTIE LOG // FULL RECORD</span>
        <h1>Case Studies</h1>
        <p>{content.caseStudiesIntro}</p>
      </header>

      <div style={{ display: 'grid', gap: 22, paddingBottom: 40 }} data-reveal-stagger>
        {caseStudies.map((study, i) => (
          <Link key={study.slug} to={`/case-studies/${study.slug}`} className="cut plate">
            <Sparkle />
            <div className="plate__meta">
              <span className="stencil">LOG-{String(i + 1).padStart(2, '0')}</span>
              <span className="chip chip--red">{study.company}</span>
              <span className="stencil stencil--ink">{study.year}</span>
            </div>
            <h3>{study.title}</h3>
            <p style={{ color: 'var(--ink-soft)', margin: '0 0 6px' }}>{study.subtitle}</p>
            <p style={{ color: 'var(--ink-soft)', fontSize: 15, margin: 0 }}>{study.summary}</p>
            <div className="plate__tags">
              {study.tags.map((tag) => (
                <span className="chip" key={tag}>{tag}</span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
