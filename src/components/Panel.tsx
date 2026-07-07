import { useId, type ReactNode } from 'react'

interface PanelProps {
  code: string
  title: string
  meta?: ReactNode
  children: ReactNode
  className?: string
}

/** Armor-plate section: chamfered plate, ink lining, stencil section code. */
export function Panel({ code, title, meta, children, className = '' }: PanelProps) {
  const id = useId()
  return (
    <section className={`cut panel ${className}`} aria-labelledby={id} data-reveal>
      <header className="panel__head">
        <div>
          <span className="stencil panel__code" aria-hidden="true">{code}</span>
          <h2 id={id}>{title}</h2>
        </div>
        {meta}
      </header>
      {children}
    </section>
  )
}
