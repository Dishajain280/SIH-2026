import type { RiskLevel } from '../types'

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function fmt(n: number): string {
  return n.toLocaleString('en-IN')
}

export function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export const RISK_STYLES: Record<RiskLevel, { chip: string; dot: string; cell: string; hex: string }> = {
  Critical: {
    chip: 'border-red-200 bg-red-50 text-red-700',
    dot: 'bg-red-500',
    cell: 'bg-red-600 text-white',
    hex: '#dc2626',
  },
  High: {
    chip: 'border-gold-300 bg-gold-100 text-gold-700',
    dot: 'bg-gold-500',
    cell: 'bg-gold-500 text-navy-950',
    hex: '#efa93b',
  },
  Medium: {
    chip: 'border-navy-200 bg-navy-50 text-navy-700',
    dot: 'bg-navy-400',
    cell: 'bg-navy-300 text-navy-900',
    hex: '#7c94b8',
  },
  Low: {
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
    cell: 'bg-emerald-100 text-emerald-800',
    hex: '#10b981',
  },
}

export function confBadge(c: number): string {
  if (c >= 90) return 'text-emerald-600'
  if (c >= 75) return 'text-navy-700'
  return 'text-gold-700'
}

export function confBar(c: number): string {
  if (c >= 90) return 'bg-emerald-500'
  if (c >= 75) return 'bg-navy-500'
  return 'bg-gold-500'
}
