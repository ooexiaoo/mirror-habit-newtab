import { useEffect, useState } from 'react'
import { countdownFor, countdownText, nextResetDate } from '../lib/date'
import { habitDeadline } from '../lib/habits'
import type { Habit } from '../lib/types'

/**
 * One "resets in …" / "ends in …" line, ticking once a second like the app's
 * Countdown. Challenges and deadline habits show the time left on their
 * window; periodic habits show the time until the next reset.
 */
export function TimeLeft({ habit }: { habit: Habit }) {
  const compute = (): string | null => {
    const now = new Date()
    const deadline = habitDeadline(habit)
    if (deadline) {
      const isWindow = habit.measurement === 'deadline' || habit.isChallenge
      if (isWindow || habit.period === 'none') {
        const text = countdownFor(deadline, now)
        if (text) return `ends in ${text}`
      }
    }
    const reset = nextResetDate(habit.period, now)
    if (!reset) return null
    const text = countdownText(reset.getTime() - now.getTime())
    return text ? `resets in ${text}` : null
  }

  const [label, setLabel] = useState(compute)

  useEffect(() => {
    const tick = () => setLabel(compute())
    const id = window.setInterval(tick, 1000)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
    // The compute closure reads only `habit`, so one subscription is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habit])

  if (!label) return null
  return (
    <span className="habit-meta__item habit-meta__time" aria-label={label}>
      {label}
    </span>
  )
}
