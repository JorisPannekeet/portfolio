import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { AI_CHASE, CH_GALE, CMD_ADVANCE, ELEMENT_EMBER, ELEMENT_STONE, ELEMENT_TIDE, ENDING_REFORGE, ENDING_SHATTER, ITEM_GREATSWORD, ITEM_SWORD, MAX_ENEMIES, MELODY_ROADS, MELODY_SEALS, MELODY_STABLE, OBJ_FORGE, PHASE_DIALOG, SCRIPT_CHOICE, SCRIPT_INTRO, SCRIPT_LENGTH, SET_BARROWGUARD, SET_TIDEWARDEN, SLOT_HELM, SLOT_PLATE, TIER_EPIC, TIER_LEGENDARY, TIER_RARE, AREA_BARROW, AREA_BRENNHOLD, AREA_VALDMERE, armorBase, BOSS_BARROW_KING, INV_CAP, SLOT_COUNT } from '../../src/rpg/sim/content.ts'
import { createState, type State } from '../../src/rpg/sim/state.ts'
import { newGame } from '../../src/rpg/sim/game.ts'
import { grantItem } from '../../src/rpg/sim/loot.hot.ts'
import { loadArea } from '../../src/rpg/sim/world.hot.ts'
import { recomputeStats } from '../../src/rpg/sim/stats.hot.ts'
import { command, step } from '../../src/rpg/sim/step.hot.ts'
import { strings } from '../../src/rpg/ui/i18n.ts'
import { dialogLine, itemName, packIndices, readHud, readItem } from '../../src/rpg/ui/describe.ts'

const ROOT = new URL('../../', import.meta.url).pathname
const ENTRY = `
export { renderToStaticMarkup } from 'react-dom/server'
export { createElement, createRef } from 'react'
export { MemoryRouter } from 'react-router-dom'
export * from './src/rpg/ui/Overlays.tsx'
export * from './src/rpg/ui/Menu.tsx'
export { Rpg } from './src/pages/Rpg.tsx'
`

type Element = unknown
interface Ui {
  renderToStaticMarkup(element: Element): string
  createElement(type: unknown, props?: Record<string, unknown> | null, ...children: unknown[]): Element
  createRef(): { current: unknown }
  MemoryRouter: unknown
  [component: string]: unknown
}

let ui: Ui | null = null

async function loadUi(): Promise<Ui> {
  if (ui) return ui
  const out = await build({
    stdin: { contents: ENTRY, resolveDir: ROOT, loader: 'ts', sourcefile: 'ui-entry.ts' },
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    jsx: 'automatic',
    alias: { '@': join(ROOT, 'src') },
    loader: { '.css': 'empty' },
    define: { 'process.env.NODE_ENV': '"production"' },
    logLevel: 'silent',
    banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  })
  const file = join(mkdtempSync(join(tmpdir(), 'rpg-ui-')), 'ui.mjs')
  writeFileSync(file, out.outputFiles[0]!.text)
  ui = (await import(pathToFileURL(file).href)) as Ui
  return ui
}

function noop(): void {}

function render(u: Ui, name: string, props: Record<string, unknown>): string {
  const component = u[name]
  assert.ok(component, `component ${name} is exported`)
  const html = u.renderToStaticMarkup(u.createElement(u.MemoryRouter, null, u.createElement(component, props)))
  for (const bad of ['undefined', 'NaN', '[object Object]', 'Infinity']) assert.ok(!html.includes(bad), `${name} renders "${bad}": ${html.slice(0, 400)}`)
  return html
}

function has(html: string, ...texts: string[]): void {
  for (const text of texts) {
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
    assert.ok(html.includes(escaped), `expected "${text}" in ${html.slice(0, 600)}`)
  }
}

