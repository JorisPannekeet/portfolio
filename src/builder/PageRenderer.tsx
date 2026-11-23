import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { registry, isRenderable } from './registry'
import type { Block, BlockStyle } from './model'

export const FONT_STACKS: Record<BlockStyle['font'], string> = {
  sans: "'Geist', ui-sans-serif, system-ui, sans-serif",
  serif: "'Fraunces', ui-serif, Georgia, serif",
  display: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
  hand: "'Caveat', cursive",
}

const SCALE = { sm: 0.9, md: 1, lg: 1.12 } as const
const PADDING = { sm: 'clamp(1.75rem, 5cqi, 2.5rem)', md: 'clamp(2.75rem, 9cqi, 4.5rem)', lg: 'clamp(4rem, 13cqi, 7rem)' } as const

function luminance(hex: string): number {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

export function blockVars(style: BlockStyle): CSSProperties {
  return {
    '--block-bg': style.background,
    '--block-fg': style.text,
    '--block-accent': style.accent,
    '--block-on-accent': luminance(style.accent) > 0.4 ? '#0a0a0a' : '#ffffff',
    '--block-font': FONT_STACKS[style.font],
    '--block-scale': SCALE[style.size] * (style.font === 'hand' ? 1.2 : 1),
    '--block-pad': PADDING[style.padding],
    '--block-align': style.align,
    '--block-justify': style.align === 'center' ? 'center' : 'flex-start',
    '--block-inline': style.align === 'center' ? 'auto' : '0',
    '--span': style.width,
    textAlign: style.align,
  } as CSSProperties
}

export const SPAN = 'col-span-4 @xl/page:[grid-column:span_var(--span)]'

export function PageGrid({ children }: { children: ReactNode }) {
  return (
    <div className="@container/page">
      <div className="grid grid-cols-4">{children}</div>
    </div>
  )
}

export function BlockView({ block, className }: { block: Block; className?: string }) {
  const { Render } = registry[block.type] as { Render: (props: { block: Block }) => ReactNode }
  return (
    <section className={cn('@container min-w-0 bg-block font-block text-block-fg antialiased [overflow-wrap:anywhere]', (block.type === 'heading' || block.type === 'button') && 'content-center', className)} style={blockVars(block.style)}>
      <Render block={block} />
    </section>
  )
}

export function PageRenderer({ blocks }: { blocks: readonly Block[] }) {
  return (
    <PageGrid>
      {blocks.filter(isRenderable).map(block => (
        <BlockView key={block.id} block={block} className={SPAN} />
      ))}
    </PageGrid>
  )
}
