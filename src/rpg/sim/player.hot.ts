import {
  ELEMENT_EMBER,
  ELEMENT_GALE,
  ELEMENT_NONE,
  ELEMENT_STONE,
  ELEMENT_TIDE,
  EV_DEAD,
  EV_DODGE,
  EV_FINISHER,
  EV_MOUNT,
  EV_PARRY,
  EV_PERFECT_BLOCK,
  EV_PLAYER_HURT,
  EV_BLOCK,
  EV_SHOOT,
  EV_SKILL,
  EV_STANCE,
  EV_SWING,
  HEAT_MAX,
  IN_ATTACK,
  IN_DODGE,
  IN_GUARD,
  IN_INTERACT,
  IN_LOCK,
  IN_SKILL,
  IN_STANCE_MASK,
  IN_STANCE_SHIFT,
  INPUT_DIRECTIONS,
  INPUT_HEADING_MASK,
  KEY_LONGBOW,
  MAX_ENEMIES,
  NODE_EMBER_FLASHFIRE,
  NODE_EMBER_INFERNO,
  NODE_EMBER_KINDLE,
  NODE_EMBER_STOKE,
  NODE_GALE_SLIPSTREAM,
  NODE_GALE_TAILWIND,
  NODE_GALE_UPDRAFT,
  NODE_STEEL_FINISHER,
  NODE_STONE_AFTERSHOCK,
  NODE_STONE_ANSWER,
  NODE_STONE_BULWARK,
  NODE_STONE_ROOTED,
  NODE_TIDE_RIPTIDE,
  NODE_TIDE_STILLWATER,
  NODE_VALUE,
  OWNER_PLAYER,
  PHASE_DEAD,
  PHASE_PLAYING,
  PL_ATTACK,
  PL_BOW,
  PL_DEAD,
  PL_DODGE,
  PL_GRAPPLE,
  PL_GUARD,
  PL_HURT,
  PL_IDLE,
  PL_SKILL,
  PROJ_PLAYER_ARROW,
  SET_ASHFORGED,
  SET_BARROWGUARD,
  SET_SKYWEAVE,
  SET_TIDEWARDEN,
  SET_VALUE,
} from './content.ts'
import {
  AIM_ASSIST_ARC,
  AIM_ASSIST_REACH,
  ANSWER_SCALE,
  ARMED_CHAIN,
  ASHFORGED_HEAT,
  ATTACK_DRIFT,
  BLOCK_STAMINA_PER_DAMAGE,
  BOW_DRIFT,
  BOW_TICKS,
  BUF_ATTACK,
  BUF_SWUNG,
  COMBO_CHAIN_FRACTION,
  COMBO_GRACE,
  COMBO_LENGTH,
  COUNTER_MULT,
  CRIT_MULT,
  DASH_IFRAMES,
  DASH_SPEED,
  DASH_TICKS,
  DEATH_TICKS,
  DODGE_COST,
  DODGE_IFRAMES,
  DODGE_SPEED,
  DODGE_TICKS,
  FINISHER_BURN,
  FINISHER_CHAIN,
  FINISHER_CHILL,
  FINISHER_MULT,
  FINISHER_STAGGER,
  FOCUS_PARRY,
  FOCUS_PERFECT,
  FOCUS_PER_HIT,
  FOCUS_REGEN,
  GRAPPLE_ARRIVE,
  GRAPPLE_SPEED,
  GUARD_ARC,
  GUARD_SPEED,
  GUST_PUSH,
  HEAT_DAMAGE,
  HEAT_DECAY,
  HEAT_HOLD,
  HEAT_PER_HIT,
  HURT_IFRAMES,
  HURT_TICKS,
  INFERNO_RADIUS,
  LAUNCH_TICKS,
  LOCK_BREAK,
  LOCK_RANGE,
  MAX_COMBO,
  MOUNT_SPEED,
  MOVE_ACTIVE,
  MOVE_ARC,
  MOVE_DAMAGE,
  MOVE_LAUNCH,
  MOVE_REACH,
  MOVE_RECOVERY,
  MOVE_STAGGER,
  MOVE_STAMINA,
  MOVE_WINDUP,
  OUT_BLOCK,
  OUT_DODGED,
  OUT_HIT,
  OUT_IGNORED,
  OUT_PARRY,
  OUT_PERFECT,
  PARRY_STAGGER,
  PLAYER_ARROW_DAMAGE,
  PLAYER_ARROW_SPEED,
  PLAYER_RADIUS,
  PROJ_UNBLOCKABLE,
  SHOT_SAMPLE_PX,
  SKILL_BURN,
  SKILL_CHILL,
  SKILL_COST,
  SKILL_DAMAGE,
  SKILL_HEAT_SCALE,
  SKILL_OFFSET,
  SKILL_RADIUS,
  SKILL_STAGGER,
  SKILL_TICKS,
  SLIPSTREAM_REACH,
  STANCE_PLAIN,
  STONE_BLOCK_FACTOR,
  STAGGER_PER_POISE,
  STRIKE_POINT,
  TIDE_PARRY_BONUS,
  TWO_HANDED_ARC,
  TWO_HANDED_DAMAGE,
  TWO_HANDED_LEAK,
  TWO_HANDED_REACH,
  TWO_HANDED_TIME,
  WALK_SPEED,
} from './combat-tuning.ts'
import { blockedCircle, inArc, turnOf } from './body.hot.ts'
import { afflict, enemyRadius, launchEnemy, setStagger, strikeEnemy } from './enemies.hot.ts'
import { emit, pressed } from './events.hot.ts'
import { spawnProjectile } from './projectiles.hot.ts'
import { elementWorldEffect, strikeWorldEffect } from './puzzles.hot.ts'
import type { State } from './state.ts'
import { rngFloat } from '../../game/sim/prng.hot.ts'
import { blocksShot } from './world.hot.ts'
import { HEADING_TURNS, cosTurn, sinTurn } from '../../game/sim/trig.ts'