function midGame(nearForge: number): State {
  const s = createState()
  newGame(s, 7)
  while (s.phase === PHASE_DIALOG) step(s, command(CMD_ADVANCE, 0))
  s.chapter = CH_GALE
  s.level = 9
  s.skillPoints = 3
  s.gold = 1234
  s.ore = 56
  s.runes[ELEMENT_EMBER] = 2
  s.runes[ELEMENT_TIDE] = 1
  s.stancesUnlocked = 7
  s.shards = 7
  s.keyItems = 7
  s.melodies = (1 << MELODY_STABLE) | (1 << MELODY_ROADS) | (1 << MELODY_SEALS)
  s.waystones = (1 << AREA_BRENNHOLD) | (1 << AREA_VALDMERE) | (1 << AREA_BARROW)
  grantItem(s, ITEM_GREATSWORD, TIER_EPIC)
  grantItem(s, armorBase(SET_BARROWGUARD, SLOT_HELM), TIER_RARE)
  grantItem(s, armorBase(SET_TIDEWARDEN, SLOT_PLATE), TIER_LEGENDARY)
  s.invRune[2] = ELEMENT_STONE
  s.invLevel[2] = 3
  recomputeStats(s)
  s.nearForge = nearForge
  return s
}

const ref = (u: Ui) => u.createRef()

test('the title renders with and without a save, and with a broken save', async () => {
  const u = await loadUi()
  const base = { primaryRef: ref(u), coarsePointer: false, muted: false, heroName: 'Aldric', saveError: false, onNewGame: noop, onContinue: noop, onToggleSound: noop }
  const fresh = render(u, 'TitleOverlay', { ...base, canContinue: false })
  has(fresh, strings.title, strings.newGame, strings.controlsDesktop)
  assert.ok(!fresh.includes(`>${strings.continueGame}<`))
  has(render(u, 'TitleOverlay', { ...base, canContinue: true, coarsePointer: true }), strings.continueGame, strings.controlsTouch)
  has(render(u, 'TitleOverlay', { ...base, canContinue: false, saveError: true }), strings.saveBroken)
})

test('dialog renders a normal line from a real new game and the final choice', async () => {
  const u = await loadUi()
  const s = createState()
  newGame(s, 3)
  assert.equal(s.phase, PHASE_DIALOG)
  assert.equal(s.dialogScript, SCRIPT_INTRO)
  const line = dialogLine(strings, s.dialogScript, s.dialogLine, 'Wren', strings.keysDesktop)!
  const normal = render(u, 'StoryDialog', { primaryRef: ref(u), speaker: line.speaker, text: line.text, choice: false, onAdvance: noop, onChoose: noop })
  has(normal, line.text, strings.advance)
  const last = dialogLine(strings, SCRIPT_CHOICE, SCRIPT_LENGTH[SCRIPT_CHOICE]! - 1, 'Wren', strings.keysTouch)!
  const choice = render(u, 'StoryDialog', { primaryRef: ref(u), speaker: last.speaker, text: last.text, choice: true, onAdvance: noop, onChoose: noop })
  has(choice, last.text, strings.choice[0]!, strings.choice[1]!, strings.choiceHint[0]!)
  for (let script = 0; script < SCRIPT_LENGTH.length; script++) {
    for (let n = 0; n < SCRIPT_LENGTH[script]!; n++) {
      for (const keys of [strings.keysDesktop, strings.keysTouch]) {
        const text = dialogLine(strings, script, n, 'Wren', keys)!.text
        assert.ok(!/\{\w+\}/.test(text), `script ${script} line ${n} keeps a placeholder: ${text}`)
      }
    }
  }
})

test('the HUD text layer shows the goal, an engaged boss, and the forge prompt', async () => {
  const u = await loadUi()
  const s = midGame(0)
  has(render(u, 'HudText', { hud: readHud(s), coarsePointer: false, showPrompt: true }), strings.goal[s.goal]!)
  loadArea(s, AREA_BARROW, 0)
  let boss = -1
  for (let i = 0; i < MAX_ENEMIES; i++) if (s.eAlive[i] && s.eKind[i] === BOSS_BARROW_KING) boss = i
  assert.ok(boss >= 0)
  assert.equal(readHud(s).boss, -1, 'an idle boss far away shows no name')
  s.eState[boss] = AI_CHASE
  has(render(u, 'HudText', { hud: readHud(s), coarsePointer: false, showPrompt: true }), strings.enemyName[BOSS_BARROW_KING]!)
  const forge = { ...readHud(s), boss: -1, interact: OBJ_FORGE }
  has(render(u, 'HudText', { hud: forge, coarsePointer: false, showPrompt: true }), strings.interactKey, strings.tabs.forge)
  render(u, 'TouchControls', { hud: forge, renderer: null, handlers: { press: noop, release: noop, stance: noop } })
})

