import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rpgAtlas } from '../../src/rpg/render/renderer.ts'
import { AMB_CAP, LIGHT_CAP, createView, type View } from '../../src/rpg/render/view.ts'
import { drawFrame } from '../../src/rpg/render/renderer.hot.ts'
import { ambientLive } from '../../src/rpg/render/ambient.hot.ts'
import { AMB_EMBER, WEATHER_CLEAR, WEATHER_COUNT, WEATHER_RAIN, WEATHER_SPAN, weatherAmount, weatherFor } from '../../src/rpg/render/ambient.ts'
import { createState, type State } from '../../src/rpg/sim/state.ts'
import { newGame } from '../../src/rpg/sim/game.ts'
import { loadArea } from '../../src/rpg/sim/world.hot.ts'
import * as C from '../../src/rpg/sim/content.ts'

function stubContext(): CanvasRenderingContext2D {
  const noop = () => {}
  return {
    globalAlpha: 1, fillStyle: '', strokeStyle: '', lineWidth: 1, imageSmoothingEnabled: false,
    drawImage: noop, fillRect: noop, beginPath: noop, ellipse: noop, arc: noop, stroke: noop, fill: noop,
  } as unknown as CanvasRenderingContext2D
}

function scene(area: number, reduced: boolean): { v: View; s: State } {
  const v = createView(stubContext(), rpgAtlas(), {} as CanvasImageSource)
  v.width = 400
  v.height = 240
  v.reducedMotion = reduced
  const s = createState()
  newGame(s, 7)
  loadArea(s, area, 0)
  s.areaTick = 1000
  return { v, s }
}

test('weatherFor picks a valid kind, is stable for a state, changes over time and never rains indoors', () => {
  const s = createState()
  newGame(s, 99)
  loadArea(s, C.AREA_VALDMERE, 0)
  const seen = new Set<number>()
  for (let cycle = 0; cycle < 40; cycle++) {
    s.tick = cycle * WEATHER_SPAN + 5
    const kind = weatherFor(s)
    assert.ok(kind >= 0 && kind < WEATHER_COUNT, `kind ${kind}`)
    assert.equal(weatherFor(s), kind)
    seen.add(kind)
  }
  assert.ok(seen.size >= 3, `only ${[...seen]} over 40 cycles`)
  for (const area of [C.AREA_BARROW, C.AREA_SALTREACH, C.AREA_ASHFORGE, C.AREA_VELLIN, C.AREA_CITADEL, C.AREA_SHRINE]) {
    loadArea(s, area, 0)
    for (let cycle = 0; cycle < 40; cycle++) {
      s.tick = cycle * WEATHER_SPAN + 5
      assert.equal(weatherFor(s), WEATHER_CLEAR)
      assert.equal(weatherAmount(s, WEATHER_RAIN), 0)
    }
  }
})

test('weather fades between cycles instead of popping', () => {
  const s = createState()
  newGame(s, 3)
  loadArea(s, C.AREA_BRENNHOLD, 0)
  for (let tick = WEATHER_SPAN; tick < WEATHER_SPAN * 30; tick += 30) {
    s.tick = tick
    const now = weatherAmount(s, WEATHER_RAIN)
    s.tick = tick + 1
    assert.ok(Math.abs(weatherAmount(s, WEATHER_RAIN) - now) < 0.01, `rain jumps at tick ${tick}`)
  }
})

test('ambient pools stay within their caps over thousands of frames in every area', () => {
  for (let area = 0; area < C.AREA_COUNT; area++) {
    const { v, s } = scene(area, false)
    s.clock = C.NIGHT_START_TICKS + 3000
    for (let frame = 0; frame < 2500; frame++) {
      s.tick++
      if (frame % 3 === 0) s.playerPrevX = s.playerX - 1
      drawFrame(v, s, 1)
      assert.ok(v.lightCount <= LIGHT_CAP)
    }
    assert.ok(ambientLive(v, s.tick) <= AMB_CAP)
  }
})

test('reduced motion thins the ambience to a trickle', () => {
  const live = (reduced: boolean) => {
    const { v, s } = scene(C.AREA_ASHFORGE, reduced)
    let total = 0
    for (let frame = 0; frame < 600; frame++) {
      s.tick++
      drawFrame(v, s, 1)
      total += ambientLive(v, s.tick)
    }
    return total
  }
  const full = live(false)
  const reduced = live(true)
  assert.ok(full > 0, 'ashforge has embers')
  assert.ok(reduced < full * 0.3, `reduced ${reduced} vs full ${full}`)
})

test('the forge landmark breathes embers on Valdmere, thinned to a trickle under reduced motion', () => {
  const embers = (reduced: boolean, tx: number, ty: number) => {
    const { v, s } = scene(C.AREA_VALDMERE, reduced)
    s.playerX = s.playerPrevX = tx * C.TILE
    s.playerY = s.playerPrevY = ty * C.TILE
    let total = 0
    for (let frame = 0; frame < 600; frame++) {
      s.tick++
      drawFrame(v, s, 1)
      for (let i = 0; i < AMB_CAP; i++) if (v.ambKind[i] === AMB_EMBER && s.tick - v.ambBirth[i]! < v.ambLife[i]!) total++
    }
    return total
  }
  const full = embers(false, 76, 10)
  assert.ok(full > 1000, 'forge embers ' + full)
  assert.equal(embers(false, 30, 26), 0)
  assert.ok(embers(true, 76, 10) < full * 0.3)
})
