import type { CaseStudy } from '@/types'
import caseStudyData from '../../data/case_studys.json'

// Map flat richtext fields (stored as strings) into the structured shape used in components
function mapCaseStudy(raw: any): CaseStudy {
  const splitField = (value?: string | null) =>
    value ? value.split('||').map((part) => part.trim()).filter(Boolean) : []

  const mapConstraints = (value?: string | null) =>
    splitField(value)

  const mapDecisions = (value?: string | null) =>
    splitField(value).map((item) => {
      const [title, decision, rationale] = item.split('::')
      return {
        title: title || '',
        decision: decision || '',
        rationale: rationale || '',
      }
    })

  const mapTradeoffs = (value?: string | null) =>
    splitField(value).map((item) => {
      const [choice, tradeoff] = item.split('::')
      return {
        choice: choice || '',
        tradeoff: tradeoff || '',
      }
    })

  const mapCodeSnippets = (value?: string | null) =>
    splitField(value).map((item) => {
      const [title, language, code, explanation] = item.split('::')
      return {
        title: title || '',
        language: language || '',
        code: code || '',
        explanation,
      }
    })

  const mapDiagrams = (value?: string | null) =>
    splitField(value).map((item) => {
      const [title, description, placeholder] = item.split('::')
      return {
        title: title || '',
        description: description || '',
        placeholder: placeholder || '',
      }
    })

  const tags = raw.tags ? String(raw.tags).split(',').map((tag) => tag.trim()).filter(Boolean) : []

  return {
    slug: raw.slug,
    title: raw.title,
    subtitle: raw.subtitle,
    company: raw.company,
    year: raw.year,
    tags,
    summary: raw.summary,
    context: raw.context,
    problem: raw.problem,
    constraints: mapConstraints(raw.constraints),
    architecturalDecisions: mapDecisions(raw.architecturalDecisions),
    tradeoffs: mapTradeoffs(raw.tradeoffs),
    result: raw.result,
    codeSnippets: mapCodeSnippets(raw.codeSnippets),
    diagrams: mapDiagrams(raw.diagrams),
  }
}

export const caseStudies: CaseStudy[] = (caseStudyData as any[]).map(mapCaseStudy)

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return caseStudies.find((study) => study.slug === slug)
}
