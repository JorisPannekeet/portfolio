import { test } from 'node:test'
import assert from 'node:assert/strict'
import { KIND_ACTOR } from '../../src/game/render/atlas.ts'
import { RPG_PALETTE } from '../../src/rpg/render/palette.ts'
import {
  ELEMENT_ICON_FIRST, ENEMY_ELITE_OFFSET, ENEMY_FIRST, ENEMY_WINDUP, ITEM_ICON, NONE, OBJ_BASE, OBJ_OVER, OBJ_STATES, PROJ_FRAME,
  PROJ_ROTATED, ROT_EXIT, SPRITE_DEFS, SPR_ENEMIES, SPR_FX, SPR_ICONS, SPR_PROPS, SPR_ROTATED, SPR_TILES, TILESET_COUNT, TILE_ANIM, TILE_EDGE,
  TILE_FACE, TILE_FACE_VARIANTS, TILE_FIRST, TILE_VARIANTS, VAREK_PHASE_FIRST,
} from '../../src/rpg/render/sheet.ts'
import { rpgAtlas } from '../../src/rpg/render/renderer.ts'
import { ELEMENT_COUNT, ENEMY_KIND_COUNT, ITEM_BASE_COUNT, OBJ_EXIT, OBJ_KIND_COUNT, OBJ_TRIGGER, PROJ_KIND_COUNT, TILE_COUNT } from '../../src/rpg/sim/content.ts'

function frames(sprite: number): number {
  return SPRITE_DEFS[sprite]!.frames.length
}

test('palette has at most 64 colours and one hex per key', () => {
  assert.ok(RPG_PALETTE.keys.length <= 64)
  assert.equal(RPG_PALETTE.keys.length, RPG_PALETTE.hex.length)
  assert.equal(new Set(RPG_PALETTE.keys).size, RPG_PALETTE.keys.length)
  for (const hex of RPG_PALETTE.hex) assert.match(hex, /^#[0-9A-F]{6}$/)
  for (const key of '0WRAG') assert.ok(RPG_PALETTE.keys.includes(key), `atlas needs key ${key}`)
})

test('every sprite frame is rectangular and uses only palette keys', () => {
  for (const def of SPRITE_DEFS) {
    def.frames.forEach((rows, n) => {
      assert.ok(rows.length > 0, `${def.name}[${n}] empty`)
      const width = rows[0]!.length
      for (const row of rows) {
        assert.equal(row.length, width, `${def.name}[${n}] ragged`)
        for (const key of row) assert.ok(key === '.' || RPG_PALETTE.keys.includes(key), `${def.name}[${n}] unknown key ${key}`)
      }
    })
  }
})

test('every tile kind in every tileset resolves to tile frames', () => {
  const count = frames(SPR_TILES)
  for (let tileset = 0; tileset < TILESET_COUNT; tileset++) {
    for (let kind = 0; kind < TILE_COUNT; kind++) {
      const i = tileset * TILE_COUNT + kind
      assert.ok(TILE_FIRST[i]! + TILE_VARIANTS[i]! * TILE_ANIM[i]! <= count, `tileset ${tileset} kind ${kind}`)
      if (TILE_EDGE[i] !== NONE) assert.ok(TILE_EDGE[i]! + TILE_ANIM[i]! <= count)
      if (TILE_FACE[i] !== NONE) assert.ok(TILE_FACE[i]! + TILE_FACE_VARIANTS[i]! <= count)
    }
  }
})

test('every enemy kind, Varek phase and elite copy resolves', () => {
  const count = frames(SPR_ENEMIES)
  for (let kind = 0; kind < ENEMY_KIND_COUNT; kind++) {
    assert.ok(ENEMY_FIRST[kind]! + ENEMY_WINDUP[kind]! + ENEMY_ELITE_OFFSET < count, `enemy ${kind}`)
  }
  for (const first of VAREK_PHASE_FIRST) assert.ok(first + 1 + ENEMY_ELITE_OFFSET < count)
  assert.equal(SPRITE_DEFS[SPR_ENEMIES]!.kind, KIND_ACTOR)
})

test('every object kind except triggers and exits has art for both states, and exits have a chevron', () => {
  const count = frames(SPR_PROPS)
  assert.ok(ROT_EXIT < frames(SPR_ROTATED))
  for (let kind = 1; kind < OBJ_KIND_COUNT; kind++) {
    for (let state = 0; state < OBJ_STATES; state++) {
      const base = OBJ_BASE[kind * OBJ_STATES + state]!
      if (kind === OBJ_TRIGGER || kind === OBJ_EXIT) assert.equal(base, NONE)
      else assert.ok(base < count, `object ${kind} state ${state}`)
      const over = OBJ_OVER[kind * OBJ_STATES + state]!
      if (over !== NONE) assert.ok(over < count)
    }
  }
})

test('projectiles, item bases and elements resolve', () => {
  for (let kind = 0; kind < PROJ_KIND_COUNT; kind++) {
    const sprite = PROJ_ROTATED[kind] ? SPR_ROTATED : SPR_FX
    assert.ok(PROJ_FRAME[kind]! < frames(sprite), `projectile ${kind}`)
  }
  for (let base = 0; base < ITEM_BASE_COUNT; base++) assert.ok(ITEM_ICON[base]! < ELEMENT_ICON_FIRST, `item ${base}`)
  assert.equal(ELEMENT_ICON_FIRST + ELEMENT_COUNT, frames(SPR_ICONS))
})

test('atlas builds under a sane size', () => {
  const atlas = rpgAtlas()
  assert.ok(atlas.width * atlas.height <= 1024 * 1024, `${atlas.width}x${atlas.height}`)
  assert.ok(atlas.rw.every(w => w > 0))
})
