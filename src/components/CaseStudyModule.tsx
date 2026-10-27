import { Link } from 'react-router-dom'
import type { CaseStudy } from '@/types'
import { Module } from './Module'

export function CaseStudyModule({ study, index }: { study: CaseStudy; index: number }) {
  return (
    <Module
      as="article"
      entry={index % 2 ? 'right' : 'left'}
      tone="frame"
      hatch="split"
      stencil={study.title}
      className="case press"
    >
      <div className="case__meta">
        <span className="decal">LOG-{String(index + 1).padStart(2, '0')}</span>
        <span className="chip chip--core">{study.company}</span>
        <span className="decal">{study.year}</span>
      </div>
      <h3 className="case__title">
        <Link to={`/case-studies/${study.slug}`} className="case__link">{study.title}</Link>
      </h3>
      <p className="case__subtitle">{study.subtitle}</p>
      <p className="case__summary">{study.summary}</p>
      <div className="tags">
        {study.tags.map((tag) => (
          <span className="chip" key={tag}>{tag}</span>
        ))}
      </div>
    </Module>
  )
}
