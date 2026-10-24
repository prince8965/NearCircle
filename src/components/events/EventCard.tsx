import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, Navigation, Sparkles, Users } from 'lucide-react'
import type { EventWithMeta } from '../../types'
import { formatDate, formatDistance, formatPrice, formatTime } from '../../utils/format'
import { CategoryChip } from '../ui/CategoryChip'
import { EventPoster } from './EventPoster'
import { RSVPButton } from './RSVPButton'

export function EventCard({ event }: { event: EventWithMeta }) {
  const distance = formatDistance(event.distanceKm)
  const almostFull = event.seatsLeft > 0 && event.seatsLeft <= Math.max(5, event.capacity * 0.1)

  return (
    <article className="card group flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <Link to={`/events/${event.id}`} className="relative block overflow-hidden" aria-label={`View details for ${event.title}`}>
        <EventPoster event={event} className="aspect-[16/10] w-full transition duration-300 group-hover:scale-[1.03]" />
        <span className="absolute left-3 top-3">
          <CategoryChip category={event.category} size="sm" />
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-[#0B0F19]/90 border border-[#334155] px-2.5 py-1 text-xs font-bold text-white shadow-card backdrop-blur-md">
          {formatPrice(event.price)}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {event.recommendation && (
          <p className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
            <Sparkles className="h-3.5 w-3.5 text-brand" aria-hidden />
            {event.recommendation}
          </p>
        )}
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-white">
          <Link to={`/events/${event.id}`} className="hover:text-brand">
            {event.title}
          </Link>
        </h3>

        <ul className="mt-3 space-y-1.5 text-sm text-ink-muted">
          <li className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-brand" aria-hidden />
            {formatDate(event.startsAt)} · {formatTime(event.startsAt)}
          </li>
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-brand" aria-hidden />
            <span className="truncate">{event.venueName}</span>
          </li>
          {distance && (
            <li className="flex items-center gap-2">
              <Navigation className="h-4 w-4 shrink-0 text-brand" aria-hidden />
              {distance}
            </li>
          )}
        </ul>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <p className={`flex items-center gap-1.5 text-xs ${almostFull ? 'font-semibold text-amber-400' : 'text-ink-faint'}`}>
            <Users className="h-3.5 w-3.5" aria-hidden />
            {event.seatsLeft > 0 ? `${event.seatsLeft} seats left` : 'Full'}
          </p>
          <RSVPButton event={event} />
        </div>
      </div>
    </article>
  )
}
