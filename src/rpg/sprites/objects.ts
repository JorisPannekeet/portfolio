import { mirrorHalf, outlined, pad, recolor, stack, type Rows } from './paint.ts'

function box(rows: Rows): string[] {
  return outlined(pad(rows, 1, 1, rows[0]!.length + 2, rows.length + 2))
}

export const chestClosed = box([
  '.cddddddddc.',
  'cdffffffffdc',
  'deeeeeeeeeed',
  'nnnnnAAnnnnn',
  'deeeeKAeeeed',
  'deeeeeeeeeed',
  'deeeeeeeeeed',
  'nnnnnnnnnnnn',
  'cddddddddddc',
])

export const chestOpen = box([
  'cddddddddddc',
  'dfffffffffd.',
  'nnnnnnnnnnn.',
  'cb000000000c',
  'nAUAAUAUAAnn',
  'deeeeKAeeeed',
  'deeeeeeeeeed',
  'deeeeeeeeeed',
  'nnnnnnnnnnnn',
  'cddddddddddc',
])

const waystoneHalf = [
  '....mm',
  '...mnn',
  '..mnoo',
  '..mnoo',
  '..mn77',
  '..mn7o',
  '..mn77',
  '..mnoo',
  '..mn7o',
  '..mn77',
  '..mnoo',
  '..mnoo',
  '..mnoo',
  '.lmnno',
  '.llmmn',
  'lllmmm',
]

export const waystoneDark = box(recolor(mirrorHalf(waystoneHalf), '7', 'l'))
export const waystoneLit = box(recolor(mirrorHalf(waystoneHalf), '7', 'Z'))

const forgeBase = [
  '.....kkkk.......',
  '....kllllk......',
  '...kllmmllk.....',
  '..kllm88mllk....',
  '..klm8998mlk....',
  '..klm9UU9mlk....',
  '..klmmmmmmlk....',
  '..kllllllllk....',
  '..kmmmmmmmmk....',
  '..klllllllll.nnn',
  '..kmmmmmmmmlnppo',
  '..klllllllll.no.',
  '..kkkkkkkkkk.no.',
  '............nnn.',
]

export const forgeA = box(recolor(forgeBase, '89', 'TA'))
export const forgeB = box(recolor(forgeBase, '89', 'SU'))

export const windmillTower = box([
  '.....dd.....',
  '....deed....',
  '...deffed...',
  '...dhhhhd...',
  '...dhffhd...',
  '..dhhhhhhd..',
  '..dhh00hhd..',
  '..dhh00hhd..',
  '..dhhhhhhd..',
  '.dhhhhhhhhd.',
  '.dhhhhhhhhd.',
  '.dhhh00hhhd.',
  '.dhhh00hhhd.',
  '.dhhh00hhhd.',
  'cdddddddddd.',
])

export const windmillBladesX = box([
  'ef...........fe',
  'fqe.........eqf',
  '.eqe.......eqe.',
  '..eqe.....eqe..',
  '...eqe...eqe...',
  '....eqe.eqe....',
  '.....eddde.....',
  '......dAd......',
  '.....eddde.....',
  '....eqe.eqe....',
  '...eqe...eqe...',
  '..eqe.....eqe..',
  '.eqe.......eqe.',
  'fqe.........eqf',
  'ef...........fe',
])

export const windmillBladesPlus = box([
  '......efe......',
  '......qqq......',
  '......eqe......',
  '......eqe......',
  '......eqe......',
  '......eqe......',
  'efeeeeedeeeeefe',
  'fqqqqqdAdqqqqqf',
  'efeeeeedeeeeefe',
  '......eqe......',
  '......eqe......',
  '......eqe......',
  '......eqe......',
  '......qqq......',
  '......efe......',
])

const switchPost = [
  '..WWWW..',
  '.WSSSSW.',
  'WSWWWWSW',
  'WSWSSWSW',
  'WSWSSWSW',
  'WSWWWWSW',
  '.WSSSSW.',
  '..WWWW..',
  '...ee...',
  '...ed...',
  '...ed...',
  '...ed...',
  '..cddc..',
]

