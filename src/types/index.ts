export const CATEGORIES = [
  'Technology',
  'AI/ML',
  'Web Development',
  'Music',
  'Sports',
  'Art',
  'Business',
  'Workshops',
] as const

export type Category = (typeof CATEGORIES)[number]

export type EventStatus = 'published' | 'draft' | 'cancelled'

export interface User {
  id: string
  name: string
  email: string
}

export interface Locality {
  id: string
  name: string
  city: string
  lat: number
  lng: number
}

export interface Event {
  id: string
  title: string
  description: string
  category: Category
  /** Data URL or remote URL. Falls back to a generated poster when empty. */
  posterUrl?: string
  /** ISO 8601 strings */
  startsAt: string
  endsAt: string
  venueName: string
  address: string
  localityId: string
  lat: number
  lng: number
  /** 0 = free */
  price: number
  capacity: number
  /** Seats already taken by other people (demo seed). The current user's RSVP is added on top. */
  baseRsvpCount: number
  /** Mock check-in count used by the demo analytics. */
  baseCheckIns: number
  organizerName: string
  ownerId: string
  communityId?: string
  registrationUrl?: string
  status: EventStatus
  tags: string[]
  /** True for seed data shipped with the prototype. */
  isDemo: boolean
}

export interface EventWithMeta extends Event {
  /** Distance in km from the selected locality, if computable. */
  distanceKm?: number
  seatsLeft: number
  rsvpCount: number
  isRsvped: boolean
  recommendation?: string
  recommendationScore: number
}

export interface Community {
  id: string
  name: string
  description: string
  category: Category
  memberCount: number
  localityId: string
  accent: string
  isDemo: boolean
}

export interface RSVP {
  id: string
  eventId: string
  userId: string
  status: 'going' | 'cancelled'
  createdAt: string
  ticketCode: string
}

export interface OrganizerAnalytics {
  totalEvents: number
  publishedEvents: number
  totalRsvps: number
  totalCheckIns: number
  /** 0..1 */
  attendanceRate: number
  isMock: true
}

export type DateFilter = 'any' | 'today' | 'week' | 'weekend' | 'custom'
export type PriceFilter = 'all' | 'free' | 'paid'
export type SortKey = 'soonest' | 'nearest' | 'recommended'

export interface EventFilters {
  query: string
  category: Category | 'all'
  date: DateFilter
  customDate?: string
  price: PriceFilter
  /** km; 0 = any distance */
  radiusKm: number
  sort: SortKey
  localityId: string
  interests: Category[]
}

export type EventInput = Omit<
  Event,
  'id' | 'baseRsvpCount' | 'baseCheckIns' | 'isDemo' | 'ownerId' | 'organizerName'
> & { id?: string }

export interface ExtractedField<T = string> {
  value: T
  /** 'ok' = confidently read, 'review' = ambiguous, 'missing' = not found */
  state: 'ok' | 'review' | 'missing'
  note?: string
}

export interface PosterExtraction {
  /** Always true until a real OCR/vision service is wired in. */
  isMock: boolean
  title: ExtractedField
  description: ExtractedField
  category: ExtractedField<Category | ''>
  startDate: ExtractedField
  startTime: ExtractedField
  endTime: ExtractedField
  venueName: ExtractedField
  address: ExtractedField
  price: ExtractedField
  registrationUrl: ExtractedField
}
