import { useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import {
  Check,
  ImagePlus,
  Loader2,
  LocateFixed,
  MapPin,
  Search,
  Upload,
} from 'lucide-react'
import {
  ACCENTS,
  BACKGROUND_PRESETS,
  getSearchEngine,
  SEARCH_ENGINES,
  THEMES,
  type AccentId,
  type BackgroundPreset,
  type BackgroundSettings,
  type SearchEngineId,
  type ThemeId,
  type WeatherSettings,
} from '../lib/settings'
import { placeLabel, searchPlaces } from '../lib/weather'
import type { PlaceResult } from '../lib/types'
import { removeWallpaper, saveWallpaper } from '../lib/wallpaper'

export function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="toggle">
      <span className="toggle__copy">
        <span className="toggle__label">{label}</span>
        {description ? <span className="toggle__description">{description}</span> : null}
      </span>
      <input
        className="sr-only"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="toggle__track" aria-hidden="true">
        <span className="toggle__thumb" />
      </span>
    </label>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="segmented__option"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="settings-section">
      <header className="settings-section__head">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </header>
      <div className="settings-section__body">{children}</div>
    </section>
  )
}

const THEME_PREVIEWS: Record<ThemeId, { background: string; surface: string; text: string; accent: string }> = {
  paper: { background: '#f1eadf', surface: '#fffaf2', text: '#2d2821', accent: '#a35d3a' },
  midnight: { background: '#0d0f12', surface: '#181b20', text: '#f0e9dc', accent: '#d7b282' },
  forest: { background: '#111a15', surface: '#1b2a20', text: '#eef3e9', accent: '#a9c092' },
  clay: { background: '#efdbcd', surface: '#fff4ea', text: '#3d261c', accent: '#ab5940' },
  system: { background: 'linear-gradient(135deg, #f1eadf 0 50%, #11151b 50% 100%)', surface: '#fffaf2', text: '#2d2821', accent: '#a35d3a' },
  // The app's themes — preview colors straight from the app's token blocks.
  default: { background: '#faf8f5', surface: '#ffffff', text: '#2d2a24', accent: '#3f4a5a' },
  'retro-crt': { background: '#a9ac8a', surface: '#b4b896', text: '#20230f', accent: '#303517' },
  'swiss-editorial': { background: '#f8f8f7', surface: '#ffffff', text: '#111111', accent: '#000000' },
  'retro-futurism': { background: '#1c1a18', surface: '#24211f', text: '#f4ecd6', accent: '#fff5dd' },
  'solo-leveling': { background: '#05060f', surface: '#0c0f1e', text: '#f2f0ff', accent: '#4b3fc4' },
  'black-white': { background: '#000000', surface: '#111111', text: '#f5f5f5', accent: '#ffffff' },
  'y2k-terminal': { background: '#0d0d0d', surface: '#1a1a1a', text: '#99b300', accent: '#e2ff00' },
  'tokyo-blackout': { background: '#0a0808', surface: '#150f0f', text: '#e8e0e0', accent: '#c41c3c' },
  'domain-expansion': { background: '#08060e', surface: '#100d1c', text: '#f0eeff', accent: '#9b59ff' },
  'shonen-arena': { background: '#1a1a1f', surface: '#24242a', text: '#f0ece4', accent: '#e87c3a' },
  'mecha-terminal': { background: '#0a0a0a', surface: '#141414', text: '#e0e0e0', accent: '#ff6b2b' },
  'sakura-ledger': { background: '#fdf8f4', surface: '#ffffff', text: '#4a3f35', accent: '#e8a0b4' },
  'genkai-academy': { background: '#f5f3ee', surface: '#ffffff', text: '#1a2a3a', accent: '#1e3a5f' },
  'spirit-parchment': { background: '#f0e8d8', surface: '#f8f0e0', text: '#1a1a1a', accent: '#2c3e7a' },
  'idol-bright': { background: '#ffffff', surface: '#fafafa', text: '#2a2040', accent: '#e06090' },
  'eva-01': { background: '#2d1066', surface: '#3a1580', text: '#f0eaff', accent: '#b8ff1a' },
}

