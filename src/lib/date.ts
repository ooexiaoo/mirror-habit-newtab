export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayKey(): string {
  return toDateKey(new Date())
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export function startOfWeek(date = new Date()): Date {
  const start = new Date(date)
  const day = start.getDay()
  start.setDate(start.getDate() - ((day + 6) % 7))
  start.setHours(0, 0, 0, 0)
  return start
}

export function weekRange(date = new Date()): { start: string; end: string } {
  const start = startOfWeek(date)
  const end = addDays(start, 6)
  return { start: toDateKey(start), end: toDateKey(end) }
}

export function monthRange(date = new Date()): { start: string; end: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return { start: toDateKey(start), end: toDateKey(end) }
}

export function isInPeriod(date: string, period: 'daily' | 'weekly' | 'monthly' | 'none'): boolean {
  if (period === 'daily') return date === todayKey()
  if (period === 'weekly') {
    const range = weekRange()
    return date >= range.start && date <= range.end
  }
  if (period === 'monthly') {
    const range = monthRange()
    return date >= range.start && date <= range.end
  }
  return true
}

/** Next moment the habit's period rolls over — app parity with
 *  `getNextResetDate` (daily → midnight, weekly → Sunday night, monthly →
 *  month end, one-off → none). */
export function nextResetDate(period: 'daily' | 'weekly' | 'monthly' | 'none', now = new Date()): Date | null {
  if (period === 'daily') {
    const next = new Date(now)
    next.setHours(24, 0, 0, 0)
    return next
  }
  if (period === 'weekly') {
    const next = new Date(now)
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7
    next.setDate(now.getDate() + daysUntilSunday)
    next.setHours(23, 59, 59, 999)
    return next
  }
  if (period === 'monthly') {
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  }
  return null
}

/** Countdown copy, app parity with the Countdown component: `3d 4h`, then
 *  `2h 15m`, then `5m 20s`; null once the target has passed. */
export function countdownText(diffMs: number): string | null {
  const totalSeconds = Math.floor(diffMs / 1000)
  if (totalSeconds <= 0) return null
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m ${seconds}s`
}

/** Remaining time until a stored target. Date-only strings count as
 *  end-of-day local time, like the app's Countdown. */
export function countdownFor(target: string | undefined, now = new Date()): string | null {
  if (!target) return null
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(target) ? `${target}T23:59:59` : target
  const diff = new Date(iso).getTime() - now.getTime()
  if (!Number.isFinite(diff)) return null
  return countdownText(diff)
}

export function lastNDayKeys(count: number, from = new Date()): string[] {
  return Array.from({ length: count }, (_, index) => toDateKey(addDays(from, index - (count - 1))))
}

export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatClock(date: Date, hour24: boolean): { time: string; meridiem?: string } {
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !hour24,
  })
  const parts = formatter.formatToParts(date)
  const time = parts.filter((part) => part.type !== 'dayPeriod').map((part) => part.value).join('')
  const meridiem = parts.find((part) => part.type === 'dayPeriod')?.value
  return { time: time.trim(), meridiem }
}

export function greeting(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 5) return 'Still up'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function streakForDailyDates(dates: string[], complete: (date: string) => boolean): number {
  const today = todayKey()
  if (!dates.includes(today)) return 0
  let count = 0
  const known = new Set(dates)
  const cursor = new Date()
  while (known.has(toDateKey(cursor)) && complete(toDateKey(cursor))) {
    count += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}

export function relativeMinutes(timestamp: number): string {
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes === 1) return '1 min ago'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  return hours === 1 ? '1 hr ago' : `${hours} hrs ago`
}
