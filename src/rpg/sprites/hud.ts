import { mirrorHalf, outlined, pad, recolor, type Rows } from './paint.ts'

function box(rows: Rows): string[] {
  return outlined(pad(rows, 1, 1, rows[0]!.length + 2, rows.length + 2))
}

function shadeRight(rows: Rows): string[] {
  return rows.map(row => row.slice(0, row.length >> 1) + recolor([row.slice(row.length >> 1)], 'WUTS*R', 'TTS*Rr')[0]!)
}

const heart = shadeRight(mirrorHalf([
  '.......',
  '..RRR..',
  '.RSTSR.',
  'RSTWTSR',
  'RSTUTSS',
  'RSSTSS*',
  'R*SSS**',
  '.R*SS**',
  '..R*S**',
  '...R***',
  '....R**',
  '.....R*',
  '......R',
]))

export const hudHeart = box(outlined(outlined(pad(heart, 2, 1, 18, 16), 'A'), 'K'))

export const hudGlyphs = [
  [
    '....????....',
    '..?&&==&??..',
    '.?&====&&?@.',
    '.?&==&&&&?@.',
    '?&=&&&&?~@@~',
    '?&&&&&?~&?@~',
    '?&&?~~~&&?@~',
    '@?&?~&&&?@@~',
    '@??&&&&??@~.',
    '.@@????@@~~.',
    '..~@@@@~~...',
  ],
  [
    '.....NNNN...',
    '...NOPPOON..',
    '..NOP..MNNM.',
    '.NOP....MNL.',
    '.NO..PO..ML.',
    'NOP.POMN.ML.',
    'NO..ON.MLL..',
    'NO..NML.....',
    'MNO..MM...N.',
    'LMNOOOOOONML',
    '.LMMNNNNMML.',
  ],
  [
    '.....U......',
    '....UA...T..',
    '...TAA..TS..',
    '..TAUAT.TS..',
    '..TAUUATAS..',
    '.TAUUUUAATS.',
    '.TAUWWUUATS.',
    'TAUUWWUUAATS',
    'TAUUUUUUAATS',
    '.TAAUUUAATS.',
    '..rSTAATSr..',
  ],
  [
    '.......ZZ...',
    '.........Z..',
    'ZZZZYYYYYX..',
    '............',
    '............',
    '.ZZZYYYYYYX.',
    '...........X',
    '..........X.',
    '............',
    '...ZZYYYX...',
    '........X...',
  ],
].map(rows => box(pad(rows, 0, 0, 12, 12)))
