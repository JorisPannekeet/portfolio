import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { PageLayout } from '@/components/layout'

const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })))
const CaseStudies = lazy(() => import('./pages/CaseStudies').then(m => ({ default: m.CaseStudies })))
const CaseStudyDetail = lazy(() => import('./pages/CaseStudyDetail').then(m => ({ default: m.CaseStudyDetail })))
const HowIWork = lazy(() => import('./pages/HowIWork').then(m => ({ default: m.HowIWork })))
const Components = lazy(() => import('./pages/Components').then(m => ({ default: m.Components })))
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })))

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-sm text-neutral-500">Loading...</div>
    </div>
  )
}

export default function App() {
  return (
    <PageLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/case-studies" element={<CaseStudies />} />
          <Route path="/case-studies/:slug" element={<CaseStudyDetail />} />
          <Route path="/how-i-work" element={<HowIWork />} />
          <Route path="/components" element={<Components />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>
    </PageLayout>
  )
}
