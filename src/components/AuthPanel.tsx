import { useEffect, useState, type FormEvent } from 'react'
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  X,
} from 'lucide-react'
import type { AuthState } from '../hooks/useAuth'
import { canUseGoogleAuth, isSupabaseConfigured } from '../lib/auth'
import { Modal } from './Modal'
import { MirrorMark } from './MirrorMark'

interface AuthPanelProps {
  open: boolean
  onClose: () => void
  auth: AuthState
}

const APP_URL = 'https://mirrorhabit.pages.dev'
const PRIVACY_URL = 'https://mirrorhabit.pages.dev/privacy'

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.96 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  )
}

export function AuthPanel({ open, onClose, auth }: AuthPanelProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setError(null)
      setLoading(false)
      setGoogleLoading(false)
    }
  }, [open])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await auth.signInEmail(email, password)
      onClose()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not sign in.')
    } finally {
      setLoading(false)
    }
  }

  const google = async () => {
    setError(null)
    setGoogleLoading(true)
    try {
      await auth.signInGoogle()
      onClose()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not sign in with Google.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} titleId="auth-title" variant="center" className="auth-modal">
      <div className="auth-panel">
        <button type="button" className="icon-button auth-panel__close" onClick={onClose} aria-label="Close sign in">
          <X size={18} strokeWidth={1.8} />
        </button>

        <div className="auth-panel__brand">
          <span className="auth-panel__mark">
            <MirrorMark size={34} />
          </span>
          <p className="eyebrow">Mirror Habit</p>
        </div>

        <header className="auth-panel__head">
          <h2 id="auth-title">Welcome back.</h2>
          <p>Sign in with the account that holds your guild and your ledger.</p>
        </header>

        {!isSupabaseConfigured ? (
          <div className="notice notice--error">
            Mirror Habit is not configured for this build. Add the Supabase URL and anon key to
            VITE env values.
          </div>
        ) : (
          <>
            <button
              type="button"
              className="button button--google"
              onClick={() => void google()}
              disabled={googleLoading || loading || !canUseGoogleAuth()}
              title={
                canUseGoogleAuth()
                  ? 'Continue with Google'
                  : 'Google sign-in is available in the installed extension.'
              }
            >
              {googleLoading ? (
                <Loader2 className="spin" size={16} strokeWidth={2} aria-hidden="true" />
              ) : (
                <GoogleMark />
              )}
              {googleLoading ? 'Connecting…' : 'Continue with Google'}
            </button>

            {!canUseGoogleAuth() ? (
              <p className="auth-panel__hint">
                Google sign-in is available in the installed extension. Use email below in preview.
              </p>
            ) : null}

            <div className="auth-divider">
              <span>or use email</span>
            </div>

            <form className="auth-form" onSubmit={(event) => void submit(event)}>
              <label className="field">
                <span className="field__label">Email</span>
                <span className="input-wrap">
                  <Mail size={15} strokeWidth={1.7} aria-hidden="true" />
                  <input
                    className="text-input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </span>
              </label>

              <label className="field">
                <span className="field__label">Password</span>
                <span className="input-wrap">
                  <LockKeyhole size={15} strokeWidth={1.7} aria-hidden="true" />
                  <input
                    className="text-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="input-action"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} strokeWidth={1.7} /> : <Eye size={15} strokeWidth={1.7} />}
                  </button>
                </span>
              </label>

              {error ? <p className="form-error" role="alert">{error}</p> : null}

              <button
                type="submit"
                className="button button--primary auth-form__submit"
                disabled={loading || googleLoading || !email.trim() || !password}
              >
                {loading ? <Loader2 className="spin" size={15} strokeWidth={2} aria-hidden="true" /> : null}
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </>
        )}

        <div className="auth-panel__foot">
          <a href={APP_URL} target="_blank" rel="noreferrer">
            Create or manage your account
            <ArrowUpRight size={13} strokeWidth={1.8} aria-hidden="true" />
          </a>
          <span>
            <ShieldCheck size={13} strokeWidth={1.7} aria-hidden="true" />
            <a href={PRIVACY_URL} target="_blank" rel="noreferrer">
              Privacy
            </a>
          </span>
        </div>
      </div>
    </Modal>
  )
}
