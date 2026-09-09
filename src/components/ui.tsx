import { useEffect, useState, type ReactNode } from 'react'
import { Info } from 'lucide-react'
import { cn, RISK_SOFT } from '../lib/utils'
import type { LsrStatus, RiskLevel } from '../types'

/* ------------------------------------------------------------------ badges */
export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <span className={cn('badge', RISK_SOFT[level], className)}>
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          level === 'Critical' && 'animate-pulse',
          level === 'Critical' ? 'bg-red-500' : level === 'High' ? 'bg-gold-500' : level === 'Medium' ? 'bg-navy-400' : 'bg-emerald-500'
        )}
      />
      {level}
      {level === 'Critical' && <span className="sr-only"> — act immediately</span>}
    </span>
  )
}

export function StatusBadge({ status }: { status: LsrStatus }) {
  if (status === 'Mapped') {
    return (
      <span className="badge border-emerald-200 bg-emerald-50 text-emerald-700">
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-none stroke-current stroke-[2]" aria-hidden>
          <path d="M2 6.5 4.8 9.2 10 3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Mapped
      </span>
    )
  }
  return (
    <span className="badge border-gold-300 bg-gold-100 text-gold-700">
      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-none stroke-current stroke-[2]" aria-hidden>
        <circle cx="6" cy="6" r="4.6" />
        <path d="M6 3.4v3l1.9 1.4" strokeLinecap="round" />
      </svg>
      Manual Review
    </span>
  )
}

/* ------------------------------------------------------------- page header */
export function PageHeader({
  icon,
  eyebrow,
  title,
  sub,
  right,
}: {
  icon: ReactNode
  eyebrow: string
  title: string
  sub?: string
  right?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] bg-navy-900 text-gold-500 shadow-rest">
          {icon}
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-700">{eyebrow}</p>
          <h1 className="mt-0.5 text-[22px] font-bold leading-tight tracking-[-0.01em] text-navy-900">{title}</h1>
          {sub && <p className="mt-0.5 max-w-2xl text-[13px] leading-relaxed text-navy-400">{sub}</p>}
        </div>
      </div>
      {right}
    </header>
  )
}

/* ------------------------------------------------------- inline ux helper */
export function UxHint({ children }: { children: ReactNode }) {
  return (
    <span className="group/hint relative inline-flex">
      <Info className="h-3.5 w-3.5 cursor-help text-navy-300 transition-colors hover:text-navy-600" tabIndex={0} aria-label={typeof children === 'string' ? children : 'More information'} />
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 w-52 -translate-x-1/2 scale-95 rounded-[var(--radius-control)] border border-navy-100 bg-navy-950 px-3 py-2 text-[11.5px] font-medium leading-snug text-navy-100 opacity-0 shadow-pop transition-all duration-150 group-hover/hint:scale-100 group-hover/hint:opacity-100 group-focus-within/hint:scale-100 group-focus-within/hint:opacity-100"
      >
        {children}
      </span>
    </span>
  )
}

/* --------------------------------------------------------- confidence bar */
export function ConfidenceBar({ value, label, ariaLabel }: { value: number; label?: string; ariaLabel?: string }) {
  const cls = value >= 90 ? 'bg-emerald-500' : value >= 75 ? 'bg-navy-500' : 'bg-gold-500'
  const txt = value >= 90 ? 'text-emerald-600' : value >= 75 ? 'text-navy-700' : 'text-gold-700'
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="h-1.5 w-20 overflow-hidden rounded-full bg-navy-100"
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel ?? `AI confidence ${value} percent`}
      >
        <div className={cn('h-full rounded-full transition-[width] duration-700 ease-out', cls)} style={{ width: `${value}%` }} />
      </div>
      <span className={cn('tnum text-xs font-semibold', txt)}>{value}%</span>
      {label && <span className="text-[11px] text-navy-300">{label}</span>}
    </div>
  )
}

/* --------------------------------------------------- count-up number (a11y) */
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setDisplay(value)
      return
    }
    let raf: number
    const duration = 900
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min((t - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(value * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return (
    <span className={cn('tnum', className)} aria-label={value.toLocaleString('en-IN')}>
      <span aria-hidden="true">{display.toLocaleString('en-IN')}</span>
    </span>
  )
}

/* ------------------------------------------------------ shared chart tip */
export function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="animate-pop-in rounded-[var(--radius-control)] border border-navy-100 bg-white px-3 py-2 shadow-pop">
      {label !== undefined && <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-navy-400">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-[12px]">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? p.payload?.fill ?? '#223a63' }} />
          <span className="text-navy-500">{p.name}</span>
          <span className="tnum ml-auto pl-3 font-semibold text-navy-900">
            {typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}
