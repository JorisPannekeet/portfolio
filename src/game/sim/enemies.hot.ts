import {
  BOSS_KNOCKBACK_SCALE,
  BOSS_SPAWN_RESERVE,
  DESPAWN_RADIUS,
  ENEMY_BOSS_FIRST,
  ENEMY_FLASH_TICKS,
  ENEMY_GEM,
  ENEMY_RADIUS,
  ENEMY_SPEED,
  ENEMY_STOP_FACTOR,
  EV_HIT,
  EV_HURT,
  EV_KILL,
  GEM_MAGNET,
  GEM_REPAIR,
  GEM_XP,
  GRID_DIM,
  HIT_EVENTS_PER_TICK,
  KILL_EVENTS_PER_TICK,
  KNOCKBACK_DECAY,
  MAGNET_DROP_CHANCE,
  MAX_ENEMIES,
  PLAYER_IFRAMES,
  PLAYER_RADIUS,
  PROP_SLIDE_NUDGE,
  RECYCLE_MIN_RADIUS,
  REPAIR_DROP_CHANCE,
  SEPARATION_STRENGTH,
  SPAWN_RADIUS,
  SPAWN_TOPUP_PER_TICK,
  WAVES,
  WAVE_TICKS,
} from './content.ts'
import { emit } from './events.hot.ts'
import { gridQuery } from './grid.hot.ts'
import { dropGem } from './pickups.hot.ts'
import { rngFloat, rngInt } from './prng.hot.ts'
import { pushHostileOutOfProps } from './props.hot.ts'
import { enemyContactDamage, enemyMaxHp, enemySpeedScale, playerArmor } from './stats.hot.ts'
import type { State } from './state.ts'
import { TRIG_SIZE, cosTurn, sinTurn } from './trig.ts'

function settle(s: State, i: number): void {
  pushHostileOutOfProps(s, i, ENEMY_RADIUS[s.eType[i]!]!, 0, 0, 0)
  s.epx[i] = s.ex[i]!
  s.epy[i] = s.ey[i]!
}

function initEnemy(s: State, i: number, type: number, x: number, y: number): void {
  const hp = enemyMaxHp(s, type)
  s.eType[i] = type
  s.ex[i] = x
  s.ey[i] = y
  s.eHp[i] = hp
  s.eMaxHp[i] = hp
  s.eFlash[i] = 0
  s.eId[i] = s.nextEnemyId++
  s.eKx[i] = 0
  s.eKy[i] = 0
  s.eDroneReady[i] = 0
  settle(s, i)
}

export function spawnEnemy(s: State, type: number, x: number, y: number): number {
  const limit = type >= ENEMY_BOSS_FIRST ? MAX_ENEMIES : MAX_ENEMIES - BOSS_SPAWN_RESERVE
  if (s.enemyCount >= limit) return -1
  const i = s.enemyCount++
  initEnemy(s, i, type, x, y)
  return i
}

function spawnOnRing(s: State, type: number): number {
  const turn = rngInt(s, TRIG_SIZE)
  return spawnEnemy(s, type, s.px + cosTurn(turn) * SPAWN_RADIUS, s.py + sinTurn(turn) * SPAWN_RADIUS)
}

function farthestRecyclable(s: State): number {
  let far = -1
  let farD2 = RECYCLE_MIN_RADIUS * RECYCLE_MIN_RADIUS
  for (let i = 0; i < s.enemyCount; i++) {
    if (s.eType[i]! >= ENEMY_BOSS_FIRST || s.eHp[i]! <= 0) continue
    const dx = s.ex[i]! - s.px
    const dy = s.ey[i]! - s.py
    const d2 = dx * dx + dy * dy
    if (d2 > farD2) {
      far = i
      farD2 = d2
    }
  }
  return far
}

function recycleFarthest(s: State): void {
  const far = farthestRecyclable(s)
  if (far < 0) return
  const turn = rngInt(s, TRIG_SIZE)
  s.ex[far] = s.px + cosTurn(turn) * SPAWN_RADIUS
  s.ey[far] = s.py + sinTurn(turn) * SPAWN_RADIUS
  s.eKx[far] = 0
  s.eKy[far] = 0
  settle(s, far)
}

export function deployHostile(s: State, type: number, x: number, y: number): number {
  const i = spawnEnemy(s, type, x, y)
  if (i >= 0) return i
  const far = farthestRecyclable(s)
  if (far >= 0) initEnemy(s, far, type, x, y)
  return far
}

