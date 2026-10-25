import { Loader2, MapPin, Settings2, UserRound } from 'lucide-react'
import { WeatherGlyph } from './WeatherGlyph'
import { DecoratedAvatar } from './DecoratedAvatar'
import type { Profile } from '../lib/types'
import type { WeatherNow } from '../lib/weather'
import { weatherCondition } from '../lib/weather'

interface TopBarProps {
  profile: Profile | null
  displayName: string | null
  signedIn: boolean
  authLoading: boolean
  animateAvatar: boolean
  showWeather: boolean
  weather: WeatherNow | null
  weatherLoading: boolean
  weatherError: string | null
  onAccount: () => void
  onSettings: () => void
  onWeather: () => void
}

export function TopBar({
  profile,
  displayName,
  signedIn,
  authLoading,
  animateAvatar,
  showWeather,
  weather,
  weatherLoading,
  weatherError,
  onAccount,
  onSettings,
  onWeather,
}: TopBarProps) {
  const firstName = displayName?.trim().split(/\s+/)[0] ?? null
  const condition = weather ? weatherCondition(weather.code) : null
  const weatherHasLocation = Boolean(weather?.location.label)

  return (
    <header className="topbar">
      <span className="topbar__spacer" aria-hidden="true" />

      <div className="topbar__actions">
        {showWeather ? (
          <button
            type="button"
            className="weather-pill"
            onClick={onWeather}
            aria-label={
              weather
                ? `Weather in ${weather.location.label}: ${weather.temperature} degrees, ${condition?.label}. Open weather settings.`
                : weatherError
                  ? 'Weather unavailable. Open weather settings.'
                  : 'Set your weather location'
            }
            title={
              weather
                ? `H ${weather.high}° · L ${weather.low}°`
                : weatherError ?? undefined
            }
          >
            {weather ? (
              <>
                <WeatherGlyph code={weather.code} isDay={weather.isDay} size={17} />
                <span className="weather-pill__temp">{weather.temperature}°</span>
                <span className="weather-pill__condition">{condition?.label}</span>
                <span className="weather-pill__place">
                  <MapPin size={12} strokeWidth={1.8} aria-hidden="true" />
                  {weather.location.label}
                </span>
              </>
            ) : weatherLoading ? (
              <>
                <Loader2 className="spin" size={15} strokeWidth={1.8} aria-hidden="true" />
                <span>Weather</span>
              </>
            ) : (
              <>
                <MapPin size={15} strokeWidth={1.7} aria-hidden="true" />
                <span>{weatherHasLocation ? 'Weather unavailable' : 'Set weather'}</span>
              </>
            )}
          </button>
        ) : null}

        <button
          type="button"
          className="account-button"
          onClick={onAccount}
          aria-label={signedIn ? `Account: ${displayName ?? 'signed in'}` : 'Connect Mirror Habit'}
          disabled={authLoading}
        >
          {authLoading ? (
            <Loader2 className="spin" size={16} strokeWidth={1.8} aria-hidden="true" />
          ) : signedIn ? (
            <DecoratedAvatar
              effect={profile?.adornment}
              avatarUrl={profile?.avatarUrl}
              name={displayName}
              size={24}
              animate={animateAvatar}
            />
          ) : (
            <UserRound size={16} strokeWidth={1.7} aria-hidden="true" />
          )}
          <span className="account-button__label">
            {authLoading ? 'Checking…' : signedIn ? firstName ?? 'Account' : 'Connect'}
          </span>
        </button>

        <button
          type="button"
          className="icon-button icon-button--top"
          onClick={onSettings}
          aria-label="Open settings"
          title="Settings"
        >
          <Settings2 size={18} strokeWidth={1.7} />
        </button>
      </div>
    </header>
  )
}
