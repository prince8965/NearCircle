import { SEED_COMMUNITIES } from '../data/communities'
import { DEFAULT_LOCALITY_ID, getLocality } from '../data/localities'
import type { Category, Event, EventFilters, EventInput, EventStatus, EventWithMeta } from '../types'
import { distanceKm } from '../utils/geo'
import { isSameLocalDay, toDateInput } from '../utils/format'
import { delay } from './bus'
import { DEMO_OWNER_ID, authAdapter } from './authAdapter'
import { readEvents, readFollowedIds, readRsvps, writeEvents } from './db'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { getOrganizationByOwnerId } from './communityPostService'

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

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || `evt-${Date.now().toString(36)}`
}

export function mapDbEventToEvent(row: any): Event {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category as Category,
    posterUrl: row.poster_url || undefined,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    venueName: row.venue_name,
    address: row.address,
    localityId: row.locality_id,
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    price: Number(row.price) || 0,
    capacity: row.capacity ?? 0,
    baseRsvpCount: 0,
    baseCheckIns: 0,
    organizerName: row.organizer_name || 'Organizer',
    ownerId: row.owner_id,
    organizationId: row.organization_id || undefined,
    communityId: row.community_id || undefined,
    registrationUrl: row.registration_url || undefined,
    status: row.status as EventStatus,
    tags: Array.isArray(row.tags) ? row.tags : [],
    isDemo: Boolean(row.is_demo),

    mode: row.mode || 'in-person',
    eligibility: row.eligibility || undefined,
    minTeamSize: row.min_team_size || 1,
    maxTeamSize: row.max_team_size || 4,
    registrationDeadline: row.registration_deadline || undefined,
    submissionDeadline: row.submission_deadline || undefined,
    rules: row.rules || undefined,
    prizesSummary: row.prizes_summary || undefined,
    tracks: Array.isArray(row.tags) && row.tags.length > 0 ? row.tags : undefined,
  }
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

/** Asserts that caller is an organizer or administrator. Throws otherwise. */
function assertOrganizerOrAdmin() {
  const session = authAdapter.getSession()
  if (!session) {
    throw new Error('Unauthorized: You must be signed in to manage events.')
  }
  if (session.role !== 'organizer' && session.role !== 'admin') {
    throw new Error('Forbidden: Participants and anonymous visitors cannot create or edit official events.')
  }
  return session
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
  await delay(150)
  const session = authAdapter.getSession()
  let event: Event | undefined

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (!error && data) {
        event = mapDbEventToEvent(data)
      }
    } catch (err) {
      console.warn('Could not fetch event by ID from Supabase:', err)
    }
  }

  if (!event) {
    event = readEvents().find((e) => e.id === id)
  }

  if (!event) return null

  // Draft ownership security: Drafts cannot be viewed by unauthorized users
  if (event.status === 'draft') {
    const isOwner = session && (session.id === event.ownerId || (session.id === DEMO_OWNER_ID && event.ownerId === DEMO_OWNER_ID))
    const isAdmin = session?.role === 'admin'
    if (!isOwner && !isAdmin) {
      return null
    }
  }

  return enrichEvent(event, buildContext(localityId, interests))
}

/** Discovery search. Only published, not-yet-ended events are returned. Backend equivalent: GET /events?...  */
export async function searchEvents(filters: EventFilters): Promise<EventWithMeta[]> {
  await delay()
  const ctx = buildContext(filters.localityId, filters.interests)
  const q = filters.query.trim().toLowerCase()
  const now = Date.now()

  let list: Event[] = []

  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('events')
        .select('*')
        .in('status', ['published', 'completed'])
        .gte('ends_at', new Date().toISOString())

      if (filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }

      const { data, error } = await query
      if (!error && data && data.length > 0) {
        list = data.map(mapDbEventToEvent)
      }
    } catch (err) {
      console.warn('Supabase searchEvents error, falling back to local events:', err)
    }
  }

  // Merge with local events if not already present
  const localPublished = readEvents().filter(
    (e) => e.status === 'published' && new Date(e.endsAt).getTime() >= now,
  )
  const seenIds = new Set(list.map((e) => e.id))
  for (const local of localPublished) {
    if (!seenIds.has(local.id)) {
      list.push(local)
      seenIds.add(local.id)
    }
  }

  const results = list
    .filter((e) => e.status === 'published' && new Date(e.endsAt).getTime() >= now)
    .filter((e) => (q ? e.title.toLowerCase().includes(q) || e.venueName.toLowerCase().includes(q) : true))
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

