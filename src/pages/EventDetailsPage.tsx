import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CalendarX2, Clock, ExternalLink, MapPin, Navigation, Ticket, Users } from 'lucide-react'
import { EventCard } from '../components/events/EventCard'
import { EventPoster } from '../components/events/EventPoster'
import { RSVPButton } from '../components/events/RSVPButton'
import { MapView } from '../components/maps/MapView'
import { CategoryChip } from '../components/ui/CategoryChip'
import { DemoNote } from '../components/ui/DemoNote'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { getLocality } from '../data/localities'
import { SEED_COMMUNITIES } from '../data/communities'
import { useApp } from '../hooks/AppContext'
import { useAsync } from '../hooks/useAsync'
import { getEventById, searchEvents, defaultFilters } from '../services'
import { formatDistance, formatLongDate, formatPrice, formatTimeRange } from '../utils/format'

export default function EventDetailsPage() {
  const { id = '' } = useParams()
  const { localityId, interests } = useApp()
  const { data: event, loading, error, reload } = useAsync(() => getEventById(id, localityId, interests), [id, localityId, interests])
  const related = useAsync(
    () => searchEvents({ ...defaultFilters, localityId, interests }),
    [localityId, interests],
  )

  if (loading)
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6 lg:px-8" role="status" aria-label="Loading event">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="aspect-[16/7] w-full" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    )

  if (error)
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ErrorState message={error} onRetry={reload} />
      </div>
    )

  if (!event)
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState icon={CalendarX2} title="Event not found" description="This event may have been removed or the link is incorrect." actionLabel="Back to Discover" actionTo="/" />
      </div>
    )

  const community = SEED_COMMUNITIES.find((c) => c.id === event.communityId)
  const locality = getLocality(event.localityId)
  const distance = formatDistance(event.distanceKm)
  const relatedEvents = (related.data ?? [])
    .filter((e) => e.id !== event.id && (e.category === event.category || (event.communityId && e.communityId === event.communityId)))
    .slice(0, 3)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
        <ArrowLeft className="h-4 w-4 text-brand" aria-hidden /> Back to Discover
      </Link>

      {event.status !== 'published' && (
        <div role="status" className="mb-4 rounded-xl border border-amber-500/30 bg-amber-950/40 px-4 py-3 text-sm font-medium text-amber-300">
          {event.status === 'draft' ? 'This is a draft preview. It is not visible on Discover yet.' : 'This event has been cancelled by the organizer.'}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-secondary shadow-card border border-[#334155]/60">
        <EventPoster event={event} className="aspect-[16/8] max-h-[420px] w-full" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <header>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <CategoryChip category={event.category} size="sm" />
              {event.isDemo && <span className="rounded-full bg-[#0F172A] border border-[#334155] px-2.5 py-1 text-xs font-medium text-ink-muted">Demo event</span>}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">{event.title}</h1>
            <p className="mt-2 text-ink-muted">Organized by {event.organizerName}</p>
          </header>

          <section aria-labelledby="about" className="card space-y-3 p-5 sm:p-6">
            <h2 id="about" className="text-lg font-semibold text-white">About this event</h2>
            <p className="whitespace-pre-line leading-relaxed text-ink-muted">{event.description}</p>
            {event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {event.tags.map((t) => (
                  <span key={t} className="rounded-full bg-[#0F172A] border border-[#334155] px-2.5 py-1 text-xs text-ink-muted">#{t}</span>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="when-where" className="card p-5 sm:p-6">
            <h2 id="when-where" className="mb-4 text-lg font-semibold text-white">When &amp; where</h2>
            <dl className="grid gap-5 sm:grid-cols-2">
              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">Date</dt>
                  <dd className="text-sm font-medium text-white">{formatLongDate(event.startsAt)}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">Time</dt>
                  <dd className="text-sm font-medium text-white">{formatTimeRange(event.startsAt, event.endsAt)}</dd>
                  {new Date(event.startsAt).toDateString() !== new Date(event.endsAt).toDateString() && (
                    <dd className="text-xs text-ink-muted">Ends {formatLongDate(event.endsAt)}</dd>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">Venue</dt>
                  <dd className="text-sm font-medium text-white">{event.venueName}</dd>
                  <dd className="text-sm text-ink-muted">{event.address}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Navigation className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">Distance</dt>
                  <dd className="text-sm font-medium text-white">{distance ?? 'Not available'}</dd>
                  <dd className="text-xs text-ink-muted">From {getLocality(localityId).name} · event area: {locality.name}</dd>
                </div>
              </div>
            </dl>
            <div className="mt-5">
              <MapView lat={event.lat} lng={event.lng} title={event.venueName} address={`${event.venueName}, ${event.address}`} />
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start" aria-label="Tickets and organizer">
          <div className="card space-y-4 p-5 sm:p-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Ticket</p>
                <p className="text-3xl font-bold text-white">{formatPrice(event.price)}</p>
              </div>
              <Ticket className="h-8 w-8 text-brand" aria-hidden />
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <Users className="h-4 w-4 text-brand" aria-hidden />
              {event.seatsLeft > 0 ? (
                <span>
                  <strong className="text-white">{event.seatsLeft}</strong> of {event.capacity} seats left
                </span>
              ) : (
                <span className="font-semibold text-amber-400">This event is full</span>
              )}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#0F172A] border border-[#334155]" aria-hidden>
              <div className="h-full rounded-full bg-brand shadow-[0_0_10px_rgba(0,242,254,0.5)]" style={{ width: `${Math.min(100, (event.rsvpCount / event.capacity) * 100)}%` }} />
            </div>
            <RSVPButton event={event} size="lg" className="w-full" />
            {event.registrationUrl && (
              <a href={event.registrationUrl} target="_blank" rel="noreferrer noopener" className="btn-secondary w-full">
                Organizer’s registration page <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            )}
            <DemoNote>Capacity checks here are a frontend simulation. A real backend must enforce limits.</DemoNote>
          </div>

          <div className="card p-5 sm:p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-faint">Organizer</h2>
            <p className="font-semibold text-white">{event.organizerName}</p>
            {community ? (
              <Link to={`/communities/${community.id}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
                View the {community.name} community →
              </Link>
            ) : (
              <p className="mt-1 text-sm text-ink-muted">Independent organizer</p>
            )}
          </div>
        </aside>
      </div>

      {relatedEvents.length > 0 && (
        <section className="mt-14" aria-labelledby="related">
          <h2 id="related" className="mb-5 text-xl font-bold text-white">Related events</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedEvents.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
