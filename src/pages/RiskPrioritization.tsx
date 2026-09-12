import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Crosshair, Filter, Gauge, Siren, X } from 'lucide-react'
import { ChartTip } from '../components/ui'
import { SITE_BY_ID, SITE_GEO, SITES } from '../data/mockData'
import { cn, fmt } from '../lib/utils'
import { PageHeader, RiskBadge } from '../components/ui'

const INCIDENT_COLORS: Record<string, string> = {
  'Struck-By': '#0a1526',
  'Fall': '#efa93b',
  'Caught-In/Between': '#223a63',
  'Energy Release': '#dc2626',
  'Slip/Trip': '#7c94b8',
}

function sitePriority(s: (typeof SITES)[number]) {
  // weighted composite: risk score dominates, ties broken by precursor density
  return s.riskScore * 10 + s.openPrecursors * 2 - s.unmapped
}

const COMPLIANCE_BY_ID = new Map(SITE_GEO.map((g) => [g.id, g]))

export default function RiskPrioritization() {
  const location = useLocation()
  const preselect = (location.state as { siteId?: string } | null)?.siteId
  const [selectedSite, setSelectedSite] = useState<string>(preselect ?? 'SBG-01')
  /** Incident type acting as a cross-filter across the queue and the site panel. */
  const [crossFilter, setCrossFilter] = useState<string | null>(null)

  const ranked = useMemo(() => [...SITES].sort((a, b) => sitePriority(b) - sitePriority(a)), [])

  // Cross-filter: re-rank the queue by the selected incident type so the chart
  // click actually reorders the intervention plan.
  const displayed = useMemo(() => {
    if (!crossFilter) return ranked
    return [...ranked].sort(
      (a, b) => (b.incidentTypes[crossFilter] ?? 0) - (a.incidentTypes[crossFilter] ?? 0)
    )
  }, [ranked, crossFilter])

  const site = SITE_BY_ID.get(selectedSite) ?? ranked[0]
  const compliance = COMPLIANCE_BY_ID.get(site.id)

  const barData = useMemo(
    () => Object.entries(site.incidentTypes).map(([type, count]) => ({ type, count })),
    [site]
  )
  const pieData = useMemo(
    () => Object.entries(site.incidentTypes).map(([type, count]) => ({ name: type, value: count })),
    [site]
  )
  const totalIncidents = barData.reduce((a, d) => a + d.count, 0)

  // Cross-site comparison for the active filter.
  const crossRows = useMemo(() => {
    if (!crossFilter) return []
    return [...SITES]
      .map((s) => ({ site: s, count: s.incidentTypes[crossFilter] ?? 0 }))
      .sort((a, b) => b.count - a.count)
  }, [crossFilter])

  const crossMax = crossRows.length > 0 ? Math.max(...crossRows.map((r) => r.count)) : 1

  const toggleFilter = (type: string) => setCrossFilter((c) => (c === type ? null : type))

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        icon={<Crosshair className="h-5 w-5" />}
        eyebrow="Intervention Planner"
        title="Risk Prioritization"
        sub="Where to send safety resources first — ranked by composite AI risk scoring"
      />

      {crossFilter && (
        <div className="animate-fade-up flex flex-wrap items-center gap-2 rounded-[var(--radius-control)] border border-gold-300 bg-gold-50 px-4 py-2.5">
          <Filter className="h-3.5 w-3.5 text-gold-700" />
          <span className="text-[12.5px] text-navy-700">
            Cross-filtered by incident type <b className="text-navy-900">{crossFilter}</b> — the queue is re-ranked and
            the per-site comparison is below.
          </span>
          <button
            onClick={() => setCrossFilter(null)}
            className="ml-auto inline-flex items-center gap-1 rounded-sm border border-gold-300 bg-white px-2 py-0.5 text-[11.5px] font-semibold text-gold-700 hover:bg-gold-100"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Priority queue */}
        <div className="card xl:col-span-2">
          <div className="card-header">
            <h2 className="card-title">
              <Siren className="h-4 w-4 text-gold-600" /> Intervention Priority Queue
            </h2>
            <span className="text-[11px] font-medium text-navy-300">
              {crossFilter ? `ranked by ${crossFilter}` : 'auto-ranked'}
            </span>
          </div>
          <div className="divide-y divide-navy-50">
            {displayed.map((s, i) => {
              const comp = COMPLIANCE_BY_ID.get(s.id)
              const typeCount = crossFilter ? (s.incidentTypes[crossFilter] ?? 0) : null
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSite(s.id)}
                  className={cn(
                    'group flex w-full items-center gap-3 px-5 py-3.5 text-left transition-all duration-150',
                    selectedSite === s.id
                      ? 'bg-navy-50 shadow-[inset_3px_0_0_0_var(--color-gold-500)]'
                      : 'hover:bg-navy-50/50 hover:translate-x-0.5'
                  )}
                >
                  <span
                    className={cn(
                      'tnum flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-[13px] font-bold',
                      i === 0 ? 'bg-red-600 text-white' : i === 1 ? 'bg-gold-500 text-navy-950' : i === 2 ? 'bg-navy-700 text-white' : 'bg-navy-100 text-navy-500'
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13.5px] font-semibold text-navy-900">{s.name}</span>
                      <RiskBadge level={s.riskLevel} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-navy-400">
                      <span className="tnum">score {s.riskScore}</span>
                      <span className="tnum">{s.openPrecursors} precursors</span>
                      <span className="tnum">{s.unmapped} unmapped</span>
                      {comp && (
                        <span className="tnum inline-flex items-center gap-1 font-medium text-navy-500">
                          <Gauge className="h-3 w-3 text-gold-600" />
                          {comp.compliance}%
                        </span>
                      )}
                    </div>
                    {typeCount != null && (
                      <div className="mt-1 inline-flex items-center gap-1.5 rounded-sm bg-navy-900 px-1.5 py-0.5 text-[10.5px] font-semibold text-gold-400">
                        {typeCount} × {crossFilter}
                      </div>
                    )}
                    {/* score bar */}
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-navy-100">
                      <div
                        className={cn('h-full rounded-full', s.riskLevel === 'Critical' ? 'bg-red-500' : s.riskLevel === 'High' ? 'bg-gold-500' : s.riskLevel === 'Medium' ? 'bg-navy-400' : 'bg-emerald-500')}
                        style={{ width: `${s.riskScore}%` }}
                      />
                    </div>
                  </div>
                  <span className={cn('tnum text-lg font-bold', s.riskScore >= 75 ? 'text-red-600' : 'text-navy-700')}>
                    {s.riskScore}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Detail panel */}
        <div className="space-y-6 xl:col-span-3">
          {/* Site header */}
          <div className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-navy-900">{site.name}</h2>
                  <RiskBadge level={site.riskLevel} />
                </div>
                <p className="mt-1 text-[12.5px] text-navy-400">
                  {site.city} · {site.region} region · {fmt(site.headcount)} workers · last audit {site.lastAudit}
                </p>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">Composite risk</div>
                <div className={cn('tnum text-4xl font-bold leading-none', site.riskScore >= 75 ? 'text-red-600' : 'text-navy-900')}>
                  {site.riskScore}
                </div>
              </div>
            </div>

            {/* KPI strip */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Open precursors', value: site.openPrecursors },
                { label: 'Reports processed', value: fmt(site.reports) },
                { label: 'Unmapped incidents', value: site.unmapped },
                {
                  label: 'LSR compliance',
                  value: compliance ? `${compliance.compliance}%` : '—',
                  hint: compliance ? `${compliance.mapped} of ${compliance.total} incidents mapped to a rule` : undefined,
                  accent: true,
                },
              ].map((k) => (
                <div key={k.label} className="rounded-sm border border-navy-100 bg-navy-50/60 px-3 py-2.5" title={k.hint}>
                  <div className={cn('tnum text-xl font-bold', k.accent ? 'text-gold-700' : 'text-navy-900')}>
                    {k.value}
                  </div>
                  <div className="text-[11px] text-navy-400">{k.label}</div>
                </div>
              ))}
            </div>

            {/* Recommended interventions */}
            <div className="mt-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-navy-400">
                Recommended interventions
              </div>
              <ul className="mt-2 space-y-1.5">
                {site.interventions.map((iv, i) => (
                  <li key={iv} className="flex items-start gap-2.5 text-[13px] text-navy-700">
                    <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[10px] font-bold text-gold-500">
                      {i + 1}
                    </span>
                    {iv}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Cross-site comparison (appears on chart click) */}
          {crossFilter && (
            <div className="card animate-fade-up">
              <div className="card-header">
                <h2 className="card-title">
                  <Filter className="h-4 w-4 text-gold-600" /> {crossFilter} — across all sites
                </h2>
                <span className="text-[11px] text-navy-300">click a site to focus it</span>
              </div>
              <div className="space-y-2.5 p-5">
                {crossRows.map((row) => (
                  <button
                    key={row.site.id}
                    onClick={() => setSelectedSite(row.site.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-sm border px-3 py-2 text-left transition-all',
                      selectedSite === row.site.id
                        ? 'border-navy-900 bg-navy-50'
                        : 'border-navy-100 hover:border-navy-300 hover:bg-navy-50/60'
                    )}
                  >
                    <span className="w-14 shrink-0 font-mono text-[11px] font-semibold text-navy-500">{row.site.id}</span>
                    <span className="w-40 shrink-0 truncate text-[12.5px] text-navy-700">{row.site.name}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-navy-100">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(row.count / crossMax) * 100}%`, backgroundColor: INCIDENT_COLORS[crossFilter] ?? '#223a63' }}
                      />
                    </div>
                    <span className="tnum w-7 shrink-0 text-right text-[13px] font-bold text-navy-900">{row.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Bar chart */}
            <div className="card lg:col-span-3">
              <div className="card-header">
                <h2 className="card-title">Incident Types — {site.id}</h2>
                <span className="text-[11px] text-navy-300">{totalIncidents} logged events · click a bar</span>
              </div>
              <div className="h-64 p-4 pr-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dce4f0" vertical={false} />
                    <XAxis
                      dataKey="type"
                      tick={{ fontSize: 10, fill: '#7c94b8' }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                      height={46}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#7c94b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(10,21,38,0.04)' }} />
                    <Bar dataKey="count" name="Incidents" radius={[3, 3, 0, 0]} cursor="pointer" onClick={(d: { type?: string }) => d?.type && toggleFilter(d.type)}>
                      {barData.map((d) => (
                        <Cell
                          key={d.type}
                          fill={INCIDENT_COLORS[d.type] ?? '#223a63'}
                          opacity={crossFilter && crossFilter !== d.type ? 0.35 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie chart */}
            <div className="card lg:col-span-2">
              <div className="card-header">
                <h2 className="card-title">Share of Incidents</h2>
              </div>
              <div className="h-64 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={72}
                      paddingAngle={2}
                      strokeWidth={0}
                      cursor="pointer"
                      onClick={(d: { name?: string }) => d?.name && toggleFilter(d.name)}
                    >
                      {pieData.map((d) => (
                        <Cell
                          key={d.name}
                          fill={INCIDENT_COLORS[d.name] ?? '#223a63'}
                          opacity={crossFilter && crossFilter !== d.name ? 0.35 : 1}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTip />} />
                    <Legend wrapperStyle={{ fontSize: 10.5 }} iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
