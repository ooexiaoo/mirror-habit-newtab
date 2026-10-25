import type { Guild, Habit, HabitEntry, Measurement, Period } from './types'
import { isInPeriod, lastNDayKeys, streakForDailyDates, todayKey } from './date'

export interface HabitWeekDay {
  date: string
  done: boolean
}

export interface HabitView {
  habit: Habit
  guildName: string | null
  todayEntries: HabitEntry[]
  periodEntries: HabitEntry[]
  todayValue: number
  periodValue: number
  target: number
  completed: boolean
  progress: number
  streak: number
  week: HabitWeekDay[]
  pinned: boolean
}

export interface HabitGroup {
  id: string
  label: string
  habits: HabitView[]
}

const isAmount = (habit: Habit): boolean =>
  habit.measurement === 'counted' || habit.measurement === 'measured'

const DAY_MS = 24 * 60 * 60 * 1000

/** The site stores the end of a habit in two columns: deadline habits use
 *  `due_date`, everything else uses `challenge_end_date` — same as
 *  `getChallengeEndDate` / `getDeadlineStatus` in the app. */
export function habitDeadline(habit: Habit): string | undefined {
  return habit.measurement === 'deadline' ? habit.dueDate : habit.challengeEndDate
}

/** One day of grace, like `getDeadlineStatus`: past deadlines still show for
 *  24 hours, then they are history. Matches the app's home-screen widget,
 *  which additionally drops challenges the moment their window ends — this
 *  tab is the same kind of secondary surface. */
export function isNewTabVisible(habit: Habit): boolean {
  if (habit.archived) return false
  const deadline = habitDeadline(habit)
  if (deadline) {
    const endMs = new Date(deadline).getTime()
    if (Number.isFinite(endMs) && endMs <= Date.now() - DAY_MS) return false
  }
  if (habit.isChallenge && habit.measurement !== 'deadline') {
    const end = habit.challengeEndDate
    if (end) {
      const endMs = new Date(end).getTime()
      if (Number.isFinite(endMs) && endMs <= Date.now()) return false
    }
  }
  return true
}

const nullValue = (habit: Habit): number => (habit.measurement === 'counted' ? 1 : 0)

export function cellRows(entries: HabitEntry[], habitId: string, date: string): HabitEntry[] {
  return entries.filter((entry) => entry.habitId === habitId && entry.date === date)
}

export function cellValue(habit: Habit, entries: HabitEntry[], date: string): number {
  const rows = cellRows(entries, habit.id, date)
  if (!isAmount(habit)) return rows.length > 0 ? 1 : 0
  return rows.reduce((sum, entry) => sum + (entry.value ?? nullValue(habit)), 0)
}

export function periodRows(habit: Habit, entries: HabitEntry[]): HabitEntry[] {
  return entries.filter(
    (entry) =>
      entry.habitId === habit.id &&
      isInPeriod(entry.date, habit.period === 'none' ? 'none' : habit.period),
  )
}

export function periodValue(habit: Habit, entries: HabitEntry[]): number {
  const rows = periodRows(habit, entries)
  if (!isAmount(habit)) return rows.length > 0 ? 1 : 0
  return rows.reduce((sum, entry) => sum + (entry.value ?? nullValue(habit)), 0)
}

export function habitTarget(habit: Habit): number {
  return Math.max(habit.target ?? 1, 1)
}

export function isHabitComplete(habit: Habit, entries: HabitEntry[], date = todayKey()): boolean {
  if (habit.period === 'daily') {
    if (isAmount(habit)) return cellValue(habit, entries, date) >= habitTarget(habit)
    return cellRows(entries, habit.id, date).length > 0
  }
  if (habit.period === 'none') {
    if (isAmount(habit)) {
      return entries
        .filter((entry) => entry.habitId === habit.id)
        .reduce((sum, entry) => sum + (entry.value ?? nullValue(habit)), 0) >= habitTarget(habit)
    }
    return entries.some((entry) => entry.habitId === habit.id)
  }
  if (isAmount(habit)) return periodValue(habit, entries) >= habitTarget(habit)
  return periodRows(habit, entries).length > 0
}