export function ThemePicker({
  value,
  onChange,
}: {
  value: ThemeId
  onChange: (theme: ThemeId) => void
}) {
  return (
    <div className="theme-picker">
      {THEMES.map((theme) => {
        const preview = THEME_PREVIEWS[theme.id]
        return (
          <button
            key={theme.id}
            type="button"
            className="theme-card"
            aria-pressed={value === theme.id}
            onClick={() => onChange(theme.id)}
          >
            <span
              className="theme-card__preview"
              style={{
                background: preview.background,
                color: preview.text,
                borderColor: preview.text,
              }}
              aria-hidden="true"
            >
              <span className="theme-card__preview-clock" style={{ color: preview.text }}>
                09:41
              </span>
              <span className="theme-card__preview-line" style={{ background: preview.text }} />
              <span
                className="theme-card__preview-pill"
                style={{ background: preview.surface, borderColor: preview.accent }}
              />
            </span>
            <span className="theme-card__copy">
              <span className="theme-card__title">{theme.label}</span>
              <span className="theme-card__description">{theme.description}</span>
            </span>
            {value === theme.id ? (
              <span className="theme-card__check" aria-hidden="true">
                <Check size={12} strokeWidth={2.4} />
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export function AccentPicker({
  value,
  onChange,
  muted = false,
}: {
  value: AccentId
  onChange: (accent: AccentId) => void
  muted?: boolean
}) {
  return (
    <div className="accent-picker" data-muted={muted} role="group" aria-label="Accent colour">
      {ACCENTS.map((accent) => (
        <button
          key={accent.id}
          type="button"
          className="accent-swatch"
          style={{ background: accent.value, color: accent.on }}
          aria-label={accent.label}
          aria-pressed={value === accent.id}
          onClick={() => onChange(accent.id)}
          title={accent.label}
          disabled={muted}
        >
          {value === accent.id ? <Check size={14} strokeWidth={2.6} aria-hidden="true" /> : null}
        </button>
      ))}
    </div>
  )
}

const PRESET_CLASS: Record<BackgroundPreset, string> = {
  linen: 'bg-swatch--linen',
  dune: 'bg-swatch--dune',
  mist: 'bg-swatch--mist',
  ember: 'bg-swatch--ember',
  night: 'bg-swatch--night',
  bloom: 'bg-swatch--bloom',
}

export function BackgroundPicker({
  background,
  onChange,
  onError,
}: {
  background: BackgroundSettings
  onChange: (background: BackgroundSettings) => void
  onError: (message: string | null) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [url, setUrl] = useState(background.imageUrl)

  const choosePreset = (preset: BackgroundPreset) => {
    onChange({ ...background, kind: 'preset', preset })
    onError(null)
  }

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    onError(null)
    try {
      const previousId = background.wallpaperId
      const id = await saveWallpaper(file)
      onChange({ ...background, kind: 'image', wallpaperId: id, imageUrl: '' })
      if (previousId) void removeWallpaper(previousId)
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not save that image.')
    } finally {
      setUploading(false)
    }
  }

  const useImageUrl = () => {
    const trimmed = url.trim()
    try {
      const parsed = new URL(trimmed)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error()
      onChange({ ...background, kind: 'image', imageUrl: trimmed, wallpaperId: '' })
      onError(null)
    } catch {
      onError('Enter a valid http or https image URL.')
    }
  }

  return (
    <div className="background-picker">
      <div className="bg-grid" role="group" aria-label="Background preset">
        {BACKGROUND_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`bg-swatch ${PRESET_CLASS[preset.id]}`}
            aria-label={preset.label}
            aria-pressed={background.kind === 'preset' && background.preset === preset.id}
            onClick={() => choosePreset(preset.id)}
          >
            <span>{preset.label}</span>
            {background.kind === 'preset' && background.preset === preset.id ? (
              <Check size={13} strokeWidth={2.5} aria-hidden="true" />
            ) : null}
          </button>
        ))}
      </div>

      <div className="background-custom">
        <label className="field field--inline">
          <span className="field__label">Wallpaper</span>
          <span className="field__row">
            <button
              type="button"
              className="button button--quiet button--compact"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="spin" size={14} strokeWidth={1.9} aria-hidden="true" />
              ) : (
                <Upload size={14} strokeWidth={1.8} aria-hidden="true" />
              )}
              {uploading ? 'Saving…' : 'Upload image'}
            </button>
            <input
              ref={fileRef}
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={(event) => void upload(event)}
            />
            {background.kind === 'image' ? (
              <button
                type="button"
                className="button button--ghost button--compact"
                onClick={() => onChange({ ...background, kind: 'preset', wallpaperId: '', imageUrl: '' })}
              >
                Remove
              </button>
            ) : null}
          </span>
        </label>

        <div className="field">
          <label className="field__label" htmlFor="wallpaper-url">
            Or image URL
          </label>
          <div className="field__row">
            <div className="input-wrap">
              <ImagePlus size={14} strokeWidth={1.7} aria-hidden="true" />
              <input
                id="wallpaper-url"
                className="text-input"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://…"
                spellCheck={false}
              />
            </div>
            <button type="button" className="button button--quiet button--compact" onClick={useImageUrl}>
              Use
            </button>
          </div>
        </div>

        <label className="field">
          <span className="field__label">
            Solid base <span className="field__hint">{background.color}</span>
          </span>
          <span className="field__row">
            <input
              className="color-input"
              type="color"
              value={background.color}
              onChange={(event) => onChange({ ...background, kind: 'solid', color: event.target.value })}
              aria-label="Solid background colour"
            />
            <button
              type="button"
              className="button button--ghost button--compact"
              onClick={() => onChange({ ...background, kind: 'solid' })}
            >
              Use solid
            </button>
          </span>
        </label>
      </div>

      <div className="range-row">
        <label className="range-field">
          <span>
            Blur <strong>{background.blur}px</strong>
          </span>
          <input
            type="range"
            min="0"
            max="32"
            value={background.blur}
            onChange={(event) => onChange({ ...background, blur: Number(event.target.value) })}
          />
        </label>
        <label className="range-field">
          <span>
            Dim <strong>{background.dim}%</strong>
          </span>
          <input
            type="range"
            min="0"
            max="80"
            value={background.dim}
            onChange={(event) => onChange({ ...background, dim: Number(event.target.value) })}
          />
        </label>
      </div>
    </div>
  )
}

export function EnginePicker({
  engine,
  customUrl,
  onChange,
  onCustomUrlChange,
}: {
  engine: SearchEngineId
  customUrl: string
  onChange: (engine: SearchEngineId) => void
  onCustomUrlChange: (url: string) => void
}) {
  return (
    <div className="engine-picker">
      <div className="engine-grid" role="group" aria-label="Default search engine">
        {SEARCH_ENGINES.map((option) => (
          <button
            key={option.id}
            type="button"
            className="engine-choice"
            aria-pressed={engine === option.id}
            onClick={() => onChange(option.id)}
          >
            <span className="engine-choice__mark" data-engine={option.id} aria-hidden="true">
              {option.label.slice(0, 1)}
            </span>
            <span>{option.label}</span>
            {engine === option.id ? <Check size={13} strokeWidth={2.3} aria-hidden="true" /> : null}
          </button>
        ))}
      </div>
      {engine === 'custom' ? (
        <label className="field">
          <span className="field__label">
            Custom search URL <span className="field__hint">must include %s</span>
          </span>
          <div className="input-wrap">
            <Search size={14} strokeWidth={1.7} aria-hidden="true" />
            <input
              className="text-input"
              type="url"
              value={customUrl}
              onChange={(event) => onCustomUrlChange(event.target.value)}
              placeholder="https://example.com/search?q=%s"
              spellCheck={false}
            />
          </div>
        </label>
      ) : (
        <p className="field__hint engine-picker__hint">
          Searches with {getSearchEngine(engine).label}. %s is replaced by your query.
        </p>
      )}
    </div>
  )
}

function locationError(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) return 'Location permission was not granted.'
  if (error.code === error.POSITION_UNAVAILABLE) return 'Your location is unavailable right now.'
  return 'Could not get your location. Try a city instead.'
}

export function WeatherLocationPicker({
  weather,
  onChange,
}: {
  weather: WeatherSettings
  onChange: (weather: WeatherSettings) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = async () => {
    if (query.trim().length < 2) return
    setSearching(true)
    setError(null)
    try {
      setResults(await searchPlaces(query))
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not search for that place.')
    } finally {
      setSearching(false)
    }
  }

  const useCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not available in this browser.')
      return
    }
    setLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          ...weather,
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          label: 'Current location',
          auto: true,
        })
        setLocating(false)
        setResults([])
      },
      (nextError) => {
        setError(locationError(nextError))
        setLocating(false)
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 15 * 60 * 1000 },
    )
  }

  return (
    <div className="weather-settings">
      <div className="weather-current">
        <span className="weather-current__icon" aria-hidden="true">
          <MapPin size={16} strokeWidth={1.7} />
        </span>
        <span className="weather-current__copy">
          <strong>{weather.label || 'Add a location'}</strong>
          <span>{weather.lat !== null ? `${weather.lat.toFixed(2)}, ${weather.lon?.toFixed(2)}` : 'Search a city or use your location.'}</span>
        </span>
        <button
          type="button"
          className="button button--quiet button--compact"
          onClick={useCurrentLocation}
          disabled={locating}
        >
          {locating ? (
            <Loader2 className="spin" size={14} strokeWidth={1.8} aria-hidden="true" />
          ) : (
            <LocateFixed size={14} strokeWidth={1.8} aria-hidden="true" />
          )}
          {locating ? 'Locating…' : 'Use mine'}
        </button>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="weather-city">
          Or search a city
        </label>
        <div className="field__row">
          <div className="input-wrap">
            <Search size={14} strokeWidth={1.7} aria-hidden="true" />
            <input
              id="weather-city"
              className="text-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void search()
                }
              }}
              placeholder="City or town"
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            className="button button--quiet button--compact"
            onClick={() => void search()}
            disabled={searching || query.trim().length < 2}
          >
            {searching ? <Loader2 className="spin" size={14} strokeWidth={1.8} /> : 'Search'}
          </button>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      {results.length > 0 ? (
        <div className="place-results" role="listbox" aria-label="Weather locations">
          {results.map((place) => (
            <button
              key={place.id}
              type="button"
              className="place-result"
              role="option"
              aria-selected={false}
              onClick={() => {
                onChange({
                  ...weather,
                  lat: place.latitude,
                  lon: place.longitude,
                  label: placeLabel(place),
                  auto: false,
                })
                setResults([])
                setQuery('')
              }}
            >
              <MapPin size={13} strokeWidth={1.7} aria-hidden="true" />
              <span>
                <strong>{place.name}</strong>
                <span>{[place.admin1, place.country].filter(Boolean).join(', ')}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
