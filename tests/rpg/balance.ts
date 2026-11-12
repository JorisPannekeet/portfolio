import { PHASE_ENDED, TICK_HZ } from '../../src/rpg/sim/content.ts'
import { BOT_SLOPPY } from '../../src/rpg/sim/bot-tuning.ts'
import { minutes, playthrough, type Playthrough } from './e2e-harness.ts'

const SEEDS = [1, 2, 3, 4, 5, 6]
const CHAPTER_NAMES = ['raid', 'flee', 'barrow', 'tide', 'vigil', 'ember', 'gale', 'reveal', 'citadel', 'choice', 'ended']
const BOSS_NAMES = ['barrow king', 'drowned abbot', 'forgemaster', 'storm abbess', 'varek']
const BOSS_FIRST = 8

function seconds(ticks: number): string {
  return (ticks / TICK_HZ).toFixed(0) + 's'
}

function quantile(values: readonly number[], q: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]!
}

function report(label: string, runs: readonly Playthrough[]): void {
  console.log('\n== ' + label + ' bot ==')
  for (const [k, run] of runs.entries()) {
    const s = run.state
    const done = s.phase === PHASE_ENDED ? 'ending ' + s.ending : 'UNFINISHED'
    console.log(`seed ${SEEDS[k]}: ${minutes(run.elapsed)} ${done}, deaths ${run.deaths}, level ${s.level}, attack ${s.statAttack.toFixed(1)}`)
    console.log('  chapter    time   deaths level attack')
    for (const c of run.chapters) {
      console.log(`  ${CHAPTER_NAMES[c.chapter]!.padEnd(9)} ${minutes(c.ticks).padStart(6)} ${String(c.deaths).padStart(7)} ${String(c.level).padStart(5)} ${c.attack.toFixed(1).padStart(6)}`)
    }
    for (const b of run.bosses) console.log(`  boss ${BOSS_NAMES[b.kind - BOSS_FIRST]!.padEnd(14)} ${seconds(b.ticks).padStart(5)}  hp left ${String(b.hpLeft).padStart(3)}  tries ${b.tries}`)
  }
  const kills = runs.flatMap(r => r.kills.map(k => k.ticks))
  const byChapter = CHAPTER_NAMES.map((name, c) => {
    const ticks = runs.flatMap(r => r.kills.filter(k => k.chapter === c).map(k => k.ticks))
    return ticks.length === 0 ? '' : name + ' ' + seconds(quantile(ticks, 0.5))
  }).filter(Boolean)
  const deaths = runs.map(r => r.deaths)
  const bossTicks = runs.flatMap(r => r.bosses.map(b => b.ticks))
  console.log(`summary: deaths ${Math.min(...deaths)}..${Math.max(...deaths)}, run ${minutes(Math.min(...runs.map(r => r.elapsed)))}..${minutes(Math.max(...runs.map(r => r.elapsed)))}`)
  console.log(`  regular kill time p10 ${seconds(quantile(kills, 0.1))} median ${seconds(quantile(kills, 0.5))} p90 ${seconds(quantile(kills, 0.9))} (${kills.length} kills)`)
  console.log('  median kill time by chapter: ' + byChapter.join(', '))
  console.log(`  boss fight ${seconds(Math.min(...bossTicks))}..${seconds(Math.max(...bossTicks))}, level ${Math.min(...runs.map(r => r.state.level))}..${Math.max(...runs.map(r => r.state.level))}`)
}

report('normal', SEEDS.map(seed => playthrough(seed)))
report('sloppy', SEEDS.map(seed => playthrough(seed, { mode: BOT_SLOPPY })))
