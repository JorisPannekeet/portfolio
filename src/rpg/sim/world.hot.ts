import {
  AREA_BARROW,
  AREA_SALTREACH,
  AREA_SHRINE,
  CH_EMBER,
  DAY_TICKS,
  ENEMY_FOOTMAN,
  ENEMY_KNIGHT,
  EV_AREA,
  EV_CHEST,
  EV_DOOR,
  EV_KEY_ITEM,
  EV_MOUNT,
  EV_PICKUP,
  EV_SAVE,
  EV_SHARD,
  IN_INTERACT,
  KEY_GRAPPLE,
  LOOT_GOLD,
  LOOT_HEART,
  LOOT_ITEM,
  LOOT_ORE,
  LOOT_RUNE,
  MAX_ENEMIES,
  MAX_OBJECTS,
  MAX_TILES,
  NIGHT_START_TICKS,
  OBJ_CHEST,
  OBJ_EXIT,
  OBJ_FORGE,
  OBJ_GRAPPLE,
  OBJ_HORSE,
  OBJ_IDLE,
  OBJ_KEY,
  OBJ_LOOT,
  OBJ_NONE,
  OBJ_NPC,
  OBJ_PEDESTAL,
  OBJ_SHRINE,
  OBJ_TRIGGER,
  OBJ_USED,
  OBJ_WAYSTONE,
  PL_GRAPPLE,
  PL_IDLE,
  SCRIPT_SHRINE,
  SCRIPT_SHRINE_DONE,
  SHRINE_COUNT,
  TILE,
  TILE_BLOCKS_SHOT,
  TILE_BLOCKS_WALK,
  TILE_DOOR,
  TILE_VOID,
} from './content.ts'
import type { State } from './state.ts'
import { AREAS, DOOR_KEY_FLAG, EXIT_CHAPTER_SHIFT, EXIT_SPAWN_MASK, type ParsedArea } from './areas.ts'
import { clearActors, spawnEnemy } from './enemies.hot.ts'
import { emit, pressed } from './events.hot.ts'
import { FLAG_SHRINE_CHEST, FLAG_SHRINE_CLEAR } from './flags.ts'
import {
  CHEST_BASE,
  CHEST_GOLD,
  CHEST_KEY,
  CHEST_ORE,
  CHEST_RUNE,
  CHEST_SHRINE_FIRST,
  CHEST_TIER,
  LOOT_ITEM_TIER_BITS,
  LOOT_ITEM_TIER_MASK,
  SHRINE_RING_DX,
  SHRINE_RING_DY,
  SHRINE_WAVE_COUNT,
  SHRINE_WAVE_KIND,
  SHRINE_WAVE_SIZE,
  SHRINE_WAVE_STRIDE,
} from './loot-tables.ts'
import { grantItem } from './loot.hot.ts'
import { openTileGroup, openedTile } from './puzzles.hot.ts'
import { fireStory, startScript } from './story.hot.ts'
import { PEDESTAL_CHAPTER, TRG_SHARD, TRG_TALK, TRG_ZONE, ZONE_CHILD, ZONE_SHRINE_ARENA } from './story-table.ts'
import { updateGuide } from './guide.hot.ts'
import {
  FORGE_RANGE,
  GRAPPLE_MIN_RANGE,
  GRAPPLE_RANGE,
  INTERACT_RANGE,
  PICKUP_RANGE,
  SHRINE_CHEST_DY,
  TRIGGER_RANGE,
  WAYSTONE_RANGE,
  WAYSTONE_REARM_RANGE,
} from './world-tuning.ts'

function passes(min: number, max: number, variant: number, s: State): boolean {
  return s.chapter >= min && s.chapter <= max && (variant < 0 || variant === s.areaVariant)
}

export function isNight(s: State): boolean {
  return AREAS[s.area]!.outdoor !== 0 && s.clock >= NIGHT_START_TICKS
}

