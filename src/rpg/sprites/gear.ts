import { outlined, pad, type Rows } from './paint.ts'

function box(rows: Rows): string[] {
  return outlined(pad(rows, 1, 1, rows[0]!.length + 2, rows.length + 2))
}

export const bladeSword = box([
  '..A........',
  'dKApppppppW',
  '..A........',
])

export const bladeGreatsword = box([
  '...A............',
  '...A..pppppppppW',
  'ddKAAppppppppppW',
  '...A..oooooooooo',
  '...A............',
])

export const bladeHammer = box([
  '.........nn',
  '.........pn',
  'ddddddddeoo',
  '.........on',
  '.........nn',
])

export const shieldSide = box([
  'NM',
  'NA',
  'AA',
  'NA',
  'MA',
  'ML',
  'L.',
])

export const shieldFront = box([
  'NNNNNM',
  'NMAAML',
  'NAAAAL',
  'NMAAML',
  '.MAAL.',
  '..ML..',
])

export const bowHeld = box([
  '.e.',
  'e.W',
  'e.W',
  'f.W',
  'e.W',
  'e.W',
  '.e.',
])

export const arrowEnemy = box([
  'S.......n.',
  '.SSeeeeeon',
  'S.......n.',
])

export const arrowPlayer = box([
  'W.......p.',
  '.WWfffffWp',
  'W.......p.',
])

export const boltSpark = box([
  '...ZZ...',
  'YZZWWWZ.',
  '...ZZYWW',
])

export const waveCrescent = box([
  '.P...',
  '..PO.',
  '...OP',
  '...NO',
  '...NO',
  '...NO',
  '...OP',
  '..PO.',
  '.P...',
])

export const emberOrbA = box([
  '..T..',
  '.TAT.',
  'TAUAT',
  '.SAT.',
  '..S..',
])

export const emberOrbB = box([
  '.T.T.',
  'TAAAT',
  'TAUAS',
  'SAAAT',
  '.S.S.',
])

export const tideOrbA = box([
  '.NNN.',
  'NOPON',
  'NPWON',
  'NOONM',
  '.MMM.',
])

export const tideOrbB = box([
  '.NNN.',
  'NOONN',
  'NOPWN',
  'MNOON',
  '.MMM.',
])

export const sparkFrames = [
  ['..W..', '.WUW.', 'WUWUW', '.WUW.', '..W..'],
  ['.....', '..U..', '.UWU.', '..U..', '.....'],
  ['.....', '.....', '..A..', '.....', '.....'],
]

export const puffFrames = [
  ['.....', '.ppo.', 'pqqpo', '.ppo.', '.....'],
  ['.oo.o', 'oppno', 'opppn', 'nopnn', '.nn..'],
  ['n...n', '.n.o.', '..n..', '.o.n.', 'n...n'],
]

export const glintFrames = [
  ['...W...', '...W...', '..WUW..', 'WWUWUWW', '..WUW..', '...W...', '...W...'],
  ['.......', '...U...', '...W...', '.UWWWU.', '...W...', '...U...', '.......'],
  ['.......', '.......', '...A...', '..AUA..', '...A...', '.......', '.......'],
]

export const questArrow = box([
  '...U...',
  '...AU..',
  'AAAAAU.',
  'KKKKKAU',
  'AAAAAU.',
  '...AU..',
  '...U...',
])

export const exitChevron = box([
  'W...W....',
  'qW..qW...',
  '.qW..qW..',
  '..qW..qW.',
  '.qW..qW..',
  'qW..qW...',
  'W...W....',
])

export const questMarker = box([
  '..U..',
  '.UAU.',
  'UAAAK',
  '.AAK.',
  '..K..',
])

export const interactPip = box([
  '.WWWWW.',
  'WWW0WWW',
  'WWW0WWW',
  'WWW0WWW',
  'WWWWWWW',
  'WWW0WWW',
  '.WWWWW.',
  '...W...',
])

export const hudHeart = box([
  'SS.SS',
  'SUSSS',
  'SSSSS',
  '.SSR.',
  '..R..',
])
