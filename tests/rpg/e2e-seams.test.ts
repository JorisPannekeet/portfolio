import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  AREA_BARROW,
  AREA_BRENNHOLD,
  AREA_COUNT,
  CH_BARROW,
  CH_FLEE,
  CH_RAID,
  CMD_ADVANCE,
  CMD_COUNT,
  CMD_RESPAWN,
  ENEMY_FOOTMAN,
  EV_SWING,
  EVENT_CAP,
  HEAT_MAX,
  IN_ATTACK,
  IN_COMMAND,
  IN_DODGE,
  MAX_ENEMIES,
  OBJ_KEY,
  PHASE_DEAD,
  PHASE_DIALOG,
  PHASE_PLAYING,
  PL_GRAPPLE,
  PL_IDLE,
  TILE,
  TILE_DOOR,
  TILE_DOOR_OPEN,
} from '../../src/rpg/sim/content.ts'
import { blockedCircle } from '../../src/rpg/sim/body.hot.ts'
import { IDLE_COOLDOWN, PLAYER_RADIUS } from '../../src/rpg/sim/combat-tuning.ts'
import { afflict, damageEnemy } from '../../src/rpg/sim/enemies.hot.ts'
import { continueGame, newGame } from '../../src/rpg/sim/game.ts'
import { hurtPlayer } from '../../src/rpg/sim/player.hot.ts'
import { serializeProgress } from '../../src/rpg/sim/progress.ts'
import { createState, type State } from '../../src/rpg/sim/state.ts'
import { command, step } from '../../src/rpg/sim/step.hot.ts'
import { loadArea, setCheckpoint } from '../../src/rpg/sim/world.hot.ts'
import { charTiles, finishDialog, freshGame, objectsOf, standAt } from './world-helpers.ts'

function lcg(seed: number): () => number {
  let x = seed >>> 0
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0
    return x
  }
}

function play(s: State, input: number): void {
  if (s.phase === PHASE_DIALOG) step(s, command(CMD_ADVANCE, 0))
  else if (s.phase === PHASE_DEAD) step(s, command(CMD_RESPAWN, 0))
  else step(s, input)
}

test('30k ticks of random held bits and random commands from newGame never throw', () => {
  const s = createState()
  newGame(s, 11)
  const next = lcg(99)
  let held = 0
  for (let n = 0; n < 30_000; n++) {
    const r = next()
    if (r % 97 === 0) step(s, IN_COMMAND | ((next() % (CMD_COUNT + 2)) << 10) | (next() & 1023))
    else {
      if (r % 23 === 0) held = next() & 0x7fff
      step(s, held)
    }
    assert.ok(Number.isFinite(s.hp) && s.hp >= 0 && s.hp <= s.statMaxHp)
    assert.ok(Number.isFinite(s.playerX) && Number.isFinite(s.playerY))
  }
})

test('walking and dodging at random on every real map never leaves the player inside a wall', () => {
  for (let area = 0; area < AREA_COUNT; area++) {
    const s = freshGame(area + 1)
    s.chapter = CH_BARROW
    loadArea(s, area, 0)
    const next = lcg(area + 7)
    let heading = 1
    let overlaps = 0
    for (let n = 0; n < 3000; n++) {
      if (n % 40 === 0) heading = 1 + (next() % 16)
      s.hp = s.statMaxHp
      play(s, heading | (n % 90 === 0 ? IN_DODGE : 0))
      if (s.phase === PHASE_PLAYING && s.playerState !== PL_GRAPPLE && blockedCircle(s, s.playerX, s.playerY, PLAYER_RADIUS, 0) === 1) overlaps++
    }
    assert.equal(overlaps, 0, 'area ' + area)
  }
})

test('walking diagonally into a wall slides along it', () => {
  const s = freshGame()
  const [x, y] = [20 * TILE + TILE / 2, TILE + PLAYER_RADIUS + 1]
  standAt(s, x, y)
  for (let n = 0; n < 30; n++) play(s, 15)
  assert.ok(s.playerX > x + 20, 'moved east along the tree line')
  assert.ok(Math.abs(s.playerY - y) < 1.5, 'held at the tree line')
})

