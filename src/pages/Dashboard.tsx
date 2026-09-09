import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BellRing,
  Check,
  FileText,
  Map,
  ShieldAlert,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ALERT_SEED, ALERT_STREAM_EXTRA, HEAT_CELLS, METRICS, TREND_SERIES } from '../data/mockData'
import type { Metric, SifAlert } from '../types'
import { cn, fmt, RISK_STYLES } from '../lib/utils'
import { Sparkline, TrendChip } from '../components/Sparkline'
import { RiskBadge, SectionTitle } from '../components/ui'

const METRIC_ICONS = {
  file: FileText,
  shield: ShieldAlert,
  alert: AlertTriangle,
  map: Map,
} as const

const METRIC_SPARK: Record<string, number[]> = {
  'Total Reports Processed': [186, 204, 232, 258, 246, 271, 298, 322, 354, 388],
  'Hidden SIF Precursors Detected': [21, 24, 26, 31, 29, 33, 36, 38, 41, 44],
  'Unmapped Incidents': [54, 49, 47, 44, 40, 36, 33, 29, 25, 22],
  'Active High-Risk Sites': [2, 2, 3, 2, 3, 4, 3, 3, 2, 3],
}

const METRIC_STROKE: Record<string, string> = {
  'Total Reports Processed': '#223a63',
  'Hidden SIF Precursors Detected': '#efa93b',
  'Unmapped Incidents': '#dc2626',
  'Active High-Risk Sites': '#7c94b8',
}

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = METRIC_ICONS[metric.icon]
  const invertGood = metric.label === 'Unmapped Incidents' || metric.label === 'Active High-Risk Sites'
  return (
    <div className="card flex items-start justify-between gap-4 p-5">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-navy-400">
          <Icon className="h-3.5 w-3.5 text-gold-600" />
          {metric.label}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="tnum text-3xl font-bold leading-none text-navy-900">{fmt(metric.value)}</span>
          <TrendChip delta={metric.delta} invertGood={invertGood} />
        </div>
        <p className="mt-2 text-[12px] text-navy-400">{metric.sublabel}</p>
      </div>
      <Sparkline data={METRIC_SPARK[metric.label] ?? []} stroke={METRIC_STROKE[metric.label]} />
    </div>
  )
}