function hasNode(s: State, node: number): boolean {
  return s.nodes[node]! > 0
}

function nodeBonus(s: State, node: number): number {
  return hasNode(s, node) ? NODE_VALUE[node]! / 100 : 0
}

function unlocked(s: State, element: number): boolean {
  return ((s.stancesUnlocked >> element) & 1) === 1
}

function stanceActive(s: State, element: number): boolean {
  return s.stance === element && unlocked(s, element)
}

function moveRow(s: State): number {
  return unlocked(s, s.stance) ? s.stance : STANCE_PLAIN
}

function swingElement(s: State): number {
  return unlocked(s, s.stance) ? s.stance : ELEMENT_NONE
}

function comboLength(s: State, row: number): number {
  const extra = row === ELEMENT_EMBER && hasNode(s, NODE_EMBER_FLASHFIRE) ? 1 : 0
  return COMBO_LENGTH[row]! + extra
}

function timeScale(s: State): number {
  return s.statTwoHanded === 1 ? TWO_HANDED_TIME : 1
}

function enter(s: State, state: number): void {
  s.playerState = state
  s.playerTimer = 0
}

function elementBonus(s: State, element: number): number {
  return element === ELEMENT_NONE ? 1 : 1 + s.statElement[element]!
}

function heatScale(s: State): number {
  const ashforged = s.statSet === SET_ASHFORGED && s.heat > ASHFORGED_HEAT ? SET_VALUE[SET_ASHFORGED]! / 100 : 0
  return 1 + (HEAT_DAMAGE * s.heat) / HEAT_MAX + ashforged
}

function addFocus(s: State, amount: number): void {
  s.focus = Math.min(s.statMaxFocus, s.focus + amount * s.statFocusGain)
}

function addStamina(s: State, amount: number): void {
  s.stamina = Math.min(s.statMaxStamina, s.stamina + amount)
}

