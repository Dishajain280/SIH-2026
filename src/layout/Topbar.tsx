import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Bell, ChevronDown, Menu, Search, ShieldAlert } from 'lucide-react'
import { cn } from '../lib/utils'
import { ALERT_SEED, SITES } from '../data/mockData'
import type { SifAlert } from '../types'
import { RiskBadge } from '../components/ui'

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const [alerts, setAlerts] = useState<SifAlert[]>(ALERT_SEED)
  const [bellOpen, setBellOpen] = useState(false)
  const [query, setQuery] = useState('')
  const bellRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const criticalCount = alerts.filter((a) => a.severity === 'Critical' || a.severity === 'High').length

  // Simulated live feed: a new high-risk precursor arrives every ~14s.
  useEffect(() => {
    const extra: Omit<SifAlert, 'id' | 'time'>[] = [
      { siteId: 'VSKP-02', site: 'Visakhapatnam Port Terminal', precursor: 'Snap-back zone crossed during mooring tension', rule: 'Barricade Line-of-Fire Exclusion Zones', ruleId: 'LSR-02', severity: 'Critical', confidence: 92 },
      { siteId: 'JAM-03', site: 'Jamnagar Refinery Block 7', precursor: 'Scaffold tag missing on tier-3 access bay', rule: 'Work at Height — 100% Tie-Off', ruleId: 'LSR-01', severity: 'High', confidence: 81 },
      { siteId: 'PNE-06', site: 'Pune Auto Components', precursor: 'Light curtain muted during robot teach mode', rule: 'Machine Guarding — Guards In Place Before Start', ruleId: 'LSR-09', severity: 'High', confidence: 86 },
    ]
    let i = 0
    const t = setInterval(() => {
      const base = extra[i % extra.length]
      i += 1
      setAlerts((prev) => [{ ...base, id: `AL-${3400 + i}`, time: 'just now' }, ...prev].slice(0, 12))
    }, 14000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    return SITES.filter((s) => `${s.name} ${s.id} ${s.city} ${s.region}`.toLowerCase().includes(q)).slice(0, 5)
  }, [query])

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-navy-100 bg-white/95 px-4 backdrop-blur md:px-6">
      <button
        className="rounded-sm p-2 text-navy-600 hover:bg-navy-50 lg:hidden"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Global search */}
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sites, reports, precursors…"
          className="input pl-9"
          aria-label="Global search"
        />
        {results.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-md border border-navy-100 bg-white shadow-pop">
            {results.map((s) => (
              <button
                key={s.id}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-navy-50"
                onClick={() => {
                  navigate('/insights', { state: { siteId: s.id } })
                  setQuery('')
                }}
              >
                <span className="truncate text-sm text-navy-800">{s.name}</span>
                <span className="shrink-0 font-mono text-[11px] text-navy-300">{s.id}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2 md:gap-4">
        {/* Live critical counter */}
        <div className="hidden items-center gap-2 rounded-sm border border-red-200 bg-red-50 px-3 py-1.5 md:flex">
          <ShieldAlert className="h-4 w-4 text-red-600" />
          <span className="tnum text-[13px] font-bold text-red-700">{criticalCount}</span>
          <span className="text-[12px] font-medium text-red-600">active high-risk</span>
        </div>

        {/* Notifications */}
        <div className="relative" ref={bellRef}>
          <button
            className={cn(
              'relative rounded-sm p-2 text-navy-600 transition-colors hover:bg-navy-50',
              bellOpen && 'bg-navy-50'
            )}
            onClick={() => setBellOpen((v) => !v)}
            aria-label="High-risk precursor alerts"
          >
            <Bell className="h-5 w-5" />
            {criticalCount > 0 && (
              <span className="animate-pulse-ring absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-navy-950 tnum">
                {criticalCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-full z-30 mt-2 w-[360px] overflow-hidden rounded-md border border-navy-100 bg-white shadow-pop sm:w-[400px]">
              <div className="flex items-center justify-between border-b border-navy-100 px-4 py-3">
                <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-navy-800">
                  <AlertTriangle className="h-4 w-4 text-gold-600" /> High-Risk Precursor Alerts
                </div>
                <button
                  className="text-[11px] font-semibold uppercase text-navy-400 hover:text-navy-700"
                  onClick={() => setAlerts([])}
                >
                  Clear all
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {alerts.length === 0 && (
                  <div className="px-4 py-10 text-center text-sm text-navy-300">No active alerts. All clear.</div>
                )}
                {alerts.map((a) => (
                  <button
                    key={a.id}
                    className="flex w-full gap-3 border-b border-navy-50 px-4 py-3 text-left last:border-0 hover:bg-navy-50"
                    onClick={() => {
                      setBellOpen(false)
                      navigate('/risk', { state: { siteId: a.siteId } })
                    }}
                  >
                    <RiskBadge level={a.severity} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-navy-900">{a.precursor}</span>
                      <span className="mt-0.5 block text-[12px] text-navy-400">
                        {a.site} · {a.rule} · conf {a.confidence}% · {a.time}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 border-l border-navy-100 pl-2 md:pl-4">
          <div className="hidden text-right leading-tight md:block">
            <div className="text-[13px] font-semibold text-navy-900">Ar. Meera Iyer</div>
            <div className="text-[11px] text-navy-400">HSE Analytics Lead</div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-[12px] font-bold text-gold-500 ring-2 ring-gold-500/30">
            MI
          </div>
          <ChevronDown className="hidden h-4 w-4 text-navy-300 md:block" />
        </div>
      </div>
    </header>
  )
}


