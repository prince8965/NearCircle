import type { Event, EventWithMeta, RSVP } from '../types'
import { DEFAULT_LOCALITY_ID } from '../data/localities'
import { delay } from './bus'
import { authAdapter } from './authAdapter'
import { readEvents, readFollowedIds, readRsvps, writeRsvps } from './db'
import { defaultFilters, enrichEvent } from './eventService'

function ticketCode(): string {
  return `NC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

/**
 * Creates an RSVP. Duplicate and capacity checks here are FRONTEND SIMULATIONS only —
 * the real backend must enforce uniqueness and capacity atomically (e.g. unique index + transaction).
 * Backend equivalent: POST /events/:id/rsvps
 */
export async function createRSVP(eventId: string): Promise<RSVP> {
  await delay(450)
  const event = readEvents().find((e) => e.id === eventId)
  if (!event) throw new Error('Event not found.')
  if (event.status !== 'published') throw new Error('This event is not open for RSVPs.')
  if (new Date(event.endsAt).getTime() < Date.now()) throw new Error('This event has already ended.')

  const rsvps = readRsvps()
  const existing = rsvps.find((r) => r.eventId === eventId && r.status === 'going')
  if (existing) throw new Error('You have already RSVPed to this event.')

  const going = event.baseRsvpCount
  if (going >= event.capacity) throw new Error('Sorry, this event is full.')

  const previous = rsvps.find((r) => r.eventId === eventId)
  const rsvp: RSVP = {
    id: previous?.id ?? `rsvp-${Date.now().toString(36)}`,
    eventId,
    userId: authAdapter.getSession()?.id ?? 'guest',
    status: 'going',
    createdAt: new Date().toISOString(),
    ticketCode: previous?.ticketCode ?? ticketCode(),
  }
  writeRsvps([...rsvps.filter((r) => r.eventId !== eventId), rsvp])
  return rsvp
}

/** Backend equivalent: DELETE /events/:id/rsvps/me */
export async function cancelRSVP(eventId: string): Promise<void> {
  await delay(350)
  const rsvps = readRsvps()
  const target = rsvps.find((r) => r.eventId === eventId && r.status === 'going')
  if (!target) throw new Error('No active RSVP found for this event.')
  writeRsvps(rsvps.map((r) => (r.id === target.id ? { ...r, status: 'cancelled' as const } : r)))
}

export interface MyEventEntry {
  rsvp: RSVP
  event: EventWithMeta
  isPast: boolean
}

/** Backend equivalent: GET /me/rsvps */
export async function getMyEvents(
  localityId: string = DEFAULT_LOCALITY_ID,
  interests: string[] = defaultFilters.interests,
): Promise<{ upcoming: MyEventEntry[]; past: MyEventEntry[] }> {
  await delay(300)
  const events = readEvents()
  const goingIds = new Set(
    readRsvps()
      .filter((r) => r.status === 'going')
      .map((r) => r.eventId),
  )
  const followedIds = new Set(readFollowedIds())
  const entries: MyEventEntry[] = readRsvps()
    .filter((r) => r.status === 'going')
    .flatMap((rsvp) => {
      const event: Event | undefined = events.find((e) => e.id === rsvp.eventId)
      if (!event) return []
      return [
        {
          rsvp,
          event: enrichEvent(event, { localityId, interests, goingIds, followedIds }),
          isPast: new Date(event.endsAt).getTime() < Date.now(),
        },
      ]
    })
  return {
    upcoming: entries.filter((e) => !e.isPast).sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt)),
    past: entries.filter((e) => e.isPast).sort((a, b) => b.event.startsAt.localeCompare(a.event.startsAt)),
  }
}