test('a dungeon door opens by itself for a key picked up before a save and continue', () => {
  const s = freshGame()
  s.chapter = CH_BARROW
  loadArea(s, AREA_BARROW, 0)
  const key = objectsOf(s, OBJ_KEY)[0]!
  standAt(s, s.objX[key]!, s.objY[key]!)
  play(s, 0)
  assert.equal(objectsOf(s, OBJ_KEY).length, 0)
  setCheckpoint(s, AREA_BARROW, 0)
  const fresh = createState()
  assert.ok(continueGame(fresh, 5, serializeProgress(s)))
  finishDialog(fresh)
  assert.equal(objectsOf(fresh, OBJ_KEY).length, 0, 'the key stays taken')
  const [dx, dy] = charTiles(AREA_BARROW, 'D')[0]!
  assert.equal(fresh.tiles[dy * fresh.mapW + dx], TILE_DOOR)
  standAt(fresh, (dx + 0.5) * TILE, (dy + 1.5) * TILE)
  play(fresh, 0)
  assert.equal(fresh.tiles[dy * fresh.mapW + dx], TILE_DOOR_OPEN)
})

function staleTimers(s: State): number {
  let stale = 0
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (s.eAlive[i] !== 1) continue
    if (s.eBurn[i] !== 0 || s.eChill[i] !== 0 || s.eCooldown[i]! > s.tick + IDLE_COOLDOWN) stale++
  }
  return stale
}

test('area loads and respawns start every enemy with fresh burn, chill and cooldown ticks', () => {
  const s = freshGame()
  s.chapter = CH_BARROW
  loadArea(s, AREA_BARROW, 0)
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (s.eAlive[i] !== 1) continue
    afflict(s, i, 1, 10_000)
    afflict(s, i, 2, 10_000)
    s.eCooldown[i] = s.tick + 10_000
  }
  loadArea(s, AREA_BARROW, 0)
  assert.equal(staleTimers(s), 0, 'after loadArea')
  for (let i = 0; i < MAX_ENEMIES; i++) if (s.eAlive[i] === 1) s.eBurn[i] = s.tick + 10_000
  s.heat = HEAT_MAX
  s.heatHoldUntil = s.tick + 10_000
  s.playerBuffer = 3
  hurtPlayer(s, 1e6, s.playerX + 10, s.playerY)
  while (s.phase !== PHASE_DEAD) step(s, 0)
  step(s, command(CMD_RESPAWN, 0))
  assert.equal(s.phase, PHASE_PLAYING)
  assert.equal(staleTimers(s), 0, 'after respawn')
  assert.equal(s.heat, 0)
  assert.equal(s.playerState, PL_IDLE)
  const since = s.evHead
  step(s, IN_ATTACK)
  let swung = false
  for (let e = since; e < s.evHead; e++) if (s.evType[e % EVENT_CAP] === EV_SWING) swung = true
  assert.ok(swung, 'the first press after a respawn swings')
})

test('the child trigger waits until both raid footmen are beaten, and the guide points at them first', () => {
  const s = createState()
  newGame(s, 3)
  finishDialog(s)
  const footmen: number[] = []
  for (let i = 0; i < MAX_ENEMIES; i++) if (s.eAlive[i] === 1 && s.eKind[i] === ENEMY_FOOTMAN) footmen.push(i)
  assert.equal(footmen.length, 2)
  const [cx, cy] = charTiles(AREA_BRENNHOLD, 'A')[1]!
  standAt(s, (cx + 0.5) * TILE, (cy + 0.5) * TILE)
  step(s, 0)
  assert.equal(s.chapter, CH_RAID, 'no waking while the raid goes on')
  assert.ok(footmen.some(i => s.guideX === s.eX[i] && s.guideY === s.eY[i]))
  for (const i of footmen) damageEnemy(s, i, 1e6, -1, s.playerX, s.playerY)
  step(s, 0)
  finishDialog(s)
  assert.equal(s.chapter, CH_FLEE)
})
