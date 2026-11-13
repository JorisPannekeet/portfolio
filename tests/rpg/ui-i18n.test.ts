import { test } from 'node:test'
import assert from 'node:assert/strict'
import { strings } from '../../src/rpg/ui/i18n.ts'
import {
  areaTitle,
  bossTitle,
  describeAffix,
  describeItem,
  describeNode,
  describeSet,
  dialogLine,
  forgeOptions,
  formatClock,
  nodeStatus,
  powerCompare,
  readHud,
  toastFor,
} from '../../src/rpg/ui/describe.ts'
import { createState } from '../../src/rpg/sim/state.ts'
import {
  AFFIX_COUNT,
  AI_CHASE,
  AFFIX_PARRY,
  AREA_BARROW,
  AREA_COUNT,
  AREA_SHRINE,
  AREA_VALDMERE,
  BOSS_VAREK,
  CMD_SOCKET,
  ENEMY_FOOTMAN,
  EV_AREA,
  EV_FORGE,
  EV_HIT,
  EV_ITEM_GAIN,
  EV_KEY_ITEM,
  EV_LEARN,
  EV_LEVEL_UP,
  EV_SAVE,
  EV_SHARD,
  EV_VIGIL,
  KEY_GRAPPLE,
  KEY_LONGBOW,
  KEY_WARHAMMER,
  OBJ_FORGE,
  CMD_UPGRADE,
  ELEMENT_COUNT,
  ENEMY_BOSS_FIRST,
  ENEMY_KIND_COUNT,
  GOAL_COUNT,
  ITEM_BASE_COUNT,
  ITEM_MAX_LEVEL,
  MELODY_COUNT,
  NODE_COUNT,
  NODE_STEEL_EDGE,
  NODE_STEEL_POISE,
  NODE_STONE_AFTERSHOCK,
  NODE_STONE_BULWARK,
  NODE_TIDE_FLOW,
  NODE_VALUE,
  OBJ_KIND_COUNT,
  OBJ_NONE,
  OBJ_TRIGGER,
  SCRIPT_COUNT,
  SCRIPT_ENDS_IN_CHOICE,
  SCRIPT_LENGTH,
  SET_COUNT,
  SET_NONE,
  SET_VALUE,
  SHRINE_COUNT,
  SLOT_COUNT,
  TIER_COUNT,
  TREE_COUNT,
  VAREK_PHASE_COLOSSUS,
  ITEM_GREATSWORD,
  ITEM_SWORD,
  SLOT_WEAPON,
  forgeGold,
  forgeOre,
  itemPower,
} from '../../src/rpg/sim/content.ts'

const nonEmpty = (value: string | undefined, label: string) => assert.ok(typeof value === 'string' && value.trim().length > 0, label)
const clean = (text: string, label: string) => assert.ok(!/undefined|NaN|\{\w*\}/.test(text), `${label}: ${text}`)

test('every script has exactly SCRIPT_LENGTH lines with a speaker and text', () => {
  assert.equal(strings.scripts.length, SCRIPT_COUNT)
  for (let script = 0; script < SCRIPT_COUNT; script++) {
    assert.equal(strings.scripts[script]!.length, SCRIPT_LENGTH[script], `script ${script}`)
    for (let line = 0; line < SCRIPT_LENGTH[script]!; line++) {
      for (const keys of [strings.keysDesktop, strings.keysTouch]) {
        const formatted = dialogLine(strings, script, line, 'Wren', keys)
        assert.ok(formatted, `script ${script} line ${line}`)
        nonEmpty(formatted.speaker, `speaker ${script}:${line}`)
        nonEmpty(formatted.text, `text ${script}:${line}`)
        clean(formatted.speaker + formatted.text, `${script}:${line}`)
        assert.ok(formatted.text.length <= 140, `line ${script}:${line} is ${formatted.text.length} chars`)
      }
    }
  }
  assert.equal(dialogLine(strings, 0, SCRIPT_LENGTH[0]!, 'Wren', strings.keysDesktop), null)
})

test('the hero name replaces every {name}', () => {
  const lines = strings.scripts.flatMap((lines, script) => lines.map((_, line) => dialogLine(strings, script, line, 'Wren', strings.keysDesktop)!))
  assert.ok(lines.some(line => line.speaker === 'Wren'))
  assert.ok(lines.some(line => line.text.includes('Wren')))
})

