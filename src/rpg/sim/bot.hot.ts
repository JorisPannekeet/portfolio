import {
  AFFIX_ARMOR,
  AREA_SHRINE,
  AREA_VALDMERE,
  CH_CITADEL,
  CH_GALE,
  AFFIX_ATTACK,
  AFFIX_SLOTS,
  AI_IDLE,
  CMD_ADVANCE,
  CMD_CHOICE,
  CMD_EQUIP,
  CMD_HORN,
  CMD_LEARN,
  CMD_RESPAWN,
  CMD_SCRAP,
  ELEMENT_GALE,
  GUIDE_NONE,
  IN_ATTACK,
  IN_DODGE,
  IN_GUARD,
  IN_INTERACT,
  IN_LOCK,
  IN_SKILL,
  KEY_GRAPPLE,
  KEY_WARHAMMER,
  INPUT_HEADING_MASK,
  INV_CAP,
  MAX_ENEMIES,
  MAX_OBJECTS,
  MELODY_SEALS,
  NODES_PER_TREE,
  OBJ_EXIT,
  OBJ_GRAPPLE,
  OBJ_CHEST,
  OBJ_IDLE,
  OBJ_KEY,
  OBJ_LOOT,
  OBJ_NONE,
  OBJ_SHRINE,
  OBJ_SWITCH,
  OBJ_TRIGGER,
  OBJ_WAYSTONE,
  OBJ_WINDMILL,
  PHASE_DEAD,
  PHASE_DIALOG,
  PHASE_PLAYING,
  PL_IDLE,
  SCRIPT_ENDS_IN_CHOICE,
  SCRIPT_LENGTH,
  SHRINE_COUNT,
  SLOT_WEAPON,
  TILE,
  TILE_BLOCKS_SHOT,
  TILE_BLOCKS_WALK,
  TILE_DOOR,
  TILE_GATE,
  TREE_STEEL,
  itemPower,
  itemSlot,
} from './content.ts'
import { AREAS } from './areas.ts'
import { combatInputAt, headingTo, select, tap } from './bot-combat.hot.ts'
import {
  BOT_ARRIVE_PX,
  BOT_CENTER_PX,
  BOT_CORRUPT_AREA,
  BOT_CORRUPT_CHEST,
  BOT_ENGAGE_TILES,
  BOT_FIELDS,
  BOT_FIELD_REFRESH,
  BOT_FIELD_SOLVES,
  BOT_FREE_SLOTS,
  BOT_HOLD_PX,
  BOT_HORN_PX,
  BOT_LANE_PX,
  BOT_KEY_AREA,
  BOT_KEY_FROM,
  BOT_KEY_TICK,
  BOT_LEARN_ORDER,
  BOT_LOOT_TILES,
  BOT_OPTIONAL,
  BOT_SHATTER,
  BOT_SHOT_MAX,
  BOT_SLOPPY,
  BOT_SLOPPY_PERIOD,
  BOT_SLOPPY_WINDOW,
  BOT_SLOT_NEAR,
  BOT_SLOT_SOLVE,
  BOT_SLOT_STEP,
  BOT_SLOT_WALK,
  BOT_WAKE_PX,
  DIR8_X,
  DIR8_Y,
} from './bot-tuning.ts'
import { SKILL_COST } from './combat-tuning.ts'
import { FLAG_SHRINE_CHEST_FIRST, FLAG_SHRINE_CLEAR_FIRST } from './flags.ts'
import { HINT_KEY_ITEM, HINT_MELODY, NAV_FAR, fillField, puzzleHint } from './nav.ts'
import { ZONE_SHRINE_ARENA } from './story-table.ts'
import { GRAPPLE_RANGE, INTERACT_RANGE } from './world-tuning.ts'
import type { State } from './state.ts'
import { command } from './step.hot.ts'
import { HEADING_TURNS } from '../../game/sim/trig.ts'

const NONE = -1
const NAV_SCAN = 64

let owner: State | null = null

function field(s: State, slot: number, from: number): Int32Array {
  if (owner !== s) {
    owner = s
    BOT_KEY_TICK.fill(NONE)
  }
  const out = BOT_FIELDS[slot]!
  const tick = BOT_KEY_TICK[slot]!
  if (tick >= 0 && s.tick >= tick && s.tick - tick < BOT_FIELD_REFRESH && BOT_KEY_AREA[slot] === s.area && BOT_KEY_FROM[slot] === from) return out
  fillField(s, out, from, BOT_FIELD_SOLVES[slot] === 1)
  BOT_KEY_AREA[slot] = s.area
  BOT_KEY_FROM[slot] = from
  BOT_KEY_TICK[slot] = s.tick
  return out
}

