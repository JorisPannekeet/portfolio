import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  MAX_ENEMIES,
  OBJ_CHEST,
  OBJ_KEY,
  AREA_BARROW,
  AREA_BRENNHOLD,
  AREA_SALTREACH,
  AREA_VALDMERE,
  BOSS_BARROW_KING,
  BOSS_VAREK,
  CH_BARROW,
  CH_CHOICE,
  CH_CITADEL,
  CH_COUNT,
  CH_EMBER,
  CH_ENDED,
  CH_FLEE,
  CH_RAID,
  CH_TIDE,
  CH_VIGIL,
  CMD_ADVANCE,
  CMD_CHOICE,
  ELEMENT_STONE,
  ELEMENT_TIDE,
  ENDING_REFORGE,
  ENDING_SHATTER,
  EVENT_CAP,
  EV_ENDING,
  EV_VIGIL,
  GOAL_BARROW,
  GOAL_REACH_CHILD,
  GOAL_TAKE_SHARD,
  GOAL_TALK_MAREN,
  GUIDE_NONE,
  IN_INTERACT,
  MELODY_ROADS,
  MELODY_STABLE,
  NPC_MAREN,
  NPC_SMITH,
  OBJ_EXIT,
  OBJ_NPC,
  OBJ_PEDESTAL,
  PHASE_DIALOG,
  PHASE_ENDED,
  PHASE_PLAYING,
  SCRIPT_CHOICE,
  SCRIPT_COUNT,
  SCRIPT_ENDS_IN_CHOICE,
  SCRIPT_INTRO,
  SCRIPT_LENGTH,
  SCRIPT_NONE,
  SCRIPT_SMITH,
  SCRIPT_VIGIL,
  SCRIPT_WAKING,
} from '../../src/rpg/sim/content.ts'
import { AREAS } from '../../src/rpg/sim/areas.ts'
import { applyCommand } from '../../src/rpg/sim/commands.hot.ts'
import { damageEnemy } from '../../src/rpg/sim/enemies.hot.ts'
import { continueGame, newGame } from '../../src/rpg/sim/game.ts'
import { flagId } from '../../src/rpg/sim/flags.ts'
import { CHEST_WARHAMMER, VIGIL_HP } from '../../src/rpg/sim/loot-tables.ts'
import { onEnemyKilled } from '../../src/rpg/sim/loot.hot.ts'
import { serializeProgress } from '../../src/rpg/sim/progress.ts'
import { createState } from '../../src/rpg/sim/state.ts'
import { fireStory, updateStory } from '../../src/rpg/sim/story.hot.ts'
import {
  ANY_CHAPTER,
  EFF_END,
  EFF_REFORGE,
  EFF_SHATTER,
  STORY_ROWS,
  TRG_CHOICE,
  TRG_SCRIPT,
  TRG_SHARD,
  TRG_ZONE,
  ZONE_BARROW_BOSS,
  ZONE_CHILD,
} from '../../src/rpg/sim/story-table.ts'
import { loadArea } from '../../src/rpg/sim/world.hot.ts'
import { charCenter, finishDialog, freshGame, objectsOf, standAt, worldTick } from './world-helpers.ts'

interface Node {
  chapter: number
  script: number
  ending: number
}