function spawnAreaEnemies(s: State, a: ParsedArea, nightOnly: boolean): void {
  const night = isNight(s)
  const vigil = s.chapter >= CH_EMBER
  const corrupted = s.areaVariant === 1 && s.area !== AREA_SHRINE
  for (let k = 0; k < a.enCount; k++) {
    if (!passes(a.enMinCh[k]!, a.enMaxCh[k]!, a.enVariant[k]!, s)) continue
    const nightSpawn = a.enNight[k] !== 0
    if (nightOnly && (!nightSpawn || vigil)) continue
    if (nightSpawn && !night && !vigil) continue
    if (a.enBoss[k] !== 0) {
      const flag = a.bossFlag[s.areaVariant]!
      if (flag < 0 || s.flags[flag] !== 0) continue
    }
    let kind = a.enKind[k]!
    if (vigil && a.outdoor !== 0 && kind === ENEMY_FOOTMAN) kind = ENEMY_KNIGHT
    const elite = a.enElite[k] !== 0 || corrupted || (vigil && night) ? 1 : 0
    spawnEnemy(s, kind, a.enX[k]!, a.enY[k]!, elite, -1)
  }
}

function freeObject(s: State): number {
  for (let i = 0; i < MAX_OBJECTS; i++) if (s.objKind[i] === OBJ_NONE) return i
  return -1
}

export function placeObject(s: State, kind: number, x: number, y: number, arg: number, data: number, flag: number): number {
  const i = freeObject(s)
  if (i < 0) return -1
  s.objKind[i] = kind
  s.objState[i] = OBJ_IDLE
  s.objX[i] = x
  s.objY[i] = y
  s.objArg[i] = arg
  s.objData[i] = data
  s.objFlag[i] = flag
  return i
}

function placeShrineChest(s: State, x: number, y: number): void {
  const v = s.areaVariant
  const i = placeObject(s, OBJ_CHEST, x, y + SHRINE_CHEST_DY, CHEST_SHRINE_FIRST + v, 0, FLAG_SHRINE_CHEST[v]!)
  if (i >= 0 && s.flags[FLAG_SHRINE_CHEST[v]!] !== 0) s.objState[i] = OBJ_USED
}

function findObject(s: State, kind: number, arg: number): number {
  for (let i = 0; i < MAX_OBJECTS; i++) if (s.objKind[i] === kind && (arg < 0 || s.objArg[i] === arg)) return i
  return -1
}

export function loadArea(s: State, area: number, spawn: number): void {
  clearActors(s)
  const a = AREAS[area]!
  let variant = 0
  let spawnId = spawn
  if (area === AREA_SHRINE) {
    variant = spawn >= 0 && spawn < SHRINE_COUNT ? spawn : 0
    spawnId = 0
  } else if ((area === AREA_BARROW || area === AREA_SALTREACH) && s.chapter >= CH_EMBER) variant = 1
  if (spawnId < 0 || spawnId >= 31 || (a.spawnSet & (1 << spawnId)) === 0) spawnId = 0
  s.area = area
  s.areaVariant = variant
  s.areaTick = 0
  s.mapW = a.w
  s.mapH = a.h
  const n = a.w * a.h
  for (let i = 0; i < n; i++) {
    const f = a.tileFlag[i]!
    s.tiles[i] = f >= 0 && s.flags[f] !== 0 ? openedTile(a.tiles[i]!) : a.tiles[i]!
  }
  for (let i = n; i < MAX_TILES; i++) s.tiles[i] = TILE_VOID
  for (let i = 0; i < MAX_OBJECTS; i++) {
    s.objKind[i] = OBJ_NONE
    s.objState[i] = OBJ_IDLE
    s.objX[i] = 0
    s.objY[i] = 0
    s.objArg[i] = 0
    s.objData[i] = 0
    s.objFlag[i] = -1
  }
  if (s.mounted !== 0 && a.horse === 0) {
    s.mounted = 0
    emit(s, EV_MOUNT, 0, 0, s.playerX, s.playerY)
  }
  let shrineX = 0
  let shrineY = 0
  for (let k = 0; k < a.objCount; k++) {
    if (!passes(a.oMinCh[k]!, a.oMaxCh[k]!, a.oVariant[k]!, s)) continue
    const kind = a.oKind[k]!
    const flag = a.oFlag[k]!
    const done = flag >= 0 && s.flags[flag] !== 0
    if (kind === OBJ_KEY && done) continue
    if (kind === OBJ_HORSE && s.mounted !== 0) continue
    const i = placeObject(s, kind, a.oX[k]!, a.oY[k]!, a.oArg[k]!, a.oData[k]!, flag)
    if (done || (kind === OBJ_PEDESTAL && (s.shards & (1 << a.oArg[k]!)) !== 0)) s.objState[i] = OBJ_USED
    if (kind === OBJ_TRIGGER && a.oArg[k] === ZONE_SHRINE_ARENA) {
      shrineX = a.oX[k]!
      shrineY = a.oY[k]!
    }
  }
  if (area === AREA_SHRINE && s.flags[FLAG_SHRINE_CLEAR[variant]!] !== 0) placeShrineChest(s, shrineX, shrineY)
  s.playerX = a.spawnX[spawnId]!
  s.playerY = a.spawnY[spawnId]!
  s.playerPrevX = s.playerX
  s.playerPrevY = s.playerY
  if (s.playerState === PL_GRAPPLE) {
    s.playerState = PL_IDLE
    s.playerTimer = 0
  }
  s.interactObj = -1
  s.nearForge = 0
  spawnAreaEnemies(s, a, false)
  emit(s, EV_AREA, area, variant, s.playerX, s.playerY)
  updateGuide(s)
}

