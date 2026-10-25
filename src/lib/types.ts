export type Measurement = 'binary' | 'counted' | 'measured' | 'deadline' | 'avoidance'
export type Period = 'daily' | 'weekly' | 'monthly' | 'none'

export interface Habit {
  id: string
  groupId: string | null
  name: string
  description?: string
  createdBy: string
  createdAt: string
  measurement: Measurement
  period: Period
  target?: number
  unit?: string
  dueDate?: string
  anonymous: boolean
  isChallenge: boolean
  challengeEndDate?: string
  imageUrl?: string
  bannerUrl?: string
  visibility: 'public' | 'private'
  archived?: boolean
}

export interface HabitEntry {
  id: string
  habitId: string
  userId: string
  date: string
  value?: number
}

export interface Subscription {
  habitId: string
  joinedAt: string
}

export interface Guild {
  id: string
  name: string
}

export interface Profile {
  userId: string
  displayName?: string
  avatarUrl?: string
  adornment?: string
}

export interface DashboardData {
  profile: Profile
  habits: Habit[]
  entries: HabitEntry[]
  guilds: Guild[]
  fetchedAt: number
}

export interface PendingCheckIn {
  habitId: string
  date: string
  entryId: string
  value: number | null
  queuedAt: number
}

export interface WeatherLocation {
  lat: number
  lon: number
  label: string
}

export interface PlaceResult {
  id: number
  name: string
  country?: string
  admin1?: string
  latitude: number
  longitude: number
}
