import { getLocality } from '../../data/localities'
import { CATEGORIES, type Category, type Event, type EventInput, type EventStatus } from '../../types'
import { fromDateTimeInputs, toDateInput, toTimeInput } from '../../utils/format'

export interface EventFormValues {
  title: string
  description: string
  category: Category | ''
  posterUrl?: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  venueName: string
  address: string
  localityId: string
  lat: number
  lng: number
  isFree: boolean
  price: string
  capacity: string
  registrationUrl: string
}

export type EventFormErrors = Partial<Record<keyof EventFormValues, string>>

export function emptyFormValues(localityId: string): EventFormValues {
  const loc = getLocality(localityId)
  return {
    title: '',
    description: '',
    category: '',
    posterUrl: undefined,
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    venueName: '',
    address: '',
    localityId,
    lat: loc.lat,
    lng: loc.lng,
    isFree: true,
    price: '',
    capacity: '50',
    registrationUrl: '',
  }
}

export function eventToFormValues(e: Event): EventFormValues {
  return {
    title: e.title,
    description: e.description,
    category: e.category,
    posterUrl: e.posterUrl,
    startDate: toDateInput(e.startsAt),
    startTime: toTimeInput(e.startsAt),
    endDate: toDateInput(e.endsAt),
    endTime: toTimeInput(e.endsAt),
    venueName: e.venueName,
    address: e.address,
    localityId: e.localityId,
    lat: e.lat,
    lng: e.lng,
    isFree: e.price === 0,
    price: e.price > 0 ? String(e.price) : '',
    capacity: String(e.capacity),
    registrationUrl: e.registrationUrl ?? '',
  }
}

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/** Drafts only need a title; publishing requires a complete, consistent event. */
export function validateEventForm(v: EventFormValues, status: EventStatus, isEditing: boolean): EventFormErrors {
  const errors: EventFormErrors = {}
  if (!v.title.trim()) errors.title = 'Give your event a title.'
  else if (v.title.trim().length > 100) errors.title = 'Keep the title under 100 characters.'
  if (v.registrationUrl.trim() && !isValidUrl(v.registrationUrl.trim()))
    errors.registrationUrl = 'Enter a full link starting with https://'
  if (status === 'draft') return errors

  if (v.description.trim().length < 20) errors.description = 'Add a description of at least 20 characters.'
  if (!v.category || !CATEGORIES.includes(v.category)) errors.category = 'Choose a category.'
  if (!v.startDate) errors.startDate = 'Choose a start date.'
  if (!v.startTime) errors.startTime = 'Choose a start time.'
  if (!v.endDate) errors.endDate = 'Choose an end date.'
  if (!v.endTime) errors.endTime = 'Choose an end time.'
  if (v.startDate && v.startTime && v.endDate && v.endTime) {
    const start = new Date(`${v.startDate}T${v.startTime}`).getTime()
    const end = new Date(`${v.endDate}T${v.endTime}`).getTime()
    if (end <= start) errors.endTime = 'The event must end after it starts.'
    if (!isEditing && start < Date.now()) errors.startDate = 'Start time must be in the future.'
  }
  if (!v.venueName.trim()) errors.venueName = 'Add the venue name.'
  if (!v.address.trim()) errors.address = 'Add the venue address.'
  if (!v.isFree) {
    const p = Number(v.price)
    if (!v.price || Number.isNaN(p) || p <= 0) errors.price = 'Enter a ticket price above 0, or mark the event as free.'
  }
  const cap = Number(v.capacity)
  if (!v.capacity || !Number.isInteger(cap) || cap < 1) errors.capacity = 'Capacity must be a whole number of at least 1.'
  else if (cap > 100000) errors.capacity = 'Capacity looks too large. Please check it.'
  return errors
}

export function formValuesToInput(v: EventFormValues, status: EventStatus): EventInput {
  const now = new Date()
  // Drafts may be incomplete, so fall back to sensible placeholders that the organizer completes before publishing.
  const startsAt =
    v.startDate && v.startTime ? fromDateTimeInputs(v.startDate, v.startTime) : new Date(now.getTime() + 7 * 86_400_000).toISOString()
  const endsAt =
    v.endDate && v.endTime ? fromDateTimeInputs(v.endDate, v.endTime) : new Date(new Date(startsAt).getTime() + 2 * 3600_000).toISOString()
  return {
    title: v.title.trim(),
    description: v.description.trim(),
    category: (v.category || 'Technology') as Category,
    posterUrl: v.posterUrl,
    startsAt,
    endsAt,
    venueName: v.venueName.trim(),
    address: v.address.trim(),
    localityId: v.localityId,
    lat: v.lat,
    lng: v.lng,
    price: v.isFree ? 0 : Number(v.price) || 0,
    capacity: Number(v.capacity) || 1,
    registrationUrl: v.registrationUrl.trim() || undefined,
    status,
    tags: [],
  } as EventInput
}