export const switchIdle = box(switchPost)
export const switchTripped = box(recolor(switchPost, 'S', 'G'))

export const grapplePost = box([
  '..nnnn..',
  '.n....n.',
  'no....on',
  'no....on',
  '.np..pn.',
  '..pnnp..',
  '...ee...',
  '..deed..',
  '..deed..',
  '..deed..',
  '..deed..',
  '..deed..',
  '.cdeedc.',
  'cccddccc',
])

export const pedestal = box([
  '.mnnnnnnm.',
  'moppppppom',
  'lmmmmmmmml',
  '..mnoonm..',
  '..mnoonm..',
  '..mnoonm..',
  '..mnoonm..',
  '.lmnnnnml.',
  'lllmmmmlll',
])

const shardTemplate = [
  '..9..',
  '.989.',
  '.888.',
  '98W87',
  '98W87',
  '.888.',
  '.787.',
  '..7..',
]

export const SHARD_TINTS: readonly string[] = ['h@e', 'OMN', 'UTS', 'ZXY']

export const shards = SHARD_TINTS.map(tint => box(recolor(shardTemplate, '978', tint)))

export const warhammer = box([
  '.nnnnn.',
  'nppopnn',
  'nooonnn',
  '..eF...',
  '..ed...',
  '..ed...',
  '..ed...',
  '..ed...',
  '..cc...',
])

export const grappleChain = box([
  '..oo.....',
  '.o..o....',
  'o.F..o...',
  '.FF..o...',
  'F.F.o....',
  '..Fo.....',
  '..o.o....',
  '.o...o.o.',
  '......o..',
])

export const longbow = box([
  '...ee..',
  '..e.W..',
  '.e..W..',
  'e...W..',
  'f...W..',
  'e...W..',
  '.e..W..',
  '..e.W..',
  '...ee..',
])

export const plinth = box([
  '.mnnnnnnm.',
  'mooooooonm',
  'llmmmmmmll',
])

const shrineHalf = [
  '....kl',
  '...klm',
  '...lmn',
  '..klmn',
  '..lm77',
  '..lm87',
  '..lm77',
  '..lmnm',
  '..lm87',
  '..lmnm',
  '..lmnn',
  '.klmnn',
  'kllmmm',
  'kkllll',
]

export const shrineActive = box(recolor(mirrorHalf(shrineHalf), '78', 'ZY'))
export const shrineDone = box(recolor(mirrorHalf(shrineHalf), '78', 'lm'))

const horseA = [
  '..................ee..',
  '.................eeed.',
  '..............ddeeeee0',
  '.............dde.eeeee',
  '.............de...eef.',
  '..eeeeeeeeeeeee.......',
  '.deeeeeeeeeeeeee......',
  'd.eefeeeeeeeeeed......',
  'd.eeeeeeeeeeeeed......',
  '.d.deeeeeeeeeed.......',
  '...ed.ed...ed.ed......',
  '...ed.ed...ed.ed......',
  '...ed.ed...ed.ed......',
  '...00.00...00.00......',
]
const horseB = [
  '...................ee.',
  '..................eeed',
  '...............ddeeeee',
  '..............dde.eeee',
  '..............de...ee.',
  '..eeeeeeeeeeeee.......',
  '.deeeeeeeeeeeeee......',
  'd.eefeeeeeeeeeed......',
  'd.eeeeeeeeeeeeed......',
  '.d.deeeeeeeeeed.......',
  '..ed..ed..ed...ed.....',
  '.ed....ed.ed....ed....',
  '.ed.....ed.ed...ed....',
  '00......0000....00....',
]

const saddle = [
  '......................',
  '......................',
  '......................',
  '......................',
  '......................',
  '.....RRRR.............',
  '.....RAAR.............',
]

