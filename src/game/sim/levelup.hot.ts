import {
  CHOICE_COUNT,
  CHOICE_EVOLVE,
  CHOICE_PASSIVE,
  CHOICE_REPAIR,
  CHOICE_WEAPON,
  EV_EVOLVE,
  EV_HEAL,
  EV_LEVEL,
  OWNED_CHOICE_WEIGHT,
  PASSIVE_COUNT,
  PASSIVE_HP_PER_LEVEL,
  PASSIVE_MAX_LEVEL,
  PASSIVE_REACTOR,
  PASSIVE_SLOTS,
  PHASE_LEVEL_UP,
  PHASE_PLAYING,
  REPAIR_HEAL,
  WEAPONS,
  WEAPON_COUNT,
  WEAPON_DRONE,
  WEAPON_FIRST_DELAY,
  WEAPON_MAX_LEVEL,
  WEAPON_SLOTS,
} from './content.ts'
import { emit } from './events.hot.ts'
import { rngFloat, rngInt } from './prng.hot.ts'
import { weaponDuration, xpForLevel } from './stats.hot.ts'
import type { State } from './state.ts'

export function processLevels(s: State): void {
  while (s.xp >= s.xpNext) {
    s.xp -= s.xpNext
    s.level++
    s.pendingLevels++
    s.xpNext = xpForLevel(s.level)
  }
}

export function evolutionReady(s: State, w: number): boolean {
  return (
    s.weaponLevel[w] === WEAPON_MAX_LEVEL &&
    s.weaponEvolved[w] === 0 &&
    s.passiveLevel[WEAPONS[w]!.pairedPassive]! > 0
  )
}

function ownedWeapons(s: State): number {
  let n = 0
  for (let w = 0; w < WEAPON_COUNT; w++) if (s.weaponLevel[w]! > 0) n++
  return n
}

function ownedPassives(s: State): number {
  let n = 0
  for (let p = 0; p < PASSIVE_COUNT; p++) if (s.passiveLevel[p]! > 0) n++
  return n
}

function choiceWeight(s: State, choice: number): number {
  if (choice >= CHOICE_EVOLVE) return OWNED_CHOICE_WEIGHT
  if (choice >= CHOICE_PASSIVE) return s.passiveLevel[choice - CHOICE_PASSIVE]! > 0 ? OWNED_CHOICE_WEIGHT : 1
  return s.weaponLevel[choice - CHOICE_WEAPON]! > 0 ? OWNED_CHOICE_WEIGHT : 1
}

export function rollChoices(s: State): void {
  const pool = s.scratchChoices
  let count = 0
  let evolutions = 0
  for (let w = 0; w < WEAPON_COUNT; w++) {
    if (evolutionReady(s, w)) {
      pool[count++] = CHOICE_EVOLVE + w
      evolutions++
    }
  }
  const weaponRoom = ownedWeapons(s) < WEAPON_SLOTS
  for (let w = 0; w < WEAPON_COUNT; w++) {
    const level = s.weaponLevel[w]!
    if ((level === 0 && weaponRoom) || (level > 0 && level < WEAPON_MAX_LEVEL)) pool[count++] = CHOICE_WEAPON + w
  }
  const passiveRoom = ownedPassives(s) < PASSIVE_SLOTS
  for (let p = 0; p < PASSIVE_COUNT; p++) {
    const level = s.passiveLevel[p]!
    if ((level === 0 && passiveRoom) || (level > 0 && level < PASSIVE_MAX_LEVEL[p]!)) pool[count++] = CHOICE_PASSIVE + p
  }
  if (count === 0) {
    s.choices[0] = CHOICE_REPAIR
    s.choiceCount = 1
    return
  }
  let taken = 0
  if (evolutions > 0) {
    const pick = rngInt(s, evolutions)
    const first = pool[pick]!
    pool[pick] = pool[0]!
    pool[0] = first
    taken = 1
  }
  while (taken < CHOICE_COUNT && taken < count) {
    let total = 0
    for (let j = taken; j < count; j++) total += choiceWeight(s, pool[j]!)
    let roll = rngFloat(s) * total
    let pick = count - 1
    for (let j = taken; j < count; j++) {
      roll -= choiceWeight(s, pool[j]!)
      if (roll < 0) {
        pick = j
        break
      }
    }
    const chosen = pool[pick]!
    pool[pick] = pool[taken]!
    pool[taken] = chosen
    taken++
  }
  for (let k = 0; k < taken; k++) s.choices[k] = pool[k]!
  s.choiceCount = taken
}

export function openLevelUp(s: State): void {
  s.phase = PHASE_LEVEL_UP
  rollChoices(s)
}

function takeWeapon(s: State, w: number): void {
  const level = s.weaponLevel[w]!
  s.weaponLevel[w] = level + 1
  if (level > 0) return
  s.weaponTimer[w] = WEAPON_FIRST_DELAY
  if (w === WEAPON_DRONE) {
    s.droneActive = weaponDuration(s, w)
    s.droneDock = 0
  }
}

function takePassive(s: State, p: number): void {
  s.passiveLevel[p] = s.passiveLevel[p]! + 1
  if (p === PASSIVE_REACTOR) {
    s.maxHp += PASSIVE_HP_PER_LEVEL
    s.hp += PASSIVE_HP_PER_LEVEL
  }
}

export function applyChoice(s: State, index: number): void {
  if (index < 0 || index >= s.choiceCount) return
  const choice = s.choices[index]!
  const levelReached = s.level - s.pendingLevels + 1
  if (choice >= CHOICE_REPAIR) {
    const before = s.hp
    s.hp = Math.min(s.maxHp, s.hp + REPAIR_HEAL)
    emit(s, EV_HEAL, s.px, s.py, s.hp - before, 0)
    emit(s, EV_LEVEL, s.px, s.py, levelReached, 0)
  } else if (choice >= CHOICE_EVOLVE) {
    const w = choice - CHOICE_EVOLVE
    s.weaponEvolved[w] = 1
    if (w === WEAPON_DRONE) {
      s.droneActive = 1
      s.droneDock = 0
    }
    emit(s, EV_EVOLVE, s.px, s.py, w, 0)
  } else if (choice >= CHOICE_PASSIVE) {
    takePassive(s, choice - CHOICE_PASSIVE)
    emit(s, EV_LEVEL, s.px, s.py, levelReached, 0)
  } else {
    takeWeapon(s, choice - CHOICE_WEAPON)
    emit(s, EV_LEVEL, s.px, s.py, levelReached, 0)
  }
  s.pendingLevels--
  if (s.pendingLevels > 0) {
    rollChoices(s)
    return
  }
  s.choiceCount = 0
  s.phase = PHASE_PLAYING
}
