import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Eye, GripVertical, Plus, Redo2, RotateCcw, Undo2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { CANVAS_ID, Canvas, Hint } from './Canvas'
import { Inspector } from './Inspector'
import { Palette, type DragData } from './Palette'
import { starterPage } from './presets'
import { isRenderable, paletteKey, type PaletteItem } from './registry'
import { createBlock, initialState, reduce } from './model'
import { readPage, writePage } from './storage'

const collision: CollisionDetection = args => (args.pointerCoordinates ? pointerWithin(args) : rectIntersection(args))

function loadInitial(): ReturnType<typeof initialState> {
  const page = readPage()
  return initialState({ version: 1, blocks: page.blocks.filter(isRenderable) })
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || target.matches('input, textarea, select') || target.closest('[role="dialog"], [role="listbox"], [data-radix-popper-content-wrapper]') !== null
}

function pointerY(event: DragMoveEvent): number | null {
  const start = event.activatorEvent
  if (start instanceof MouseEvent) return start.clientY + event.delta.y
  if (typeof TouchEvent !== 'undefined' && start instanceof TouchEvent) {
    const touch = start.touches[0] ?? start.changedTouches[0]
    return touch ? touch.clientY + event.delta.y : null
  }
  const rect = event.active.rect.current.translated
  return rect ? rect.top + rect.height / 2 : null
}

function labelOf(data: unknown): string {
  const drag = data as DragData | undefined
  if (!drag) return 'block'
  return drag.kind === 'palette' ? drag.item.label : drag.label
}

const announcements: Announcements = {
  onDragStart: ({ active }) => `Picked up ${labelOf(active.data.current)}.`,
  onDragOver: ({ active, over }) => (over ? `${labelOf(active.data.current)} is over the page.` : `${labelOf(active.data.current)} is outside the page.`),
  onDragEnd: ({ active, over }) => (over ? `Dropped ${labelOf(active.data.current)} on the page.` : `${labelOf(active.data.current)} was not placed.`),
  onDragCancel: ({ active }) => `Cancelled moving ${labelOf(active.data.current)}.`,
}

