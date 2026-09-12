import { useMemo, useState } from 'react'
import { MapPin, TrendingUp } from 'lucide-react'
import { INDIA_OUTLINE, SITE_GEO } from '../data/mockData'
import { cn, RISK_STYLES } from '../lib/utils'
import { RiskBadge } from './ui'

// --- projection: equirectangular, longitude scaled by cos(22°N) -------------
const LON_MIN = 68
const LAT_MAX = 37
const VB_W = 300
const VB_H = 320
const SCALE = VB_H / 29
const LON_COS = 0.927

function project(lon: number, lat: number): { x: number; y: number } {
  const xSpan = (97.5 - LON_MIN) * LON_COS * SCALE
  const padX = (VB_W - xSpan) / 2
  return {
    x: (lon - LON_MIN) * LON_COS * SCALE + padX,
    y: (LAT_MAX - lat) * SCALE,
  }
}

const REGION_LABELS: { name: string; lon: number; lat: number; anchor?: string }[] = [
  { name: 'NORTH', lon: 76.5, lat: 29.6 },
  { name: 'WEST', lon: 71.5, lat: 21.0 },
  { name: 'EAST', lon: 87.5, lat: 24.5 },
  { name: 'SOUTH', lon: 78.6, lat: 12.6 },
  { name: 'NORTHEAST', lon: 93.2, lat: 26.6 },
]

export function IndiaMap({
  selected,
  onSelect,
}: {
  selected: string | null
  onSelect: (id: string | null) => void
}) {
  const [hover, setHover] = useState<string | null>(null)

  const path = useMemo(() => {
    const pts = INDIA_OUTLINE.map(([lon, lat]) => project(lon, lat))
    return `${pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} Z`
  }, [])

  const pins = useMemo(
    () =>
      SITE_GEO.map((g) => ({ geo: g, ...project(g.lon, g.lat) })).sort((a, b) => b.geo.score - a.geo.score),
    []
  )

  const sel = SITE_GEO.find((g) => g.id === selected)

  return (
    <div>
      <div className="px-5 pb-2 pt-1">
        <div
          className="relative mx-auto w-full max-w-[420px]"
          style={{ aspectRatio: `${VB_W} / ${VB_H}` }}
        >
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label={`Map of India showing ${SITE_GEO.length} monitored industrial sites`}
          >
            <defs>
              <linearGradient id="landFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#eef2f8" />
                <stop offset="100%" stopColor="#dce4f0" />
              </linearGradient>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M20 0H0V20" fill="none" stroke="#dce4f0" strokeWidth="0.5" opacity="0.55" />
              </pattern>
            </defs>

            <rect width={VB_W} height={VB_H} fill="url(#grid)" />
            <path d={path} fill="url(#landFill)" stroke="#7c94b8" strokeWidth="1.1" strokeLinejoin="round" />

            {REGION_LABELS.map((r) => {
              const p = project(r.lon, r.lat)
              return (
                <text
                  key={r.name}
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  className="fill-navy-300"
                  style={{ fontSize: 6.5, fontWeight: 700, letterSpacing: '0.14em' }}
                >
                  {r.name}
                </text>
              )
            })}
          </svg>

          {/* Pins are real buttons layered over the SVG for keyboard + screen-reader support. */}
          {pins.map(({ geo, x, y }) => {
            const isSel = selected === geo.id
            const isHot = hover === geo.id
            const color = RISK_STYLES[geo.level].hex
            const r = 5 + (geo.score / 100) * 4
            return (
              <button
                key={geo.id}
                onClick={() => onSelect(isSel ? null : geo.id)}
                onMouseEnter={() => setHover(geo.id)}
                onMouseLeave={() => setHover((h) => (h === geo.id ? null : h))}
                onFocus={() => setHover(geo.id)}
                onBlur={() => setHover((h) => (h === geo.id ? null : h))}
                aria-pressed={isSel}
                aria-label={`${geo.name}, ${geo.city} — risk ${geo.score} of 100, ${geo.level}, LSR compliance ${geo.compliance}%`}
                className="group absolute -translate-x-1/2 -translate-y-1/2 focus-visible:outline-none"
                style={{ left: `${(x / VB_W) * 100}%`, top: `${(y / VB_H) * 100}%` }}
              >
                <span
                  className={cn(
                    'block rounded-full ring-2 ring-white transition-transform duration-150 group-hover:scale-125 group-focus-visible:scale-125',
                    geo.level === 'Critical' && 'animate-pulse'
                  )}
                  style={{
                    width: r * 2,
                    height: r * 2,
                    backgroundColor: color,
                    boxShadow: isSel || isHot ? `0 0 0 3px ${color}44` : undefined,
                  }}
                />
                {(isSel || isHot) && (
                  <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-max max-w-[190px] -translate-x-1/2 rounded-[var(--radius-control)] border border-navy-100 bg-white px-2.5 py-1.5 text-left shadow-pop">
                    <span className="block text-[11.5px] font-bold leading-tight text-navy-900">{geo.name}</span>
                    <span className="mt-0.5 block text-[10.5px] text-navy-400">
                      {geo.city} · risk {geo.score} · compliance {geo.compliance}%
                    </span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selection detail */}
      {sel ? (
        <div className="animate-fade-up mx-5 mb-5 mt-1 rounded-[var(--radius-control)] border border-navy-100 bg-navy-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-semibold text-navy-400">{sel.id}</span>
            <span className="text-sm font-bold text-navy-900">{sel.name}</span>
            <RiskBadge level={sel.level} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div>
              <div className="tnum text-lg font-bold text-navy-900">{sel.score}</div>
              <div className="text-[10.5px] text-navy-400">Risk score</div>
            </div>
            <div>
              <div className="tnum text-lg font-bold text-navy-900">{sel.compliance}%</div>
              <div className="text-[10.5px] text-navy-400">LSR compliance</div>
            </div>
            <div>
              <div className="tnum text-lg font-bold text-navy-900">{sel.mapped}/{sel.total}</div>
              <div className="text-[10.5px] text-navy-400">Incidents mapped</div>
            </div>
          </div>
          <p className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-navy-500">
            <TrendingUp className="h-3.5 w-3.5 text-gold-600" />
            {sel.city} · {sel.region} region — composite score driven by open precursors and LSR violation density.
          </p>
        </div>
      ) : (
        <div className="mx-5 mb-5 mt-1 flex items-center gap-2 rounded-[var(--radius-control)] border border-dashed border-navy-200 px-4 py-3 text-[12px] text-navy-400">
          <MapPin className="h-3.5 w-3.5 text-gold-600" />
          Select a site pin for its risk and compliance breakdown.
        </div>
      )}
    </div>
  )
}
