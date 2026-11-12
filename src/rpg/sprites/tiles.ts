import { field, noise, recolor, type Rows } from './paint.ts'

export const floorA = [
  '3333333333333332',
  '3333333333333332',
  '3333333333333332',
  '3333333333333332',
  '3333333433333332',
  '3333333333333332',
  '3333333333333332',
  '3333333333333332',
  '3333333333333332',
  '3333333333333332',
  '3333333333333332',
  '3333333333333332',
  '3333333333333332',
  '3333333333333332',
  '3333333333333332',
  '2222222222222222',
]

export const floorB = [
  '3333333233333332',
  '3333333233333332',
  '3333333233333332',
  '3333333333333332',
  '3333333233333332',
  '3333333233333332',
  '3333333233333332',
  '2222222222222222',
  '3333333333333332',
  '3333333333333332',
  '3333333333343332',
  '3333333333333332',
  '3333333333333332',
  '3333333333333332',
  '3333333333333332',
  '2222222222222222',
]

export const floorC = [
  '3333333333333332',
  '3333333333333332',
  '3333333333333332',
  '3332333333333332',
  '3333233333333332',
  '3333323333333332',
  '3333333333333332',
  '3333333333333332',
  '3333333333333332',
  '3333333333333332',
  '3333333333333332',
  '3333333333334332',
  '3333333333333332',
  '3333333333333332',
  '3333333333333332',
  '2222222222222222',
]

export const wallTop = [
  '2222222122222222',
  '2222222122222222',
  '2222222122222222',
  '2222222122222222',
  '2222222122222222',
  '2222222122222222',
  '2222222122222222',
  '1111111111111111',
  '2222222222222221',
  '2222222222222221',
  '2222222222222221',
  '2222222222222221',
  '2222222222222221',
  '2222222222222221',
  '2222222222222221',
  '1111111111111111',
]

export const wallFace = [
  '6666666666666666',
  '5555555555555555',
  '1111111111111111',
  '5444444254444442',
  '4333333243333332',
  '4333333243333332',
  '2222222222222222',
  '4442544444425444',
  '3332433333324333',
  '3332433333324333',
  '2222222222222222',
  '5444444254444442',
  '4333333243333332',
  '2222222222222222',
  '1111111111111111',
  '1111111111111111',
]

export const pit = [
  '0000000000000000',
  '0000000000000000',
  '000k00000000k000',
  '0000000000000000',
  '0000000k00000000',
  '0000000000000000',
  '00k000000000000k',
  '0000000000000000',
  '000000000k000000',
  '0000000000000000',
  '0k00000000000000',
  '00000000000k0000',
  '0000000000000000',
  '00000k0000000000',
  '0000000000000000',
  '0000000000000000',
]

export const pitEdge = [
  '3333333333333333',
  '2222222222222222',
  '1111111111111111',
  '1111111111111111',
  '0101110101101110',
  '0000100000010000',
  '0000000000000000',
  '0000000k00000000',
  '0000000000000000',
  '000k000000000000',
  '0000000000000k00',
  '0000000000000000',
  '0000000000000000',
  '000000k000000000',
  '0000000000000000',
  '0000000000000000',
]

export const pillarSunk = [
  '1111111111111111',
  '1000000000000001',
  '1000000000000001',
  '1000000000000001',
  '100kkkkkkkkkk001',
  '100k33333333k001',
  '100k32222223k001',
  '100k3222@222k001',
  '100k322@&@22k001',
  '100k3222@222k001',
  '100k32222222k001',
  '100kkkkkkkkkk001',
  '1000000000000001',
  '1000000000000001',
  '1000000000000001',
  '1111111111111111',
]

export const pillarRaised = [
  '6666666666666665',
  '6555555555555554',
  '6544444444444443',
  '6543333333333443',
  '6543444444443443',
  '6543433333343443',
  '6543433333343443',
  '6543433333343443',
  '6543433333343443',
  '6543433333343443',
  '6543422222243443',
  '6543333333333443',
  '6544444444444443',
  '5444444444444443',
  '3333333333333332',
  '1111111111111111',
]

