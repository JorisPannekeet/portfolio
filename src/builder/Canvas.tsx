import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type Dispatch, type MouseEvent, type ReactNode, type RefObject } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { ArrowDown, ArrowUp, Copy, GripVertical, Paintbrush, Sparkles, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { GlassButton } from '@/components/liquid-glass/glass-button'
import { GlassButtonGroup, GlassButtonGroupItem } from '@/components/liquid-glass/glass-button-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { BlockView, PageGrid, SPAN } from './PageRenderer'
import { blockName } from './registry'
import type { Action, Block } from './model'
import type { DragData } from './Palette'
import { appear, fade, land, reducedMotion, slide, type Landing } from './motion'

export const CANVAS_ID = 'canvas'

const FRAME_CORNERS = {
  tl: 'rounded-tl-[calc(var(--radius-xl)-1px)]',
  tr: 'rounded-tr-[calc(var(--radius-xl)-1px)]',
  bl: 'rounded-bl-[calc(var(--radius-xl)-1px)]',
  br: 'rounded-br-[calc(var(--radius-xl)-1px)]',
}

function frameCorners(frame: HTMLElement): Record<string, string> {
  const outer = frame.getBoundingClientRect()
  const near = (a: number, b: number) => Math.abs(a - b) < 2
  const corners: Record<string, string> = {}
  for (const element of frame.querySelectorAll<HTMLElement>('[data-block-id]')) {
    const rect = element.getBoundingClientRect()
    const top = near(rect.top, outer.top)
    const bottom = near(rect.bottom, outer.bottom)
    const left = near(rect.left, outer.left)
    const right = near(rect.right, outer.right)
    const classes = cn(top && left && FRAME_CORNERS.tl, top && right && FRAME_CORNERS.tr, bottom && left && FRAME_CORNERS.bl, bottom && right && FRAME_CORNERS.br)
    if (classes) corners[element.dataset.blockId ?? ''] = classes
  }
  return corners
}

export function Hint({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function ToolButton({ label, onClick, disabled, children, className }: { label: string; onClick?: () => void; disabled?: boolean; children: ReactNode; className?: string }) {
  return (
    <Hint label={label}>
      <GlassButtonGroupItem aria-label={label} disabled={disabled} onClick={onClick} className={cn('!px-0', className)}>
        {children}
      </GlassButtonGroupItem>
    </Hint>
  )
}

function DragHandle({ block }: { block: Block }) {
  const label = blockName(block)
  const { attributes, listeners, setNodeRef } = useDraggable({ id: `block:${block.id}`, data: { kind: 'block', id: block.id, label } satisfies DragData })
  const handle = { ref: setNodeRef, ...attributes, ...listeners }
  return (
    <Hint label="Drag to move">
      <GlassButtonGroupItem {...handle} aria-label={`Move ${label}`} className="cursor-grab touch-none !px-0 active:cursor-grabbing">
        <GripVertical />
      </GlassButtonGroupItem>
    </Hint>
  )
}

function CanvasBlock({ block, index, count, selected, dragging, moving, corners, dispatch, onStyle }: {
  block: Block
  index: number
  count: number
  selected: boolean
  dragging: boolean
  moving: boolean
  corners: string | undefined
  dispatch: Dispatch<Action>
  onStyle: () => void
}) {
  const name = blockName(block)
  return (
    <div
      data-block-id={block.id}
      tabIndex={0}
      role="group"
      aria-label={name}
      aria-current={selected || undefined}
      className={cn('group/block relative min-w-0 outline-none transition-opacity duration-150', moving && 'opacity-40', SPAN)}
      style={{ '--span': block.style.width } as CSSProperties}
      onFocus={() => {
        if (!selected) dispatch({ type: 'select', id: block.id })
      }}
      onClick={event => {
        event.stopPropagation()
        if (!selected) dispatch({ type: 'select', id: block.id })
      }}
    >
      <BlockView block={block} className="h-full" />
      <div
        className={cn(
          'pointer-events-none absolute inset-0 z-10 transition-shadow duration-150',
          corners,
          selected ? 'shadow-[inset_0_0_0_2px_var(--selection)]' : !dragging && 'group-hover/block:shadow-[inset_0_0_0_1px_var(--selection)]',
        )}
      >
        <span
          className={cn(
            'absolute top-0 left-0 rounded-br-md bg-[var(--selection)] px-2 py-0.5 text-[11px] font-medium text-white opacity-0 transition-opacity duration-150',
            selected ? 'opacity-100' : !dragging && 'group-hover/block:opacity-100',
          )}
        >
          {name}
        </span>
        {selected && (
          <div className="sticky top-3 flex justify-end px-3 pt-3">
            <GlassButtonGroup role="toolbar" aria-label={`${name} actions`} material="clear" className="pointer-events-auto" onClick={event => event.stopPropagation()}>
              <DragHandle block={block} />
              <ToolButton label="Move earlier" disabled={index === 0} onClick={() => dispatch({ type: 'move', id: block.id, index: index - 1 })}>
                <ArrowUp />
              </ToolButton>
              <ToolButton label="Move later" disabled={index === count - 1} onClick={() => dispatch({ type: 'move', id: block.id, index: index + 2 })}>
                <ArrowDown />
              </ToolButton>
              <ToolButton label="Duplicate" onClick={() => dispatch({ type: 'duplicate', id: block.id, newId: crypto.randomUUID() })}>
                <Copy />
              </ToolButton>
              <ToolButton label="Style" onClick={onStyle} className="lg:hidden">
                <Paintbrush />
              </ToolButton>
              <ToolButton label="Delete" onClick={() => dispatch({ type: 'remove', id: block.id })} className="text-red-500">
                <Trash2 />
              </ToolButton>
            </GlassButtonGroup>
          </div>
        )}
      </div>
    </div>
  )
}

const PLACEHOLDER = 'drop-placeholder'

function DropPlaceholder({ drag, span }: { drag: DragData; span: string }) {
  const Icon = drag.kind === 'palette' ? drag.item.icon : GripVertical
  return (
    <div data-drop-placeholder aria-hidden className={cn('min-w-0 p-2', SPAN)} style={{ '--span': span } as CSSProperties}>
      <div className="flex h-full min-h-20 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--selection)]/50 bg-[var(--selection)]/5 px-3 text-sm font-medium text-[var(--selection)]">
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{drag.kind === 'palette' ? drag.item.label : drag.label}</span>
      </div>
    </div>
  )
}

function Arrow() {
  return (
    <div className="relative hidden w-36 shrink-0 self-center lg:block" aria-hidden>
      <span className="absolute -top-7 left-2 -rotate-6 font-hand text-xl leading-none whitespace-nowrap text-muted-foreground">they're over there</span>
      <svg viewBox="0 0 150 70" className="w-full overflow-visible text-muted-foreground/80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M142 46 C 118 12, 70 6, 40 26 S 14 52, 8 56" />
        <path d="M8 56 L 21 53" />
        <path d="M8 56 L 12 43" />
      </svg>
    </div>
  )
}

function EmptyState({ onBuild }: { onBuild: () => void }) {
  return (
    <div className="flex min-h-[inherit] flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="flex items-center gap-4">
        <Arrow />
        <img src="/me.jpeg" alt="" width={72} height={72} className="size-[72px] shrink-0 self-start rounded-full object-cover object-[40%_30%] shadow-sm ring-4 ring-background" />
        <p className="relative max-w-xs rounded-2xl rounded-tl-sm border bg-background px-5 py-4 text-[15px] leading-relaxed text-foreground shadow-sm">
          Hey, welcome to my portfolio! It's a bit empty here… Why not start by dragging some blocks over?
        </p>
      </div>
      <GlassButton material="tinted" size="lg" icon={<Sparkles />} iconPosition="start" onClick={onBuild} className="bg-neutral-900 text-white">
        Or let me build it for you
      </GlassButton>
    </div>
  )
}

function useBlockMotion(frameRef: RefObject<HTMLElement | null>, scrollRef: RefObject<HTMLElement | null>, landing: RefObject<Landing | null>, layout: string) {
  const positions = useRef<Map<string, { x: number; y: number }> | null>(null)
  const lastLayout = useRef(layout)
  useLayoutEffect(() => {
    if (!frameRef.current) return
    const elements = [...frameRef.current.querySelectorAll<HTMLElement>('[data-block-id], [data-drop-placeholder]')]
    const idOf = (element: HTMLElement) => element.dataset.blockId ?? PLACEHOLDER
    const before = positions.current
    const now = new Map(elements.map(element => [idOf(element), { x: element.offsetLeft, y: element.offsetTop }]))
    positions.current = now
    const changed = lastLayout.current !== layout
    lastLayout.current = layout
    if (!before || !changed) return
    const origin = landing.current
    landing.current = null
    const reduced = reducedMotion()
    let entering = 0
    let landed = false
    for (const element of elements) {
      const id = idOf(element)
      const from = before.get(id)
      const to = now.get(id)
      if (!from) {
        if (reduced) fade(element)
        else if (origin?.id === id) {
          landed = true
          land(element, origin, scrollRef.current)
        } else appear(element, entering++)
      } else if (!reduced && to && (from.x !== to.x || from.y !== to.y)) slide(element, from.x - to.x, from.y - to.y)
    }
    if (!landed) origin?.ghost?.remove()
  })
}

export function Canvas({ blocks, selectedId, drop, drag, scrollRef, landing, dispatch, onStyle, onBuild }: {
  blocks: readonly Block[]
  selectedId: string | null
  drop: number | null
  drag: DragData | null
  scrollRef: RefObject<HTMLElement | null>
  landing: RefObject<Landing | null>
  dispatch: Dispatch<Action>
  onStyle: () => void
  onBuild: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: CANVAS_ID })
  const frameRef = useRef<HTMLDivElement>(null)
  const [corners, setCorners] = useState<Record<string, string>>({})
  const [exit, setExit] = useState('')
  const [asking, setAsking] = useState(false)
  useBlockMotion(frameRef, scrollRef, landing, `${blocks.map(block => `${block.id}:${block.style.width}`).join()}|${drop}`)
  const measure = useCallback(() => {
    if (!frameRef.current) return
    const next = frameCorners(frameRef.current)
    setCorners(previous => (JSON.stringify(previous) === JSON.stringify(next) ? previous : next))
  }, [])
  useLayoutEffect(measure)
  useEffect(() => {
    if (!frameRef.current) return
    const observer = new ResizeObserver(measure)
    observer.observe(frameRef.current)
    return () => observer.disconnect()
  }, [measure])
  const moved = drag?.kind === 'block' ? blocks.find(block => block.id === drag.id) : undefined
  const cells = blocks.map((block, index) => (
    <CanvasBlock
      key={block.id}
      block={block}
      index={index}
      count={blocks.length}
      selected={block.id === selectedId}
      dragging={drag !== null}
      moving={block === moved}
      corners={corners[block.id]}
      dispatch={dispatch}
      onStyle={onStyle}
    />
  ))
  if (drag && drop !== null) cells.splice(drop, 0, <DropPlaceholder key={PLACEHOLDER} drag={drag} span={moved?.style.width ?? '4'} />)
  const deselect = (event: MouseEvent) => {
    if (event.target === event.currentTarget) dispatch({ type: 'select', id: null })
  }
  return (
    <main
      ref={scrollRef}
      aria-label="Page canvas"
      onClick={deselect}
      className="relative min-w-0 flex-1 overflow-y-auto bg-neutral-100 bg-[radial-gradient(circle,var(--color-neutral-300)_1px,transparent_1.2px)] [background-size:18px_18px]"
    >
      <div ref={setNodeRef} onClick={deselect} className="mx-auto min-h-full max-w-[900px] px-3 pt-4 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-16">
        <div
          ref={frameRef}
          onClickCapture={event => {
            const link = (event.target as Element).closest('a')
            if (!link) return
            event.preventDefault()
            if (link.origin === window.location.origin) return void window.open(link.href, '_blank', 'noopener')
            setExit(link.href)
            setAsking(true)
          }}
          className={cn(
            'min-h-[calc(100dvh-8rem)] overflow-clip rounded-xl border bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-8px_rgb(0_0_0/0.08)] transition-shadow duration-150',
            blocks.length === 0 && isOver && 'shadow-[0_0_0_2px_var(--selection)]',
          )}
        >
          {blocks.length === 0 ? (
            <EmptyState onBuild={onBuild} />
          ) : (
            <PageGrid>{cells}</PageGrid>
          )}
        </div>
      </div>
      <AlertDialog open={asking} onOpenChange={setAsking}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You're leaving jorispannekeet.dev</AlertDialogTitle>
            <AlertDialogDescription>
              This link goes to <span className="font-medium break-all text-foreground">{exit.replace(/^mailto:/, '')}</span>. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay here</AlertDialogCancel>
            <AlertDialogAction asChild>
              <a href={exit} target={exit.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer">
                Continue
              </a>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
