import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BellRing,
  Check,
  FileText,
  Gauge,
  Grid3x3,
  Map as MapIcon,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ALERT_SEED,
  ALERT_STREAM_EXTRA,
  buildSeries,
  fleetCompliance,
  HEAT_CELLS,
  METRICS,
  projectedHeadline,
  SITE_GEO,
} from '../data/mockData'
import type { Metric, SifAlert, TimeRange } from '../types'
import { cn, RISK_STYLES } from '../lib/utils'
import { Sparkline, TrendChip } from '../components/Sparkline'
import { AnimatedNumber, ChartTip, PageHeader, RiskBadge, UxHint } from '../components/ui'
import { IndiaMap } from '../components/IndiaMap'
import { TimeRangeControl } from '../components/TimeRangeControl'

const METRIC_ICONS = {
  file: FileText,
  shield: ShieldAlert,
  alert: ShieldAlert,
  map: MapIcon,
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
    <div className="card card-hover group relative overflow-hidden p-5">
      <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gold-500 transition-transform duration-300 group-hover:scale-x-100" aria-hidden />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-navy-400">
            <Icon className="h-3.5 w-3.5 text-gold-600 transition-transform duration-200 group-hover:scale-110" />
            {metric.label}
          </div>
          <div className="mt-2.5 flex items-baseline gap-2.5">
            <AnimatedNumber value={metric.value} className="text-[32px] font-bold leading-none tracking-[-0.02em] text-navy-900" />
            <TrendChip delta={metric.delta} invertGood={invertGood} />
          </div>
          <p className="mt-2.5 text-[12px] leading-relaxed text-navy-400">{metric.sublabel}</p>
        </div>
        <Sparkline data={METRIC_SPARK[metric.label] ?? []} stroke={METRIC_STROKE[metric.label]} />
      </div>
    </div>
  )
}

