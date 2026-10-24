import type { OrganizerAnalytics } from '../types'
import { delay } from './bus'
import { DEMO_OWNER_ID } from './authAdapter'
import { readEvents, readRsvps } from './db'

/**
 * MOCK analytics derived from demo data. Check-ins are seeded numbers, not real attendance.
 * Backend equivalent: GET /organizer/analytics
 */
export async function getOrganizerAnalytics(): Promise<OrganizerAnalytics> {
  await delay(300)
  const own = readEvents().filter((e) => e.ownerId === DEMO_OWNER_ID)
  const goingIds = new Set(
    readRsvps()
      .filter((r) => r.status === 'going')
      .map((r) => r.eventId),
  )
  const rsvpsOf = (e: (typeof own)[number]) => e.baseRsvpCount + (goingIds.has(e.id) ? 1 : 0)

  const totalRsvps = own.reduce((sum, e) => sum + rsvpsOf(e), 0)
  const totalCheckIns = own.reduce((sum, e) => sum + e.baseCheckIns, 0)
  const completed = own.filter((e) => new Date(e.endsAt).getTime() < Date.now() && e.status !== 'draft')
  const completedRsvps = completed.reduce((sum, e) => sum + rsvpsOf(e), 0)
  const completedCheckIns = completed.reduce((sum, e) => sum + e.baseCheckIns, 0)

  return {
    totalEvents: own.length,
    publishedEvents: own.filter((e) => e.status === 'published').length,
    totalRsvps,
    totalCheckIns,
    attendanceRate: completedRsvps > 0 ? completedCheckIns / completedRsvps : 0,
    isMock: true,
  }
}
