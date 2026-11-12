import { HORN_TARGET_SHIFT, SOCKET_RUNE_SHIFT } from './content.ts'

export const INTERACT_RANGE = 20
export const GRAPPLE_MIN_RANGE = 24
export const GRAPPLE_RANGE = 112
export const PICKUP_RANGE = 12
export const TRIGGER_RANGE = 14
export const WAYSTONE_RANGE = 14
export const WAYSTONE_REARM_RANGE = 32
export const FORGE_RANGE = 28
export const SWITCH_RANGE = 12
export const WINDMILL_PAD = 16
export const SEAL_RANGE = 96
export const STRIKE_PAD = 6
export const HORSE_CALL_OFFSET = 20
export const SHRINE_CHEST_DY = -64
export const HORN_MELODY_MASK = (1 << HORN_TARGET_SHIFT) - 1
export const HORN_TARGET_MASK = 255
export const SOCKET_INDEX_MASK = (1 << SOCKET_RUNE_SHIFT) - 1
