import { outlined, pad, stack, type Rows } from './paint.ts'

function box(rows: Rows): string[] {
  return outlined(pad(rows, 1, 1, rows[0]!.length + 2, rows.length + 2))
}

const footHead = [
  '....EEEE.....',
  '...EFFFFE....',
  '..DEEEEEED...',
  '....Diiii....',
  '....Dii0i....',
  '....Diiii....',
  '.....jjj.....',
]
const footBody = [
  '....mRRRm....',
  '...mmRRRRm...',
  '...mmRrRRiop.',
  '....bbbAb..p.',
  '....RRrRR..p.',
]
const footBodyWind = [
  '.p..mRRRm....',
  '.po.mRRRRm...',
  '..iimRrRRm...',
  '....bbbAb....',
  '....RRrRR....',
]
const footLegs = [
  '....mmmm.....',
  '....mm.mm....',
  '....mm.mm....',
  '...bbb.bbb...',
]
const footLegsStep = [
  '....mmmm.....',
  '...mm..mm....',
  '..mm....mm...',
  '.bbb....bbb..',
]

export const footman = [
  box(stack(footHead, footBody, footLegs)),
  box(stack(footHead, footBody, footLegsStep)),
  box(stack(footHead, footBodyWind, footLegsStep)),
]

const archerHead = [
  '....tttt.....',
  '...tuuuut....',
  '..tuuuuuut...',
  '..tuuiiii....',
  '..tuii0ii....',
  '...uiiiii....',
  '....tjjj.....',
]
const archerBody = [
  '....uvvvu.e..',
  '...uvvvvu.e..',
  '...ucvvviie..',
  '....bbbAb.e..',
  '....uvvvu.e..',
]
const archerBodyDraw = [
  '....uvvvu..e.',
  '...uvvvvu...e',
  '...uiiWWWWWWe',
  '....bbbAb...e',
  '....uvvvu..e.',
]
const archerLegs = [
  '....dddd.....',
  '....dd.dd....',
  '....dd.dd....',
  '...ccc.ccc...',
]
const archerLegsStep = [
  '....dddd.....',
  '...dd..dd....',
  '..dd....dd...',
  '.ccc....ccc..',
]

export const archer = [
  box(stack(archerHead, archerBody, archerLegs)),
  box(stack(archerHead, archerBody, archerLegsStep)),
  box(stack(archerHead, archerBodyDraw, archerLegs)),
]

const knightHead = [
  '......SS.......',
  '.....SSR.......',
  '....FFFFF......',
  '...FppppFE.....',
  '...FpEEEEE.....',
  '...Fp0E0EE.....',
  '...FpppppE.....',
  '....EEEEE......',
]
const knightBody = [
  '..FFFpppFF.F...',
  '.FppFpppppEF...',
  '.FpEEppppEEF...',
  '.EEEDRRRRE.F...',
  '..EEDRRrRE.F...',
  '...DDDAADiAi...',
  '...ERRrRRE.A...',
]
const knightBodyWind = [
  '.F.FFpppFF.....',
  '.FFppFppppE....',
  '.F.EEppppEE....',
  '.iiEDRRRRE.....',
  '..EEDRRrRE.....',
  '...DDDAAD......',
  '...ERRrRRE.....',
]
const knightLegs = [
  '...EEEEE.......',
  '...EE..EE......',
  '...EE..EE......',
  '..DDD..DDD.....',
]
const knightLegsStep = [
  '...EEEEE.......',
  '..EE...EE......',
  '.EE.....EE.....',
  'DDD.....DDD....',
]

export const knight = [
  box(stack(knightHead, knightBody, knightLegs)),
  box(stack(knightHead, knightBody, knightLegsStep)),
  box(stack(knightHead, knightBodyWind, knightLegsStep)),
]

const wightRows = [
  '.....qqqq....',
  '....qWqqqp...',
  '....qO0qO0...',
  '....qqqqqp...',
  '.....pqpq....',
  '...lllqlll...',
  '..lkllqllkl..',
  '..lkq.q.qkl..',
  '..lkqpqpqkl..',
  '...lkkqkkl...',
  '...lkkkkkl...',
  '...lklklkl...',
  '....q...q....',
  '....q...q....',
  '...qq...qq...',
]
const wightWalk = [
  ...wightRows.slice(0, 12),
  '....q...q....',
  '...q.....q...',
  '..qq.....qq..',
]
const wightWind = [
  '.q...qqqq....',
  '.qp.qWqqqp...',
  '..qqqO0qO0...',
  '....qqqqqp...',
  '.....pqpq....',
  '...lllqlll...',
  '..lkllqllkl..',
  '..lkq.q.qkl..',
  '..lkqpqpqkl..',
  '...lkkqkkl...',
  '...lkkkkkl...',
  '...lklklkl...',
  '....q...q....',
  '...q.....q...',
  '..qq.....qq..',
]

export const wight = [box(wightRows), box(wightWalk), box(wightWind)]

