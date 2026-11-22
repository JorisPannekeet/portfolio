import type { Dispatch, MouseEvent, ReactNode, RefObject } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { ArrowDown, ArrowUp, Copy, GripVertical, Paintbrush, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { BlockView } from './PageRenderer'
import { blockName } from './registry'
import type { Action, Block } from './model'
import type { DragData } from './Palette'

export const CANVAS_ID = 'canvas'

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
      <Button type="button" variant="ghost" size="icon-sm" aria-label={label} disabled={disabled} onClick={onClick} className={className}>
        {children}
      </Button>
    </Hint>
  )
}

function DragHandle({ block }: { block: Block }) {
  const label = blockName(block)
  const { attributes, listeners, setNodeRef } = useDraggable({ id: `block:${block.id}`, data: { kind: 'block', id: block.id, label } satisfies DragData })
  return (
    <Hint label="Drag to move">
      <Button ref={setNodeRef} type="button" variant="ghost" size="icon-sm" {...attributes} {...listeners} aria-label={`Move ${label}`} className="cursor-grab touch-none active:cursor-grabbing">
        <GripVertical />
      </Button>
    </Hint>
  )
}

function CanvasBlock({ block, index, count, selected, dragging, dispatch, onStyle }: {
  block: Block
  index: number
  count: number
  selected: boolean
  dragging: boolean
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
      className="group/block relative outline-none"
      onFocus={() => {
        if (!selected) dispatch({ type: 'select', id: block.id })
      }}
      onClick={event => {
        event.stopPropagation()
        if (!selected) dispatch({ type: 'select', id: block.id })
      }}
    >
      <BlockView block={block} />
      <div
        className={cn(
          'pointer-events-none absolute inset-0 z-10 transition-shadow duration-150',
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
            <div
              role="toolbar"
              aria-label={`${name} actions`}
              className="pointer-events-auto flex items-center gap-0.5 rounded-lg border bg-background p-0.5 text-foreground shadow-md animate-in fade-in-0 zoom-in-95 duration-150 motion-reduce:animate-none"
              onClick={event => event.stopPropagation()}
            >
              <DragHandle block={block} />
              <ToolButton label="Move up" disabled={index === 0} onClick={() => dispatch({ type: 'move', id: block.id, index: index - 1 })}>
                <ArrowUp />
              </ToolButton>
              <ToolButton label="Move down" disabled={index === count - 1} onClick={() => dispatch({ type: 'move', id: block.id, index: index + 2 })}>
                <ArrowDown />
              </ToolButton>
              <ToolButton label="Duplicate" onClick={() => dispatch({ type: 'duplicate', id: block.id, newId: crypto.randomUUID() })}>
                <Copy />
              </ToolButton>
              <ToolButton label="Style" onClick={onStyle} className="lg:hidden">
                <Paintbrush />
              </ToolButton>
              <ToolButton label="Delete" onClick={() => dispatch({ type: 'remove', id: block.id })} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 />
              </ToolButton>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const LINE_OFFSET = { start: 'top-[3px]', middle: '-top-px', end: '-top-[5px]' } as const

function DropLine({ edge }: { edge: keyof typeof LINE_OFFSET }) {
  return (
    <div className="relative z-20 h-0" aria-hidden>
      <div
        className={cn(
          'absolute inset-x-2 h-0.5 rounded-full bg-[var(--selection)] before:absolute before:-top-[3px] before:-left-1 before:size-2 before:rounded-full before:border-2 before:border-[var(--selection)] before:bg-background after:absolute after:-top-[3px] after:-right-1 after:size-2 after:rounded-full after:border-2 after:border-[var(--selection)] after:bg-background',
          LINE_OFFSET[edge],
        )}
      />
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
      <Button type="button" variant="ghost" onClick={onBuild} className="text-muted-foreground">
        <Sparkles />
        Or let me build it for you
      </Button>
    </div>
  )
}

export function Canvas({ blocks, selectedId, dropIndex, dragging, scrollRef, dispatch, onStyle, onBuild }: {
  blocks: readonly Block[]
  selectedId: string | null
  dropIndex: number | null
  dragging: boolean
  scrollRef: RefObject<HTMLElement | null>
  dispatch: Dispatch<Action>
  onStyle: () => void
  onBuild: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: CANVAS_ID })
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
          onClickCapture={event => {
            if ((event.target as Element).closest('a')) event.preventDefault()
          }}
          className={cn(
            'min-h-[calc(100dvh-8rem)] overflow-clip rounded-xl border bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-8px_rgb(0_0_0/0.08)] transition-shadow duration-150',
            blocks.length === 0 && isOver && 'shadow-[0_0_0_2px_var(--selection)]',
          )}
        >
          {blocks.length === 0 ? (
            <EmptyState onBuild={onBuild} />
          ) : (
            <>
              {blocks.map((block, index) => (
                <div key={block.id}>
                  {dropIndex === index && <DropLine edge={index === 0 ? 'start' : 'middle'} />}
                  <CanvasBlock
                    block={block}
                    index={index}
                    count={blocks.length}
                    selected={block.id === selectedId}
                    dragging={dragging}
                    dispatch={dispatch}
                    onStyle={onStyle}
                  />
                </div>
              ))}
              {dropIndex === blocks.length && <DropLine edge="end" />}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
