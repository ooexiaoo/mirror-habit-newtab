import { addDays, toDateKey } from './date'
import type { DashboardData, Guild, Habit, HabitEntry, Profile, Subscription } from './types'
import { getLocal, removeLocal, setLocal } from './storage'
import { supabase } from './auth'

const asRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export function mapHabit(row: Record<string, unknown>): Habit {
  return {
    id: row.id as string,
    groupId: (row.group_id as string | null) ?? null,
    name: row.name as string,
    description: (row.description as string | undefined) ?? undefined,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    measurement: row.measurement as Habit['measurement'],
    period: row.period as Habit['period'],
    target: (row.target as number | null) ?? undefined,
    unit: (row.unit as string | null) ?? undefined,
    dueDate: (row.due_date as string | null) ?? undefined,
    anonymous: Boolean(row.anonymous),
    isChallenge: Boolean(row.is_challenge),
    challengeEndDate: (row.challenge_end_date as string | null) ?? undefined,
    imageUrl: (row.image_url as string | null) ?? undefined,
    bannerUrl: (row.banner_url as string | null) ?? undefined,
    visibility: (row.visibility as 'public' | 'private' | undefined) ?? 'public',
    archived: Boolean(row.archived),
  }
}

function mapEntry(row: Record<string, unknown>): HabitEntry {
  return {
    id: row.id as string,
    habitId: row.habit_id as string,
    userId: row.user_id as string,
    date: row.date as string,
    value: (row.value as number | null) ?? undefined,
  }
}

const cacheKey = (userId: string): string => `mirror-habit-newtab-dashboard:${userId}`

export async function loadCachedDashboard(userId: string): Promise<DashboardData | null> {
  const cached = await getLocal<unknown>(cacheKey(userId), null)
  if (!asRecord(cached)) return null
  if (!Array.isArray(cached.habits) || !Array.isArray(cached.entries) || !Array.isArray(cached.guilds)) {
    return null
  }
  return cached as unknown as DashboardData
}

export async function saveCachedDashboard(data: DashboardData): Promise<void> {
  await setLocal(cacheKey(data.profile.userId), data)
}

export async function clearCachedDashboard(userId: string): Promise<void> {
  await removeLocal(cacheKey(userId))
}

async function fetchEntries(
  userId: string,
  habitIds: string[],
  since: string,
): Promise<HabitEntry[]> {
  if (!supabase || habitIds.length === 0) return []
  const all: HabitEntry[] = []
  const pageSize = 1000
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .in('habit_id', habitIds)
      .gte('date', since)
      .order('date', { ascending: false })
      .range(offset, offset + pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...data.map((row: Record<string, unknown>) => mapEntry(row)))
    if (data.length < pageSize) break
    offset += pageSize
    if (offset > 6000) break
  }

  return all
}

