import { useParams, Link, Navigate } from 'react-router-dom'
import { Container } from '@/components/layout'
import { getCaseStudyBySlug, caseStudies } from '@/data/caseStudies'

export function CaseStudyDetail() {
  const { slug } = useParams<{ slug: string }>()
  const caseStudy = slug ? getCaseStudyBySlug(slug) : undefined

  if (!caseStudy) {
    return <Navigate to="/case-studies" replace />
  }

  const currentIndex = caseStudies.findIndex(cs => cs.slug === slug)
  const prevStudy = currentIndex > 0 ? caseStudies[currentIndex - 1] : undefined
  const nextStudy = currentIndex < caseStudies.length - 1 ? caseStudies[currentIndex + 1] : undefined

  return (
    <Container narrow>
      <nav className="mb-12">
        <Link 
          to="/case-studies" 
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-amber-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          Back to Case Studies
        </Link>
      </nav>

      <header className="mb-16">
        <div className="flex items-center gap-3 text-sm mb-4">
          <span className="text-amber-500">{caseStudy.company}</span>
          <span className="text-stone-700">·</span>
          <span className="text-stone-500">{caseStudy.year}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold text-stone-100 tracking-tight mb-4">
          {caseStudy.title}
        </h1>

        <p className="text-xl text-stone-400 mb-6">
          {caseStudy.subtitle}
        </p>

        <div className="flex flex-wrap gap-2">
          {caseStudy.tags.map((tag) => (
            <span 
              key={tag}
              className="px-3 py-1.5 rounded-lg bg-stone-800/50 text-sm font-medium text-stone-400 border border-stone-800"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      <article className="prose-content">
        <section>
          <h2>Context</h2>
          {caseStudy.context.split('\n\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </section>

        <section>
          <h2>The Problem</h2>
          {caseStudy.problem.split('\n\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </section>

        <section>
          <h2>Constraints</h2>
          <ul>
            {caseStudy.constraints.map((constraint, i) => (
              <li key={i}>{constraint}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Architectural Decisions</h2>
          {caseStudy.architecturalDecisions.map((decision, i) => (
            <div key={i} className="mb-8 p-6 rounded-xl border border-stone-800 bg-stone-900/30">
              <h3 className="!mt-0 text-amber-400">{decision.title}</h3>
              <p className="!mb-2"><strong>Decision:</strong> {decision.decision}</p>
              <p className="!mb-0"><strong>Rationale:</strong> {decision.rationale}</p>
            </div>
          ))}
        </section>

        <section>
          <h2>Trade-offs</h2>
          <p>
            Every architectural decision involves trade-offs. Here's what we 
            accepted as downsides and how we mitigated them:
          </p>
          <div className="space-y-4">
            {caseStudy.tradeoffs.map((tradeoff, i) => (
              <div key={i} className="pl-5 border-l-2 border-amber-500/30">
                <p className="!mb-1 font-medium text-stone-200">{tradeoff.choice}</p>
                <p className="!mb-0 text-stone-500">{tradeoff.tradeoff}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Result</h2>
          {caseStudy.result.split('\n').map((line, i) => (
            line.startsWith('-') ? null : <p key={i}>{line}</p>
          ))}
          <ul>
            {caseStudy.result.split('\n')
              .filter(line => line.startsWith('-'))
              .map((line, i) => (
                <li key={i}>{line.substring(2)}</li>
              ))}
          </ul>
        </section>

        {caseStudy.codeSnippets.length > 0 && (
          <section>
            <h2>Code Examples</h2>
            {caseStudy.codeSnippets.map((snippet, i) => (
              <div key={i} className="mb-10">
                <h3>{snippet.title}</h3>
                {snippet.explanation && (
                  <p>{snippet.explanation}</p>
                )}
                <pre>
                  <code>{snippet.code}</code>
                </pre>
              </div>
            ))}
          </section>
        )}

        {caseStudy.diagrams && caseStudy.diagrams.length > 0 && (
          <section>
            <h2>Architecture Diagrams</h2>
            {caseStudy.diagrams.map((diagram, i) => (
              <div key={i} className="mb-8">
                <h3>{diagram.title}</h3>
                <p className="text-stone-500">{diagram.description}</p>
                <div className="mt-4 rounded-xl bg-stone-900 p-8 text-center text-stone-500 font-mono text-sm border border-stone-800">
                  {diagram.placeholder}
                </div>
              </div>
            ))}
          </section>
        )}
      </article>

      <nav className="mt-20 pt-10 border-t border-stone-800">
        <div className="flex justify-between">
          {prevStudy ? (
            <Link 
              to={`/case-studies/${prevStudy.slug}`}
              className="group"
            >
              <span className="text-sm text-stone-600 flex items-center gap-1 mb-1">
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                Previous
              </span>
              <p className="font-medium text-stone-300 group-hover:text-amber-400 transition-colors">
                {prevStudy.title}
              </p>
            </Link>
          ) : <div />}
          
          {nextStudy && (
            <Link 
              to={`/case-studies/${nextStudy.slug}`}
              className="group text-right"
            >
              <span className="text-sm text-stone-600 flex items-center justify-end gap-1 mb-1">
                Next
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
              <p className="font-medium text-stone-300 group-hover:text-amber-400 transition-colors">
                {nextStudy.title}
              </p>
            </Link>
          )}
        </div>
      </nav>
    </Container>
  )
}
