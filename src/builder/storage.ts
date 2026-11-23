import { useMemo, useSyncExternalStore } from 'react'
import { EMPTY_PAGE, parsePage, type PageConfig } from './model'
import { starterPage } from './presets'

const STORAGE_KEY = 'portfolio-builder:v1'

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function toPage(raw: string | null): PageConfig {
  if (raw === null) return starterPage()
  try {
    return parsePage(JSON.parse(raw))
  } catch {
    return EMPTY_PAGE
  }
}

export function readPage(): PageConfig {
  return toPage(readRaw())
}

export function writePage(page: PageConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(page))
  } catch {
    return
  }
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) onChange()
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}

export function useSavedPage(): PageConfig {
  const raw = useSyncExternalStore(subscribe, readRaw)
  return useMemo(() => toPage(raw), [raw])
}
