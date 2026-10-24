import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, ClipboardCheck, ImageUp, Pencil, PlusCircle, TrendingUp, Ticket, XCircle } from 'lucide-react'
import { DashboardStatCard } from '../components/ui/DashboardStatCard'
import { ConfirmationModal } from '../components/ui/ConfirmationModal'
import { DemoNote } from '../components/ui/DemoNote'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { useToast } from '../hooks/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { cancelEvent, getOrganizerAnalytics, getOrganizerEvents } from '../services'
import type { EventStatus, EventWithMeta } from '../types'
import { formatDate, formatTime } from '../utils/format'

const STATUS_STYLES: Record<EventStatus, string> = {
  published: 'bg-brand/15 text-brand border border-brand/30',
  draft: 'bg-amber-950/40 text-amber-300 border border-amber-500/30',
  cancelled: 'bg-rose-950/40 text-rose-300 border border-rose-500/30',
}

export default function OrganizerDashboardPage() {
  const { notify } = useToast()
  const analytics = useAsync(getOrganizerAnalytics, [])
  const events = useAsync(getOrganizerEvents, [])
  const [target, setTarget] = useState<EventWithMeta | null>(null)
  const [busy, setBusy] = useState(false)

  const confirmCancel = async () => {
    if (!target) return
    setBusy(true)
    try {
      await cancelEvent(target.id)
      notify(`“${target.title}” was cancelled.`, 'info')
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not cancel the event.', 'error')
    } finally {
      setBusy(false)
      setTarget(null)
    }
  }

  const a = analytics.data
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Organizer Dashboard"
        subtitle="Manage your events and see how people respond."
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/organizer/poster" className="btn-secondary">
              <ImageUp className="h-4 w-4" aria-hidden /> Draft from poster
            </Link>
            <Link to="/organizer/create" className="btn-primary px-5">
              <PlusCircle className="h-4 w-4" aria-hidden /> Create Event
            </Link>
          </div>
        }
      />
      <DemoNote>
        Mock analytics: these numbers come from seeded demo data and your own demo RSVPs. They are not real attendance
        or results. Check-ins are sample values only.
      </DemoNote>

      <section className="mt-6" aria-label="Summary statistics">
        {analytics.loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : analytics.error ? (
          <ErrorState message={analytics.error} onRetry={analytics.reload} />
        ) : a ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardStatCard icon={CalendarDays} label="Total events" value={String(a.totalEvents)} helper={`${a.publishedEvents} published (mock)`} />
            <DashboardStatCard icon={Ticket} label="Total RSVPs" value={a.totalRsvps.toLocaleString('en-IN')} helper="Demo data" />
            <DashboardStatCard icon={ClipboardCheck} label="Total check-ins" value={a.totalCheckIns.toLocaleString('en-IN')} helper="Sample values from past demo events" />
            <DashboardStatCard icon={TrendingUp} label="Attendance rate" value={`${Math.round(a.attendanceRate * 100)}%`} helper="Check-ins ÷ RSVPs of finished events (mock)" />
          </div>
        ) : null}
      </section>

      <section className="mt-10" aria-labelledby="recent">
        <h2 id="recent" className="mb-4 text-xl font-bold text-white">Your events</h2>
        {events.loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : events.error ? (
          <ErrorState message={events.error} onRetry={events.reload} />
        ) : !events.data || events.data.length === 0 ? (
          <EmptyState icon={CalendarDays} title="You haven’t created any events" description="Create your first event or draft one from a poster." actionLabel="Create Event" actionTo="/organizer/create" />
        ) : (
          <div className="card overflow-hidden">
            <div className="hidden grid-cols-[1fr_150px_110px_130px_100px_190px] gap-4 border-b border-[#334155] bg-[#0B0F19]/80 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-faint md:grid">
              <span>Event</span>
              <span>Date</span>
              <span>Status</span>
              <span>RSVPs</span>
              <span>Check-ins</span>
              <span className="text-right">Actions</span>
            </div>
            <ul className="divide-y divide-[#334155]/60">
              {events.data.map((e) => (
                <li key={e.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_150px_110px_130px_100px_190px] md:items-center md:gap-4">
                  <div className="min-w-0">
                    <Link to={`/events/${e.id}`} className="block truncate font-semibold text-white hover:text-brand">{e.title}</Link>
                    <p className="truncate text-xs text-ink-faint">{e.venueName}</p>
                  </div>
                  <p className="text-sm text-ink-muted">{formatDate(e.startsAt)}<span className="block text-xs">{formatTime(e.startsAt)}</span></p>
                  <p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[e.status]}`}>{e.status}</span>
                  </p>
                  <p className="text-sm text-ink-muted">{e.rsvpCount} / {e.capacity}</p>
                  <p className="text-sm text-ink-muted" title="Sample value">{e.baseCheckIns > 0 ? e.baseCheckIns : '—'}</p>
                  <div className="flex gap-2 md:justify-end">
                    {e.status !== 'cancelled' && (
                      <Link to={`/organizer/edit/${e.id}`} className="btn-secondary px-3 py-1.5" aria-label={`Edit ${e.title}`}>
                        <Pencil className="h-4 w-4" aria-hidden /> Edit
                      </Link>
                    )}
                    {e.status !== 'cancelled' && (
                      <button type="button" className="btn-danger px-3 py-1.5" onClick={() => setTarget(e)} aria-label={`Cancel ${e.title}`}>
                        <XCircle className="h-4 w-4" aria-hidden /> Cancel
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <ConfirmationModal
        open={target !== null}
        title="Cancel this event?"
        confirmLabel="Cancel event"
        cancelLabel="Keep event"
        danger
        busy={busy}
        onConfirm={confirmCancel}
        onClose={() => setTarget(null)}
      >
        <p>
          <strong className="text-ink">{target?.title}</strong> will be removed from Discover and marked as cancelled. People who RSVPed will see it as cancelled.
        </p>
      </ConfirmationModal>
    </div>
  )
}
