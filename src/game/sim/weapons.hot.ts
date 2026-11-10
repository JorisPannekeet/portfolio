import {
  BLADE_HEIGHT_RATIO,
  BLADE_REPEAT_DELAY,
  DRONE_HIT_RADIUS,
  DRONE_REHIT_TICKS,
  ENEMY_RADIUS,
  EV_PULSE,
  EV_SHOOT,
  EV_SLASH,
  FIELD_KNOCKBACK,
  MAX_DRONES,
  MISSILE_FAN_STEP,
  MISSILE_LAUNCH_SPEED,
  MISSILE_RANGE,
  NEAR_CAP,
  RIFLE_RANGE,
  SHOT_BOLT,
  SHOT_LANCE,
  SHOT_MISSILE,
  SHOT_VULCAN,
  VULCAN_FAN_STEP,
  VULCAN_JITTER,
  WEAPONS,
  WEAPON_BLADE,
  WEAPON_DRONE,
  WEAPON_FIELD,
  WEAPON_MISSILE,
  WEAPON_RIFLE,
  WEAPON_VULCAN,
} from './content.ts'
import { damageEnemy, knockEnemy } from './enemies.hot.ts'
import { emit } from './events.hot.ts'
import { gridNearest, gridQuery } from './grid.hot.ts'
import { spawnShot } from './shots.hot.ts'
import {
  weaponAmount,
  weaponArea,
  weaponCooldown,
  weaponDamage,
  weaponDuration,
  weaponPierce,
} from './stats.hot.ts'
import type { State } from './state.ts'
import { TRIG_SIZE, TURNS_PER_RADIAN, cosTurn, sinTurn } from './trig.ts'

function ready(s: State, w: number): boolean {
  if (s.weaponLevel[w] === 0) return false
  if (s.weaponTimer[w]! > 0) s.weaponTimer[w]!--
  return s.weaponTimer[w] === 0
}

function fireRifle(s: State): void {
  if (!ready(s, WEAPON_RIFLE)) return
  const amount = weaponAmount(s, WEAPON_RIFLE)
  const found = gridNearest(s, s.px, s.py, RIFLE_RANGE, amount < NEAR_CAP ? amount : NEAR_CAP)
  if (found === 0) return
  const evolved = s.weaponEvolved[WEAPON_RIFLE]!
  const kind = evolved > 0 ? SHOT_LANCE : SHOT_BOLT
  const speed = WEAPONS[WEAPON_RIFLE]!.speed
  const life = weaponDuration(s, WEAPON_RIFLE)
  const damage = weaponDamage(s, WEAPON_RIFLE)
  const pierce = weaponPierce(s, WEAPON_RIFLE)
  const radius = weaponArea(s, WEAPON_RIFLE)
  for (let k = 0; k < amount; k++) {
    const e = s.scratchNearIdx[k % found]!
    const dx = s.ex[e]! - s.px
    const dy = s.ey[e]! - s.py
    const d = Math.sqrt(dx * dx + dy * dy)
    const ux = d > 0.0001 ? dx / d : s.aimX
    const uy = d > 0.0001 ? dy / d : s.aimY
    spawnShot(s, kind, s.px, s.py, ux * speed, uy * speed, life, damage, pierce, radius, 0)
  }
  emit(s, EV_SHOOT, s.px, s.py, WEAPON_RIFLE, evolved)
  s.weaponTimer[WEAPON_RIFLE] = weaponCooldown(s, WEAPON_RIFLE)
}

function slash(s: State, sides: number): void {
  const reach = weaponArea(s, WEAPON_BLADE)
  const height = reach * BLADE_HEIGHT_RATIO
  const damage = weaponDamage(s, WEAPON_BLADE)
  const face = s.faceX
  emit(s, EV_SLASH, s.px, s.py, reach, face)
  if (sides > 1) emit(s, EV_SLASH, s.px, s.py, reach, -face)
  const found = gridQuery(s, s.px, s.py, reach)
  const out = s.scratchQuery
  for (let k = 0; k < found; k++) {
    const e = out[k]!
    const r = ENEMY_RADIUS[s.eType[e]!]!
    const dx = s.ex[e]! - s.px
    const dy = s.ey[e]! - s.py
    if (sides < 2 && dx * face < -r) continue
    const nx = dx / (reach + r)
    const ny = dy / (height + r)
    if (nx * nx + ny * ny <= 1) damageEnemy(s, e, damage, WEAPON_BLADE)
  }
}

function fireBlade(s: State): void {
  if (s.weaponLevel[WEAPON_BLADE] === 0) return
  const amount = weaponAmount(s, WEAPON_BLADE)
  const sides = amount > 1 ? 2 : 1
  if (s.bladeRepeats > 0) {
    s.bladeRepeatTimer--
    if (s.bladeRepeatTimer <= 0) {
      s.bladeRepeats--
      s.bladeRepeatTimer = BLADE_REPEAT_DELAY
      slash(s, sides)
    }
  }
  if (!ready(s, WEAPON_BLADE)) return
  slash(s, sides)
  s.bladeRepeats = amount > 2 ? amount - 2 : 0
  s.bladeRepeatTimer = BLADE_REPEAT_DELAY
  s.weaponTimer[WEAPON_BLADE] = weaponCooldown(s, WEAPON_BLADE)
}

