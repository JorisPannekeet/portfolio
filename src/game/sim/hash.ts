import type { State } from './state.ts'

type CountField = 'enemyCount' | 'shotCount' | 'bulletCount' | 'gemCount' | 'droneCount' | 'poiCount' | 'propCount'

const ENEMY_FIELDS = ['eType', 'ex', 'ey', 'epx', 'epy', 'eHp', 'eFlash', 'eId', 'eMaxHp', 'eKx', 'eKy', 'eDroneReady', 'eAim', 'eReload']
const SHOT_FIELDS = ['sKind', 'sx', 'sy', 'spx', 'spy', 'svx', 'svy', 'sLife', 'sDamage', 'sPierce', 'sRadius', 'sArea', 'sLastHit', 'sTarget', 'sTargetId', 'sSeq']
const BULLET_FIELDS = ['bKind', 'bx', 'by', 'bpx', 'bpy', 'bvx', 'bvy', 'bAge']
const GEM_FIELDS = ['gKind', 'gx', 'gy', 'gValue', 'gAttract']
const DRONE_FIELDS = ['droneX', 'droneY', 'dronePx', 'dronePy']
const POI_FIELDS = ['poiKind', 'poiZone', 'poiDone', 'poiX', 'poiY', 'poiProgress', 'poiCharge', 'poiGuard']
const PROP_FIELDS = ['propKind', 'propX', 'propY']
const SCRATCH_PREFIX = 'scratch'

const countFieldOf: Record<string, CountField> = {}
for (const key of ENEMY_FIELDS) countFieldOf[key] = 'enemyCount'
for (const key of SHOT_FIELDS) countFieldOf[key] = 'shotCount'
for (const key of BULLET_FIELDS) countFieldOf[key] = 'bulletCount'
for (const key of GEM_FIELDS) countFieldOf[key] = 'gemCount'
for (const key of DRONE_FIELDS) countFieldOf[key] = 'droneCount'
for (const key of POI_FIELDS) countFieldOf[key] = 'poiCount'
for (const key of PROP_FIELDS) countFieldOf[key] = 'propCount'

const FNV_OFFSET = 0x811c9dc5
const FNV_PRIME = 0x01000193

const numberScratch = new Float64Array(1)
const numberBytes = new Uint8Array(numberScratch.buffer)

function mixBytes(hash: number, bytes: Uint8Array): number {
  let h = hash
  for (let i = 0; i < bytes.length; i++) h = Math.imul(h ^ bytes[i]!, FNV_PRIME)
  return h
}

export function hashState(s: State): number {
  const fields = s as unknown as Record<string, unknown>
  let h = FNV_OFFSET
  for (const key of Object.keys(fields)) {
    if (key.startsWith(SCRATCH_PREFIX)) continue
    const value = fields[key]
    if (typeof value === 'number') {
      numberScratch[0] = value
      h = mixBytes(h, numberBytes)
      continue
    }
    if (!ArrayBuffer.isView(value)) continue
    const view = value as Uint8Array
    const countField = countFieldOf[key]
    const count = countField === undefined ? view.length : s[countField]
    h = mixBytes(h, new Uint8Array(view.buffer, view.byteOffset, count * view.BYTES_PER_ELEMENT))
  }
  return h >>> 0
}