export function tileAt(s: State, x: number, y: number): number {
  if (x < 0 || y < 0) return -1
  const tx = Math.floor(x / TILE)
  const ty = Math.floor(y / TILE)
  if (tx >= s.mapW || ty >= s.mapH) return -1
  return s.tiles[ty * s.mapW + tx]!
}

export function blocksWalk(s: State, x: number, y: number): number {
  const t = tileAt(s, x, y)
  return t < 0 ? 1 : TILE_BLOCKS_WALK[t]!
}

export function blocksShot(s: State, x: number, y: number): number {
  const t = tileAt(s, x, y)
  return t < 0 ? 1 : TILE_BLOCKS_SHOT[t]!
}

export function setCheckpoint(s: State, area: number, spawn: number): void {
  s.checkpointArea = area
  s.checkpointSpawn = spawn
  emit(s, EV_SAVE, area, spawn, s.playerX, s.playerY)
}

function takeExit(s: State, area: number, spawn: number): void {
  loadArea(s, area, spawn)
  setCheckpoint(s, area, spawn)
}

function aliveEnemies(s: State): number {
  let n = 0
  for (let i = 0; i < MAX_ENEMIES; i++) if (s.eAlive[i] !== 0) n++
  return n
}

function openDoorsNear(s: State): void {
  const tx = Math.floor(s.playerX / TILE)
  const ty = Math.floor(s.playerY / TILE)
  const a = AREAS[s.area]!
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = tx + dx
      const y = ty + dy
      if (x < 0 || y < 0 || x >= s.mapW || y >= s.mapH) continue
      const i = y * s.mapW + x
      if (s.tiles[i] !== TILE_DOOR) continue
      const door = a.tileFlag[i]!
      if (door < 0) continue
      const key = DOOR_KEY_FLAG[door]!
      if (key < 0 || s.flags[key] === 0) continue
      openTileGroup(s, door)
      emit(s, EV_DOOR, door, 0, (x + 0.5) * TILE, (y + 0.5) * TILE)
    }
  }
}

function pickupLoot(s: State, i: number): void {
  const type = s.objArg[i]!
  const amount = s.objData[i]!
  if (type === LOOT_GOLD) s.gold += amount
  else if (type === LOOT_ORE) s.ore += amount
  else if (type === LOOT_HEART) s.hp = Math.min(s.statMaxHp, s.hp + amount)
  else if (type === LOOT_RUNE) s.runes[amount] = Math.min(255, s.runes[amount]! + 1)
  else if (type === LOOT_ITEM) grantItem(s, amount >> LOOT_ITEM_TIER_BITS, amount & LOOT_ITEM_TIER_MASK)
  if (type !== LOOT_ITEM) emit(s, EV_PICKUP, type, type === LOOT_RUNE ? 1 : amount, s.objX[i]!, s.objY[i]!)
  s.objKind[i] = OBJ_NONE
}

function openChest(s: State, i: number): void {
  const id = s.objArg[i]!
  s.objState[i] = OBJ_USED
  const flag = s.objFlag[i]!
  if (flag >= 0) s.flags[flag] = 1
  const x = s.objX[i]!
  const y = s.objY[i]!
  emit(s, EV_CHEST, id, 0, x, y)
  if (CHEST_GOLD[id]! > 0) {
    s.gold += CHEST_GOLD[id]!
    emit(s, EV_PICKUP, LOOT_GOLD, CHEST_GOLD[id]!, x, y)
  }
  if (CHEST_ORE[id]! > 0) {
    s.ore += CHEST_ORE[id]!
    emit(s, EV_PICKUP, LOOT_ORE, CHEST_ORE[id]!, x, y)
  }
  const key = CHEST_KEY[id]!
  if (key !== 0) {
    s.keyItems |= key
    emit(s, EV_KEY_ITEM, key, 0, x, y)
  }
  const rune = CHEST_RUNE[id]!
  if (rune >= 0) {
    s.runes[rune] = Math.min(255, s.runes[rune]! + 1)
    emit(s, EV_PICKUP, LOOT_RUNE, 1, x, y)
  }
  if (CHEST_BASE[id]! >= 0) grantItem(s, CHEST_BASE[id]!, CHEST_TIER[id]!)
}