export default function Builder() {
  const [state, dispatch] = useReducer(reduce, undefined, loadInitial)
  const [drag, setDrag] = useState<DragData | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const scrollRef = useRef<HTMLElement | null>(null)
  const lastProbe = useRef<number | null>(null)
  const revealId = useRef<string | null>(null)
  const blocks = state.page.blocks
  const selected = blocks.find(block => block.id === state.selectedId) ?? null
  const usedKeys = useMemo(() => new Set(blocks.map(paletteKey)), [blocks])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  useEffect(() => writePage(state.page), [state.page])

  useEffect(() => {
    const id = revealId.current
    if (!id || state.selectedId !== id) return
    revealId.current = null
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    scrollRef.current?.querySelector(`[data-block-id="${id}"]`)?.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' })
  }, [state.selectedId])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return
      const mod = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()
      if (mod && key === 'z') {
        event.preventDefault()
        dispatch({ type: event.shiftKey ? 'redo' : 'undo' })
      } else if (mod && key === 'y') {
        event.preventDefault()
        dispatch({ type: 'redo' })
      } else if (mod && key === 'd' && state.selectedId) {
        event.preventDefault()
        dispatch({ type: 'duplicate', id: state.selectedId, newId: crypto.randomUUID() })
      } else if ((event.key === 'Delete' || event.key === 'Backspace') && state.selectedId && !mod) {
        event.preventDefault()
        dispatch({ type: 'remove', id: state.selectedId })
      } else if (event.key === 'Escape' && state.selectedId && !drag) {
        dispatch({ type: 'select', id: null })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.selectedId, drag])

  const addItem = (item: PaletteItem, index = blocks.length) => {
    const block = createBlock(item.type, crypto.randomUUID(), item.ref)
    revealId.current = block.id
    dispatch({ type: 'add', block, index })
  }

  const gapAt = useCallback((y: number): number => {
    const elements = scrollRef.current?.querySelectorAll<HTMLElement>('[data-block-id]') ?? []
    let index = 0
    for (const element of elements) {
      const rect = element.getBoundingClientRect()
      if (y < rect.top + rect.height / 2) return index
      index++
    }
    return index
  }, [])

  const updateDrop = useCallback(
    (y: number | null, overCanvas: boolean, data: DragData | null) => {
      lastProbe.current = y
      if (!overCanvas || y === null || !data) return setDropIndex(null)
      const gap = gapAt(y)
      if (data.kind === 'block') {
        const from = blocks.findIndex(block => block.id === data.id)
        if (gap === from || gap === from + 1) return setDropIndex(null)
      }
      setDropIndex(gap)
    },
    [blocks, gapAt],
  )

  useEffect(() => {
    const scroller = scrollRef.current
    if (!drag || !scroller) return
    const onScroll = () => {
      if (dropIndex !== null) updateDrop(lastProbe.current, true, drag)
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [drag, dropIndex, updateDrop])

  const endDrag = () => {
    setDrag(null)
    setDropIndex(null)
    lastProbe.current = null
  }

  const loadStarter = () => dispatch({ type: 'load', page: starterPage() })
  const empty = blocks.length === 0

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-3 sm:px-4">
          <img src="/me.jpeg" alt="" width={32} height={32} className="size-8 shrink-0 rounded-full object-cover object-[40%_30%] ring-1 ring-border" />
          <div className="flex min-w-0 items-baseline gap-2">
            <h1 className="truncate text-sm font-semibold">Joris Pannekeet</h1>
            <p className="hidden truncate text-sm text-muted-foreground md:block">Senior Fullstack Engineer</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Hint label="Undo">
              <Button type="button" variant="ghost" size="icon" aria-label="Undo" disabled={state.past.length === 0} onClick={() => dispatch({ type: 'undo' })}>
                <Undo2 />
              </Button>
            </Hint>
            <Hint label="Redo">
              <Button type="button" variant="ghost" size="icon" aria-label="Redo" disabled={state.future.length === 0} onClick={() => dispatch({ type: 'redo' })}>
                <Redo2 />
              </Button>
            </Hint>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" disabled={empty} aria-label="Start over" className="max-sm:size-8 max-sm:px-0">
                  <RotateCcw />
                  <span className="max-sm:sr-only">Start over</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Start over?</AlertDialogTitle>
                  <AlertDialogDescription>This removes every block from your page. You can still undo it afterwards.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep my page</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={() => dispatch({ type: 'reset' })}>Clear page</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="mx-1 h-5 w-px bg-border" />
            <a
              href="/preview"
              target="_blank"
              rel="noopener"
              aria-disabled={empty || undefined}
              tabIndex={empty ? -1 : undefined}
              onClick={event => empty && event.preventDefault()}
              className={cn(buttonVariants(), empty && 'pointer-events-none opacity-50')}
            >
              <Eye />
              Preview
            </a>
          </div>
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={collision}
          accessibility={{ announcements, screenReaderInstructions: { draggable: 'To pick up a block, press space or enter. Use the arrow keys to move it, then press space or enter again to drop it, or escape to cancel.' } }}
          onDragStart={(event: DragStartEvent) => setDrag((event.active.data.current as DragData | undefined) ?? null)}
          onDragMove={event => updateDrop(pointerY(event), event.over?.id === CANVAS_ID, drag)}
          onDragOver={event => updateDrop(lastProbe.current, event.over?.id === CANVAS_ID, drag)}
          onDragCancel={endDrag}
          onDragEnd={event => {
            if (drag && event.over?.id === CANVAS_ID) {
              const index = empty ? 0 : dropIndex
              if (index !== null && drag.kind === 'palette') addItem(drag.item, index)
              if (index !== null && drag.kind === 'block') {
                dispatch({ type: 'move', id: drag.id, index })
                dispatch({ type: 'select', id: drag.id })
              }
            }
            endDrag()
          }}
        >
          <div className="flex min-h-0 flex-1">
            <aside aria-label="Components" className="hidden w-72 shrink-0 flex-col border-r bg-background lg:flex">
              <div className="px-4 pt-4 pb-2">
                <h2 className="text-sm font-semibold">Components</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Drag onto the page, or click to add.</p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <Palette usedKeys={usedKeys} draggable onPick={item => addItem(item)} />
              </div>
            </aside>

            <Canvas
              blocks={blocks}
              selectedId={state.selectedId}
              dropIndex={dropIndex}
              dragging={drag !== null}
              scrollRef={scrollRef}
              dispatch={dispatch}
              onStyle={() => setInspectorOpen(true)}
              onBuild={loadStarter}
            />

            <aside aria-label="Inspector" className="hidden w-80 shrink-0 overflow-y-auto border-l bg-background lg:block">
              <Inspector key={selected?.id} block={selected} dispatch={dispatch} />
            </aside>
          </div>

          <DragOverlay dropAnimation={null}>
            {drag && (
              <div className="flex w-max cursor-grabbing items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium shadow-lg ring-1 ring-[var(--selection)]/30">
                {drag.kind === 'palette' ? <drag.item.icon className="size-4 text-muted-foreground" aria-hidden /> : <GripVertical className="size-4 text-muted-foreground" aria-hidden />}
                {drag.kind === 'palette' ? drag.item.label : drag.label}
              </div>
            )}
          </DragOverlay>
        </DndContext>

        <Button type="button" onClick={() => setPaletteOpen(true)} className="fixed bottom-5 left-1/2 z-30 h-11 -translate-x-1/2 rounded-full px-5 shadow-lg lg:hidden">
          <Plus />
          Add block
        </Button>

        <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
          <SheetContent side="bottom" className="max-h-[80dvh] gap-0 rounded-t-2xl lg:hidden">
            <SheetHeader className="pb-2">
              <SheetTitle>Add a block</SheetTitle>
              <SheetDescription>Tap a block to add it to the end of your page.</SheetDescription>
            </SheetHeader>
            <div className="min-h-0 overflow-y-auto">
              <Palette
                usedKeys={usedKeys}
                draggable={false}
                onPick={item => {
                  addItem(item)
                  setPaletteOpen(false)
                }}
              />
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={inspectorOpen && selected !== null} onOpenChange={setInspectorOpen}>
          <SheetContent side="right" className="w-[min(22rem,92vw)] gap-0 overflow-y-auto p-0 lg:hidden">
            <SheetHeader className="sr-only">
              <SheetTitle>Style block</SheetTitle>
              <SheetDescription>Change the content and style of the selected block.</SheetDescription>
            </SheetHeader>
            <Inspector key={selected?.id} block={selected} dispatch={dispatch} />
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  )
}
