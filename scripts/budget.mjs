import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, extname, join } from 'node:path'
import { gzipSync } from 'node:zlib'

const BUDGET_BYTES = 124 * 1024
const PAGES = { Play: 'src/pages/Play.tsx', Rpg: 'src/pages/Rpg.tsx' }
const LAZY = { 'Rpg art': { page: 'src/pages/Rpg.tsx', source: 'src/rpg/render/renderer.ts', budget: 250 * 1024 } }
const kb = bytes => (bytes / 1024).toFixed(1)

const out = mkdtempSync(join(tmpdir(), 'budget-'))
try {
  execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--manifest', '--outDir', out, '--emptyOutDir', '--logLevel', 'error'], { stdio: 'inherit' })
  const manifest = JSON.parse(readFileSync(join(out, '.vite/manifest.json'), 'utf8'))

  function chunkKey(source) {
    if (manifest[source]) return source
    const name = basename(source, extname(source))
    return Object.keys(manifest).find(key => manifest[key].isDynamicEntry && manifest[key].name === name)
  }

  function collect(key, files) {
    const chunk = manifest[key]
    if (!chunk || chunk.isEntry) return
    files.add(chunk.file)
    for (const css of chunk.css ?? []) files.add(css)
    for (const next of chunk.imports ?? []) collect(next, files)
  }

  function report(name, files, budget) {
    const sizes = [...files].map(file => [file.replace('assets/', ''), gzipSync(readFileSync(join(out, file))).length])
    const total = sizes.reduce((sum, [, size]) => sum + size, 0)
    console.log(`${name}: ${kb(total)} KB gzipped of ${kb(budget)} KB (${sizes.map(([file, size]) => `${file} ${kb(size)}`).join(', ')})`)
    if (total > budget) process.exitCode = 1
  }

  const pageFiles = {}
  for (const [page, source] of Object.entries(PAGES)) {
    const key = chunkKey(source)
    if (!key) {
      console.error(`${source} is not a chunk in the build`)
      process.exitCode = 1
      continue
    }
    const files = new Set()
    collect(key, files)
    pageFiles[source] = files
    report(`${page}, app shell excluded`, files, BUDGET_BYTES)
  }

  for (const [name, { page, source, budget }] of Object.entries(LAZY)) {
    if (!manifest[source] || !manifest[chunkKey(page)]?.dynamicImports?.includes(source)) {
      console.error(`${source} is not a lazy chunk of ${page}`)
      process.exitCode = 1
      continue
    }
    const files = new Set()
    collect(source, files)
    for (const file of pageFiles[page] ?? []) files.delete(file)
    report(`${name}, beyond what the page already loaded`, files, budget)
  }
} finally {
  rmSync(out, { recursive: true, force: true })
}
