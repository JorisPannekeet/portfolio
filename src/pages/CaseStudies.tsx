import { useRef } from 'react'
import { useMechanics } from '@/lib/mech'
import { content } from '@/data/content'
import { caseStudies } from '@/data/caseStudies'
import { Module } from '@/components/Module'
import { CaseStudyModule } from '@/components/CaseStudyModule'

export function CaseStudies() {
  const scope = useRef<HTMLDivElement>(null)
  useMechanics(scope)

  return (
    <div className="container stack stack--tight" ref={scope}>
      <Module as="header" entry="drop" decal="SORTIE LOG // FULL RECORD" vent className="page-head">
        <h1>Case Studies</h1>
        <p>{content.caseStudiesIntro}</p>
      </Module>

      <div className="bay__stack">
        {caseStudies.map((study, i) => (
          <CaseStudyModule key={study.slug} study={study} index={i} />
        ))}
      </div>
    </div>
  )
}