function fireVulcan(s: State): void {
  if (!ready(s, WEAPON_VULCAN)) return
  const amount = weaponAmount(s, WEAPON_VULCAN)
  const evolved = s.weaponEvolved[WEAPON_VULCAN]!
  const speed = WEAPONS[WEAPON_VULCAN]!.speed
  const life = weaponDuration(s, WEAPON_VULCAN)
  const damage = weaponDamage(s, WEAPON_VULCAN)
  const pierce = weaponPierce(s, WEAPON_VULCAN)
  const radius = weaponArea(s, WEAPON_VULCAN)
  const jitter = VULCAN_JITTER[s.vulcanCycle % VULCAN_JITTER.length]!
  s.vulcanCycle++
  for (let k = 0; k < amount; k++) {
    const turn = s.aimTurn + jitter + (2 * k - (amount - 1)) * VULCAN_FAN_STEP
    const ux = cosTurn(turn)
    const uy = sinTurn(turn)
    spawnShot(s, SHOT_VULCAN, s.px + ux * 4, s.py + uy * 4, ux * speed, uy * speed, life, damage, pierce, radius, 0)
  }
  emit(s, EV_SHOOT, s.px, s.py, WEAPON_VULCAN, evolved)
  s.weaponTimer[WEAPON_VULCAN] = weaponCooldown(s, WEAPON_VULCAN)
}

function fireMissiles(s: State): void {
  if (!ready(s, WEAPON_MISSILE)) return
  const amount = weaponAmount(s, WEAPON_MISSILE)
  const found = gridNearest(s, s.px, s.py, MISSILE_RANGE, amount < NEAR_CAP ? amount : NEAR_CAP)
  if (found === 0) return
  const evolved = s.weaponEvolved[WEAPON_MISSILE]!
  const launch = WEAPONS[WEAPON_MISSILE]!.speed * MISSILE_LAUNCH_SPEED
  const life = weaponDuration(s, WEAPON_MISSILE)
  const damage = weaponDamage(s, WEAPON_MISSILE)
  const area = weaponArea(s, WEAPON_MISSILE)
  for (let k = 0; k < amount; k++) {
    const e = s.scratchNearIdx[k % found]!
    const dx = s.ex[e]! - s.px
    const dy = s.ey[e]! - s.py
    const d = Math.sqrt(dx * dx + dy * dy)
    const ux = d > 0.0001 ? dx / d : s.aimX
    const uy = d > 0.0001 ? dy / d : s.aimY
    const fan = (2 * k - (amount - 1)) * MISSILE_FAN_STEP
    const c = cosTurn(fan)
    const sn = sinTurn(fan)
    const vx = (ux * c - uy * sn) * launch
    const vy = (ux * sn + uy * c) * launch
    const i = spawnShot(s, SHOT_MISSILE, s.px, s.py, vx, vy, life, damage, 1, 0, area)
    s.sTarget[i] = e
    s.sTargetId[i] = s.eId[e]!
  }
  emit(s, EV_SHOOT, s.px, s.py, WEAPON_MISSILE, evolved)
  s.weaponTimer[WEAPON_MISSILE] = weaponCooldown(s, WEAPON_MISSILE)
}

function cycleDrones(s: State): number {
  if (s.weaponLevel[WEAPON_DRONE] === 0) return 0
  if (s.weaponEvolved[WEAPON_DRONE]! > 0) return weaponAmount(s, WEAPON_DRONE)
  if (s.droneActive > 0) {
    s.droneActive--
    if (s.droneActive === 0) s.droneDock = weaponCooldown(s, WEAPON_DRONE)
    return weaponAmount(s, WEAPON_DRONE)
  }
  if (s.droneDock > 0) {
    s.droneDock--
    if (s.droneDock === 0) s.droneActive = weaponDuration(s, WEAPON_DRONE)
  }
  return 0
}

function runDrones(s: State): void {
  const wanted = cycleDrones(s)
  const count = wanted < MAX_DRONES ? wanted : MAX_DRONES
  const previous = s.droneCount
  s.droneCount = count
  if (count === 0) return
  const radius = weaponArea(s, WEAPON_DRONE)
  s.droneTurn = (s.droneTurn + (WEAPONS[WEAPON_DRONE]!.speed / radius) * TURNS_PER_RADIAN) % TRIG_SIZE
  const damage = weaponDamage(s, WEAPON_DRONE)
  const spacing = TRIG_SIZE / count
  for (let k = 0; k < count; k++) {
    const turn = s.droneTurn + k * spacing
    const x = s.px + cosTurn(turn) * radius
    const y = s.py + sinTurn(turn) * radius
    s.droneX[k] = x
    s.droneY[k] = y
    if (previous !== count) {
      s.dronePx[k] = x
      s.dronePy[k] = y
    }
    const found = gridQuery(s, x, y, DRONE_HIT_RADIUS)
    const out = s.scratchQuery
    for (let j = 0; j < found; j++) {
      const e = out[j]!
      if (s.eDroneReady[e]! > s.tick) continue
      s.eDroneReady[e] = s.tick + DRONE_REHIT_TICKS
      damageEnemy(s, e, damage, WEAPON_DRONE)
    }
  }
}

function runField(s: State): void {
  if (s.weaponLevel[WEAPON_FIELD] === 0) {
    s.auraRadius = 0
    return
  }
  const radius = weaponArea(s, WEAPON_FIELD)
  s.auraRadius = radius
  if (!ready(s, WEAPON_FIELD)) return
  emit(s, EV_PULSE, s.px, s.py, radius, 0)
  const damage = weaponDamage(s, WEAPON_FIELD)
  const found = gridQuery(s, s.px, s.py, radius)
  const out = s.scratchQuery
  for (let k = 0; k < found; k++) {
    const e = out[k]!
    damageEnemy(s, e, damage, WEAPON_FIELD)
    knockEnemy(s, e, s.px, s.py, FIELD_KNOCKBACK)
  }
  s.weaponTimer[WEAPON_FIELD] = weaponCooldown(s, WEAPON_FIELD)
}

export function runWeapons(s: State): void {
  runDrones(s)
  runField(s)
  fireBlade(s)
  fireRifle(s)
  fireVulcan(s)
  fireMissiles(s)
}