function tileAt(s: State, x: number, y: number): number {
  if (x < 0 || y < 0) return NONE
  const tx = Math.floor(x / TILE)
  const ty = Math.floor(y / TILE)
  if (tx >= s.mapW || ty >= s.mapH) return NONE
  return ty * s.mapW + tx
}

function centerX(s: State, i: number): number {
  return ((i % s.mapW) + 0.5) * TILE
}

function centerY(s: State, i: number): number {
  return (Math.floor(i / s.mapW) + 0.5) * TILE
}

function toward(s: State, x: number, y: number): number {
  return headingTo(x - s.playerX, y - s.playerY)
}

function stepTo(s: State, p: number, next: number): number {
  const x = centerX(s, next)
  const y = centerY(s, next)
  if (p >= 0 && Math.abs(next - p) === 1 && Math.abs(s.playerY - y) > BOT_LANE_PX) return toward(s, s.playerX, y)
  if (p >= 0 && Math.abs(next - p) === s.mapW && Math.abs(s.playerX - x) > BOT_LANE_PX) return toward(s, x, s.playerY)
  return toward(s, x, y)
}

function within(s: State, x: number, y: number, r: number): boolean {
  const dx = x - s.playerX
  const dy = y - s.playerY
  return dx * dx + dy * dy <= r * r
}

function faces(s: State, heading: number): boolean {
  return s.playerFace === (heading - 1) * HEADING_TURNS
}

function neighbour(s: State, i: number, d: number): number {
  const x = (i % s.mapW) + (d === 0 ? 1 : d === 1 ? -1 : 0)
  const y = Math.floor(i / s.mapW) + (d === 2 ? 1 : d === 3 ? -1 : 0)
  if (x < 0 || y < 0 || x >= s.mapW || y >= s.mapH) return NONE
  return y * s.mapW + x
}

function downhill(s: State, f: Int32Array, at: number): number {
  let best = NONE
  let bestD = f[at]!
  for (let d = 0; d < 4; d++) {
    const n = neighbour(s, at, d)
    if (n >= 0 && f[n]! < bestD) {
      best = n
      bestD = f[n]!
    }
  }
  return best
}

function dialogInput(s: State, mode: number): number {
  const script = s.dialogScript
  if (script >= 0 && SCRIPT_ENDS_IN_CHOICE[script] === 1 && s.dialogLine === SCRIPT_LENGTH[script]! - 1) {
    return command(CMD_CHOICE, (mode & BOT_SHATTER) !== 0 ? 1 : 0)
  }
  return command(CMD_ADVANCE, 0)
}

function learnCommand(s: State): number {
  if (s.skillPoints <= 0) return NONE
  for (let k = 0; k < BOT_LEARN_ORDER.length; k++) {
    const node = BOT_LEARN_ORDER[k]!
    if (s.nodes[node] !== 0) continue
    if (node % NODES_PER_TREE !== 0 && s.nodes[node - 1] === 0) continue
    const tree = Math.floor(node / NODES_PER_TREE)
    if (tree !== TREE_STEEL && (s.stancesUnlocked & (1 << tree)) === 0) continue
    return command(CMD_LEARN, node)
  }
  return NONE
}

function itemScore(s: State, i: number): number {
  const base = s.invBase[i]!
  const own = itemSlot(base) === SLOT_WEAPON ? AFFIX_ATTACK : AFFIX_ARMOR
  let score = itemPower(base, s.invTier[i]!, s.invLevel[i]!)
  for (let k = i * AFFIX_SLOTS; k < (i + 1) * AFFIX_SLOTS; k++) if (s.invAffix[k] === own) score += s.invAffixValue[k]!
  return score
}

function equipCommand(s: State): number {
  for (let i = 0; i < INV_CAP; i++) {
    const base = s.invBase[i]!
    if (base < 0) continue
    const current = s.equipped[itemSlot(base)]!
    if (current === i) continue
    if (current < 0 || itemScore(s, i) > itemScore(s, current)) return command(CMD_EQUIP, i)
  }
  return NONE
}

function isEquipped(s: State, i: number): boolean {
  return s.equipped[itemSlot(s.invBase[i]!)] === i
}