/** Geographic map or zone grid — the same risk picture, two ways to read it. */
function RiskPanel() {
  const [view, setView] = useState<'map' | 'grid'>('map')
  const [selected, setSelected] = useState<string | null>(null)
  const sel = SITE_GEO.find((g) => g.id === selected)
  const cell = HEAT_CELLS.find((c) => c.siteId === selected)

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          {view === 'map' ? <MapIcon className="h-4 w-4 text-gold-600" /> : <Grid3x3 className="h-4 w-4 text-gold-600" />}
          Site Risk {view === 'map' ? 'Map' : 'Heatmap'}
          <UxHint>
            {view === 'map'
              ? 'Pin colour shows priority; pin size scales with risk score. Select a pin for compliance detail.'
              : 'Click any site tile for its risk composition. Red = Critical, gold = High.'}
          </UxHint>
        </h2>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 text-[11px] font-medium text-navy-400 sm:flex">
            {(['Critical', 'High', 'Medium', 'Low'] as const).map((lv) => (
              <span key={lv} className="flex items-center gap-1.5">
                <span className={cn('h-2.5 w-2.5 rounded-sm', RISK_STYLES[lv].dot)} /> {lv}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-0.5 rounded-[var(--radius-control)] border border-navy-200 p-0.5" role="group" aria-label="Map view">
            <button
              onClick={() => setView('map')}
              aria-pressed={view === 'map'}
              className={cn(
                'rounded-[calc(var(--radius-control)-2px)] px-2 py-1 text-[11.5px] font-semibold transition-colors',
                view === 'map' ? 'bg-navy-900 text-white' : 'text-navy-500 hover:bg-navy-50'
              )}
              title="Geographic map"
            >
              Map
            </button>
            <button
              onClick={() => setView('grid')}
              aria-pressed={view === 'grid'}
              className={cn(
                'rounded-[calc(var(--radius-control)-2px)] px-2 py-1 text-[11.5px] font-semibold transition-colors',
                view === 'grid' ? 'bg-navy-900 text-white' : 'text-navy-500 hover:bg-navy-50'
              )}
              title="Zone grid"
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {view === 'map' ? (
        <IndiaMap selected={selected} onSelect={setSelected} />
      ) : (
        <div className="p-5">
          <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-4">
            {HEAT_CELLS.map((c) => (
              <button
                key={c.siteId}
                onClick={() => setSelected(c.siteId === selected ? null : c.siteId)}
                aria-pressed={c.siteId === selected}
                className={cn(
                  'group relative overflow-hidden rounded-[var(--radius-control)] border border-transparent p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift',
                  RISK_STYLES[c.level].cell,
                  c.siteId === selected && 'ring-2 ring-navy-900 ring-offset-2'
                )}
                title={`${c.site} — risk score ${c.score}`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] font-semibold opacity-70">{c.siteId}</span>
                  <span className="tnum text-xl font-bold leading-none">{c.score}</span>
                </div>
                <div className="mt-6 line-clamp-2 text-[12px] font-semibold leading-snug">{c.site}</div>
                <div className="mt-0.5 truncate text-[10.5px] opacity-70">{c.zone}</div>
                <span
                  className="absolute inset-x-0 bottom-0 h-1 origin-left bg-white/50 transition-transform duration-500"
                  style={{ transform: `scaleX(${c.score / 100})` }}
                  aria-hidden
                />
              </button>
            ))}
          </div>
          {cell && (
            <div className="animate-fade-up mt-4 rounded-[var(--radius-control)] border border-navy-100 bg-navy-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[11px] font-semibold text-navy-400">{cell.siteId}</span>
                  <span className="text-sm font-bold text-navy-900">{cell.site}</span>
                  <RiskBadge level={cell.level} />
                </div>
                <Link to="/risk" className="link-quiet inline-flex items-center gap-1 text-[12.5px]">
                  Open intervention planner <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-navy-500">
                Composite risk score <b>{cell.score}/100</b> — driven by open precursors, report frequency and LSR
                violation density in {cell.zone}.
              </p>
            </div>
          )}
        </div>
      )}

      {view === 'map' && sel && (
        <div className="flex items-center justify-end border-t border-navy-100 px-5 py-3">
          <Link to="/risk" state={{ siteId: sel.id }} className="link-quiet inline-flex items-center gap-1 text-[12.5px]">
            Open {sel.id} in intervention planner <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}

/** Reports vs precursors historically, with a dashed forecast and confidence band. */
function TrendChart({ range, onRangeChange }: { range: TimeRange; onRangeChange: (r: TimeRange) => void }) {
  const series = useMemo(() => buildSeries(range), [range])
  const headline = useMemo(() => projectedHeadline(series, range), [series, range])
  const chartData = useMemo(
    () =>
      series.map((p) => ({
        ...p,
        bandWidth:
          p.projUpper != null && p.projLower != null ? Math.max(0, p.projUpper - p.projLower) : null,
      })),
    [series]
  )

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <Activity className="h-4 w-4 text-gold-600" /> Detection Trend — Reports vs Precursors
        </h2>
        <TimeRangeControl value={range} onChange={onRangeChange} />
      </div>

      {headline && (
        <div className="flex flex-wrap items-center gap-2 border-b border-navy-100 bg-navy-50/60 px-5 py-2.5">
          <Sparkles className="h-3.5 w-3.5 text-gold-600" />
          <span className="text-[12.5px] text-navy-600">
            {headline.unit === 'month' ? (
              <>
                SIF precursors projected to reach <b className="tnum text-navy-900">{headline.value}</b> per month by{' '}
                <b className="text-navy-900">{headline.label}</b>
              </>
            ) : (
              <>
                Daily precursor detections projected to reach <b className="tnum text-navy-900">{headline.value}</b> per
                day by <b className="text-navy-900">{headline.label}</b>
              </>
            )}
          </span>
          <span className="badge border-gold-300 bg-gold-100 text-gold-700">80% confidence band</span>
          {range === 'all' && (
            <span className="text-[11px] text-navy-400">September is in progress and excluded from the fit</span>
          )}
        </div>
      )}

      <div className="h-72 p-4 pr-6">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 4, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="gReports" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#223a63" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#223a63" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gPrec" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#efa93b" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#efa93b" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="gBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#efa93b" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#efa93b" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#dce4f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10.5, fill: '#4a6a99' }}
              axisLine={false}
              tickLine={false}
              dy={4}
              interval="preserveStartEnd"
              minTickGap={26}
            />
            <YAxis tick={{ fontSize: 11, fill: '#4a6a99' }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTip />} cursor={{ stroke: '#b8c6dd', strokeDasharray: '4 4' }} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />

            {/* Confidence band: transparent base + stacked width, only where projection data exists. */}
            <Area dataKey="projLower" stackId="band" stroke="none" fill="transparent" name="Band base" legendType="none" isAnimationActive={false} />
            <Area dataKey="bandWidth" stackId="band" stroke="none" fill="url(#gBand)" name="Projection range" isAnimationActive={false} />

            <Area type="monotone" dataKey="reports" name="Reports" stroke="#223a63" strokeWidth={2} fill="url(#gReports)" activeDot={{ r: 4, strokeWidth: 2 }} />
            <Area type="monotone" dataKey="precursors" name="SIF Precursors" stroke="#efa93b" strokeWidth={2} fill="url(#gPrec)" activeDot={{ r: 4, strokeWidth: 2 }} />
            <Line
              type="monotone"
              dataKey="projected"
              name="Projected precursors"
              stroke="#a4660f"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const DASHBOARD_STORAGE_KEY = 'sifguard.dashboard.feed.v1'

function loadFeed(): SifAlert[] {
  try {
    const raw = localStorage.getItem(DASHBOARD_STORAGE_KEY)
    if (!raw) return ALERT_SEED
    const parsed = JSON.parse(raw) as SifAlert[]
    if (!Array.isArray(parsed) || parsed.length === 0) return ALERT_SEED
    return parsed
  } catch {
    return ALERT_SEED
  }
}

function saveFeed(feed: SifAlert[]): void {
  try {
    localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(feed.slice(0, 24)))
  } catch {
    // no-op
  }
}

function LiveAlerts() {
  const [feed, setFeed] = useState<SifAlert[]>(loadFeed)
  const [paused, setPaused] = useState(false)
  const [timer, setTimer] = useState<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const onVis = () => setPaused(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  useEffect(() => {
    if (paused) {
      if (timer) {
        clearInterval(timer)
        setTimer(null)
      }
      return
    }
    let i = 0
    const t = setInterval(() => {
      const base = ALERT_STREAM_EXTRA[i % ALERT_STREAM_EXTRA.length]
      i += 1
      setFeed((prev) => {
        const next = [{ ...base, id: `AL-D${i}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, time: 'just now' }, ...prev].slice(0, 8)
        saveFeed(next)
        return next
      })
    }, 9000)
    setTimer(t)
    return () => clearInterval(t)
  }, [paused])

  return (
    <div className="card flex flex-col">
      <div className="card-header">
        <h2 className="card-title">
          <BellRing className="h-4 w-4 text-gold-600" /> Live SIF Alerts
          <span className="badge border-red-200 bg-red-50 text-red-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> AI-FLAGGED
          </span>
        </h2>
        <button className="link-quiet text-[11px] uppercase tracking-wide" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
          {paused ? 'Resume feed' : 'Pause feed'}
        </button>
      </div>
      <div className="max-h-[430px] flex-1 divide-y divide-navy-50 overflow-y-auto" aria-live="polite">
        {feed.map((a) => (
          <div key={a.id} className="animate-feed-in group flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-navy-50/60">
            <span
              className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', a.severity === 'Critical' ? 'animate-pulse bg-red-500' : RISK_STYLES[a.severity].dot)}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold leading-snug text-navy-900">{a.precursor}</span>
                <RiskBadge level={a.severity} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-navy-400">
                <span className="font-medium text-navy-500">{a.site}</span>
                <span aria-hidden>·</span>
                <span>{a.rule}</span>
                <span aria-hidden>·</span>
                <span className="tnum">conf {a.confidence}%</span>
                <span aria-hidden>·</span>
                <span>{a.time}</span>
              </div>
            </div>
            <button
              className="btn-secondary mt-0.5 !rounded-full !px-2 !py-1 text-[11px] font-semibold opacity-0 transition-opacity duration-150 focus-visible:opacity-100 group-hover:opacity-100"
              title="Acknowledge alert"
              aria-label={`Acknowledge alert: ${a.precursor}`}
              onClick={() => {
                setFeed((prev) => {
                  const next = prev.filter((x) => x.id !== a.id)
                  saveFeed(next)
                  return next
                })
              }}
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {feed.length === 0 && <div className="px-5 py-12 text-center text-sm text-navy-300">All alerts acknowledged.</div>}
      </div>
      <div className="border-t border-navy-100 px-5 py-3">
        <Link to="/lsr-mapping" className="link-quiet inline-flex items-center gap-1 text-[12.5px]">
          View full precursor registry <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [range, setRange] = useState<TimeRange>('30d')
  const compliance = useMemo(() => fleetCompliance(), [])

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        icon={<ShieldAlert className="h-5 w-5" />}
        eyebrow="Command Center"
        title="Safety Command Dashboard"
        sub="AI-detected Serious Injury & Fatality precursors across all industrial sites"
        right={
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="flex items-center gap-2 rounded-full border border-navy-200 bg-white px-3.5 py-1.5 text-[12px] font-medium text-navy-700"
              title="Share of incidents across all sites with a clear Life-Saving Rule mapping"
            >
              <Gauge className="h-3.5 w-3.5 text-gold-600" />
              LSR compliance <b className="tnum text-navy-900">{compliance}%</b>
            </span>
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-[12px] font-medium text-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              NLP pipeline online · updated 2 min ago
            </div>
          </div>
        }
      />

      <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((m) => (
          <MetricCard key={m.label} metric={m} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <RiskPanel />
        </div>
        <div className="xl:col-span-2">
          <LiveAlerts />
        </div>
      </div>

      <TrendChart range={range} onRangeChange={setRange} />
    </div>
  )
}