function pedestalReady(s: State, i: number): boolean {
  if (s.objState[i] !== OBJ_IDLE) return false
  const element = s.objArg[i]!
  if ((s.shards & (1 << element)) !== 0 || s.chapter < PEDESTAL_CHAPTER[element]!) return false
  const flag = AREAS[s.area]!.bossFlag[0]!
  return flag >= 0 && s.flags[flag] !== 0
}

function takeShard(s: State, i: number): void {
  const element = s.objArg[i]!
  s.objState[i] = OBJ_USED
  s.shards |= 1 << element
  s.stancesUnlocked |= 1 << element
  emit(s, EV_SHARD, element, 0, s.objX[i]!, s.objY[i]!)
  fireStory(s, TRG_SHARD, element)
}

function canInteract(s: State, i: number, d2: number): boolean {
  const kind = s.objKind[i]!
  if (kind === OBJ_GRAPPLE) {
    return (s.keyItems & KEY_GRAPPLE) !== 0 && d2 > GRAPPLE_MIN_RANGE * GRAPPLE_MIN_RANGE && d2 <= GRAPPLE_RANGE * GRAPPLE_RANGE
  }
  if (d2 > INTERACT_RANGE * INTERACT_RANGE) return false
  if (kind === OBJ_NPC || kind === OBJ_SHRINE || kind === OBJ_FORGE) return true
  if (kind === OBJ_CHEST) return s.objState[i] === OBJ_IDLE
  if (kind === OBJ_HORSE) return s.mounted === 0
  if (kind === OBJ_PEDESTAL) return pedestalReady(s, i)
  return false
}

function interact(s: State, i: number): void {
  const kind = s.objKind[i]!
  if (kind === OBJ_NPC) fireStory(s, TRG_TALK, s.objArg[i]!)
  else if (kind === OBJ_CHEST) openChest(s, i)
  else if (kind === OBJ_PEDESTAL) takeShard(s, i)
  else if (kind === OBJ_SHRINE) takeExit(s, AREA_SHRINE, s.objArg[i]!)
  else if (kind === OBJ_HORSE) {
    s.mounted = 1
    s.objKind[i] = OBJ_NONE
    emit(s, EV_MOUNT, 1, 0, s.playerX, s.playerY)
  } else if (kind === OBJ_GRAPPLE) {
    s.playerState = PL_GRAPPLE
    s.playerTimer = 0
    s.grappleX = s.objX[i]!
    s.grappleY = s.objY[i]!
  }
}

function touchWaystone(s: State, i: number): void {
  s.objState[i] = OBJ_USED
  s.waystones |= 1 << s.area
  s.hp = s.statMaxHp
  s.stamina = s.statMaxStamina
  setCheckpoint(s, s.area, AREAS[s.area]!.waystoneSpawn)
}

function startShrine(s: State): void {
  const i = findObject(s, OBJ_TRIGGER, ZONE_SHRINE_ARENA)
  if (i < 0 || s.objData[i] !== 0 || s.flags[FLAG_SHRINE_CLEAR[s.areaVariant]!] !== 0) return
  s.objData[i] = 1
  startScript(s, SCRIPT_SHRINE)
}

function updateShrine(s: State): void {
  const i = findObject(s, OBJ_TRIGGER, ZONE_SHRINE_ARENA)
  if (i < 0) return
  const wave = s.objData[i]!
  if (wave === 0 || aliveEnemies(s) > 0) return
  const v = s.areaVariant
  if (wave > SHRINE_WAVE_COUNT[v]!) {
    s.objData[i] = 0
    s.flags[FLAG_SHRINE_CLEAR[v]!] = 1
    placeShrineChest(s, s.objX[i]!, s.objY[i]!)
    startScript(s, SCRIPT_SHRINE_DONE)
    return
  }
  const slot = v * SHRINE_WAVE_STRIDE + wave - 1
  const kind = SHRINE_WAVE_KIND[slot]!
  const size = SHRINE_WAVE_SIZE[slot]!
  for (let k = 0; k < size; k++) {
    const r = k % SHRINE_RING_DX.length
    spawnEnemy(s, kind, s.objX[i]! + SHRINE_RING_DX[r]!, s.objY[i]! + SHRINE_RING_DY[r]!, wave > 2 ? 1 : 0, i)
  }
  s.objData[i] = wave + 1
}

