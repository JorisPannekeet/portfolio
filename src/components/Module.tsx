import { useId, type CSSProperties, type ReactNode } from 'react'
import type { Entry } from '@/lib/mech'

type Tag = 'section' | 'article' | 'header' | 'aside' | 'figure' | 'li' | 'div'

interface ModuleProps {
  as?: Tag
  entry?: Entry
  tone?: 'armor' | 'frame'
  hatch?: 'split' | 'diagonal'
  stencil?: string
  decal?: string
  title?: string
  vent?: boolean
  className?: string
  style?: CSSProperties
  children: ReactNode
}

function Bolts() {
  return (
    <span className="bolts" aria-hidden="true">
      <i className="bolt" /><i className="bolt" /><i className="bolt" /><i className="bolt" />
    </span>
  )
}

function Hatch({ kind, stencil }: { kind: 'split' | 'diagonal'; stencil?: string }) {
  return (
    <span className={`hatch hatch--${kind}`} aria-hidden="true">
      <span className="hatch__plate hatch__plate--a on-armor">
        {stencil && <span className="hatch__stencil"><span>{stencil}</span></span>}
        <span className="decal hatch__decal">HATCH A // SEALED</span>
        <span className="vent hatch__vent" />
        <i className="bolt hatch__bolt" /><i className="bolt hatch__bolt" />
        <i className="hatch__lip" />
      </span>
      <span className="hatch__plate hatch__plate--b on-armor">
        {stencil && <span className="hatch__stencil"><span>{stencil}</span></span>}
        <span className="hazard hatch__hazard" />
        <i className="bolt hatch__bolt" /><i className="bolt hatch__bolt" />
        <i className="hatch__lip" />
        <i className="hatch__latch" /><i className="hatch__latch" />
      </span>
    </span>
  )
}

export function Module({
  as: Tag = 'section',
  entry = 'rise',
  tone = 'armor',
  hatch,
  stencil,
  decal,
  title,
  vent,
  className = '',
  style,
  children,
}: ModuleProps) {
  const id = useId()
  return (
    <Tag
      className={`module module--${tone} on-${tone} ${className}`}
      style={style}
      data-module=""
      data-entry={entry}
      data-hatch={hatch && 'open'}
      aria-labelledby={title ? id : undefined}
    >
      {tone === 'armor' && <span className="module__bevel" aria-hidden="true" />}
      {tone === 'frame' && <span className="module__bloom" aria-hidden="true" data-lit="" />}
      {hatch && <span className="hatch__bloom" aria-hidden="true" />}
      <Bolts />
      {decal && <span className="decal module__decal" aria-hidden="true" data-lit="">{decal}</span>}
      {vent && <span className="vent module__vent" aria-hidden="true" />}
      <div className="module__body">
        {title && <h2 id={id} className="module__title">{title}</h2>}
        {children}
      </div>
      {hatch && <Hatch kind={hatch} stencil={stencil} />}
    </Tag>
  )
}