function horse(rows: Rows): string[] {
  const rider = rows.map((row, y) => {
    const s = saddle[y]
    if (!s) return row
    let next = ''
    for (let x = 0; x < row.length; x++) next += s[x] !== '.' ? s[x]! : row[x]!
    return next
  })
  return box(rider)
}

export const horseIdle = horse(horseA)
export const horseRun = horse(horseB)

export const coins = box([
  '..AA..',
  '.AUAK.',
  'AUAKAA',
  'KAAKUA',
  '.KKAK.',
])

export const heart = box([
  '.SS.SS.',
  'SUSSSSS',
  'SSSSSSS',
  '.SSSSR.',
  '..SSR..',
  '...R...',
])

export const ore = box([
  '..nn..',
  '.nOpn.',
  'nooNmn',
  'mnoomm',
  '.mmll.',
])

export const lootBag = box([
  '..cc..',
  '.cAAc.',
  '.dhhd.',
  'dhffed',
  'dfffed',
  '.deed.',
])

export const runestone = box([
  '.nnnn.',
  'nooopn',
  'nozzon',
  'nozoon',
  'nozzon',
  'mnnnnm',
])

export const banner = box([
  '.U.......',
  '.f.......',
  '.fSSSSSS.',
  '.fSSRRSS.',
  '.fSRUURS.',
  '.fSRUURS.',
  '.fSSRRSS.',
  '.fSSSSSS.',
  '.fSS..SS.',
  '.fS....S.',
  '.f.......',
  '.f.......',
  '.f.......',
  'nmn......',
])

export const doorKey = box([
  '.UAAU....',
  'UK..KA...',
  'AK..KAAAA',
  '.AKKA.K.K',
])

const npcHeadMaren = [
  '...@@@@@...',
  '..@&&&&&@..',
  '.@&&iiii&@.',
  '.@&i0ii0&@.',
  '.@&iiiii&@.',
  '.@&&jjj&&@.',
]
const npcBodyMaren = [
  '.@&&&&&&&@.',
  '@&&&&&&&&&@',
  '@&i&&b&&i&@',
  '.@&&&b&&&@.',
  '.@&&&&&&&@.',
  '.@&&&&&&&@.',
  '..@@@@@@@..',
]

const npcHeadSmith = [
  '...jjjjj...',
  '..jiiiiij..',
  '..i0iii0i..',
  '..iiiiiii..',
  '..dHHHHHd..',
  '...dHHHd...',
]
const npcBodySmith = [
  '.iiddddii..',
  'iiidcccdii.',
  'ii.dcccd.ii',
  'ji.dcccd.ij',
  '...dcccd...',
  '...DD.DD...',
  '...bb.bb...',
]

const npcHeadChild = [
  '...........',
  '...........',
  '...fffff...',
  '..ffiiiff..',
  '..fi0i0if..',
  '...iijii...',
]
const npcBodyChild = [
  '...NMMMN...',
  '..iMMMMMi..',
  '...MMMMM...',
  '...dd.dd...',
  '...bb.bb...',
  '...........',
  '...........',
]

const npcHeadVillager = [
  '...ddddd...',
  '..deeeeed..',
  '..eiiiiie..',
  '..i0iii0i..',
  '..iiiiiii..',
  '...jjjjj...',
]
const npcBodyVillager = [
  '..wvvvvvw..',
  '.ivvvvvvvi.',
  '.i.vbAbv.i.',
  '...vvvvv...',
  '...dd.dd...',
  '...dd.dd...',
  '...cc.cc...',
]

const NPC_BLINK_EVERY = 8

function npc(head: Rows, body: Rows): string[][] {
  const still = box(stack(head, body))
  const blink = box(stack(head.map(row => row.replace(/0/g, 'j')), body))
  return [...Array<string[]>(NPC_BLINK_EVERY - 1).fill(still), blink]
}

export const npcMaren = npc(npcHeadMaren, npcBodyMaren)
export const npcSmith = npc(npcHeadSmith, npcBodySmith)
export const npcChild = npc(npcHeadChild, npcBodyChild)
export const npcVillager = npc(npcHeadVillager, npcBodyVillager)
