import { useDraggable } from '@dnd-kit/core'
import { Check, ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { palette, type PaletteItem } from './registry'

export type DragData = { kind: 'palette'; item: PaletteItem } | { kind: 'block'; id: string; label: string }

function Item({ item, used, draggable, onPick }: { item: PaletteItem; used: boolean; draggable: boolean; onPick: (item: PaletteItem) => void }) {
  const { listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${item.key}`,
    data: { kind: 'palette', item } satisfies DragData,
    disabled: !draggable,
  })
  const Icon = item.icon
  return (
    <li>
      <button
        ref={setNodeRef}
        type="button"
        {...listeners}
        onKeyDown={undefined}
        onClick={() => onPick(item)}
        className={cn(
          'group flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
          draggable && 'cursor-grab active:cursor-grabbing',
          isDragging && 'opacity-50',
        )}
      >
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border bg-background text-muted-foreground shadow-xs transition-colors group-hover:text-foreground">
          <Icon className="size-3.5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[13px] font-medium leading-5">
            <span className="truncate">{item.label}</span>
            {used && (
              <span className="shrink-0 text-emerald-600" title="On your page">
                <Check className="size-3.5" aria-hidden />
                <span className="sr-only">(on your page)</span>
              </span>
            )}
          </span>
          <span className="block truncate text-xs leading-4 text-muted-foreground">{item.description}</span>
        </span>
      </button>
    </li>
  )
}

export function Palette({ usedKeys, draggable, onPick }: { usedKeys: ReadonlySet<string>; draggable: boolean; onPick: (item: PaletteItem) => void }) {
  return (
    <div className="space-y-1 px-2 pb-6">
      {palette.map(({ group, items }) => (
        <Collapsible key={group} defaultOpen>
          <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
            {group}
            <ChevronDown className="size-3.5 transition-transform duration-150 group-data-[state=closed]:-rotate-90 motion-reduce:transition-none" aria-hidden />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="space-y-0.5">
              {items.map(item => (
                <Item key={item.key} item={item} used={usedKeys.has(item.key)} draggable={draggable} onPick={onPick} />
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  )
}