function scrapCommand(s: State): number {
  let free = 0
  let worst = NONE
  for (let i = 0; i < INV_CAP; i++) {
    if (s.invBase[i]! < 0) free++
    else if (!isEquipped(s, i) && (worst < 0 || itemScore(s, i) < itemScore(s, worst))) worst = i
  }
  return free < BOT_FREE_SLOTS && worst >= 0 ? command(CMD_SCRAP, worst) : NONE
}

function pickFoe(s: State, near: Int32Array): number {
  let best = NONE
  let bestD = NAV_FAR
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (s.eAlive[i] !== 1) continue
    const t = tileAt(s, s.eX[i]!, s.eY[i]!)
    if (t < 0) continue
    const d = near[t]!
    if (d > BOT_ENGAGE_TILES) continue
    if (s.eState[i] === AI_IDLE && !within(s, s.eX[i]!, s.eY[i]!, BOT_WAKE_PX)) continue
    if (d < bestD) {
      best = i
      bestD = d
    }
  }
  return best
}

function firstStep(s: State, near: Int32Array, at: number): number {
  let cur = at
  for (let guard = 0; guard < NAV_SCAN && near[cur]! > 1; guard++) {
    let next = NONE
    for (let d = 0; d < 4; d++) {
      const n = neighbour(s, cur, d)
      if (n >= 0 && near[n] === near[cur]! - 1) {
        next = n
        break
      }
    }
    if (next < 0) return NONE
    cur = next
  }
  return near[cur] === 1 ? cur : NONE
}

function fight(s: State, foe: number, near: Int32Array, mode: number): number {
  let input = combatInputAt(s, foe)
  if ((input & INPUT_HEADING_MASK) !== 0) input = (input & ~INPUT_HEADING_MASK) | approach(s, near, s.eX[foe]!, s.eY[foe]!)
  if ((mode & BOT_SLOPPY) !== 0) {
    input &= ~(IN_GUARD | IN_DODGE)
    if (s.tick % BOT_SLOPPY_PERIOD >= BOT_SLOPPY_WINDOW) input &= ~IN_ATTACK
  }
  return input
}

function nearestLoot(s: State, near: Int32Array): number {
  let best = NONE
  let bestD = BOT_LOOT_TILES + 1
  for (let i = 0; i < MAX_OBJECTS; i++) {
    if (s.objKind[i] !== OBJ_LOOT) continue
    const t = tileAt(s, s.objX[i]!, s.objY[i]!)
    if (t >= 0 && near[t]! < bestD) {
      best = i
      bestD = near[t]!
    }
  }
  return best
}

function approach(s: State, near: Int32Array, x: number, y: number): number {
  const t = tileAt(s, x, y)
  if (near[t]! < 1) return toward(s, x, y)
  const step = near[t] === 1 ? t : firstStep(s, near, t)
  return step < 0 ? toward(s, x, y) : stepTo(s, tileAt(s, s.playerX, s.playerY), step)
}

function centered(s: State, i: number, slack: number): boolean {
  return Math.abs(s.playerX - centerX(s, i)) <= slack && Math.abs(s.playerY - centerY(s, i)) <= slack
}

function goTo(s: State, goal: number): number {
  const p = tileAt(s, s.playerX, s.playerY)
  if (p === goal) return centered(s, goal, BOT_CENTER_PX) ? 0 : toward(s, centerX(s, goal), centerY(s, goal))
  const f = field(s, BOT_SLOT_STEP, goal)
  const next = downhill(s, f, p)
  return next < 0 ? 0 : stepTo(s, p, next)
}

function aim(s: State, at: number, heading: number): number {
  const slack = faces(s, heading) ? BOT_HOLD_PX : BOT_CENTER_PX
  if (tileAt(s, s.playerX, s.playerY) !== at || !centered(s, at, slack)) return goTo(s, at)
  return faces(s, heading) ? NONE : heading
}

function castAt(s: State, element: number): number {
  if (s.playerState !== PL_IDLE || s.focus < SKILL_COST) return select(element)
  return select(element) | tap(s, IN_SKILL)
}

function grapple(s: State, near: Int32Array): number {
  if (s.interactObj >= 0 && s.objKind[s.interactObj] === OBJ_GRAPPLE) return s.playerState === PL_IDLE ? tap(s, IN_INTERACT) : 0
  let best = NONE
  let bestD = NAV_FAR
  for (let i = 0; i < MAX_OBJECTS; i++) {
    if (s.objKind[i] !== OBJ_GRAPPLE) continue
    const t = tileAt(s, s.objX[i]!, s.objY[i]!)
    if (t >= 0 && near[t]! < bestD) {
      best = t
      bestD = near[t]!
    }
  }
  return best < 0 ? 0 : goTo(s, best)
}

