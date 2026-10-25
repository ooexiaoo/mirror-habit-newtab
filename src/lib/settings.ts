import { getSync, setSync } from './storage'

/**
 * Theme ids: the extension's five in-house scenes, then the app's themes —
 * the same 16 names the app uses, so a synced preference keeps matching.
 */
export type ThemeId =
  | 'paper'
  | 'midnight'
  | 'forest'
  | 'clay'
  | 'system'
  | 'default'
  | 'retro-crt'
  | 'swiss-editorial'
  | 'retro-futurism'
  | 'solo-leveling'
  | 'black-white'
  | 'y2k-terminal'
  | 'tokyo-blackout'
  | 'domain-expansion'
  | 'shonen-arena'
  | 'mecha-terminal'
  | 'sakura-ledger'
  | 'genkai-academy'
  | 'spirit-parchment'
  | 'idol-bright'
  | 'eva-01'
export type LayoutId = 'focus' | 'dashboard'
export type Density = 'compact' | 'comfortable'
export type AccentId = 'ember' | 'moss' | 'ink' | 'rose' | 'gold'
export type BackgroundPreset = 'linen' | 'dune' | 'mist' | 'ember' | 'night' | 'bloom'
export type BackgroundKind = 'preset' | 'solid' | 'image'
export type TemperatureUnit = 'celsius' | 'fahrenheit'
export type SearchEngineId =
  | 'google'
  | 'duckduckgo'
  | 'brave'
  | 'bing'
  | 'ecosia'
  | 'startpage'
  | 'custom'

export interface Accent {
  id: AccentId
  label: string
  value: string
  on: string
}

export interface SearchEngine {
  id: SearchEngineId
  label: string
  template: string
}

export interface WeatherSettings {
  lat: number | null
  lon: number | null
  label: string
  unit: TemperatureUnit
  showFeels: boolean
  showPrecip: boolean
  auto: boolean
}

export interface BackgroundSettings {
  kind: BackgroundKind
  preset: BackgroundPreset
  color: string
  imageUrl: string
  wallpaperId: string
  blur: number
  dim: number
}

export interface Settings {
  version: 1
  onboarded: boolean
  theme: ThemeId
  accent: AccentId
  layout: LayoutId
  density: Density
  background: BackgroundSettings
  showClock: boolean
  showWeather: boolean
  showSearch: boolean
  showProgress: boolean
  showHabits: boolean
  showCompleted: boolean
  showGuildLabels: boolean
  showChallengeBadges: boolean
  showGreeting: boolean
  showWeekRail: boolean
  clock24h: boolean
  reduceMotion: boolean
  searchEngine: SearchEngineId
  customSearchUrl: string
  weather: WeatherSettings
  pinnedHabitIds: string[]
}

export const SETTINGS_KEY = 'mirror-habit-newtab-settings'

export const ACCENTS: Accent[] = [
  { id: 'ember', label: 'Ember', value: '#a35d3a', on: '#fffaf2' },
  { id: 'moss', label: 'Moss', value: '#647a5a', on: '#fbfdf8' },
  { id: 'ink', label: 'Ink', value: '#4d5969', on: '#f9fbfd' },
  { id: 'rose', label: 'Rose', value: '#9f5d64', on: '#fff8f8' },
  { id: 'gold', label: 'Gold', value: '#a57b35', on: '#fffaf0' },
]

export const SEARCH_ENGINES: SearchEngine[] = [
  { id: 'google', label: 'Google', template: 'https://www.google.com/search?q=%s' },
  { id: 'duckduckgo', label: 'DuckDuckGo', template: 'https://duckduckgo.com/?q=%s' },
  { id: 'brave', label: 'Brave Search', template: 'https://search.brave.com/search?q=%s' },
  { id: 'bing', label: 'Bing', template: 'https://www.bing.com/search?q=%s' },
  { id: 'ecosia', label: 'Ecosia', template: 'https://www.ecosia.org/search?q=%s' },
  { id: 'startpage', label: 'Startpage', template: 'https://www.startpage.com/sp/search?query=%s' },
  { id: 'custom', label: 'Custom', template: '' },
]

export const BACKGROUND_PRESETS: { id: BackgroundPreset; label: string }[] = [
  { id: 'linen', label: 'Linen' },
  { id: 'dune', label: 'Dune' },
  { id: 'mist', label: 'Mist' },
  { id: 'ember', label: 'Ember' },
  { id: 'night', label: 'Night' },
  { id: 'bloom', label: 'Bloom' },
]