function slide(s: State, dx: number, dy: number): void {
  const nx = s.playerX + dx
  if (blockedCircle(s, nx, s.playerY, PLAYER_RADIUS, 0) === 0) s.playerX = nx
  const ny = s.playerY + dy
  if (blockedCircle(s, s.playerX, ny, PLAYER_RADIUS, 0) === 0) s.playerY = ny
}

function faceLock(s: State): boolean {
  const t = s.lockTarget
  if (t < 0) return false
  s.playerFace = turnOf(s.eX[t]! - s.playerX, s.eY[t]! - s.playerY)
  return true
}

function walk(s: State, input: number, speed: number, steer: boolean): void {
  const h = input & INPUT_HEADING_MASK
  const locked = faceLock(s)
  if (h < 1 || h > INPUT_DIRECTIONS) return
  const turn = (h - 1) * HEADING_TURNS
  if (steer && !locked) s.playerFace = turn
  slide(s, cosTurn(turn) * speed, sinTurn(turn) * speed)
}

function nearestEnemy(s: State, range: number): number {
  let best = -1
  let bestD = range
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (s.eAlive[i] !== 1) continue
    const dx = s.eX[i]! - s.playerX
    const dy = s.eY[i]! - s.playerY
    const d = Math.sqrt(dx * dx + dy * dy) - enemyRadius(s, i)
    if (d < bestD) {
      best = i
      bestD = d
    }
  }
  return best
}

function updateLock(s: State, input: number): void {
  const t = s.lockTarget
  if (t >= 0) {
    const dx = s.eX[t]! - s.playerX
    const dy = s.eY[t]! - s.playerY
    if (s.eAlive[t] !== 1 || dx * dx + dy * dy > LOCK_BREAK * LOCK_BREAK) s.lockTarget = -1
  }
  if (!pressed(s, input, IN_LOCK)) return
  s.lockTarget = s.lockTarget >= 0 ? -1 : nearestEnemy(s, LOCK_RANGE)
}

function clearShot(s: State, x: number, y: number): boolean {
  const dx = x - s.playerX
  const dy = y - s.playerY
  const steps = Math.ceil(Math.sqrt(dx * dx + dy * dy) / SHOT_SAMPLE_PX)
  for (let k = 1; k < steps; k++) if (blocksShot(s, s.playerX + (dx * k) / steps, s.playerY + (dy * k) / steps) === 1) return false
  return true
}

function aimAssist(s: State, reach: number): void {
  if (faceLock(s)) return
  let best = -1
  let bestD = reach * AIM_ASSIST_REACH
  for (let i = 0; i < MAX_ENEMIES; i++) {
    if (s.eAlive[i] !== 1) continue
    const dx = s.eX[i]! - s.playerX
    const dy = s.eY[i]! - s.playerY
    const d = Math.sqrt(dx * dx + dy * dy) - enemyRadius(s, i)
    if (d < bestD && inArc(s.playerFace, dx, dy, AIM_ASSIST_ARC) === 1 && clearShot(s, s.eX[i]!, s.eY[i]!)) {
      best = i
      bestD = d
    }
  }
  if (best >= 0) s.playerFace = turnOf(s.eX[best]! - s.playerX, s.eY[best]! - s.playerY)
}

function switchStance(s: State, input: number): void {
  const select = (input >> IN_STANCE_SHIFT) & IN_STANCE_MASK
  if (select < 1 || select > 4) return
  const element = select - 1
  if (element === s.stance || !unlocked(s, element)) return
  s.stance = element
  emit(s, EV_STANCE, element, 0, s.playerX, s.playerY)
  if (s.playerState === PL_ATTACK && s.playerChain !== FINISHER_CHAIN) s.playerChain = ARMED_CHAIN
}

