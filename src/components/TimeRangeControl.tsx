import { TIME_RANGES } from '../data/mockData'
import type { TimeRange } from '../types'
import { cn } from '../lib/utils'

/** Segmented control for the active time window on time-series charts. */
export function TimeRangeControl({
  value,
  onChange,
  className,
}: {
  value: TimeRange
  onChange: (r: TimeRange) => void
  className?: string
}) {
  return (
    <div
      className={cn('flex items-center gap-0.5 rounded-[var(--radius-control)] border border-navy-200 bg-white p-0.5', className)}
      role="group"
      aria-label="Time range"
    >
      {TIME_RANGES.map((r) => (
        <button
          key={r.id}
          onClick={() => onChange(r.id)}
          aria-pressed={value === r.id}
          title={r.hint}
          className={cn(
            'rounded-[calc(var(--radius-control)-2px)] px-2.5 py-1 text-[11.5px] font-semibold transition-colors',
            value === r.id ? 'bg-navy-900 text-white' : 'text-navy-500 hover:bg-navy-50 hover:text-navy-800'
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}
