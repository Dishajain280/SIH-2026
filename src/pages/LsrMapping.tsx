import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Download, Filter, Info, Link2, Scale, Search, SlidersHorizontal, X } from 'lucide-react'
import {
  DEFAULT_LSR_THRESHOLD,
  LSR_ROWS,
  LSR_RULES,
  RULE_BY_ID,
  SITE_BY_ID,
  statusForConfidence,
} from '../data/mockData'
import { cn, downloadCsv } from '../lib/utils'
import { ConfidenceBar, PageHeader, StatusBadge } from '../components/ui'
import type { ExtractionCorrection, LsrMappingRow, LsrStatus } from '../types'

type StatusFilter = 'All' | 'Mapped' | 'Manual Review'

const CORRECTION_STORAGE_KEY = 'sifguard.corrections.v1'

function loadCorrections(): Record<string, ExtractionCorrection[]> {
  try {
    const raw = localStorage.getItem(CORRECTION_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, ExtractionCorrection[]>
    return typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

/** Confidence after any human override made in the NLP analyzer. */
function effectiveConfidence(row: LsrMappingRow, corrections: Record<string, ExtractionCorrection[]>): number {
  const c = (corrections[row.id] ?? []).find((x) => x.field === 'confidence')
  return c ? Number(c.after) : row.confidence
}

/** Mapped rule after any human override; '—' means "no clear mapping". */
function effectiveRuleId(row: LsrMappingRow, corrections: Record<string, ExtractionCorrection[]>): string {
  const c = (corrections[row.id] ?? []).find((x) => x.field === 'ruleId')
  return c ? String(c.after) : row.ruleId
}

function correctionCount(row: LsrMappingRow, corrections: Record<string, ExtractionCorrection[]>): number {
  return (corrections[row.id] ?? []).length
}

/**
 * Status for a row given the live cutoff and any human corrections.
 * A rule explicitly unmapped by a human always needs review, regardless of confidence.
 */
function resolveStatus(
  row: LsrMappingRow,
  corrections: Record<string, ExtractionCorrection[]>,
  threshold: number
): LsrStatus {
  if (effectiveRuleId(row, corrections) === '—') return 'Manual Review'
  return statusForConfidence(effectiveConfidence(row, corrections), threshold)
}

function readFilters(): { q: string; s: StatusFilter; r: string; th: number } {
  const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)
  const s = params.get('s')
  return {
    q: params.get('q') ?? '',
    s: s === 'Mapped' || s === 'Manual Review' ? s : 'All',
    r: params.get('r') && LSR_RULES.some((x) => x.id === params.get('r')) ? (params.get('r') as string) : 'All',
    th: params.get('th') ? Math.max(0, Math.min(100, Number(params.get('th')))) : DEFAULT_LSR_THRESHOLD,
  }
}

export default function LsrMapping() {
  const initial = useMemo(readFilters, [])
  const [query, setQuery] = useState(initial.q)
  const [status, setStatus] = useState<StatusFilter>(initial.s)
  const [ruleFilter, setRuleFilter] = useState<string>(initial.r)
  const [threshold, setThreshold] = useState<number>(initial.th)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [corrections, setCorrections] = useState<Record<string, ExtractionCorrection[]>>(() => loadCorrections())

  // Refresh corrections when returning to the tab (they may have been made on the Upload page).
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') setCorrections(loadCorrections())
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Keep the URL in sync so any filtered view is shareable.
  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (status !== 'All') params.set('s', status)
    if (ruleFilter !== 'All') params.set('r', ruleFilter)
    if (threshold !== DEFAULT_LSR_THRESHOLD) params.set('th', String(threshold))
    const qs = params.toString()
    window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname)
  }, [query, status, ruleFilter, threshold])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return LSR_ROWS.filter((r) => {
      if (status !== 'All' && resolveStatus(r, corrections, threshold) !== status) return false
      if (ruleFilter !== 'All' && effectiveRuleId(r, corrections) !== ruleFilter) return false
      if (!q) return true
      const site = SITE_BY_ID.get(r.siteId)
      return `${r.id} ${r.precursor} ${r.rule} ${site?.name ?? ''} ${r.reportText}`.toLowerCase().includes(q)
    })
  }, [query, status, ruleFilter, threshold, corrections])

  const counts = useMemo(
    () => ({
      total: LSR_ROWS.length,
      mapped: LSR_ROWS.filter((r) => resolveStatus(r, corrections, threshold) === 'Mapped').length,
      review: LSR_ROWS.filter((r) => resolveStatus(r, corrections, threshold) === 'Manual Review').length,
    }),
    [corrections, threshold]
  )

  const totalCorrections = useMemo(
    () => Object.values(corrections).reduce((n, list) => n + list.length, 0),
    [corrections]
  )

  const copyLink = () => {
    const url = window.location.href
    navigator.clipboard?.writeText(url).then(
      () => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1800)
      },
      () => setCopied(false)
    )
  }

  const exportCsv = () => {
    downloadCsv(
      `lsr-mapping-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Report ID', 'Date', 'Site ID', 'Site', 'Detected Precursor', 'Mapped Rule ID', 'Mapped Rule', 'Confidence', 'Status'],
      rows.map((r) => [
        r.id,
        r.date,
        r.siteId,
        SITE_BY_ID.get(r.siteId)?.name ?? '',
        r.precursor,
        effectiveRuleId(r, corrections),
        RULE_BY_ID.get(effectiveRuleId(r, corrections))?.name ?? 'No clear rule mapping',
        effectiveConfidence(r, corrections),
        resolveStatus(r, corrections, threshold),
      ])
    )
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        icon={<Scale className="h-5 w-5" />}
        eyebrow="Rule Engine"
        title="Life-Saving Rules Mapping"
        sub="How AI-detected precursors map to the 9 Life-Saving Rules"
        right={
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge border-emerald-200 bg-emerald-50 text-emerald-700">{counts.mapped} mapped</span>
            <span className="badge border-gold-300 bg-gold-100 text-gold-700">{counts.review} need review</span>
            {totalCorrections > 0 && (
              <span className="badge border-navy-200 bg-navy-50 text-navy-600" title="Human corrections applied in the NLP analyzer">
                {totalCorrections} human correction{totalCorrections !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        }
      />

      {/* Filters */}
      <div className="card flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search report ID, precursor, rule, site or narrative…"
            className="input pl-9"
          />
          {query && (
            <button
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-600"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-navy-400 sm:flex">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Status
          </span>
          {(['All', 'Mapped', 'Manual Review'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              aria-pressed={status === s}
              className={cn(
                'rounded-sm border px-3 py-1.5 text-[12px] font-semibold transition-colors',
                status === s
                  ? 'border-navy-900 bg-navy-900 text-white'
                  : 'border-navy-200 bg-white text-navy-600 hover:border-navy-300'
              )}
            >
              {s}
            </button>
          ))}

          <span className="ml-2 hidden items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-navy-400 sm:flex">
            <Filter className="h-3.5 w-3.5" /> Rule
          </span>
          <select
            value={ruleFilter}
            onChange={(e) => setRuleFilter(e.target.value)}
            className="input w-auto min-w-40"
            aria-label="Filter by Life-Saving Rule"
          >
            <option value="All">All rules</option>
            {LSR_RULES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id} — {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Threshold + export toolbar */}
      <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-navy-400">
            Mapping cutoff
          </span>
          <input
            type="range"
            min={50}
            max={100}
            step={1}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="h-1 flex-1 max-w-72 cursor-pointer accent-gold-600"
            aria-label="Confidence threshold for mapping to a Life-Saving Rule"
            aria-valuetext={`${threshold} percent`}
          />
          <span className="tnum w-12 shrink-0 text-[13px] font-bold text-navy-900">{threshold}%</span>
          <span className="hidden text-[11.5px] text-navy-400 lg:inline">
            Raising the cutoff moves borderline incidents into human review.
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            className="btn-secondary"
            onClick={copyLink}
            title="Copy a link to this exact filtered view"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Link2 className="h-3.5 w-3.5" />}
            {copied ? 'Link copied' : 'Share view'}
          </button>
          <button
            className="btn-secondary"
            onClick={exportCsv}
            disabled={rows.length === 0}
            title="Export the filtered incidents as CSV"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Table — desktop table, mobile cards */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {/* Desktop table (≥ 768 px) */}
          <div className="hidden md:block">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-navy-100 bg-navy-50 text-[11px] font-semibold uppercase tracking-wide text-navy-400">
                  <th className="px-5 py-3">Report ID</th>
                  <th className="px-5 py-3">Site</th>
                  <th className="px-5 py-3">Detected Precursor</th>
                  <th className="px-5 py-3">Mapped Life-Saving Rule</th>
                  <th className="px-5 py-3">AI Confidence</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {rows.map((r) => {
                  const site = SITE_BY_ID.get(r.siteId)
                  const ruleId = effectiveRuleId(r, corrections)
                  const rule = RULE_BY_ID.get(ruleId)
                  const conf = effectiveConfidence(r, corrections)
                  const st = resolveStatus(r, corrections, threshold)
                  const nCorr = correctionCount(r, corrections)
                  return (
                    <Fragment key={r.id}>
                      <tr
                        className="group cursor-pointer transition-all duration-150 hover:bg-navy-50/70"
                        onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                        aria-expanded={expanded === r.id}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[12.5px] font-semibold text-navy-900">{r.id}</span>
                            {nCorr > 0 && (
                              <span
                                className="rounded-full bg-navy-100 px-1.5 text-[10px] font-bold text-navy-600"
                                title={`${nCorr} human correction(s) applied`}
                              >
                                {nCorr}✎
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-navy-300">{r.date}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="max-w-40 truncate text-[13px] font-medium text-navy-800">{site?.name}</div>
                          <div className="font-mono text-[11px] text-navy-300">{r.siteId}</div>
                        </td>
                        <td className="max-w-60 px-5 py-3.5">
                          <div className="text-[13px] font-medium leading-snug text-navy-900">{r.precursor}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          {rule ? (
                            <div className="flex items-center gap-2">
                              <span className="rounded-sm bg-navy-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-gold-500">
                                {ruleId}
                              </span>
                              <span className="max-w-44 text-[12.5px] leading-snug text-navy-700">{rule.name}</span>
                            </div>
                          ) : (
                            <span className="text-[12.5px] italic text-navy-300">No clear rule mapping</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <ConfidenceBar value={conf} />
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={st} />
                        </td>
                        <td className="px-5 py-3.5 text-navy-300">
                          <Info
                            className={cn(
                              'h-4 w-4 transition-all duration-200 group-hover:text-navy-600',
                              expanded === r.id && 'rotate-180 text-gold-600'
                            )}
                          />
                        </td>
                      </tr>
                      {expanded === r.id && (
                        <tr className="bg-navy-50/70">
                          <td colSpan={7} className="px-5 py-4">
                            <div className="animate-fade-up grid gap-4 md:grid-cols-3">
                              <div className="md:col-span-2">
                                <div className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">
                                  Report narrative
                                </div>
                                <p className="mt-1.5 rounded-sm border border-navy-100 bg-white p-3 font-mono text-[12px] leading-relaxed text-navy-700">
                                  {r.reportText}
                                </p>
                              </div>
                              <div className="space-y-2 text-[12.5px] text-navy-600">
                                <div>
                                  <span className="font-semibold text-navy-800">Rule category: </span>
                                  {rule?.category ?? '—'}
                                </div>
                                <div>
                                  <span className="font-semibold text-navy-800">Decision basis: </span>
                                  {conf >= 90
                                    ? 'high-precision keyword + entity match'
                                    : conf >= threshold
                                      ? `semantic similarity above the ${threshold}% cutoff`
                                      : `below the ${threshold}% cutoff — human verification required`}
                                </div>
                                {nCorr > 0 && (
                                  <div className="flex items-center gap-1.5 font-medium text-gold-700">
                                    <Check className="h-3.5 w-3.5" />
                                    {nCorr} human correction{nCorr !== 1 ? 's' : ''} applied in the analyzer
                                  </div>
                                )}
                                <Link
                                  to="/upload"
                                  className="inline-flex items-center gap-1 font-semibold text-navy-700 hover:text-gold-700"
                                >
                                  Open in NLP analyzer
                                </Link>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards (< 768 px) */}
          <div className="md:hidden divide-y divide-navy-100">
            {rows.map((r) => {
              const site = SITE_BY_ID.get(r.siteId)
              const ruleId = effectiveRuleId(r, corrections)
              const rule = RULE_BY_ID.get(ruleId)
              const conf = effectiveConfidence(r, corrections)
              const st = resolveStatus(r, corrections, threshold)
              const nCorr = correctionCount(r, corrections)
              return (
                <div
                  key={r.id}
                  className="group flex flex-col gap-2 p-4 cursor-pointer transition-colors hover:bg-navy-50/70"
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  aria-expanded={expanded === r.id}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[12px] font-semibold text-navy-900">{r.id}</span>
                      <span className="ml-2 text-[11px] text-navy-300">{r.date}</span>
                      {nCorr > 0 && <span className="ml-1.5 text-[10px] font-bold text-navy-500">✎{nCorr}</span>}
                    </div>
                    <StatusBadge status={st} />
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[12.5px] text-navy-700">
                    <span className="tnum font-medium text-navy-500">{r.siteId}</span>
                    <span className="max-w-[180px] truncate">{site?.name}</span>
                  </div>
                  <div className="font-medium leading-snug text-navy-900">{r.precursor}</div>
                  {rule ? (
                    <div className="flex items-center gap-2 text-[12px] text-navy-600">
                      <span className="font-mono font-bold text-gold-600">{ruleId}</span>
                      <span className="truncate">{rule.name}</span>
                    </div>
                  ) : (
                    <span className="text-[12px] italic text-navy-300">No clear rule mapping</span>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-navy-400">
                    <span className="font-medium text-navy-500">Confidence</span>
                    <div className="w-28">
                      <ConfidenceBar value={conf} />
                    </div>
                  </div>
                  {expanded === r.id && (
                    <div className="mt-1 animate-fade-up rounded-sm border border-navy-100 bg-white p-3 text-[12px] leading-relaxed text-navy-700">
                      {r.reportText}
                      <div className="mt-2 space-y-1 text-navy-500">
                        <div>
                          <span className="font-semibold text-navy-700">Category: </span>
                          {rule?.category ?? '—'}
                        </div>
                        <div>
                          <span className="font-semibold text-navy-700">Basis: </span>
                          {conf >= 90
                            ? 'keyword + entity match'
                            : conf >= threshold
                              ? `semantic similarity above the ${threshold}% cutoff`
                              : `below the ${threshold}% cutoff — human verification required`}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        {rows.length === 0 && (
          <div className="px-5 py-14 text-center text-sm text-navy-300">
            No incidents match the current filters.
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-navy-100 px-5 py-3 text-[12px] text-navy-400">
          <span>
            Showing <b className="text-navy-700">{rows.length}</b> of {counts.total} incidents
            {threshold !== DEFAULT_LSR_THRESHOLD && (
              <span className="ml-1 text-navy-300">· at a {threshold}% mapping cutoff</span>
            )}
          </span>
          <span>Click any row for the underlying narrative</span>
        </div>
      </div>
    </div>
  )
}