const drownedRows = [
  '....XXXXX....',
  '...XYYYYXV...',
  '..XYYYYYYV...',
  '..XYZ0YZ0V...',
  '..XYYYYYYV...',
  '...VuVVuV....',
  '..VXXXXXXV...',
  '.VXYYXXXXXV..',
  '.VXuYXXXuXV..',
  '.VuXXXXXXuV..',
  '..VXXuXXXV...',
  '..VXXXXXXV...',
  '...VV.VV.....',
  '...VV.VV.....',
  '..XXX.XXX....',
]
const drownedWalk = [
  ...drownedRows.slice(0, 12),
  '..VV...VV....',
  '.VV.....VV...',
  'XXX.....XXX..',
]
const drownedWind = [
  'Y...XXXXX...Y',
  'YV.XYYYYXV.VY',
  '.VXYYYYYYVXV.',
  '..XYZ0YZ0V...',
  '..XYYYYYYV...',
  '...VuVVuV....',
  '..VXXXXXXV...',
  '..XYYXXXXV...',
  '..XuYXXXuV...',
  '..uXXXXXXu...',
  '..VXXuXXXV...',
  '..VXXXXXXV...',
  '..VV...VV....',
  '.VV.....VV...',
  'XXX.....XXX..',
]

export const drowned = [box(drownedRows), box(drownedWalk), box(drownedWind)]

const houndA = [
  '.............kk.',
  '............klll',
  '.l.........klTlU',
  '..l.kkkkkkkklllll',
  '...klllTllllkkk..',
  '...llAlllTlllk...',
  '...kllllllllk....',
  '...kl.k...kl.....',
  '...kl.k...kl.....',
  '..kk..kk.kk......',
]
const houndB = [
  '.............kk.',
  '............klll',
  '...........klTlU',
  '.l..kkkkkkkklllll',
  '..lklllTllllkkk..',
  '...llAlllTlllk...',
  '...kllllllllk....',
  '..kl...k.kl......',
  '.kl.....kl.......',
  'kk.....kk........',
]
const houndWind = [
  '.................',
  '.............kk..',
  '............klll.',
  '..l.kkkkkkkklTlUU',
  '...klllTllllllll.',
  '...llAlllTlllkk..',
  '...kllllllllk....',
  '..kkl.k..kkl.....',
  '.kk..kk..kk......',
  '.................',
]

function widen(rows: Rows, width: number): string[] {
  return rows.map(row => (row + '.'.repeat(width)).slice(0, width))
}

export const ashHound = [box(widen(houndA, 17)), box(widen(houndB, 17)), box(widen(houndWind, 17))]

const wispA = [
  '....ZZZ....',
  '..ZZWWWZZ..',
  '.ZWWWWWWWZ.',
  '.ZWW0WW0WZ.',
  'ZWWWWWWWWWZ',
  '.ZWWYWWYWZ.',
  '..ZYYYYYZ..',
  '...YXYXY...',
  '....XYX....',
  '...X.Y.X...',
  '.....X.....',
]
const wispB = [
  '....ZZZ....',
  '..ZZWWWZZ..',
  '.ZWWWWWWWZ.',
  '.ZWW0WW0WZ.',
  'ZWWWWWWWWWZ',
  '.ZWWYWWYWZ.',
  '..ZYYYYYZ..',
  '...YXYXY...',
  '....YXY....',
  '....X.X....',
  '...X...X...',
]
const wispWind = [
  'Z...ZZZ...Z',
  '.ZZZWWWZZZ.',
  '.ZWWWWWWWZ.',
  '.ZWS0WS0WZ.',
  'ZWWWWWWWWWZ',
  '.ZWWYWWYWZ.',
  '..ZYYYYYZ..',
  '...YXYXY...',
  '..Y.XYX.Y..',
  '.X..X.X..X.',
  '...........',
]

export const galeWisp = [box(wispA), box(wispB), box(wispWind)]

const chainedRows = [
  '.....nnnn......',
  '....nooonn.....',
  '...nooooon.....',
  '...noOnOon.....',
  '...nooooon.....',
  '....nmmmn......',
  '..nnnooonnn....',
  '.nooonoooonn...',
  '.noonooooonon..',
  '.nonnnoooonon..',
  '.pFpnnooonnpFp.',
  '.EFE.mmmm..EFE.',
  '.o...mmmm....o.',
  '.o..mm..mm...o.',
  '.o..mm..mm..o..',
  '..o.mm..mm.o...',
  '...ooo..ooo....',
]
const chainedWalk = [
  ...chainedRows.slice(0, 13),
  '.o.mm....mm..o.',
  '.o.mm....mm.o..',
  '..omm....mmo...',
  '..ooo....ooo...',
]
const chainedWind = [
  '.p...nnnn....p.',
  '.EFnooonnn.FEF.',
  '..onooooon.o...',
  '...noOnOon.o...',
  '...nooooon.o...',
  '....nmmmn..o...',
  '..nnnooonnn....',
  '.nooonoooonn...',
  '.noonooooonn...',
  '..nnnnoooonn...',
  '...nnnooonn....',
  '.....mmmm......',
  '.....mmmm......',
  '....mm..mm.....',
  '...mm....mm....',
  '...mm....mm....',
  '..ooo....ooo...',
]

export const chained = [box(chainedRows), box(chainedWalk), box(chainedWind)]
