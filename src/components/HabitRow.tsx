import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  Check,
  Flame,
  Loader2,
  Pin,
  Plus,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import type { HabitView } from '../lib/habits'
import { actionLabel, periodLabel, progressText } from '../lib/habits'
import { TimeLeft } from './TimeLeft'
import type { Density } from '../lib/settings'

interface HabitRowProps {
  view: HabitView
  index: number
  pending: boolean
  density: Density
  showGuild: boolean
  showChallenge: boolean
  showWeekRail: boolean
  onPrimary: (view: HabitView) => void
  onIncrement: (view: HabitView) => void
  onMeasured: (view: HabitView, amount: number) => void
  onTogglePin: (view: HabitView) => void
}

function Rail({ view }: { view: HabitView }) {
  return (
    <div className="week-rail" aria-hidden="true">
      {view.week.map((day) => (
        <span
          key={day.date}
          className="week-rail__day"
          data-done={day.done}
          title={day.date}
        />
      ))}
    </div>
  )
}

export function HabitRow({
  view,
  index,
  pending,
  density,
  showGuild,
  showChallenge,
  showWeekRail,
  onPrimary,
  onIncrement,
  onMeasured,
  onTogglePin,
}: HabitRowProps) {
  const { habit } = view
  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const isAmountHabit = habit.measurement === 'counted' || habit.measurement === 'measured'
  const isMeasured = habit.measurement === 'measured'
  const interactiveLabel = isMeasured
    ? `Log an amount for ${habit.name}`
    : isAmountHabit
      ? `Add one to ${habit.name}`
      : view.completed
        ? `Mark ${habit.name} as not done`
        : `Mark ${habit.name} as done`

  useEffect(() => {
    if (editing) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 30)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [editing])

  const openEditor = () => {
    setAmount('')
    setEditing(true)
  }

  const submitAmount = (event: FormEvent) => {
    event.preventDefault()
    const parsed = Number.parseFloat(amount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      inputRef.current?.focus()
      return
    }
    onMeasured(view, parsed)
    setEditing(false)
    setAmount('')
  }

  return (
    <li
      className="habit-row"
      data-completed={view.completed}
      data-pending={pending}
      data-density={density}
      data-measured={isMeasured}
      data-habit-index={index}
    >
      <button
        type="button"
        className="habit-check"
        onClick={() => {
          if (isMeasured) {
            openEditor()
            return
          }
          if (isAmountHabit) {
            onIncrement(view)
            return
          }
          onPrimary(view)
        }}
        aria-pressed={view.completed}
        aria-label={interactiveLabel}
      >
        {pending ? (
          <Loader2 className="spin" size={16} strokeWidth={1.9} aria-hidden="true" />
        ) : view.completed ? (
          <Check size={17} strokeWidth={2.4} aria-hidden="true" />
        ) : (
          <span className="habit-check__dot" aria-hidden="true" />
        )}
      </button>

      <div className="habit-content">
        <div className="habit-line">
          <span className="habit-name">{habit.name}</span>
          {showChallenge && habit.isChallenge ? (
            <span className="habit-badge">
              <Sparkles size={11} strokeWidth={1.9} aria-hidden="true" />
              Challenge
            </span>
          ) : null}
          {view.pinned ? (
            <span className="habit-pin-indicator" aria-label="Pinned">
              <Pin size={11} strokeWidth={2} aria-hidden="true" />
            </span>
          ) : null}
        </div>

        <div className="habit-meta">
          {showGuild && view.guildName ? (
            <span className="habit-meta__item">
              <UsersRound size={12} strokeWidth={1.8} aria-hidden="true" />
              {view.guildName}
            </span>
          ) : null}
          {isAmountHabit ? (
            <span className="habit-meta__item">
              {progressText(view)}
              {habit.period !== 'daily' ? <span className="habit-meta__quiet"> · {periodLabel(habit.period)}</span> : null}
            </span>
          ) : (
            <span className="habit-meta__item">{view.completed ? actionLabel(view) : 'One check for today'}</span>
          )}
          {habit.period === 'daily' && view.streak > 0 ? (
            <span className="habit-meta__item habit-meta__streak">
              <Flame size={12} strokeWidth={1.9} aria-hidden="true" />
              {view.streak} day{view.streak === 1 ? '' : 's'}
            </span>
          ) : null}
          <TimeLeft habit={habit} />
          {pending ? <span className="habit-meta__pending">Saving…</span> : null}
        </div>

        {isAmountHabit && !view.completed ? (
          <div className="habit-progress" aria-hidden="true">
            <span style={{ width: `${Math.max(view.progress * 100, view.todayValue > 0 ? 4 : 0)}%` }} />
          </div>
        ) : null}

        {showWeekRail && habit.period === 'daily' ? <Rail view={view} /> : null}

        {editing ? (
          <form className="amount-form" onSubmit={submitAmount}>
            <label className="amount-form__label" htmlFor={`amount-${habit.id}`}>
              Add {habit.unit ?? 'amount'}
            </label>
            <div className="amount-form__control">
              <input
                ref={inputRef}
                id={`amount-${habit.id}`}
                className="amount-form__input"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.stopPropagation()
                    setEditing(false)
                    setAmount('')
                  }
                }}
                placeholder={String(view.target)}
              />
              {habit.unit ? <span className="amount-form__unit">{habit.unit}</span> : null}
              <button type="submit" className="amount-form__submit">
                Add
              </button>
              <button
                type="button"
                className="amount-form__cancel"
                onClick={() => {
                  setEditing(false)
                  setAmount('')
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </div>

      <div className="habit-actions">
        {isAmountHabit && !view.completed ? (
          <button
            type="button"
            className="habit-quick"
            onClick={() => {
              if (isMeasured) openEditor()
              else onIncrement(view)
            }}
            aria-label={isMeasured ? `Log an amount for ${habit.name}` : `Add one to ${habit.name}`}
            title={isMeasured ? 'Log amount' : 'Add one'}
          >
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        ) : null}
        <button
          type="button"
          className="habit-pin"
          data-pinned={view.pinned}
          onClick={() => onTogglePin(view)}
          aria-label={view.pinned ? `Unpin ${habit.name}` : `Pin ${habit.name}`}
          aria-pressed={view.pinned}
          title={view.pinned ? 'Unpin' : 'Pin'}
        >
          <Pin size={13} strokeWidth={1.9} fill={view.pinned ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}
