import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const BUDGET_BYTES = 124 * 1024
const PAGES = { Play: 'src/pages/Play.tsx', Rpg: 'src/pages/Rpg.tsx' }
const kb = bytes => (bytes / 1024).toFixed(1)

const out = mkdtempSync(join(tmpdir(), 'budget-'))
try {
  execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--manifest', '--outDir', out, '--emptyOutDir', '--logLevel', 'error'], { stdio: 'inherit' })
  const manifest = JSON.parse(readFileSync(join(out, '.vite/manifest.json'), 'utf8'))

  function collect(key, files) {
    const chunk = manifest[key]
    if (!chunk || chunk.isEntry) return
    files.add(chunk.file)
    for (const css of chunk.css ?? []) files.add(css)
    for (const next of chunk.imports ?? []) collect(next, files)
  }

  for (const [page, source] of Object.entries(PAGES)) {
    if (!manifest[source]) {
      console.error(`${source} is not a chunk in the build`)
      process.exitCode = 1
      continue
    }
    const files = new Set()
    collect(source, files)
    const sizes = [...files].map(file => [file.replace('assets/', ''), gzipSync(readFileSync(join(out, file))).length])
    const total = sizes.reduce((sum, [, size]) => sum + size, 0)
    console.log(`${page}: ${kb(total)} KB gzipped of ${kb(BUDGET_BYTES)} KB, app shell excluded (${sizes.map(([name, size]) => `${name} ${kb(size)}`).join(', ')})`)
    if (total > BUDGET_BYTES) process.exitCode = 1
  }
} finally {
  rmSync(out, { recursive: true, force: true })
}
