import {
  ELEMENT_GALE,
  EV_DEFLECT,
  MAX_ENEMIES,
  MAX_PROJECTILES,
  NODE_GALE_EYE,
  NODE_TIDE_UNDERTOW,
  NODE_VALUE,
  OWNER_ENEMY,
  OWNER_PLAYER,
  PROJ_PLAYER_ARROW,
} from './content.ts'
import {
  DEFLECT_SCALE_GALE,
  DEFLECT_SCALE_TIDE,
  DEFLECT_SPEED,
  OUT_BLOCK,
  OUT_HIT,
  OUT_PARRY,
  OUT_PERFECT,
  PLAYER_RADIUS,
  PROJ_DEFLECTABLE,
  PROJ_ELEMENT,
  PROJ_LIFE,
  PROJ_PIERCES,
  PROJ_RADIUS,
} from './combat-tuning.ts'
import { enemyRadius, strikeEnemy } from './enemies.hot.ts'
import { emit } from './events.hot.ts'
import { resolvePlayerHit } from './player.hot.ts'
import { arrowWorldEffect } from './puzzles.hot.ts'
import type { State } from './state.ts'
import { blocksShot } from './world.hot.ts'

const SOURCE_BACKTRACK = 8

export function spawnProjectile(s: State, kind: number, owner: number, x: number, y: number, vx: number, vy: number, damage: number): number {
  for (let i = 0; i < MAX_PROJECTILES; i++) {
    if (s.prAlive[i] === 1) continue
    s.prAlive[i] = 1
    s.prKind[i] = kind
    s.prOwner[i] = owner
    s.prX[i] = x
    s.prY[i] = y
    s.prPrevX[i] = x
    s.prPrevY[i] = y
    s.prVx[i] = vx
    s.prVy[i] = vy
    s.prDamage[i] = damage
    s.prLife[i] = PROJ_LIFE[kind]!
    return i
  }
  return -1
}

function redirect(s: State, i: number, scale: number): void {
  s.prOwner[i] = OWNER_PLAYER
  s.prVx[i] = -s.prVx[i]! * DEFLECT_SPEED
  s.prVy[i] = -s.prVy[i]! * DEFLECT_SPEED
  s.prDamage[i] = s.prDamage[i]! * scale
  s.prLife[i] = PROJ_LIFE[s.prKind[i]!]!
  emit(s, EV_DEFLECT, s.prKind[i]!, 0, s.prX[i]!, s.prY[i]!)
}

function nodeScale(s: State, node: number, base: number): number {
  return s.nodes[node]! > 0 ? NODE_VALUE[node]! / 100 : base
}

function hitPlayer(s: State, i: number): void {
  const kind = s.prKind[i]!
  const x = s.prX[i]!
  const y = s.prY[i]!
  const outcome = resolvePlayerHit(s, s.prDamage[i]!, x - s.prVx[i]! * SOURCE_BACKTRACK, y - s.prVy[i]! * SOURCE_BACKTRACK, -1, i)
  const deflectable = PROJ_DEFLECTABLE[kind] === 1
  if (outcome === OUT_PARRY && deflectable) redirect(s, i, nodeScale(s, NODE_TIDE_UNDERTOW, DEFLECT_SCALE_TIDE))
  else if ((outcome === OUT_BLOCK || outcome === OUT_PERFECT) && deflectable && s.stance === ELEMENT_GALE) redirect(s, i, nodeScale(s, NODE_GALE_EYE, DEFLECT_SCALE_GALE))
  else if (outcome >= OUT_HIT) s.prAlive[i] = 0
}

function hitEnemies(s: State, i: number): void {
  const r = PROJ_RADIUS[s.prKind[i]!]!
  const x = s.prX[i]!
  const y = s.prY[i]!
  for (let e = 0; e < MAX_ENEMIES; e++) {
    if (s.eAlive[e] !== 1) continue
    const reach = r + enemyRadius(s, e)
    const dx = s.eX[e]! - x
    const dy = s.eY[e]! - y
    if (dx * dx + dy * dy > reach * reach) continue
    if (PROJ_PIERCES[s.prKind[i]!] === 1 && s.eFlashUntil[e]! > s.tick) continue
    strikeEnemy(s, e, s.prDamage[i]!, PROJ_ELEMENT[s.prKind[i]!]!, x - s.prVx[i]!, y - s.prVy[i]!, 1)
    if (PROJ_PIERCES[s.prKind[i]!] !== 1) {
      s.prAlive[i] = 0
      return
    }
  }
}

export function updateProjectiles(s: State): void {
  for (let i = 0; i < MAX_PROJECTILES; i++) {
    if (s.prAlive[i] !== 1) continue
    s.prPrevX[i] = s.prX[i]!
    s.prPrevY[i] = s.prY[i]!
  }
  for (let i = 0; i < MAX_PROJECTILES; i++) {
    if (s.prAlive[i] !== 1) continue
    s.prX[i] = s.prX[i]! + s.prVx[i]!
    s.prY[i] = s.prY[i]! + s.prVy[i]!
    s.prLife[i] = s.prLife[i]! - 1
    const x = s.prX[i]!
    const y = s.prY[i]!
    if (s.prLife[i]! <= 0 || blocksShot(s, x, y) === 1) {
      s.prAlive[i] = 0
      continue
    }
    if (s.prOwner[i] === OWNER_PLAYER) {
      if (s.prKind[i] === PROJ_PLAYER_ARROW && arrowWorldEffect(s, x, y) === 1) {
        s.prAlive[i] = 0
        continue
      }
      hitEnemies(s, i)
      continue
    }
    if (s.prOwner[i] !== OWNER_ENEMY) continue
    const reach = PROJ_RADIUS[s.prKind[i]!]! + PLAYER_RADIUS
    const dx = s.playerX - x
    const dy = s.playerY - y
    if (dx * dx + dy * dy <= reach * reach) hitPlayer(s, i)
  }
}