test('the choice script ends in two labelled choices', () => {
  const choiceScripts = SCRIPT_ENDS_IN_CHOICE.filter(flag => flag === 1).length
  assert.equal(choiceScripts, 1)
  assert.equal(strings.choice.length, 2)
  assert.equal(strings.choiceHint.length, 2)
})

test('every id with a name has one', () => {
  for (let area = 0; area < AREA_COUNT; area++) nonEmpty(strings.areaName[area], `area ${area}`)
  for (let shrine = 0; shrine < SHRINE_COUNT; shrine++) nonEmpty(strings.shrineName[shrine], `shrine ${shrine}`)
  for (let kind = 0; kind < ENEMY_KIND_COUNT; kind++) nonEmpty(strings.enemyName[kind], `enemy ${kind}`)
  for (let kind = ENEMY_BOSS_FIRST; kind < ENEMY_KIND_COUNT; kind++) {
    for (let phase = 0; phase <= VAREK_PHASE_COLOSSUS; phase++) nonEmpty(bossTitle(strings, kind, phase), `boss ${kind} ${phase}`)
  }
  assert.notEqual(bossTitle(strings, BOSS_VAREK, 0), bossTitle(strings, BOSS_VAREK, VAREK_PHASE_COLOSSUS))
  for (let goal = 0; goal < GOAL_COUNT; goal++) nonEmpty(strings.goal[goal], `goal ${goal}`)
  for (let melody = 0; melody < MELODY_COUNT; melody++) {
    nonEmpty(strings.melodyName[melody], `melody ${melody}`)
    nonEmpty(strings.melodyEffect[melody], `melody effect ${melody}`)
  }
  for (let key = 0; key < 3; key++) {
    nonEmpty(strings.keyItemName[key], `key item ${key}`)
    nonEmpty(strings.keyItemUse[key], `key item use ${key}`)
  }
  for (let kind = 0; kind < OBJ_KIND_COUNT; kind++) {
    if (kind === OBJ_NONE || kind === OBJ_TRIGGER) continue
    nonEmpty(strings.objPrompt[kind], `object ${kind}`)
  }
  for (let element = 0; element < ELEMENT_COUNT; element++) nonEmpty(strings.elementName[element], `element ${element}`)
  for (let tree = 0; tree < TREE_COUNT; tree++) nonEmpty(strings.treeName[tree], `tree ${tree}`)
  for (let slot = 0; slot < SLOT_COUNT; slot++) nonEmpty(strings.slotName[slot], `slot ${slot}`)
  for (let set = SET_NONE + 1; set < SET_COUNT; set++) nonEmpty(strings.setName[set], `set ${set}`)
  for (let node = 0; node < NODE_COUNT; node++) nonEmpty(strings.nodeName[node], `node ${node}`)
  assert.equal(strings.affixEffect.length, AFFIX_COUNT)
  assert.equal(strings.nodeEffect.length, NODE_COUNT)
})

test('area titles mark corrupted dungeons and name shrines', () => {
  assert.equal(areaTitle(strings, AREA_BARROW, 1), `${strings.toastCorrupted} ${strings.areaName[AREA_BARROW]}`)
  assert.equal(areaTitle(strings, AREA_BARROW, 0), strings.areaName[AREA_BARROW])
  assert.equal(areaTitle(strings, AREA_VALDMERE, 1), strings.areaName[AREA_VALDMERE])
  assert.equal(areaTitle(strings, AREA_SHRINE, 2), strings.shrineName[2])
})

const effectFirst = /^[+-]\d/

test('every item base, tier and level describes without holes', () => {
  for (let base = 0; base < ITEM_BASE_COUNT; base++) {
    for (let tier = 0; tier < TIER_COUNT; tier++) {
      for (let level = 0; level <= ITEM_MAX_LEVEL; level++) {
        const item = describeItem(strings, { base, tier, level, rune: tier % ELEMENT_COUNT, affixes: [tier % AFFIX_COUNT, AFFIX_PARRY], values: [7, 3] })
        assert.match(item.power, /^\+\d+ (attack|armor)$/)
        for (const line of item.lines) assert.ok(effectFirst.test(line), line)
        for (const text of [item.name, item.tier, item.slot, item.power, ...item.lines]) {
          nonEmpty(text, `item ${base}/${tier}/${level}`)
          clean(text, `item ${base}/${tier}/${level}`)
        }
        clean(item.handling + item.set + item.setBonus, `item ${base}`)
      }
    }
  }
})

