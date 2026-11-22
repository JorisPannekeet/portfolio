import { createBlock, type Block, type BlockStyle, type BlockType, type PageConfig } from './model'
import { caseStudies, experiences, projects } from './sources'

export const STYLE_PRESETS = [
  { name: 'Paper', background: '#ffffff', text: '#0a0a0a', accent: '#2563eb' },
  { name: 'Ink', background: '#0a0a0a', text: '#fafafa', accent: '#a3e635' },
  { name: 'Midnight blue', background: '#0f172a', text: '#e2e8f0', accent: '#60a5fa' },
  { name: 'Forest', background: '#0f2a1e', text: '#ecfdf5', accent: '#6ee7b7' },
  { name: 'Sand', background: '#f5efe6', text: '#292524', accent: '#9a3412' },
  { name: 'Signal red', background: '#991b1b', text: '#ffffff', accent: '#fde047' },
] as const

const [paper, ink, midnight, , sand] = STYLE_PRESETS

function styled(type: BlockType, ref: string | undefined, preset: (typeof STYLE_PRESETS)[number], style: Partial<BlockStyle> = {}): Block {
  const block = createBlock(type, crypto.randomUUID(), ref)
  return { ...block, style: { ...block.style, background: preset.background, text: preset.text, accent: preset.accent, ...style } }
}

function heading(text: string, preset: (typeof STYLE_PRESETS)[number]): Block {
  const block = styled('heading', undefined, preset, { padding: 'sm' })
  return block.type === 'heading' ? { ...block, props: { text, level: '2' } } : block
}

export function starterPage(): PageConfig {
  return {
    version: 1,
    blocks: [
      styled('hero', undefined, paper, { padding: 'lg' }),
      styled('skills', undefined, sand),
      heading('Experience', paper),
      ...experiences.slice(0, 3).map(item => styled('experience', item.id, paper, { padding: 'sm' })),
      heading('Selected work', paper),
      ...caseStudies.slice(0, 3).map(study => styled('caseStudy', study.slug, paper, { padding: 'sm' })),
      heading('Side projects', midnight),
      ...projects.map(project => styled('project', project.key, midnight, { padding: 'sm' })),
      styled('contact', undefined, ink, { align: 'center', padding: 'lg' }),
    ],
  }
}
