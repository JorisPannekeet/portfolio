export const SAVE_KEY = 'shards-fourfold-crown-save'
export const SAVE_VERSION = 1
export const HERO_NAME_MAX = 12

export interface SaveStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface SaveData {
  name: string
  progress: string
}

export function cleanHeroName(raw: string, fallback: string): string {
  const name = Array.from(raw).filter(c => c >= ' ' && c !== '\u007f').join('').trim().slice(0, HERO_NAME_MAX)
  return name.length > 0 ? name : fallback
}

export function writeSave(store: SaveStore | null, data: SaveData): boolean {
  if (!store || data.progress.length === 0) return false
  try {
    store.setItem(SAVE_KEY, JSON.stringify({ v: SAVE_VERSION, name: data.name, progress: data.progress }))
    return true
  } catch {
    return false
  }
}

export function readSave(store: SaveStore | null, fallbackName: string): SaveData | null {
  if (!store) return null
  try {
    const raw = store.getItem(SAVE_KEY)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const { v, name, progress } = parsed as Record<string, unknown>
    if (v !== SAVE_VERSION || typeof progress !== 'string' || progress.length === 0) return null
    return { name: cleanHeroName(typeof name === 'string' ? name : '', fallbackName), progress }
  } catch {
    return null
  }
}

export function browserStore(): SaveStore | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}
