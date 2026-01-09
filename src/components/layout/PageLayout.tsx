import { type ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'

interface PageLayoutProps {
  children: ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="fixed inset-0 bg-gradient-radial from-stone-900 via-stone-950 to-stone-950 pointer-events-none" />
      <div className="fixed inset-0 bg-noise opacity-[0.02] pointer-events-none" />
      
      <Header />
      <main id="main-content" className="flex-1 pt-24 pb-16 relative">
        {children}
      </main>
      <Footer />
    </div>
  )
}
