import { availableParallelism } from 'node:os'
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'
import {
  CHOICE_COUNT,
  INPUT_CHOICE,
  INPUT_IDLE,
  PHASE_LEVEL_UP,
  RUN_TICKS,
  TICK_HZ,
} from '../src/game/sim/content.ts'
import { createState, resetState } from '../src/game/sim/state.ts'
import { step } from '../src/game/sim/step.hot.ts'
import { isTerminal, minutes, runBot } from './harness.ts'

const TICKS_PER_MINUTE = 60 * TICK_HZ
const LATE_TICKS = RUN_TICKS - 2 * TICKS_PER_MINUTE

interface RunResult {
  readonly seed: number
  readonly won: boolean
  readonly endTick: number
  readonly level: number
  readonly kills: number
  readonly peak: number
  readonly latePeak: number
  readonly evolvedAt: number
  readonly evolutions: number
  readonly idleHpAtMinute: number
  readonly hpByMinute: readonly number[]
}

function idleFirstMinute(seed: number): number {
  const s = createState()
  resetState(s, seed)
  while (!isTerminal(s) && s.tick < TICKS_PER_MINUTE) {
    const input = s.phase === PHASE_LEVEL_UP ? INPUT_CHOICE + (s.tick % CHOICE_COUNT) % s.choiceCount : INPUT_IDLE
    step(s, input)
  }
  return isTerminal(s) ? 0 : s.hp
}

function playSeed(seed: number): RunResult {
  let peak = 0
  let latePeak = 0
  let evolvedAt = -1
  const hpByMinute: number[] = []
  const { state } = runBot(seed, RUN_TICKS, s => {
    if (s.enemyCount > peak) peak = s.enemyCount
    if (s.tick > LATE_TICKS && s.enemyCount > latePeak) latePeak = s.enemyCount
    if (evolvedAt < 0 && s.weaponEvolved.some(v => v > 0)) evolvedAt = s.tick
    if (s.tick % TICKS_PER_MINUTE === 0) hpByMinute.push(Math.round(s.hp))
  })
  return {
    seed,
    won: state.tick >= RUN_TICKS && state.hp > 0,
    endTick: state.tick,
    level: state.level,
    kills: state.kills,
    peak,
    latePeak,
    evolvedAt,
    evolutions: state.weaponEvolved.reduce((sum, v) => sum + v, 0),
    idleHpAtMinute: idleFirstMinute(seed),
    hpByMinute,
  }
}

function median(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

function mean(values: readonly number[]): number {
  return values.length === 0 ? Number.NaN : values.reduce((sum, v) => sum + v, 0) / values.length
}

function percent(part: number, whole: number): string {
  return whole === 0 ? 'n/a' : `${((100 * part) / whole).toFixed(0)}%`
}

function report(results: readonly RunResult[], seconds: number): void {
  const wins = results.filter(r => r.won)
  const deaths = results.filter(r => !r.won)
  const deathsByMinute = new Array<number>(8).fill(0)
  for (const r of deaths) deathsByMinute[Math.min(7, Math.floor(r.endTick / TICKS_PER_MINUTE))]!++
  const rows: [string, string][] = [
    ['runs', `${results.length} (${seconds.toFixed(1)} s)`],
    ['win rate', `${percent(wins.length, results.length)} (${wins.length}/${results.length})`],
    ['median death time', deaths.length ? minutes(median(deaths.map(r => r.endTick))) : 'no deaths'],
    ['deaths by minute 0..7', deathsByMinute.join(' ')],
    ['mean level at end, all runs', mean(results.map(r => r.level)).toFixed(1)],
    ['mean level at end, wins', wins.length ? mean(wins.map(r => r.level)).toFixed(1) : 'n/a'],
    ['level range, wins', wins.length ? `${Math.min(...wins.map(r => r.level))}..${Math.max(...wins.map(r => r.level))}` : 'n/a'],
    ['mean kills', mean(results.map(r => r.kills)).toFixed(0)],
    ['peak hostiles, any time', String(Math.max(...results.map(r => r.peak)))],
    ['peak hostiles, last 2 min (max / median of runs that got there)', `${Math.max(0, ...results.map(r => r.latePeak))} / ${median(results.filter(r => r.latePeak > 0).map(r => r.latePeak))}`],
    ['runs with an evolution', `${results.filter(r => r.evolutions > 0).length}/${results.length}`],
    ['wins with an evolution', `${wins.filter(r => r.evolutions > 0).length}/${wins.length}`],
    ['median first evolution', minutes(median(results.filter(r => r.evolvedAt >= 0).map(r => r.evolvedAt)))],
    ['idle player alive at 1:00', `${results.filter(r => r.idleHpAtMinute > 0).length}/${results.length} (min hp ${Math.min(...results.map(r => r.idleHpAtMinute)).toFixed(0)})`],
    ['mean bot hp at minute 1..8, runs alive', [0, 1, 2, 3, 4, 5, 6, 7].map(m => mean(results.filter(r => r.hpByMinute.length > m).map(r => r.hpByMinute[m]!)).toFixed(0)).join(' ')],
  ]
  const width = Math.max(...rows.map(([label]) => label.length))
  for (const [label, value] of rows) console.log(`${label.padEnd(width)}  ${value}`)
}

async function main(): Promise<void> {
  const count = Number(process.argv[2] ?? 40)
  if (!Number.isInteger(count) || count < 1) throw new Error('Seed count must be a positive integer.')
  const seeds = Array.from({ length: count }, (_, i) => i + 1)
  const workers = Math.max(1, Math.min(count, availableParallelism() - 1))
  const started = performance.now()
  const chunks = Array.from({ length: workers }, (_, w) => seeds.filter((_, i) => i % workers === w))
  const parts = await Promise.all(
    chunks.map(
      chunk =>
        new Promise<RunResult[]>((resolve, reject) => {
          const worker = new Worker(new URL(import.meta.url), { workerData: chunk })
          worker.once('message', resolve)
          worker.once('error', reject)
        }),
    ),
  )
  const results = parts.flat().sort((a, b) => a.seed - b.seed)
  report(results, (performance.now() - started) / 1000)
}

if (isMainThread) await main()
else parentPort!.postMessage((workerData as number[]).map(playSeed))
