import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  TILE,
  MAX_ENEMIES,
  AREA_ASHFORGE,
  AREA_BARROW,
  AREA_BRENNHOLD,
  AREA_SALTREACH,
  AREA_SHRINE,
  AREA_VALDMERE,
  AREA_VELLIN,
  CH_BARROW,
  CH_GALE,
  CH_TIDE,
  CMD_HORN,
  DAY_TICKS,
  ELEMENT_EMBER,
  ELEMENT_GALE,
  ELEMENT_STONE,
  ELEMENT_TIDE,
  EV_SAVE,
  EVENT_CAP,
  IN_INTERACT,
  KEY_GRAPPLE,
  KEY_WARHAMMER,
  MELODY_ROADS,
  MELODY_SEALS,
  OBJ_CHEST,
  OBJ_GRAPPLE,
  OBJ_HORSE,
  OBJ_KEY,
  OBJ_SHRINE,
  OBJ_USED,
  OBJ_WAYSTONE,
  PHASE_DIALOG,
  PHASE_PLAYING,
  PL_GRAPPLE,
  TILE_ASH,
  TILE_BARRICADE,
  TILE_CRACKED,
  TILE_DOOR,
  TILE_DOOR_OPEN,
  TILE_GATE,
  TILE_GATE_OPEN,
  TILE_ICE,
  TILE_PILLAR_RAISED,
  TILE_PILLAR_SUNK,
  TILE_RUBBLE,
  TILE_SEAL,
  TILE_SEAL_OPEN,
  TILE_WATER,
} from '../../src/rpg/sim/content.ts'
import { applyCommand } from '../../src/rpg/sim/commands.hot.ts'
import { damageEnemy } from '../../src/rpg/sim/enemies.hot.ts'
import { arrowWorldEffect, elementWorldEffect, strikeWorldEffect } from '../../src/rpg/sim/puzzles.hot.ts'
import { FLAG_SHRINE_CHEST, FLAG_SHRINE_CLEAR, flagId } from '../../src/rpg/sim/flags.ts'
import { loadArea } from '../../src/rpg/sim/world.hot.ts'
import { charCenter, charTiles, finishDialog, freshGame, objectsOf, standAt, tileIndexAt, worldTick } from './world-helpers.ts'

function tileOfChar(s: ReturnType<typeof freshGame>, area: number, ch: string): number {
  const [x, y] = charCenter(area, ch)
  return tileIndexAt(s, x, y)
}

test('Stone raises sunk pillars in range, and they sink again when the area reloads', () => {
  const s = freshGame()
  loadArea(s, AREA_BARROW, 0)
  const [x, y] = charCenter(AREA_BARROW, 'p')
  const i = tileIndexAt(s, x, y)
  assert.equal(s.tiles[i], TILE_PILLAR_SUNK)
  elementWorldEffect(s, ELEMENT_TIDE, x, y, 24)
  assert.equal(s.tiles[i], TILE_PILLAR_SUNK, 'the wrong element does nothing')
  elementWorldEffect(s, ELEMENT_STONE, x, y, 24)
  assert.equal(s.tiles[i], TILE_PILLAR_RAISED)
  loadArea(s, AREA_BARROW, 0)
  assert.equal(s.tiles[i], TILE_PILLAR_SUNK)
})

test('Tide freezes water to ice until the area reloads', () => {
  const s = freshGame()
  loadArea(s, AREA_ASHFORGE, 0)
  const [x, y] = charCenter(AREA_ASHFORGE, '~')
  const i = tileIndexAt(s, x, y)
  elementWorldEffect(s, ELEMENT_TIDE, x, y, 8)
  assert.equal(s.tiles[i], TILE_ICE)
  loadArea(s, AREA_ASHFORGE, 0)
  assert.equal(s.tiles[i], TILE_WATER)
})