export function waveSegment(s: State): number {
  const last = WAVES.length - 1
  const raw = Math.floor(s.tick / WAVE_TICKS)
  return raw > last ? last : raw
}

function spawnFromWave(s: State, segment: number): number {
  const pool = WAVES[segment]!.pool
  const i = spawnOnRing(s, pool[rngInt(s, pool.length)]!)
  if (i < 0) recycleFarthest(s)
  return i
}

export function runSpawns(s: State): void {
  const segment = waveSegment(s)
  const wave = WAVES[segment]!
  s.spawnTimer--
  if (s.spawnTimer <= 0) {
    for (let k = 0; k < wave.batch; k++) spawnFromWave(s, segment)
    s.spawnTimer = wave.interval
  }
  for (let k = 0; k < SPAWN_TOPUP_PER_TICK && s.enemyCount < wave.floor; k++) {
    if (spawnFromWave(s, segment) < 0) break
  }
}

export function computeSeparation(s: State): void {
  const n = s.enemyCount
  const ex = s.ex
  const ey = s.ey
  const eType = s.eType
  const sepX = s.scratchSepX
  const sepY = s.scratchSepY
  const cellOf = s.scratchCell
  const start = s.scratchCellStart
  const items = s.scratchCellItems
  for (let i = 0; i < n; i++) {
    let pushX = 0
    let pushY = 0
    const xi = ex[i]!
    const yi = ey[i]!
    const ri = ENEMY_RADIUS[eType[i]!]!
    const c = cellOf[i]!
    const ccx = c % GRID_DIM
    const ccy = (c - ccx) / GRID_DIM
    const cx0 = ccx > 0 ? ccx - 1 : 0
    const cx1 = ccx < GRID_DIM - 1 ? ccx + 1 : ccx
    const cy0 = ccy > 0 ? ccy - 1 : 0
    const cy1 = ccy < GRID_DIM - 1 ? ccy + 1 : ccy
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const cell = cy * GRID_DIM + cx
        const end = start[cell + 1]!
        for (let k = start[cell]!; k < end; k++) {
          const j = items[k]!
          if (j === i) continue
          const rj = ENEMY_RADIUS[eType[j]!]!
          const reach = ri + rj
          const dx = xi - ex[j]!
          const dy = yi - ey[j]!
          const d2 = dx * dx + dy * dy
          if (d2 >= reach * reach) continue
          const share = (SEPARATION_STRENGTH * rj) / reach
          if (d2 < 0.0001) {
            pushX += i > j ? share : -share
            continue
          }
          const d = Math.sqrt(d2)
          const overlap = (reach - d) * share
          pushX += (dx / d) * overlap
          pushY += (dy / d) * overlap
        }
      }
    }
    sepX[i] = pushX
    sepY[i] = pushY
  }
}

export function moveEnemies(s: State): void {
  const n = s.enemyCount
  const ex = s.ex
  const ey = s.ey
  const eKx = s.eKx
  const eKy = s.eKy
  const eType = s.eType
  const sepX = s.scratchSepX
  const sepY = s.scratchSepY
  const px = s.px
  const py = s.py
  const despawn2 = DESPAWN_RADIUS * DESPAWN_RADIUS
  const speedScale = enemySpeedScale(s)
  for (let i = 0; i < n; i++) {
    const type = eType[i]!
    let x = ex[i]!
    let y = ey[i]!
    const dx = px - x
    const dy = py - y
    const d2 = dx * dx + dy * dy
    const d = Math.sqrt(d2)
    const stop = PLAYER_RADIUS + ENEMY_RADIUS[type]! * ENEMY_STOP_FACTOR
    if (d > stop) {
      const speed = ENEMY_SPEED[type]! * speedScale
      x += (dx / d) * speed
      y += (dy / d) * speed
    }
    x += sepX[i]! + eKx[i]!
    y += sepY[i]! + eKy[i]!
    eKx[i] = eKx[i]! * KNOCKBACK_DECAY
    eKy[i] = eKy[i]! * KNOCKBACK_DECAY
    const rx = x - px
    const ry = y - py
    const r2 = rx * rx + ry * ry
    ex[i] = x
    ey[i] = y
    if (r2 > despawn2 && type < ENEMY_BOSS_FIRST) {
      const r = Math.sqrt(r2)
      ex[i] = px - (rx / r) * SPAWN_RADIUS
      ey[i] = py - (ry / r) * SPAWN_RADIUS
      settle(s, i)
      continue
    }
    pushHostileOutOfProps(s, i, ENEMY_RADIUS[type]!, dx, dy, ENEMY_SPEED[type]! * speedScale * PROP_SLIDE_NUDGE)
  }
}

