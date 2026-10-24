import { ExternalLink, MapPinOff } from 'lucide-react'
import { googleMapsLink } from './mapsConfig'

interface Props {
  reason: 'missing-key' | 'load-failed'
  lat?: number
  lng?: number
  address?: string
  height?: number
}

export function MapFallback({ reason, lat, lng, address, height = 280 }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#334155] bg-[#0F172A]/70 px-5 text-center"
      style={{ minHeight: height }}
      role="note"
    >
      <MapPinOff className="mb-2 h-7 w-7 text-brand" aria-hidden />
      <p className="text-sm font-semibold text-white">
        {reason === 'missing-key' ? 'Map preview is not set up yet' : 'The map couldn’t be loaded'}
      </p>
      <p className="mt-1 max-w-xs text-xs text-ink-muted">
        {reason === 'missing-key'
          ? 'Add VITE_GOOGLE_MAPS_API_KEY to your .env file to enable Google Maps. See the README.'
          : 'Check your connection and that the API key is valid and allowed for this website.'}
      </p>
      {address && <p className="mt-2 text-xs text-white">{address}</p>}
      {lat !== undefined && lng !== undefined && (
        <a
          href={googleMapsLink(lat, lng)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
        >
          Open in Google Maps <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      )}
    </div>
  )
}
