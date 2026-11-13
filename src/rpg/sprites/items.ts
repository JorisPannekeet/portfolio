import { mirror, outlined, pad, recolor, type Rows } from './paint.ts'
import { grid, put, type Grid } from './rig.ts'

export const ICON_SIZE = 24
const INNER = ICON_SIZE - 2

function icon(rows: Rows): string[] {
  return outlined(pad(rows, 1, 1, ICON_SIZE, ICON_SIZE))
}

function bilateral(half: Rows): string[] {
  const right = recolor(mirror(half), '4321', '3211')
  return half.map((row, y) => row + right[y]!)
}

function blade(width: number, length: number, guard: number): string[] {
  const g: Grid = grid(INNER, INNER)
  const x0 = 3
  const y0 = INNER - 4
  const at = (t: number, side: number, key: string) => put(g, x0 + t + (side > 0 ? side : 0), y0 - t + (side < 0 ? side : 0), key)
  put(g, x0 - 2, y0 + 2, 'K')
  put(g, x0 - 1, y0 + 1, 'U')
  put(g, x0 - 2, y0 + 1, 'A')
  put(g, x0 - 1, y0 + 2, 'A')
  for (let t = 0; t < 3; t++) {
    at(t, 0, t & 1 ? 'c' : 'e')
    at(t, 1, 'b')
  }
  for (let k = -guard; k <= guard; k++) put(g, x0 + 3 + k, y0 - 3 + k, k === 0 ? 'U' : Math.abs(k) === guard ? 'K' : 'A')
  for (let t = 4; t <= length; t++) {
    const tip = t === length
    at(t, 0, tip ? 'W' : width > 2 ? 'n' : 'p')
    if (tip) continue
    at(t, -1, 'q')
    at(t, 1, 'o')
    if (width > 2) {
      at(t, -2, t > length - 2 ? '.' : 'W')
      at(t, 2, t > length - 2 ? '.' : 'n')
    }
  }
  return g.map(row => row.join(''))
}

export const iconSword = icon(blade(2, 16, 2))
export const iconGreatsword = icon(blade(3, 18, 3))

const helmHalf = [
  '...........',
  '.........78',
  '......3444.',
  '.....34444.',
  '....344444.',
  '...3444333.',
  '...3443333.',
  '..87888888.',
  '..3443333..',
  '..3430000..',
  '..34333333.',
  '..343300k0.',
  '..34333333.',
  '..34333339.',
  '..34333333.',
  '...7888888.',
  '....22222..',
]

const plateHalf = [
  '...........',
  '......78888',
  '..344447444',
  '.3444444744',
  '34444443744',
  '3444443.344',
  '3443.3.3444',
  '.33..334444',
  '.....344444',
  '.....344444',
  '.....344443',
  '.....344443',
  '.....344433',
  '.....788888',
  '.....343343',
  '.....343343',
  '.....788788',
  '......33.33',
]

const greaveHalf = [
  '...........',
  '...78887...',
  '...34443...',
  '...34443...',
  '...34443...',
  '...34432...',
  '...78887...',
  '..3449443..',
  '...34432...',
  '...34443...',
  '...34443...',
  '...34432...',
  '...34432...',
  '...78887...',
  '..3444432..',
  '.344444432.',
  '.222222222.',
]

const TEMPLATES = [bilateral(helmHalf), bilateral(plateHalf), bilateral(greaveHalf)]

function overlay(rows: Rows, top: Rows, y: number): string[] {
  return rows.map((row, j) => {
    const over = top[j - y]
    if (!over) return row
    let next = ''
    for (let x = 0; x < row.length; x++) next += over[x] && over[x] !== '.' ? over[x]! : row[x]!
    return next
  })
}

function scales(rows: Rows): string[] {
  return rows.map((row, y) => [...row].map((key, x) => ((key === '4' || key === '3') && (x + (y % 2) * 2) % 4 === 0 ? '2' : key)).join(''))
}

interface ArmorSet {
  ramp: string
  helm: Rows
  plate: Rows
  greave: Rows
  scaled: boolean
}

