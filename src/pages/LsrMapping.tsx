import { Fragment, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Filter, Info, Scale, Search, SlidersHorizontal, X } from 'lucide-react'
import { LSR_ROWS, LSR_RULES, RULE_BY_ID, SITE_BY_ID } from '../data/mockData'
import { cn } from '../lib/utils'
import { ConfidenceBar, SectionTitle, StatusBadge } from '../components/ui'

type StatusFilter = 'All' | 'Mapped' | 'Manual Review'

export default function LsrMapping() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('All')
  const [ruleFilter, setRuleFilter] = useState<string>('All')
  const [expanded, setExpanded] = useState<string | null>(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return LSR_ROWS.filter((r) => {
      if (status !== 'All' && r.status !== status) return false
      if (ruleFilter !== 'All' && r.ruleId !== ruleFilter) return false
      if (!q) return true
      const site = SITE_BY_ID.get(r.siteId)
      return `${r.id} ${r.precursor} ${r.rule} ${site?.name ?? ''} ${r.reportText}`.toLowerCase().includes(q)
    })
  }, [query, status, ruleFilter])

  const counts = useMemo(
    () => ({
      total: LSR_ROWS.length,
      mapped: LSR_ROWS.filter((r) => r.status === 'Mapped').length,
      review: LSR_ROWS.filter((r) => r.status === 'Manual Review').length,
    }),
    []
  )

  return (
    <div className="animate-fade-up space-y-6">
      <SectionTitle
        icon={<Scale className="h-4.5 w-4.5" />}
        title="Life-Saving Rules Mapping"
        sub="How AI-detected precursors map to the 9 Life-Saving Rules"
        right={
          <div className="flex items-center gap-2">
            <span className="badge border-emerald-200 bg-emerald-50 text-emerald-700">{counts.mapped} mapped</span>
            <span className="badge border-gold-300 bg-gold-100 text-gold-700">{counts.review} need review</span>
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

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
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
                const rule = RULE_BY_ID.get(r.ruleId)
                return (
                  <Fragment key={r.id}>
                    <tr
                      className="cursor-pointer transition-colors hover:bg-navy-50/60"
                      onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-[12.5px] font-semibold text-navy-900">{r.id}</div>
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
                              {r.ruleId}
                            </span>
                            <span className="max-w-44 text-[12.5px] leading-snug text-navy-700">{r.rule}</span>
                          </div>
                        ) : (
                          <span className="text-[12.5px] italic text-navy-300">No clear rule mapping</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <ConfidenceBar value={r.confidence} />
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-5 py-3.5 text-navy-300">
                        <Info className="h-4 w-4" />
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
                                {r.confidence >= 90
                                  ? 'high-precision keyword + entity match'
                                  : r.confidence >= 75
                                    ? 'semantic similarity above threshold'
                                    : 'below 75% confidence — human verification required'}
                              </div>
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
        {rows.length === 0 && (
          <div className="px-5 py-14 text-center text-sm text-navy-300">
            No incidents match the current filters.
          </div>
        )}
        <div className="flex items-center justify-between border-t border-navy-100 px-5 py-3 text-[12px] text-navy-400">
          <span>
            Showing <b className="text-navy-700">{rows.length}</b> of {counts.total} incidents
          </span>
          <span>Click any row for the underlying narrative</span>
        </div>
      </div>
    </div>
  )
}
