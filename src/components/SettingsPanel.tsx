import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
  Loader2,
  LogOut,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react'
import type { AuthState } from '../hooks/useAuth'
import { isValidCustomSearchUrl } from '../lib/search'
import type { Settings } from '../lib/settings'
import {
  AccentPicker,
  BackgroundPicker,
  EnginePicker,
  Section,
  Segmented,
  ThemePicker,
  Toggle,
  WeatherLocationPicker,
} from './controls'
import { Modal } from './Modal'
import { DecoratedAvatar } from './DecoratedAvatar'
import { APP_THEME_IDS } from '../lib/settings'
import type { Profile } from '../lib/types'

export type SettingsSection = 'appearance' | 'dashboard' | 'search' | 'weather' | 'account'

interface SettingsPanelProps {
  open: boolean
  initialSection?: SettingsSection
  settings: Settings
  onChange: (settings: Settings) => void
  onClose: () => void
  onReset: () => void
  auth: AuthState
  profile?: Profile | null
  onOpenAuth: () => void
}

const TABS: { id: SettingsSection; label: string }[] = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'search', label: 'Search' },
  { id: 'weather', label: 'Weather' },
  { id: 'account', label: 'Account' },
]

const APP_URL = 'https://mirrorhabit.pages.dev'
const PRIVACY_URL = 'https://mirrorhabit.pages.dev/privacy'

