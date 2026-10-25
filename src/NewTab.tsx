import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useAuth } from './hooks/useAuth'
import { useClock } from './hooks/useClock'
import { useDashboard } from './hooks/useDashboard'
import { useWallpaper } from './hooks/useWallpaper'
import { useWeather } from './hooks/useWeather'
import { buildHabitViews, formatAmount, type HabitView } from './lib/habits'
import {
  formatClock,
  formatLongDate,
  greeting,
} from './lib/date'
import {
  APP_THEME_IDS,
  DEFAULT_SETTINGS,
  getAccent,
  saveSettings,
  type SearchEngineId,
  type Settings,
} from './lib/settings'
import { AuthPanel } from './components/AuthPanel'
import { Onboarding } from './components/Onboarding'
import { SearchBar } from './components/SearchBar'
import { SettingsPanel, type SettingsSection } from './components/SettingsPanel'
import { TodayPanel } from './components/TodayPanel'
import { TopBar } from './components/TopBar'
import { Toast, type ToastData } from './components/Toast'

interface NewTabProps {
  initialSettings: Settings
}

const APP_URL = 'https://mirrorhabit.pages.dev'

export function NewTab({ initialSettings }: NewTabProps) {
  const [settings, setSettings] = useState<Settings>(initialSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('appearance')
  const [authOpen, setAuthOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(!initialSettings.onboarded)
  const [toast, setToast] = useState<ToastData | null>(null)
  const toastId = useRef(0)
  const undoRef = useRef<(() => void) | null>(null)
  const { now, dayKey } = useClock()
  const auth = useAuth()
  const dashboard = useDashboard(auth.userId, dayKey)
  const weather = useWeather(settings.weather)
  const wallpaper = useWallpaper(settings.background)

  const displayName = auth.displayName ?? dashboard.data?.profile.displayName ?? null
  const firstName = displayName?.trim().split(/\s+/)[0] ?? null
  const signedIn = Boolean(auth.userId)
  const views = useMemo(
    () =>
      buildHabitViews(
        dashboard.data?.habits ?? [],
        dashboard.data?.entries ?? [],
        dashboard.data?.guilds ?? [],
        settings.pinnedHabitIds,
      ),
    [dashboard.data, settings.pinnedHabitIds],
  )

  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.theme = settings.theme
    root.dataset.reduceMotion = String(settings.reduceMotion)
    root.style.setProperty('--backdrop-blur', `${settings.background.blur}px`)
    root.style.setProperty('--backdrop-dim', String(settings.background.dim / 100))
    if (APP_THEME_IDS.includes(settings.theme)) {
      // App themes carry their own accent — an inline accent would pin the
      // whole theme to the picker color, so it doesn't apply here.
      root.style.removeProperty('--accent')
      root.style.removeProperty('--accent-on')
      return () => {
        root.style.removeProperty('--accent')
        root.style.removeProperty('--accent-on')
      }
    }
    const accent = getAccent(settings.accent)
    root.style.setProperty('--accent', accent.value)
    root.style.setProperty('--accent-on', accent.on)
    return () => {
      root.style.removeProperty('--accent')
      root.style.removeProperty('--accent-on')
    }
  }, [settings])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void saveSettings(settings)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [settings])

  useEffect(() => {
    if (settings.onboarded) setOnboardingOpen(false)
  }, [settings.onboarded])

  // A new tab opens with the cursor in the search box. Skipped while the
  // onboarding wizard is up, and runs again the moment it completes.
  useEffect(() => {
    if (!settings.onboarded) return
    document.querySelector<HTMLInputElement>('.search__input')?.focus({ preventScroll: true })
  }, [settings.onboarded])

  const showToast = useCallback((next: Omit<ToastData, 'id'>) => {
    toastId.current += 1
    setToast({ ...next, id: toastId.current })
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const updateSettings = useCallback((next: Settings) => {
    setSettings(next)
  }, [])

  const patchSettings = useCallback(
    (next: Partial<Settings>) => {
      setSettings((current) => ({ ...current, ...next }))
    },
    [],
  )

  const openSettings = useCallback((section: SettingsSection) => {
    setSettingsSection(section)
    setSettingsOpen(true)
  }, [])

  const finishOnboarding = useCallback(() => {
    setOnboardingOpen(false)
    setSettings((current) => ({ ...current, onboarded: true }))
  }, [])

  const performUndo = useCallback(() => {
    const undo = undoRef.current
    if (!undo) return false
    undoRef.current = null
    undo()
    return true
  }, [])

  const primary = (view: HabitView) => {
    const habit = view.habit
    if (view.completed) {
      void dashboard.setHabitValue(habit.id, 0)
      undoRef.current = () => {
        void dashboard.setHabitValue(habit.id, null)
      }
      showToast({ message: `Removed ${habit.name}.`, actionLabel: 'Undo', onAction: performUndo })
      return
    }

    void dashboard.setHabitValue(habit.id, null)
    undoRef.current = () => {
      void dashboard.setHabitValue(habit.id, 0)
    }
    showToast({ message: `${habit.name} checked off.`, actionLabel: 'Undo', onAction: performUndo })
  }

  const increment = (view: HabitView) => {
    const habit = view.habit
    const previous = view.todayValue
    const next = previous + 1
    void dashboard.setHabitValue(habit.id, next)
    undoRef.current = () => {
      void dashboard.setHabitValue(habit.id, previous === 0 ? 0 : previous)
    }
    const targetMet = !view.completed && next >= view.target
    showToast({
      message: targetMet ? `${habit.name} target met.` : `${habit.name} +1.`,
      actionLabel: 'Undo',
      onAction: performUndo,
    })
  }

  const measured = (view: HabitView, amount: number) => {
    const habit = view.habit
    const previous = view.todayValue
    const next = previous + amount
    void dashboard.setHabitValue(habit.id, next)
    undoRef.current = () => {
      void dashboard.setHabitValue(habit.id, previous === 0 ? 0 : previous)
    }
    showToast({
      message: `Logged ${formatAmount(amount, habit)} for ${habit.name}.`,
      actionLabel: 'Undo',
      onAction: performUndo,
    })
  }

  const togglePin = (view: HabitView) => {
    const id = view.habit.id
    const pinned = settings.pinnedHabitIds.includes(id)
    const next = pinned
      ? settings.pinnedHabitIds.filter((habitId) => habitId !== id)
      : [id, ...settings.pinnedHabitIds]
    patchSettings({ pinnedHabitIds: next })
  }

  const toggleShowCompleted = () => {
    patchSettings({ showCompleted: !settings.showCompleted })
  }

  const resetSettings = () => {
    setSettings({ ...DEFAULT_SETTINGS, pinnedHabitIds: [] })
    setSettingsOpen(false)
    setOnboardingOpen(true)
    showToast({ message: 'Settings reset to their defaults.' })
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      const editing =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      if (editing || event.metaKey || event.ctrlKey || event.altKey) return
      if (document.body.classList.contains('modal-open')) return

      const key = event.key.toLowerCase()

      if (key === 'u') {
        if (performUndo()) {
          event.preventDefault()
          showToast({ message: 'Check-in restored.' })
        }
        return
      }

      if (key === 'j' || key === 'k') {
        const checks = Array.from(document.querySelectorAll<HTMLButtonElement>('.habit-row .habit-check'))
        if (checks.length === 0) return
        event.preventDefault()
        const active = document.activeElement
        const currentIndex = checks.findIndex((button) => button === active)
        const nextIndex =
          key === 'j'
            ? Math.min(checks.length - 1, currentIndex < 0 ? 0 : currentIndex + 1)
            : Math.max(0, currentIndex < 0 ? 0 : currentIndex - 1)
        checks[nextIndex]?.focus()
        return
      }

      if (/^[1-9]$/.test(event.key)) {
        const index = Number(event.key) - 1
        const row = document.querySelector<HTMLElement>(`.habit-row[data-habit-index="${index}"]`)
        const check = row?.querySelector<HTMLButtonElement>('.habit-check')
        if (check) {
          event.preventDefault()
          check.click()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [performUndo, showToast])

  const sceneStyle = useMemo<CSSProperties>(() => {
    if (settings.background.kind === 'solid') {
      return { backgroundColor: settings.background.color }
    }
    const image =
      settings.background.kind === 'image'
        ? wallpaper ?? settings.background.imageUrl
        : ''
    return image ? { backgroundImage: `url(${JSON.stringify(image)})` } : {}
  }, [settings.background, wallpaper])

  const hasImage =
    settings.background.kind === 'image' &&
    Boolean(wallpaper ?? settings.background.imageUrl)
  const weatherInfo = weather.weather
  const clock = formatClock(now, settings.clock24h)

  return (
    <div className="app" data-layout={settings.layout}>
      <div
        className={`scene ${hasImage ? 'scene--image' : ''}`}
        data-preset={settings.background.preset}
        data-kind={settings.background.kind}
        style={sceneStyle}
        aria-hidden="true"
      >
        <div className="scene__veil" style={{ opacity: settings.background.dim / 100 }} />
      </div>
      <div className="scene__grain" aria-hidden="true" />
      <div className="scene__arc" aria-hidden="true" />

      <div className="frame">
        <TopBar
          profile={dashboard.data?.profile ?? null}
          displayName={displayName}
          signedIn={signedIn}
          authLoading={auth.loading}
          animateAvatar={!settings.reduceMotion}
          showWeather={settings.showWeather}
          weather={weatherInfo}
          weatherLoading={weather.loading}
          weatherError={weather.error}
          onAccount={() => {
            if (signedIn) openSettings('account')
            else setAuthOpen(true)
          }}
          onSettings={() => openSettings('appearance')}
          onWeather={() => openSettings('weather')}
        />

        <main className={`stage stage--${settings.layout}`}>
          <section className="hero">
            <p className="eyebrow hero__date">{formatLongDate(now)}</p>

            {settings.showClock ? (
              <h1 className="clock" aria-label={`${clock.time}${clock.meridiem ? ` ${clock.meridiem}` : ''}`}>
                <span className="clock__time">{clock.time}</span>
                <span className="clock__seconds" aria-hidden="true">
                  {String(now.getSeconds()).padStart(2, '0')}
                </span>
                {clock.meridiem ? <span className="clock__meridiem">{clock.meridiem}</span> : null}
              </h1>
            ) : null}

            {settings.showGreeting ? (
              <p className="greeting">
                {greeting(now)}
                {firstName ? (
                  <>
                    , <em>{firstName}</em>
                  </>
                ) : null}
                <span className="greeting__period">.</span>
              </p>
            ) : null}

            {settings.showSearch ? (
              <SearchBar
                engine={settings.searchEngine}
                customUrl={settings.customSearchUrl}
                onEngineChange={(searchEngine: SearchEngineId) => patchSettings({ searchEngine })}
              />
            ) : null}
          </section>

          {settings.showHabits ? (
            <TodayPanel
              data={dashboard.data}
              views={views}
              loading={dashboard.loading}
              refreshing={dashboard.refreshing}
              error={dashboard.error}
              stale={dashboard.stale}
              signedIn={signedIn}
              authLoading={auth.loading}
              settings={settings}
              pendingCells={dashboard.pendingCells}
              onConnect={() => setAuthOpen(true)}
              onRefresh={() => void dashboard.refresh()}
              onHabitPrimary={primary}
              onHabitIncrement={increment}
              onMeasured={measured}
              onTogglePin={togglePin}
              onToggleShowCompleted={toggleShowCompleted}
            />
          ) : null}
        </main>

        <footer className="footer">
          <a href={APP_URL} target="_blank" rel="noreferrer">
            Mirror Habit
          </a>
          <span className="footer__dot" aria-hidden="true" />
          <span>A quieter new tab</span>
          <span className="footer__spacer" />
          <span className="footer__hint">
            <kbd>/</kbd> search · <kbd>1–9</kbd> check in
          </span>
        </footer>
      </div>

      <SettingsPanel
        open={settingsOpen}
        initialSection={settingsSection}
        settings={settings}
        onChange={updateSettings}
        onClose={() => setSettingsOpen(false)}
        onReset={resetSettings}
        auth={auth}
        profile={dashboard.data?.profile ?? null}
        onOpenAuth={() => setAuthOpen(true)}
      />

      <AuthPanel open={authOpen} onClose={() => setAuthOpen(false)} auth={auth} />

      <Onboarding
        open={onboardingOpen}
        settings={settings}
        signedIn={signedIn}
        onSettingsChange={updateSettings}
        onFinish={finishOnboarding}
        onOpenAuth={() => setAuthOpen(true)}
      />

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  )
}