const NON_NUMERIC_EXCEPTIONS: readonly string[] = []

test('every node, set and affix states a signed number first', () => {
  const texts = [
    ...Array.from({ length: NODE_COUNT }, (_, node) => describeNode(strings, node)),
    ...Array.from({ length: SET_COUNT - 1 }, (_, k) => describeSet(strings, k + 1)),
    ...Array.from({ length: AFFIX_COUNT }, (_, affix) => describeAffix(strings, affix, 12)),
  ]
  for (const text of texts) {
    clean(text, 'effect')
    assert.ok(effectFirst.test(text) || NON_NUMERIC_EXCEPTIONS.includes(text), text)
  }
})

test('node and set numbers come from the shared tables', () => {
  assert.equal(describeNode(strings, NODE_STONE_BULWARK), `-${NODE_VALUE[NODE_STONE_BULWARK]}% guard stamina cost`)
  assert.equal(describeNode(strings, NODE_STONE_AFTERSHOCK), `+${NODE_VALUE[NODE_STONE_AFTERSHOCK]}% ground-slam radius`)
  assert.equal(describeNode(strings, NODE_STEEL_EDGE), `+${NODE_VALUE[NODE_STEEL_EDGE]}% attack`)
  assert.equal(describeNode(strings, NODE_STEEL_POISE), `+${NODE_VALUE[NODE_STEEL_POISE]} max stamina`)
  assert.equal(describeNode(strings, NODE_TIDE_FLOW), `+${Math.round((NODE_VALUE[NODE_TIDE_FLOW]! * 1000) / 60)} ms parry window`)
  assert.equal(describeSet(strings, 2), `+${SET_VALUE[2]} HP per parry`)
})

test('node status explains why a node is locked', () => {
  const s = createState()
  assert.equal(nodeStatus(strings, s, NODE_STONE_BULWARK).state, 'locked')
  assert.match(nodeStatus(strings, s, NODE_STONE_BULWARK).reason, /Stone/)
  assert.equal(nodeStatus(strings, s, NODE_STEEL_EDGE).reason, strings.lockedPoints)
  s.skillPoints = 1
  assert.equal(nodeStatus(strings, s, NODE_STEEL_EDGE).state, 'available')
  assert.match(nodeStatus(strings, s, NODE_STEEL_POISE).reason, /Keen Edge/)
  s.stancesUnlocked = 1
  assert.equal(nodeStatus(strings, s, NODE_STONE_BULWARK).state, 'available')
  s.nodes[NODE_STONE_BULWARK] = 1
  assert.equal(nodeStatus(strings, s, NODE_STONE_BULWARK).state, 'learned')
})

test('forge options show cost, before and after, and refuse what you cannot afford', () => {
  const s = createState()
  const item = { base: 0, tier: 1, level: 2, rune: -1, affixes: [], values: [] }
  s.runes[2] = 1
  let options = forgeOptions(strings, s, item)
  assert.deepEqual(options.map(o => o.opcode), [CMD_UPGRADE, 7, CMD_SOCKET])
  assert.ok(options.every(o => !o.enabled), 'away from the forge and broke')
  const upgrade = options[0]!
  assert.match(upgrade.before, /^\+\d+ attack$/)
  assert.match(upgrade.after, /^\+\d+ attack$/)
  assert.notEqual(upgrade.before, upgrade.after)
  assert.equal(upgrade.gold, forgeGold(CMD_UPGRADE, 1, 2))
  assert.equal(upgrade.ore, forgeOre(CMD_UPGRADE, 1, 2))
  assert.equal(upgrade.note, '')
  assert.equal(options[2]!.note, '1 held')
  for (const option of options) clean(option.label + option.note + option.before + option.after, 'forge')
  s.nearForge = 1
  s.gold = 100000
  s.ore = 1000
  options = forgeOptions(strings, s, item)
  assert.ok(options.every(o => o.enabled))
  options = forgeOptions(strings, s, { ...item, level: ITEM_MAX_LEVEL })
  assert.equal(options[0]!.enabled, false)
  assert.equal(options[0]!.gold, 0, 'a maxed item shows no price')
  assert.match(options[0]!.note, new RegExp(`\\+${ITEM_MAX_LEVEL}`))
  options = forgeOptions(strings, s, { ...item, tier: 0 })
  assert.equal(options[1]!.enabled, false, 'the sim refuses to reforge common gear')
  options = forgeOptions(strings, s, { ...item, rune: 1 })
  assert.equal(options[2]!.enabled, false, 'the sim refuses to socket a filled item')
})

