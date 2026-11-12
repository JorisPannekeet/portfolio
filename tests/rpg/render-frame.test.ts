import { test } from 'node:test'
import assert from 'node:assert/strict'
import { layoutView, rpgAtlas, pickScale } from '../../src/rpg/render/renderer.ts'
import { HUD_HEIGHT, HUD_WIDTH } from '../../src/rpg/render/hud.hot.ts'
import { exitHeading } from '../../src/rpg/render/actors.hot.ts'
import { loadArea } from '../../src/rpg/sim/world.hot.ts'
import { blocksWalk } from '../../src/rpg/sim/world.hot.ts'
import { createView } from '../../src/rpg/render/view.ts'
import { drawFrame } from '../../src/rpg/render/renderer.hot.ts'
import { nightAmount } from '../../src/rpg/render/light.hot.ts'
import { createState } from '../../src/rpg/sim/state.ts'
import { emit } from '../../src/rpg/sim/events.hot.ts'
import * as C from '../../src/rpg/sim/content.ts'

function recordingContext(): { ctx: CanvasRenderingContext2D; calls: { draws: number; bad: number } } {
  const calls = { draws: 0, bad: 0 }
  const check = (...values: number[]) => {
    for (const value of values) if (!Number.isFinite(value)) calls.bad++
  }
  const target = {
    globalAlpha: 1,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    imageSmoothingEnabled: false,
    drawImage: (_image: unknown, ...args: number[]) => {
      calls.draws++
      check(...args)
    },
    fillRect: (...args: number[]) => check(...args),
    beginPath: () => {},
    ellipse: (...args: number[]) => check(...args),
    arc: (...args: number[]) => check(...args),
    stroke: () => {},
    fill: () => {},
  }
  return { ctx: target as unknown as CanvasRenderingContext2D, calls }
}

function busyState() {
  const s = createState()
  s.area = C.AREA_BARROW
  s.mapW = 40
  s.mapH = 30
  for (let i = 0; i < s.mapW * s.mapH; i++) s.tiles[i] = i % C.TILE_COUNT
  s.playerX = s.playerPrevX = 300
  s.playerY = s.playerPrevY = 240
  s.stancesUnlocked = 15
  for (let i = 0; i < C.MAX_ENEMIES; i++) {
    s.eAlive[i] = 1
    s.eKind[i] = i % C.ENEMY_KIND_COUNT
    s.eElite[i] = i & 1
    s.eX[i] = s.ePrevX[i] = 120 + (i % 8) * 40
    s.eY[i] = s.ePrevY[i] = 100 + Math.floor(i / 8) * 40
    s.eMaxHp[i] = 100
    s.eHp[i] = 50
  }
  for (let i = 0; i < C.MAX_PROJECTILES; i++) {
    s.prAlive[i] = 1
    s.prKind[i] = i % C.PROJ_KIND_COUNT
    s.prX[i] = s.prPrevX[i] = 100 + i * 6
    s.prY[i] = s.prPrevY[i] = 200
    s.prVx[i] = 1
  }
  for (let i = 0; i < 40; i++) {
    s.objKind[i] = i % C.OBJ_KIND_COUNT
    s.objArg[i] = i - 10
    s.objData[i] = i
    s.objX[i] = 50 + i * 12
    s.objY[i] = 300
  }
  s.lockTarget = 3
  s.interactObj = 2
  s.guideX = 5000
  s.guideY = -40
  return s
}

test('drawFrame survives hundreds of busy frames with every state and event', () => {
  const { ctx, calls } = recordingContext()
  const view = createView(ctx, rpgAtlas(), {} as CanvasImageSource)
  view.width = 320
  view.height = 200
  const s = busyState()
  for (let frame = 0; frame < 400; frame++) {
    s.tick++
    s.areaTick++
    s.clock = frame * 97
    s.chapter = frame % C.CH_COUNT
    s.area = frame % C.AREA_COUNT
    s.areaVariant = frame & 1
    s.bossPhase = frame % 3
    s.playerState = frame % 9
    s.playerTimer = frame % 20
    s.playerFace = (frame * 64) & 1023
    s.mounted = frame % 50 < 5 ? 1 : 0
    s.stance = frame % C.ELEMENT_COUNT
    s.heat = frame % 101
    s.playerX += frame % 3 === 0 ? 1 : 0
    for (let i = 0; i < C.MAX_ENEMIES; i++) s.eState[i] = (i + frame) % 7
    emit(s, 1 + (frame % (C.EV_COUNT - 1)), frame % 5 - 1, frame % 7, 300 + (frame % 30), 240)
    drawFrame(view, s, (frame % 10) / 10)
  }
  assert.ok(calls.draws > 1000)
  assert.equal(calls.bad, 0)
})

test('scale keeps the view near 18-26 tiles across on desktop and a full card at 245 px', () => {
  assert.equal(pickScale(245, 245), 1)
  const wide = 1280 / pickScale(1280, 720) / C.TILE
  assert.ok(wide >= 18 && wide <= 28, `${wide}`)
  const full = 1920 / pickScale(1920, 1080) / C.TILE
  assert.ok(full >= 18 && full <= 28, `${full}`)
})

test('night fades in after dusk and out before dawn', () => {
  assert.equal(nightAmount(0), 0)
  assert.equal(nightAmount(C.NIGHT_START_TICKS - 1), 0)
  assert.ok(nightAmount(C.NIGHT_START_TICKS + 60) > 0 && nightAmount(C.NIGHT_START_TICKS + 60) < 0.1)
  const middle = Math.floor((C.NIGHT_START_TICKS + C.DAY_TICKS) / 2)
  assert.equal(nightAmount(middle), 1)
  assert.ok(nightAmount(C.DAY_TICKS - 30) < 0.05)
})

test('the canvas HUD fits the agreed top-left box and the boss bar sits under the DOM name', () => {
  for (const [w, h] of [[245, 245], [300, 520], [390, 700], [844, 390], [1280, 720], [1920, 1080], [2560, 1440]] as const) {
    const scale = pickScale(w, h)
    const v = createView(recordingContext().ctx, rpgAtlas(), {} as CanvasImageSource)
    layoutView(v, w, h, scale, false)
    const small = w <= 300 || h <= 300
    const top = small ? 40 : Math.min(80, Math.max(56, Math.min(w, h) * 0.12))
    assert.ok(HUD_HEIGHT * scale <= top, `${w}x${h}: HUD ${HUD_HEIGHT * scale}px tall, box ${top}px`)
    assert.ok(HUD_WIDTH * scale <= w - v.clearRight * scale, `${w}x${h}: HUD runs under the top-right buttons`)
    assert.ok(Math.abs(v.bossBarY * scale - (top + 26)) <= scale, `${w}x${h}: boss bar at ${v.bossBarY * scale}`)
  }
})

test('every exit on every map points its chevron at the blocked side', () => {
  const s = createState()
  for (let area = 0; area < C.AREA_COUNT; area++) {
    loadArea(s, area, 0)
    for (let i = 0; i < C.MAX_OBJECTS; i++) {
      if (s.objKind[i] !== C.OBJ_EXIT) continue
      const heading = exitHeading(s, i)
      const dx = heading === 0 ? 1 : heading === 8 ? -1 : 0
      const dy = heading === 4 ? 1 : heading === 12 ? -1 : 0
      assert.equal(blocksWalk(s, s.objX[i]! + dx * C.TILE, s.objY[i]! + dy * C.TILE), 1, `area ${area} exit ${i} heading ${heading}`)
    }
  }
})
