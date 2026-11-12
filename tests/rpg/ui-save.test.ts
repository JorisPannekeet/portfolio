import { test } from 'node:test'
import assert from 'node:assert/strict'
import { HERO_NAME_MAX, SAVE_KEY, cleanHeroName, readSave, writeSave, type SaveStore } from '../../src/rpg/ui/save.ts'

function memoryStore(): SaveStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) }
}

test('a written save reads back with its name and progress', () => {
  const store = memoryStore()
  assert.equal(writeSave(store, { name: 'Wren', progress: 'abc123' }), true)
  assert.deepEqual(readSave(store, 'Aldric'), { name: 'Wren', progress: 'abc123' })
})

test('missing storage, empty slots and empty progress yield no save', () => {
  assert.equal(readSave(null, 'Aldric'), null)
  assert.equal(readSave(memoryStore(), 'Aldric'), null)
  const store = memoryStore()
  assert.equal(writeSave(store, { name: 'Wren', progress: '' }), false)
  assert.equal(store.data.size, 0)
})

test('garbage in storage is rejected without throwing', () => {
  for (const raw of ['', 'not json', '{', 'null', '42', '"text"', '[]', '{}', '{"v":2,"name":"a","progress":"x"}', '{"v":1,"name":"a","progress":7}', '{"v":1,"name":"a","progress":""}']) {
    const store = memoryStore()
    store.data.set(SAVE_KEY, raw)
    assert.equal(readSave(store, 'Aldric'), null, raw)
  }
})

test('a bad name falls back to the default and long names are cut', () => {
  const store = memoryStore()
  store.data.set(SAVE_KEY, JSON.stringify({ v: 1, name: 9, progress: 'p' }))
  assert.equal(readSave(store, 'Aldric')?.name, 'Aldric')
  assert.equal(cleanHeroName('   ', 'Aldric'), 'Aldric')
  assert.equal(cleanHeroName('a\u0000b\nc', 'Aldric'), 'abc')
  assert.equal(cleanHeroName('x'.repeat(40), 'Aldric').length, HERO_NAME_MAX)
})

test('a storage that throws never breaks reading or writing', () => {
  const broken: SaveStore = {
    getItem() { throw new Error('denied') },
    setItem() { throw new Error('quota') },
  }
  assert.equal(readSave(broken, 'Aldric'), null)
  assert.equal(writeSave(broken, { name: 'a', progress: 'p' }), false)
})
