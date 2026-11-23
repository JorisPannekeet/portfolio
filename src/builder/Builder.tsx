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
  type DropAnimation,
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
import { Canvas, Hint } from './Canvas'
import { Inspector } from './Inspector'
import { CSS } from '@dnd-kit/utilities'
import { CARD, ItemBody, Palette, type DragData } from './Palette'
import { EASE, launch, reducedMotion, type Landing, type Origin } from './motion'
import { starterPage } from './presets'
import { isRenderable, paletteKey, type PaletteItem } from './registry'
import { createBlock, initialState, reduce } from './model'
import { readPage, writePage } from './storage'

const LIFT = 'origin-center scale-[1.03] -rotate-2 transition-[scale,rotate] duration-200 ease-snap starting:scale-100 starting:rotate-0 motion-reduce:scale-100 motion-reduce:rotate-0 motion-reduce:transition-none'

const collision: CollisionDetection = args => (args.pointerCoordinates ? pointerWithin(args) : rectIntersection(args))

function loadInitial(): ReturnType<typeof initialState> {
  const page = readPage()
  return initialState({ version: 1, blocks: page.blocks.filter(isRenderable) })
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || target.matches('input, textarea, select') || target.closest('[role="dialog"], [role="listbox"], [data-radix-popper-content-wrapper]') !== null
}

type Point = { x: number; y: number }

function pointerAt(event: DragMoveEvent, pointer: Point | null): Point | null {
  if (pointer && !(event.activatorEvent instanceof KeyboardEvent)) return pointer
  const rect = event.active.rect.current.translated
  return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null
}

function locate(scroller: HTMLElement | null, point: Point): number | null {
  if (!scroller) return null
  const view = scroller.getBoundingClientRect()
  if (point.x < view.left || point.x > view.right || point.y < view.top || point.y > view.bottom) return null
  const x = point.x - view.left + scroller.scrollLeft
  const y = point.y - view.top + scroller.scrollTop
  let index = 0
  for (const element of scroller.querySelectorAll<HTMLElement>('[data-block-id]')) {
    const stacked = element.offsetWidth > (element.parentElement?.clientWidth ?? 0) - 2
    if (y < element.offsetTop) return index
    const before = stacked ? y < element.offsetTop + element.offsetHeight / 2 : x < element.offsetLeft + element.offsetWidth / 2
    if (y <= element.offsetTop + element.offsetHeight && before) return index
    index++
  }
  return index
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
  const [drop, setDrop] = useState<number | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const scrollRef = useRef<HTMLElement | null>(null)
  const lastProbe = useRef<Point | null>(null)
  const pointer = useRef<Point | null>(null)
  const revealId = useRef<string | null>(null)
  const landing = useRef<Landing | null>(null)
  const placed = useRef(false)
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
    const track = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY }
    }
    window.addEventListener('pointermove', track, { passive: true })
    return () => window.removeEventListener('pointermove', track)
  }, [])

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

  const addItem = (item: PaletteItem, index = blocks.length, origin?: Origin) => {
    const block = createBlock(item.type, crypto.randomUUID(), item.ref)
    revealId.current = block.id
    landing.current = origin ? { ...origin, id: block.id } : null
    dispatch({ type: 'add', block, index })
  }

  const updateDrop = useCallback(
    (point: Point | null, data: DragData | null) => {
      lastProbe.current = point
      const next = point && data ? locate(scrollRef.current, point) : null
      if (next !== null && data?.kind === 'block') {
        const from = blocks.findIndex(block => block.id === data.id)
        if (next === from || next === from + 1) return setDrop(null)
      }
      setDrop(next)
    },
    [blocks],
  )

  useEffect(() => {
    const scroller = scrollRef.current
    if (!drag || !scroller) return
    const onScroll = () => {
      updateDrop(lastProbe.current, drag)
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [drag, updateDrop])

  const endDrag = () => {
    setDrag(null)
    setDrop(null)
    lastProbe.current = null
  }

  const dropAnimation: DropAnimation = ({ dragOverlay, transform }) => {
    if (reducedMotion()) return
    const card = dragOverlay.node.firstElementChild
    const settled = placed.current
      ? card?.animate([{ opacity: 1 }, { opacity: 0, scale: '1', rotate: '0deg' }], { duration: 180, easing: EASE, fill: 'forwards' })
      : dragOverlay.node.animate([{ transform: CSS.Transform.toString(transform) }, { transform: 'translate3d(0px, 0px, 0)' }], {
          duration: Math.min(Math.max(Math.hypot(transform.x, transform.y) / 4, 160), 280),
          easing: EASE,
          fill: 'forwards',
        })
    return settled?.finished.then(() => undefined)
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
          onDragMove={event => updateDrop(pointerAt(event, pointer.current), drag)}
          onDragCancel={endDrag}
          onDragEnd={event => {
            placed.current = false
            if (drag) {
              const index = drop
              const slot = scrollRef.current?.querySelector('[data-drop-placeholder]')?.getBoundingClientRect()
              const from = slot ?? event.active.rect.current.translated
              placed.current = index !== null
              if (index !== null && drag.kind === 'palette') addItem(drag.item, index, from ? { from, solid: slot !== undefined } : undefined)
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
              <div className="relative min-h-0 flex-1 overflow-y-auto">
                <Palette usedKeys={usedKeys} draggable onPick={(item, source) => addItem(item, blocks.length, launch(source, CARD))} />
              </div>
            </aside>

            <Canvas
              blocks={blocks}
              selectedId={state.selectedId}
              drop={drop}
              drag={drag}
              scrollRef={scrollRef}
              landing={landing}
              dispatch={dispatch}
              onStyle={() => setInspectorOpen(true)}
              onBuild={loadStarter}
            />

            <aside aria-label="Inspector" className="relative hidden w-80 shrink-0 overflow-y-auto border-l bg-background lg:block">
              <Inspector key={selected?.id} block={selected} dispatch={dispatch} />
            </aside>
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {drag?.kind === 'palette' && (
              <div className={cn(CARD, LIFT, 'size-full cursor-grabbing')}>
                <ItemBody item={drag.item} used={false} />
              </div>
            )}
            {drag?.kind === 'block' && (
              <div className={cn(LIFT, 'flex w-max cursor-grabbing items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium shadow-lg ring-1 ring-[var(--selection)]/30')}>
                <GripVertical className="size-4 text-muted-foreground" aria-hidden />
                {drag.label}
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
            <div className="relative min-h-0 overflow-y-auto">
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
