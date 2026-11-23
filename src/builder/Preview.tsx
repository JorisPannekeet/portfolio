import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, PencilLine } from 'lucide-react'
import { GlassButton } from '@/components/liquid-glass/glass-button'
import { buttonVariants } from '@/components/ui/button'
import { PageRenderer } from './PageRenderer'
import { isRenderable } from './registry'
import { useSavedPage } from './storage'

export default function Preview() {
  const page = useSavedPage()
  const blocks = page.blocks.filter(isRenderable)

  useEffect(() => {
    const previous = document.title
    document.title = 'Joris Pannekeet | Portfolio'
    return () => {
      document.title = previous
    }
  }, [])

  if (blocks.length === 0) {
    return (
      <main className="grid min-h-dvh place-items-center bg-neutral-50 px-6">
        <div className="max-w-sm text-center">
          <img src="/me.jpeg" alt="" width={64} height={64} className="mx-auto size-16 rounded-full object-cover object-[40%_30%] shadow-sm ring-4 ring-background" />
          <h1 className="mt-5 text-lg font-semibold">Nothing to preview yet</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Add a few blocks in the builder and this page fills itself in, live, while you edit.</p>
          <Link to="/" className={buttonVariants({ className: 'mt-6' })}>
            <ArrowLeft />
            Open the builder
          </Link>
        </div>
      </main>
    )
  }

  return (
    <>
      <main>
        <PageRenderer blocks={blocks} />
      </main>
      <GlassButton asChild tint={0.5} className="fixed right-4 bottom-4 z-50 pr-4 pl-1.5 text-xs">
        <Link to="/">
          <img src="/me.jpeg" alt="" width={28} height={28} className="size-7 rounded-full object-cover object-[40%_30%]" />
          <span>Built with Joris' page builder</span>
          <span className="opacity-50" aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <PencilLine aria-hidden />
            Edit
          </span>
        </Link>
      </GlassButton>
    </>
  )
}
