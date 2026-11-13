import { test } from 'node:test'
import assert from 'node:assert/strict'
import { KIND_ACTOR, KIND_ROTATED, ROTATIONS, buildAtlas, type Atlas } from '../../src/game/render/atlas.ts'
import { ART } from '../../src/rpg/render/art.ts'
import { createView } from '../../src/rpg/render/view.ts'
import { frameH, frameW, simOf } from '../../src/rpg/render/sprite.hot.ts'
import { HERO_H, HERO_W } from '../../src/rpg/sprites/aldric.ts'
import { RPG_PALETTE } from '../../src/rpg/render/palette.ts'
import { ELEMENT_ICON_FIRST, ITEM_ICON, SPRITE_DEFS } from '../../src/rpg/render/sheet.ts'
import { NONE, SPR_ALDRIC, SPR_COUNT, SPR_ENEMIES, SPR_ICONS, SPR_MARKS, SPR_PROPS, SPR_SHOTS, SPR_SHOTS_ROTATED, SPR_TILES } from '../../src/rpg/render/sheet-ids.ts'
import { ENEMY_DEATH, ENEMY_DEATH_N, ENEMY_ELITE_OFFSET, ENEMY_FIRST, ENEMY_WINDUP, PROJ_FRAME, PROJ_ROTATED, VAREK_PHASE_FIRST } from '../../src/rpg/render/sheet-foes.ts'
import {
  OBJ_BASE, OBJ_OVER, OBJ_SPRITE, OBJ_STATES, ROT_EXIT, TILESET_COUNT, TILE_ANIM, TILE_EDGE, TILE_FACE, TILE_FACE_VARIANTS, TILE_FIRST, TILE_VARIANTS,
} from '../../src/rpg/render/sheet-world.ts'
import { rpgAtlas } from '../../src/rpg/render/renderer.ts'
import { BOSS_VAREK, ELEMENT_COUNT, ENEMY_BOSS_FIRST, ENEMY_KIND_COUNT, ITEM_BASE_COUNT, OBJ_EXIT, OBJ_KIND_COUNT, OBJ_TRIGGER, PROJ_KIND_COUNT, TILE_COUNT } from '../../src/rpg/sim/content.ts'

function frames(sprite: number): number {
  return SPRITE_DEFS[sprite]!.frames.length
}

test('palette has at most 96 colours and one hex per key', () => {
  assert.ok(RPG_PALETTE.keys.length <= 96)
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
    const elite = kind < ENEMY_BOSS_FIRST ? ENEMY_ELITE_OFFSET : 0
    assert.ok(ENEMY_FIRST[kind]! + ENEMY_DEATH[kind]! + ENEMY_DEATH_N[kind]! - 1 + elite < count, `enemy ${kind}`)
    assert.ok(ENEMY_WINDUP[kind]! < ENEMY_DEATH[kind]!, `enemy ${kind} layout`)
  }
  for (const first of VAREK_PHASE_FIRST) assert.ok(first + ENEMY_DEATH[BOSS_VAREK]! + ENEMY_DEATH_N[BOSS_VAREK]! - 1 < ENEMY_ELITE_OFFSET)
  assert.equal(SPRITE_DEFS[SPR_ENEMIES]!.kind, KIND_ACTOR)
})

test('every object kind except triggers and exits has art for both states, and exits have a chevron', () => {
  assert.ok(ROT_EXIT < frames(SPR_MARKS))
  for (let kind = 1; kind < OBJ_KIND_COUNT; kind++) {
    for (let state = 0; state < OBJ_STATES; state++) {
      const slot = kind * OBJ_STATES + state
      const base = OBJ_BASE[slot]!
      if (kind === OBJ_TRIGGER || kind === OBJ_EXIT) assert.equal(base, NONE)
      else assert.ok(base < frames(OBJ_SPRITE[slot]!), `object ${kind} state ${state}`)
      const over = OBJ_OVER[slot]!
      if (over !== NONE) assert.ok(over < frames(SPR_PROPS))
    }
  }
})