const blankRow = '.'.repeat(22)

export const ARMOR_SETS: readonly ArmorSet[] = [
  { ramp: 'mnopdeA', helm: [], plate: [], greave: [], scaled: false },
  { ramp: 'lm@&KAU', helm: ['......8..8..8.........', '......78.78.78........'], plate: [blankRow, blankRow, blankRow, '...8..............8...', blankRow, blankRow, blankRow, blankRow, '......8........8......', blankRow, blankRow, '......8........8......'], greave: [], scaled: false },
  { ramp: 'JLMNXYP', helm: [], plate: [], greave: [], scaled: true },
  { ramp: 'klmnRTA', helm: ['..k..............k....', '..lk............kl....', '...lk..........kl.....', '....l..........l......'], plate: [blankRow, blankRow, blankRow, blankRow, blankRow, blankRow, blankRow, '............9.........', '...........9..........', '..........99..........', '..........9...........', '.........9............'], greave: [], scaled: false },
  { ramp: 'opqWXYZ', helm: [blankRow, blankRow, blankRow, 'W..................W..', 'qW................Wq..', '.qW..............Wq...', '..q..............q....'], plate: [], greave: [], scaled: false },
]

export const armorIcons: string[][] = []
for (const set of ARMOR_SETS) {
  const extras = [set.helm, set.plate, set.greave]
  TEMPLATES.forEach((template, n) => {
    const base = set.scaled && n > 0 ? scales(template) : template
    armorIcons.push(icon(recolor(overlay(base, extras[n]!, 0), '1234789', set.ramp)))
  })
}

function element(rows: Rows): string[] {
  return outlined(pad(rows, 1, 1, rows[0]!.length + 2, rows.length + 2))
}

export const elementStone = element([
  '....hhh...',
  '..hh&&&e..',
  '.h&&&@&ee.',
  '.h&&@@@&e.',
  'h&&@@d@&ed',
  'h&@@@@@&ed',
  'e&&@d@@&ed',
  '.e&&@@&ed.',
  '..eeeeedd.',
  '...dddd...',
])

export const elementTide = element([
  '....P.....',
  '...PO.....',
  '..POON....',
  '..OONNM...',
  '.ONWNNM...',
  'ONPNNNNM..',
  'ONNNNNMM..',
  '.NNNNMML..',
  '..MMMLL...',
  '...LLL....',
])

export const elementEmber = element([
  '....U.....',
  '...UA..T..',
  '..TAA.TA..',
  '..TAUATA..',
  '.TAUUAAT..',
  'TAUWUUATS.',
  'TAUWWUATS.',
  '.TAUUATS..',
  '..SSSSS...',
  '...RRR....',
])

export const elementGale = element([
  '..ZZZZZ...',
  '.Z.....Z..',
  '.....YY.Z.',
  '..ZYY..Y..',
  '.Z..Y..Y..',
  'Z..Y.ZY...',
  '...Y......',
  '.Z..YYYX..',
  '..ZZ......',
  '..........',
])

const pipStone = element([
  '..hhh..',
  '.h&&&e.',
  'h&&@&ee',
  'h&@@@ee',
  'e&&@&ed',
  '.eeeed.',
  '..ddd..',
])

const pipTide = element([
  '...P...',
  '..PO...',
  '.POON..',
  '.ONNNM.',
  'ONNNNM.',
  '.NNNMM.',
  '..MML..',
])

const pipEmber = element([
  '...U...',
  '..UA.T.',
  '.TAAT..',
  '.TAUAT.',
  'TAUUATS',
  '.TAATS.',
  '..SSS..',
])

const pipGale = element([
  '.ZZZZ..',
  'Z....Z.',
  '...YY.Z',
  '.ZY..Y.',
  'Z..Y.Y.',
  '.Z..Y..',
  '..YYX..',
])

export const elementPips = [pipStone, pipTide, pipEmber, pipGale]
export const elementIcons = [elementStone, elementTide, elementEmber, elementGale]