export const ash = [
  '4444444244444442',
  '4333333243333322',
  '433kk33243l33322',
  '43klllk2433kk322',
  '4kllmllk43klk322',
  '4klmmmlkkklllk22',
  '2kklmlkkkllmlk22',
  '2kkllllkllmmllk2',
  '4kSllmlllllmlk44',
  '3klllllllTlllk33',
  '33kkllmllllkk433',
  '3322kkkkllk24333',
  '3322433kk3224333',
  '3322433333224333',
  '2222222222222222',
  '2222222222222222',
]

export const cracked = [
  '3333311111133333',
  '3331155555511333',
  '3315555555544133',
  '3155555455444413',
  '1555551444444441',
  '1555514443444431',
  '1554444411443331',
  '1544414441433331',
  '1544441444133321',
  '1444443414433321',
  '1444433331333221',
  '1344433333332221',
  '3133333333222213',
  '3311222222222133',
  '3333111111111333',
  '2222222222222222',
]

export const rubble = [
  '4444444244444442',
  '4333333243333322',
  '4333553243333322',
  '4335542243355322',
  '4333422243354222',
  '4333333243342222',
  '2225522222222222',
  '2254422222222222',
  '4442244444424444',
  '3322433333224333',
  '3322433554224333',
  '3322435542224333',
  '3355433422224333',
  '3354233333224333',
  '2242222222222222',
  '2222222222222222',
]

export const door = [
  '6666666666666666',
  '5555555555555555',
  '1110000000000111',
  '4420edecedec0244',
  '3320edecedec0233',
  '3320nnnnnnnn0233',
  '2220edecedec0222',
  '4420edecedec0244',
  '3320edecAdec0233',
  '3320edecedec0233',
  '2220edecedec0222',
  '4420edecedec0244',
  '3320nnnnnnnn0233',
  '2220edecedec0222',
  '1110cdcbcdcb0111',
  '1110bbbbbbbb0111',
]

export const doorOpen = [
  '6666666666666666',
  '5555555555555555',
  '1110000000000111',
  '4420e00000000244',
  '3320e00000000233',
  '3320n00000000233',
  '2220e00000000222',
  '4420e0kkkkkk0244',
  '3320ekkkkkkk0233',
  '3320ekkkkkkk0233',
  '2220elllllll0222',
  '4420elllllll0244',
  '3320n11111110233',
  '2220122222220222',
  '1110233333330111',
  '1110333333330111',
]

export const gate = [
  '6666666666666666',
  '5555555555555555',
  '1110000000000111',
  '4420FkFkFkFk0244',
  '3320FkFkFkFk0233',
  '3320EEEEEEEE0233',
  '2220FkFkFkFk0222',
  '4420FkFkFkFk0244',
  '3320FlFlFlFl0233',
  '3320FlFlFlFl0233',
  '2220FlFlFlFl0222',
  '4420EEEEEEEE0244',
  '3320FlFlFlFl0233',
  '2220FmFmFmFm0222',
  '1110F2F2F2F20111',
  '1110E2E2E2E20111',
]

export const gateOpen = [
  '6666666666666666',
  '5555555555555555',
  '1110000000000111',
  '4420EEEEEEEE0244',
  '3320F0F0F0F00233',
  '3320kkkkkkkk0233',
  '2220kkkkkkkk0222',
  '4420llllllll0244',
  '3320llllllll0233',
  '3320222222220233',
  '2220222222220222',
  '4420333333330244',
  '3320333333330233',
  '2220333333330222',
  '1110333333330111',
  '1110333333330111',
]

export const seal = [
  '6666666666666666',
  '5555555555555555',
  '1110000000000111',
  '4420555555550244',
  '3320544444430233',
  '3320544894430233',
  '2220548998430222',
  '4420589449830244',
  '3320589449830233',
  '3320548998430233',
  '2220544894430222',
  '4420544444430244',
  '3320544444430233',
  '2220433333320222',
  '1110222222220111',
  '1110111111110111',
]

export const sealOpen = [
  '6666666666666666',
  '5555555555555555',
  '1110000000000111',
  '4420000000000244',
  '3320000000000233',
  '3320000000000233',
  '2220000000000222',
  '4420kkkkkkkk0244',
  '3320kkkkkkkk0233',
  '3320llllllll0233',
  '2220llllllll0222',
  '4420111111110244',
  '3320222222220233',
  '2220225532220222',
  '1110254413330111',
  '1110333333330111',
]

