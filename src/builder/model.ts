import { content } from '../data/content.ts'

export const BLOCK_TYPES = ['hero', 'skills', 'experience', 'caseStudy', 'project', 'game', 'approach', 'techStack', 'story', 'howIWork', 'passions', 'contact', 'heading', 'text', 'button', 'image', 'divider', 'spacer'] as const
export type BlockType = (typeof BLOCK_TYPES)[number]

export const FONTS = ['sans', 'serif', 'display', 'mono', 'hand'] as const
export const SCALES = ['sm', 'md', 'lg'] as const
export const ALIGNS = ['left', 'center'] as const

export type BlockStyle = {
  background: string
  text: string
  accent: string
  font: (typeof FONTS)[number]
  size: (typeof SCALES)[number]
  align: (typeof ALIGNS)[number]
  padding: (typeof SCALES)[number]
}

export const DEFAULT_STYLE: BlockStyle = {
  background: '#ffffff',
  text: '#0a0a0a',
  accent: '#2563eb',
  font: 'sans',
  size: 'md',
  align: 'left',
  padding: 'md',
}

type TextField = { kind: 'text' | 'longText' | 'url'; label: string; max: number; fallback: string }
type ChoiceField<V extends string> = { kind: 'choice'; label: string; options: readonly { value: V; label: string }[]; fallback: V }
export type Field = TextField | ChoiceField<string>

const text = (kind: TextField['kind'], label: string, max: number, fallback: string): TextField => ({ kind, label, max, fallback })
const choice = <const V extends string>(label: string, options: readonly { value: V; label: string }[], fallback: NoInfer<V>): ChoiceField<V> => ({ kind: 'choice', label, options, fallback })

const SIZE_OPTIONS = [
  { value: 'sm', label: 'S' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'L' },
] as const

export const PROP_FIELDS = {
  heading: {
    text: text('text', 'Text', 200, 'A new section'),
    level: choice('Level', [{ value: '1', label: 'H1' }, { value: '2', label: 'H2' }, { value: '3', label: 'H3' }], '2'),
  },
  text: {
    text: text('longText', 'Text', 5000, 'Write something here. Select this block and edit the text in the panel on the right.'),
  },
  button: {
    label: text('text', 'Label', 80, 'Get in touch'),
    url: text('url', 'Link', 2048, `mailto:${content.links.email}`),
  },
  image: {
    src: text('url', 'Image URL', 2048, '/me.jpeg'),
    alt: text('text', 'Alt text', 300, 'Joris Pannekeet'),
  },
  spacer: {
    size: choice('Height', SIZE_OPTIONS, 'md'),
  },
  caseStudy: {
    detail: choice('Detail', [{ value: 'summary', label: 'Summary' }, { value: 'full', label: 'Full' }], 'summary'),
  },
  hero: {
    photo: choice('Photo', [{ value: 'show', label: 'Show' }, { value: 'hide', label: 'Hide' }], 'show'),
  },
} satisfies Partial<Record<BlockType, Record<string, Field>>>

type Fields = typeof PROP_FIELDS
type ValueOf<F> = F extends ChoiceField<infer V> ? V : string
type PropsOf<T extends BlockType> = T extends keyof Fields ? { [K in keyof Fields[T]]: ValueOf<Fields[T][K]> } : Record<string, never>

export type Block = {
  [T in BlockType]: { id: string; type: T; ref?: string; props: PropsOf<T>; style: BlockStyle }
}[BlockType]
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>

export type PageConfig = { version: 1; blocks: Block[] }

export type EditorState = {
  page: PageConfig
  selectedId: string | null
  past: PageConfig[]
  future: PageConfig[]
  coalesceKey: string | null
}

export type Action =
  | { type: 'add'; block: Block; index: number }
  | { type: 'move'; id: string; index: number }
  | { type: 'remove'; id: string }
  | { type: 'duplicate'; id: string; newId: string }
  | { type: 'patchStyle'; id: string; style: Partial<BlockStyle> }
  | { type: 'patchProps'; id: string; props: Record<string, string> }
  | { type: 'select'; id: string | null }
  | { type: 'load'; page: PageConfig }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset' }

const HISTORY_LIMIT = 50
const MAX_BLOCKS = 200
const MAX_REF = 120
const HEX = /^#[0-9a-f]{6}$/i

export const EMPTY_PAGE: PageConfig = { version: 1, blocks: [] }

export function fieldsOf(type: BlockType): [string, Field][] {
  const fields: Partial<Record<BlockType, Record<string, Field>>> = PROP_FIELDS
  return Object.entries(fields[type] ?? {})
}

function cleanProps(type: BlockType, raw: unknown, strictUrls: boolean): Record<string, string> {
  const source = isRecord(raw) ? raw : {}
  const props: Record<string, string> = {}
  for (const [key, field] of fieldsOf(type)) props[key] = cleanValue(field, source[key], strictUrls) ?? field.fallback
  return props
}

function cleanValue(field: Field, value: unknown, strictUrls: boolean): string | null {
  if (typeof value !== 'string') return null
  if (field.kind === 'choice') return field.options.some(option => option.value === value) ? value : null
  const clipped = value.slice(0, field.max)
  if (field.kind === 'url' && strictUrls) return safeUrl(clipped) ?? ''
  return clipped
}

export function createBlock(type: BlockType, id: string, ref?: string): Block {
  return { id, type, ...(ref === undefined ? {} : { ref }), props: cleanProps(type, {}, true), style: { ...DEFAULT_STYLE } } as Block
}

function oneOf<T extends string>(list: readonly T[], value: unknown, fallback: T): T {
  return list.includes(value as T) ? (value as T) : fallback
}

