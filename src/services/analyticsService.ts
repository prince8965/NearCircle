import type { OrganizerAnalytics } from '../types'
import { delay } from './bus'
import { DEMO_OWNER_ID, authAdapter } from './authAdapter'
import { getOrganizerEvents } from './eventService'

/**
 * Computes organizer analytics based on real database records and organizer events.
 * Backend equivalent: GET /organizer/analytics
 */
export async function getOrganizerAnalytics(): Promise<OrganizerAnalytics> {
  await delay(200)
  const session = authAdapter.getSession()
  const events = await getOrganizerEvents()
  const now = Date.now()

  const totalEvents = events.length
  const publishedEvents = events.filter(
    (e) => e.status === 'published' && new Date(e.endsAt).getTime() >= now,
  ).length
  const draftEvents = events.filter((e) => e.status === 'draft').length
  const completedEvents = events.filter(
    (e) => e.status === 'completed' || (e.status === 'published' && new Date(e.endsAt).getTime() < now),
  ).length
  const cancelledEvents = events.filter((e) => e.status === 'cancelled').length

  const totalRsvps = events.reduce((sum, e) => sum + (e.rsvpCount || 0), 0)
  const totalCheckIns = events.reduce((sum, e) => sum + (e.baseCheckIns || 0), 0)

  const completedList = events.filter(
    (e) => e.status === 'completed' || (e.status === 'published' && new Date(e.endsAt).getTime() < now),
  )
  const completedRsvps = completedList.reduce((sum, e) => sum + (e.rsvpCount || 0), 0)
  const completedCheckIns = completedList.reduce((sum, e) => sum + (e.baseCheckIns || 0), 0)

  const isRealData = Boolean(session && session.id !== DEMO_OWNER_ID)

  return {
    totalEvents,
    publishedEvents,
    draftEvents,
    completedEvents,
    cancelledEvents,
    totalRsvps,
    totalCheckIns,
    attendanceRate: completedRsvps > 0 ? completedCheckIns / completedRsvps : 0,
    isMock: !isRealData,
    isRealData,
  }
}
