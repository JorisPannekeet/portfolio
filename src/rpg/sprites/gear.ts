import { mirror, outlined, pad, type Rows } from './paint.ts'

function box(rows: Rows): string[] {
  return outlined(pad(rows, 1, 1, rows[0]!.length + 2, rows.length + 2))
}

function reachOf(rows: Rows, grip: number): number {
  return Math.round(rows[0]!.length / 2 - grip - 0.5)
}

const sword = [
  '.......K.................',
  '.......A.................',
  '.Kccccdpqqqqqqqqqqqqqqqq.',
  'KUdcdcdUommmmmmmmmmmmmqqW',
  'AKcbcbcAnoooooooooooooop.',
  '.......A.................',
  '.......K.................',
]
export const bladeSword = box(sword)
export const SWORD_REACH = reachOf(sword, 4)

const greatsword = [
  '..........KA.........................',
  '..........AU.........................',
  '..........AA.........................',
  '.KcdcdcdcdApnqqqqqqqqqqqqqqqqqqqqqp..',
  'AUdcdcdcdcAUoppppppppppppppppppppqqW.',
  'KUcdcdcdcdAUommmmmmmmmmmmmmmmmmmmoqqW',
  'AKcbcbcbcbAnmnooooooooooooooooooopp..',
  '.Kbbbbbbbb.Kmlnnnnnnnnnnnnnnnnnnnn...',
  '..........AA.........................',
  '..........AU.........................',
  '..........KA.........................',
]
export const bladeGreatsword = box(greatsword)
export const GREATSWORD_REACH = reachOf(greatsword, 5)

export const bladeHammer = box([
  '...................mnoonm',
  '...................noqqpn',
  'bcdcdcdcdcdcdcdcdKAopWqpn',
  '...................noppom',
  '...................mnoonm',
])

export const shieldSide = box([
  '.Ao.',
  'AUqo',
  'AMNo',
  'AMNo',
  'AUNn',
  'AUAn',
  'AUNn',
  'AMNn',
  'AMNn',
  'AMLn',
  'AMLm',
  'AMLm',
  '.ALm',
  '.AJm',
  '..Am',
  '..m.',
])

export const shieldFront = box([
  'AUUUUUUUUUUUUUUA',
  'UqNNNNNUANMMMMMK',
  'UNOONNNUAMMMMMLA',
  'UNONNNNUAMMMMLLA',
  'UUUUUUUnoAAAAAAK',
  'AAAAAAnqpnKKKKKK',
  'UNNNNNmpomMMMLLA',
  'UNNNNMMUAMMMLLLK',
  'AMMMMMMUAMMMLLLA',
  '.AMMMMMUAMMLLLK.',
  '.AMMMMMUAMLLLLK.',
  '..AMMMMUALLLLK..',
  '..AAMMMUALLLKK..',
  '...AAMMUALLKK...',
  '....AAMUALKK....',
  '......AUAK......',
  '.......KK.......',
])

export const shieldBack = box([
  'noooooooooooooom',
  'oeddeeddeddeddcm',
  'odccccdcdccccbcm',
  'obbbbbbbbbbbbbbm',
  'oeddeAUAeddeddcm',
  'odccdKAKdccccbcl',
  'oeddeAdAeddeddcl',
  'obbbbKAKbbbbbbbl',
  'oeddeAUAeddedcbl',
  '.odccdcdcdcccbl.',
  '.obbbbbbbbbbbbl.',
  '..oeddeddeddcl..',
  '..nndccdccdcll..',
  '...nnedddecll...',
  '....nndcdcll....',
  '......nnll......',
  '.......ll.......',
])

export const bowHeld = box(mirror([
  '.fe..',
  '.hfe.',
  '..fdW',
  '..fe.W',
  '...fdW',
  '...fdW',
  '...ed.W',
  '...ed.W',
  '...Ad.W',
  '...KAcW',
  '...Ad.W',
  '...ed.W',
  '...ed.W',
  '...fdW',
  '...fdW',
  '..fe.W',
  '..fdW',
  '.hfe.',
  '.fe..',
].map(row => (row + '.......').slice(0, 7))))

export const heldFist = box(['cde', 'bdd', 'bcc'])

export const warhammer = box([
  'lmnnnnnnml',
  'mopqqqppon',
  'npqWWqqpon',
  'mopqqqppom',
  'lmnooooonl',
  'klmmAAmmlk',
  '....AU....',
  '....ed....',
  '....fd....',
  '....ed....',
  '....dc....',
  '....ed....',
  '....fd....',
  '....ed....',
  '....dc....',
  '....AU....',
  '....KA....',
])

export const grappleChain = box([
  '.p...p.',
  'pq...qo',
  'oqp.poo',
  '.oqpoo.',
  '..oqo..',
  '..mpm..',
  '..non..',
  '.on.no.',
  '.n...n.',
  '.on.no.',
  '..nom..',
  '..mpm..',
  '.om.mo.',
  '.n...n.',
  '.om.mo.',
  '..nom..',
  '..mpm..',
  '.on.no.',
  '.n...n.',
  '.on.no.',
  '..nnm..',
])

export const longbow = box(mirror([
  '....hf....',
  '...hfe.W..',
  '..hfe..W..',
  '..fe...W..',
  '.fe....W..',
  '.fe....W..',
  '.ed....W..',
  '.ed....W..',
  'AK.....W..',
  'UA.....W..',
  'AK.....W..',
  '.ed....W..',
  '.ed....W..',
  '.fe....W..',
  '.fe....W..',
  '..fe...W..',
  '..hfe..W..',
  '...hfe.W..',
  '....hf....',
]))
