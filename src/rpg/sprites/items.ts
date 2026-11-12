import { outlined, pad, recolor, type Rows } from './paint.ts'

function icon(rows: Rows): string[] {
  return outlined(pad(rows, 1, 1, 16, 16))
}

export const iconSword = icon([
  '...........WW.',
  '..........WpW.',
  '.........WpW..',
  '........WpW...',
  '.......WpW....',
  '......WpW.....',
  '..A..WpW......',
  '..KAWpW.......',
  '...KAW........',
  '...dKA........',
  '..dd.KA.......',
  '.dd...........',
  'Ad............',
  '..............',
])

export const iconGreatsword = icon([
  '..........WWW.',
  '.........WppW.',
  '........WppW..',
  '.......WppW...',
  '......WppW....',
  '.....WppW.....',
  '.A..WppW......',
  '.KAWppW.......',
  '..KAAW........',
  '..dKAA........',
  '.dd..KA.......',
  'dd............',
  'A.............',
  '..............',
])

const helm = [
  '..............',
  '.....7777.....',
  '....732227....',
  '...73322217...',
  '..7332222217..',
  '..7322222217..',
  '..7322222217..',
  '..731000001...',
  '..7310000017..',
  '..7322222217..',
  '..7322112217..',
  '...72211227...',
  '....777777....',
  '..............',
]

const plate = [
  '..............',
  '..777....777..',
  '.73327777233..',
  '.7333222232227',
  '.7322222222217',
  '..73222222217.',
  '..73222222217.',
  '...7777777777.',
  '...7322222217.',
  '...7322222217.',
  '...7322222217.',
  '...7322222217.',
  '....77777777..',
  '..............',
]

const greaves = [
  '..............',
  '..7777..7777..',
  '..7332..7332..',
  '..7322..7322..',
  '..7322..7322..',
  '..7321..7321..',
  '..7777..7777..',
  '..7322..7322..',
  '..7322..7322..',
  '..7322..7322..',
  '.73222.73222..',
  '.77777.77777..',
  '..............',
  '..............',
]

export const SET_RAMPS: readonly string[] = ['mnoK', '@&hu', 'LMNF', 'klmT', 'XYWZ']

export const armorIcons: string[][] = []
for (const ramp of SET_RAMPS) {
  for (const template of [helm, plate, greaves]) armorIcons.push(icon(recolor(template, '1237', ramp)))
}

function element(rows: Rows): string[] {
  return outlined(pad(rows, 1, 1, rows[0]!.length + 2, rows.length + 2))
}

export const elementStone = element([
  '..hhh..',
  '.h&&&e.',
  'h&&@&ee',
  'h&@@@ee',
  'e&&@&ed',
  '.eeeed.',
  '..ddd..',
])

export const elementTide = element([
  '...P...',
  '..PO...',
  '.POON..',
  '.ONNNM.',
  'ONNNNM.',
  '.NNNMM.',
  '..MML..',
])

export const elementEmber = element([
  '...U...',
  '..UA.T.',
  '.TAAT..',
  '.TAUAT.',
  'TAUUATS',
  '.TAATS.',
  '..SSS..',
])

export const elementGale = element([
  '.ZZZZ..',
  'Z....Z.',
  '...YY.Z',
  '.ZY..Y.',
  'Z..Y.Y.',
  '.Z..Y..',
  '..YYX..',
])
