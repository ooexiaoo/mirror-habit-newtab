import { useCallback, useEffect, useState } from 'react'
import {
  authErrorMessage,
  getInitialSession,
  signInWithEmail,
  signInWithGoogle,
  signOut as signOutRemote,
  supabase,
  type Session,
} from '../lib/auth'
import { clearCachedDashboard } from '../lib/dashboard'
import { savePending } from '../lib/pending'

export interface AuthState {
  session: Session | null
  userId: string | null
  displayName: string | null
  loading: boolean
  signInEmail: (email: string, password: string) => Promise<void>
  signInGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    if (!supabase) {
      setLoading(false)
      return () => {
        cancelled = true
      }
    }

    getInitialSession()
      .then((initial) => {
        if (!cancelled) setSession(initial)
      })
      .catch(() => {
        if (!cancelled) setSession(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!cancelled) setSession(nextSession)
    })

    return () => {
      cancelled = true
      data.subscription.unsubscribe()
    }
  }, [])

  const signInEmail = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password)
    } catch (error) {
      throw new Error(authErrorMessage(error))
    }
  }, [])

  const signInGoogle = useCallback(async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      throw new Error(authErrorMessage(error))
    }
  }, [])

  const signOut = useCallback(async () => {
    const userId = session?.user.id
    try {
      await signOutRemote()
    } finally {
      if (userId) {
        await clearCachedDashboard(userId)
        await savePending(userId, [])
      }
    }
  }, [session?.user.id])

  const displayName = (() => {
    const metadata = session?.user.user_metadata as Record<string, unknown> | undefined
    const raw =
      (metadata?.display_name as string | undefined) ??
      (metadata?.full_name as string | undefined) ??
      (metadata?.name as string | undefined)
    return raw?.trim() || null
  })()

  return {
    session,
    userId: session?.user.id ?? null,
    displayName,
    loading,
    signInEmail,
    signInGoogle,
    signOut,
  }
}
