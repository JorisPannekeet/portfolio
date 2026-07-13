import { useRef } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useReveals } from '@/lib/motion'
import { content } from '@/data/content'
import { getCaseStudyBySlug } from '@/data/caseStudies'
import { Panel } from '@/components/Panel'

function parseListField<T>(value?: T[] | null): string[] {
  if (!value) return []
  return value.map(String).filter(Boolean)
}

function parseDecisions(value?: { title: string; decision: string; rationale: string }[] | null) {
  if (!value) return []
  return value
}

function parseTradeoffs(value?: { choice: string; tradeoff: string }[] | null) {
  if (!value) return []
  return value
}

function parseCodeSnippets(value?: { title: string; language: string; code: string; explanation?: string }[] | null) {
  if (!value) return []
  return value
}

function parseDiagrams(value?: { title: string; description: string; placeholder: string }[] | null) {
  if (!value) return []
  return value
}

export function CaseStudyDetail() {
  const { slug } = useParams()
  const scope = useRef<HTMLDivElement>(null)
  useReveals(scope)

  const study = slug ? getCaseStudyBySlug(slug) : undefined
  if (!study) return <Navigate to="/case-studies" replace />

  const constraints = parseListField(study.constraints)
  const architecturalDecisions = parseDecisions(study.architecturalDecisions)
  const tradeoffs = parseTradeoffs(study.tradeoffs)
  const codeSnippets = parseCodeSnippets(study.codeSnippets)
  const diagrams = parseDiagrams(study.diagrams)

  return (
    <div className="container container--narrow" ref={scope}>
      <header className="page-head" data-reveal>
        <Link to="/case-studies" className="backlink">← Back to sortie log</Link>
        <div className="plate__meta">
          <span className="chip chip--red">{study.company}</span>
          <span className="stencil stencil--ink">{study.year}</span>
        </div>
        <h1>{study.title}</h1>
        <p>{study.subtitle}</p>
        <div className="plate__tags">
          {study.tags.map((tag) => (
            <span className="chip" key={tag}>{tag}</span>
          ))}
        </div>
      </header>

      <Panel code="SEC-01 // BRIEFING" title="Context">
        <p className="preline" style={{ color: 'var(--ink-soft)', margin: 0 }}>{study.context}</p>
      </Panel>

      <Panel code="SEC-02 // THREAT ANALYSIS" title="The Problem">
        <p className="preline" style={{ color: 'var(--ink-soft)', margin: 0 }}>{study.problem}</p>
      </Panel>

      {constraints.length > 0 && (
        <Panel code="SEC-03 // OPERATIONAL LIMITS" title="Constraints">
          <ul className="constraints">
            {constraints.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </Panel>
      )}

      {architecturalDecisions.length > 0 && (
        <Panel code="SEC-04 // FRAME DESIGN" title="Architectural Decisions">
          {architecturalDecisions.map((d) => (
            <article className="cut decision" key={d.title}>
              <h3>{d.title}</h3>
              <p><span className="stencil">Decision:</span>{d.decision}</p>
              <p><span className="stencil stencil--ink">Rationale:</span>{d.rationale}</p>
            </article>
          ))}
        </Panel>
      )}

      {tradeoffs.length > 0 && (
        <Panel code="SEC-05 // COUNTERWEIGHTS" title="Trade-offs">
          {tradeoffs.map((t) => (
            <div className="tradeoff" key={t.choice}>
              <h3>{t.choice}</h3>
              <p>{t.tradeoff}</p>
            </div>
          ))}
        </Panel>
      )}

      {study.result && (
        <Panel code="SEC-06 // MISSION OUTCOME" title="Result">
          <p className="preline" style={{ color: 'var(--ink-soft)', margin: 0 }}>{study.result}</p>
        </Panel>
      )}

      {codeSnippets.length > 0 && (
        <Panel code="SEC-07 // INTERNALS" title="Code Examples">
          <p className="disclaimer">{content.codeDisclaimer}</p>
          {codeSnippets.map((snippet) => (
            <div className="codeblock" key={snippet.title}>
              <div className="codeblock__head">
                <span>{snippet.title}</span>
                <span className="stencil">{snippet.language}</span>
              </div>
              <pre><code>{snippet.code}</code></pre>
              {snippet.explanation && (
                <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginTop: 12 }}>
                  {snippet.explanation}
                </p>
              )}
            </div>
          ))}
        </Panel>
      )}

      {diagrams.length > 0 && (
        <Panel code="SEC-08 // SCHEMATICS" title="Architecture Diagrams">
          {diagrams.map((diagram) => (
            <div key={diagram.title} style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: 16 }}>{diagram.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{diagram.description}</p>
              <div className="diagram">{diagram.placeholder}</div>
            </div>
          ))}
        </Panel>
      )}
    </div>
  )
}
