import {
  ELEMENT_COUNT,
  EV_AREA,
  EV_COUNT,
  EV_DIALOG,
  EV_ENDING,
  EV_FORGE,
  EV_ITEM_GAIN,
  EV_KEY_ITEM,
  EV_LEARN,
  EV_LEVEL_UP,
  EV_SAVE,
  EV_SHARD,
  EV_VIGIL,
  HORN_TARGET_SHIFT,
  INPUT_HEADING_MASK,
  IN_ATTACK,
  IN_DODGE,
  IN_GUARD,
  IN_INTERACT,
  IN_LOCK,
  IN_SKILL,
  IN_STANCE_MASK,
  IN_STANCE_SHIFT,
  SOCKET_RUNE_SHIFT,
} from '../sim/content.ts'

export const BUTTON_MASK = IN_ATTACK | IN_GUARD | IN_DODGE | IN_SKILL | IN_INTERACT | IN_LOCK

export type KeyAction =
  | { kind: 'button'; bit: number }
  | { kind: 'stance'; element: number }
  | { kind: 'ui'; action: 'pause' | 'gear' | 'horn' | 'advance' }

const KEY_ACTIONS: Readonly<Record<string, KeyAction>> = {
  KeyJ: { kind: 'button', bit: IN_ATTACK },
  Space: { kind: 'button', bit: IN_ATTACK },
  KeyK: { kind: 'button', bit: IN_GUARD },
  KeyL: { kind: 'button', bit: IN_DODGE },
  ShiftLeft: { kind: 'button', bit: IN_DODGE },
  ShiftRight: { kind: 'button', bit: IN_DODGE },
  KeyI: { kind: 'button', bit: IN_SKILL },
  KeyQ: { kind: 'button', bit: IN_SKILL },
  KeyE: { kind: 'button', bit: IN_INTERACT },
  KeyF: { kind: 'button', bit: IN_INTERACT },
  Tab: { kind: 'button', bit: IN_LOCK },
  KeyR: { kind: 'button', bit: IN_LOCK },
  Digit1: { kind: 'stance', element: 0 },
  Digit2: { kind: 'stance', element: 1 },
  Digit3: { kind: 'stance', element: 2 },
  Digit4: { kind: 'stance', element: 3 },
  Numpad1: { kind: 'stance', element: 0 },
  Numpad2: { kind: 'stance', element: 1 },
  Numpad3: { kind: 'stance', element: 2 },
  Numpad4: { kind: 'stance', element: 3 },
  KeyH: { kind: 'ui', action: 'horn' },
  KeyC: { kind: 'ui', action: 'gear' },
  KeyB: { kind: 'ui', action: 'gear' },
  Escape: { kind: 'ui', action: 'pause' },
  KeyP: { kind: 'ui', action: 'pause' },
  Enter: { kind: 'ui', action: 'advance' },
}

export function keyAction(code: string): KeyAction | null {
  return KEY_ACTIONS[code] ?? null
}

const MOUSE_BUTTON_BITS: readonly number[] = [IN_ATTACK, 0, IN_GUARD]

export function mouseButtonBit(button: number): number {
  return MOUSE_BUTTON_BITS[button] ?? 0
}

export function encodeInput(heading: number, buttons: number, stanceSelect: number): number {
  return (heading & INPUT_HEADING_MASK) | (buttons & BUTTON_MASK) | ((stanceSelect & IN_STANCE_MASK) << IN_STANCE_SHIFT)
}

export function inputHeading(input: number): number {
  return input & INPUT_HEADING_MASK
}

export function inputButtons(input: number): number {
  return input & BUTTON_MASK
}

export function inputStance(input: number): number {
  return (input >> IN_STANCE_SHIFT) & IN_STANCE_MASK
}

export function socketArg(index: number, element: number): number {
  return index | (element << SOCKET_RUNE_SHIFT)
}

export function hornArg(melody: number, waystone: number): number {
  return melody | (waystone << HORN_TARGET_SHIFT)
}

export function nextStance(current: number, unlocked: number): number {
  for (let offset = 1; offset <= ELEMENT_COUNT; offset++) {
    const element = (current + offset) % ELEMENT_COUNT
    if ((unlocked & (1 << element)) !== 0) return element
  }
  return -1
}

export const UI_EVENTS: readonly number[] = [
  EV_SAVE, EV_ITEM_GAIN, EV_LEVEL_UP, EV_AREA, EV_KEY_ITEM, EV_SHARD, EV_FORGE, EV_LEARN, EV_DIALOG, EV_ENDING, EV_VIGIL,
]

export const UI_EVENT_MASK = new Uint8Array(EV_COUNT)
for (const type of UI_EVENTS) UI_EVENT_MASK[type] = 1