function findObject(s: State, kind: number, arg: number): number {
  for (let i = 0; i < MAX_OBJECTS; i++) if (s.objKind[i] === kind && s.objArg[i] === arg && s.objState[i] === OBJ_IDLE) return i
  return NONE
}

function windmill(s: State, flag: number): number {
  const w = findObject(s, OBJ_WINDMILL, flag)
  if (w < 0) return 0
  const t = tileAt(s, s.objX[w]!, s.objY[w]!)
  if (tileAt(s, s.playerX, s.playerY) !== t || !centered(s, t, BOT_HOLD_PX)) return goTo(s, t)
  return castAt(s, ELEMENT_GALE)
}

function quiet(s: State, i: number): boolean {
  const x = centerX(s, i)
  const y = centerY(s, i)
  for (let o = 0; o < MAX_OBJECTS; o++) {
    const kind = s.objKind[o]!
    if (kind === OBJ_NONE || kind === OBJ_EXIT || kind === OBJ_LOOT || kind === OBJ_KEY || kind === OBJ_TRIGGER || kind === OBJ_WAYSTONE) continue
    const reach = (kind === OBJ_GRAPPLE ? GRAPPLE_RANGE : INTERACT_RANGE) + TILE
    const dx = s.objX[o]! - x
    const dy = s.objY[o]! - y
    if (dx * dx + dy * dy <= reach * reach) return false
  }
  return true
}

function shootSwitch(s: State, flag: number, near: Int32Array): number {
  const sw = findObject(s, OBJ_SWITCH, flag)
  if (sw < 0) return 0
  const sx = Math.floor(s.objX[sw]! / TILE)
  const sy = Math.floor(s.objY[sw]! / TILE)
  let spot = NONE
  let spotDir = 0
  let spotD = NAV_FAR
  for (let d = 0; d < 8; d++) {
    for (let k = 1; k <= BOT_SHOT_MAX; k++) {
      const x = sx + DIR8_X[d]! * k
      const y = sy + DIR8_Y[d]! * k
      if (x < 0 || y < 0 || x >= s.mapW || y >= s.mapH) break
      const i = y * s.mapW + x
      if (TILE_BLOCKS_SHOT[s.tiles[i]!] !== 0) break
      if (k < 2 || TILE_BLOCKS_WALK[s.tiles[i]!] !== 0 || near[i]! >= spotD || !quiet(s, i)) continue
      spot = i
      spotDir = (d + 4) % 8
      spotD = near[i]!
    }
  }
  if (spot < 0) return 0
  const ready = aim(s, spot, 1 + spotDir * 2)
  if (ready !== NONE) return ready
  if (s.playerState !== PL_IDLE || s.interactObj >= 0) return 0
  return tap(s, IN_INTERACT)
}

function remoteSolve(s: State, n: number, near: Int32Array): number {
  const hint = puzzleHint(s, n)
  if (hint === HINT_MELODY + MELODY_SEALS) return within(s, centerX(s, n), centerY(s, n), BOT_HORN_PX) ? command(CMD_HORN, MELODY_SEALS) : NONE
  if (hint === HINT_KEY_ITEM + KEY_GRAPPLE) return grapple(s, near)
  if (s.tiles[n] !== TILE_GATE) return NONE
  const flag = AREAS[s.area]!.tileFlag[n]!
  return hint === ELEMENT_GALE ? windmill(s, flag) : shootSwitch(s, flag, near)
}

function solveTile(s: State, p: number, n: number): number {
  if (s.tiles[n] === TILE_DOOR) return toward(s, centerX(s, n), centerY(s, n))
  const ready = aim(s, p, headingTo(centerX(s, n) - centerX(s, p), centerY(s, n) - centerY(s, p)))
  if (ready !== NONE) return ready
  const hint = puzzleHint(s, n)
  if (hint === HINT_KEY_ITEM + KEY_WARHAMMER) return s.playerState === PL_IDLE ? tap(s, IN_ATTACK) : 0
  return hint >= 0 && hint < HINT_KEY_ITEM ? castAt(s, hint) : 0
}

function firstBlocker(s: State, f: Int32Array, p: number): number {
  let at = p
  for (let k = 0; k < NAV_SCAN; k++) {
    const next = downhill(s, f, at)
    if (next < 0) return NONE
    if (TILE_BLOCKS_WALK[s.tiles[next]!] !== 0) return next
    at = next
  }
  return NONE
}

