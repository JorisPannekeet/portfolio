import { outlined, pad, recolor, stack, type Rows } from './paint.ts'

const headSide = [
  '...dddd....',
  '..deeffd...',
  '.deeffffe..',
  '.deeeiiii..',
  '.deeii0ii..',
  '.ddeiiiii..',
  '..ddjjjj...',
]

const headFront = [
  '...dddd....',
  '..deffed...',
  '.deffffed..',
  '.dfiiiied..',
  '.di0ii0id..',
  '.deiiiied..',
  '..djjjjd...',
]

const headBack = [
  '...dddd....',
  '..deffed...',
  '.deffffed..',
  '.deeffeed..',
  '.deeeeeed..',
  '.ddeeeedd..',
  '..ddddd....',
]

const torsoSide = [
  '...FFMMN...',
  '..FEFMMMN..',
  '..EELLMMM..',
  '...bLLiAb..',
  '...LMMMML..',
]

const torsoFront = [
  '.FFNMMNFF..',
  '.FENMMMEF..',
  '.EiLMMMLiE.',
  '..ibbAbbi..',
  '..LMMMMML..',
]

const torsoBack = [
  '.FFLLLLFF..',
  '.FELLLLEF..',
  '.ELLMMLLE..',
  '..ibbbbi...',
  '..LMMMML...',
]

const torsoReach = [
  '...FFMMN...',
  '..FEFMMMN..',
  '..EELMMMMii',
  '...bLLLAb..',
  '...LMMMML..',
]

const torsoWind = [
  '.i.FFMMN...',
  '.iLEFMMMN..',
  '..LELLMMM..',
  '...bLLLAb..',
  '...LMMMML..',
]

const legsStand = [
  '...DDDD....',
  '...DD.DD...',
  '...DD.DD...',
  '..ccc.ccc..',
]

const legsStepA = [
  '...DDDD....',
  '..DD..DD...',
  '.DD....DD..',
  'ccc....ccc.',
]

const legsPass = [
  '...DDDD....',
  '....DDD....',
  '....DD.....',
  '...cccc....',
]

const legsStepB = [
  '...DDDD....',
  '...DD.DD...',
  '..DD...DD..',
  '.ccc...ccc.',
]

const legsFrontA = [
  '..DDDDD....',
  '..DD.DD....',
  '..DD..c....',
  '..cc.......',
]

const legsFrontStand = [
  '..DDDDD....',
  '..DD.DD....',
  '..DD.DD....',
  '..cc.cc....',
]

const legsGuard = [
  '...DDDD....',
  '..DD..DD...',
  '..DD...DD..',
  '.ccc...ccc.',
]

function frame(...parts: Rows[]): string[] {
  return outlined(pad(stack(...parts), 1, 1, 13, 18))
}

function bob(rows: Rows): string[] {
  return outlined(pad(rows, 1, 2, 13, 18))
}

const roll = [
  '...........',
  '...........',
  '...........',
  '...........',
  '...........',
  '...dddd....',
  '..deeffd...',
  '.dFFeeMMN..',
  '.FEFMMMMMN.',
  '.EEiLMMMMM.',
  '.ELLbbAbLM.',
  '.DDLMMMMLD.',
  '..DDDccDD..',
  '...ccc.....',
  '...........',
  '...........',
]

const rollB = [
  '...........',
  '...........',
  '...........',
  '...........',
  '...........',
  '...MMMN....',
  '..MLMMMN...',
  '.cMLLbbDD..',
  '.cDLMMMMDD.',
  '.DDbAMMiFE.',
  '.DDbLLMFFE.',
  '.LMMdeeffd.',
  '..MMdeefd..',
  '...dddd....',
  '...........',
  '...........',
]

const fallen = [
  '...........',
  '...........',
  '...........',
  '...........',
  '...........',
  '...........',
  '...........',
  '...........',
  '...........',
  '...........',
  '..ddd......',
  '.deefFMMbD.',
  '.dei0EMMbDD',
  '.dijjELLbcc',
  '...........',
  '...........',
]

const mountedLegs = [
  '...DDDDc...',
  '....DDcc...',
  '...........',
  '...........',
]

export const aldricSideIdle = frame(headSide, torsoSide, legsStand)
export const aldricSideBreath = bob(stack(headSide, torsoSide, legsStand.slice(0, 3)))
export const aldricSideWalkA = frame(headSide, torsoSide, legsStepA)
export const aldricSideWalkB = bob(stack(headSide, torsoSide, legsPass.slice(0, 3)))
export const aldricSideWalkC = frame(headSide, torsoSide, legsStepB)
export const aldricSideWalkD = bob(stack(headSide, torsoSide, legsPass.slice(0, 3)))
export const aldricWindup = frame(headSide, torsoWind, legsGuard)
export const aldricStrike = frame(headSide, torsoReach, legsStepA)
export const aldricGuard = frame(headSide, torsoReach, legsGuard)
export const aldricRollA = frame(roll)
export const aldricRollB = frame(rollB)
export const aldricHurt = frame(headSide.map(row => '.' + row.slice(0, -1)), torsoSide, legsGuard)
export const aldricDead = frame(fallen)
export const aldricBow = frame(headSide, torsoReach, legsGuard)
export const aldricMounted = frame(headSide, torsoSide, mountedLegs)
export const aldricFrontIdle = frame(headFront, torsoFront, legsFrontStand)
export const aldricFrontWalk = frame(headFront, torsoFront, legsFrontA)
export const aldricBackIdle = frame(headBack, torsoBack, legsFrontStand)
export const aldricBackWalk = frame(headBack, torsoBack, legsFrontA)

export const ALDRIC_FRAMES: readonly Rows[] = [
  aldricSideIdle, aldricSideBreath, aldricSideWalkA, aldricSideWalkB, aldricSideWalkC, aldricSideWalkD,
  aldricWindup, aldricStrike, aldricGuard, aldricRollA, aldricRollB, aldricHurt, aldricDead, aldricBow, aldricMounted,
  aldricFrontIdle, aldricFrontWalk, aldricBackIdle, aldricBackWalk,
]

const ELDER_FROM = 'defjMLN'
const ELDER_TO = 'mnooEDF'
const ELDER_STRETCH_ROW = 10

export function elder(rows: Rows): string[] {
  const grown = recolor(rows, ELDER_FROM, ELDER_TO)
  return [...grown.slice(0, ELDER_STRETCH_ROW), grown[ELDER_STRETCH_ROW]!, ...grown.slice(ELDER_STRETCH_ROW)]
}
