import { getLocal, removeLocal, setLocal } from './storage'
import type { PendingCheckIn } from './types'
import { writeDayValue } from './dashboard'

const pendingKey = (userId: string): string => `mirror-habit-newtab-pending:${userId}`

export async function loadPending(userId: string): Promise<PendingCheckIn[]> {
  const queued = await getLocal<PendingCheckIn[]>(pendingKey(userId), [])
  return Array.isArray(queued) ? queued : []
}

export async function savePending(userId: string, queued: PendingCheckIn[]): Promise<void> {
  if (queued.length === 0) {
    await removeLocal(pendingKey(userId))
    return
  }
  await setLocal(pendingKey(userId), queued)
}

export async function queuePending(userId: string, operation: PendingCheckIn): Promise<void> {
  const queued = await loadPending(userId)
  const next = [
    ...queued.filter(
      (item) => !(item.habitId === operation.habitId && item.date === operation.date),
    ),
    operation,
  ]
  await savePending(userId, next)
}

export async function flushPending(userId: string): Promise<number> {
  const queued = await loadPending(userId)
  if (queued.length === 0) return 0
  const remaining: PendingCheckIn[] = []

  for (const operation of queued) {
    try {
      await writeDayValue({
        userId,
        habitId: operation.habitId,
        date: operation.date,
        entryId: operation.entryId,
        value: operation.value,
      })
    } catch {
      remaining.push(operation)
    }
  }

  await savePending(userId, remaining)
  return queued.length - remaining.length
}
