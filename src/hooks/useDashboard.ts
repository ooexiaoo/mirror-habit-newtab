import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clearCachedDashboard,
  fetchDashboard,
  loadCachedDashboard,
  saveCachedDashboard,
  writeDayValue,
} from '../lib/dashboard'
import { cellEntryId } from '../lib/habits'
import { flushPending, loadPending, queuePending } from '../lib/pending'
import type { DashboardData } from '../lib/types'

interface UseDashboardResult {
  data: DashboardData | null
  loading: boolean
  refreshing: boolean
  error: string | null
  stale: boolean
  pendingCells: Set<string>
  refresh: () => Promise<void>
  setHabitValue: (habitId: string, value: number | null) => Promise<number>
  clear: () => Promise<void>
}

const pendingKey = (habitId: string, date: string): string => `${habitId}:${date}`

export function useDashboard(userId: string | null, dayKey: string): UseDashboardResult {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(Boolean(userId))
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stale, setStale] = useState(false)
  const [pendingCells, setPendingCells] = useState<Set<string>>(new Set())
  const lastFetchRef = useRef(0)
  const dataRef = useRef<DashboardData | null>(null)

  useEffect(() => {
    dataRef.current = data
  }, [data])

  const refresh = useCallback(async () => {
    if (!userId) return
    setRefreshing(true)
    try {
      const remote = await fetchDashboard(userId)
      setData(remote)
      setError(null)
      setStale(false)
      lastFetchRef.current = Date.now()
      await saveCachedDashboard(remote)
    } catch (nextError) {
      setStale(true)
      if (!dataRef.current) {
        setError(nextError instanceof Error ? nextError.message : 'Could not load your habits.')
      }
    } finally {
      setRefreshing(false)
    }
  }, [userId])

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(null)
    setStale(false)
    setPendingCells(new Set())

    if (!userId) {
      setLoading(false)
      return () => {
        cancelled = true
      }
    }

    setLoading(true)

    const load = async () => {
      const cached = await loadCachedDashboard(userId).catch(() => null)
      if (cancelled) return
      if (cached && cached.profile.userId === userId) {
        setData(cached)
        setLoading(false)
      }

      try {
        const remote = await fetchDashboard(userId)
        if (cancelled) return
        setData(remote)
        setError(null)
        setStale(false)
        lastFetchRef.current = Date.now()
        await saveCachedDashboard(remote)
      } catch (nextError) {
        if (cancelled) return
        setStale(true)
        if (!cached) {
          setError(nextError instanceof Error ? nextError.message : 'Could not load your habits.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [userId, dayKey])

  useEffect(() => {
    if (!data) return
    const timer = window.setTimeout(() => {
      void saveCachedDashboard(data)
    }, 200)
    return () => window.clearTimeout(timer)
  }, [data])

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    const syncPending = async () => {
      const queued = await loadPending(userId)
      if (cancelled) return
      setPendingCells(new Set(queued.map((item) => pendingKey(item.habitId, item.date))))
    }

    const flush = async () => {
      if (cancelled) return
      const flushed = await flushPending(userId)
      if (flushed > 0) await syncPending()
    }

    void syncPending()
    void flush()

    const onOnline = () => {
      void flush()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void flush()
        if (Date.now() - lastFetchRef.current > 60_000) void refresh()
      }
    }

    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [userId, refresh])

  const setHabitValue = useCallback(
    async (habitId: string, value: number | null): Promise<number> => {
      if (!userId) return 0
      const date = dayKey
      const entryId = cellEntryId(userId, habitId, date)
      const currentData = dataRef.current
      const habit = currentData?.habits.find((item) => item.id === habitId)
      const nullValue = habit?.measurement === 'counted' ? 1 : 0
      const previousRows = (currentData?.entries ?? []).filter(
        (entry) => entry.habitId === habitId && entry.date === date,
      )
      const previousValue = previousRows.reduce(
        (sum, entry) => sum + (entry.value ?? nullValue),
        0,
      )

      setData((current) => {
        if (!current) return current
        const nextEntries = current.entries.filter(
          (entry) => !(entry.habitId === habitId && entry.date === date),
        )
        if (value !== 0) {
          nextEntries.push({
            id: entryId,
            habitId,
            userId,
            date,
            value: value === null ? undefined : value,
          })
        }
        return { ...current, entries: nextEntries }
      })

      const operation = {
        habitId,
        date,
        entryId,
        value,
        queuedAt: Date.now(),
      }

      try {
        await writeDayValue({
          userId,
          habitId,
          date,
          entryId,
          value,
        })
        setPendingCells((current) => {
          const next = new Set(current)
          next.delete(pendingKey(habitId, date))
          return next
        })
      } catch {
        await queuePending(userId, operation)
        setPendingCells((current) => new Set(current).add(pendingKey(habitId, date)))
      }

      return previousValue
    },
    [dayKey, userId],
  )

  const clear = useCallback(async () => {
    if (!userId) return
    await clearCachedDashboard(userId)
    setData(null)
  }, [userId])

  return {
    data,
    loading,
    refreshing,
    error,
    stale,
    pendingCells,
    refresh,
    setHabitValue,
    clear,
  }
}
