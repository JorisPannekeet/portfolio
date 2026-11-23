import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_STYLE, EMPTY_PAGE, createBlock, initialState, parsePage, reduce, safeUrl, type Action, type EditorState } from '../../src/builder/model.ts'

function run(state: EditorState, ...actions: Action[]): EditorState {
  return actions.reduce(reduce, state)
}

const ids = (state: EditorState) => state.page.blocks.map(block => block.id)

const three = run(
  initialState(EMPTY_PAGE),
  { type: 'add', block: createBlock('heading', 'a'), index: 0 },
  { type: 'add', block: createBlock('text', 'b'), index: 1 },
  { type: 'add', block: createBlock('divider', 'c'), index: 2 },
)

test('add inserts at the index and selects the new block', () => {
  const state = reduce(three, { type: 'add', block: createBlock('spacer', 'x'), index: 1 })
  assert.deepEqual(ids(state), ['a', 'x', 'b', 'c'])
  assert.equal(state.selectedId, 'x')
})

test('move reorders using insertion gaps', () => {
  assert.deepEqual(ids(reduce(three, { type: 'move', id: 'c', index: 0 })), ['c', 'a', 'b'])
  assert.deepEqual(ids(reduce(three, { type: 'move', id: 'a', index: 3 })), ['b', 'c', 'a'])
  assert.deepEqual(ids(reduce(three, { type: 'move', id: 'a', index: 2 })), ['b', 'a', 'c'])
  assert.equal(reduce(three, { type: 'move', id: 'b', index: 2 }), three)
})

test('remove clears the selection of the removed block', () => {
  const selected = reduce(three, { type: 'select', id: 'b' })
  const state = reduce(selected, { type: 'remove', id: 'b' })
  assert.deepEqual(ids(state), ['a', 'c'])
  assert.equal(state.selectedId, null)
  assert.equal(reduce(selected, { type: 'remove', id: 'a' }).selectedId, 'b')
})

test('duplicate inserts a copy after the original with the new id', () => {
  const state = reduce(three, { type: 'duplicate', id: 'a', newId: 'a2' })
  assert.deepEqual(ids(state), ['a', 'a2', 'b', 'c'])
  assert.equal(state.selectedId, 'a2')
  assert.deepEqual(state.page.blocks[1]?.props, state.page.blocks[0]?.props)
})

test('patchStyle on one field coalesces into one undo step and undo/redo round-trips', () => {
  const dragged = run(
    three,
    { type: 'patchStyle', id: 'a', style: { background: '#111111' } },
    { type: 'patchStyle', id: 'a', style: { background: '#222222' } },
    { type: 'patchStyle', id: 'a', style: { background: '#333333' } },
  )
  assert.equal(dragged.page.blocks[0]?.style.background, '#333333')
  assert.equal(dragged.past.length, three.past.length + 1)

  const undone = reduce(dragged, { type: 'undo' })
  assert.equal(undone.page.blocks[0]?.style.background, DEFAULT_STYLE.background)
  assert.equal(reduce(undone, { type: 'redo' }).page, dragged.page)

  const twoFields = reduce(dragged, { type: 'patchStyle', id: 'a', style: { font: 'serif' } })
  assert.equal(twoFields.past.length, dragged.past.length + 1)
})

test('patchProps ignores unknown fields and invalid choices', () => {
  const state = reduce(three, { type: 'patchProps', id: 'a', props: { text: 'Hello', level: '9', bogus: 'x' } })
  assert.deepEqual(state.page.blocks[0]?.props, { text: 'Hello', level: '2' })
})

test('history is capped at 50 entries', () => {
  let state = initialState(EMPTY_PAGE)
  for (let i = 0; i < 60; i++) state = reduce(state, { type: 'add', block: createBlock('divider', `d${i}`), index: i })
  assert.equal(state.past.length, 50)
})

test('reset empties the page and can be undone', () => {
  const state = reduce(three, { type: 'reset' })
  assert.deepEqual(state.page.blocks, [])
  assert.deepEqual(ids(reduce(state, { type: 'undo' })), ['a', 'b', 'c'])
})

test('parsePage round-trips a valid page', () => {
  const page = reduce(three, { type: 'patchStyle', id: 'b', style: { background: '#0f172a', font: 'mono', align: 'center' } }).page
  assert.deepEqual(parsePage(JSON.parse(JSON.stringify(page))), page)
})

test('parsePage returns an empty page for garbage', () => {
  for (const raw of [null, 'x', 42, [], { version: 2, blocks: [] }, { version: 1 }, { version: 1, blocks: 'nope' }]) {
    assert.deepEqual(parsePage(raw), EMPTY_PAGE)
  }
})

test('parsePage drops unknown types and duplicate ids, repairs bad style fields', () => {
  const page = parsePage({
    version: 1,
    blocks: [
      { id: 'a', type: 'marquee', props: {}, style: {} },
      { id: 'b', type: 'text', props: { text: 'Hi' }, style: { background: 'red', text: '#ABCDEF', font: 'comic', size: 'lg' } },
      { id: 'b', type: 'text', props: {}, style: {} },
    ],
  })
  assert.equal(page.blocks.length, 1)
  assert.deepEqual(page.blocks[0]?.style, { ...DEFAULT_STYLE, text: '#abcdef', size: 'lg' })
  assert.deepEqual(page.blocks[0]?.props, { text: 'Hi' })
})

test('parsePage keeps a valid block width and falls back to full width', () => {
  const style = (width: unknown) => parsePage({ version: 1, blocks: [{ id: 'a', type: 'text', props: {}, style: { width } }] }).blocks[0]?.style.width
  assert.equal(style('2'), '2')
  assert.equal(style('9'), '4')
  assert.equal(style(undefined), '4')
})

test('parsePage strips a javascript: button URL', () => {
  const page = parsePage({ version: 1, blocks: [{ id: 'a', type: 'button', props: { label: 'Go', url: 'javascript:alert(1)' }, style: {} }] })
  assert.deepEqual(page.blocks[0]?.props, { label: 'Go', url: '' })
})

test('safeUrl allows only http, https, mailto and same-origin paths', () => {
  assert.equal(safeUrl('https://example.com/a'), 'https://example.com/a')
  assert.equal(safeUrl('mailto:me@example.com'), 'mailto:me@example.com')
  assert.equal(safeUrl('/play?x=1#y'), '/play?x=1#y')
  for (const bad of ['javascript:alert(1)', ' JavaScript:alert(1)', 'java\tscript:alert(1)', 'data:text/html,hi', '//evil.com', '/\\evil.com', 'example.com', '']) {
    assert.equal(safeUrl(bad), null, bad)
  }
})
