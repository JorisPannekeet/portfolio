import {
  AREA_ELEMENT,
  AREA_VALDMERE,
  GOAL_REACH_CHILD,
  GOAL_RETURN_MAREN,
  GOAL_TAKE_SHARD,
  GOAL_TALK_MAREN,
  GUIDE_NONE,
  MAX_ENEMIES,
  MAX_OBJECTS,
  NPC_MAREN,
  OBJ_EXIT,
  OBJ_NONE,
  OBJ_NPC,
  OBJ_PEDESTAL,
  OBJ_TRIGGER,
} from './content.ts'
import type { State } from './state.ts'
import { AREAS } from './areas.ts'
import { CHAPTER_DUNGEON, CHAPTER_GOAL, GOAL_AREA, GUIDE_STEPS_PER_AREA, GUIDE_STEP_FLAG, ZONE_CHILD } from './story-table.ts'

function pointAt(s: State, kind: number, arg: number): boolean {
  for (let i = 0; i < MAX_OBJECTS; i++) {
    if (s.objKind[i] !== kind || s.objArg[i] !== arg) continue
    s.guideX = s.objX[i]!
    s.guideY = s.objY[i]!
    return true
  }
  return false
}

function pointAtFlag(s: State, flag: number): boolean {
  for (let i = 0; i < MAX_OBJECTS; i++) {
    if (s.objFlag[i] !== flag || s.objKind[i] === OBJ_NONE) continue
    s.guideX = s.objX[i]!
    s.guideY = s.objY[i]!
    return true
  }
  return false
}

function pointAtMissingStep(s: State, area: number): boolean {
  for (let k = 0; k < GUIDE_STEPS_PER_AREA; k++) {
    const flag = GUIDE_STEP_FLAG[area * GUIDE_STEPS_PER_AREA + k]!
    if (flag >= 0 && s.flags[flag] === 0 && pointAtFlag(s, flag)) return true
  }
  return false
}

function pointAtEnemy(s: State): boolean {
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (s.eAlive[i] !== 1) continue
    s.guideX = s.eX[i]!
    s.guideY = s.eY[i]!
    return true
  }
  return false
}

function bossDown(s: State, area: number): boolean {
  const flag = AREAS[area]!.bossFlag[0]!
  return flag >= 0 && s.flags[flag] !== 0
}

export function updateGuide(s: State): void {
  let goal = CHAPTER_GOAL[s.chapter] ?? CHAPTER_GOAL[0]!
  let area = GOAL_AREA[goal]!
  const dungeon = CHAPTER_DUNGEON[s.chapter] ?? -1
  if (dungeon >= 0 && bossDown(s, dungeon) && (s.shards & (1 << AREA_ELEMENT[dungeon]!)) === 0) {
    goal = GOAL_TAKE_SHARD
    area = dungeon
  }
  s.goal = goal
  s.guideX = GUIDE_NONE
  s.guideY = GUIDE_NONE
  if (area < 0) return
  if (s.area !== area || s.areaVariant !== 0) {
    pointAt(s, OBJ_EXIT, s.area === AREA_VALDMERE ? area : AREA_VALDMERE)
    return
  }
  if (goal === GOAL_TALK_MAREN || goal === GOAL_RETURN_MAREN) pointAt(s, OBJ_NPC, NPC_MAREN)
  else if (goal === GOAL_REACH_CHILD) {
    if (!pointAtEnemy(s)) pointAt(s, OBJ_TRIGGER, ZONE_CHILD)
  }
  else if (goal === GOAL_TAKE_SHARD) pointAt(s, OBJ_PEDESTAL, AREA_ELEMENT[area]!)
  else if (!pointAtMissingStep(s, area)) {
    const a = AREAS[area]!
    if (a.bossX >= 0) {
      s.guideX = a.bossX
      s.guideY = a.bossY
    }
  }
}