function successors(n: Node): Node[] {
  const out: Node[] = []
  const fire = (trigger: number, arg: number): void => {
    for (const r of STORY_ROWS) {
      if (r.chapter !== ANY_CHAPTER && r.chapter !== n.chapter) continue
      if (r.trigger !== trigger || r.arg !== arg) continue
      const ending = (r.effects & EFF_REFORGE) !== 0 ? ENDING_REFORGE : (r.effects & EFF_SHATTER) !== 0 ? ENDING_SHATTER : n.ending
      const chapter = r.nextChapter === ANY_CHAPTER ? n.chapter : r.nextChapter
      out.push({ chapter, script: (r.effects & EFF_END) !== 0 ? -2 : r.script, ending })
      return
    }
    if (trigger === TRG_SCRIPT || trigger === TRG_CHOICE) out.push({ chapter: n.chapter, script: SCRIPT_NONE, ending: n.ending })
  }
  if (n.script === -2) return out
  if (n.script >= 0) {
    if (SCRIPT_ENDS_IN_CHOICE[n.script]) {
      fire(TRG_CHOICE, 0)
      fire(TRG_CHOICE, 1)
    } else fire(TRG_SCRIPT, n.script)
    return out
  }
  for (const r of STORY_ROWS) {
    if (r.trigger === TRG_SCRIPT || r.trigger === TRG_CHOICE) continue
    if (r.chapter !== ANY_CHAPTER && r.chapter !== n.chapter) continue
    fire(r.trigger, r.arg)
  }
  return out
}

function explore(): Map<string, Node> {
  const start: Node = { chapter: CH_RAID, script: SCRIPT_INTRO, ending: 0 }
  const seen = new Map<string, Node>([[JSON.stringify(start), start]])
  const queue = [start]
  while (queue.length > 0) {
    for (const next of successors(queue.shift()!)) {
      const key = JSON.stringify(next)
      if (seen.has(key)) continue
      seen.set(key, next)
      queue.push(next)
    }
  }
  return seen
}

test('story model: every chapter is reachable from the raid and both endings finish the game', () => {
  const states = [...explore().values()]
  for (let ch = 0; ch < CH_COUNT; ch++) assert.ok(states.some(n => n.chapter === ch), 'chapter ' + ch + ' reachable')
  for (const ending of [ENDING_REFORGE, ENDING_SHATTER]) {
    assert.ok(states.some(n => n.script === -2 && n.ending === ending && n.chapter === CH_ENDED), 'ending ' + ending)
  }
})

test('story model: no chapter is a dead end before the ending', () => {
  for (const n of explore().values()) {
    if (n.script === -2) continue
    const nexts = successors(n)
    assert.ok(nexts.length > 0, 'state ' + JSON.stringify(n) + ' has a way forward')
    if (n.chapter !== CH_ENDED && n.script < 0) {
      const advancing = STORY_ROWS.some(r => r.chapter === n.chapter && r.nextChapter !== n.chapter)
      const viaScript = STORY_ROWS.some(r => r.chapter === n.chapter && r.trigger === TRG_SCRIPT)
      assert.ok(advancing || viaScript, 'chapter ' + n.chapter + ' advances')
    }
  }
})

test('the story table names only valid scripts and chapters', () => {
  for (const r of STORY_ROWS) {
    assert.ok(r.script === SCRIPT_NONE || (r.script >= 0 && r.script < SCRIPT_COUNT))
    assert.ok(r.nextChapter === ANY_CHAPTER || (r.nextChapter >= 0 && r.nextChapter < CH_COUNT))
    assert.ok(r.chapter === ANY_CHAPTER || r.chapter < CH_COUNT)
  }
})

test('newGame starts the raid in Brennhold with the intro, gear and a guide to the child', () => {
  const s = createState()
  newGame(s, 5)
  assert.equal(s.area, AREA_BRENNHOLD)
  assert.equal(s.chapter, CH_RAID)
  assert.equal(s.phase, PHASE_DIALOG)
  assert.equal(s.dialogScript, SCRIPT_INTRO)
  assert.ok(s.equipped[0]! >= 0 && s.equipped[2]! >= 0)
  assert.ok(s.statAttack > 9 && s.statAttack < 11)
  assert.equal(s.goal, GOAL_REACH_CHILD)
  assert.notEqual(s.guideX, GUIDE_NONE)
  for (let i = 0; i < SCRIPT_LENGTH[SCRIPT_INTRO]! - 1; i++) applyCommand(s, CMD_ADVANCE, 0)
  assert.equal(s.phase, PHASE_DIALOG)
  applyCommand(s, CMD_ADVANCE, 0)
  assert.equal(s.phase, PHASE_PLAYING)
})