function cleanStyle(raw: unknown): BlockStyle {
  const source = isRecord(raw) ? raw : {}
  const hex = (value: unknown, fallback: string) => (typeof value === 'string' && HEX.test(value) ? value.toLowerCase() : fallback)
  return {
    background: hex(source.background, DEFAULT_STYLE.background),
    text: hex(source.text, DEFAULT_STYLE.text),
    accent: hex(source.accent, DEFAULT_STYLE.accent),
    font: oneOf(FONTS, source.font, DEFAULT_STYLE.font),
    size: oneOf(SCALES, source.size, DEFAULT_STYLE.size),
    align: oneOf(ALIGNS, source.align, DEFAULT_STYLE.align),
    padding: oneOf(SCALES, source.padding, DEFAULT_STYLE.padding),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parsePage(raw: unknown): PageConfig {
  if (!isRecord(raw) || raw.version !== 1 || !Array.isArray(raw.blocks)) return EMPTY_PAGE
  const seen = new Set<string>()
  const blocks: Block[] = []
  for (const item of raw.blocks.slice(0, MAX_BLOCKS)) {
    if (!isRecord(item) || typeof item.id !== 'string' || item.id === '' || item.id.length > MAX_REF || seen.has(item.id)) continue
    const type = item.type
    if (typeof type !== 'string' || !(BLOCK_TYPES as readonly string[]).includes(type)) continue
    const blockType = type as BlockType
    seen.add(item.id)
    const ref = typeof item.ref === 'string' && item.ref.length <= MAX_REF ? item.ref : undefined
    blocks.push({ id: item.id, type: blockType, ...(ref === undefined ? {} : { ref }), props: cleanProps(blockType, item.props, true), style: cleanStyle(item.style) } as Block)
  }
  return { version: 1, blocks }
}

export function safeUrl(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed.startsWith('/')) {
    try {
      const base = 'https://same-origin.invalid'
      const url = new URL(trimmed, base)
      return url.origin === base ? url.pathname + url.search + url.hash : null
    } catch {
      return null
    }
  }
  try {
    const url = new URL(trimmed)
    return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:' ? url.href : null
  } catch {
    return null
  }
}

export function initialState(page: PageConfig): EditorState {
  return { page, selectedId: null, past: [], future: [], coalesceKey: null }
}

function commit(state: EditorState, blocks: Block[], selectedId: string | null, coalesceKey: string | null = null): EditorState {
  const page: PageConfig = { version: 1, blocks }
  if (coalesceKey !== null && coalesceKey === state.coalesceKey) return { ...state, page, selectedId }
  return { page, selectedId, past: [...state.past, state.page].slice(-HISTORY_LIMIT), future: [], coalesceKey }
}

function insertAt<T>(list: T[], index: number, item: T): T[] {
  const at = Math.max(0, Math.min(index, list.length))
  return [...list.slice(0, at), item, ...list.slice(at)]
}

function keepSelection(page: PageConfig, id: string | null): string | null {
  return id !== null && page.blocks.some(block => block.id === id) ? id : null
}

export function reduce(state: EditorState, action: Action): EditorState {
  const blocks = state.page.blocks
  const index = 'id' in action && action.id !== null ? blocks.findIndex(block => block.id === action.id) : -1
  const target = blocks[index]
  switch (action.type) {
    case 'add':
      return commit(state, insertAt(blocks, action.index, action.block), action.block.id)
    case 'move': {
      if (!target || action.index === index || action.index === index + 1) return state
      const rest = blocks.filter(block => block !== target)
      return commit(state, insertAt(rest, action.index > index ? action.index - 1 : action.index, target), state.selectedId)
    }
    case 'remove':
      if (!target) return state
      return commit(state, blocks.filter(block => block !== target), state.selectedId === action.id ? null : state.selectedId)
    case 'duplicate':
      if (!target) return state
      return commit(state, insertAt(blocks, index + 1, { ...target, id: action.newId, style: { ...target.style } }), action.newId)
    case 'patchStyle': {
      if (!target) return state
      const key = `${action.id}:style:${Object.keys(action.style).sort().join(',')}`
      const next = { ...target, style: { ...target.style, ...action.style } }
      return commit(state, blocks.map(block => (block === target ? next : block)), state.selectedId, key)
    }
    case 'patchProps': {
      if (!target) return state
      const fields = new Map(fieldsOf(target.type))
      const props: Record<string, string> = { ...target.props }
      for (const [name, value] of Object.entries(action.props)) {
        const field = fields.get(name)
        const clean = field ? cleanValue(field, value, false) : null
        if (clean !== null) props[name] = clean
      }
      const key = `${action.id}:props:${Object.keys(action.props).sort().join(',')}`
      const next = { ...target, props } as Block
      return commit(state, blocks.map(block => (block === target ? next : block)), state.selectedId, key)
    }
    case 'select':
      return { ...state, selectedId: keepSelection(state.page, action.id), coalesceKey: null }
    case 'load':
      return commit(state, action.page.blocks, null)
    case 'reset':
      if (blocks.length === 0) return state
      return commit(state, [], null)
    case 'undo': {
      const previous = state.past[state.past.length - 1]
      if (!previous) return state
      return { page: previous, selectedId: keepSelection(previous, state.selectedId), past: state.past.slice(0, -1), future: [state.page, ...state.future], coalesceKey: null }
    }
    case 'redo': {
      const next = state.future[0]
      if (!next) return state
      return { page: next, selectedId: keepSelection(next, state.selectedId), past: [...state.past, state.page].slice(-HISTORY_LIMIT), future: state.future.slice(1), coalesceKey: null }
    }
  }
}
