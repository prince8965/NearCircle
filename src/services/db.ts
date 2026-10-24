/**
 * Raw localStorage "tables". Services are the only code that should import this file.
 * Replace with real API calls when the backend is ready.
 */
import { SEED_COMMUNITIES as _SEED_COMMUNITIES } from '../data/communities'
import { SEED_COMMENTS } from '../data/communityComments'
import { SEED_POSTS } from '../data/communityPosts'
import { SEED_EVENTS } from '../data/events'
import { SEED_ORGANIZATIONS } from '../data/organizations'
import type { CommunityPost, Event, Organization, PostComment, PostReport, RSVP } from '../types'
import { readStore, writeStore } from '../utils/storage'
import { notifyChange } from './bus'

void _SEED_COMMUNITIES

const EVENTS_KEY = 'events.v1'
const RSVPS_KEY = 'rsvps.v1'
const FOLLOWS_KEY = 'follows.v1'
const COMMUNITY_POSTS_KEY = 'community_posts.v1'
const POST_LIKES_KEY = 'post_likes.v1'
const POST_COMMENTS_KEY = 'post_comments.v1'
const ORGANIZATIONS_KEY = 'organizations.v1'
const ORG_FOLLOWS_KEY = 'org_follows.v1'
const POST_REPORTS_KEY = 'post_reports.v1'

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

export function readCommunityPosts(): CommunityPost[] {
  const stored = readStore<CommunityPost[] | null>(COMMUNITY_POSTS_KEY, null)
  if (stored) return stored
  writeStore(COMMUNITY_POSTS_KEY, SEED_POSTS)
  return SEED_POSTS
}

export function writeCommunityPosts(posts: CommunityPost[]): void {
  writeStore(COMMUNITY_POSTS_KEY, posts)
  notifyChange()
}

/** Returns a map of postId -> array of user IDs who liked it */
export function readPostLikes(): Record<string, string[]> {
  const stored = readStore<Record<string, string[]> | null>(POST_LIKES_KEY, null)
  if (stored) return stored
  // Seed with initial demo likes
  const seeded: Record<string, string[]> = {
    'post-1': ['u-demo', 'u-tanvi', 'u-karan'],
    'post-3': ['u-manya', 'u-priya'],
    'post-8': ['u-demo', 'u-rohit'],
  }
  writeStore(POST_LIKES_KEY, seeded)
  return seeded
}

export function writePostLikes(likes: Record<string, string[]>): void {
  writeStore(POST_LIKES_KEY, likes)
  notifyChange()
}

export function readPostComments(): PostComment[] {
  const stored = readStore<PostComment[] | null>(POST_COMMENTS_KEY, null)
  if (stored) return stored
  writeStore(POST_COMMENTS_KEY, SEED_COMMENTS)
  return SEED_COMMENTS
}

export function writePostComments(comments: PostComment[]): void {
  writeStore(POST_COMMENTS_KEY, comments)
  notifyChange()
}

export function readOrganizations(): Organization[] {
  const stored = readStore<Organization[] | null>(ORGANIZATIONS_KEY, null)
  if (stored) return stored
  writeStore(ORGANIZATIONS_KEY, SEED_ORGANIZATIONS)
  return SEED_ORGANIZATIONS
}

export function writeOrganizations(orgs: Organization[]): void {
  writeStore(ORGANIZATIONS_KEY, orgs)
  notifyChange()
}

export function readFollowedOrgIds(): string[] {
  const stored = readStore<string[] | null>(ORG_FOLLOWS_KEY, null)
  if (stored) return stored
  const seeded = ['org-acm', 'org-gdg'] // default followed for demo richness
  writeStore(ORG_FOLLOWS_KEY, seeded)
  return seeded
}

export function writeFollowedOrgIds(ids: string[]): void {
  writeStore(ORG_FOLLOWS_KEY, ids)
  notifyChange()
}

export function readPostReports(): PostReport[] {
  return readStore<PostReport[]>(POST_REPORTS_KEY, [])
}

export function writePostReports(reports: PostReport[]): void {
  writeStore(POST_REPORTS_KEY, reports)
  notifyChange()
}