test('beating the footmen and reaching the child wakes the Stone stance, then Maren sends Aldric to the Barrow with the horn', () => {
  const s = freshGame()
  for (let i = 0; i < MAX_ENEMIES; i++) if (s.eAlive[i] === 1) damageEnemy(s, i, 1e6, -1, s.playerX, s.playerY)
  const [cx, cy] = charCenter(AREA_BRENNHOLD, 'A')
  standAt(s, cx, cy)
  worldTick(s, 0)
  assert.equal(s.dialogScript, SCRIPT_WAKING)
  finishDialog(s)
  assert.equal(s.chapter, CH_FLEE)
  assert.ok((s.stancesUnlocked & (1 << ELEMENT_STONE)) !== 0)
  assert.equal(s.goal, GOAL_TALK_MAREN)
  const maren = objectsOf(s, OBJ_NPC, NPC_MAREN)[0]!
  assert.equal(s.guideX, s.objX[maren])
  standAt(s, s.objX[maren]!, s.objY[maren]! + 10)
  worldTick(s, 0)
  worldTick(s, IN_INTERACT)
  assert.equal(s.interactUsed, 1)
  finishDialog(s)
  assert.equal(s.chapter, CH_BARROW)
  assert.equal(s.melodies, (1 << MELODY_STABLE) | (1 << MELODY_ROADS))
  assert.equal(s.goal, GOAL_BARROW)
  loadArea(s, AREA_BRENNHOLD, 0)
  const exit = objectsOf(s, OBJ_EXIT)[0]!
  assert.equal(s.guideX, s.objX[exit])
})

test('talking to the smith plays his line and does not move the story', () => {
  const s = freshGame()
  const smith = objectsOf(s, OBJ_NPC, NPC_SMITH)[0]!
  standAt(s, s.objX[smith]!, s.objY[smith]! + 12)
  worldTick(s, 0)
  worldTick(s, IN_INTERACT)
  assert.equal(s.dialogScript, SCRIPT_SMITH)
  finishDialog(s)
  assert.equal(s.chapter, CH_RAID)
})

test('the Barrow boss unlocks the pedestal, the shard leads through the twist to the Tide chapter', () => {
  const s = freshGame()
  s.chapter = CH_BARROW
  s.stancesUnlocked = 1
  loadArea(s, AREA_BARROW, 0)
  const pedestal = objectsOf(s, OBJ_PEDESTAL)[0]!
  standAt(s, s.objX[pedestal]!, s.objY[pedestal]! + 10)
  worldTick(s, 0)
  assert.equal(s.interactObj, -1, 'the pedestal is dead while the boss lives')
  s.eKind[0] = BOSS_BARROW_KING
  s.eElite[0] = 0
  s.eX[0] = s.playerX
  s.eY[0] = s.playerY
  onEnemyKilled(s, 0)
  updateStory(s)
  assert.equal(s.goal, GOAL_TAKE_SHARD)
  worldTick(s, 0)
  assert.equal(s.interactObj, pedestal)
  worldTick(s, IN_INTERACT)
  assert.ok((s.shards & (1 << ELEMENT_STONE)) !== 0)
  finishDialog(s)
  assert.equal(s.chapter, CH_TIDE)
})

test('the Tide shard runs the Vigil: chapter Ember, the Vigil max HP bonus, EV_VIGIL, corrupted Barrow', () => {
  const s = freshGame()
  s.chapter = CH_TIDE
  const before = s.statMaxHp
  fireStory(s, TRG_SHARD, ELEMENT_TIDE)
  assert.equal(s.chapter, CH_VIGIL)
  const head = s.evHead
  finishDialog(s)
  assert.equal(s.chapter, CH_EMBER)
  assert.equal(s.statMaxHp, before + VIGIL_HP)
  let vigil = false
  for (let e = head; e < s.evHead; e++) if (s.evType[e % EVENT_CAP] === EV_VIGIL) vigil = true
  assert.ok(vigil)
  loadArea(s, AREA_BARROW, 0)
  assert.equal(s.areaVariant, 1)
  loadArea(s, AREA_SALTREACH, 0)
  assert.equal(s.areaVariant, 1)
})

