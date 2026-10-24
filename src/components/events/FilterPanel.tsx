import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import { CATEGORIES, type Category, type DateFilter, type EventFilters, type PriceFilter, type SortKey } from '../../types'
import { CategoryChip } from '../ui/CategoryChip'

interface Props {
  filters: EventFilters
  onChange: (patch: Partial<EventFilters>) => void
  onClear: () => void
  onToggleInterest: (c: Category) => void
  activeCount: number
}

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'any', label: 'Any date' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Next 7 days' },
  { value: 'weekend', label: 'Weekends' },
  { value: 'custom', label: 'Pick a date' },
]
const PRICE_OPTIONS: { value: PriceFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
]
const RADIUS_OPTIONS = [
  { value: 0, label: 'Any distance' },
  { value: 2, label: 'Within 2 km' },
  { value: 5, label: 'Within 5 km' },
  { value: 10, label: 'Within 10 km' },
  { value: 20, label: 'Within 20 km' },
]
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'soonest', label: 'Soonest' },
  { value: 'nearest', label: 'Nearest' },
]

export function FilterPanel({ filters, onChange, onClear, onToggleInterest, activeCount }: Props) {
  return (
    <aside className="card p-5" aria-label="Filters">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-white">
          <SlidersHorizontal className="h-4 w-4 text-brand" aria-hidden />
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-[#0B0F19] shadow-cyber">{activeCount}</span>
          )}
        </h2>
        <button
          type="button"
          onClick={onClear}
          disabled={activeCount === 0}
          className="flex items-center gap-1 text-sm font-medium text-brand hover:underline disabled:cursor-not-allowed disabled:text-ink-faint disabled:no-underline"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Clear all
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor="sort" className="label">
            Sort by
          </label>
          <select id="sort" className="input" value={filters.sort} onChange={(e) => onChange({ sort: e.target.value as SortKey })}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-secondary text-white">
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="category" className="label">
            Category
          </label>
          <select
            id="category"
            className="input"
            value={filters.category}
            onChange={(e) => onChange({ category: e.target.value as Category | 'all' })}
          >
            <option value="all" className="bg-secondary text-white">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-secondary text-white">
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date-filter" className="label">
            Date
          </label>
          <select
            id="date-filter"
            className="input"
            value={filters.date}
            onChange={(e) => onChange({ date: e.target.value as DateFilter })}
          >
            {DATE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-secondary text-white">
                {o.label}
              </option>
            ))}
          </select>
          {filters.date === 'custom' && (
            <div className="mt-2">
              <label htmlFor="custom-date" className="sr-only">
                Choose a date
              </label>
              <input
                id="custom-date"
                type="date"
                className="input"
                value={filters.customDate ?? ''}
                onChange={(e) => onChange({ customDate: e.target.value || undefined })}
              />
            </div>
          )}
        </div>

        <fieldset>
          <legend className="label">Price</legend>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#0F172A] border border-[#334155] p-1">
            {PRICE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={filters.price === o.value}
                onClick={() => onChange({ price: o.value })}
                className={`rounded-lg py-1.5 text-sm font-medium transition ${
                  filters.price === o.value ? 'bg-[#334155] text-white shadow-card font-semibold' : 'text-ink-muted hover:text-white'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="radius" className="label">
            Distance
          </label>
          <select
            id="radius"
            className="input"
            value={filters.radiusKm}
            onChange={(e) => onChange({ radiusKm: Number(e.target.value) })}
          >
            {RADIUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink-faint">Measured from your selected locality.</p>
        </div>

        <fieldset>
          <legend className="label">My interests</legend>
          <p className="mb-2 text-xs text-ink-faint">Used to rank “Recommended” events.</p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <CategoryChip
                key={c}
                category={c}
                size="sm"
                selected={filters.interests.includes(c)}
                onClick={() => onToggleInterest(c)}
              />
            ))}
          </div>
        </fieldset>
      </div>
    </aside>
  )
}
