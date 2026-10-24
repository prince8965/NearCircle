/**
 * Raw localStorage "tables". Services are the only code that should import this file.
 * Replace with real API calls when the backend is ready.
 */
import { SEED_EVENTS } from '../data/events'
import type { Event, RSVP } from '../types'
import { readStore, writeStore } from '../utils/storage'
import { notifyChange } from './bus'

const EVENTS_KEY = 'events.v1'
const RSVPS_KEY = 'rsvps.v1'
const FOLLOWS_KEY = 'follows.v1'

export function readEvents(): Event[] {
  const stored = readStore<Event[] | null>(EVENTS_KEY, null)
  if (stored) return stored
  writeStore(EVENTS_KEY, SEED_EVENTS)
  return SEED_EVENTS
}

export function writeEvents(events: Event[]): void {
  writeStore(EVENTS_KEY, events)
  notifyChange()
}

export function readRsvps(): RSVP[] {
  const stored = readStore<RSVP[] | null>(RSVPS_KEY, null)
  if (stored) return stored
  // One demo RSVP to a past event so the "Past" tab is not empty on first run.
  const seeded: RSVP[] = [
    {
      id: 'rsvp-seed-1',
      eventId: 'evt-past-python',
      userId: 'guest',
      status: 'going',
      createdAt: new Date(Date.now() - 10 * 86_400_000).toISOString(),
      ticketCode: 'NC-DEMO01',
    },
  ]
  writeStore(RSVPS_KEY, seeded)
  return seeded
}

export function writeRsvps(rsvps: RSVP[]): void {
  writeStore(RSVPS_KEY, rsvps)
  notifyChange()
}

export function readFollowedIds(): string[] {
  return readStore<string[]>(FOLLOWS_KEY, [])
}

export function writeFollowedIds(ids: string[]): void {
  writeStore(FOLLOWS_KEY, ids)
  notifyChange()
}
