import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  PASSIVE_STEP,
  PIERCES_EVERYTHING,
  WEAPON_STAT_MEANING,
  describeChoice,
  formatNumber,
  passiveLines,
  weaponChangeLines,
  weaponStartLines,
} from '../src/game/ui/cards.ts'
import { strings } from '../src/game/ui/i18n.ts'
import {
  CHOICE_EVOLVE,
  CHOICE_PASSIVE,
  CHOICE_REPAIR,
  EVOLVED,
  PASSIVE_COUNT,
  PASSIVE_DAMAGE_PER_LEVEL,
  PASSIVE_HP_PER_LEVEL,
  PASSIVE_MAX_LEVEL,
  PASSIVE_REGEN_PER_LEVEL,
  REPAIR_HEAL,
  TICK_HZ,
  WEAPONS,
  WEAPON_COUNT,
  WEAPON_MAX_LEVEL,
} from '../src/game/sim/content.ts'

function fill(template: string, value: number): string {
  return template.replace('{0}', formatNumber(value))
}

function signed(template: string, delta: number): string {
  return (delta > 0 ? '+' : '') + fill(template, delta)
}

function expectedChanges(w: number, from: number, to: number): string[] {
  const def = WEAPONS[w]!
  const meaning = WEAPON_STAT_MEANING[w]!
  const permanent = meaning.duration === 'uptime' && def.duration[to] === 0
  const out: string[] = []
  if (permanent && def.duration[from] !== 0) out.push(strings.statNeverDocks)
  if (def.damage[to] !== def.damage[from]) out.push(signed(strings.statDamage, def.damage[to]! - def.damage[from]!))
  const amount = def.amount[to]! - def.amount[from]!
  if (meaning.count === 'slash' && def.amount[from] === 1 && amount > 0) {
    out.push(strings.statBothSides)
  } else if (meaning.count && amount !== 0) {
    const forms = strings.statCount[meaning.count]
    out.push('+' + fill(amount === 1 ? forms[0] : forms[1], amount))
  }
  if (!permanent && def.cooldown[to] !== def.cooldown[from]) {
    const percent = Math.round((1 - def.cooldown[to]! / def.cooldown[from]!) * 100)
    out.push(fill(strings.statFaster[meaning.cadence], percent))
  }
  if (meaning.area && def.area[to] !== def.area[from]) out.push(signed(strings.statArea[meaning.area], def.area[to]! - def.area[from]!))
  if (meaning.pierce && def.pierce[to] !== def.pierce[from]) {
    out.push(def.pierce[to]! >= PIERCES_EVERYTHING ? strings.statPiercesAll : signed(strings.statPierce, def.pierce[to]! - def.pierce[from]!))
  }
  const duration = def.duration[to]! - def.duration[from]!
  if (meaning.duration === 'range' && duration !== 0) out.push(signed(strings.statRange, duration * def.speed))
  if (meaning.duration === 'uptime' && !permanent && duration !== 0) out.push(signed(strings.statUptime, duration / TICK_HZ))
  return out
}

function steps(): [number, number, number][] {
  const out: [number, number, number][] = []
  for (let w = 0; w < WEAPON_COUNT; w++) {
    for (let level = 1; level < WEAPON_MAX_LEVEL; level++) out.push([w, level - 1, level])
    out.push([w, WEAPON_MAX_LEVEL - 1, EVOLVED])
  }
  return out
}

test('every weapon level-up and evolution lists exactly the stats that change, effect first', () => {
  for (const [w, from, to] of steps()) {
    const lines = weaponChangeLines(w, from, to, strings)
    assert.deepEqual(lines, expectedChanges(w, from, to), `weapon ${w} tier ${from} -> ${to}`)
    assert.ok(lines.length > 0, `weapon ${w} tier ${from} -> ${to} has no visible change`)
    for (const line of lines) assert.match(line, /^(\+\d|\d+% faster|Never docks|Pierces everything|Cuts both sides)/, line)
  }
})

test('an unchanged stat never gets a line', () => {
  const rifleDuration = WEAPONS[0]!.duration
  assert.ok(rifleDuration.every(value => value === rifleDuration[0]))
  for (const [w, from, to] of steps()) {
    const def = WEAPONS[w]!
    const lines = weaponChangeLines(w, from, to, strings).join('|')
    if (def.damage[to] === def.damage[from]) assert.doesNotMatch(lines, / damage/)
    if (def.cooldown[to] === def.cooldown[from]) assert.doesNotMatch(lines, /faster/)
    const area = WEAPON_STAT_MEANING[w]!.area
    if (area && def.area[to] === def.area[from]) assert.ok(!lines.includes(strings.statArea[area].replace('{0} ', '')))
  }
})

