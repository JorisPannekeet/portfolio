import { useState, type Dispatch, type ReactNode } from 'react'
import { AlignCenter, AlignLeft, MousePointerClick } from 'lucide-react'
import { HexColorPicker } from 'react-colorful'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { Hint } from './Canvas'
import { FONT_STACKS } from './PageRenderer'
import { STYLE_PRESETS } from './presets'
import { blockName, registry } from './registry'
import { FONTS, fieldsOf, safeUrl, type Action, type Block, type BlockStyle, type Field } from './model'

const HEX = /^#[0-9a-f]{6}$/i
const FONT_LABELS: Record<BlockStyle['font'], string> = { sans: 'Geist', serif: 'Fraunces', display: 'Space Grotesk', mono: 'JetBrains Mono', hand: 'Caveat' }
const WIDTH_OPTIONS = [
  { value: '1', label: '1/4', name: 'One quarter' },
  { value: '2', label: '2/4', name: 'Half' },
  { value: '3', label: '3/4', name: 'Three quarters' },
  { value: '4', label: '4/4', name: 'Full width' },
] as const

const SCALE_OPTIONS = [
  { value: 'sm', label: 'S', name: 'Small' },
  { value: 'md', label: 'M', name: 'Medium' },
  { value: 'lg', label: 'L', name: 'Large' },
] as const

