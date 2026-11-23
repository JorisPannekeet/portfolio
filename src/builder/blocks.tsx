import { useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronDown, ImageIcon, Mail } from 'lucide-react'
import { GlassButton } from '@/components/liquid-glass/glass-button'
import { cn } from '@/lib/utils'
import { safeUrl, type BlockOf } from './model'
import { caseStudies, content, experiences, games, howIWork, projects, stories, type RichNode } from './sources'

export function Column({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-[760px] px-5 py-[var(--block-pad)] @2xl:px-8', className)}>{children}</div>
}

function SmartLink({ href, children, ...rest }: { href: string; className?: string; children: ReactNode }) {
  const url = safeUrl(href)
  if (!url) return <span {...rest}>{children}</span>
  if (url.startsWith('/')) return <Link to={url} {...rest}>{children}</Link>
  const external = !url.startsWith('mailto:')
  return (
    <a href={url} {...rest} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
      {children}
    </a>
  )
}

const focusRing = 'rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-block-accent focus-visible:ring-offset-2 focus-visible:ring-offset-block'

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-b-xs font-semibold tracking-[0.08em] text-block-accent uppercase">{children}</p>
}

function Title({ children, as: Tag = 'h2' }: { children: ReactNode; as?: 'h1' | 'h2' | 'h3' }) {
  return <Tag className="text-b-2xl font-semibold tracking-tight text-balance">{children}</Tag>
}

function Tags({ tags }: { tags: readonly string[] }) {
  return (
    <ul className="block-row mt-5" aria-label="Tags">
      {tags.map(tag => (
        <li key={tag} className="rounded-full border border-block-line px-2.5 py-0.5 text-b-xs font-medium text-block-muted">{tag}</li>
      ))}
    </ul>
  )
}

function Pill({ href, children }: { href: string; children: ReactNode }) {
  return (
    <SmartLink
      href={href}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-block-line px-3.5 py-1.5 text-b-sm font-medium transition-colors duration-150 hover:border-block-accent hover:text-block-accent',
        focusRing,
      )}
    >
      {children}
    </SmartLink>
  )
}

function SocialLinks({ withEmail }: { withEmail: boolean }) {
  const { links } = content
  return (
    <div className="block-row mt-7">
      <Pill href={links.linkedin}>LinkedIn <ArrowUpRight className="size-3.5" aria-hidden /></Pill>
      <Pill href={links.github}>GitHub <ArrowUpRight className="size-3.5" aria-hidden /></Pill>
      <Pill href={links.x}>X <ArrowUpRight className="size-3.5" aria-hidden /></Pill>
      {withEmail && <Pill href={`mailto:${links.email}`}><Mail className="size-3.5" aria-hidden /> Email</Pill>}
    </div>
  )
}

function Rich({ nodes }: { nodes: readonly RichNode[] }) {
  return (
    <div className="mt-5 first:mt-0">
      {nodes.map((node, i) => {
        if (node.kind === 'h3') return <h3 key={i} className="mt-8 text-b-lg font-semibold first:mt-0">{node.text}</h3>
        if (node.kind === 'p') return <p key={i} className="measure mt-4 text-b-base whitespace-pre-line text-block-muted first:mt-0">{node.text}</p>
        return (
          <ul key={i} className="measure mt-4 space-y-2.5 text-left first:mt-0">
            {node.items.map(item => (
              <li key={item.text} className="relative pl-5 text-b-base text-block-muted before:absolute before:top-[0.72em] before:left-0.5 before:size-1.5 before:rounded-full before:bg-block-accent">
                {item.lead && <strong className="font-semibold text-block-fg">{item.lead}</strong>}
                {item.lead && ' — '}
                {item.text}
              </li>
            ))}
          </ul>
        )
      })}
    </div>
  )
}

function textNodes(text: string): RichNode[] {
  const nodes: RichNode[] = []
  let lines: string[] = []
  let items: string[] = []
  const flush = () => {
    if (lines.length) nodes.push({ kind: 'p', text: lines.join('\n') })
    if (items.length) nodes.push({ kind: 'ul', items: items.map(item => ({ text: item })) })
    lines = []
    items = []
  }
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (line === '') flush()
    else if (line.startsWith('- ')) {
      if (lines.length) flush()
      items.push(line.slice(2))
    } else {
      if (items.length) flush()
      lines.push(line)
    }
  }
  flush()
  return nodes
}

