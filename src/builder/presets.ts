import { createBlock, type Block, type BlockStyle, type BlockType, type PageConfig } from './model'
import { experiences, games, projects } from './sources'

export const STYLE_PRESETS = [
  { name: 'Paper', background: '#ffffff', text: '#0a0a0a', accent: '#2563eb' },
  { name: 'Ink', background: '#0a0a0a', text: '#fafafa', accent: '#a3e635' },
  { name: 'Midnight blue', background: '#0f172a', text: '#e2e8f0', accent: '#60a5fa' },
  { name: 'Forest', background: '#0f2a1e', text: '#ecfdf5', accent: '#6ee7b7' },
  { name: 'Sand', background: '#f5efe6', text: '#292524', accent: '#9a3412' },
  { name: 'Signal red', background: '#991b1b', text: '#ffffff', accent: '#fde047' },
] as const

type Look = Pick<BlockStyle, 'background' | 'text' | 'accent'>

const INK: Look = { background: '#0b0b0f', text: '#f4f1ea', accent: '#c6f135' }
const BONE: Look = { background: '#f4f1ea', text: '#0b0b0f', accent: '#4a2ff5' }
const LIME: Look = { background: '#c6f135', text: '#0b0b0f', accent: '#4a2ff5' }
const INDIGO: Look = { background: '#4a2ff5', text: '#ffffff', accent: '#c6f135' }

function tile(type: BlockType, look: Look, style: Partial<BlockStyle> = {}, ref?: string): Block {
  const block = createBlock(type, crypto.randomUUID(), ref)
  return { ...block, style: { ...block.style, ...look, font: 'display', ...style } }
}

function title(text: string, look: Look): Block {
  const block = tile('heading', look, { width: '2', size: 'lg', padding: 'lg' })
  return block.type === 'heading' ? { ...block, props: { text, level: '1' } } : block
}

const half = (type: BlockType, look: Look, ref?: string) => tile(type, look, { width: '2' }, ref)

function quad(text: string, look: Look, type: BlockType, refs: readonly (string | undefined)[]): Block[] {
  const looks = [INK, INK, BONE]
  return [title(text, look), ...refs.slice(0, 3).map((ref, i) => half(type, looks[i] ?? INK, ref))]
}

export function starterPage(): PageConfig {
  return {
    version: 1,
    blocks: [
      tile('hero', INK, { size: 'lg', padding: 'lg' }),
      half('story', LIME, 'intro'),
      half('skills', BONE),
      ...quad('Experience', INDIGO, 'experience', experiences.map(item => item.id)),
      tile('approach', LIME),
      ...quad('Side projects', LIME, 'project', projects.map(project => project.key)),
      ...quad('Games', INDIGO, 'game', games.map(game => game.key)),
      tile('contact', LIME, { width: '2', size: 'lg', padding: 'lg' }),
      tile('button', INK, { width: '2', align: 'center', size: 'lg' }),
    ],
  }
}