function objectAt(s: State, x: number, y: number): number {
  for (let i = 0; i < MAX_OBJECTS; i++) if (s.objKind[i] !== OBJ_NONE && s.objX[i] === x && s.objY[i] === y) return i
  return NONE
}

function pursue(s: State, gx: number, gy: number, near: Int32Array): number {
  const goal = tileAt(s, gx, gy)
  if (goal < 0) return 0
  const target = objectAt(s, gx, gy)
  if (target >= 0 && s.interactObj === target) return tap(s, IN_INTERACT)
  const p = tileAt(s, s.playerX, s.playerY)
  if (p === goal) return within(s, gx, gy, BOT_ARRIVE_PX) ? 0 : toward(s, gx, gy)
  let f = field(s, BOT_SLOT_WALK, goal)
  if (f[p] === NAV_FAR) f = field(s, BOT_SLOT_SOLVE, goal)
  const next = downhill(s, f, p)
  if (next < 0) return 0
  const blocker = firstBlocker(s, f, p)
  if (blocker >= 0) {
    const remote = remoteSolve(s, blocker, near)
    if (remote !== NONE) return remote
  }
  if (TILE_BLOCKS_WALK[s.tiles[next]!] === 0) return stepTo(s, p, next)
  return solveTile(s, p, next)
}

let goalX = 0
let goalY = 0

function aimAt(s: State, kind: number, arg: number, flag: number): boolean {
  for (let i = 0; i < MAX_OBJECTS; i++) {
    if (s.objKind[i] !== kind || (arg >= 0 && s.objArg[i] !== arg) || (flag >= 0 && s.objFlag[i] !== flag)) continue
    goalX = s.objX[i]!
    goalY = s.objY[i]!
    return true
  }
  return false
}

function leaveFor(s: State, area: number): boolean {
  return aimAt(s, OBJ_EXIT, s.area === AREA_VALDMERE ? area : AREA_VALDMERE, NONE)
}

function shrineGoal(s: State, v: number): boolean {
  if (s.area === AREA_SHRINE && s.areaVariant === v) {
    if (s.flags[FLAG_SHRINE_CLEAR_FIRST + v] !== 0) return aimAt(s, OBJ_CHEST, NONE, FLAG_SHRINE_CHEST_FIRST + v)
    return aimAt(s, OBJ_TRIGGER, ZONE_SHRINE_ARENA, NONE)
  }
  if (s.area === AREA_VALDMERE) return aimAt(s, OBJ_SHRINE, v, NONE)
  return leaveFor(s, AREA_VALDMERE)
}

function optionalGoal(s: State): boolean {
  if (s.chapter < CH_GALE || s.chapter > CH_CITADEL) return false
  for (let v = 0; v < SHRINE_COUNT; v++) if (s.flags[FLAG_SHRINE_CHEST_FIRST + v] === 0) return shrineGoal(s, v)
  for (let k = 0; k < BOT_CORRUPT_AREA.length; k++) {
    const flag = BOT_CORRUPT_CHEST[k]!
    if (s.flags[flag] !== 0) continue
    if (s.area === BOT_CORRUPT_AREA[k]) return aimAt(s, OBJ_CHEST, NONE, flag)
    return leaveFor(s, BOT_CORRUPT_AREA[k]!)
  }
  return false
}

export function botInput(s: State, mode: number): number {
  if (s.phase === PHASE_DIALOG) return dialogInput(s, mode)
  if (s.phase === PHASE_DEAD) return command(CMD_RESPAWN, 0)
  if (s.phase !== PHASE_PLAYING) return 0
  const learn = learnCommand(s)
  if (learn >= 0) return learn
  const equip = equipCommand(s)
  if (equip >= 0) return equip
  const scrap = scrapCommand(s)
  if (scrap >= 0) return scrap
  const near = field(s, BOT_SLOT_NEAR, tileAt(s, s.playerX, s.playerY))
  const foe = pickFoe(s, near)
  if (foe >= 0) return fight(s, foe, near, mode)
  if (s.lockTarget >= 0) return tap(s, IN_LOCK)
  const loot = nearestLoot(s, near)
  if (loot >= 0) return approach(s, near, s.objX[loot]!, s.objY[loot]!)
  if ((mode & BOT_OPTIONAL) !== 0 && optionalGoal(s)) return pursue(s, goalX, goalY, near)
  if (s.guideX === GUIDE_NONE) return 0
  return pursue(s, s.guideX, s.guideY, near)
}

