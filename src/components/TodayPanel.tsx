import {
  ArrowRight,
  ArrowUpRight,
  CircleAlert,
  CloudOff,
  Loader2,
  RefreshCw,
  Sparkles,
  UserRound,
} from 'lucide-react'
import type { DashboardData } from '../lib/types'
import type { HabitView } from '../lib/habits'
import { groupHabitViews } from '../lib/habits'
import type { Settings } from '../lib/settings'
import { ProgressRing } from './ProgressRing'
import { HabitRow } from './HabitRow'
import { relativeMinutes, todayKey } from '../lib/date'

interface TodayPanelProps {
  data: DashboardData | null
  views: HabitView[]
  loading: boolean
  refreshing: boolean
  error: string | null
  stale: boolean
  signedIn: boolean
  authLoading: boolean
  settings: Settings
  pendingCells: Set<string>
  onConnect: () => void
  onRefresh: () => void
  onHabitPrimary: (view: HabitView) => void
  onHabitIncrement: (view: HabitView) => void
  onMeasured: (view: HabitView, amount: number) => void
  onTogglePin: (view: HabitView) => void
  onToggleShowCompleted: () => void
}

const APP_URL = 'https://mirrorhabit.pages.dev'

function ConnectCard({ authLoading, onConnect }: { authLoading: boolean; onConnect: () => void }) {
  return (
    <div className="connect-card">
      <div className="connect-card__icon" aria-hidden="true">
        <UserRound size={22} strokeWidth={1.5} />
      </div>
      <div className="connect-card__copy">
        <h3>Your habits live here.</h3>
        <p>
          Connect your Mirror Habit account to see today&apos;s ledger and check in without
          leaving this tab.
        </p>
      </div>
      <button type="button" className="button button--primary" onClick={onConnect} disabled={authLoading}>
        {authLoading ? <Loader2 className="spin" size={16} strokeWidth={2} aria-hidden="true" /> : null}
        {authLoading ? 'Checking…' : 'Connect account'}
      </button>
      <a className="text-link" href={APP_URL} target="_blank" rel="noreferrer">
        New to Mirror Habit? Start here
        <ArrowUpRight size={13} strokeWidth={1.8} aria-hidden="true" />
      </a>
    </div>
  )
}

function SkeletonRows() {
  return (
    <div className="habit-skeleton" aria-label="Loading habits" aria-busy="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="habit-skeleton__row" key={index}>
          <span className="habit-skeleton__check" />
          <span className="habit-skeleton__content">
            <span style={{ width: `${54 + index * 9}%` }} />
            <span style={{ width: `${36 + index * 6}%` }} />
          </span>
          <span className="habit-skeleton__action" />
        </div>
      ))}
    </div>
  )
}