function startAttack(s: State, input: number): void {
  if (s.stamina <= 0) return
  const h = input & INPUT_HEADING_MASK
  if (h >= 1 && h <= INPUT_DIRECTIONS) s.playerFace = (h - 1) * HEADING_TURNS
  const row = moveRow(s)
  const length = comboLength(s, row)
  let step = s.playerCombo < length ? s.playerCombo : 0
  if (s.playerChain === ARMED_CHAIN) {
    s.playerChain = FINISHER_CHAIN
    step = length - 1
    emit(s, EV_FINISHER, swingElement(s), 0, s.playerX, s.playerY)
  }
  const index = row * MAX_COMBO + step
  s.stamina = Math.max(0, s.stamina - MOVE_STAMINA[index]!)
  s.playerCombo = step + 1
  s.playerBuffer = 0
  aimAssist(s, MOVE_REACH[index]!)
  enter(s, PL_ATTACK)
  emit(s, EV_SWING, s.stance, step, s.playerX, s.playerY)
}

function igniteNeighbours(s: State, origin: number, damage: number): void {
  for (let o = 0; o < MAX_ENEMIES; o++) {
    if (o === origin || s.eAlive[o] !== 1) continue
    const dx = s.eX[o]! - s.eX[origin]!
    const dy = s.eY[o]! - s.eY[origin]!
    if (dx * dx + dy * dy <= INFERNO_RADIUS * INFERNO_RADIUS) strikeEnemy(s, o, damage, ELEMENT_EMBER, s.eX[origin]!, s.eY[origin]!, 0)
  }
}

function resolveSwing(s: State): void {
  const row = moveRow(s)
  const step = Math.min(s.playerCombo, comboLength(s, row)) - 1
  const index = row * MAX_COMBO + step
  const twoHanded = s.statTwoHanded === 1
  const element = swingElement(s)
  const finisher = s.playerChain === FINISHER_CHAIN
  const reach = MOVE_REACH[index]! * (twoHanded ? TWO_HANDED_REACH : 1)
  const arc = MOVE_ARC[index]! * (twoHanded ? TWO_HANDED_ARC : 1)
  let damage = s.statAttack * MOVE_DAMAGE[index]! * elementBonus(s, element) * heatScale(s)
  if (twoHanded) damage *= TWO_HANDED_DAMAGE
  if (finisher) damage *= FINISHER_MULT * (1 + nodeBonus(s, NODE_STEEL_FINISHER))
  if (rngFloat(s) < s.statCrit) damage *= CRIT_MULT
  const stagger = MOVE_STAGGER[index]! + (finisher ? FINISHER_STAGGER : 0)
  const launches = MOVE_LAUNCH[index] === 1 && element === ELEMENT_GALE
  const inferno = element === ELEMENT_EMBER && hasNode(s, NODE_EMBER_INFERNO) && s.heat >= HEAT_MAX
  const c = cosTurn(s.playerFace)
  const n = sinTurn(s.playerFace)
  strikeWorldEffect(s, s.playerX + c * reach * STRIKE_POINT, s.playerY + n * reach * STRIKE_POINT)
  let hits = 0
  for (let e = 0; e < MAX_ENEMIES; e++) {
    if (s.eAlive[e] !== 1) continue
    const dx = s.eX[e]! - s.playerX
    const dy = s.eY[e]! - s.playerY
    if (Math.sqrt(dx * dx + dy * dy) - enemyRadius(s, e) > reach || inArc(s.playerFace, dx, dy, arc) === 0) continue
    hits++
    strikeEnemy(s, e, damage, element, s.playerX, s.playerY, stagger)
    if (launches) launchEnemy(s, e, LAUNCH_TICKS * (1 + nodeBonus(s, NODE_GALE_UPDRAFT)))
    if (finisher) finisherStatus(s, e, element)
    if (inferno) igniteNeighbours(s, e, damage * nodeBonus(s, NODE_EMBER_INFERNO))
  }
  if (finisher) s.playerChain = 0
  if (hits === 0) return
  addFocus(s, FOCUS_PER_HIT)
  if (element === ELEMENT_EMBER) {
    s.heat = Math.min(HEAT_MAX, s.heat + HEAT_PER_HIT * (1 + nodeBonus(s, NODE_EMBER_KINDLE)))
    s.heatHoldUntil = s.tick + HEAT_HOLD
  }
}

