import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, Building2, TrendingUp, Users } from 'lucide-react'
import { insightsForSite, SITE_BY_ID, SITES } from '../data/mockData'
import { cn, fmt, RISK_STYLES } from '../lib/utils'
import { RiskBadge, SectionTitle } from '../components/ui'
import { Sparkline } from '../components/Sparkline'

export default function SiteInsights() {
  const location = useLocation()
  const preselect = (location.state as { siteId?: string } | null)?.siteId
  const [siteId, setSiteId] = useState(preselect ?? 'SBG-01')

  const site = SITE_BY_ID.get(siteId) ?? SITES[0]
  const insight = useMemo(() => insightsForSite(siteId), [siteId])

  return (
    <div className="animate-fade-up space-y-6">
      <SectionTitle
        icon={<BarChart3 className="h-4.5 w-4.5" />}
        title="Site Insights"
        sub="Deep-dive analytics per industrial site — exposure profile, trend and leading precursors"
      />

      {/* Site selector chips */}
      <div className="flex flex-wrap gap-2">
        {SITES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSiteId(s.id)}
            className={cn(
              'flex items-center gap-2 rounded-sm border px-3 py-2 text-left transition-colors',
              siteId === s.id
                ? 'border-navy-900 bg-navy-900 text-white'
                : 'border-navy-200 bg-white text-navy-700 hover:border-navy-300'
            )}
          >
            <span className={cn('h-2 w-2 rounded-full', RISK_STYLES[s.riskLevel].dot)} />
            <span className="text-[12.5px] font-semibold">{s.name}</span>
            <span className={cn('tnum text-[11px] font-bold', siteId === s.id ? 'text-gold-400' : 'text-navy-300')}>
              {s.riskScore}
            </span>
          </button>
        ))}
      </div>

      {/* Header stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="card p-5 md:col-span-2">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-sm bg-navy-900 text-gold-500">
              <Building2 className="h-5.5 w-5.5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-navy-900">{site.name}</h2>
                <RiskBadge level={site.riskLevel} />
              </div>
              <p className="text-[12px] text-navy-400">
                {site.id} · {site.city} · {site.region}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-navy-400">
                <Users className="h-3 w-3" /> Headcount
              </div>
              <div className="tnum mt-1 text-lg font-bold text-navy-900">{fmt(site.headcount)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-navy-400">Reports</div>
              <div className="tnum mt-1 text-lg font-bold text-navy-900">{fmt(site.reports)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-navy-400">Last audit</div>
              <div className="tnum mt-1 text-lg font-bold text-navy-900">{site.lastAudit.slice(5)}</div>
            </div>
          </div>
        </div>

        <div className="card flex items-center justify-between p-5 md:col-span-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-navy-400">
              10-month risk trajectory
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="tnum text-3xl font-bold text-navy-900">{site.riskScore}</span>
              <span className="text-[12px] font-medium text-navy-400">/ 100 composite</span>
            </div>
            <p className="mt-1.5 text-[11.5px] text-navy-400">
              {site.riskScore >= 75
                ? 'Escalating — immediate intervention warranted'
                : site.riskScore >= 50
                  ? 'Elevated — monitor weekly'
                  : 'Stable — routine governance'}
            </p>
          </div>
          <Sparkline data={site.trend} stroke={RISK_STYLES[site.riskLevel].hex} w={150} h={48} className="!h-12 !w-[150px]" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Radar */}
        <div className="card xl:col-span-2">
          <div className="card-header">
            <h2 className="card-title">LSR Exposure Profile</h2>
            <span className="text-[11px] text-navy-300">lower = safer</span>
          </div>
          <div className="h-80 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={insight.radar} outerRadius="72%">
                <PolarGrid stroke="#dce4f0" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 10.5, fill: '#4a6a99' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Exposure"
                  dataKey="score"
                  stroke="#0a1526"
                  fill="#efa93b"
                  fillOpacity={0.45}
                  strokeWidth={2}
                />
                <Tooltip contentStyle={{ borderRadius: 4, border: '1px solid #dce4f0', fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend line */}
        <div className="card xl:col-span-3">
          <div className="card-header">
            <h2 className="card-title">
              <TrendingUp className="h-4 w-4 text-gold-600" /> Risk Score Trend
            </h2>
            <span className="badge border-gold-300 bg-gold-100 text-gold-700">6-month window</span>
          </div>
          <div className="h-80 p-4 pr-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={insight.riskTrend} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dce4f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#7c94b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#7c94b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 4, border: '1px solid #dce4f0', fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Risk score"
                  stroke="#0a1526"
                  strokeWidth={2.4}
                  dot={{ r: 3.5, fill: '#efa93b', stroke: '#0a1526', strokeWidth: 1.5 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Leading precursors + interventions */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Leading Precursors</h2>
            <span className="text-[11px] text-navy-300">count in last 90 days</span>
          </div>
          <div className="space-y-3 p-5">
            {insight.leading.map((l, i) => {
              const max = Math.max(...insight.leading.map((x) => x.value))
              return (
                <div key={l.name} className="flex items-center gap-3">
                  <span className="tnum w-6 text-[12px] font-bold text-navy-300">{i + 1}.</span>
                  <span className="w-52 shrink-0 truncate text-[13px] text-navy-700">{l.name}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-navy-100">
                    <div
                      className={cn('h-full rounded-full', i === 0 ? 'bg-gold-500' : 'bg-navy-500')}
                      style={{ width: `${(l.value / max) * 100}%` }}
                    />
                  </div>
                  <span className="tnum w-7 text-right text-[13px] font-bold text-navy-900">{l.value}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Active Interventions</h2>
            <RiskBadge level={site.riskLevel} />
          </div>
          <div className="space-y-2.5 p-5">
            {site.interventions.map((iv, i) => (
              <div key={iv} className="flex items-start gap-3 rounded-sm border border-navy-100 bg-navy-50/50 p-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-navy-900 text-[10.5px] font-bold text-gold-500">
                  {i + 1}
                </span>
                <p className="text-[13px] leading-relaxed text-navy-700">{iv}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