function Row({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={htmlFor} className="text-[13px] font-normal text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function Segmented({ label, value, options, onChange }: { label: string; value: string; options: readonly { value: string; label: ReactNode; name: string }[]; onChange: (value: string) => void }) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      spacing={0}
      value={value}
      aria-label={label}
      onValueChange={next => next && onChange(next)}
    >
      {options.map(option => (
        <ToggleGroupItem key={option.value} value={option.value} aria-label={option.name} className="min-w-9 data-[state=on]:bg-foreground data-[state=on]:text-background hover:data-[state=on]:bg-foreground/90 hover:data-[state=on]:text-background">
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <Row label={label}>
      <Popover onOpenChange={() => setDraft(null)}>
        <PopoverTrigger className="flex h-8 w-[7.5rem] items-center gap-2 rounded-lg border bg-background px-1.5 text-left font-mono text-xs uppercase outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50" aria-label={`${label} color, ${value}`}>
          <span className="size-5 shrink-0 rounded-md ring-1 ring-black/10 ring-inset" style={{ background: value }} />
          {value}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-60 gap-3">
          <HexColorPicker color={value} onChange={onChange} aria-label={`${label} color picker`} className="!h-40 !w-full" />
          <Input
            value={draft ?? value}
            spellCheck={false}
            aria-label={`${label} hex value`}
            aria-invalid={draft !== null && !HEX.test(draft)}
            onChange={event => {
              const next = event.target.value.trim()
              setDraft(next)
              if (HEX.test(next)) onChange(next.toLowerCase())
            }}
            onBlur={() => setDraft(null)}
            className="font-mono uppercase"
          />
        </PopoverContent>
      </Popover>
    </Row>
  )
}

function FieldControl({ id, name, field, value, onChange }: { id: string; name: string; field: Field; value: string; onChange: (value: string) => void }) {
  if (field.kind === 'choice') {
    return (
      <Row label={field.label}>
        <Segmented label={field.label} value={value} options={field.options.map(option => ({ ...option, name: option.label }))} onChange={onChange} />
      </Row>
    )
  }
  const inputId = `${id}-${name}`
  const invalidUrl = field.kind === 'url' && value !== '' && safeUrl(value) === null
  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId} className="text-[13px] font-normal text-muted-foreground">{field.label}</Label>
      {field.kind === 'longText' ? (
        <Textarea id={inputId} value={value} maxLength={field.max} rows={6} onChange={event => onChange(event.target.value)} className="resize-y text-sm" />
      ) : (
        <Input id={inputId} value={value} maxLength={field.max} inputMode={field.kind === 'url' ? 'url' : undefined} aria-invalid={invalidUrl} aria-describedby={invalidUrl ? `${inputId}-hint` : undefined} onChange={event => onChange(event.target.value)} />
      )}
      {invalidUrl && <p id={`${inputId}-hint`} className="text-xs text-destructive">Use a link that starts with https://, mailto: or /</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3.5 border-t px-4 py-5">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  )
}

export function Inspector({ block, dispatch }: { block: Block | null; dispatch: Dispatch<Action> }) {
  if (!block) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <span className="grid size-12 place-items-center rounded-xl border bg-muted/50 text-muted-foreground">
          <MousePointerClick className="size-5" aria-hidden />
        </span>
        <p className="text-sm font-medium">Select a block to style it</p>
        <p className="text-xs leading-relaxed text-muted-foreground">Click any block on the page to change its content, colors and typography.</p>
      </div>
    )
  }
  const entry = registry[block.type]
  const Icon = entry.icon
  const style = block.style
  const props: Record<string, string> = block.props
  const fields = fieldsOf(block.type)
  const patch = (next: Partial<BlockStyle>) => dispatch({ type: 'patchStyle', id: block.id, style: next })
  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-4">
        <span className="grid size-8 shrink-0 place-items-center rounded-md border bg-background text-muted-foreground shadow-xs">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{blockName(block)}</h2>
          {entry.refs && <p className="text-xs text-muted-foreground">{entry.label}</p>}
        </div>
      </div>
      {fields.length > 0 && (
        <Section title="Content">
          {fields.map(([name, field]) => (
            <FieldControl key={name} id={block.id} name={name} field={field} value={props[name] ?? ''} onChange={value => dispatch({ type: 'patchProps', id: block.id, props: { [name]: value } })} />
          ))}
        </Section>
      )}
      <Section title="Style">
        <div className="grid grid-cols-6 gap-1.5" role="group" aria-label="Color presets">
          {STYLE_PRESETS.map(preset => {
            const active = preset.background === style.background && preset.text === style.text && preset.accent === style.accent
            return (
              <Hint key={preset.name} label={preset.name}>
                <button
                  type="button"
                  aria-label={`${preset.name} preset`}
                  aria-pressed={active}
                  onClick={() => patch({ background: preset.background, text: preset.text, accent: preset.accent })}
                  className={cn(
                    'relative grid aspect-square place-items-center rounded-lg text-[13px] font-semibold ring-1 ring-black/10 outline-none transition-transform duration-150 ring-inset hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none',
                    active && 'ring-2 ring-[var(--selection)] ring-offset-2 ring-offset-background',
                  )}
                  style={{ background: preset.background, color: preset.text }}
                >
                  Aa
                  <span className="absolute right-1 bottom-1 size-1.5 rounded-full" style={{ background: preset.accent }} />
                </button>
              </Hint>
            )
          })}
        </div>
        <ColorControl label="Background" value={style.background} onChange={background => patch({ background })} />
        <ColorControl label="Text" value={style.text} onChange={text => patch({ text })} />
        <ColorControl label="Accent" value={style.accent} onChange={accent => patch({ accent })} />
        <Row label="Font" htmlFor={`${block.id}-font`}>
          <Select value={style.font} onValueChange={font => patch({ font: font as BlockStyle['font'] })}>
            <SelectTrigger id={`${block.id}-font`} size="sm" className="w-[9.5rem]" style={{ fontFamily: FONT_STACKS[style.font] }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map(font => (
                <SelectItem key={font} value={font} style={{ fontFamily: FONT_STACKS[font] }} className={font === 'hand' ? 'text-base' : undefined}>
                  {FONT_LABELS[font]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <Row label="Width">
          <Segmented label="Width" value={style.width} options={WIDTH_OPTIONS} onChange={width => patch({ width: width as BlockStyle['width'] })} />
        </Row>
        <Row label="Size">
          <Segmented label="Size" value={style.size} options={SCALE_OPTIONS} onChange={size => patch({ size: size as BlockStyle['size'] })} />
        </Row>
        <Row label="Alignment">
          <Segmented
            label="Alignment"
            value={style.align}
            options={[
              { value: 'left', label: <AlignLeft />, name: 'Align left' },
              { value: 'center', label: <AlignCenter />, name: 'Align center' },
            ]}
            onChange={align => patch({ align: align as BlockStyle['align'] })}
          />
        </Row>
        <Row label="Padding">
          <Segmented label="Padding" value={style.padding} options={SCALE_OPTIONS} onChange={padding => patch({ padding: padding as BlockStyle['padding'] })} />
        </Row>
      </Section>
    </div>
  )
}