function finisherStatus(s: State, e: number, element: number): void {
  if (element === ELEMENT_STONE) afflict(s, e, element, FINISHER_STAGGER * STAGGER_PER_POISE * 2)
  else if (element === ELEMENT_TIDE) afflict(s, e, element, FINISHER_CHILL)
  else if (element === ELEMENT_EMBER) afflict(s, e, element, FINISHER_BURN)
  else if (element === ELEMENT_GALE) afflict(s, e, element, LAUNCH_TICKS)
}

function castSkill(s: State, element: number, scale: number): void {
  const radius = SKILL_RADIUS[element]! * (element === ELEMENT_STONE ? 1 + nodeBonus(s, NODE_STONE_AFTERSHOCK) : 1)
  const cx = s.playerX + cosTurn(s.playerFace) * SKILL_OFFSET
  const cy = s.playerY + sinTurn(s.playerFace) * SKILL_OFFSET
  let damage = s.statAttack * SKILL_DAMAGE[element]! * elementBonus(s, element) * scale
  if (element === ELEMENT_EMBER) damage *= 1 + s.heat / SKILL_HEAT_SCALE
  for (let e = 0; e < MAX_ENEMIES; e++) {
    if (s.eAlive[e] !== 1) continue
    const dx = s.eX[e]! - cx
    const dy = s.eY[e]! - cy
    const d = Math.sqrt(dx * dx + dy * dy)
    if (d - enemyRadius(s, e) > radius) continue
    strikeEnemy(s, e, damage, element, cx, cy, SKILL_STAGGER[element]!)
    if (element === ELEMENT_TIDE) afflict(s, e, element, SKILL_CHILL)
    else if (element === ELEMENT_EMBER) afflict(s, e, element, SKILL_BURN)
    else if (element === ELEMENT_GALE && s.eAlive[e] === 1) {
      if (d > 0.001) {
        s.eVx[e] = s.eVx[e]! + (dx / d) * GUST_PUSH
        s.eVy[e] = s.eVy[e]! + (dy / d) * GUST_PUSH
      }
      afflict(s, e, element, LAUNCH_TICKS)
    }
  }
  if (element === ELEMENT_EMBER) s.heat = 0
  emit(s, EV_SKILL, element, 0, cx, cy)
  elementWorldEffect(s, element, cx, cy, radius)
}

export function skillCharge(s: State): number {
  if (!unlocked(s, s.stance)) return 0
  return s.focus >= SKILL_COST ? 1 : s.focus / SKILL_COST
}

function startSkill(s: State): void {
  if (!unlocked(s, s.stance) || s.focus < SKILL_COST) return
  s.focus -= SKILL_COST
  s.playerCombo = 0
  castSkill(s, s.stance, 1)
  enter(s, PL_SKILL)
}

function isDash(s: State): boolean {
  return stanceActive(s, ELEMENT_GALE)
}

function startDodge(s: State, input: number): void {
  if (s.stamina <= 0) return
  const dash = isDash(s)
  let cost = DODGE_COST
  if (dash) cost *= (1 - nodeBonus(s, NODE_GALE_TAILWIND)) * (s.statSet === SET_SKYWEAVE ? 1 - SET_VALUE[SET_SKYWEAVE]! / 100 : 1)
  const h = input & INPUT_HEADING_MASK
  s.playerFace = h >= 1 && h <= INPUT_DIRECTIONS ? (h - 1) * HEADING_TURNS : (s.playerFace + 512) & 1023
  s.stamina = Math.max(0, s.stamina - cost)
  s.iframesUntil = s.tick + (dash ? DASH_IFRAMES : DODGE_IFRAMES)
  s.playerCombo = 0
  s.playerChain = 0
  enter(s, PL_DODGE)
  emit(s, EV_DODGE, dash ? 1 : 0, 0, s.playerX, s.playerY)
}

