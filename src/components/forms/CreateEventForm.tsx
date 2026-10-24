import { useState, type FormEvent } from 'react'
import { Save, Send } from 'lucide-react'
import { LOCALITIES, getLocality } from '../../data/localities'
import { CATEGORIES, type Category, type EventStatus } from '../../types'
import { MapPicker } from '../maps/MapPicker'
import { FormField, type FieldFlag } from '../ui/FormField'
import { PosterUpload } from './PosterUpload'
import { validateEventForm, type EventFormErrors, type EventFormValues } from './eventFormModel'

interface Props {
  initialValues: EventFormValues
  isEditing?: boolean
  /** Review flags for fields filled by (mock) poster extraction. */
  flags?: Partial<Record<keyof EventFormValues, FieldFlag>>
  onSubmit: (values: EventFormValues, status: EventStatus) => Promise<void>
  submitLabel?: string
  /** Hide the poster upload (the poster workflow already shows it). */
  hidePoster?: boolean
}

export function CreateEventForm({
  initialValues,
  isEditing = false,
  flags,
  onSubmit,
  submitLabel,
  hidePoster = false,
}: Props) {
  const [values, setValues] = useState<EventFormValues>(initialValues)
  const [errors, setErrors] = useState<EventFormErrors>({})
  const [busy, setBusy] = useState<EventStatus | null>(null)

  const set = <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = async (status: EventStatus) => {
    const found = validateEventForm(values, status, isEditing)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      // Move focus to the first invalid field so keyboard and screen-reader users land on the problem.
      const firstKey = Object.keys(found)[0]
      requestAnimationFrame(() => document.getElementById(`field-${firstKey}`)?.focus())
      return
    }
    setBusy(status)
    try {
      await onSubmit(values, status)
    } finally {
      setBusy(null)
    }
  }

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    void submit('published')
  }

  const err = (k: keyof EventFormValues) => errors[k]
  const invalid = (k: keyof EventFormValues) => (errors[k] ? 'border-red-400' : '')

  return (
    <form onSubmit={onFormSubmit} noValidate className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="card space-y-5 p-5 sm:p-6" aria-labelledby="sec-basics">
          <h2 id="sec-basics" className="text-lg font-semibold">Basics</h2>
          <FormField id="field-title" label="Event title" required error={err('title')} flag={flags?.title}>
            <input
              id="field-title"
              className={`input ${invalid('title')}`}
              value={values.title}
              maxLength={120}
              onChange={(e) => set('title', e.target.value)}
              aria-invalid={!!err('title')}
              aria-describedby={err('title') ? 'field-title-error' : undefined}
              placeholder="e.g. Intro to React Workshop"
            />
          </FormField>
          <FormField id="field-description" label="Description" required error={err('description')} flag={flags?.description}>
            <textarea
              id="field-description"
              rows={5}
              className={`input ${invalid('description')}`}
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
              aria-invalid={!!err('description')}
              aria-describedby={err('description') ? 'field-description-error' : undefined}
              placeholder="What will happen, who is it for, and what should people bring?"
            />
          </FormField>
          <FormField id="field-category" label="Category" required error={err('category')} flag={flags?.category}>
            <select
              id="field-category"
              className={`input ${invalid('category')}`}
              value={values.category}
              onChange={(e) => set('category', e.target.value as Category | '')}
              aria-invalid={!!err('category')}
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>
        </section>

        <section className="card space-y-5 p-5 sm:p-6" aria-labelledby="sec-when">
          <h2 id="sec-when" className="text-lg font-semibold">Date &amp; time</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="field-startDate" label="Start date" required error={err('startDate')} flag={flags?.startDate}>
              <input
                id="field-startDate"
                type="date"
                className={`input ${invalid('startDate')}`}
                value={values.startDate}
                onChange={(e) => {
                  set('startDate', e.target.value)
                  if (!values.endDate) set('endDate', e.target.value)
                }}
                aria-invalid={!!err('startDate')}
              />
            </FormField>
            <FormField id="field-startTime" label="Start time" required error={err('startTime')} flag={flags?.startTime}>
              <input
                id="field-startTime"
                type="time"
                className={`input ${invalid('startTime')}`}
                value={values.startTime}
                onChange={(e) => set('startTime', e.target.value)}
                aria-invalid={!!err('startTime')}
              />
            </FormField>
            <FormField id="field-endDate" label="End date" required error={err('endDate')}>
              <input
                id="field-endDate"
                type="date"
                className={`input ${invalid('endDate')}`}
                value={values.endDate}
                min={values.startDate || undefined}
                onChange={(e) => set('endDate', e.target.value)}
                aria-invalid={!!err('endDate')}
              />
            </FormField>
            <FormField id="field-endTime" label="End time" required error={err('endTime')} flag={flags?.endTime}>
              <input
                id="field-endTime"
                type="time"
                className={`input ${invalid('endTime')}`}
                value={values.endTime}
                onChange={(e) => set('endTime', e.target.value)}
                aria-invalid={!!err('endTime')}
              />
            </FormField>
          </div>
        </section>

        <section className="card space-y-5 p-5 sm:p-6" aria-labelledby="sec-where">
          <h2 id="sec-where" className="text-lg font-semibold">Venue &amp; location</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="field-venueName" label="Venue name" required error={err('venueName')} flag={flags?.venueName}>
              <input
                id="field-venueName"
                className={`input ${invalid('venueName')}`}
                value={values.venueName}
                onChange={(e) => set('venueName', e.target.value)}
                aria-invalid={!!err('venueName')}
              />
            </FormField>
            <FormField id="field-localityId" label="Locality" required>
              <select
                id="field-localityId"
                className="input"
                value={values.localityId}
                onChange={(e) => {
                  const loc = getLocality(e.target.value)
                  setValues((v) => ({ ...v, localityId: loc.id, lat: loc.lat, lng: loc.lng }))
                }}
              >
                {LOCALITIES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}, {l.city}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField id="field-address" label="Venue address" required error={err('address')} flag={flags?.address}>
            <input
              id="field-address"
              className={`input ${invalid('address')}`}
              value={values.address}
              onChange={(e) => set('address', e.target.value)}
              aria-invalid={!!err('address')}
            />
          </FormField>
          <div>
            <p className="label">Pin the exact spot</p>
            <MapPicker
              value={{ lat: values.lat, lng: values.lng }}
              onChange={(p) => setValues((v) => ({ ...v, lat: p.lat, lng: p.lng }))}
            />
            <p className="mt-1 text-xs text-ink-faint">Click the map or drag the pin. Without a map key, the locality centre is used.</p>
          </div>
        </section>

        <section className="card space-y-5 p-5 sm:p-6" aria-labelledby="sec-tickets">
          <h2 id="sec-tickets" className="text-lg font-semibold text-white">Tickets &amp; registration</h2>
          <div className="flex items-center justify-between rounded-xl bg-[#0F172A] border border-[#334155] px-4 py-3">
            <div>
              <p id="free-label" className="text-sm font-medium text-white">Free event</p>
              <p className="text-xs text-ink-muted">Turn off to set a ticket price.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={values.isFree}
              aria-labelledby="free-label"
              onClick={() => set('isFree', !values.isFree)}
              className={`relative h-6 w-11 rounded-full transition ${values.isFree ? 'bg-brand' : 'bg-slate-700'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${values.isFree ? 'left-[22px]' : 'left-0.5'}`}
              />
            </button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {!values.isFree && (
              <FormField id="field-price" label="Ticket price (₹)" required error={err('price')} flag={flags?.price}>
                <input
                  id="field-price"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  className={`input ${invalid('price')}`}
                  value={values.price}
                  onChange={(e) => set('price', e.target.value)}
                  aria-invalid={!!err('price')}
                />
              </FormField>
            )}
            <FormField id="field-capacity" label="Capacity" required error={err('capacity')}>
              <input
                id="field-capacity"
                type="number"
                min={1}
                inputMode="numeric"
                className={`input ${invalid('capacity')}`}
                value={values.capacity}
                onChange={(e) => set('capacity', e.target.value)}
                aria-invalid={!!err('capacity')}
              />
            </FormField>
          </div>
          <FormField
            id="field-registrationUrl"
            label="Registration link (optional)"
            error={err('registrationUrl')}
            flag={flags?.registrationUrl}
            hint="External sign-up page, if you use one."
          >
            <input
              id="field-registrationUrl"
              type="url"
              className={`input ${invalid('registrationUrl')}`}
              value={values.registrationUrl}
              onChange={(e) => set('registrationUrl', e.target.value)}
              placeholder="https://"
              aria-invalid={!!err('registrationUrl')}
            />
          </FormField>
        </section>
      </div>

      <div className="space-y-6">
        {!hidePoster && (
          <section className="card p-5 sm:p-6" aria-labelledby="sec-poster">
            <h2 id="sec-poster" className="mb-4 text-lg font-semibold">Poster</h2>
            <PosterUpload id="field-posterUrl" value={values.posterUrl} onChange={(url) => set('posterUrl', url)} />
            <p className="mt-2 text-xs text-ink-faint">Optional. A poster is generated automatically if you skip this.</p>
          </section>
        )}

        <section className="card space-y-3 p-5 sm:p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">{isEditing ? 'Save changes' : 'Ready to go?'}</h2>
          <p className="text-sm text-ink-muted">
            {isEditing
              ? 'Update the event and keep it published, or move it back to a draft.'
              : 'Publish now, or save a draft and finish later. Drafts only need a title.'}
          </p>
          <button type="submit" className="btn-primary w-full" disabled={busy !== null}>
            <Send className="h-4 w-4" aria-hidden />
            {busy === 'published' ? 'Publishing…' : (submitLabel ?? (isEditing ? 'Save & publish' : 'Publish event'))}
          </button>
          <button type="button" className="btn-secondary w-full" disabled={busy !== null} onClick={() => void submit('draft')}>
            <Save className="h-4 w-4" aria-hidden />
            {busy === 'draft' ? 'Saving…' : 'Save draft'}
          </button>
        </section>
      </div>
    </form>
  )
}
