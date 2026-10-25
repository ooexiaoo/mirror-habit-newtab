import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from 'lucide-react'
import type { Settings } from '../lib/settings'
import { AccentPicker, EnginePicker, Segmented, ThemePicker, WeatherLocationPicker } from './controls'
import { Modal } from './Modal'
import { MirrorMark } from './MirrorMark'

interface OnboardingProps {
  open: boolean
  settings: Settings
  signedIn: boolean
  onSettingsChange: (settings: Settings) => void
  onFinish: () => void
  onOpenAuth: () => void
}

const STEPS = ['Mood', 'Setup', 'Account'] as const

export function Onboarding({
  open,
  settings,
  signedIn,
  onSettingsChange,
  onFinish,
  onOpenAuth,
}: OnboardingProps) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (open) setStep(0)
  }, [open])

  const patch = (next: Partial<Settings>) => onSettingsChange({ ...settings, ...next })
  const last = step === STEPS.length - 1

  return (
    <Modal
      open={open}
      onClose={onFinish}
      titleId="onboarding-title"
      variant="center"
      className="onboarding-modal"
    >
      <div className="onboarding">
        <button type="button" className="icon-button onboarding__close" onClick={onFinish} aria-label="Skip setup">
          <X size={18} strokeWidth={1.8} />
        </button>

        <aside className="onboarding__aside">
          <span className="onboarding__mark">
            <MirrorMark size={36} />
          </span>
          <p className="eyebrow">Mirror Habit · New tab</p>
          <h2 id="onboarding-title">
            A quieter
            <br />
            first page.
          </h2>
          <p>
            Your rituals, the weather, and a clear place to search. Set the tone now; you can
            change everything later.
          </p>
          <div className="onboarding__steps" aria-label="Setup progress">
            {STEPS.map((label, index) => (
              <span
                key={label}
                className="onboarding__step"
                data-active={index === step}
                data-done={index < step}
              >
                <span>{index < step ? <Check size={11} strokeWidth={2.6} /> : index + 1}</span>
                {label}
              </span>
            ))}
          </div>
        </aside>

        <div className="onboarding__main">
          {step === 0 ? (
            <div className="onboarding__pane">
              <header className="onboarding__head">
                <p className="eyebrow">Step one</p>
                <h3>Set the mood.</h3>
                <p>Choose a surface that makes the tab feel like yours.</p>
              </header>
              <ThemePicker value={settings.theme} onChange={(theme) => patch({ theme })} />
              <div className="onboarding__inline">
                <span className="field__label">Accent</span>
                <AccentPicker value={settings.accent} onChange={(accent) => patch({ accent })} />
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="onboarding__pane">
              <header className="onboarding__head">
                <p className="eyebrow">Step two</p>
                <h3>Make the day useful.</h3>
                <p>Pick a search engine and, if you like, a weather location.</p>
              </header>
              <EnginePicker
                engine={settings.searchEngine}
                customUrl={settings.customSearchUrl}
                onChange={(searchEngine) => patch({ searchEngine })}
                onCustomUrlChange={(customSearchUrl) => patch({ customSearchUrl })}
              />
              <div className="onboarding__weather">
                <div className="onboarding__weather-head">
                  <span className="field__label">Weather</span>
                  <Segmented
                    label="Temperature unit"
                    value={settings.weather.unit}
                    options={[
                      { value: 'celsius', label: '°C' },
                      { value: 'fahrenheit', label: '°F' },
                    ]}
                    onChange={(unit) => patch({ weather: { ...settings.weather, unit } })}
                  />
                </div>
                <WeatherLocationPicker
                  weather={settings.weather}
                  onChange={(weather) => patch({ weather })}
                />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="onboarding__pane">
              <header className="onboarding__head">
                <p className="eyebrow">Step three</p>
                <h3>{signedIn ? 'You are connected.' : 'Bring your ledger.'}</h3>
                <p>
                  {signedIn
                    ? 'Today’s habits will appear behind this window. Everything is ready.'
                    : 'Connect Mirror Habit to see today’s habits and check in from this tab. You can skip and connect later.'}
                </p>
              </header>

              {signedIn ? (
                <div className="onboarding__connected">
                  <span className="onboarding__connected-icon" aria-hidden="true">
                    <Sparkles size={20} strokeWidth={1.5} />
                  </span>
                  <div>
                    <strong>Your ledger is ready.</strong>
                    <p>Open the tab to see today.</p>
                  </div>
                </div>
              ) : (
                <div className="onboarding__connect">
                  <div className="onboarding__connect-mark" aria-hidden="true">
                    <MirrorMark size={44} />
                  </div>
                  <p>
                    Habit data stays server-authoritative. This tab only reads today and writes
                    check-ins — never XP, stats, or challenge results.
                  </p>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() => {
                      onFinish()
                      onOpenAuth()
                    }}
                  >
                    Connect account
                    <ArrowRight size={14} strokeWidth={1.9} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          ) : null}

          <footer className="onboarding__foot">
            <button
              type="button"
              className="button button--ghost button--compact"
              onClick={() => (step === 0 ? onFinish() : setStep((value) => value - 1))}
            >
              {step === 0 ? (
                'Skip for now'
              ) : (
                <>
                  <ArrowLeft size={14} strokeWidth={1.8} aria-hidden="true" />
                  Back
                </>
              )}
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => {
                if (last) onFinish()
                else setStep((value) => value + 1)
              }}
            >
              {last ? 'Open my new tab' : 'Continue'}
              {last ? (
                <Check size={15} strokeWidth={2.2} aria-hidden="true" />
              ) : (
                <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
              )}
            </button>
          </footer>
        </div>
      </div>
    </Modal>
  )
}