function slipstream(s: State): void {
  for (let e = 0; e < MAX_ENEMIES; e++) {
    if (s.eAlive[e] !== 1 || s.eFlashUntil[e]! > s.tick) continue
    const dx = s.eX[e]! - s.playerX
    const dy = s.eY[e]! - s.playerY
    const reach = enemyRadius(s, e) + PLAYER_RADIUS + SLIPSTREAM_REACH
    if (dx * dx + dy * dy <= reach * reach) strikeEnemy(s, e, s.statAttack * nodeBonus(s, NODE_GALE_SLIPSTREAM), ELEMENT_GALE, s.playerX, s.playerY, 0)
  }
}

function startBow(s: State): void {
  aimAssist(s, LOCK_RANGE)
  const c = cosTurn(s.playerFace)
  const n = sinTurn(s.playerFace)
  spawnProjectile(s, PROJ_PLAYER_ARROW, OWNER_PLAYER, s.playerX + c * PLAYER_RADIUS, s.playerY + n * PLAYER_RADIUS, c * PLAYER_ARROW_SPEED, n * PLAYER_ARROW_SPEED, s.statAttack * PLAYER_ARROW_DAMAGE)
  emit(s, EV_SHOOT, PROJ_PLAYER_ARROW, -1, s.playerX, s.playerY)
  s.playerCombo = 0
  enter(s, PL_BOW)
}

function enterGuard(s: State): void {
  s.guardStart = s.tick
  s.playerCombo = 0
  enter(s, PL_GUARD)
}

function idle(s: State, input: number): void {
  if (s.playerTimer > COMBO_GRACE) {
    s.playerCombo = 0
    s.playerChain = 0
  }
  if (pressed(s, input, IN_ATTACK)) startAttack(s, input)
  else if (pressed(s, input, IN_DODGE)) startDodge(s, input)
  else if (pressed(s, input, IN_SKILL)) startSkill(s)
  else if (pressed(s, input, IN_INTERACT) && s.interactUsed === 0 && (s.keyItems & KEY_LONGBOW) !== 0) startBow(s)
  else if ((input & IN_GUARD) !== 0) enterGuard(s)
  if (s.playerState === PL_IDLE) walk(s, input, WALK_SPEED, true)
}

function attack(s: State, input: number): void {
  if (pressed(s, input, IN_ATTACK)) s.playerBuffer |= BUF_ATTACK
  const index = moveRow(s) * MAX_COMBO + Math.min(s.playerCombo, comboLength(s, moveRow(s))) - 1
  const scale = timeScale(s)
  const windup = Math.round(MOVE_WINDUP[index]! * scale)
  const active = Math.round(MOVE_ACTIVE[index]! * scale)
  const recovery = Math.round(MOVE_RECOVERY[index]! * scale)
  if ((s.playerBuffer & BUF_SWUNG) === 0 && s.playerTimer >= windup) {
    s.playerBuffer |= BUF_SWUNG
    resolveSwing(s)
  }
  walk(s, input, ATTACK_DRIFT, false)
  const cancel = windup + active
  if (s.playerTimer < cancel) return
  if (pressed(s, input, IN_DODGE)) {
    startDodge(s, input)
    return
  }
  if ((input & IN_GUARD) !== 0) {
    enterGuard(s)
    return
  }
  if ((s.playerBuffer & BUF_ATTACK) !== 0 && s.playerTimer >= cancel + Math.floor(recovery * COMBO_CHAIN_FRACTION)) {
    startAttack(s, input)
    if (s.playerState === PL_ATTACK && s.playerTimer === 0) return
  }
  if (s.playerTimer >= cancel + recovery) enter(s, PL_IDLE)
}

function guard(s: State, input: number): void {
  if ((input & IN_GUARD) === 0) {
    enter(s, PL_IDLE)
    return
  }
  if (pressed(s, input, IN_DODGE)) {
    startDodge(s, input)
    return
  }
  if (pressed(s, input, IN_ATTACK)) {
    startAttack(s, input)
    if (s.playerState === PL_ATTACK) return
  }
  walk(s, input, GUARD_SPEED, true)
}

