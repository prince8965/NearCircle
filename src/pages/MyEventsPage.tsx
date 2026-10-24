import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, CalendarDays, MapPin, QrCode } from 'lucide-react'
import { EventPoster } from '../components/events/EventPoster'
import { ConfirmationModal } from '../components/ui/ConfirmationModal'
import { DemoNote } from '../components/ui/DemoNote'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { useApp } from '../hooks/AppContext'
import { useToast } from '../hooks/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { cancelRSVP, getMyEvents, type MyEventEntry } from '../services'
import { formatDate, formatPrice, formatTimeRange } from '../utils/format'

/** Placeholder only — a deterministic pattern derived from the ticket code, NOT a scannable QR code. */
function QrPlaceholder({ code }: { code: string }) {
  const size = 9
  const cells: boolean[] = []
  let seed = Array.from(code).reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  for (let i = 0; i < size * size; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    cells.push(seed % 3 !== 0)
  }
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-20 w-20 rounded-lg bg-[#0F172A] p-1.5 ring-1 ring-[#334155]" role="img" aria-label="QR code placeholder">
      {cells.map((on, i) =>
        on ? <rect key={i} x={i % size} y={Math.floor(i / size)} width="1" height="1" fill="#00F2FE" /> : null,
      )}
    </svg>
  )
}

function Row({ entry, onCancel }: { entry: MyEventEntry; onCancel: (e: MyEventEntry) => void }) {
  const { event, rsvp, isPast } = entry
  return (
    <article className="card overflow-hidden sm:flex">
      <Link to={`/events/${event.id}`} className="block shrink-0 sm:w-48">
        <EventPoster event={event} className="h-36 w-full sm:h-full" />
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary border border-[#334155] px-2.5 py-1 text-xs font-semibold text-white">
              {isPast ? 'Attended (demo)' : 'Going'}
            </span>
            {event.status === 'cancelled' && (
              <span className="rounded-full bg-rose-950/40 border border-rose-500/30 px-2.5 py-1 text-xs font-semibold text-rose-300">Event cancelled</span>
            )}
          </div>
          <h3 className="text-lg font-semibold leading-snug text-white">
            <Link to={`/events/${event.id}`} className="hover:text-brand">{event.title}</Link>
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-ink-muted">
            <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-brand" aria-hidden />{formatDate(event.startsAt)} · {formatTimeRange(event.startsAt, event.endsAt)}</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand" aria-hidden />{event.venueName}</li>
          </ul>
          {!isPast && (
            <button type="button" className="btn-danger mt-3 px-3 py-1.5" onClick={() => onCancel(entry)}>
              Cancel RSVP
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#334155] bg-[#0F172A]/70 p-3 sm:flex-col sm:text-center">
          <QrPlaceholder code={rsvp.ticketCode} />
          <div>
            <p className="flex items-center gap-1 text-xs font-semibold text-white"><QrCode className="h-3.5 w-3.5 text-brand" aria-hidden />{rsvp.ticketCode}</p>
            <p className="text-[11px] leading-tight text-ink-faint">Placeholder ticket · {formatPrice(event.price)}<br />Not a valid entry pass</p>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function MyEventsPage() {
  const { localityId, interests } = useApp()
  const { notify } = useToast()
  const { data, loading, error, reload } = useAsync(() => getMyEvents(localityId, interests), [localityId, interests])
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [target, setTarget] = useState<MyEventEntry | null>(null)
  const [busy, setBusy] = useState(false)

  const confirmCancel = async () => {
    if (!target) return
    setBusy(true)
    try {
      await cancelRSVP(target.event.id)
      notify('Your RSVP was cancelled.', 'info')
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not cancel RSVP.', 'error')
    } finally {
      setBusy(false)
      setTarget(null)
    }
  }

  const list = data ? data[tab] : []

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="My Events" subtitle="Events you’ve RSVPed to." />
      <DemoNote>
        Temporary frontend demo behavior: your RSVPs are saved only in this browser (localStorage) and will be lost if
        you clear site data. Tickets and QR codes are placeholders.
      </DemoNote>

      <div role="tablist" aria-label="My events" className="mt-6 inline-flex rounded-xl bg-secondary border border-[#334155] p-1 shadow-card">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${tab === t ? 'bg-brand text-[#0B0F19] shadow-cyber' : 'text-ink-muted hover:text-white'}`}
          >
            {t} {data ? `(${data[t].length})` : ''}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4" role="tabpanel">
        {loading ? (
          <>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title={tab === 'upcoming' ? 'No upcoming events yet' : 'No past events'}
            description={tab === 'upcoming' ? 'RSVP to something that sparks your interest and it will show up here.' : 'Events you attend will appear here after they finish.'}
            actionLabel="Discover events"
            actionTo="/"
          />
        ) : (
          list.map((entry) => <Row key={entry.rsvp.id} entry={entry} onCancel={setTarget} />)
        )}
      </div>

      <ConfirmationModal
        open={target !== null}
        title="Cancel your RSVP?"
        confirmLabel="Yes, cancel RSVP"
        cancelLabel="Keep my spot"
        danger
        busy={busy}
        onConfirm={confirmCancel}
        onClose={() => setTarget(null)}
      >
        <p>
          You’ll give up your spot at <strong className="text-ink">{target?.event.title}</strong>.
        </p>
      </ConfirmationModal>
    </div>
  )
}
