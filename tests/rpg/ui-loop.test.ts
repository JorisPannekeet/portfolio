import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  AREA_BRENNHOLD,
  CMD_ADVANCE,
  CMD_EQUIP,
  CMD_RESPAWN,
  EV_SAVE,
  ITEM_GREATSWORD,
  MAX_OBJECTS,
  OBJ_WAYSTONE,
  PHASE_DEAD,
  PHASE_DIALOG,
  PHASE_PLAYING,
  PL_DEAD,
  SCRIPT_INTRO,
  SLOT_WEAPON,
  TIER_RARE,
} from '../../src/rpg/sim/content.ts'
import { createState, type State } from '../../src/rpg/sim/state.ts'
import { continueGame, newGame } from '../../src/rpg/sim/game.ts'
import { grantItem } from '../../src/rpg/sim/loot.hot.ts'
import { serializeProgress } from '../../src/rpg/sim/progress.ts'
import { command } from '../../src/rpg/sim/step.hot.ts'
import { AREAS } from '../../src/rpg/sim/areas.ts'
import { queueCommand, resetLoop, setLoopRunning, startLoop, stopLoop, TICK_MS, type Loop } from '../../src/rpg/loop.hot.ts'
import { readSave, writeSave, type SaveStore } from '../../src/rpg/ui/save.ts'
import type { Renderer } from '../../src/rpg/render/renderer.ts'
import type { GameAudio } from '../../src/rpg/audio/audio.ts'

let pending: ((now: number) => void) | null = null
const g = globalThis as Record<string, unknown>
g.requestAnimationFrame = (callback: (now: number) => void) => {
  pending = callback
  return 1
}
g.cancelAnimationFrame = () => {
  pending = null
}

let clock = 0
function frame(ms = TICK_MS): void {
  clock += ms
  const callback = pending
  assert.ok(callback, 'the loop has a frame scheduled')
  callback(clock)
}

function memoryStore(): SaveStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) }
}

function makeLoop(s: State, store: SaveStore) {
  const phases: number[] = []
  const events: number[] = []
  let draws = 0
  const renderer = { resize() {}, draw() { draws++ }, drawItemIcon() {}, drawElementIcon() {} } as unknown as Renderer
  const audio: GameAudio = { unlock() {}, setMuted() {}, setPaused() {}, update() {}, dispose() {} }
  const loop: Loop = {
    s, renderer, audio, heading: 0, held: 0, latched: 0, stanceSelect: 0, commands: new Int32Array(16), commandHead: 0, commandTail: 0,
    running: false, accumulator: 0, lastTime: -1, alpha: 0, lastPhase: s.phase, frameHandle: 0, eventCursor: 0, frameCount: 0,
    onPhase: phase => void phases.push(phase),
    onEvent: type => {
      events.push(type)
      if (type === EV_SAVE) writeSave(store, { name: 'Wren', progress: serializeProgress(s) })
    },
    onCommand() {},
    onPoll() {},
  }
  resetLoop(loop)
  loop.lastPhase = s.phase
  return { loop, phases, events, draws: () => draws }
}

test('a command queued during dialog, menu or death is delivered by exactly one step', () => {
  const s = createState()
  newGame(s, 11)
  const { loop, phases } = makeLoop(s, memoryStore())
  startLoop(loop)
  frame()
  assert.equal(s.phase, PHASE_DIALOG)
  assert.equal(s.dialogScript, SCRIPT_INTRO)
  queueCommand(loop, command(CMD_ADVANCE, 0))
  frame()
  assert.equal(s.dialogLine, 1)
  frame()
  frame()
  assert.equal(s.dialogLine, 1, 'the command is not replayed on later frames')
  while (s.phase === PHASE_DIALOG) {
    queueCommand(loop, command(CMD_ADVANCE, 0))
    frame()
  }
  assert.deepEqual(phases, [PHASE_PLAYING])

  const item = grantItem(s, ITEM_GREATSWORD, TIER_RARE)
  setLoopRunning(loop, false)
  const tick = s.tick
  queueCommand(loop, command(CMD_EQUIP, item))
  frame(500)
  assert.equal(s.equipped[SLOT_WEAPON], item)
  assert.equal(s.tick, tick, 'a menu command does not advance time')

  s.phase = PHASE_DEAD
  s.playerState = PL_DEAD
  frame()
  queueCommand(loop, command(CMD_RESPAWN, 0))
  frame()
  assert.equal(s.phase, PHASE_PLAYING)
  assert.deepEqual(phases, [PHASE_PLAYING, PHASE_DEAD, PHASE_PLAYING])
  stopLoop()
})

test('touching a waystone saves through the loop and Continue restores it', () => {
  const s = createState()
  newGame(s, 12)
  const store = memoryStore()
  const { loop, events, draws } = makeLoop(s, store)
  startLoop(loop)
  while (s.phase === PHASE_DIALOG) {
    queueCommand(loop, command(CMD_ADVANCE, 0))
    frame()
  }
  setLoopRunning(loop, true)
  let stone = -1
  for (let i = 0; i < MAX_OBJECTS; i++) if (s.objKind[i] === OBJ_WAYSTONE) stone = i
  assert.ok(stone >= 0)
  s.playerX = s.playerPrevX = s.objX[stone]!
  s.playerY = s.playerPrevY = s.objY[stone]! + 4
  s.gold = 77
  for (let n = 0; n < 4; n++) frame()
  assert.ok(events.includes(EV_SAVE), 'the loop forwards EV_SAVE')
  assert.ok(draws() > 0)
  stopLoop()
  const save = readSave(store, 'Aldric')
  assert.ok(save)
  assert.equal(save.name, 'Wren')
  const restored = createState()
  assert.equal(continueGame(restored, 99, save.progress), true)
  assert.equal(restored.area, AREA_BRENNHOLD)
  assert.equal(restored.checkpointSpawn, AREAS[AREA_BRENNHOLD]!.waystoneSpawn)
  assert.equal(restored.gold, 77)
  assert.equal(restored.chapter, s.chapter)
})
