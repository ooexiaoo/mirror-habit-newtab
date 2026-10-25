import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { SupportedStorage } from '@supabase/supabase-js'
import { chromeIdentity, getLocalRaw, removeLocalRaw, setLocalRaw } from './storage'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

const authStorage: SupportedStorage = {
  getItem: (key) => getLocalRaw(key),
  setItem: (key, value) => setLocalRaw(key, value),
  removeItem: (key) => removeLocalRaw(key),
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: authStorage,
        storageKey: 'mirror-habit-newtab-auth',
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null

export type { Session, User }

export function authErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return 'Something went wrong. Please try again.'
}

function requireClient(): SupabaseClient {
  if (!supabase) {
    throw new Error('Mirror Habit is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }
  return supabase
}

export async function getInitialSession(): Promise<Session | null> {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const client = requireClient()
  const { error } = await client.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function canUseGoogleAuth(): boolean {
  return Boolean(chromeIdentity() && isSupabaseConfigured)
}

export function googleRedirectUrl(): string | null {
  const identity = chromeIdentity()
  return identity ? identity.getRedirectURL('auth/callback') : null
}

function launchWebAuthFlow(url: string): Promise<string> {
  const identity = chromeIdentity()
  if (!identity) {
    return Promise.reject(new Error('Google sign-in only works in the installed extension.'))
  }
  return new Promise((resolve, reject) => {
    identity.launchWebAuthFlow({ url, interactive: true }, (responseUrl) => {
      const runtime = (globalThis as unknown as { chrome?: { runtime?: { lastError?: { message?: string } } } }).chrome?.runtime
      if (runtime?.lastError) {
        reject(new Error(runtime.lastError.message ?? 'Google sign-in was cancelled.'))
        return
      }
      if (!responseUrl) {
        reject(new Error('Google sign-in was cancelled.'))
        return
      }
      resolve(responseUrl)
    })
  })
}

export async function signInWithGoogle(): Promise<void> {
  const client = requireClient()
  const redirectTo = googleRedirectUrl()
  if (!redirectTo) throw new Error('Google sign-in only works in the installed extension.')

  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  })
  if (error) throw error
  if (!data.url) throw new Error('Google did not return a sign-in URL.')

  const callbackUrl = await launchWebAuthFlow(data.url)
  const parsed = new URL(callbackUrl)
  const errorDescription = parsed.searchParams.get('error_description')
  if (errorDescription) throw new Error(errorDescription)

  const code = parsed.searchParams.get('code')
  if (code) {
    const exchanged = await client.auth.exchangeCodeForSession(code)
    if (exchanged.error) throw exchanged.error
    return
  }

  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ''))
  const accessToken = hash.get('access_token')
  const refreshToken = hash.get('refresh_token')
  if (accessToken && refreshToken) {
    const session = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    if (session.error) throw session.error
    return
  }

  throw new Error('Google sign-in returned no session.')
}