export async function fetchDashboard(userId: string): Promise<DashboardData> {
  if (!supabase) throw new Error('Mirror Habit is not configured.')

  const profilePromise = supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url, adornment')
    .eq('user_id', userId)
    .maybeSingle()

  const subscriptionsPromise = supabase
    .from('subscriptions')
    .select('habit_id, joined_at')
    .eq('user_id', userId)

  const [profileResult, subscriptionsResult] = await Promise.all([
    profilePromise,
    subscriptionsPromise,
  ])

  if (subscriptionsResult.error) throw subscriptionsResult.error
  const subscriptions: Subscription[] = (subscriptionsResult.data ?? []).map(
    (row: { habit_id: string; joined_at: string }) => ({
      habitId: row.habit_id,
      joinedAt: row.joined_at,
    }),
  )
  const habitIds = subscriptions.map((subscription) => subscription.habitId)

  if (habitIds.length === 0) {
    return {
      profile: profileResult.error
        ? { userId }
        : {
            userId,
            displayName: (profileResult.data as { display_name?: string } | null)?.display_name,
            avatarUrl: (profileResult.data as { avatar_url?: string } | null)?.avatar_url,
            adornment: (profileResult.data as { adornment?: string } | null)?.adornment,
          },
      habits: [],
      entries: [],
      guilds: [],
      fetchedAt: Date.now(),
    }
  }

  const habitsResult = await supabase.from('habits').select('*').in('id', habitIds)
  if (habitsResult.error) throw habitsResult.error
  const habits = (habitsResult.data ?? [])
    .map((row: Record<string, unknown>) => mapHabit(row))
    .filter((habit) => !habit.archived)

  const groupIds = Array.from(
    new Set(
      habits
        .map((habit) => habit.groupId)
        .filter((groupId): groupId is string => Boolean(groupId)),
    ),
  )

  const guildsPromise = groupIds.length > 0
    ? supabase.from('guilds').select('id, name').in('id', groupIds)
    : Promise.resolve({ data: [] as { id: string; name: string }[], error: null })

  const since = toDateKey(addDays(new Date(), -400))
  const [guildsResult, entries] = await Promise.all([
    guildsPromise,
    fetchEntries(userId, habits.map((habit) => habit.id), since),
  ])

  const guilds: Guild[] = guildsResult.error
    ? []
    : ((guildsResult.data ?? []) as { id: string; name: string }[]).map((row) => ({
        id: row.id,
        name: row.name,
      }))

  const profile: Profile = profileResult.error
    ? { userId }
    : {
        userId,
        displayName: (profileResult.data as { display_name?: string } | null)?.display_name,
        avatarUrl: (profileResult.data as { avatar_url?: string } | null)?.avatar_url,
        adornment: (profileResult.data as { adornment?: string } | null)?.adornment,
      }

  return {
    profile,
    habits,
    entries,
    guilds,
    fetchedAt: Date.now(),
  }
}

export interface DayValueWrite {
  userId: string
  habitId: string
  date: string
  entryId: string
  value: number | null
}

async function deleteCell(userId: string, habitId: string, date: string): Promise<void> {
  if (!supabase) throw new Error('Mirror Habit is not configured.')
  const { data, error } = await supabase
    .from('entries')
    .select('id')
    .eq('user_id', userId)
    .eq('habit_id', habitId)
    .eq('date', date)
  if (error) throw error
  const ids = (data ?? []).map((row: { id: string }) => row.id)
  if (ids.length === 0) return

  const { error: syncError } = await supabase.from('entry_sync').delete().in('entry_id', ids)
  if (syncError) throw syncError
  const { error: entriesError } = await supabase.from('entries').delete().in('id', ids)
  if (entriesError) throw entriesError
}

export async function writeDayValue(input: DayValueWrite): Promise<void> {
  if (!supabase) throw new Error('Mirror Habit is not configured.')
  const { userId, habitId, date, entryId, value } = input

  if (value === 0) {
    await deleteCell(userId, habitId, date)
    return
  }

  const { data: leftovers, error: leftoversError } = await supabase
    .from('entries')
    .select('id')
    .eq('user_id', userId)
    .eq('habit_id', habitId)
    .eq('date', date)
    .neq('id', entryId)
  if (leftoversError) throw leftoversError

  const leftoverIds = (leftovers ?? []).map((row: { id: string }) => row.id)
  if (leftoverIds.length > 0) {
    const { error: syncError } = await supabase
      .from('entry_sync')
      .delete()
      .in('entry_id', leftoverIds)
    if (syncError) throw syncError
    const { error: deleteError } = await supabase.from('entries').delete().in('id', leftoverIds)
    if (deleteError) throw deleteError
  }

  const { error: syncError } = await supabase.from('entry_sync').upsert(
    {
      entry_id: entryId,
      user_id: userId,
      confirmed: false,
    },
    { onConflict: 'entry_id' },
  )
  if (syncError) throw syncError

  const { error: entryError } = await supabase.from('entries').upsert(
    {
      id: entryId,
      habit_id: habitId,
      user_id: userId,
      date,
      value,
    },
    { onConflict: 'id' },
  )
  if (entryError) throw entryError
}
