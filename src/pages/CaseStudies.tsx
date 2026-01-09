import { Link } from 'react-router-dom'
import { Container } from '@/components/layout'
import { Card } from '@/components/ui'
import { caseStudies } from '@/data/caseStudies'

export function CaseStudies() {
  return (
    <Container>
      <header className="mb-16">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-px bg-gradient-to-r from-amber-500 to-transparent" />
          <span className="text-sm font-medium text-stone-500 uppercase tracking-wider">Work</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-semibold text-stone-100 tracking-tight mb-6">
          Case Studies
        </h1>

        <p className="text-lg text-stone-400 max-w-2xl leading-relaxed">
          Detailed breakdowns of projects I've worked on. Each case study includes 
          context, constraints, architectural decisions, and honest discussion of 
          trade-offs.
        </p>
      </header>

      <div className="space-y-6">
        {caseStudies.map((study) => (
          <Link 
            key={study.slug} 
            to={`/case-studies/${study.slug}`}
            className="group block"
          >
            <Card interactive>
              <Card.Body className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 text-sm mb-4">
                      <span className="text-amber-500">{study.company}</span>
                      <span className="text-stone-700">·</span>
                      <span className="text-stone-500">{study.year}</span>
                    </div>
                    
                    <h2 className="text-2xl font-medium text-stone-100 group-hover:text-amber-400 transition-colors mb-2">
                      {study.title}
                    </h2>
                    
                    <p className="text-stone-400 mb-4">
                      {study.subtitle}
                    </p>

                    <p className="text-stone-500 leading-relaxed line-clamp-2">
                      {study.summary}
                    </p>
                  </div>

                  <div className="flex flex-col items-start lg:items-end gap-4">
                    <div className="flex flex-wrap gap-2">
                      {study.tags.map((tag) => (
                        <span 
                          key={tag}
                          className="px-2.5 py-1 rounded-lg bg-stone-800/50 text-xs font-medium text-stone-400 border border-stone-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <span className="inline-flex items-center gap-2 text-sm text-stone-500 group-hover:text-amber-400 transition-colors">
                      Read case study
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  )
}
