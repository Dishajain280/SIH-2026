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
import { Crosshair, Siren } from 'lucide-react'
import { SITE_BY_ID, SITES } from '../data/mockData'
import { cn, fmt } from '../lib/utils'
import { RiskBadge, SectionTitle } from '../components/ui'

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

export default function RiskPrioritization() {
  const location = useLocation()
  const preselect = (location.state as { siteId?: string } | null)?.siteId
  const [selectedSite, setSelectedSite] = useState<string>(preselect ?? 'SBG-01')

  const ranked = useMemo(() => [...SITES].sort((a, b) => sitePriority(b) - sitePriority(a)), [])

  const site = SITE_BY_ID.get(selectedSite) ?? ranked[0]

  const barData = useMemo(
    () =>
      Object.entries(site.incidentTypes).map(([type, count]) => ({
        type,
        count,
      })),
    [site]
  )

  const pieData = useMemo(
    () =>
      Object.entries(site.incidentTypes).map(([type, count]) => ({
        name: type,
        value: count,
      })),
    [site]
  )

  const totalIncidents = barData.reduce((a, d) => a + d.count, 0)

  return (
    <div className="animate-fade-up space-y-6">
      <SectionTitle
        icon={<Crosshair className="h-4.5 w-4.5" />}
        title="Risk Prioritization & Intervention Planner"
        sub="Where to send safety resources first — ranked by composite AI risk scoring"
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Priority queue */}
        <div className="card xl:col-span-2">
          <div className="card-header">
            <h2 className="card-title">
              <Siren className="h-4 w-4 text-gold-600" /> Intervention Priority Queue
            </h2>
            <span className="text-[11px] font-medium text-navy-300">auto-ranked</span>
          </div>
          <div className="divide-y divide-navy-50">
            {ranked.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setSelectedSite(s.id)}
                className={cn(
                  'flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors',
                  selectedSite === s.id ? 'bg-navy-50' : 'hover:bg-navy-50/50'
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
                  <div className="mt-1 flex items-center gap-3 text-[11.5px] text-navy-400">
                    <span className="tnum">score {s.riskScore}</span>
                    <span className="tnum">{s.openPrecursors} precursors</span>
                    <span className="tnum">{s.unmapped} unmapped</span>
                  </div>
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
            ))}
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
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: 'Open precursors', value: site.openPrecursors },
                { label: 'Reports processed', value: fmt(site.reports) },
                { label: 'Unmapped incidents', value: site.unmapped },
              ].map((k) => (
                <div key={k.label} className="rounded-sm border border-navy-100 bg-navy-50/60 px-3 py-2.5">
                  <div className="tnum text-xl font-bold text-navy-900">{k.value}</div>
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

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Bar chart */}
            <div className="card lg:col-span-3">
              <div className="card-header">
                <h2 className="card-title">Incident Types — {site.id}</h2>
                <span className="text-[11px] text-navy-300">{totalIncidents} logged events</span>
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
                    <Tooltip
                      cursor={{ fill: 'rgba(10,21,38,0.04)' }}
                      contentStyle={{ borderRadius: 4, border: '1px solid #dce4f0', fontSize: 12 }}
                    />
                    <Bar dataKey="count" name="Incidents" radius={[3, 3, 0, 0]}>
                      {barData.map((d) => (
                        <Cell key={d.type} fill={INCIDENT_COLORS[d.type] ?? '#223a63'} />
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
                    >
                      {pieData.map((d) => (
                        <Cell key={d.name} fill={INCIDENT_COLORS[d.name] ?? '#223a63'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 4, border: '1px solid #dce4f0', fontSize: 12 }}
                    />
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
