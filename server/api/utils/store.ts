import type { RequestEvent } from 'nuxt/server'
import { getCookie, setCookie } from 'nuxt/server'
import { addDays, addMinutes, addWeeks, set, startOfWeek } from 'date-fns'
import { toLocalISO, WEEKS_AROUND } from '~~/shared/utils/time'

// What the handlers need from an event collection, so a session can stand in
// for the seeded Map with a copy-on-write view
interface EventSource {
  set(id: string, event: CalendarEvent): void
  delete(id: string): void
  values(): Iterable<CalendarEvent>
}

interface Store {
  calendars: Calendar[]
  events: EventSource
}

const calendars: Calendar[] = [
  { id: 'work', name: 'Work', color: 'info' },
  { id: 'personal', name: 'Personal', color: 'success' },
  { id: 'side-project', name: 'Side project', color: 'warning' }
]

function at(day: Date, hours: number, minutes = 0): Date {
  return set(day, { hours, minutes, seconds: 0, milliseconds: 0 })
}
function timed(id: string, calendarId: string, title: string, start: Date, durationMinutes: number, description?: string, salle = '', etu = '', tuteur = '', candideUn?: string, candideDeux?: string): CalendarEvent {
  return {
    id,
    calendarId,
    title,
    description,
    start: toLocalISO(start),
    end: toLocalISO(addMinutes(start, durationMinutes)),
    salle,
    etu,
    tuteur,
    candideUn,
    candideDeux,
  }
}

function allDay(id: string, calendarId: string, title: string, start: Date, days = 1, description?: string, salle = '', etu = '', tuteur = ''): CalendarEvent {
  return {
    id,
    calendarId,
    title,
    description,
    start: toLocalISO(at(start, 0)),
    end: toLocalISO(at(addDays(start, days), 0)),
    allDay: true,
    salle,
    etu,
    tuteur,
  }
}

// Stable pseudo-random in [0, 1) for a given week and event, so the same
// calendar is generated on every boot and no two weeks look alike
function chance(week: number, key: string): number {
  let hash = week * 31

  for (const char of key) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0
  }

  const value = Math.sin(hash) * 10000

  return value - Math.floor(value)
}

// Deterministic pick for a given week and key, so a drawn event varies its
// day, hour or title from week to week without losing the stable seed
function pick<T>(week: number, key: string, options: T[]): T {
  return options[Math.floor(chance(week, key) * options.length)]!
}

// Deterministic seed relative to now so the demo is always populated,
// same trick as the dashboard template's notifications endpoint
function seed(): Map<string, CalendarEvent> {
// Give the calendar a blank map =====
  return new Map()
}

function eachDayOfWeek(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(start, index))
}

// The demo is public and unauthenticated, so a single shared store would let
// anyone edit the calendar everyone else sees. Each visitor gets their own copy
// instead, forked from the seed the first time they change something.
const SESSION_COOKIE = 'calendar-session'

// Sessions live in memory, so the ceiling only has to hold for one instance
const MAX_SESSIONS = 100

const sessions = new Map<string, Store>()

let seeded: Map<string, CalendarEvent> | undefined

// Seeded once per instance on purpose: the ids are relative to the week of
// the seed, so re-seeding a live instance would silently move their meaning
// under clients that already cached them. Serverless instances recycle often
// enough to keep "today" fresh
function seedEvents(): Map<string, CalendarEvent> {
  return seeded ??= seed()
}

let base: Store | undefined

// Everyone starts from the same calendar, so visitors who only ever read it
// share this one and cost nothing
function useBaseStore(): Store {
  return base ??= { calendars, events: seedEvents() }
}

// Copy-on-write fork: a session records only its own changes and reads
// through to the shared seed, so a visitor who edits one event costs one
// entry instead of a copy of the whole store. `null` marks a deletion
function forkEvents(base: Map<string, CalendarEvent>): EventSource {
  const changes = new Map<string, CalendarEvent | null>()

  return {
    set(id, event) {
      changes.set(id, event)
    },
    delete(id) {
      changes.set(id, null)
    },
    * values() {
      for (const [id, event] of base) {
        const change = changes.get(id)

        if (change) {
          yield change
        } else if (!changes.has(id)) {
          yield event
        }
      }

      for (const [id, change] of changes) {
        if (change && !base.has(id)) {
          yield change
        }
      }
    }
  }
}

// Re-inserting keeps the Map ordered least to most recently used, so eviction
// always drops the coldest session
function touch(id: string, session: Store): Store {
  sessions.delete(id)
  sessions.set(id, session)

  return session
}

export function useStore(event: RequestEvent): Store {
  const id = getCookie(event, SESSION_COOKIE)
  const session = id && sessions.get(id)

  return session ? touch(id, session) : useBaseStore()
}

// Used by the write handlers: forking on the first mutation keeps the cookie
// off read requests, where the server rendered response could not return it
export function useEditableStore(event: RequestEvent): Store {
  const cookie = getCookie(event, SESSION_COOKIE)
  const session = cookie && sessions.get(cookie)

  if (session) {
    return touch(cookie, session)
  }

  const id = cookie || crypto.randomUUID()

  setCookie(event, SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/',
    maxAge: 60 * 60 * 24
  })

  const forked: Store = { calendars, events: forkEvents(seedEvents()) }

  sessions.set(id, forked)

  if (sessions.size > MAX_SESSIONS) {
    sessions.delete(sessions.keys().next().value!)
  }

  return forked
}