test('Ember burns a whole barricade cluster to ash, persistently', () => {
  const s = freshGame()
  loadArea(s, AREA_ASHFORGE, 0)
  const cluster = charTiles(AREA_ASHFORGE, '[')
  const [x, y] = charCenter(AREA_ASHFORGE, '[')
  elementWorldEffect(s, ELEMENT_EMBER, x, y, 4)
  for (const [tx, ty] of cluster) assert.equal(s.tiles[ty * s.mapW + tx], TILE_ASH)
  assert.equal(s.flags[flagId('ASH_P4')], 1)
  loadArea(s, AREA_ASHFORGE, 0)
  for (const [tx, ty] of cluster) assert.equal(s.tiles[ty * s.mapW + tx], TILE_ASH)
  assert.equal(s.tiles[tileOfChar(s, AREA_ASHFORGE, ']')], TILE_BARRICADE, 'other clusters stay')
})

test('Gale at a windmill opens its gate group, persistently', () => {
  const s = freshGame()
  loadArea(s, AREA_VELLIN, 0)
  const gate = tileOfChar(s, AREA_VELLIN, '[')
  assert.equal(s.tiles[gate], TILE_GATE)
  const [x, y] = charCenter(AREA_VELLIN, 'm')
  elementWorldEffect(s, ELEMENT_GALE, x + 30, y, 24)
  assert.equal(s.tiles[gate], TILE_GATE_OPEN)
  loadArea(s, AREA_VELLIN, 0)
  assert.equal(s.tiles[gate], TILE_GATE_OPEN)
  assert.equal(s.tiles[tileOfChar(s, AREA_VELLIN, ']')], TILE_GATE)
})

test('the warhammer breaks cracked rock on a melee hit; without it nothing happens', () => {
  const s = freshGame()
  loadArea(s, AREA_VALDMERE, 0)
  const [x, y] = charCenter(AREA_VALDMERE, 'C')
  const i = tileIndexAt(s, x, y)
  strikeWorldEffect(s, x, y)
  assert.equal(s.tiles[i], TILE_CRACKED)
  s.keyItems = KEY_WARHAMMER
  strikeWorldEffect(s, x, y)
  assert.equal(s.tiles[i], TILE_RUBBLE)
  loadArea(s, AREA_VALDMERE, 0)
  assert.equal(s.tiles[i], TILE_RUBBLE)
})

test('a longbow arrow trips a switch and opens its gate; a second arrow passes', () => {
  const s = freshGame()
  loadArea(s, AREA_VALDMERE, 0)
  const gate = tileOfChar(s, AREA_VALDMERE, 'G')
  const [x, y] = charCenter(AREA_VALDMERE, 's')
  assert.equal(arrowWorldEffect(s, x + 40, y), 0)
  assert.equal(arrowWorldEffect(s, x + 4, y), 1)
  assert.equal(s.tiles[gate], TILE_GATE_OPEN)
  assert.equal(arrowWorldEffect(s, x, y), 0)
  loadArea(s, AREA_VALDMERE, 0)
  assert.equal(s.tiles[gate], TILE_GATE_OPEN)
})

test('the Seals melody opens the citadel seal only when played nearby', () => {
  const s = freshGame()
  s.melodies = (1 << MELODY_SEALS) | (1 << MELODY_ROADS)
  loadArea(s, AREA_VALDMERE, 0)
  const seal = tileOfChar(s, AREA_VALDMERE, 'S')
  const [x, y] = charCenter(AREA_VALDMERE, 'S')
  applyCommand(s, CMD_HORN, MELODY_SEALS)
  assert.equal(s.tiles[seal], TILE_SEAL)
  standAt(s, x - 32, y)
  applyCommand(s, CMD_HORN, MELODY_SEALS)
  assert.equal(s.tiles[seal], TILE_SEAL_OPEN)
  loadArea(s, AREA_VALDMERE, 0)
  assert.equal(s.tiles[seal], TILE_SEAL_OPEN)
})

test('interacting sets interactUsed; walking past does not', () => {
  const s = freshGame()
  const [x, y] = charCenter(AREA_BRENNHOLD, '$')
  standAt(s, x + 10, y)
  worldTick(s, 0)
  assert.equal(s.interactUsed, 0)
  const chest = s.interactObj
  assert.equal(s.objKind[chest], OBJ_CHEST)
  const gold = s.gold
  worldTick(s, IN_INTERACT)
  assert.equal(s.interactUsed, 1)
  assert.equal(s.objState[chest], OBJ_USED)
  assert.ok(s.gold > gold)
  worldTick(s, IN_INTERACT)
  assert.equal(s.interactUsed, 0, 'holding the button is not a new press')
  worldTick(s, 0)
  worldTick(s, IN_INTERACT)
  assert.equal(s.interactUsed, 0, 'an opened chest is no longer a target')
  loadArea(s, AREA_BRENNHOLD, 0)
  assert.equal(s.objState[objectsOf(s, OBJ_CHEST)[0]!], OBJ_USED)
})

