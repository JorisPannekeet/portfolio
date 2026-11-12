import { mirrorHalf, outlined, pad, recolor, stack, stretch, type Rows } from './paint.ts'

function boss(...halves: Rows[]): string[] {
  const rows = mirrorHalf(stack(...halves))
  return outlined(pad(rows, 1, 1, rows[0]!.length + 2, rows.length + 2))
}

function colossus(...halves: Rows[]): string[] {
  const rows = recolor(stretch(mirrorHalf(stack(...halves)), 4, 3), 'klmn', 'lmno')
  return outlined(pad(rows, 1, 1, rows[0]!.length + 2, rows.length + 2))
}

const kingHead = [
  '.........A..A',
  '.........AKAA',
  '........KAUAK',
  '........qqqqq',
  '.......qpqqqq',
  '.......qO0qqq',
  '.......qqqqqp',
  '........pqpqp',
  '........q0q0q',
]
const kingArmsDown = [
  '.....lllmmmmm',
  '...llmmmmnnmm',
  '..lmmnnmmmmlm',
  '..lmlqpqmmlll',
  '..lml.qpqmlll',
  '..lml.qpqmlKA',
  '..qql.lllllKA',
  '..qq..lmmmlKA',
  '......lmmmlKA',
]
const kingArmsUp = [
  '..qq.lllmmmmm',
  '..qqlmmmmnnmm',
  '..lllnnmmmmlm',
  '...lmqpqmmlll',
  '.....qpqmmlll',
  '.....qpqmmlll',
  '......lllllll',
  '......lmmmlll',
  '......lmmmlll',
]
const kingSkirt = [
  '.....lmmmmlml',
  '.....lmtmmlml',
  '....lmmtmmlml',
  '....lmmmmmlml',
  '....ltmmtmlml',
  '...lmtlmtllml',
  '...l.l.l.l.ll',
]

export const barrowKing = [boss(kingHead, kingArmsDown, kingSkirt), boss(kingHead, kingArmsUp, kingSkirt)]

const abbotHead = [
  '...........WW',
  '..........WPW',
  '.........WPAP',
  '.........WPAP',
  '........WPPAP',
  '........XYYYY',
  '........YZ0YY',
  '........YYYYY',
  '.........XVXV',
]
const abbotDown = [
  '......WWWPPPP',
  '....WWPPPPPAP',
  '...WPPPOPPPAP',
  '..VYPPOOPPPAP',
  '..VYPPOPPPPAP',
  '..XXPPPPPPPAP',
  '..eA.PPPPPPAP',
  '..AUA.PPPPOPP',
  '..eA..PPPPOOP',
]
const abbotUp = [
  '..eA..WWPPPPP',
  '.AUAWWPPPPPAP',
  '..eAPPPOPPPAP',
  '..VYPPOOPPPAP',
  '...YPPOPPPPAP',
  '.....PPPPPPAP',
  '.....PPPPPPAP',
  '......PPPPOPP',
  '......PPPPOOP',
]
const abbotSkirt = [
  '.....OPPPPOPP',
  '.....OPPPPPPP',
  '....OPPPPPPPP',
  '....OPPPPPPPP',
  '...OOPPPPPPPP',
  '...XYXYXYXYXY',
  '...V.V.V.V.VV',
]

export const drownedAbbot = [boss(abbotHead, abbotDown, abbotSkirt), boss(abbotHead, abbotUp, abbotSkirt)]

const forgeHead = [
  '.............',
  '.........llll',
  '........lmmmm',
  '........lmnnn',
  '........lmTAT',
  '........lmlll',
  '........klmmm',
  '.......kklll',
]
const forgeDown = [
  '...kllllmmmmm',
  '..kmnnmllmmmm',
  '.kmnnnmlRSTAU',
  '.kmnmmlkRSTAU',
  '.klmmlkkRSTAU',
  '.kl..lkkkRSTA',
  '.jj..lkkklmmm',
  '.ddd.lkkklmmm',
  'nnnnnlkkkllll',
  'mmmmm.kkkllll',
]
const forgeUp = [
  'nnnnnllmmmmmm',
  'mmmmmllllmmmm',
  '.dd.kllRRSTAU',
  '.jj.kmlRSTAUU',
  '.kmnmlkRSTAUU',
  '.klmlkkkRSTAU',
  '.....lkkklmmm',
  '.....lkkklmmm',
  '.....lkkkllll',
  '......kkkllll',
]
const forgeLegs = [
  '......kkk.lll',
  '.....kllm.lll',
  '.....kllm.lll',
  '.....klmm..ll',
  '....kkkkk....',
  '...kkkkkk....',
]

export const forgemaster = [boss(forgeHead, forgeDown, forgeLegs), boss(forgeHead, forgeUp, forgeLegs)]

