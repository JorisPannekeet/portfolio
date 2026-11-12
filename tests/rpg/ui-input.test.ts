import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  BUTTON_MASK,
  UI_EVENTS,
  encodeInput,
  hornArg,
  inputButtons,
  inputHeading,
  inputStance,
  keyAction,
  mouseButtonBit,
  nextStance,
  socketArg,
} from '../../src/rpg/ui/controls.ts'
import { command } from '../../src/rpg/sim/step.hot.ts'
import {
  CMD_COUNT,
  CMD_HORN,
  CMD_SOCKET,
  COMMAND_ARG_MASK,
  COMMAND_OPCODE_MASK,
  COMMAND_OPCODE_SHIFT,
  ELEMENT_EMBER,
  EV_AREA,
  EV_HIT,
  HORN_TARGET_SHIFT,
  IN_ATTACK,
  IN_COMMAND,
  IN_DODGE,
  IN_GUARD,
  IN_INTERACT,
  IN_LOCK,
  IN_SKILL,
  MELODY_ROADS,
  SOCKET_RUNE_SHIFT,
  AREA_SALTREACH,
} from '../../src/rpg/sim/content.ts'

const BUTTONS = [IN_ATTACK, IN_GUARD, IN_DODGE, IN_SKILL, IN_INTERACT, IN_LOCK]

test('heading, every button subset and every stance select round trip through the input word', () => {
  for (let heading = 0; heading <= 16; heading++) {
    for (let subset = 0; subset < 1 << BUTTONS.length; subset++) {
      let buttons = 0
      for (let b = 0; b < BUTTONS.length; b++) if (subset & (1 << b)) buttons |= BUTTONS[b]!
      for (let stance = 0; stance <= 4; stance++) {
        const word = encodeInput(heading, buttons, stance)
        assert.equal(inputHeading(word), heading)
        assert.equal(inputButtons(word), buttons)
        assert.equal(inputStance(word), stance)
        assert.equal(word & IN_COMMAND, 0)
        assert.ok(word < 1 << 16)
      }
    }
  }
})

test('the input word follows the contract bit layout', () => {
  assert.equal(encodeInput(16, 0, 0), 16)
  assert.equal(encodeInput(0, IN_ATTACK, 0), 1 << 5)
  assert.equal(encodeInput(0, IN_LOCK, 0), 1 << 10)
  assert.equal(encodeInput(0, 0, 4), 4 << 11)
  assert.equal(BUTTON_MASK, 0b11111100000)
  assert.equal(encodeInput(0, IN_COMMAND, 0), 0, 'a held button can never forge a command')
})

test('commands put the opcode in bits 10-14 and the argument in bits 0-9', () => {
  for (let opcode = 0; opcode < CMD_COUNT; opcode++) {
    for (const arg of [0, 1, 23, 512, COMMAND_ARG_MASK]) {
      const word = command(opcode, arg)
      assert.notEqual(word & IN_COMMAND, 0)
      assert.equal((word >> COMMAND_OPCODE_SHIFT) & COMMAND_OPCODE_MASK, opcode)
      assert.equal(word & COMMAND_ARG_MASK, arg)
    }
  }
})

test('socket and horn arguments pack their second field', () => {
  const socket = command(CMD_SOCKET, socketArg(23, ELEMENT_EMBER))
  assert.equal(socket & ((1 << SOCKET_RUNE_SHIFT) - 1), 23)
  assert.equal((socket & COMMAND_ARG_MASK) >> SOCKET_RUNE_SHIFT, ELEMENT_EMBER)
  const horn = command(CMD_HORN, hornArg(MELODY_ROADS, AREA_SALTREACH))
  assert.equal(horn & ((1 << HORN_TARGET_SHIFT) - 1), MELODY_ROADS)
  assert.equal((horn & COMMAND_ARG_MASK) >> HORN_TARGET_SHIFT, AREA_SALTREACH)
})

test('the keyboard map matches the brief', () => {
  const button = (code: string) => {
    const action = keyAction(code)
    return action?.kind === 'button' ? action.bit : -1
  }
  for (const code of ['KeyJ', 'Space']) assert.equal(button(code), IN_ATTACK)
  assert.equal(button('KeyK'), IN_GUARD)
  for (const code of ['KeyL', 'ShiftLeft', 'ShiftRight']) assert.equal(button(code), IN_DODGE)
  for (const code of ['KeyI', 'KeyQ']) assert.equal(button(code), IN_SKILL)
  for (const code of ['KeyE', 'KeyF']) assert.equal(button(code), IN_INTERACT)
  for (const code of ['Tab', 'KeyR']) assert.equal(button(code), IN_LOCK)
  for (let n = 1; n <= 4; n++) assert.deepEqual(keyAction(`Digit${n}`), { kind: 'stance', element: n - 1 })
  assert.deepEqual(keyAction('KeyH'), { kind: 'ui', action: 'horn' })
  for (const code of ['KeyC', 'KeyB']) assert.deepEqual(keyAction(code), { kind: 'ui', action: 'gear' })
  for (const code of ['Escape', 'KeyP']) assert.deepEqual(keyAction(code), { kind: 'ui', action: 'pause' })
  assert.equal(keyAction('KeyW'), null, 'movement stays with the shared heading module')
})

test('the stance button cycles through unlocked stances only', () => {
  assert.equal(nextStance(0, 0), -1)
  assert.equal(nextStance(0, 0b0001), 0)
  assert.equal(nextStance(0, 0b0101), 2)
  assert.equal(nextStance(2, 0b0101), 0)
  assert.equal(nextStance(3, 0b1111), 0)
})

test('the loop forwards only the events the UI uses', () => {
  assert.ok(UI_EVENTS.includes(EV_AREA))
  assert.ok(!UI_EVENTS.includes(EV_HIT))
  assert.equal(UI_EVENTS.length, 11)
})

test('on desktop the left mouse button attacks and the right one guards', () => {
  assert.equal(mouseButtonBit(0), IN_ATTACK)
  assert.equal(mouseButtonBit(2), IN_GUARD)
  for (const button of [1, 3, 4, -1]) assert.equal(mouseButtonBit(button), 0)
})