test('columns a weapon ignores are never shown', () => {
  for (let w = 0; w < WEAPON_COUNT; w++) {
    const meaning = WEAPON_STAT_MEANING[w]!
    const all = [...weaponStartLines(w, strings), ...steps().filter(([x]) => x === w).flatMap(([, from, to]) => weaponChangeLines(w, from, to, strings))].join('|')
    if (!meaning.pierce) assert.doesNotMatch(all, /pierce/i, `weapon ${w}`)
    if (meaning.duration !== 'range') assert.doesNotMatch(all, /range/, `weapon ${w}`)
    if (meaning.duration !== 'uptime') assert.doesNotMatch(all, /uptime|docks/, `weapon ${w}`)
  }
  assert.equal(WEAPON_STAT_MEANING[5]!.count, null)
})

test('cooldown shows as percent faster and evolved drones never dock', () => {
  assert.ok(weaponChangeLines(0, 0, 1, strings).includes('5% faster fire'))
  assert.deepEqual(weaponChangeLines(4, WEAPON_MAX_LEVEL - 1, EVOLVED, strings)[0], strings.statNeverDocks)
  assert.ok(weaponChangeLines(0, WEAPON_MAX_LEVEL - 1, EVOLVED, strings).includes(strings.statPiercesAll))
})

test('a new weapon starts with its level 1 numbers', () => {
  for (let w = 0; w < WEAPON_COUNT; w++) {
    const lines = weaponStartLines(w, strings)
    assert.equal(lines[0], `${WEAPONS[w]!.damage[0]} damage`)
    for (const line of lines) assert.doesNotMatch(line, /^[+-]/, line)
    const card = describeChoice(w, new Uint8Array(WEAPON_COUNT), new Uint8Array(PASSIVE_COUNT), strings)
    assert.equal(card.blurb, strings.weaponDesc[w])
    assert.deepEqual(card.lines, lines)
  }
})

test('an evolution card has its blurb and the level 6 to evolved changes', () => {
  for (let w = 0; w < WEAPON_COUNT; w++) {
    const card = describeChoice(CHOICE_EVOLVE + w, new Uint8Array(WEAPON_COUNT).fill(6), new Uint8Array(PASSIVE_COUNT), strings)
    assert.equal(card.evolution, true)
    assert.equal(card.blurb, strings.evolvedDesc[w])
    assert.deepEqual(card.lines, weaponChangeLines(w, WEAPON_MAX_LEVEL - 1, EVOLVED, strings))
  }
})

test('every passive at every level shows its step, then the running total', () => {
  for (let p = 0; p < PASSIVE_COUNT; p++) {
    const step = PASSIVE_STEP[p]!
    for (let owned = 0; owned < PASSIVE_MAX_LEVEL[p]!; owned++) {
      const passiveLevel = new Uint8Array(PASSIVE_COUNT)
      passiveLevel[p] = owned
      const card = describeChoice(CHOICE_PASSIVE + p, new Uint8Array(WEAPON_COUNT), passiveLevel, strings)
      const effects = strings.passiveEffect[p]!
      assert.equal(card.lines.length, effects.length + 1)
      effects.forEach((template, index) => assert.equal(card.lines[index], template.replace(`{${index}}`, formatNumber(step[index]!))))
      const total = card.lines.at(-1)!
      assert.match(total, /^Total [+-]/)
      assert.ok(total.includes(formatNumber(step[0]! * (owned + 1))), `${total} for passive ${p} level ${owned + 1}`)
    }
  }
})

test('passive totals match the per-level constants', () => {
  assert.deepEqual(passiveLines(0, 3, strings), [`+${PASSIVE_DAMAGE_PER_LEVEL * 100}% weapon damage`, 'Total +30%'])
  assert.deepEqual(passiveLines(2, 3, strings), ['-7% weapon cooldown', 'Total -21%'])
  assert.deepEqual(passiveLines(4, 1, strings), ['+8% experience per energy cell', 'Total +8%'])
  assert.deepEqual(passiveLines(5, 3, strings), [
    `+${PASSIVE_HP_PER_LEVEL} max armor`,
    `+${PASSIVE_REGEN_PER_LEVEL} armor per second`,
    `Total +${PASSIVE_HP_PER_LEVEL * 3} armor, +0.3/s`,
  ])
})

test('repair states its heal from the content table', () => {
  const card = describeChoice(CHOICE_REPAIR, new Uint8Array(WEAPON_COUNT), new Uint8Array(PASSIVE_COUNT), strings)
  assert.equal(card.lines[0]!.startsWith(`+${REPAIR_HEAL} armor`), true)
})

test('copy carries no number that the tables derive', () => {
  for (const line of [...strings.weaponDesc, ...strings.evolvedDesc]) assert.doesNotMatch(line, /\d/, line)
})