test('a key opens its door on approach and the key item chest grants the warhammer', () => {
  const s = freshGame()
  s.chapter = CH_BARROW
  loadArea(s, AREA_BARROW, 0)
  const door = tileOfChar(s, AREA_BARROW, 'D')
  const [dx, dy] = charCenter(AREA_BARROW, 'D')
  standAt(s, dx, dy + 16)
  worldTick(s, 0)
  assert.equal(s.tiles[door], TILE_DOOR, 'locked without the key')
  const key = objectsOf(s, OBJ_KEY)[0]!
  standAt(s, s.objX[key]!, s.objY[key]!)
  worldTick(s, 0)
  assert.equal(objectsOf(s, OBJ_KEY).length, 0)
  standAt(s, dx, dy + 16)
  worldTick(s, 0)
  assert.equal(s.tiles[door], TILE_DOOR_OPEN)
  const [qx, qy] = charCenter(AREA_BARROW, 'Q')
  standAt(s, qx, qy + 12)
  worldTick(s, 0)
  worldTick(s, IN_INTERACT)
  assert.ok((s.keyItems & KEY_WARHAMMER) !== 0)
  loadArea(s, AREA_BARROW, 0)
  assert.equal(s.tiles[door], TILE_DOOR_OPEN)
  assert.equal(objectsOf(s, OBJ_KEY).length, 0, 'a taken key stays taken')
})

test('walking onto an exit loads the target area, sets the checkpoint and emits EV_SAVE', () => {
  const s = freshGame()
  s.chapter = CH_TIDE
  loadArea(s, AREA_VALDMERE, 0)
  const [x, y] = charCenter(AREA_VALDMERE, 'U')
  standAt(s, x, y)
  worldTick(s, 0)
  assert.equal(s.area, AREA_BARROW)
  assert.equal(s.checkpointArea, AREA_BARROW)
  assert.equal(s.checkpointSpawn, 0)
  assert.equal(s.evType[(s.evHead - 1) % EVENT_CAP], EV_SAVE)
})

test('the Brennhold road ignores the player until Maren has spoken', () => {
  const s = freshGame()
  const [x, y] = charCenter(AREA_BRENNHOLD, 'E')
  standAt(s, x, y)
  worldTick(s, 0)
  assert.equal(s.area, AREA_BRENNHOLD)
  s.chapter = CH_BARROW
  loadArea(s, AREA_BRENNHOLD, 0)
  standAt(s, x, y)
  worldTick(s, 0)
  assert.equal(s.area, AREA_VALDMERE)
})

test('touching a waystone attunes it, heals, and saves', () => {
  const s = freshGame()
  loadArea(s, AREA_VALDMERE, 0)
  s.hp = 3
  const w = objectsOf(s, OBJ_WAYSTONE)[0]!
  standAt(s, s.objX[w]!, s.objY[w]!)
  worldTick(s, 0)
  assert.equal(s.hp, s.statMaxHp)
  assert.ok((s.waystones & (1 << AREA_VALDMERE)) !== 0)
  assert.equal(s.checkpointArea, AREA_VALDMERE)
  assert.equal(s.checkpointSpawn, 6)
})

test('the clock runs outdoors only and wraps at DAY_TICKS', () => {
  const s = freshGame()
  loadArea(s, AREA_VALDMERE, 0)
  s.clock = DAY_TICKS - 1
  worldTick(s, 0)
  assert.equal(s.clock, 0)
  loadArea(s, AREA_BARROW, 0)
  worldTick(s, 0)
  assert.equal(s.clock, 0)
})

