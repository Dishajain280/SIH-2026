import { Loader2 } from 'lucide-react'

/**
 * Shown while a lazily-loaded route chunk is being fetched.
 * Keeps the shell stable so navigation doesn't flash an empty page.
 */
export function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <Loader2 className="h-6 w-6 animate-spin text-gold-600" />
      <span className="text-[12.5px] font-medium text-navy-400">Loading view…</span>
    </div>
  )
}