const abbessHead = [
  '..........ZZZ',
  '.........ZYYY',
  '.........YXXX',
  '.........Xiii',
  '.........Xi0i',
  '.........Xiii',
  '.........XYjj',
  '..........XYY',
]
const abbessDown = [
  'Z......YYZZZZ',
  'ZZ....YZZWWWW',
  '.ZZ..YZWWWWWW',
  '..ZZYZWWWYWWW',
  '...ZZWWWYYWWW',
  '...ZYWWWYWWWW',
  '..UZ.iWWWWWWW',
  '..A...WWWYWWW',
  '..A...WWWYWWW',
]
const abbessUp = [
  'Z.U...YYZZZZZ',
  'ZZA..YZZWWWWW',
  '.ZA.YZWWWWWWW',
  '.ZiZYZWWWYWWW',
  '..ZZZWWWYYWWW',
  '...ZYWWWYWWWW',
  '...Z..WWWWWWW',
  '......WWWYWWW',
  '......WWWYWWW',
]
const abbessSkirt = [
  '.....WWWWYWWW',
  '.....WWWYWWWW',
  '....ZWWWYWWWW',
  '....ZWWYWWWWW',
  '...ZZWWYWWWWW',
  '...ZWWYWWWWWW',
  '..ZZYZYZYZYZY',
  '..Z.Y.X.Y.X.Y',
]

export const stormAbbess = [boss(abbessHead, abbessDown, abbessSkirt), boss(abbessHead, abbessUp, abbessSkirt)]

const varekHelm = [
  '..K........',
  '..KA.......',
  '...AK..kkkk',
  '....kkkllll',
  '....kllllll',
  '....klAAAAA',
  '....kl00S00',
  '....kllllll',
  '.....kkkkkk',
]
const varekBody = [
  '..RRkAAkkkk',
  '.RRkllllAll',
  'RRklllllAlA',
  'RRkllkkkiAA',
  'RRkl.kRRRRp',
  'RRkl.kRrRRp',
  'RRkl.kAAAAp',
  'RR.l.kRRrRp',
  'RR...kRRRrp',
  'Rr...kkkkkp',
  'Rr...kll.kp',
  'r....kll..p',
  '.....kll..W',
  '....kkkk...',
]
const varekRaised = [
  '..........W',
  '..........p',
  '..........p',
  '..........p',
  '..........p',
  '..........p',
  '..........p',
  '..........p',
  '.........AA',
]
const varekBodyWind = [
  '..RRkAAkiiA',
  '.RRkllllAlA',
  'RRklllllAll',
  'RRkllkkkkkk',
  'RRkl.kRRRRR',
  'RRkl.kRrRRr',
  'RRkl.kAAAAA',
  'RR.l.kRRrRR',
  'RR...kRRRrR',
  'Rr...kkkkkk',
  'Rr...kll.kl',
  'r....kll..k',
  '.....kll..k',
  '....kkkk.kk',
]
const blankTop = Array<string>(varekRaised.length).fill('...........')

export const varekKnight = [boss(blankTop, varekHelm, varekBody), boss(varekRaised, varekHelm, varekBodyWind)]

const colossusHead = [
  '..............',
  '.........A..A.',
  '.........AU.AU',
  '........KAAKAA',
  '........kkkkkk',
  '.......kllllll',
  '.......klmmmmm',
  '.......klzzmll',
  '.......klmmmmm',
  '.......kklllll',
  '........kkkmmk',
]
const colossusDown = [
  '...kkkkklllllk',
  '..klllmmmllllm',
  '.klmmmmnmlkkkk',
  '.klmnnmmlkzzaa',
  '.klmmmmlkzaQQQ',
  '.kllllklkzaQWW',
  '.kkzzlklkzaQQQ',
  '..kllk.lkkzaaa',
  '..kmmk.lkkkkkk',
  '..kllk.lllllll',
  '.kmmmmkllmmmll',
  '.klllllk.kllll',
  '.kkkkkkk.kmmmm',
  '.........kllll',
]
const colossusUp = [
  'kmmmmkklllllll',
  'klllllkmmmllll',
  '.kkzzlklmlkkkk',
  '..kllkmmlkzzaa',
  '..kmmklmkzaQQQ',
  '..kllklkkzaQWW',
  '...kklklkzaQQQ',
  '......lkkkzaaa',
  '......lkkkkkkk',
  '......llllllll',
  '......kllmmmll',
  '.......k.kllll',
  '.........kmmmm',
  '.........kllll',
]
const colossusLegs = [
  '........kllkkk',
  '.......kllmmk.',
  '.......kllmmk.',
  '.......klzzmk.',
  '.......kllmmk.',
  '......kllllmk.',
  '......kllllmk.',
  '.....kkkkkkkk.',
  '....kkkkkkkkk.',
]

export const varekColossus = [colossus(colossusHead, colossusDown, colossusLegs), colossus(colossusHead, colossusUp, colossusLegs)]
