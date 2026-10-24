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

export type UserRole = 'participant' | 'organizer' | 'judge' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  organizationId?: string
}

export interface Profile {
  id: string
  role: UserRole
  fullName: string
  avatarUrl?: string
  headline?: string
  bio?: string
  websiteUrl?: string
  githubUrl?: string
  linkedinUrl?: string
  skills?: string[]
  createdAt: string
  updatedAt: string
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

/* ==========================================================================
   Community Section Types
   ========================================================================== */

export type CommunityTab = 'for-you' | 'following' | 'nearby' | 'organizations' | 'my-posts'
export type PostSortKey = 'newest' | 'popular'
export type AuthorRole = 'student' | 'organizer' | 'community_lead'

export interface CommunityPost {
  id: string
  authorId: string
  authorName: string
  authorAvatar?: string
  authorRole: AuthorRole
  createdAt: string
  updatedAt?: string
  content: string
  category: Category
  imageUrl?: string
  communityId?: string
  communityName?: string
  organizationId?: string
  organizationName?: string
  isOrgVerified?: boolean
  /** Attached NearCircle event */
  eventId?: string
  eventMeta?: {
    id: string
    title: string
    startsAt: string
    endsAt?: string
    venueName: string
    price: number
    posterUrl?: string
  }
  /** Custom event fields if not linking an existing event */
  customEventDate?: string
  customEventLocation?: string
  customEventLink?: string
  localityId?: string
  likesCount: number
  likedByMe?: boolean
  commentsCount: number
  isReported?: boolean
  reportReason?: string
  isDemo?: boolean
}

export interface CommunityPostInput {
  content: string
  category: Category
  imageUrl?: string
  communityId?: string
  organizationId?: string
  eventId?: string
  localityId?: string
  customEventDate?: string
  customEventLocation?: string
  customEventLink?: string
}

export interface PostComment {
  id: string
  postId: string
  authorId: string
  authorName: string
  authorAvatar?: string
  authorRole: AuthorRole
  content: string
  createdAt: string
  parentId?: string
  replyToAuthor?: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  logoUrl?: string
  accentColor: string
  description: string
  category: Category
  localityId: string
  websiteUrl?: string
  contactEmail?: string
  /** Only display verified badge when isVerified is true */
  isVerified: boolean
  followerCount: number
  isFollowing?: boolean
  upcomingEventIds?: string[]
}

export interface PostReport {
  id: string
  postId: string
  userId: string
  reason: string
  details?: string
  createdAt: string
}

