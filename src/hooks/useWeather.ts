import { useCallback, useEffect, useState } from 'react'
import {
  fetchWeather,
  isWeatherFresh,
  loadCachedWeather,
  saveCachedWeather,
  type WeatherNow,
} from '../lib/weather'
import type { WeatherSettings } from '../lib/settings'

interface UseWeatherResult {
  weather: WeatherNow | null
  loading: boolean
  error: string | null
  stale: boolean
  refresh: () => void
}

export function useWeather(settings: WeatherSettings): UseWeatherResult {
  const [weather, setWeather] = useState<WeatherNow | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stale, setStale] = useState(false)
  const [nonce, setNonce] = useState(0)

  const location =
    settings.lat !== null && settings.lon !== null
      ? { lat: settings.lat, lon: settings.lon, label: settings.label }
      : null

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    if (!location) {
      setWeather(null)
      setError(null)
      setLoading(false)
      return () => controller.abort()
    }

    setLoading(true)
    setError(null)

    const load = async () => {
      const cached = await loadCachedWeather(location, settings.unit)
      if (cancelled) return
      if (cached) {
        setWeather(cached)
        setStale(!isWeatherFresh(cached))
        if (isWeatherFresh(cached) && nonce === 0) {
          setLoading(false)
          return
        }
      }

      try {
        const next = await fetchWeather(location, settings.unit, controller.signal)
        if (cancelled) return
        setWeather(next)
        setStale(false)
        setError(null)
        await saveCachedWeather(next)
      } catch (nextError) {
        if (cancelled || (nextError instanceof DOMException && nextError.name === 'AbortError')) {
          return
        }
        setStale(Boolean(cached))
        if (!cached) {
          setError(nextError instanceof Error ? nextError.message : 'Weather is unavailable.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [location?.lat, location?.lon, location?.label, settings.unit, nonce])

  useEffect(() => {
    if (!location) return
    const interval = window.setInterval(() => setNonce((value) => value + 1), 30 * 60 * 1000)
    return () => window.clearInterval(interval)
  }, [location?.lat, location?.lon])

  const refresh = useCallback(() => setNonce((value) => value + 1), [])

  return { weather, loading, error, stale, refresh }
}