/** Events owned by the current organizer, including drafts, completed, and cancelled events. */
export async function getOrganizerEvents(): Promise<EventWithMeta[]> {
  await delay(250)
  const session = authAdapter.getSession()
  const ctx = buildContext(DEFAULT_LOCALITY_ID, defaultFilters.interests)

  if (isSupabaseConfigured() && session && session.id !== DEMO_OWNER_ID) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('owner_id', session.id)
        .order('starts_at', { ascending: false })

      if (!error && data && data.length > 0) {
        return data.map((row) => enrichEvent(mapDbEventToEvent(row), ctx))
      }
    } catch (err) {
      console.warn('Could not fetch organizer events from Supabase:', err)
    }
  }

  // Local fallback
  const ownerId = session?.id || DEMO_OWNER_ID
  return readEvents()
    .filter((e) => e.ownerId === ownerId || (ownerId === DEMO_OWNER_ID && e.ownerId === DEMO_OWNER_ID))
    .map((e) => enrichEvent(e, ctx))
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
}

/** Backend equivalent: POST /events */
export async function createEvent(data: EventInput): Promise<Event> {
  await delay(350)
  const session = assertOrganizerOrAdmin()

  // Resolve organizer's organization profile
  let orgId = session.organizationId
  let organizerName = session.name

  try {
    const org = await getOrganizationByOwnerId(session.id)
    if (org) {
      orgId = org.id
      organizerName = org.name
    }
  } catch {
    // continue with session values
  }

  if (isSupabaseConfigured() && session.id !== DEMO_OWNER_ID) {
    const slug = `${slugify(data.title)}-${Date.now().toString(36).slice(-4)}`
    const payload: Record<string, any> = {
      title: data.title.trim(),
      slug,
      description: data.description.trim() || 'No description provided.',
      category: data.category || 'Technology',
      poster_url: data.posterUrl || null,
      starts_at: data.startsAt,
      ends_at: data.endsAt,
      venue_name: data.venueName.trim() || 'Online Platform',
      address: data.address.trim() || 'Online',
      locality_id: data.localityId || 'loc-koramangala',
      lat: data.lat || 0,
      lng: data.lng || 0,
      price: data.price || 0,
      capacity: data.capacity || 50,
      status: data.status,
      owner_id: session.id,
      organization_id: orgId || null,
      organizer_name: organizerName,
      registration_url: data.registrationUrl?.trim() || null,
      registration_deadline: data.registrationDeadline || null,
      submission_deadline: data.submissionDeadline || null,
      min_team_size: data.minTeamSize || 1,
      max_team_size: data.maxTeamSize || 4,
      rules: data.rules?.trim() || null,
      prizes_summary: data.prizesSummary?.trim() || null,
      tags: data.tags || [],
      is_demo: false,
    }

    const { data: createdRow, error } = await supabase
      .from('events')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to create event in database: ${error.message}`)
    }

    const createdEvent = mapDbEventToEvent(createdRow)
    writeEvents([createdEvent, ...readEvents()])
    return createdEvent
  }

  // Local fallback
  const event: Event = {
    ...data,
    id: `evt-${Date.now().toString(36)}`,
    ownerId: session.id,
    organizationId: orgId,
    organizerName,
    baseRsvpCount: 0,
    baseCheckIns: 0,
    isDemo: false,
  }
  writeEvents([event, ...readEvents()])
  return event
}

/** Backend equivalent: PATCH /events/:id */
export async function updateEvent(id: string, data: Partial<EventInput>): Promise<Event> {
  await delay(350)
  const session = assertOrganizerOrAdmin()

  if (isSupabaseConfigured() && session.id !== DEMO_OWNER_ID) {
    // 1. Verify ownership
    const { data: existing, error: fetchErr } = await supabase
      .from('events')
      .select('owner_id, status')
      .eq('id', id)
      .maybeSingle()

    if (fetchErr || !existing) {
      throw new Error('Event not found in database.')
    }

    if (existing.owner_id !== session.id && session.role !== 'admin') {
      throw new Error('Forbidden: You can only edit events belonging to your organization.')
    }

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (data.title !== undefined) payload.title = data.title.trim()
    if (data.description !== undefined) payload.description = data.description.trim()
    if (data.category !== undefined) payload.category = data.category
    if (data.posterUrl !== undefined) payload.poster_url = data.posterUrl || null
    if (data.startsAt !== undefined) payload.starts_at = data.startsAt
    if (data.endsAt !== undefined) payload.ends_at = data.endsAt
    if (data.venueName !== undefined) payload.venue_name = data.venueName.trim()
    if (data.address !== undefined) payload.address = data.address.trim()
    if (data.localityId !== undefined) payload.locality_id = data.localityId
    if (data.lat !== undefined) payload.lat = data.lat
    if (data.lng !== undefined) payload.lng = data.lng
    if (data.price !== undefined) payload.price = data.price
    if (data.capacity !== undefined) payload.capacity = data.capacity
    if (data.status !== undefined) payload.status = data.status
    if (data.registrationUrl !== undefined) payload.registration_url = data.registrationUrl?.trim() || null
    if (data.registrationDeadline !== undefined) payload.registration_deadline = data.registrationDeadline || null
    if (data.submissionDeadline !== undefined) payload.submission_deadline = data.submissionDeadline || null
    if (data.minTeamSize !== undefined) payload.min_team_size = data.minTeamSize
    if (data.maxTeamSize !== undefined) payload.max_team_size = data.maxTeamSize
    if (data.rules !== undefined) payload.rules = data.rules?.trim() || null
    if (data.prizesSummary !== undefined) payload.prizes_summary = data.prizesSummary?.trim() || null
    if (data.tags !== undefined) payload.tags = data.tags

    const { data: updatedRow, error } = await supabase
      .from('events')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to update event: ${error.message}`)
    }

    const updated = mapDbEventToEvent(updatedRow)
    const local = readEvents()
    const idx = local.findIndex((e) => e.id === id)
    if (idx !== -1) {
      local[idx] = updated
      writeEvents(local)
    }
    return updated
  }

  // Local fallback
  const events = readEvents()
  const idx = events.findIndex((e) => e.id === id)
  if (idx === -1) throw new Error('Event not found.')

  if (events[idx].ownerId !== session.id && events[idx].ownerId !== DEMO_OWNER_ID && session.role !== 'admin') {
    throw new Error('Forbidden: You can only edit events belonging to your organization.')
  }

  const { id: _ignored, ...rest } = data
  void _ignored
  const updated: Event = { ...events[idx], ...rest }
  events[idx] = updated
  writeEvents(events)
  return updated
}

/** Backend equivalent: POST /events/:id/cancel */
export async function cancelEvent(id: string): Promise<void> {
  await delay(300)
  const session = assertOrganizerOrAdmin()

  if (isSupabaseConfigured() && session.id !== DEMO_OWNER_ID) {
    const { error } = await supabase
      .from('events')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('owner_id', session.id)

    if (error) {
      throw new Error(`Failed to cancel event: ${error.message}`)
    }
  }

  const events = readEvents()
  const idx = events.findIndex((e) => e.id === id)
  if (idx === -1) throw new Error('Event not found.')
  events[idx] = { ...events[idx], status: 'cancelled' }
  writeEvents(events)
}

/** Deletes a draft event permanently */
export async function deleteDraftEvent(id: string): Promise<void> {
  await delay(300)
  const session = assertOrganizerOrAdmin()

  if (isSupabaseConfigured() && session.id !== DEMO_OWNER_ID) {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
      .eq('owner_id', session.id)
      .eq('status', 'draft')

    if (error) {
      throw new Error(`Failed to delete draft: ${error.message}`)
    }
  }

  const events = readEvents()
  writeEvents(events.filter((e) => e.id !== id))
}