test('every menu tab renders a mid-game inventory with the forge near and away', async () => {
  const u = await loadUi()
  for (const near of [0, 1]) {
    const s = midGame(near)
    const props = { s, version: 1, renderer: null, onTab: noop, onClose: noop, send: noop, onHorn: noop }
    for (const tab of ['gear', 'skills', 'forge', 'horn']) {
      const html = render(u, 'MenuOverlay', { ...props, tab })
      has(html, strings.tabs.gear, strings.close)
      if (tab === 'forge' && near === 0) has(html, strings.forgeAway)
    }
    const sword = readItem(s, 0)!
    const great = readItem(s, 2)!
    assert.equal(sword.base, ITEM_SWORD)
    const gear = render(u, 'GearTab', { s, selected: 2, renderer: null, onSelect: noop, send: noop })
    has(gear, '1234', '56', itemName(strings, great), strings.keyItemName[0]!, strings.equip, strings.scrap)
    has(render(u, 'GearTab', { s, selected: 0, renderer: null, onSelect: noop, send: noop }), strings.unequip, strings.swordShield)
    const worn = Array.from(s.equipped).filter(index => index >= 0)
    const pack = packIndices(s)
    assert.ok(worn.length > 0, 'the test state wears gear')
    assert.equal(pack.length, INV_CAP - worn.length)
    for (const index of worn) assert.ok(!pack.includes(index), `equipped item ${index} must not show in the pack`)
    assert.equal(gear.split('class="rpg-slot"').length - 1, SLOT_COUNT + pack.length, 'four equipment slots plus the unequipped pack cells')
    has(render(u, 'SkillsTab', { s, send: noop }), `${strings.skillPoints}: 3`, strings.learn, strings.nodeName[0]!)
    const forge = render(u, 'ForgeTab', { s, selected: 2, renderer: null, onSelect: noop, send: noop })
    has(forge, strings.upgrade, strings.reforge, strings.socketFull)
    has(render(u, 'ForgeTab', { s, selected: 0, renderer: null, onSelect: noop, send: noop }), strings.reforgeCommon)
    has(render(u, 'HornTab', { s, onHorn: noop }), strings.melodyName[0]!, strings.melodyName[2]!, strings.areaName[AREA_BARROW]!)
  }
})

test('death and both endings render', async () => {
  const u = await loadUi()
  has(render(u, 'DeadOverlay', { primaryRef: ref(u), onRespawn: noop, onTitle: noop }), strings.dead, strings.respawn)
  for (const ending of [ENDING_REFORGE, ENDING_SHATTER]) {
    const html = render(u, 'EndedOverlay', { primaryRef: ref(u), stats: { ending, time: '1:02:03', level: 12 }, onNewGame: noop })
    has(html, strings.endingName[ending]!, '1:02:03', '12', strings.playAgain)
  }
  has(render(u, 'PauseOverlay', { primaryRef: ref(u), muted: true, onResume: noop, onToggleSound: noop, onTitle: noop }), strings.paused, strings.mute)
})

test('the whole page renders its title screen on the server with minimal globals', async () => {
  const u = await loadUi()
  const g = globalThis as Record<string, unknown>
  const saved = { window: g.window, document: g.document, localStorage: g.localStorage }
  g.window = { matchMedia: () => ({ matches: false }) }
  g.document = {}
  g.localStorage = undefined
  try {
    has(render(u, 'Rpg', {}), strings.title, strings.newGame)
  } finally {
    Object.assign(g, saved)
  }
})
