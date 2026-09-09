import type { ReactNode } from 'react'
import { cn, RISK_STYLES } from '../lib/utils'
import type { LsrStatus, RiskLevel } from '../types'

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <span className={cn('badge', RISK_STYLES[level].chip, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', RISK_STYLES[level].dot)} />
      {level}
    </span>
  )
}

export function StatusBadge({ status }: { status: LsrStatus }) {
  if (status === 'Mapped') {
    return (
      <span className="badge border-emerald-200 bg-emerald-50 text-emerald-700">
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-none stroke-current stroke-[2]">
          <path d="M2 6.5 4.8 9.2 10 3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Mapped
      </span>
    )
  }
  return (
    <span className="badge border-gold-300 bg-gold-100 text-gold-700">
      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-none stroke-current stroke-[2]">
        <circle cx="6" cy="6" r="4.6" />
        <path d="M6 3.4v3l1.9 1.4" strokeLinecap="round" />
      </svg>
      Manual Review
    </span>
  )
}

export function SectionTitle({
  icon,
  title,
  sub,
  right,
}: {
  icon: ReactNode
  title: string
  sub?: string
  right?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-navy-900 text-gold-500">{icon}</span>
        <div>
          <h1 className="text-lg font-bold leading-tight text-navy-900">{title}</h1>
          {sub && <p className="text-[13px] text-navy-400">{sub}</p>}
        </div>
      </div>
      {right}
    </div>
  )
}

export function ConfidenceBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-navy-100">
        <div
          className={cn('h-full rounded-full', value >= 90 ? 'bg-emerald-500' : value >= 75 ? 'bg-navy-500' : 'bg-gold-500')}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={cn('tnum text-xs font-semibold', value >= 90 ? 'text-emerald-600' : value >= 75 ? 'text-navy-700' : 'text-gold-700')}>
        {value}%
      </span>
      {label && <span className="text-[11px] text-navy-300">{label}</span>}
    </div>
  )
}