function dayComplete(habit: Habit, entries: HabitEntry[], date: string): boolean {
  if (isAmount(habit)) {
    return (
      cellRows(entries, habit.id, date).reduce(
        (sum, entry) => sum + (entry.value ?? nullValue(habit)),
        0,
      ) >= habitTarget(habit)
    )
  }
  return cellRows(entries, habit.id, date).length > 0
}

export function buildHabitViews(
  habits: Habit[],
  entries: HabitEntry[],
  guilds: Guild[],
  pinnedHabitIds: string[],
): HabitView[] {
  const guildNames = new Map(guilds.map((guild) => [guild.id, guild.name]))
  const pinned = new Set(pinnedHabitIds)
  const today = todayKey()

  return habits
    .filter(isNewTabVisible)
    .map((habit) => {
      const todayValue = cellValue(habit, entries, today)
      const currentPeriodValue = periodValue(habit, entries)
      const target = habitTarget(habit)
      const completed = isHabitComplete(habit, entries, today)
      const progress = completed
        ? 1
        : isAmount(habit)
          ? Math.min(currentPeriodValue / target, 1)
          : 0
      const dates = entries.filter((entry) => entry.habitId === habit.id).map((entry) => entry.date)
      const streak = habit.period === 'daily'
        ? streakForDailyDates(dates, (date) => dayComplete(habit, entries, date))
        : 0

      return {
        habit,
        guildName: habit.groupId ? guildNames.get(habit.groupId) ?? null : null,
        todayEntries: cellRows(entries, habit.id, today),
        periodEntries: periodRows(habit, entries),
        todayValue,
        periodValue: currentPeriodValue,
        target,
        completed,
        progress,
        streak,
        week: lastNDayKeys(7).map((date) => ({
          date,
          done: dayComplete(habit, entries, date),
        })),
        pinned: pinned.has(habit.id),
      }
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      if (a.guildName !== b.guildName) {
        if (a.guildName === null) return -1
        if (b.guildName === null) return 1
        return a.guildName.localeCompare(b.guildName)
      }
      return a.habit.name.localeCompare(b.habit.name)
    })
}

export function groupHabitViews(views: HabitView[]): HabitGroup[] {
  const groups = new Map<string, HabitGroup>()
  for (const view of views) {
    const id = view.habit.groupId ?? 'personal'
    const existing = groups.get(id)
    if (existing) {
      existing.habits.push(view)
    } else {
      groups.set(id, {
        id,
        label: view.guildName ?? 'Personal',
        habits: [view],
      })
    }
  }
  return Array.from(groups.values())
}

export function measurementLabel(measurement: Measurement): string {
  switch (measurement) {
    case 'counted':
      return 'Counted'
    case 'measured':
      return 'Measured'
    case 'avoidance':
      return 'Avoidance'
    case 'deadline':
      return 'Deadline'
    default:
      return 'Binary'
  }
}

export function periodLabel(period: Period): string {
  if (period === 'daily') return 'today'
  if (period === 'weekly') return 'this week'
  if (period === 'monthly') return 'this month'
  return 'all time'
}

export function formatAmount(value: number, habit: Habit): string {
  const rounded = Math.round(value * 10) / 10
  const display = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1)
  return habit.unit ? `${display} ${habit.unit}` : display
}

export function formatTarget(habit: Habit): string {
  if (!isAmount(habit)) return ''
  return formatAmount(habitTarget(habit), habit)
}

export function progressText(view: HabitView): string {
  if (!isAmount(view.habit)) return view.completed ? 'Done' : 'Not yet'
  const current = formatAmount(view.periodValue, view.habit)
  const target = formatAmount(view.target, view.habit)
  return `${current} / ${target}`
}

export function actionLabel(view: HabitView): string {
  if (view.habit.measurement === 'avoidance') return view.completed ? 'Clean' : 'Mark clean'
  if (view.habit.measurement === 'measured') return 'Log amount'
  if (view.habit.measurement === 'counted') return 'Add one'
  return view.completed ? 'Done' : 'Mark done'
}

export function cellEntryId(userId: string, habitId: string, date: string): string {
  const user = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)
  const habit = habitId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 48)
  return `ext-${user}-${habit}-${date}`
}
