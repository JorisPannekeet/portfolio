import {
  AI_IDLE,
  ELEMENT_COUNT,
  ENEMY_BOSS_FIRST,
  EVENT_CAP,
  EV_BOSS_PHASE,
  EV_DIALOG,
  EV_ENEMY_DIE,
  EV_HIT,
  EV_SAVE,
  MAX_ENEMIES,
  PHASE_DEAD,
  PHASE_ENDED,
  PHASE_PLAYING,
  PL_GRAPPLE,
  TICK_HZ,
} from '../../src/rpg/sim/content.ts'
import { blockedCircle } from '../../src/rpg/sim/body.hot.ts'
import { botInput } from '../../src/rpg/sim/bot.hot.ts'
import { PLAYER_RADIUS } from '../../src/rpg/sim/combat-tuning.ts'
import { continueGame, newGame } from '../../src/rpg/sim/game.ts'
import { hashState } from '../../src/rpg/sim/hash.ts'
import { serializeProgress } from '../../src/rpg/sim/progress.ts'
import { createState, type State } from '../../src/rpg/sim/state.ts'
import { step } from '../../src/rpg/sim/step.hot.ts'

export const HASH_EVERY = 600
export const TICKS_PER_MINUTE = 60 * TICK_HZ
export const RUN_BUDGET = 45 * TICKS_PER_MINUTE

export interface BossFight {
  readonly kind: number
  readonly ticks: number
  readonly hpLeft: number
  readonly tries: number
}

export interface ChapterLog {
  readonly chapter: number
  readonly enteredAt: number
  ticks: number
  deaths: number
  level: number
  attack: number
}

export interface Playthrough {
  readonly state: State
  readonly deaths: number
  readonly chapters: ChapterLog[]
  readonly bosses: BossFight[]
  readonly shardTick: number[]
  readonly stanceTick: number[]
  readonly hashes: number[]
  readonly saves: number
  readonly continues: number
  readonly kills: Kill[]
  readonly elapsed: number
  readonly scripts: number[]
  readonly bossPhases: number[]
  readonly wallOverlaps: number
}

export interface Kill {
  readonly chapter: number
  readonly ticks: number
}

export interface PlayOptions {
  readonly mode?: number
  readonly budget?: number
  readonly continueAtSaves?: readonly number[]
  readonly onStep?: (s: State) => void
}

export function playthrough(seed: number, options: PlayOptions = {}): Playthrough {
  const mode = options.mode ?? 0
  const budget = options.budget ?? RUN_BUDGET
  const continueAt = options.continueAtSaves ?? []
  let s = createState()
  newGame(s, seed)
  const chapters: ChapterLog[] = [{ chapter: s.chapter, enteredAt: 0, ticks: 0, deaths: 0, level: s.level, attack: s.statAttack }]
  const bosses: BossFight[] = []
  const shardTick = new Array<number>(ELEMENT_COUNT).fill(-1)
  const stanceTick = new Array<number>(ELEMENT_COUNT).fill(-1)
  const hashes: number[] = []
  const firstHit = new Array<number>(MAX_ENEMIES).fill(-1)
  const wasAlive = new Uint8Array(MAX_ENEMIES)
  const kills: Kill[] = []
  const scripts: number[] = []
  const bossPhases: number[] = []
  let wallOverlaps = 0
  let bossStart = -1
  let bossTries = 0
  let deaths = 0
  let saves = 0
  let continues = 0
  let steps = 0
  let offset = 0
  while (s.phase !== PHASE_ENDED && offset + s.tick < budget && steps < budget * 4) {
    const cursor = s.evHead
    const tick = s.tick
    const phase = s.phase
    wasAlive.set(s.eAlive)
    step(s, botInput(s, mode))
    steps++
    options.onStep?.(s)
    if (phase !== PHASE_DEAD && s.phase === PHASE_DEAD) {
      deaths++
      chapters[chapters.length - 1]!.deaths++
      if (bossStart >= 0) bossTries++
      bossStart = -1
    }
    const now = offset + s.tick
    if (s.phase === PHASE_PLAYING && s.playerState !== PL_GRAPPLE && blockedCircle(s, s.playerX, s.playerY, PLAYER_RADIUS, 0) === 1) wallOverlaps++
    for (let i = 0; i < MAX_ENEMIES; i++) {
      if (s.eAlive[i] === 1 && s.eKind[i]! >= ENEMY_BOSS_FIRST && s.eState[i] !== AI_IDLE && bossStart < 0) bossStart = now
    }
    let saved = false
    for (let e = Math.max(cursor, s.evHead - EVENT_CAP); e < s.evHead; e++) {
      const slot = e % EVENT_CAP
      const type = s.evType[slot]
      if (type === EV_HIT) {
        const enemy = s.evA[slot]!
        if (firstHit[enemy]! < 0) firstHit[enemy] = now
      } else if (type === EV_ENEMY_DIE) {
        const kind = s.evA[slot]!
        if (kind >= ENEMY_BOSS_FIRST) {
          bosses.push({ kind, ticks: now - Math.max(0, bossStart), hpLeft: Math.round(s.hp), tries: bossTries + 1 })
          bossStart = -1
          bossTries = 0
        }
        for (let i = 0; i < MAX_ENEMIES; i++) {
          if (wasAlive[i] !== 1 || s.eAlive[i] !== 0 || s.eX[i] !== s.evX[slot] || s.eY[i] !== s.evY[slot]) continue
          if (kind < ENEMY_BOSS_FIRST && firstHit[i]! >= 0) kills.push({ chapter: s.chapter, ticks: now - firstHit[i]! })
          firstHit[i] = -1
        }
      } else if (type === EV_DIALOG) {
        scripts.push(s.evA[slot]!)
      } else if (type === EV_BOSS_PHASE) {
        bossPhases.push(s.evA[slot]!)
      } else if (type === EV_SAVE) {
        saves++
        saved = true
      }
    }
    for (let i = 0; i < MAX_ENEMIES; i++) if (wasAlive[i] === 1 && s.eAlive[i] === 0) firstHit[i] = -1
    for (let e = 0; e < ELEMENT_COUNT; e++) {
      if (shardTick[e]! < 0 && (s.shards & (1 << e)) !== 0) shardTick[e] = now
      if (stanceTick[e]! < 0 && (s.stancesUnlocked & (1 << e)) !== 0) stanceTick[e] = now
    }
    const last = chapters[chapters.length - 1]!
    if (s.chapter !== last.chapter) {
      last.ticks = now - last.enteredAt
      chapters.push({ chapter: s.chapter, enteredAt: now, ticks: 0, deaths: 0, level: s.level, attack: s.statAttack })
    }
    if (s.tick !== tick && s.tick % HASH_EVERY === 0) hashes.push(hashState(s))
    if (saved && continueAt.includes(saves) && s.phase !== PHASE_ENDED) {
      const save = serializeProgress(s)
      offset += s.tick
      s = createState()
      if (!continueGame(s, seed, save)) throw new Error('save at checkpoint ' + saves + ' did not restore')
      wasAlive.fill(0)
      firstHit.fill(-1)
      bossStart = -1
      continues++
    }
  }
  const last = chapters[chapters.length - 1]!
  last.ticks = offset + s.tick - last.enteredAt
  return { state: s, deaths, chapters, bosses, shardTick, stanceTick, hashes, saves, continues, kills, elapsed: offset + s.tick, scripts, bossPhases, wallOverlaps }
}

export function minutes(ticks: number): string {
  const seconds = Math.floor(ticks / TICK_HZ)
  return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0')
}
