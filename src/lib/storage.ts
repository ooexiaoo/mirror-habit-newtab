const CHROME_NAMESPACE = 'chrome'

interface StorageArea {
  get(keys: string | string[] | null): Promise<Record<string, unknown>>
  set(items: Record<string, unknown>): Promise<void>
  remove(keys: string | string[]): Promise<void>
}

interface StorageChange {
  oldValue?: unknown
  newValue?: unknown
}

interface ChromeRuntime {
  lastError?: { message?: string }
}

interface ChromeIdentity {
  getRedirectURL(path?: string): string
  launchWebAuthFlow(
    details: { url: string; interactive?: boolean },
    callback: (responseUrl?: string) => void,
  ): void
}

export interface ChromeApi {
  runtime?: ChromeRuntime
  storage?: {
    sync?: StorageArea
    local?: StorageArea
    onChanged?: {
      addListener(listener: (changes: Record<string, StorageChange>, areaName: string) => void): void
      removeListener(listener: (changes: Record<string, StorageChange>, areaName: string) => void): void
    }
  }
  identity?: ChromeIdentity
}

declare global {
  const chrome: ChromeApi | undefined
}

const getChrome = (): ChromeApi | undefined =>
  (globalThis as unknown as Record<string, ChromeApi | undefined>)[CHROME_NAMESPACE]

export const hasChromeStorage = (): boolean => {
  const api = getChrome()
  return Boolean(api?.storage?.sync && api?.storage?.local)
}

const syncArea = (): StorageArea | undefined => getChrome()?.storage?.sync

const localArea = (): StorageArea | undefined => getChrome()?.storage?.local

export const chromeIdentity = (): ChromeIdentity | undefined => getChrome()?.identity

export const chromeStorageChanges = (
  listener: (changes: Record<string, StorageChange>, areaName: string) => void,
): (() => void) => {
  const api = getChrome()
  if (!api?.storage?.onChanged) return () => undefined
  api.storage.onChanged.addListener(listener)
  return () => api.storage?.onChanged?.removeListener(listener)
}

const readFallback = (key: string): unknown => {
  try {
    const raw = window.localStorage.getItem(`mirror-habit-newtab:${key}`)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

const writeFallback = (key: string, value: unknown): void => {
  try {
    window.localStorage.setItem(`mirror-habit-newtab:${key}`, JSON.stringify(value))
  } catch {
    // Storage full or unavailable. The in-memory UI still works for this session.
  }
}

const removeFallback = (key: string): void => {
  try {
    window.localStorage.removeItem(`mirror-habit-newtab:${key}`)
  } catch {
    // Ignore storage access failures.
  }
}

export async function getSync<T>(key: string, fallback: T): Promise<T> {
  const area = syncArea()
  if (area) {
    try {
      const result = await area.get(key)
      if (result[key] !== undefined) return result[key] as T
    } catch {
      // Fall through to local preview storage.
    }
  }
  return (readFallback(key) as T | undefined) ?? fallback
}

export async function setSync(key: string, value: unknown): Promise<void> {
  writeFallback(key, value)
  const area = syncArea()
  if (!area) return
  try {
    await area.set({ [key]: value })
  } catch {
    // localStorage already holds a preview copy.
  }
}

export async function getLocal<T>(key: string, fallback: T): Promise<T> {
  const area = localArea()
  if (area) {
    try {
      const result = await area.get(key)
      if (result[key] !== undefined) return result[key] as T
    } catch {
      // Fall through to local preview storage.
    }
  }
  return (readFallback(key) as T | undefined) ?? fallback
}

export async function setLocal(key: string, value: unknown): Promise<void> {
  writeFallback(key, value)
  const area = localArea()
  if (!area) return
  try {
    await area.set({ [key]: value })
  } catch {
    // localStorage already holds a preview copy.
  }
}

export async function removeLocal(key: string): Promise<void> {
  removeFallback(key)
  const area = localArea()
  if (!area) return
  try {
    await area.remove(key)
  } catch {
    // Ignore.
  }
}

export async function getLocalRaw(key: string): Promise<string | null> {
  const area = localArea()
  if (area) {
    try {
      const result = await area.get(key)
      const value = result[key]
      if (typeof value === 'string') return value
    } catch {
      // Fall through.
    }
  }
  try {
    return window.localStorage.getItem(`mirror-habit-newtab:${key}`)
  } catch {
    return null
  }
}

export async function setLocalRaw(key: string, value: string): Promise<void> {
  const area = localArea()
  if (area) {
    try {
      await area.set({ [key]: value })
    } catch {
      // Fall through.
    }
  }
  try {
    window.localStorage.setItem(`mirror-habit-newtab:${key}`, value)
  } catch {
    // Ignore.
  }
}

export async function removeLocalRaw(key: string): Promise<void> {
  const area = localArea()
  if (area) {
    try {
      await area.remove(key)
    } catch {
      // Ignore.
    }
  }
  try {
    window.localStorage.removeItem(`mirror-habit-newtab:${key}`)
  } catch {
    // Ignore.
  }
}