export function HeroBlock({ block }: { block: BlockOf<'hero'> }) {
  const centered = block.style.align === 'center'
  const { hero } = content
  return (
    <Column>
      <div className={cn('flex flex-col gap-8', centered ? 'items-center' : '@xl:flex-row @xl:items-center @xl:gap-10')}>
        {block.props.photo === 'show' && (
          <img
            src="/me.jpeg"
            alt="Joris Pannekeet"
            width={1000}
            height={1200}
            className="size-28 shrink-0 rounded-2xl object-cover object-[40%_30%] shadow-sm ring-1 ring-block-line @xl:size-40"
          />
        )}
        <div className="min-w-0">
          <Eyebrow>{hero.role}</Eyebrow>
          <h1 className="text-b-3xl font-semibold tracking-tight text-balance">{hero.greeting}</h1>
          <p className="measure mt-5 text-b-lg text-block-muted">{hero.intro}</p>
          <SocialLinks withEmail />
        </div>
      </div>
    </Column>
  )
}

export function SkillsBlock() {
  const max = Math.max(...content.skillTabs.flatMap(tab => tab.skills.map(skill => skill.years)))
  return (
    <Column>
      <Title>Skills</Title>
      <div className="mt-8 grid gap-10 text-left @xl:grid-cols-2">
        {content.skillTabs.map(tab => (
          <section key={tab.label}>
            <h3 className="mb-4 text-b-xs font-semibold tracking-[0.08em] text-block-accent uppercase">{tab.label}</h3>
            <ul className="space-y-3.5">
              {tab.skills.map(skill => (
                <li key={skill.name} className="grid grid-cols-[minmax(0,7.5rem)_1fr_3.25rem] items-center gap-3">
                  <span className="truncate text-b-sm font-medium">{skill.name}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-block-line" aria-hidden>
                    <span className="block h-full rounded-full bg-block-accent" style={{ width: `${(skill.years / max) * 100}%` }} />
                  </span>
                  <span className="text-right text-b-xs text-block-muted tabular-nums">{skill.years} {skill.years === 1 ? 'yr' : 'yrs'}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Column>
  )
}

export function ExperienceBlock({ block }: { block: BlockOf<'experience'> }) {
  const item = experiences.find(entry => entry.id === block.ref)
  if (!item) return null
  const centered = block.style.align === 'center'
  return (
    <Column>
      <div className={cn('grid gap-2', !centered && '@xl:grid-cols-[11rem_1fr] @xl:gap-8')}>
        <p className="pt-1.5 text-b-sm text-block-muted tabular-nums">{item.period}</p>
        <div>
          <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2', centered ? 'justify-center' : 'justify-between')}>
            <h3 className="text-b-xl font-semibold tracking-tight">{item.title}</h3>
            {item.type && <span className="rounded-full bg-block-soft px-2.5 py-0.5 text-b-xs font-medium text-block-muted ring-1 ring-block-line">{item.type}</span>}
          </div>
          <p className="mt-1 text-b-base">
            <span className="font-medium text-block-accent">{item.company}</span>
            {item.location && <span className="text-block-muted"> · {item.location}</span>}
          </p>
          {item.description && <p className="measure mt-3 text-b-base text-block-muted">{item.description}</p>}
        </div>
      </div>
    </Column>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h3 className="text-b-lg font-semibold tracking-tight">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Label({ children }: { children: ReactNode }) {
  return <span className="mr-2 text-b-xs font-semibold tracking-[0.08em] text-block-fg uppercase">{children}</span>
}

function CaseStudyDetails({ study }: { study: (typeof caseStudies)[number] }) {
  return (
    <div className="text-left">
      <Section title="Context"><Rich nodes={textNodes(study.context)} /></Section>
      <Section title="The problem"><Rich nodes={textNodes(study.problem)} /></Section>
      {study.constraints.length > 0 && (
        <Section title="Constraints"><Rich nodes={[{ kind: 'ul', items: study.constraints.map(text => ({ text })) }]} /></Section>
      )}
      {study.architecturalDecisions.length > 0 && (
        <Section title="Architectural decisions">
          <div className="space-y-4">
            {study.architecturalDecisions.map(decision => (
              <article key={decision.title} className="rounded-xl border border-block-line bg-block-soft p-5">
                <h4 className="text-b-base font-semibold">{decision.title}</h4>
                <p className="mt-2 text-b-sm text-block-muted"><Label>Decision</Label>{decision.decision}</p>
                <p className="mt-2 text-b-sm text-block-muted"><Label>Rationale</Label>{decision.rationale}</p>
              </article>
            ))}
          </div>
        </Section>
      )}
      {study.tradeoffs.length > 0 && (
        <Section title="Trade-offs">
          <div className="divide-y divide-block-line">
            {study.tradeoffs.map(tradeoff => (
              <div key={tradeoff.choice} className="py-4 first:pt-0 last:pb-0">
                <h4 className="text-b-base font-semibold">{tradeoff.choice}</h4>
                <p className="measure mt-1 text-b-sm text-block-muted">{tradeoff.tradeoff}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
      {study.result && (
        <Section title="Result">
          <div className="rounded-xl border-l-2 border-block-accent bg-block-soft px-5 py-4"><Rich nodes={textNodes(study.result)} /></div>
        </Section>
      )}
      {study.codeSnippets.length > 0 && (
        <Section title="Code examples">
          <p className="text-b-sm text-block-muted italic">{content.codeDisclaimer}</p>
          {study.codeSnippets.map(snippet => (
            <figure key={snippet.title} className="mt-5 overflow-hidden rounded-xl border border-block-line">
              <figcaption className="flex items-center justify-between gap-3 border-b border-block-line bg-block-soft px-4 py-2.5 text-b-sm font-medium">
                <span>{snippet.title}</span>
                <span className="font-mono text-b-xs text-block-muted">{snippet.language}</span>
              </figcaption>
              <pre className="overflow-x-auto p-4 font-mono text-[0.8125rem] leading-relaxed" tabIndex={0}><code>{snippet.code}</code></pre>
              {snippet.explanation && <p className="border-t border-block-line px-4 py-3 text-b-sm text-block-muted">{snippet.explanation}</p>}
            </figure>
          ))}
        </Section>
      )}
      {study.diagrams && study.diagrams.length > 0 && (
        <Section title="Diagrams">
          {study.diagrams.map(diagram => (
            <div key={diagram.title} className="mt-5 first:mt-0">
              <h4 className="text-b-base font-semibold">{diagram.title}</h4>
              <p className="mt-1 text-b-sm text-block-muted">{diagram.description}</p>
              <div className="mt-3 rounded-xl border border-dashed border-block-line px-5 py-6 text-center font-mono text-b-xs leading-relaxed text-block-muted">{diagram.placeholder}</div>
            </div>
          ))}
        </Section>
      )}
    </div>
  )
}

export function CaseStudyBlock({ block }: { block: BlockOf<'caseStudy'> }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const study = caseStudies.find(entry => entry.slug === block.ref)
  if (!study) return null
  const full = block.props.detail === 'full'
  return (
    <Column>
      <Eyebrow>{study.company} · {study.year}</Eyebrow>
      <Title>{study.title}</Title>
      <p className="measure mt-3 text-b-lg text-block-fg/85">{study.subtitle}</p>
      <Tags tags={study.tags} />
      <p className="measure mt-5 text-b-base text-block-muted">{study.summary}</p>
      {full ? (
        <div className="mt-10 border-t border-block-line pt-10"><CaseStudyDetails study={study} /></div>
      ) : (
        <>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen(value => !value)}
            className={cn('mt-6 inline-flex items-center gap-1.5 text-b-sm font-semibold text-block-accent', focusRing)}
          >
            {open ? 'Hide the full case study' : 'Read the full case study'}
            <ChevronDown className={cn('size-4 transition-transform duration-200 motion-reduce:transition-none', open && 'rotate-180')} aria-hidden />
          </button>
          <div id={panelId} hidden={!open} className="mt-8 border-t border-block-line pt-8">
            {open && <CaseStudyDetails study={study} />}
          </div>
        </>
      )}
    </Column>
  )
}

function Showcase({ eyebrow, title, pitch, tags, image, width, height, href, cta }: {
  eyebrow: string
  title: string
  pitch: string
  tags: readonly string[]
  image: string
  width: number
  height: number
  href: string
  cta: string
}) {
  return (
    <Column>
      <img src={image} alt="" width={width} height={height} loading="lazy" className="h-auto w-full rounded-xl object-cover shadow-sm ring-1 ring-block-line" />
      <div className="mt-7">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h3 className="text-b-xl font-semibold tracking-tight">{title}</h3>
        <p className="measure mt-2 text-b-base text-block-muted">{pitch}</p>
        <Tags tags={tags} />
        <SmartLink href={href} className={cn('mt-6 inline-flex items-center gap-1 text-b-sm font-semibold text-block-accent hover:underline hover:underline-offset-4', focusRing)}>
          {cta} <ArrowUpRight className="size-4" aria-hidden />
        </SmartLink>
      </div>
    </Column>
  )
}

export function ProjectBlock({ block }: { block: BlockOf<'project'> }) {
  const project = projects.find(entry => entry.key === block.ref)
  if (!project) return null
  return <Showcase eyebrow="Side project" title={project.title} pitch={project.pitch} tags={project.tags} image={project.image} width={1400} height={738} href={project.url} cta={`Visit ${new URL(project.url).hostname}`} />
}

export function GameBlock({ block }: { block: BlockOf<'game'> }) {
  const game = games.find(entry => entry.key === block.ref)
  if (!game) return null
  return <Showcase eyebrow="Game" title={game.title} pitch={game.pitch} tags={game.tags} image={game.image} width={1280} height={720} href={game.href} cta="Play it in your browser" />
}

export function ApproachBlock() {
  return (
    <Column>
      <Title>My approach</Title>
      <div className="mt-8 grid gap-8 @2xl:grid-cols-3 @2xl:gap-6">
        {content.approach.map((item, i) => (
          <div key={item.title} className="border-t border-block-line pt-5">
            <p className="text-b-xs font-semibold text-block-accent tabular-nums">{String(i + 1).padStart(2, '0')}</p>
            <h3 className="mt-2 text-b-lg font-semibold tracking-tight">{item.title}</h3>
            <p className="mt-2 text-b-sm text-block-muted">{item.text}</p>
          </div>
        ))}
      </div>
    </Column>
  )
}

export function TechStackBlock() {
  return (
    <Column>
      <Title>Tech stack</Title>
      <div className="mt-8 grid gap-7 @xl:grid-cols-2">
        {content.about.techStack.map(group => (
          <section key={group.category}>
            <h3 className="text-b-sm font-semibold">{group.category}</h3>
            <ul className="block-row mt-3">
              {group.items.map(item => (
                <li key={item} className="rounded-md bg-block-soft px-2.5 py-1 text-b-sm text-block-fg ring-1 ring-block-line">{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Column>
  )
}

function ArticleBlock({ title, body }: { title: string; body: readonly RichNode[] }) {
  return (
    <Column>
      <Title>{title}</Title>
      <Rich nodes={body} />
    </Column>
  )
}

export function StoryBlock({ block }: { block: BlockOf<'story'> }) {
  const story = stories.find(entry => entry.key === block.ref)
  return story ? <ArticleBlock title={story.title} body={story.body} /> : null
}

export function HowIWorkBlock({ block }: { block: BlockOf<'howIWork'> }) {
  const section = howIWork.find(entry => entry.key === block.ref)
  return section ? <ArticleBlock title={section.title} body={section.body} /> : null
}

export function PassionsBlock() {
  return (
    <Column>
      <Title>Beyond work</Title>
      <Rich nodes={[{ kind: 'ul', items: content.about.passions.map(passion => ({ text: passion.label })) }]} />
    </Column>
  )
}

export function ContactBlock() {
  const { connect } = content.about
  return (
    <Column>
      <Title>{connect.title}</Title>
      <Rich nodes={connect.body} />
      <p className="mt-6">
        <SmartLink href={`mailto:${content.links.email}`} className={cn('text-b-xl font-semibold tracking-tight break-all text-block-accent hover:underline hover:underline-offset-4', focusRing)}>
          {content.links.email}
        </SmartLink>
      </p>
      <SocialLinks withEmail={false} />
    </Column>
  )
}

const HEADING_SIZE = { '1': 'text-b-3xl', '2': 'text-b-2xl', '3': 'text-b-xl' } as const

export function HeadingBlock({ block }: { block: BlockOf<'heading'> }) {
  const Tag = `h${block.props.level}` as const
  return (
    <Column>
      <Tag className={cn('font-semibold tracking-tight text-balance break-words', HEADING_SIZE[block.props.level])}>{block.props.text}</Tag>
    </Column>
  )
}

export function TextBlock({ block }: { block: BlockOf<'text'> }) {
  return (
    <Column>
      <p className="measure text-b-base break-words whitespace-pre-line">{block.props.text}</p>
    </Column>
  )
}

export function ButtonBlock({ block }: { block: BlockOf<'button'> }) {
  return (
    <Column>
      <div className="block-row">
        <GlassButton key={block.style.accent + block.style.background} asChild material="tinted" size="lg" className="bg-block-accent text-b-sm text-block-on-accent">
          <SmartLink href={block.props.url}>{block.props.label}</SmartLink>
        </GlassButton>
      </div>
    </Column>
  )
}

export function ImageBlock({ block }: { block: BlockOf<'image'> }) {
  const src = safeUrl(block.props.src)
  return (
    <Column>
      {src ? (
        <img src={src} alt={block.props.alt} loading="lazy" className="h-auto w-full rounded-xl object-cover ring-1 ring-block-line" />
      ) : (
        <div className="grid aspect-video place-items-center rounded-xl border border-dashed border-block-line text-block-muted">
          <span className="flex flex-col items-center gap-2 text-b-sm"><ImageIcon className="size-6" aria-hidden />Add an image URL</span>
        </div>
      )}
    </Column>
  )
}

export function DividerBlock() {
  return (
    <Column>
      <hr className="border-block-line" />
    </Column>
  )
}

const SPACER = { sm: '2rem', md: '4rem', lg: '8rem' } as const

export function SpacerBlock({ block }: { block: BlockOf<'spacer'> }) {
  return <div aria-hidden style={{ height: SPACER[block.props.size] }} />
}