function RiskHeatmap() {
  const [selected, setSelected] = useState<string | null>(null)
  const sel = HEAT_CELLS.find((c) => c.siteId === selected)
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <Map className="h-4 w-4 text-gold-600" /> Site Risk Heatmap
        </h2>
        <div className="flex items-center gap-3 text-[11px] font-medium text-navy-400">
          {(['Critical', 'High', 'Medium', 'Low'] as const).map((lv) => (
            <span key={lv} className="flex items-center gap-1.5">
              <span className={cn('h-2.5 w-2.5 rounded-sm', RISK_STYLES[lv].dot)} /> {lv}
            </span>
          ))}
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {HEAT_CELLS.map((cell) => (
            <button
              key={cell.siteId}
              onClick={() => setSelected(cell.siteId === selected ? null : cell.siteId)}
              className={cn(
                'group relative overflow-hidden rounded-sm border p-3.5 text-left transition-all',
                RISK_STYLES[cell.level].cell,
                cell.siteId === selected
                  ? 'ring-2 ring-navy-900 ring-offset-2'
                  : 'hover:-translate-y-0.5 hover:shadow-pop'
              )}
              title={`${cell.site} — risk score ${cell.score}`}
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-[10px] font-semibold opacity-70">{cell.siteId}</span>
                <span className="tnum text-xl font-bold leading-none">{cell.score}</span>
              </div>
              <div className="mt-6 line-clamp-2 text-[12px] font-semibold leading-snug">{cell.site}</div>
              <div className="mt-0.5 truncate text-[10.5px] opacity-70">{cell.zone}</div>
              {/* intensity sliver */}
              <span
                className="absolute inset-x-0 bottom-0 h-1 bg-white/40"
                style={{ width: `${cell.score}%` }}
              />
            </button>
          ))}
        </div>

        {sel && (
          <div className="animate-fade-up mt-4 rounded-sm border border-navy-100 bg-navy-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[11px] font-semibold text-navy-400">{sel.siteId}</span>
                <span className="text-sm font-bold text-navy-900">{sel.site}</span>
                <RiskBadge level={sel.level} />
              </div>
              <Link
                to="/risk"
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-navy-700 hover:text-gold-700"
              >
                Open intervention planner <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <p className="mt-2 text-[12px] text-navy-500">
              Composite risk score <b>{sel.score}/100</b> — driven by open precursors, report frequency and LSR
              violation density in {sel.zone}.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function TrendChart() {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <Activity className="h-4 w-4 text-gold-600" /> Detection Trend — Reports vs Precursors
        </h2>
        <span className="text-[11px] font-medium text-navy-300">Last 10 months</span>
      </div>
      <div className="h-72 p-4 pr-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={TREND_SERIES} margin={{ top: 10, right: 4, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="gReports" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#223a63" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#223a63" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gPrec" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#efa93b" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#efa93b" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#dce4f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#7c94b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#7c94b8' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 4,
                border: '1px solid #dce4f0',
                fontSize: 12,
                boxShadow: '0 10px 30px rgba(6,13,26,0.16)',
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="reports" name="Reports" stroke="#223a63" strokeWidth={2} fill="url(#gReports)" />
            <Area type="monotone" dataKey="precursors" name="SIF Precursors" stroke="#efa93b" strokeWidth={2} fill="url(#gPrec)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function LiveAlerts() {
  const [feed, setFeed] = useState<SifAlert[]>(ALERT_SEED)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    let i = 0
    const t = setInterval(() => {
      const base = ALERT_STREAM_EXTRA[i % ALERT_STREAM_EXTRA.length]
      i += 1
      setFeed((prev) =>
        [{ ...base, id: `AL-L${i}-${Date.now() % 997}`, time: 'just now' }, ...prev].slice(0, 8)
      )
    }, 9000)
    return () => clearInterval(t)
  }, [paused])

  return (
    <div className="card flex flex-col">
      <div className="card-header">
        <h2 className="card-title">
          <BellRing className="h-4 w-4 text-gold-600" /> Live SIF Alerts
          <span className="badge border-red-200 bg-red-50 text-red-600">AI-FLAGGED</span>
        </h2>
        <button
          className="text-[11px] font-semibold uppercase tracking-wide text-navy-400 hover:text-navy-700"
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? 'Resume feed' : 'Pause feed'}
        </button>
      </div>
      <div className="max-h-[430px] flex-1 divide-y divide-navy-50 overflow-y-auto">
        {feed.map((a) => (
          <div key={a.id} className="animate-feed-in flex items-start gap-3 px-5 py-3.5">
            <span
              className={cn(
                'mt-0.5 h-2 w-2 shrink-0 rounded-full',
                a.severity === 'Critical' ? 'animate-pulse bg-red-500' : RISK_STYLES[a.severity].dot
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold leading-snug text-navy-900">{a.precursor}</span>
                <RiskBadge level={a.severity} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-navy-400">
                <span className="font-medium text-navy-500">{a.site}</span>
                <span>·</span>
                <span>{a.rule}</span>
                <span>·</span>
                <span className="tnum">conf {a.confidence}%</span>
                <span>·</span>
                <span>{a.time}</span>
              </div>
            </div>
            <button
              className="btn-secondary mt-0.5 !px-2 !py-1 text-[11px] font-semibold"
              title="Acknowledge alert"
              onClick={() => setFeed((prev) => prev.filter((x) => x.id !== a.id))}
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {feed.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-navy-300">All alerts acknowledged.</div>
        )}
      </div>
      <div className="border-t border-navy-100 px-5 py-3">
        <Link to="/lsr-mapping" className="inline-flex items-center gap-1 text-[12px] font-semibold text-navy-700 hover:text-gold-700">
          View full precursor registry <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <div className="animate-fade-up space-y-6">
      <SectionTitle
        icon={<ShieldAlert className="h-4.5 w-4.5" />}
        title="Safety Command Dashboard"
        sub="AI-detected Serious Injury & Fatality precursors across all industrial sites"
        right={
          <div className="flex items-center gap-2 text-[11px] font-medium text-navy-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            NLP pipeline online · updated 2 min ago
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((m) => (
          <MetricCard key={m.label} metric={m} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <RiskHeatmap />
        </div>
        <div className="xl:col-span-2">
          <LiveAlerts />
        </div>
      </div>

      <TrendChart />
    </div>
  )
}