test('mounting removes the horse; when action clears mounted the horse is dropped at the player', () => {
  const s = freshGame()
  loadArea(s, AREA_VALDMERE, 0)
  const horse = objectsOf(s, OBJ_HORSE)[0]!
  standAt(s, s.objX[horse]!, s.objY[horse]! + 8)
  worldTick(s, 0)
  worldTick(s, IN_INTERACT)
  assert.equal(s.mounted, 1)
  assert.equal(objectsOf(s, OBJ_HORSE).length, 0)
  standAt(s, 400, 500)
  s.mounted = 0
  worldTick(s, 0)
  const dropped = objectsOf(s, OBJ_HORSE)
  assert.equal(dropped.length, 1)
  assert.equal(s.objX[dropped[0]!], 400)
})

test('the grapple pulls the player to a far post only with the grapple chain', () => {
  const s = freshGame()
  loadArea(s, AREA_SALTREACH, 0)
  const posts = objectsOf(s, OBJ_GRAPPLE)
  standAt(s, s.objX[posts[1]!]!, s.objY[posts[1]!]!)
  worldTick(s, 0)
  assert.equal(s.interactObj, -1)
  s.keyItems = KEY_GRAPPLE
  worldTick(s, 0)
  assert.equal(s.interactObj, posts[0])
  worldTick(s, IN_INTERACT)
  assert.equal(s.playerState, PL_GRAPPLE)
  assert.equal(s.grappleX, s.objX[posts[0]!])
})

test('a shrine runs its waves, then places a reward chest that stays after a reload', () => {
  const s = freshGame()
  s.chapter = CH_GALE
  loadArea(s, AREA_VALDMERE, 0)
  const shrine = objectsOf(s, OBJ_SHRINE, 2)[0]!
  standAt(s, s.objX[shrine]!, s.objY[shrine]! + 10)
  worldTick(s, 0)
  worldTick(s, IN_INTERACT)
  assert.equal(s.area, AREA_SHRINE)
  assert.equal(s.areaVariant, 2)
  const [zx, zy] = charCenter(AREA_SHRINE, 'Z')
  standAt(s, zx, zy)
  worldTick(s, 0)
  assert.equal(s.phase, PHASE_DIALOG)
  finishDialog(s)
  for (let i = 0; i < 10 && s.flags[FLAG_SHRINE_CLEAR[2]!] === 0; i++) {
    worldTick(s, 0)
    for (let e = 0; e < MAX_ENEMIES; e++) if (s.eAlive[e] === 1) damageEnemy(s, e, 1e6, -1, s.playerX, s.playerY)
  }
  assert.equal(s.flags[FLAG_SHRINE_CLEAR[2]!], 1)
  finishDialog(s)
  const chest = objectsOf(s, OBJ_CHEST)[0]!
  standAt(s, s.objX[chest]!, s.objY[chest]! + 10)
  worldTick(s, 0)
  worldTick(s, IN_INTERACT)
  assert.equal(s.flags[FLAG_SHRINE_CHEST[2]!], 1)
  loadArea(s, AREA_SHRINE, 2)
  assert.equal(s.objState[objectsOf(s, OBJ_CHEST)[0]!], OBJ_USED)
  const [ex, ey] = charCenter(AREA_SHRINE, 'E')
  standAt(s, ex, ey)
  worldTick(s, 0)
  assert.equal(s.area, AREA_VALDMERE)
  assert.equal(s.checkpointSpawn, 9)
})

test('a shrine trial starts from either cell of its two-tile trigger', () => {
  const s = freshGame()
  s.chapter = CH_GALE
  loadArea(s, AREA_SHRINE, 2)
  const [zx, zy] = charCenter(AREA_SHRINE, 'Z')
  standAt(s, zx + TILE, zy)
  worldTick(s, 0)
  assert.equal(s.phase, PHASE_DIALOG)
  finishDialog(s)
  worldTick(s, 0)
  const countAlive = () => {
    let alive = 0
    for (let e = 0; e < MAX_ENEMIES; e++) alive += s.eAlive[e]!
    return alive
  }
  const firstWave = countAlive()
  assert.ok(firstWave > 0, 'the first wave should spawn')
  standAt(s, zx, zy)
  worldTick(s, 0)
  assert.equal(s.phase, PHASE_PLAYING, 'the other cell must not restart a running trial')
  assert.equal(countAlive(), firstWave)
})