function hasHorse(s: State): boolean {
  return findObject(s, OBJ_HORSE, -1) >= 0
}

export function updateWorld(s: State, input: number): void {
  s.interactUsed = 0
  s.interactObj = -1
  s.nearForge = 0
  const a = AREAS[s.area]!
  if (a.outdoor !== 0) {
    s.clock++
    if (s.clock >= DAY_TICKS) s.clock = 0
    if (s.clock === NIGHT_START_TICKS) spawnAreaEnemies(s, a, true)
  }
  if (a.horse !== 0 && s.mounted === 0 && !hasHorse(s)) placeObject(s, OBJ_HORSE, s.playerX, s.playerY, 0, 0, -1)
  openDoorsNear(s)
  const px = s.playerX
  const py = s.playerY
  const ptx = Math.floor(px / TILE)
  const pty = Math.floor(py / TILE)
  let best = -1
  let bestD2 = 0
  for (let i = 0; i < MAX_OBJECTS; i++) {
    const kind = s.objKind[i]!
    if (kind === OBJ_NONE) continue
    const dx = s.objX[i]! - px
    const dy = s.objY[i]! - py
    const d2 = dx * dx + dy * dy
    if (kind === OBJ_EXIT) {
      if (Math.floor(s.objX[i]! / TILE) !== ptx || Math.floor(s.objY[i]! / TILE) !== pty) continue
      const data = s.objData[i]!
      if (s.chapter < data >> EXIT_CHAPTER_SHIFT) continue
      const spawn = (data & EXIT_SPAWN_MASK) + (s.area === AREA_SHRINE ? s.areaVariant : 0)
      takeExit(s, s.objArg[i]!, spawn)
      return
    }
    if (kind === OBJ_LOOT) {
      if (d2 <= PICKUP_RANGE * PICKUP_RANGE) pickupLoot(s, i)
      continue
    }
    if (kind === OBJ_KEY) {
      if (d2 > PICKUP_RANGE * PICKUP_RANGE) continue
      s.flags[s.objFlag[i]!] = 1
      s.objKind[i] = OBJ_NONE
      emit(s, EV_KEY_ITEM, 0, s.objArg[i]!, s.objX[i]!, s.objY[i]!)
      continue
    }
    if (kind === OBJ_WAYSTONE) {
      if (s.objState[i] === OBJ_IDLE && d2 <= WAYSTONE_RANGE * WAYSTONE_RANGE) touchWaystone(s, i)
      else if (s.objState[i] === OBJ_USED && d2 > WAYSTONE_REARM_RANGE * WAYSTONE_REARM_RANGE) s.objState[i] = OBJ_IDLE
      continue
    }
    if (kind === OBJ_TRIGGER) {
      if (s.objState[i] !== OBJ_IDLE || d2 > TRIGGER_RANGE * TRIGGER_RANGE) continue
      if (s.objArg[i] === ZONE_CHILD && aliveEnemies(s) > 0) continue
      s.objState[i] = OBJ_USED
      if (s.objArg[i] === ZONE_SHRINE_ARENA) startShrine(s)
      else {
        if (s.objData[i]! > 0) setCheckpoint(s, s.area, s.objData[i]!)
        fireStory(s, TRG_ZONE, s.objArg[i]!)
      }
      continue
    }
    if (kind === OBJ_FORGE && d2 <= FORGE_RANGE * FORGE_RANGE) s.nearForge = 1
    if (canInteract(s, i, d2) && (best < 0 || d2 < bestD2)) {
      best = i
      bestD2 = d2
    }
  }
  s.interactObj = best
  if (best >= 0 && s.playerState !== PL_GRAPPLE && pressed(s, input, IN_INTERACT)) {
    s.interactUsed = 1
    interact(s, best)
  }
  if (s.area === AREA_SHRINE) updateShrine(s)
}
