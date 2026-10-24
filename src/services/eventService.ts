import { SEED_COMMUNITIES } from '../data/communities'
import { DEFAULT_LOCALITY_ID, getLocality } from '../data/localities'
import type { Event, EventFilters, EventInput, EventWithMeta } from '../types'
import { distanceKm } from '../utils/geo'
import { isSameLocalDay, toDateInput } from '../utils/format'
import { delay } from './bus'
import { DEMO_OWNER_ID, authAdapter } from './authAdapter'
import { readEvents, readFollowedIds, readRsvps, writeEvents } from './db'

export const defaultFilters: EventFilters = {
  query: '',
  category: 'all',
  date: 'any',
  customDate: undefined,
  price: 'all',
  radiusKm: 0,
  sort: 'recommended',
  localityId: DEFAULT_LOCALITY_ID,
  interests: ['AI/ML', 'Web Development', 'Technology'],
}

/** Adds derived fields (distance, seats, recommendation). Pure; takes everything it needs. */
export function enrichEvent(
  event: Event,
  opts: { localityId: string; interests: string[]; goingIds: Set<string>; followedIds: Set<string> },
): EventWithMeta {
  const loc = getLocality(opts.localityId)
  const dist = distanceKm(loc.lat, loc.lng, event.lat, event.lng)
  const isRsvped = opts.goingIds.has(event.id)
  const rsvpCount = event.baseRsvpCount + (isRsvped ? 1 : 0)
  const seatsLeft = Math.max(event.capacity - rsvpCount, 0)

  const reasons: { weight: number; text: string }[] = []
  if (opts.interests.includes(event.category))
    reasons.push({ weight: 40, text: `Matches your interest in ${event.category}` })
  if (event.communityId && opts.followedIds.has(event.communityId)) {
    const c = SEED_COMMUNITIES.find((x) => x.id === event.communityId)
    reasons.push({ weight: 35, text: `From ${c?.name ?? 'a community'} you follow` })
  }
  if (dist <= 3) reasons.push({ weight: 20, text: `Close to ${loc.name}` })
  else if (dist <= 6) reasons.push({ weight: 10, text: `Within a short ride of ${loc.name}` })
  const daysAway = (new Date(event.startsAt).getTime() - Date.now()) / 86_400_000
  if (daysAway >= 0 && daysAway <= 3) reasons.push({ weight: 12, text: 'Happening soon' })
  const popularity = event.capacity > 0 ? rsvpCount / event.capacity : 0
  if (popularity >= 0.6) reasons.push({ weight: 8, text: 'Popular with students nearby' })

  reasons.sort((a, b) => b.weight - a.weight)
  const score = reasons.reduce((s, r) => s + r.weight, 0) + popularity * 10

  return {
    ...event,
    distanceKm: dist,
    seatsLeft,
    rsvpCount,
    isRsvped,
    recommendation: reasons[0]?.text ?? 'Something new to explore nearby',
    recommendationScore: score,
  }
}

function buildContext(localityId: string, interests: string[]) {
  const goingIds = new Set(
    readRsvps()
      .filter((r) => r.status === 'going')
      .map((r) => r.eventId),
  )
  return { localityId, interests, goingIds, followedIds: new Set(readFollowedIds()) }
}

function matchesDate(event: Event, filters: EventFilters): boolean {
  const start = new Date(event.startsAt)
  const now = new Date()
  switch (filters.date) {
    case 'today':
      return isSameLocalDay(start, now)
    case 'week':
      return start.getTime() <= now.getTime() + 7 * 86_400_000
    case 'weekend': {
      const day = start.getDay()
      const withinTwoWeeks = start.getTime() <= now.getTime() + 14 * 86_400_000
      return (day === 0 || day === 6) && withinTwoWeeks
    }
    case 'custom':
      return filters.customDate ? toDateInput(event.startsAt) === filters.customDate : true
    default:
      return true
  }
}

/** All stored events as plain records. Backend equivalent: GET /events */
export async function getEvents(): Promise<Event[]> {
  await delay()
  return readEvents()
}

/** Single event with derived fields. Backend equivalent: GET /events/:id */
export async function getEventById(
  id: string,
  localityId: string = DEFAULT_LOCALITY_ID,
  interests: string[] = defaultFilters.interests,
): Promise<EventWithMeta | null> {
  await delay(250)
  const event = readEvents().find((e) => e.id === id)
  return event ? enrichEvent(event, buildContext(localityId, interests)) : null
}

/** Discovery search. Only published, not-yet-ended events are returned. Backend equivalent: GET /events?...  */
export async function searchEvents(filters: EventFilters): Promise<EventWithMeta[]> {
  await delay()
  const ctx = buildContext(filters.localityId, filters.interests)
  const q = filters.query.trim().toLowerCase()
  const now = Date.now()

  const results = readEvents()
    .filter((e) => e.status === 'published' && new Date(e.endsAt).getTime() >= now)
    .filter((e) => (q ? e.title.toLowerCase().includes(q) : true))
    .filter((e) => (filters.category === 'all' ? true : e.category === filters.category))
    .filter((e) => matchesDate(e, filters))
    .filter((e) => (filters.price === 'free' ? e.price === 0 : filters.price === 'paid' ? e.price > 0 : true))
    .map((e) => enrichEvent(e, ctx))
    .filter((e) => (filters.radiusKm > 0 ? (e.distanceKm ?? Infinity) <= filters.radiusKm : true))

  switch (filters.sort) {
    case 'soonest':
      results.sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      break
    case 'nearest':
      results.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
      break
    default:
      results.sort((a, b) => b.recommendationScore - a.recommendationScore)
  }
  return results
}

/** Events owned by the demo organizer, including drafts and cancelled events. */
export async function getOrganizerEvents(): Promise<EventWithMeta[]> {
  await delay(300)
  const ctx = buildContext(DEFAULT_LOCALITY_ID, defaultFilters.interests)
  return readEvents()
    .filter((e) => e.ownerId === DEMO_OWNER_ID)
    .map((e) => enrichEvent(e, ctx))
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
}

/** Backend equivalent: POST /events */
export async function createEvent(data: EventInput): Promise<Event> {
  await delay(500)
  const session = authAdapter.getSession()
  const event: Event = {
    ...data,
    id: `evt-${Date.now().toString(36)}`,
    ownerId: DEMO_OWNER_ID,
    organizerName: session?.name ?? 'You (demo organizer)',
    baseRsvpCount: 0,
    baseCheckIns: 0,
    isDemo: false,
  }
  writeEvents([event, ...readEvents()])
  return event
}

/** Backend equivalent: PATCH /events/:id */
export async function updateEvent(id: string, data: Partial<EventInput>): Promise<Event> {
  await delay(500)
  const events = readEvents()
  const idx = events.findIndex((e) => e.id === id)
  if (idx === -1) throw new Error('Event not found.')
  const { id: _ignored, ...rest } = data
  void _ignored
  const updated: Event = { ...events[idx], ...rest }
  events[idx] = updated
  writeEvents(events)
  return updated
}

/** Backend equivalent: POST /events/:id/cancel */
export async function cancelEvent(id: string): Promise<void> {
  await delay(400)
  const events = readEvents()
  const idx = events.findIndex((e) => e.id === id)
  if (idx === -1) throw new Error('Event not found.')
  events[idx] = { ...events[idx], status: 'cancelled' }
  writeEvents(events)
}