export function TodayPanel({
  data,
  views,
  loading,
  refreshing,
  error,
  stale,
  signedIn,
  authLoading,
  settings,
  pendingCells,
  onConnect,
  onRefresh,
  onHabitPrimary,
  onHabitIncrement,
  onMeasured,
  onTogglePin,
  onToggleShowCompleted,
}: TodayPanelProps) {
  const date = todayKey()
  const openViews = views.filter((view) => !view.completed)
  const doneViews = views.filter((view) => view.completed)
  const completed = doneViews.length
  const total = views.length
  const groups = groupHabitViews(openViews)
  const showGroupHeaders = groups.length > 1 || groups.some((group) => group.id !== 'personal')
  const allDone = total > 0 && completed === total

  return (
    <section className="today" aria-labelledby="today-title">
      <header className="today__head">
        <div className="today__heading">
          <p className="eyebrow">Today</p>
          <h2 id="today-title">
            {allDone ? 'All done.' : total > 0 ? 'Today is waiting.' : 'A fresh page.'}
          </h2>
          {signedIn && total > 0 ? (
            <p className="today__sub">
              {allDone
                ? 'Come back tomorrow. The quiet work is done.'
                : completed > 0
                  ? `${completed} of ${total} done. The rest can wait.`
                  : 'A small check-in is enough to begin.'}
            </p>
          ) : signedIn ? (
            <p className="today__sub">Your ledger will gather here.</p>
          ) : (
            <p className="today__sub">A new tab that keeps the day close.</p>
          )}
        </div>
        <div className="today__tools">
          {signedIn && total > 0 && settings.showProgress ? (
            <ProgressRing completed={completed} total={total} size={68} stroke={4} />
          ) : null}
          {signedIn ? (
            <button
              type="button"
              className="icon-button"
              onClick={onRefresh}
              aria-label="Refresh habits"
              title="Refresh habits"
              disabled={refreshing}
            >
              <RefreshCw
                className={refreshing ? 'spin' : undefined}
                size={15}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </button>
          ) : null}
        </div>
      </header>

      {!signedIn ? (
        <ConnectCard authLoading={authLoading} onConnect={onConnect} />
      ) : loading && !data ? (
        <SkeletonRows />
      ) : error && !data ? (
        <div className="state-card state-card--error">
          <CircleAlert size={22} strokeWidth={1.6} aria-hidden="true" />
          <div>
            <h3>Could not reach your ledger.</h3>
            <p>{error}</p>
          </div>
          <button type="button" className="button button--quiet" onClick={onRefresh}>
            Try again
          </button>
        </div>
      ) : data && total === 0 ? (
        <div className="state-card">
          <Sparkles size={22} strokeWidth={1.5} aria-hidden="true" />
          <div>
            <h3>No habits yet.</h3>
            <p>Join a guild or open your private ledger in the app to add your first habit.</p>
          </div>
          <a className="button button--quiet" href={APP_URL} target="_blank" rel="noreferrer">
            Open Mirror Habit
            <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
          </a>
        </div>
      ) : data ? (
        <div className="today__body">
          {stale ? (
            <div className="stale-note" role="status">
              <CloudOff size={14} strokeWidth={1.8} aria-hidden="true" />
              <span>
                Showing your last synced ledger from {relativeMinutes(data.fetchedAt)}.
              </span>
              <button type="button" onClick={onRefresh} disabled={refreshing}>
                Sync now
              </button>
            </div>
          ) : null}

          {openViews.length === 0 && total > 0 ? (
            <div className="all-done">
              <span className="all-done__mark" aria-hidden="true">
                <Sparkles size={17} strokeWidth={1.6} />
              </span>
              <p>Everything is checked off for today.</p>
            </div>
          ) : (
            <div className="habit-groups">
              {groups.map((group) => (
                <div className="habit-group" key={group.id}>
                  {showGroupHeaders ? (
                    <p className="habit-group__label">
                      {group.label}
                      <span>{group.habits.length}</span>
                    </p>
                  ) : null}
                  <ul className="habit-list">
                    {group.habits.map((view) => {
                      const index = views.findIndex((item) => item.habit.id === view.habit.id)
                      return (
                        <HabitRow
                          key={view.habit.id}
                          view={view}
                          index={index}
                          pending={pendingCells.has(`${view.habit.id}:${date}`)}
                          density={settings.density}
                          showGuild={settings.showGuildLabels}
                          showChallenge={settings.showChallengeBadges}
                          showWeekRail={settings.showWeekRail}
                          onPrimary={onHabitPrimary}
                          onIncrement={onHabitIncrement}
                          onMeasured={onMeasured}
                          onTogglePin={onTogglePin}
                        />
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {doneViews.length > 0 ? (
            <div className="completed-block">
              <button
                type="button"
                className="completed-toggle"
                onClick={onToggleShowCompleted}
                aria-expanded={settings.showCompleted}
              >
                <span>{settings.showCompleted ? 'Hide completed' : `Show completed · ${doneViews.length}`}</span>
                <span className="completed-toggle__rule" aria-hidden="true" />
              </button>
              {settings.showCompleted ? (
                <ul className="habit-list habit-list--completed">
                  {doneViews.map((view) => {
                    const index = views.findIndex((item) => item.habit.id === view.habit.id)
                    return (
                      <HabitRow
                        key={view.habit.id}
                        view={view}
                        index={index}
                        pending={pendingCells.has(`${view.habit.id}:${date}`)}
                        density={settings.density}
                        showGuild={settings.showGuildLabels}
                        showChallenge={settings.showChallengeBadges}
                        showWeekRail={settings.showWeekRail}
                        onPrimary={onHabitPrimary}
                        onIncrement={onHabitIncrement}
                        onMeasured={onMeasured}
                        onTogglePin={onTogglePin}
                      />
                    )
                  })}
                </ul>
              ) : null}
            </div>
          ) : null}

          <footer className="today__footer">
            <a href={APP_URL} target="_blank" rel="noreferrer">
              Open your full ledger
              <ArrowUpRight size={13} strokeWidth={1.8} aria-hidden="true" />
            </a>
            <span className="today__footer-note">Synced with Mirror Habit</span>
          </footer>
        </div>
      ) : null}
    </section>
  )
}
