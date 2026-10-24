const dateFmt = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
const longDateFmt = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const timeFmt = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })

export const formatDate = (iso: string) => dateFmt.format(new Date(iso))
export const formatLongDate = (iso: string) => longDateFmt.format(new Date(iso))
export const formatTime = (iso: string) => timeFmt.format(new Date(iso)).toUpperCase()

export function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatTime(startIso)} – ${formatTime(endIso)}`
}

export function formatPrice(price: number): string {
  return price <= 0 ? 'Free' : `₹${price.toLocaleString('en-IN')}`
}

export function formatDistance(km?: number): string | null {
  if (km === undefined) return null
  if (km < 1) return `${Math.round(km * 1000)} m away`
  return `${km.toFixed(1)} km away`
}

export function isPast(iso: string, now: Date = new Date()): boolean {
  return new Date(iso).getTime() < now.getTime()
}

/** Value for <input type="date"> in local time. */
export function toDateInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Value for <input type="time"> in local time. */
export function toTimeInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Combines local date + time inputs into an ISO string. */
export function fromDateTimeInputs(date: string, time: string): string {
  return new Date(`${date}T${time || '00:00'}`).toISOString()
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  )
}
