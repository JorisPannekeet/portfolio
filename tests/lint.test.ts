import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ESLint } from 'eslint'

const eslint = new ESLint()

async function ruleIds(filePath: string, code: string): Promise<string[]> {
  const results = await eslint.lintText(code, { filePath })
  return results.flatMap(result => result.messages.map(message => message.ruleId ?? 'parse-error'))
}

const cases: readonly (readonly [string, string, string, string | null])[] = [
  ['hot path rejects object literals', 'src/game/sim/a.hot.ts', 'export function f() { return { x: 1 } }', 'no-restricted-syntax'],
  ['hot path rejects closures', 'src/game/render/a.hot.ts', 'export function f(a: number[]) { a.forEach(() => 1) }', 'no-restricted-syntax'],
  ['hot path rejects new', 'src/game/sim/a.hot.ts', 'export function f() { return new Float32Array(4) }', 'no-restricted-syntax'],
  ['hot path accepts index loops', 'src/game/sim/a.hot.ts', 'export function f(a: Float32Array) { let t = 0; for (let i = 0; i < a.length; i++) t += a[i]!; return t }', null],
  ['sim rejects Math.random', 'src/game/sim/a.ts', 'export const r = Math.random()', 'no-restricted-properties'],
  ['sim rejects Math.sin', 'src/game/sim/a.hot.ts', 'export function f(a: number) { return Math.sin(a) }', 'no-restricted-properties'],
  ['sim rejects clocks', 'src/game/sim/a.ts', 'export const t = performance.now()', 'no-restricted-globals'],
  ['sim rejects renderer imports', 'src/game/sim/a.ts', "import { createRenderer } from '../render/renderer.ts'\nexport const r = createRenderer", 'no-restricted-imports'],
  ['sim accepts sibling imports and sqrt', 'src/game/sim/a.ts', "import { TICK_HZ } from './content.ts'\nexport const r = Math.sqrt(TICK_HZ)", null],
  ['game code rejects comments', 'src/game/render/a.ts', '// note\nexport const a = 1', 'game/no-comments'],
  ['sprites reject color literals', 'src/game/sprites/a.ts', "export const c = '#ff0000'", 'no-restricted-syntax'],
  ['sprites accept palette rows', 'src/game/sprites/a.ts', "export const rows = ['..12..', '.1221.']", null],
  ['ui rejects raw text', 'src/game/ui/A.tsx', 'export function A() { return <p>Start</p> }', 'no-restricted-syntax'],
  ['game code rejects image assets', 'src/game/ui/a.ts', "import a from './a.png'\nexport const b = a", 'no-restricted-imports'],
]

for (const [name, filePath, code, expected] of cases) {
  test(name, async () => {
    const ids = await ruleIds(filePath, code)
    if (expected === null) assert.deepEqual(ids, [])
    else assert.ok(ids.includes(expected), `expected ${expected}, got ${ids.join(', ') || 'no errors'}`)
  })
}