test('Varek falls, the choice is offered and each answer ends the game with its ending', () => {
  for (const [choice, ending] of [[0, ENDING_REFORGE], [1, ENDING_SHATTER]] as const) {
    const s = freshGame()
    s.chapter = CH_CITADEL
    s.eKind[0] = BOSS_VAREK
    onEnemyKilled(s, 0)
    assert.equal(s.chapter, CH_CHOICE)
    assert.equal(s.dialogScript, SCRIPT_CHOICE)
    for (let i = 0; i < 10; i++) applyCommand(s, CMD_ADVANCE, 0)
    assert.equal(s.dialogScript, SCRIPT_CHOICE, 'advance never skips the choice')
    applyCommand(s, CMD_CHOICE, 7)
    assert.equal(s.dialogScript, SCRIPT_CHOICE, 'an out-of-range choice is ignored')
    applyCommand(s, CMD_CHOICE, choice)
    assert.equal(s.chapter, CH_ENDED)
    assert.equal(s.ending, ending)
    finishDialog(s)
    assert.equal(s.phase, PHASE_ENDED)
    assert.equal(s.evType[(s.evHead - 1) % EVENT_CAP], EV_ENDING)
  }
})

test('zone scripts flagged once only fire once', () => {
  const s = freshGame()
  s.chapter = CH_BARROW
  assert.equal(fireStory(s, TRG_ZONE, ZONE_BARROW_BOSS), true)
  finishDialog(s)
  assert.equal(fireStory(s, TRG_ZONE, ZONE_BARROW_BOSS), false)
  assert.equal(fireStory(s, TRG_ZONE, ZONE_CHILD), false)
})

test('continuing a save made mid-Vigil resumes the Vigil instead of soft-locking', () => {
  const s = freshGame()
  s.chapter = CH_VIGIL
  s.shards = 3
  const save = serializeProgress(s)
  const t = createState()
  assert.equal(continueGame(t, 9, save), true)
  assert.equal(t.dialogScript, SCRIPT_VIGIL)
  finishDialog(t)
  assert.equal(t.chapter, CH_EMBER)
})

test('the guide points at the exit toward the goal from the hub', () => {
  const s = freshGame()
  s.chapter = CH_BARROW
  loadArea(s, AREA_VALDMERE, 0)
  const toBarrow = objectsOf(s, OBJ_EXIT, AREA_BARROW)[0]!
  assert.equal(s.guideX, s.objX[toBarrow])
  assert.equal(s.guideY, s.objY[toBarrow])
  s.chapter = CH_BARROW
  loadArea(s, AREA_BARROW, 0)
  const key = objectsOf(s, OBJ_KEY)[0]!
  assert.deepEqual([s.guideX, s.guideY], [s.objX[key], s.objY[key]], 'the key before the boss')
  s.flags[flagId('BARROW_KEY')] = 1
  loadArea(s, AREA_BARROW, 0)
  const hammer = objectsOf(s, OBJ_CHEST, CHEST_WARHAMMER)[0]!
  assert.deepEqual([s.guideX, s.guideY], [s.objX[hammer], s.objY[hammer]], 'then the warhammer chest')
  s.flags[flagId('BARROW_ITEM_CHEST')] = 1
  loadArea(s, AREA_BARROW, 0)
  assert.equal(s.guideX, AREAS[AREA_BARROW]!.bossX)
  s.chapter = CH_CHOICE
  loadArea(s, AREA_VALDMERE, 0)
  assert.equal(s.guideX, GUIDE_NONE)
})