export const stairs = [
  '1222222222222221',
  '2000000000000002',
  '2000000000000002',
  '20kkkkkkkkkkkk02',
  '20k1111111111k02',
  '2000000000000002',
  '20kkkkkkkkkkkk02',
  '20k2222222222k02',
  '2011111111111102',
  '2000000000000002',
  '2kkkkkkkkkkkkkk2',
  '2k333333333333k2',
  '2122222222222212',
  '2111111111111112',
  '2444444444444442',
  '3333333333333333',
]

export const barricade = [
  '3333333333333333',
  '3c33c3333c33c333',
  'cfc0ff0cc0ffc0c3',
  'cfcfhfdcffhfcfc3',
  'dfdffedcfffedfd0',
  '0000000000000000',
  'hfffhfffhfffhfff',
  'eeeeeeeeeeeeeeee',
  'cccccccccccccccc',
  'dfdffedcfffedfd0',
  'dedeedcdeedcded0',
  'hfffhfffhfffhfff',
  'eeeeeeeeeeeeeeee',
  'cccccccccccccccc',
  'dcdcdcbdcdcbdcd0',
  '2222222222222222',
]

export const TEMPLATES: readonly Rows[] = [
  floorA, floorB, floorC, wallTop, wallFace, pit, pitEdge, pillarSunk, pillarRaised, ash, cracked, rubble,
  door, doorOpen, gate, gateOpen, seal, sealOpen, stairs, barricade,
]

export const T_FLOOR_A = 0
export const T_FLOOR_B = 1
export const T_FLOOR_C = 2
export const T_WALL_TOP = 3
export const T_WALL_FACE = 4
export const T_PIT = 5
export const T_PIT_EDGE = 6
export const T_PILLAR_SUNK = 7
export const T_PILLAR_RAISED = 8
export const T_ASH = 9
export const T_CRACKED = 10
export const T_RUBBLE = 11
export const T_DOOR = 12
export const T_DOOR_OPEN = 13
export const T_GATE = 14
export const T_GATE_OPEN = 15
export const T_SEAL = 16
export const T_SEAL_OPEN = 17
export const T_STAIRS = 18
export const T_BARRICADE = 19

const RAMP_SYMBOLS = '123456789'

export const TILESET_RAMPS: readonly string[] = [
  'lmnopquvw',
  'klmnopt%v',
  'mnopqWVXY',
  '0klmnoRST',
  'mopqWWMNO',
  'klDEFpBCa',
  'c@&hqWXYZ',
]

export function paintTemplate(template: Rows, tileset: number): string[] {
  return recolor(template, RAMP_SYMBOLS, TILESET_RAMPS[tileset]!)
}

function speckle(base: string, keys: string, density: number, seed: number): string[] {
  return field(16, 16, (x, y) => {
    const n = noise(x, y, seed)
    return n < density ? keys[Math.floor((n / density) * keys.length)]! : base
  })
}

export const grassA = speckle('v', 'uuw', 0.1, 1)
export const grassB = field(16, 16, (x, y) => {
  const tuft = (x === 4 || x === 11) && (y === 5 || y === 12) ? 'I' : (x === 3 || x === 5 || x === 10 || x === 12) && (y === 6 || y === 13) ? 'w' : ''
  return tuft || (noise(x, y, 2) < 0.1 ? 'u' : 'v')
})
export const grassC = field(16, 16, (x, y) => {
  const n = noise(x, y, 3)
  if ((x === 3 && y === 4) || (x === 12 && y === 10)) return 'U'
  if ((x === 2 && y === 4) || (x === 4 && y === 4) || (x === 3 && y === 3) || (x === 3 && y === 5)) return 'W'
  if ((x === 11 && y === 10) || (x === 13 && y === 10) || (x === 12 && y === 9) || (x === 12 && y === 11)) return 'Q'
  return n < 0.12 ? 'u' : n < 0.18 ? 'w' : 'v'
})
export const roadA = speckle('e', 'dfdh', 0.2, 4)
export const roadB = field(16, 16, (x, y) => {
  const n = noise(x, y, 5)
  if ((y === 4 || y === 11) && x > 1 && x < 14 && n < 0.5) return 'd'
  return n < 0.08 ? 'f' : n < 0.14 ? 'h' : n < 0.2 ? 'd' : 'e'
})

