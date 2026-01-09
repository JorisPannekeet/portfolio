export interface CaseStudy {
  slug: string
  title: string
  subtitle: string
  company: string
  year: number
  tags: string[]
  summary: string
}

export interface CaseStudyDetail extends CaseStudy {
  context: string
  problem: string
  constraints: string[]
  architecturalDecisions: ArchitecturalDecision[]
  tradeoffs: Tradeoff[]
  result: string
  codeSnippets: CodeSnippet[]
  diagrams?: DiagramReference[]
}

export interface ArchitecturalDecision {
  title: string
  decision: string
  rationale: string
}

export interface Tradeoff {
  choice: string
  tradeoff: string
}

export interface CodeSnippet {
  title: string
  language: string
  code: string
  explanation?: string
}

export interface DiagramReference {
  title: string
  description: string
  placeholder: string
}
