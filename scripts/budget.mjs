import { readdirSync, readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const BUDGET_BYTES = 124 * 1024
const dir = 'dist/assets'
const files = readdirSync(dir).filter(name => /^Play-.*\.(js|css)$/.test(name))

if (files.length === 0) {
  console.error('No Play chunk in dist/assets. Run `npm run build` first.')
  process.exit(1)
}

const total = files.reduce((sum, name) => sum + gzipSync(readFileSync(`${dir}/${name}`)).length, 0)
const kb = bytes => (bytes / 1024).toFixed(1)
console.log(`game chunk: ${kb(total)} KB gzipped of ${kb(BUDGET_BYTES)} KB (${files.join(', ')})`)
if (total > BUDGET_BYTES) process.exit(1)