export const tree = [
  'vvvvv0000000vvvv',
  'vvv00tuuuuu00vvv',
  'vv0tuuwwwuuuu0vv',
  'v0tuwwIIwwuuuu0v',
  'v0uwwIIwwwuuut0v',
  '0tuwwwwwwuuuutt0',
  '0tuuwwwwuuuuttt0',
  '0tuuuuuuuuuttss0',
  '0ttuuuuuuuttsss0',
  '0tttuuuuutttsss0',
  'v0tttttttttsss0v',
  'v0sttttttssss00v',
  'vv0sssssssss0uvv',
  'vvv000ssss00uuvv',
  'vvvuuu0cd0uuuvvv',
  'vvvvvuu00uuvvvvv',
]

export const treeB = [
  'vvvvvvv000vvvvvv',
  'vvvvv00uuu00vvvv',
  'vvvv0uwwwuuu0vvv',
  'vvv0uwIIwwuut0vv',
  'vvv0uwwwwuutt0vv',
  'vv0tuuwwuuuttt0v',
  'vv0uwwuuuuwwut0v',
  'v0tuwIIwuuwIwut0',
  'v0tuwwwuuuuwuut0',
  'v0ttuuuuuuuuuts0',
  'v0tttuuuuuuttss0',
  'vv0sttttttttss0v',
  'vvv00ssssssss0vv',
  'vvvvv000cd000uvv',
  'vvvvvuu0cd0uuvvv',
  'vvvvvvuu00uvvvvv',
]

function rockSurface(x: number, y: number, seed: number): string {
  const cx = (x & 8) + 3.5 + ((y >> 3) & 1)
  const cy = (y & 8) + 3.5
  const dx = x - cx
  const dy = y - cy
  const d = dx * dx + dy * dy
  if (d > 20) return d > 26 ? 'k' : 'l'
  const n = noise(x, y, seed)
  const light = dx + dy
  if (light < -3 || (light < -1 && n < 0.3)) return 'o'
  if (light > 3) return n < 0.3 ? 'l' : 'm'
  return n < 0.12 ? 'm' : 'n'
}

export const rockTop = field(16, 16, (x, y) => rockSurface(x, y, 11))

export const rockFace = field(16, 16, (x, y) => {
  if (y < 3) return rockSurface(x, y, 12)
  if (y === 3) return noise(x, y, 13) < 0.3 ? 'n' : 'o'
  if (y >= 15) return 'k'
  if (y === 14) return 'l'
  if ((x === 3 && y < 11) || (x === 9 && y > 5) || (x === 13 && y > 3 && y < 9)) return 'l'
  return noise(x, y, 14) < 0.18 ? 'n' : 'm'
})

function waterFrame(seed: number, edge: boolean): string[] {
  return field(16, 16, (x, y) => {
    if (edge && y === 0) return 'O'
    if (edge && y === 1) return (x + seed) % 4 === 0 ? 'P' : 'N'
    if (edge && y === 2) return 'M'
    const wave = (x + y * 2 + seed * 3) % 9
    const row = (y + seed) % 6
    if (row === 1 && wave < 3) return 'N'
    if (row === 4 && (wave + 4) % 9 < 2) return 'O'
    return noise(x, y, 7) < 0.25 ? 'L' : 'M'
  })
}

export const waterA = waterFrame(0, false)
export const waterB = waterFrame(1, false)
export const waterEdgeA = waterFrame(0, true)
export const waterEdgeB = waterFrame(1, true)

export const ice = field(16, 16, (x, y) => {
  if ((x + y === 9 && x > 2 && x < 9) || (x - y === 3 && y > 8 && y < 13)) return 'P'
  if (x + y === 10 && x > 3 && x < 8) return 'W'
  const n = noise(x, y, 8)
  return n < 0.1 ? 'N' : n < 0.4 ? 'P' : 'O'
})

