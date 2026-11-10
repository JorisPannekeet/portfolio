import { INPUT_DIRECTIONS, INPUT_IDLE } from '../sim/content.ts'

export const STICK_DEAD_ZONE = 8

export const KEY_RIGHT = 1
export const KEY_DOWN = 2
export const KEY_LEFT = 4
export const KEY_UP = 8

const HEADING_BY_AXES: readonly number[] = [11, 13, 15, 9, INPUT_IDLE, 1, 7, 5, 3]

export function headingFromKeys(keys: number): number {
  const x = (keys & KEY_RIGHT ? 1 : 0) - (keys & KEY_LEFT ? 1 : 0)
  const y = (keys & KEY_DOWN ? 1 : 0) - (keys & KEY_UP ? 1 : 0)
  return HEADING_BY_AXES[(y + 1) * 3 + x + 1]!
}

export function headingFromVector(dx: number, dy: number, deadZone: number): number {
  if (dx * dx + dy * dy < deadZone * deadZone) return INPUT_IDLE
  const sector = Math.round(Math.atan2(dy, dx) / ((2 * Math.PI) / INPUT_DIRECTIONS))
  return ((sector % INPUT_DIRECTIONS) + INPUT_DIRECTIONS) % INPUT_DIRECTIONS + 1
}

export function keyBit(code: string): number {
  switch (code) {
    case 'KeyD':
    case 'ArrowRight':
      return KEY_RIGHT
    case 'KeyS':
    case 'ArrowDown':
      return KEY_DOWN
    case 'KeyA':
    case 'ArrowLeft':
      return KEY_LEFT
    case 'KeyW':
    case 'ArrowUp':
      return KEY_UP
    default:
      return 0
  }
}
