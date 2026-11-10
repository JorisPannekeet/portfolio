import {
  CHOICE_COUNT,
  EV_DEAD,
  EV_WON,
  EV_ZONE,
  INPUT_CHOICE,
  INPUT_DIRECTIONS,
  MAX_DRONES,
  PHASE_DEAD,
  PHASE_LEVEL_UP,
  PHASE_PLAYING,
  PHASE_WON,
  RUN_TICKS,
} from './content.ts'
import {
  computeSeparation,
  contactDamage,
  mirrorBoss,
  moveEnemies,
  removeDeadEnemies,
  runSpawns,
} from './enemies.hot.ts'
import { emit } from './events.hot.ts'
import { gridBuild } from './grid.hot.ts'
import { applyChoice, openLevelUp, processLevels } from './levelup.hot.ts'
import { updateGems } from './pickups.hot.ts'
import { runBossClock, updatePois } from './pois.hot.ts'
import { updateShots } from './shots.hot.ts'
import { playerRegenPerTick, playerSpeed } from './stats.hot.ts'
import type { State } from './state.ts'
import { HEADING_TURNS, cosTurn, sinTurn } from './trig.ts'
import { runWeapons } from './weapons.hot.ts'
import { clampToWorld, zoneAt } from './world.hot.ts'

function snapshotPrevious(s: State): void {
  s.ppx = s.px
  s.ppy = s.py
  const n = s.enemyCount
  const ex = s.ex
  const ey = s.ey
  const epx = s.epx
  const epy = s.epy
  const eFlash = s.eFlash
  for (let i = 0; i < n; i++) {
    epx[i] = ex[i]!
    epy[i] = ey[i]!
    if (eFlash[i]! > 0) eFlash[i]!--
  }
  const m = s.shotCount
  for (let i = 0; i < m; i++) {
    s.spx[i] = s.sx[i]!
    s.spy[i] = s.sy[i]!
  }
  for (let i = 0; i < MAX_DRONES; i++) {
    s.dronePx[i] = s.droneX[i]!
    s.dronePy[i] = s.droneY[i]!
  }
}

function movePlayer(s: State, input: number): void {
  if (input < 1 || input > INPUT_DIRECTIONS) return
  const turn = (input - 1) * HEADING_TURNS
  const ux = cosTurn(turn)
  const uy = sinTurn(turn)
  const speed = playerSpeed(s)
  s.px = clampToWorld(s.px + ux * speed)
  s.py = clampToWorld(s.py + uy * speed)
  s.aimX = ux
  s.aimY = uy
  s.aimTurn = turn
  if (ux > 0) s.faceX = 1
  else if (ux < 0) s.faceX = -1
}

function updateZone(s: State): void {
  const zone = zoneAt(s.px, s.py)
  if (zone === s.zone) return
  s.zone = zone
  emit(s, EV_ZONE, s.px, s.py, zone, 0)
}

function tickPlayer(s: State): void {
  if (s.iframes > 0) s.iframes--
  const regen = playerRegenPerTick(s)
  if (regen > 0) s.hp = Math.min(s.maxHp, s.hp + regen)
}

function die(s: State): void {
  s.hp = 0
  s.phase = PHASE_DEAD
  s.choiceCount = 0
  emit(s, EV_DEAD, s.px, s.py, 0, 0)
}

function stepPlaying(s: State, input: number): void {
  s.tick++
  s.hitEvents = 0
  s.killEvents = 0
  s.pickupEvents = 0
  snapshotPrevious(s)
  movePlayer(s, input)
  updateZone(s)
  tickPlayer(s)
  updatePois(s)
  runSpawns(s)
  runBossClock(s)
  gridBuild(s)
  computeSeparation(s)
  moveEnemies(s)
  gridBuild(s)
  runWeapons(s)
  updateShots(s)
  contactDamage(s)
  removeDeadEnemies(s)
  mirrorBoss(s)
  if (s.hp <= 0) {
    die(s)
    return
  }
  updateGems(s)
  if (s.tick >= RUN_TICKS) {
    s.phase = PHASE_WON
    s.choiceCount = 0
    emit(s, EV_WON, s.px, s.py, 0, 0)
    return
  }
  processLevels(s)
  if (s.pendingLevels > 0) openLevelUp(s)
}

export function step(s: State, input: number): void {
  if (s.phase === PHASE_PLAYING) {
    stepPlaying(s, input)
    return
  }
  if (s.phase === PHASE_LEVEL_UP && input >= INPUT_CHOICE && input < INPUT_CHOICE + CHOICE_COUNT) {
    applyChoice(s, input - INPUT_CHOICE)
  }
}
