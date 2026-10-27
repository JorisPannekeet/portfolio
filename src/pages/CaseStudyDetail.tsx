import { useRef } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useMechanics } from '@/lib/mech'
import { content } from '@/data/content'
import { getCaseStudyBySlug } from '@/data/caseStudies'
import { Module } from '@/components/Module'

export function CaseStudyDetail() {
  const { slug } = useParams()
  const scope = useRef<HTMLDivElement>(null)
  useMechanics(scope)

  const study = slug ? getCaseStudyBySlug(slug) : undefined
  if (!study) return <Navigate to="/case-studies" replace />

  const hasConstraints = study.constraints && study.constraints.length > 0
  const hasArchitecturalDecisions = study.architecturalDecisions && study.architecturalDecisions.length > 0
  const hasTradeoffs = study.tradeoffs && study.tradeoffs.length > 0
  const hasCodeSnippets = study.codeSnippets && study.codeSnippets.length > 0
  const hasDiagrams = study.diagrams && study.diagrams.length > 0

  return (
    <div className="container container--narrow stack stack--tight" ref={scope}>
      <Module as="header" entry="drop" decal="SORTIE LOG // CASE FILE" vent className="page-head">
        <Link to="/case-studies" className="backlink press">← Back to sortie log</Link>
        <div className="case__meta">
          <span className="chip chip--core">{study.company}</span>
          <span className="decal">{study.year}</span>
        </div>
        <h1 className="detail__title">{study.title}</h1>
        <p>{study.subtitle}</p>
        <div className="tags">
          {study.tags.map((tag) => (
            <span className="chip" key={tag}>{tag}</span>
          ))}
        </div>
      </Module>

      <Module title="Context" entry="left" decal="SEC-01 // BRIEFING">
        <p className="preline copy">{study.context}</p>
      </Module>

      <Module title="The Problem" entry="right" decal="SEC-02 // THREAT ANALYSIS">
        <p className="preline copy">{study.problem}</p>
      </Module>

      {hasConstraints && (
        <Module title="Constraints" entry="left" decal="SEC-03 // OPERATIONAL LIMITS">
          <ul className="constraints">
            {study.constraints.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </Module>
      )}

      {hasArchitecturalDecisions && (
        <Module title="Architectural Decisions" entry="right" decal="SEC-04 // FRAME DESIGN">
          <div className="decisions" data-ratchet="">
            {study.architecturalDecisions.map((d) => (
              <article className="subplate on-armor decision" key={d.title}>
                <h3>{d.title}</h3>
                <p><span className="decision__label decision__label--core">Decision:</span>{d.decision}</p>
                <p><span className="decision__label">Rationale:</span>{d.rationale}</p>
              </article>
            ))}
          </div>
        </Module>
      )}

      {hasTradeoffs && (
        <Module title="Trade-offs" entry="left" decal="SEC-05 // COUNTERWEIGHTS">
          {study.tradeoffs.map((t) => (
            <div className="tradeoff" key={t.choice}>
              <h3>{t.choice}</h3>
              <p>{t.tradeoff}</p>
            </div>
          ))}
        </Module>
      )}

      {study.result && (
        <Module title="Result" entry="rise" tone="frame" hatch="split" stencil="Mission outcome" className="payoff">
          <p className="preline copy">{study.result}</p>
        </Module>
      )}

      {hasCodeSnippets && (
        <Module title="Code Examples" entry="left" tone="frame" decal="SEC-07 // INTERNALS">
          <p className="disclaimer">{content.codeDisclaimer}</p>
          {study.codeSnippets.map((snippet) => (
            <div className="codeblock" key={snippet.title}>
              <div className="codeblock__head">
                <span>{snippet.title}</span>
                <span className="decal">{snippet.language}</span>
              </div>
              <pre><code>{snippet.code}</code></pre>
              {snippet.explanation && <p className="codeblock__note">{snippet.explanation}</p>}
            </div>
          ))}
        </Module>
      )}

      {hasDiagrams && (
        <Module title="Architecture Diagrams" entry="right" decal="SEC-08 // SCHEMATICS">
          {study.diagrams?.map((diagram) => (
            <div className="diagram-item" key={diagram.title}>
              <h3>{diagram.title}</h3>
              <p className="copy">{diagram.description}</p>
              <div className="diagram">{diagram.placeholder}</div>
            </div>
          ))}
        </Module>
      )}
    </div>
  )
}
