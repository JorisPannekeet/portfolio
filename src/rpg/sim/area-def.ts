import type { FlagName } from './flags.ts'

export interface Cell {
  readonly tile?: number
  readonly obj?: number
  readonly arg?: number
  readonly data?: number
  readonly flag?: FlagName
  readonly argFlag?: FlagName
  readonly enemy?: number
  readonly elite?: number
  readonly night?: number
  readonly boss?: number
  readonly minChapter?: number
  readonly maxChapter?: number
  readonly variant?: number
  readonly spawn?: number
}

export interface AreaDef {
  readonly id: number
  readonly floor: number
  readonly outdoor: number
  readonly horse: number
  readonly bossFlag?: FlagName
  readonly corruptFlag?: FlagName
  readonly waystoneSpawn: number
  readonly legend: Readonly<Record<string, Cell>>
  readonly rows: readonly string[]
}