export const THEMES: { id: ThemeId; label: string; description: string }[] = [
  // The extension's own five moods.
  { id: 'paper', label: 'Warm paper', description: 'Soft ivory and ink' },
  { id: 'midnight', label: 'Midnight', description: 'Low light, quiet focus' },
  { id: 'forest', label: 'Forest', description: 'Deep green and pale sage' },
  { id: 'clay', label: 'Clay', description: 'Sun-baked rose and umber' },
  { id: 'system', label: 'System', description: 'Follows your OS' },
  // The app's themes, same tokens as the app.
  { id: 'default', label: 'App Default', description: 'From the app · warm minimal' },
  { id: 'retro-crt', label: 'Retro CRT', description: 'From the app · phosphor terminal' },
  { id: 'swiss-editorial', label: 'Swiss Editorial', description: 'From the app · brutal print' },
  { id: 'retro-futurism', label: 'Retro Futurism', description: 'From the app · cyber Y2K' },
  { id: 'solo-leveling', label: 'Solo Leveling', description: 'From the app · shadow monarch' },
  { id: 'black-white', label: 'Black & White', description: 'From the app · monochrome' },
  { id: 'y2k-terminal', label: 'Y2K Terminal', description: 'From the app · neon chartreuse' },
  { id: 'tokyo-blackout', label: 'Tokyo Blackout', description: 'From the app · dark crimson' },
  { id: 'domain-expansion', label: 'Domain Expansion', description: 'From the app · cursed energy' },
  { id: 'shonen-arena', label: 'Shonen Arena', description: 'From the app · battle shonen' },
  { id: 'mecha-terminal', label: 'Mecha Terminal', description: 'From the app · NERV HUD' },
  { id: 'sakura-ledger', label: 'Sakura Ledger', description: 'From the app · slice of life' },
  { id: 'genkai-academy', label: 'Genkai Academy', description: 'From the app · school life' },
  { id: 'spirit-parchment', label: 'Spirit Parchment', description: 'From the app · period fantasy' },
  { id: 'idol-bright', label: 'Idol Bright', description: 'From the app · high-energy pop' },
  { id: 'eva-01', label: 'EVA-01', description: 'From the app · Unit-01' },
]

/** The five themes with their own scene + accent handling in this extension. */
export const APP_THEME_IDS = THEMES.slice(5).map((theme) => theme.id)

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  onboarded: false,
  theme: 'paper',
  accent: 'ember',
  layout: 'focus',
  density: 'comfortable',
  background: {
    kind: 'preset',
    preset: 'linen',
    color: '#f3ede2',
    imageUrl: '',
    wallpaperId: '',
    blur: 0,
    dim: 16,
  },
  showClock: true,
  showWeather: true,
  showSearch: true,
  showProgress: true,
  showHabits: true,
  showCompleted: false,
  showGuildLabels: true,
  showChallengeBadges: true,
  showGreeting: true,
  showWeekRail: true,
  clock24h: false,
  reduceMotion: false,
  searchEngine: 'google',
  customSearchUrl: '',
  weather: {
    lat: null,
    lon: null,
    label: '',
    unit: 'celsius',
    showFeels: true,
    showPrecip: false,
    auto: false,
  },
  pinnedHabitIds: [],
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const oneOf = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
  typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback

