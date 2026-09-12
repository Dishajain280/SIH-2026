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

/** Strong fills — used on heatmap tiles (white/dark text on top). */
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
    chip: 'border-navy-200 bg-navy-50 text-navy-600',
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

/** Softer, WCAG-AA text variants — used for badges sitting on white cards. */
export const RISK_SOFT: Record<RiskLevel, string> = {
  Critical: 'border-red-200 bg-red-50 text-red-700',
  High: 'border-gold-300 bg-gold-100 text-gold-700',
  Medium: 'border-navy-200 bg-navy-50 text-navy-600',
  Low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
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

/** Quote a CSV field, escaping embedded quotes. */
function csvCell(value: string | number): string {
  const s = String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * Trigger a client-side CSV download. Prepends a UTF-8 BOM so Excel on Windows
 * reads non-ASCII site names correctly.
 */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const body = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
  const blob = new Blob(['\uFEFF' + body], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Open a print-ready view (used for the per-site PDF one-pager via the print dialog). */
export function printRegion(html: string, title: string): void {
  const win = window.open('', '_blank', 'width=900,height=1200')
  if (!win) return
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:'IBM Plex Sans',system-ui,-apple-system,Segoe UI,sans-serif;color:#0a1526;margin:0;padding:32px}
  h1{font-size:20px;margin:0 0 4px}
  h2{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#4a6a99;margin:24px 0 8px}
  .muted{color:#4a6a99;font-size:12px}
  .eyebrow{text-transform:uppercase;letter-spacing:.14em;font-size:10px;font-weight:700;color:#a4660f}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{text-align:left;text-transform:uppercase;letter-spacing:.06em;font-size:10px;color:#4a6a99;border-bottom:1px solid #dce4f0;padding:6px 8px}
  td{border-bottom:1px solid #eef2f8;padding:7px 8px}
  .kpis{display:flex;gap:24px;flex-wrap:wrap;margin-top:12px}
  .kpi{border:1px solid #dce4f0;border-radius:6px;padding:10px 14px;min-width:130px}
  .kpi b{display:block;font-size:22px}
  .kpi span{font-size:11px;color:#4a6a99}
  ul{margin:6px 0 0 18px;padding:0;font-size:12px;line-height:1.7}
  footer{margin-top:28px;border-top:1px solid #dce4f0;padding-top:10px;font-size:10px;color:#7c94b8}
</style></head><body>${html}
<script>window.onload=function(){window.print()}<\/script></body></html>`)
  win.document.close()
}