function dodge(s: State): void {
  const dash = isDash(s)
  const speed = dash ? DASH_SPEED : DODGE_SPEED
  slide(s, cosTurn(s.playerFace) * speed, sinTurn(s.playerFace) * speed)
  if (dash && hasNode(s, NODE_GALE_SLIPSTREAM)) slipstream(s)
  if (s.playerTimer >= (dash ? DASH_TICKS : DODGE_TICKS)) enter(s, PL_IDLE)
}

function grapple(s: State): void {
  const dx = s.grappleX - s.playerX
  const dy = s.grappleY - s.playerY
  const d = Math.sqrt(dx * dx + dy * dy)
  s.iframesUntil = s.tick + 2
  if (d <= Math.max(GRAPPLE_ARRIVE, GRAPPLE_SPEED)) {
    s.playerX = s.grappleX
    s.playerY = s.grappleY
    enter(s, PL_IDLE)
    return
  }
  s.playerFace = turnOf(dx, dy)
  s.playerX += (dx / d) * GRAPPLE_SPEED
  s.playerY += (dy / d) * GRAPPLE_SPEED
}

function ride(s: State, input: number): void {
  if (pressed(s, input, IN_ATTACK) || pressed(s, input, IN_GUARD) || pressed(s, input, IN_DODGE) || pressed(s, input, IN_SKILL)) {
    s.mounted = 0
    emit(s, EV_MOUNT, 0, 0, s.playerX, s.playerY)
    return
  }
  const h = input & INPUT_HEADING_MASK
  if (h < 1 || h > INPUT_DIRECTIONS) return
  s.playerFace = (h - 1) * HEADING_TURNS
  slide(s, cosTurn(s.playerFace) * MOUNT_SPEED, sinTurn(s.playerFace) * MOUNT_SPEED)
}

function regenerate(s: State): void {
  if (s.focus < SKILL_COST) s.focus = Math.min(SKILL_COST, s.focus + FOCUS_REGEN)
  if (s.heat > 0 && s.tick >= s.heatHoldUntil) s.heat = Math.max(0, s.heat - HEAT_DECAY * (1 - nodeBonus(s, NODE_EMBER_STOKE)))
  if (s.playerState === PL_IDLE || s.playerState === PL_BOW || s.playerState === PL_SKILL) addStamina(s, s.statStaminaRegen)
}

export function updatePlayer(s: State, input: number): void {
  s.playerPrevX = s.playerX
  s.playerPrevY = s.playerY
  s.playerTimer++
  if (s.playerState === PL_DEAD) {
    if (s.playerTimer >= DEATH_TICKS && s.phase === PHASE_PLAYING) {
      s.phase = PHASE_DEAD
      emit(s, EV_DEAD, 0, 0, s.playerX, s.playerY)
    }
    return
  }
  regenerate(s)
  if (s.playerState === PL_GRAPPLE) {
    grapple(s)
    return
  }
  if (s.mounted === 1) {
    ride(s, input)
    return
  }
  switchStance(s, input)
  updateLock(s, input)
  const state = s.playerState
  if (state === PL_IDLE) idle(s, input)
  else if (state === PL_ATTACK) attack(s, input)
  else if (state === PL_GUARD) guard(s, input)
  else if (state === PL_DODGE) dodge(s)
  else if (state === PL_SKILL) {
    if (s.playerTimer >= SKILL_TICKS) enter(s, PL_IDLE)
  } else if (state === PL_BOW) {
    walk(s, input, BOW_DRIFT, false)
    if (s.playerTimer >= BOW_TICKS) enter(s, PL_IDLE)
  } else if (state === PL_HURT) {
    if (s.playerTimer >= HURT_TICKS) enter(s, PL_IDLE)
  }
}

