import { useState } from 'react'
import { LocateFixed, MapPin } from 'lucide-react'
import { LOCALITIES } from '../../data/localities'
import { useApp } from '../../hooks/AppContext'
import { useToast } from '../../hooks/ToastContext'
import { distanceKm } from '../../utils/geo'

/**
 * Manual locality selection by default. "Use my location" only runs after an explicit click, uses the
 * coordinates once to pick the closest listed locality, and never stores them.
 */
export function LocationSelector({ className = '' }: { className?: string }) {
  const { localityId, setLocalityId } = useApp()
  const { notify } = useToast()
  const [locating, setLocating] = useState(false)

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      notify('Location is not available in this browser. Please choose your locality.', 'info')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = LOCALITIES.reduce((best, l) => {
          const d = distanceKm(pos.coords.latitude, pos.coords.longitude, l.lat, l.lng)
          return d < best.d ? { id: l.id, d } : best
        }, { id: LOCALITIES[0].id, d: Infinity })
        setLocalityId(nearest.id)
        setLocating(false)
        notify('Locality updated. Your exact location was not saved.', 'success')
      },
      () => {
        setLocating(false)
        notify('Location permission was not granted. Pick your locality from the list instead.', 'info')
      },
      { maximumAge: 600_000, timeout: 8000 },
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex-1">
        <label htmlFor="locality-select" className="sr-only">
          Your locality
        </label>
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand" aria-hidden />
        <select
          id="locality-select"
          value={localityId}
          onChange={(e) => setLocalityId(e.target.value)}
          className="input appearance-none pl-9 pr-8"
        >
          {LOCALITIES.map((l) => (
            <option key={l.id} value={l.id} className="bg-secondary text-white">
              {l.name}, {l.city}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        className="btn-secondary shrink-0 px-3"
        title="Use my location (asks for permission)"
        aria-label="Use my location"
      >
        <LocateFixed className={`h-4 w-4 text-brand ${locating ? 'animate-pulse' : ''}`} aria-hidden />
      </button>
    </div>
  )
}
