import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'

const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })))
const CaseStudies = lazy(() => import('./pages/CaseStudies').then(m => ({ default: m.CaseStudies })))
const CaseStudyDetail = lazy(() => import('./pages/CaseStudyDetail').then(m => ({ default: m.CaseStudyDetail })))
const HowIWork = lazy(() => import('./pages/HowIWork').then(m => ({ default: m.HowIWork })))
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })))

function PageLoader() {
  return (
    <div className="container" style={{ paddingBlock: 80 }}>
      <span className="stencil">SYSTEM BOOT // LOADING…</span>
    </div>
  )
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/case-studies" element={<CaseStudies />} />
          <Route path="/case-studies/:slug" element={<CaseStudyDetail />} />
          <Route path="/how-i-work" element={<HowIWork />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