export function SettingsPanel({
  open,
  initialSection = 'appearance',
  settings,
  onChange,
  onClose,
  onReset,
  auth,
  profile,
  onOpenAuth,
}: SettingsPanelProps) {
  const [section, setSection] = useState<SettingsSection>(initialSection)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [accountError, setAccountError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSection(initialSection)
      setMediaError(null)
      setAccountError(null)
    }
  }, [open, initialSection])

  const patch = (next: Partial<Settings>) => onChange({ ...settings, ...next })

  const signOut = async () => {
    setSigningOut(true)
    setAccountError(null)
    try {
      await auth.signOut()
      onClose()
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Could not sign out.')
    } finally {
      setSigningOut(false)
    }
  }

  const reset = () => {
    if (window.confirm('Reset every new-tab setting to its default?')) {
      onReset()
      onClose()
    }
  }

  const customUrlError =
    settings.searchEngine === 'custom' && !isValidCustomSearchUrl(settings.customSearchUrl)
      ? 'Add a valid URL containing %s.'
      : null

  return (
    <Modal open={open} onClose={onClose} titleId="settings-title">
      <div className="sheet settings-sheet">
        <header className="sheet__head">
          <div>
            <p className="eyebrow">Preferences</p>
            <h2 id="settings-title">Make it yours.</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close settings">
            <X size={18} strokeWidth={1.8} />
          </button>
        </header>

        <nav className="settings-tabs" role="tablist" aria-label="Settings sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`settings-tab-${tab.id}`}
              aria-selected={section === tab.id}
              aria-controls={`settings-panel-${tab.id}`}
              className="settings-tab"
              onClick={() => setSection(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div
          className="sheet__body settings-body"
          role="tabpanel"
          id={`settings-panel-${section}`}
          aria-labelledby={`settings-tab-${section}`}
        >
          {section === 'appearance' ? (
            <>
              <Section title="Theme" description="A different light for the same day.">
                <ThemePicker value={settings.theme} onChange={(theme) => patch({ theme })} />
              </Section>
              <Section
                title="Accent"
                description={
                  APP_THEME_IDS.includes(settings.theme)
                    ? 'App themes carry their own accent — switch to an extension theme to pick one.'
                    : 'The small marks that carry your attention.'
                }
              >
                <AccentPicker
                  value={settings.accent}
                  onChange={(accent) => patch({ accent })}
                  muted={APP_THEME_IDS.includes(settings.theme)}
                />
              </Section>
              <Section title="Background" description="A quiet scene behind the day.">
                <BackgroundPicker
                  background={settings.background}
                  onChange={(background) => patch({ background })}
                  onError={setMediaError}
                />
                {mediaError ? <p className="form-error">{mediaError}</p> : null}
              </Section>
            </>
          ) : null}

          {section === 'dashboard' ? (
            <>
              <Section title="Layout" description="Choose how much of the day you want to see at once.">
                <Segmented
                  label="Layout"
                  value={settings.layout}
                  options={[
                    { value: 'focus', label: 'Focus' },
                    { value: 'dashboard', label: 'Dashboard' },
                  ]}
                  onChange={(layout) => patch({ layout })}
                />
                <div className="segmented-caption">
                  {settings.layout === 'focus'
                    ? 'Centred clock, search, and a single ledger.'
                    : 'A wider spread with the ledger beside the clock.'}
                </div>
              </Section>

              <Section title="Density">
                <Segmented
                  label="Habit density"
                  value={settings.density}
                  options={[
                    { value: 'comfortable', label: 'Comfortable' },
                    { value: 'compact', label: 'Compact' },
                  ]}
                  onChange={(density) => patch({ density })}
                />
              </Section>

              <Section title="Clock">
                <Segmented
                  label="Clock format"
                  value={settings.clock24h ? '24' : '12'}
                  options={[
                    { value: '12', label: '12 hour' },
                    { value: '24', label: '24 hour' },
                  ]}
                  onChange={(value) => patch({ clock24h: value === '24' })}
                />
              </Section>

              <Section title="Visible pieces">
                <div className="toggle-list">
                  <Toggle
                    label="Clock"
                    checked={settings.showClock}
                    onChange={(showClock) => patch({ showClock })}
                  />
                  <Toggle
                    label="Weather"
                    checked={settings.showWeather}
                    onChange={(showWeather) => patch({ showWeather })}
                  />
                  <Toggle
                    label="Search"
                    checked={settings.showSearch}
                    onChange={(showSearch) => patch({ showSearch })}
                  />
                  <Toggle
                    label="Progress ring"
                    checked={settings.showProgress}
                    onChange={(showProgress) => patch({ showProgress })}
                  />
                  <Toggle
                    label="Habit ledger"
                    checked={settings.showHabits}
                    onChange={(showHabits) => patch({ showHabits })}
                  />
                  <Toggle
                    label="Greeting"
                    checked={settings.showGreeting}
                    onChange={(showGreeting) => patch({ showGreeting })}
                  />
                  <Toggle
                    label="Week rail"
                    description="Seven dots under each daily habit."
                    checked={settings.showWeekRail}
                    onChange={(showWeekRail) => patch({ showWeekRail })}
                  />
                </div>
              </Section>

              <Section title="Ledger details">
                <div className="toggle-list">
                  <Toggle
                    label="Show completed habits"
                    checked={settings.showCompleted}
                    onChange={(showCompleted) => patch({ showCompleted })}
                  />
                  <Toggle
                    label="Guild labels"
                    checked={settings.showGuildLabels}
                    onChange={(showGuildLabels) => patch({ showGuildLabels })}
                  />
                  <Toggle
                    label="Challenge badges"
                    checked={settings.showChallengeBadges}
                    onChange={(showChallengeBadges) => patch({ showChallengeBadges })}
                  />
                  <Toggle
                    label="Reduce motion"
                    description="Turn off the small reveals and transitions."
                    checked={settings.reduceMotion}
                    onChange={(reduceMotion) => patch({ reduceMotion })}
                  />
                </div>
              </Section>
            </>
          ) : null}

          {section === 'search' ? (
            <Section title="Search engine" description="Queries go straight to the engine you choose.">
              <EnginePicker
                engine={settings.searchEngine}
                customUrl={settings.customSearchUrl}
                onChange={(searchEngine) => patch({ searchEngine })}
                onCustomUrlChange={(customSearchUrl) => patch({ customSearchUrl })}
              />
              {customUrlError ? <p className="form-error">{customUrlError}</p> : null}
            </Section>
          ) : null}

          {section === 'weather' ? (
            <>
              <Section title="Units">
                <Segmented
                  label="Temperature unit"
                  value={settings.weather.unit}
                  options={[
                    { value: 'celsius', label: 'Celsius' },
                    { value: 'fahrenheit', label: 'Fahrenheit' },
                  ]}
                  onChange={(unit) => patch({ weather: { ...settings.weather, unit } })}
                />
              </Section>
              <Section
                title="Location"
                description="Open-Meteo receives only the coordinates needed for the forecast."
              >
                <WeatherLocationPicker
                  weather={settings.weather}
                  onChange={(weather) => patch({ weather })}
                />
              </Section>
              <Section title="Details">
                <div className="toggle-list">
                  <Toggle
                    label="Feels like"
                    checked={settings.weather.showFeels}
                    onChange={(showFeels) =>
                      patch({ weather: { ...settings.weather, showFeels } })
                    }
                  />
                  <Toggle
                    label="Precipitation chance"
                    checked={settings.weather.showPrecip}
                    onChange={(showPrecip) =>
                      patch({ weather: { ...settings.weather, showPrecip } })
                    }
                  />
                </div>
              </Section>
            </>
          ) : null}

          {section === 'account' ? (
            <Section
              title={auth.userId ? 'Your account' : 'Connect Mirror Habit'}
              description={
                auth.userId
                  ? 'Your habits stay server-authoritative. This tab only reads today and writes check-ins.'
                  : 'Sign in to see today’s ledger and check in from this tab.'
              }
            >
              {auth.userId ? (
                <div className="account-card">
                  <div className="account-card__avatar">
                    <DecoratedAvatar
                      effect={profile?.adornment}
                      avatarUrl={profile?.avatarUrl}
                      name={auth.displayName}
                      size={34}
                      animate={!settings.reduceMotion}
                    />
                  </div>
                  <div className="account-card__copy">
                    <strong>{auth.displayName ?? 'Mirror Habit member'}</strong>
                    <span>{auth.session?.user.email ?? 'Signed in'}</span>
                  </div>
                  <a className="button button--quiet button--compact" href={APP_URL} target="_blank" rel="noreferrer">
                    Open app
                    <ArrowUpRight size={13} strokeWidth={1.8} aria-hidden="true" />
                  </a>
                </div>
              ) : (
                <div className="account-connect">
                  <p>
                    Your session, ledger cache, and pending check-ins stay in this browser profile.
                    We never write XP, stats, or challenge results from the extension.
                  </p>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() => {
                      onClose()
                      onOpenAuth()
                    }}
                  >
                    Connect account
                  </button>
                </div>
              )}

              {auth.userId ? (
                <button
                  type="button"
                  className="button button--ghost account-signout"
                  onClick={() => void signOut()}
                  disabled={signingOut}
                >
                  {signingOut ? (
                    <Loader2 className="spin" size={14} strokeWidth={1.8} aria-hidden="true" />
                  ) : (
                    <LogOut size={14} strokeWidth={1.8} aria-hidden="true" />
                  )}
                  {signingOut ? 'Signing out…' : 'Sign out'}
                </button>
              ) : null}

              {accountError ? <p className="form-error">{accountError}</p> : null}

              <div className="privacy-note">
                <ShieldCheck size={15} strokeWidth={1.7} aria-hidden="true" />
                <span>
                  No analytics, no browsing history, no search logging.{' '}
                  <a href={PRIVACY_URL} target="_blank" rel="noreferrer">
                    Privacy
                  </a>
                </span>
              </div>
            </Section>
          ) : null}
        </div>

        <footer className="sheet__foot settings-foot">
          <button type="button" className="button button--ghost button--compact" onClick={reset}>
            <RotateCcw size={13} strokeWidth={1.8} aria-hidden="true" />
            Reset settings
          </button>
          <span className="settings-foot__version">v0.1.0</span>
        </footer>
      </div>
    </Modal>
  )
}
