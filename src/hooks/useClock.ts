import { useEffect, useMemo, useState } from 'react'
import { todayKey } from '../lib/date'

export function useClock(): { now: Date; dayKey: string } {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = () => setNow(new Date())
    const interval = window.setInterval(tick, 1_000)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const dayKey = useMemo(() => todayKey(), [now])

  return { now, dayKey }
}
