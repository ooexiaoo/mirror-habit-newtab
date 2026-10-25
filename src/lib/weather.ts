import type { PlaceResult, WeatherLocation } from './types'
import { getLocal, setLocal } from './storage'
import type { TemperatureUnit } from './settings'

export interface WeatherNow {
  temperature: number
  apparent: number
  code: number
  isDay: boolean
  high: number
  low: number
  precipitationChance: number | null
  fetchedAt: number
  location: WeatherLocation
  unit: TemperatureUnit
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number
    apparent_temperature?: number
    weather_code?: number
    is_day?: number
  }
  daily?: {
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
    precipitation_probability_max?: number[]
  }
}

interface GeocodingResponse {
  results?: {
    id: number
    name: string
    country?: string
    admin1?: string
    latitude: number
    longitude: number
  }[]
}

const WEATHER_KEY = 'mirror-habit-newtab-weather'
const TTL = 30 * 60 * 1000

export const WEATHER_CACHE_KEY = WEATHER_KEY

export async function fetchWeather(
  location: WeatherLocation,
  unit: TemperatureUnit,
  signal?: AbortSignal,
): Promise<WeatherNow> {
  const unitParam = unit === 'fahrenheit' ? 'fahrenheit' : 'celsius'
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(location.lat))
  url.searchParams.set('longitude', String(location.lon))
  url.searchParams.set(
    'current',
    'temperature_2m,apparent_temperature,weather_code,is_day',
  )
  url.searchParams.set(
    'daily',
    'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
  )
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('forecast_days', '1')
  url.searchParams.set('temperature_unit', unitParam)

  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Weather request failed (${response.status})`)
  const payload = (await response.json()) as OpenMeteoResponse
  const current = payload.current
  const daily = payload.daily
  if (
    !current ||
    current.temperature_2m === undefined ||
    current.weather_code === undefined
  ) {
    throw new Error('Weather response was incomplete')
  }

  return {
    temperature: Math.round(current.temperature_2m),
    apparent: Math.round(current.apparent_temperature ?? current.temperature_2m),
    code: current.weather_code,
    isDay: current.is_day !== 0,
    high: Math.round(daily?.temperature_2m_max?.[0] ?? current.temperature_2m),
    low: Math.round(daily?.temperature_2m_min?.[0] ?? current.temperature_2m),
    precipitationChance: daily?.precipitation_probability_max?.[0] ?? null,
    fetchedAt: Date.now(),
    location,
    unit,
  }
}

const isFresh = (weather: WeatherNow): boolean => Date.now() - weather.fetchedAt < TTL

export async function loadCachedWeather(
  location: WeatherLocation,
  unit: TemperatureUnit,
): Promise<WeatherNow | null> {
  const cached = await getLocal<WeatherNow | null>(WEATHER_KEY, null)
  if (!cached) return null
  const sameLocation =
    Math.abs(cached.location.lat - location.lat) < 0.01 &&
    Math.abs(cached.location.lon - location.lon) < 0.01
  if (!sameLocation || cached.unit !== unit) return null
  return cached
}

export async function saveCachedWeather(weather: WeatherNow): Promise<void> {
  await setLocal(WEATHER_KEY, weather)
}

export function isWeatherFresh(weather: WeatherNow): boolean {
  return isFresh(weather)
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', trimmed)
  url.searchParams.set('count', '6')
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`City search failed (${response.status})`)
  const payload = (await response.json()) as GeocodingResponse
  return (payload.results ?? []).map((place) => ({
    id: place.id,
    name: place.name,
    country: place.country,
    admin1: place.admin1,
    latitude: place.latitude,
    longitude: place.longitude,
  }))
}

export function placeLabel(place: PlaceResult): string {
  return [place.name, place.admin1, place.country].filter(Boolean).join(', ')
}

export interface WeatherCondition {
  label: string
  kind:
    | 'clear'
    | 'partly'
    | 'cloudy'
    | 'fog'
    | 'drizzle'
    | 'rain'
    | 'snow'
    | 'showers'
    | 'storm'
    | 'hail'
}

export function weatherCondition(code: number): WeatherCondition {
  if (code === 0) return { label: 'Clear', kind: 'clear' }
  if (code === 1) return { label: 'Mostly clear', kind: 'clear' }
  if (code === 2) return { label: 'Partly cloudy', kind: 'partly' }
  if (code === 3) return { label: 'Overcast', kind: 'cloudy' }
  if (code === 45 || code === 48) return { label: 'Foggy', kind: 'fog' }
  if (code >= 51 && code <= 57) return { label: 'Drizzle', kind: 'drizzle' }
  if (code === 61 || code === 63) return { label: 'Rain', kind: 'rain' }
  if (code === 65) return { label: 'Heavy rain', kind: 'rain' }
  if (code === 66 || code === 67) return { label: 'Freezing rain', kind: 'rain' }
  if (code >= 71 && code <= 75) return { label: 'Snow', kind: 'snow' }
  if (code === 77) return { label: 'Snow grains', kind: 'snow' }
  if (code >= 80 && code <= 82) return { label: 'Showers', kind: 'showers' }
  if (code === 85 || code === 86) return { label: 'Snow showers', kind: 'snow' }
  if (code === 95) return { label: 'Thunderstorm', kind: 'storm' }
  if (code === 96 || code === 99) return { label: 'Storm with hail', kind: 'hail' }
  return { label: 'Unsettled', kind: 'cloudy' }
}