function takeHit(s: State, damage: number, stun: boolean): void {
  const taken = (damage * 100) / (100 + s.statArmor)
  s.hp = Math.max(0, s.hp - taken)
  emit(s, EV_PLAYER_HURT, Math.round(taken), 0, s.playerX, s.playerY)
  s.hurtFlashUntil = s.tick + HURT_IFRAMES
  if (s.hp <= 0) {
    s.lockTarget = -1
    s.mounted = 0
    enter(s, PL_DEAD)
    return
  }
  if (!stun) return
  s.iframesUntil = s.tick + HURT_IFRAMES
  s.playerCombo = 0
  s.playerChain = 0
  enter(s, PL_HURT)
}

function parry(s: State, damage: number, attacker: number): number {
  emit(s, EV_PARRY, attacker, Math.round(damage), s.playerX, s.playerY)
  addFocus(s, FOCUS_PARRY)
  if (hasNode(s, NODE_TIDE_STILLWATER)) addStamina(s, NODE_VALUE[NODE_TIDE_STILLWATER]!)
  if (s.statSet === SET_TIDEWARDEN) s.hp = Math.min(s.statMaxHp, s.hp + SET_VALUE[SET_TIDEWARDEN]!)
  if (attacker >= 0 && s.eAlive[attacker] === 1) {
    setStagger(s, attacker, PARRY_STAGGER)
    const counter = s.statAttack * COUNTER_MULT * (1 + nodeBonus(s, NODE_TIDE_RIPTIDE)) * elementBonus(s, ELEMENT_TIDE)
    strikeEnemy(s, attacker, counter, ELEMENT_TIDE, s.playerX, s.playerY, 0)
  }
  return OUT_PARRY
}

function perfectBlock(s: State): number {
  emit(s, EV_PERFECT_BLOCK, 0, 0, s.playerX, s.playerY)
  addFocus(s, FOCUS_PERFECT * (1 + nodeBonus(s, NODE_STONE_ROOTED)))
  if (s.statSet === SET_BARROWGUARD) addStamina(s, SET_VALUE[SET_BARROWGUARD]!)
  if (stanceActive(s, ELEMENT_STONE) && hasNode(s, NODE_STONE_ANSWER)) castSkill(s, ELEMENT_STONE, ANSWER_SCALE)
  return OUT_PERFECT
}

function block(s: State, damage: number): number {
  const stone = stanceActive(s, ELEMENT_STONE) ? STONE_BLOCK_FACTOR : 1
  const cost = damage * BLOCK_STAMINA_PER_DAMAGE * stone * (1 - nodeBonus(s, NODE_STONE_BULWARK))
  s.stamina = Math.max(0, s.stamina - cost)
  emit(s, EV_BLOCK, Math.round(cost), 0, s.playerX, s.playerY)
  if (s.stamina <= 0) takeHit(s, damage * TWO_HANDED_LEAK, true)
  else if (s.statTwoHanded === 1) takeHit(s, damage * TWO_HANDED_LEAK, false)
  return OUT_BLOCK
}

export function resolvePlayerHit(s: State, damage: number, fromX: number, fromY: number, attacker: number, projectile: number): number {
  const state = s.playerState
  if (state === PL_DEAD || state === PL_GRAPPLE || s.phase !== PHASE_PLAYING) return OUT_IGNORED
  if (s.tick < s.iframesUntil) return OUT_DODGED
  const unblockable = projectile >= 0 && PROJ_UNBLOCKABLE[s.prKind[projectile]!] === 1 && !stanceActive(s, ELEMENT_STONE)
  if (state === PL_GUARD && !unblockable && inArc(s.playerFace, fromX - s.playerX, fromY - s.playerY, GUARD_ARC) === 1) {
    const tide = stanceActive(s, ELEMENT_TIDE)
    const window = s.statParryTicks + (tide ? TIDE_PARRY_BONUS : 0)
    if (s.tick - s.guardStart <= window) return tide ? parry(s, damage, attacker) : perfectBlock(s)
    return block(s, damage)
  }
  takeHit(s, damage, true)
  return OUT_HIT
}

export function hurtPlayer(s: State, damage: number, fromX: number, fromY: number): void {
  resolvePlayerHit(s, damage, fromX, fromY, -1, -1)
}