const numberInRange = (value: unknown, min: number, max: number, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

function normalizeBackground(input: unknown, fallback: BackgroundSettings): BackgroundSettings {
  if (!isRecord(input)) return fallback
  const preset = oneOf(
    input.preset,
    ['linen', 'dune', 'mist', 'ember', 'night', 'bloom'],
    fallback.preset,
  )
  const kind = oneOf(input.kind, ['preset', 'solid', 'image'], fallback.kind)
  return {
    kind,
    preset,
    color: typeof input.color === 'string' ? input.color : fallback.color,
    imageUrl: typeof input.imageUrl === 'string' ? input.imageUrl : fallback.imageUrl,
    wallpaperId: typeof input.wallpaperId === 'string' ? input.wallpaperId : fallback.wallpaperId,
    blur: numberInRange(input.blur, 0, 32, fallback.blur),
    dim: numberInRange(input.dim, 0, 80, fallback.dim),
  }
}

function normalizeWeather(input: unknown, fallback: WeatherSettings): WeatherSettings {
  if (!isRecord(input)) return fallback
  return {
    lat: typeof input.lat === 'number' && Number.isFinite(input.lat) ? input.lat : fallback.lat,
    lon: typeof input.lon === 'number' && Number.isFinite(input.lon) ? input.lon : fallback.lon,
    label: typeof input.label === 'string' ? input.label : fallback.label,
    unit: oneOf(input.unit, ['celsius', 'fahrenheit'], fallback.unit),
    showFeels: typeof input.showFeels === 'boolean' ? input.showFeels : fallback.showFeels,
    showPrecip: typeof input.showPrecip === 'boolean' ? input.showPrecip : fallback.showPrecip,
    auto: typeof input.auto === 'boolean' ? input.auto : fallback.auto,
  }
}

export function normalizeSettings(input: unknown): Settings {
  if (!isRecord(input)) return DEFAULT_SETTINGS
  return {
    version: 1,
    onboarded: typeof input.onboarded === 'boolean' ? input.onboarded : DEFAULT_SETTINGS.onboarded,
    theme: oneOf(
      input.theme,
      THEMES.map((theme) => theme.id),
      DEFAULT_SETTINGS.theme,
    ),
    accent: oneOf(input.accent, ['ember', 'moss', 'ink', 'rose', 'gold'], DEFAULT_SETTINGS.accent),
    layout: oneOf(input.layout, ['focus', 'dashboard'], DEFAULT_SETTINGS.layout),
    density: oneOf(input.density, ['compact', 'comfortable'], DEFAULT_SETTINGS.density),
    background: normalizeBackground(input.background, DEFAULT_SETTINGS.background),
    showClock: typeof input.showClock === 'boolean' ? input.showClock : DEFAULT_SETTINGS.showClock,
    showWeather: typeof input.showWeather === 'boolean' ? input.showWeather : DEFAULT_SETTINGS.showWeather,
    showSearch: typeof input.showSearch === 'boolean' ? input.showSearch : DEFAULT_SETTINGS.showSearch,
    showProgress: typeof input.showProgress === 'boolean' ? input.showProgress : DEFAULT_SETTINGS.showProgress,
    showHabits: typeof input.showHabits === 'boolean' ? input.showHabits : DEFAULT_SETTINGS.showHabits,
    showCompleted: typeof input.showCompleted === 'boolean' ? input.showCompleted : DEFAULT_SETTINGS.showCompleted,
    showGuildLabels: typeof input.showGuildLabels === 'boolean' ? input.showGuildLabels : DEFAULT_SETTINGS.showGuildLabels,
    showChallengeBadges: typeof input.showChallengeBadges === 'boolean' ? input.showChallengeBadges : DEFAULT_SETTINGS.showChallengeBadges,
    showGreeting: typeof input.showGreeting === 'boolean' ? input.showGreeting : DEFAULT_SETTINGS.showGreeting,
    showWeekRail: typeof input.showWeekRail === 'boolean' ? input.showWeekRail : DEFAULT_SETTINGS.showWeekRail,
    clock24h: typeof input.clock24h === 'boolean' ? input.clock24h : DEFAULT_SETTINGS.clock24h,
    reduceMotion: typeof input.reduceMotion === 'boolean' ? input.reduceMotion : DEFAULT_SETTINGS.reduceMotion,
    searchEngine: oneOf(
      input.searchEngine,
      ['google', 'duckduckgo', 'brave', 'bing', 'ecosia', 'startpage', 'custom'],
      DEFAULT_SETTINGS.searchEngine,
    ),
    customSearchUrl: typeof input.customSearchUrl === 'string' ? input.customSearchUrl : DEFAULT_SETTINGS.customSearchUrl,
    weather: normalizeWeather(input.weather, DEFAULT_SETTINGS.weather),
    pinnedHabitIds: Array.isArray(input.pinnedHabitIds)
      ? input.pinnedHabitIds.filter((id): id is string => typeof id === 'string')
      : DEFAULT_SETTINGS.pinnedHabitIds,
  }
}

export async function loadSettings(): Promise<Settings> {
  const stored = await getSync<unknown>(SETTINGS_KEY, null)
  return normalizeSettings(stored)
}

export async function saveSettings(settings: Settings): Promise<void> {
  await setSync(SETTINGS_KEY, settings)
}

export function getAccent(id: AccentId): Accent {
  return ACCENTS.find((accent) => accent.id === id) ?? ACCENTS[0]
}

export function getSearchEngine(id: SearchEngineId): SearchEngine {
  return SEARCH_ENGINES.find((engine) => engine.id === id) ?? SEARCH_ENGINES[0]
}
