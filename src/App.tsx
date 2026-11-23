import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'

const Builder = lazy(() => import('./builder/Builder'))
const Preview = lazy(() => import('./builder/Preview'))
const Play = lazy(() => import('./pages/Play').then(m => ({ default: m.Play })))
const Rpg = lazy(() => import('./pages/Rpg').then(m => ({ default: m.Rpg })))

function PageLoader() {
  return <div className="h-dvh bg-background" aria-busy="true" />
}

export default function App() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/play" element={<Play />} />
          <Route path="/rpg" element={<Rpg />} />
          <Route path="/preview" element={<Preview />} />
          <Route path="*" element={<Builder />} />
        </Routes>
      </Suspense>
      <Analytics />
    </>
  )
}