test('the sheet fills every sprite id exactly once', () => {
  assert.equal(SPRITE_DEFS.length, SPR_COUNT)
  assert.equal(new Set(SPRITE_DEFS.map(def => def.name)).size, SPR_COUNT)
})

test('projectiles, item bases and elements resolve', () => {
  for (let kind = 0; kind < PROJ_KIND_COUNT; kind++) {
    const sprite = PROJ_ROTATED[kind] ? SPR_SHOTS_ROTATED : SPR_SHOTS
    assert.ok(PROJ_FRAME[kind]! < frames(sprite), `projectile ${kind}`)
  }
  for (let base = 0; base < ITEM_BASE_COUNT; base++) assert.ok(ITEM_ICON[base]! < ELEMENT_ICON_FIRST, `item ${base}`)
  assert.equal(ELEMENT_ICON_FIRST + ELEMENT_COUNT, frames(SPR_ICONS))
})

test('atlas fits a mobile canvas with room for 40% more frames', () => {
  const atlas = rpgAtlas()
  const headroom = 1.4
  assert.ok(atlas.width <= 4096 && atlas.height * headroom <= 4096, `${atlas.width}x${atlas.height}`)
  assert.ok(atlas.width * atlas.height * headroom <= 16_000_000, `${atlas.width}x${atlas.height}`)
  assert.ok(atlas.rw.every(w => w > 0))
})

function pixel(atlas: Atlas, id: number, x: number, y: number): number {
  const at = ((atlas.ry[id]! + y) * atlas.width + atlas.rx[id]! + x) * 4
  return ((atlas.pixels[at]! << 24) | (atlas.pixels[at + 1]! << 16) | (atlas.pixels[at + 2]! << 8) | atlas.pixels[at + 3]!) >>> 0
}

function assertDoubled(big: Atlas, bigId: number, small: Atlas, smallId: number, k: number, label: string): void {
  assert.equal(big.rw[bigId], small.rw[smallId]! * k, `${label} width`)
  assert.equal(big.rh[bigId], small.rh[smallId]! * k, `${label} height`)
  for (let y = 0; y < big.rh[bigId]!; y++) {
    for (let x = 0; x < big.rw[bigId]!; x++) assert.equal(pixel(big, bigId, x, y), pixel(small, smallId, (x / k) | 0, (y / k) | 0), `${label} at ${x},${y}`)
  }
}

test('a legacy frame is exactly the pixel-doubled 1x frame, variants and rotations included, and a native frame is untouched', () => {
  const rows = ['0WW.', 'RA0.', '.GR0']
  for (const kind of [KIND_ACTOR, KIND_ROTATED]) {
    const plain = buildAtlas([{ name: 'plain', kind, frames: [rows] }], 256, RPG_PALETTE)
    const mixed = buildAtlas([{ name: 'mixed', kind, frames: [rows, rows], scale: [ART, 1] }], 256, RPG_PALETTE)
    const variants = mixed.variants[0]!
    assert.equal(variants, kind === KIND_ROTATED ? ROTATIONS : 4)
    for (let v = 0; v < variants; v++) {
      assertDoubled(mixed, v, plain, v, ART, `kind ${kind} legacy variant ${v}`)
      assertDoubled(mixed, variants + v, plain, v, 1, `kind ${kind} native variant ${v}`)
      assert.equal(mixed.scale[v], ART)
      assert.equal(mixed.scale[variants + v], 1)
    }
  }
})

test('sim-unit helpers read a native hero frame at its art-pixel size over ART', () => {
  const atlas = rpgAtlas()
  const v = createView({} as CanvasRenderingContext2D, atlas, {} as CanvasImageSource)
  const id = atlas.base[SPR_ALDRIC]!
  assert.equal(atlas.rw[id], HERO_W)
  assert.equal(frameW(v, id), HERO_W / ART)
  assert.equal(frameH(v, id), HERO_H / ART)
  assert.equal(simOf(v, id, HERO_W), HERO_W / ART)
})