test('a pack item compares its power with the piece worn in its slot, number first', () => {
  const s = createState()
  assert.equal(powerCompare(strings, s, 0), null, 'an empty cell has nothing to compare')
  s.invBase[0] = ITEM_SWORD
  s.invTier[0] = 0
  s.invBase[1] = ITEM_GREATSWORD
  s.invTier[1] = 3
  assert.equal(powerCompare(strings, s, 1), null, 'nothing worn in the slot')
  s.equipped[SLOT_WEAPON] = 0
  const worn = itemPower(ITEM_SWORD, 0, 0)
  const better = itemPower(ITEM_GREATSWORD, 3, 0)
  assert.deepEqual(powerCompare(strings, s, 1), { text: `+${worn} → +${better} attack`, delta: better - worn })
  assert.ok(effectFirst.test(powerCompare(strings, s, 1)!.text))
  assert.equal(powerCompare(strings, s, 0), null, 'the worn piece does not compare with itself')
})

test('play time formats as mm:ss and h:mm:ss', () => {
  assert.equal(formatClock(0), '00:00')
  assert.equal(formatClock(61 * 60), '01:01')
  assert.equal(formatClock(3661 * 60), '1:01:01')
})

test('every forwarded event has a toast with no holes, and success or noise events have none', () => {
  const s = createState()
  s.invBase[3] = 5
  s.invTier[3] = 4
  const cases: (readonly [number, number, number])[] = [
    [EV_AREA, AREA_BARROW, 1], [EV_AREA, AREA_SHRINE, 1], [EV_ITEM_GAIN, 3, 4], [EV_LEVEL_UP, 7, 0],
    [EV_KEY_ITEM, KEY_WARHAMMER, 0], [EV_KEY_ITEM, KEY_GRAPPLE, 0], [EV_KEY_ITEM, KEY_LONGBOW, 0], [EV_KEY_ITEM, 0, 29],
    [EV_SHARD, 3, 0], [EV_SAVE, 0, 0], [EV_LEARN, NODE_STEEL_EDGE, 0], [EV_FORGE, CMD_UPGRADE, 0], [EV_VIGIL, 0, 0],
  ]
  for (const [type, a, b] of cases) {
    const toast = toastFor(strings, s, type, a, b)
    assert.ok(toast, `event ${type}`)
    nonEmpty(toast.label, `label ${type}`)
    nonEmpty(toast.text, `text ${type}`)
    clean(toast.label + toast.text, `toast ${type}`)
  }
  assert.equal(toastFor(strings, s, EV_ITEM_GAIN, 3, 4)?.tier, 4)
  assert.equal(toastFor(strings, s, EV_FORGE, CMD_UPGRADE, 1), null)
  assert.equal(toastFor(strings, s, EV_HIT, 0, 0), null)
})

test('the HUD reader finds the live boss and the interact target kind', () => {
  const s = createState()
  assert.equal(readHud(s).boss, -1)
  assert.equal(readHud(s).interact, -1)
  s.eAlive[0] = 1
  s.eKind[0] = ENEMY_FOOTMAN
  s.eAlive[5] = 1
  s.eKind[5] = BOSS_VAREK
  s.bossPhase = 2
  assert.equal(readHud(s).boss, -1, 'a boss that has not noticed the player shows no name')
  s.eState[5] = AI_CHASE
  s.objKind[9] = OBJ_FORGE
  s.interactObj = 9
  s.keyItems = KEY_LONGBOW
  const hud = readHud(s)
  assert.equal(hud.boss, BOSS_VAREK)
  assert.equal(hud.bossPhase, 2)
  assert.equal(hud.interact, OBJ_FORGE)
  assert.equal(hud.longbow, true)
})