function lavaFrame(seed: number): string[] {
  return field(16, 16, (x, y) => {
    const v = noise(x >> 1, y >> 1, 9 + seed)
    const vein = (x * 3 + y * 5 + seed * 4) % 13
    if (vein === 0 || v > 0.86) return 'U'
    if (v > 0.66 || vein === 1) return 'A'
    if (v > 0.3) return 'T'
    return v > 0.12 ? 'S' : 'R'
  })
}

export const lavaA = lavaFrame(0)
export const lavaB = lavaFrame(1)

export const bridge = [
  '0cccccccccccccc0',
  'dffhffffhfffffhd',
  'deeeeeeeeeeeeeed',
  'dccccccccccccccd',
  'dfffffhffffhfffd',
  'deeeeeeeeeeeeeed',
  'dccccccccccccccd',
  'dhffffffhfffffhd',
  'deeeeeeeeeeeeeed',
  'dccccccccccccccd',
  'dfffhfffffffhffd',
  'deeeeeeeeeeeeeed',
  'dccccccccccccccd',
  'dffffhfffffhfffd',
  'deeeeeeeeeeeeeed',
  '0cccccccccccccc0',
]

export const roof = [
  'fhhffhhffhhffhhf',
  'effeeffeeffeeffe',
  'deedfeedfeedfeed',
  'cddcddddcddcdddd',
  'hffhhffhhffhhffh',
  'feeffeeffeeffeef',
  'eddeeddeeddeedde',
  'dcddcddddcddcddd',
  'fhhffhhffhhffhhf',
  'effeeffeeffeeffe',
  'deedfeedfeedfeed',
  'cddcddddcddcdddd',
  'hffhhffhhffhhffh',
  'feeffeeffeeffeef',
  'eddeeddeeddeedde',
  'dcddcddddcddcddd',
]

export const houseFront = [
  'cbbbbbbbbbbbbbbc',
  'hhhhhhhhhhhhhhhh',
  'cccccccccccccccc',
  'qqdqqqqqqqqqdqqq',
  'qqdqq0000qqqdqqq',
  'qqdq0AUAU0qqdqqq',
  'ddddd0AUA0dddddd',
  'qqdq0UAUA0qqdqqq',
  'qqdqq0000qqqdqqq',
  'qqdqqccccqqqdqqq',
  'qqdqqqqqqqqqdqqq',
  'dddddddddddddddd',
  'qpdqppqqpqqpdqpq',
  'qqdqqqqqqqqqdqqq',
  'cccccccccccccccc',
  'bbbbbbbbbbbbbbbb',
]

export const houseDoor = [
  'cbbbbbbbbbbbbbbc',
  'hhhhhhhhhhhhhhhh',
  'cccccccccccccccc',
  'qqdqqq0000qqdqqq',
  'qqdqq0dedd0qdqqq',
  'qqdq0ddeded0dqqq',
  'ddddd0edede0dddd',
  'qqdqq0ddedd0dqqq',
  'qqdqq0dedAd0dqqq',
  'qqdqq0ededd0dqqq',
  'qqdqq0ddede0dqqq',
  'dddd0deddedd0ddd',
  'qpdq0dedeedd0dqq',
  'qqdq0ededded0dqq',
  'cccc0cccccccc0cc',
  'bbbbbbbbbbbbbbbb',
]


export const voidTile = field(16, 16, () => 'x')

export const chasm = field(16, 16, (x, y) => {
  const n = noise(x, y, 11)
  return n < 0.03 ? 'L' : n < 0.12 ? 'J' : 'x'
})

export const chasmEdge = field(16, 16, (x, y) => {
  if (y === 0) return 'n'
  if (y === 1) return 'm'
  if (y === 2) return x % 5 === 0 ? 'k' : 'l'
  if (y === 3) return x % 3 === 0 ? 'l' : 'k'
  if (y === 4) return x % 2 === 0 ? 'k' : '0'
  if (y === 5) return '0'
  const n = noise(x, y, 11)
  return n < 0.03 ? 'L' : n < 0.12 ? 'J' : 'x'
})