export function knockEnemy(s: State, e: number, fromX: number, fromY: number, force: number): void {
  const dx = s.ex[e]! - fromX
  const dy = s.ey[e]! - fromY
  const d = Math.sqrt(dx * dx + dy * dy)
  if (d < 0.0001) return
  const scale = s.eType[e]! >= ENEMY_BOSS_FIRST ? force * BOSS_KNOCKBACK_SCALE : force
  s.eKx[e] = s.eKx[e]! + (dx / d) * scale
  s.eKy[e] = s.eKy[e]! + (dy / d) * scale
}

export function damageEnemy(s: State, e: number, amount: number, weapon: number): void {
  const hp = s.eHp[e]!
  if (hp <= 0) return
  s.eHp[e] = hp - amount
  s.eFlash[e] = ENEMY_FLASH_TICKS
  const x = s.ex[e]!
  const y = s.ey[e]!
  if (s.hitEvents < HIT_EVENTS_PER_TICK) {
    s.hitEvents++
    emit(s, EV_HIT, x, y, amount, weapon)
  }
  if (s.eHp[e]! > 0) return
  s.eHp[e] = 0
  const type = s.eType[e]!
  s.kills++
  if (type >= ENEMY_BOSS_FIRST) {
    s.bossKills++
    s.pendingLevels++
  }
  if (s.killEvents < KILL_EVENTS_PER_TICK) {
    s.killEvents++
    emit(s, EV_KILL, x, y, type, 0)
  }
  const kind = ENEMY_GEM[type]!
  dropGem(s, kind, GEM_XP[kind]!, x, y)
  const roll = rngFloat(s)
  if (roll < REPAIR_DROP_CHANCE) dropGem(s, GEM_REPAIR, 0, x + 4, y)
  else if (roll < REPAIR_DROP_CHANCE + MAGNET_DROP_CHANCE) dropGem(s, GEM_MAGNET, 0, x + 4, y)
}

export function removeDeadEnemies(s: State): void {
  const eHp = s.eHp
  let i = 0
  while (i < s.enemyCount) {
    if (eHp[i]! > 0) {
      i++
      continue
    }
    const last = --s.enemyCount
    if (i === last) break
    s.eType[i] = s.eType[last]!
    s.ex[i] = s.ex[last]!
    s.ey[i] = s.ey[last]!
    s.epx[i] = s.epx[last]!
    s.epy[i] = s.epy[last]!
    s.eHp[i] = s.eHp[last]!
    s.eFlash[i] = s.eFlash[last]!
    s.eId[i] = s.eId[last]!
    s.eMaxHp[i] = s.eMaxHp[last]!
    s.eKx[i] = s.eKx[last]!
    s.eKy[i] = s.eKy[last]!
    s.eDroneReady[i] = s.eDroneReady[last]!
  }
}

export function contactDamage(s: State): void {
  if (s.iframes > 0) return
  const found = gridQuery(s, s.px, s.py, PLAYER_RADIUS)
  const out = s.scratchQuery
  let worst = 0
  for (let k = 0; k < found; k++) {
    const dmg = enemyContactDamage(s, s.eType[out[k]!]!)
    if (dmg > worst) worst = dmg
  }
  if (worst <= 0) return
  const taken = Math.max(1, Math.round(worst - playerArmor(s)))
  s.hp = Math.max(0, s.hp - taken)
  s.iframes = PLAYER_IFRAMES
  emit(s, EV_HURT, s.px, s.py, taken, 0)
}

export function mirrorBoss(s: State): void {
  s.bossHp = 0
  s.bossMaxHp = 0
  let bestD2 = Number.POSITIVE_INFINITY
  const n = s.enemyCount
  for (let i = 0; i < n; i++) {
    if (s.eType[i]! < ENEMY_BOSS_FIRST || s.eHp[i]! <= 0) continue
    const dx = s.ex[i]! - s.px
    const dy = s.ey[i]! - s.py
    const d2 = dx * dx + dy * dy
    if (d2 >= bestD2) continue
    bestD2 = d2
    s.bossHp = s.eHp[i]!
    s.bossMaxHp = s.eMaxHp[i]!
  }
}
