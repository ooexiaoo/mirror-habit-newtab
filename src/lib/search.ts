import { getSearchEngine, SEARCH_ENGINES, type SearchEngineId } from './settings'

export function resolveSearchUrl(engineId: SearchEngineId, customUrl: string, query: string): string {
  const engine = getSearchEngine(engineId)
  const template = engineId === 'custom' ? customUrl.trim() : engine.template
  const encoded = encodeURIComponent(query)
  if (!template || !template.includes('%s')) {
    return `https://www.google.com/search?q=${encoded}`
  }
  return template.replace('%s', encoded)
}

export function openSearch(engineId: SearchEngineId, customUrl: string, query: string): void {
  const trimmed = query.trim()
  if (!trimmed) return
  window.location.assign(resolveSearchUrl(engineId, customUrl, trimmed))
}

export function isValidCustomSearchUrl(value: string): boolean {
  const template = value.trim()
  if (!template.includes('%s')) return false
  try {
    const parsed = new URL(template.replace('%s', 'query'))
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export { SEARCH_ENGINES }
