import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Bell, ChevronDown, Command, Menu, Search, ShieldAlert } from 'lucide-react'
import { cn } from '../lib/utils'
import { ALERT_SEED, SITES } from '../data/mockData'
import type { SifAlert } from '../types'
import { RiskBadge } from '../components/ui'

const STORAGE_KEY = 'sifguard.topbar.alerts.v1'

function loadAlerts(): SifAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return ALERT_SEED
    const parsed = JSON.parse(raw) as SifAlert[]
    if (!Array.isArray(parsed) || parsed.length === 0) return ALERT_SEED
    return parsed
  } catch {
    return ALERT_SEED
  }
}

function saveAlerts(alerts: SifAlert[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts.slice(0, 50)))
  } catch {
    // localStorage full or blocked — no-op, app still works
  }
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const [alerts, setAlerts] = useState<SifAlert[]>(loadAlerts)
  const [bellOpen, setBellOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [flash, setFlash] = useState(0)
  const bellRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const criticalCount = alerts.filter((a) => a.severity === 'Critical' || a.severity === 'High').length

  // Simulated live feed — flash the counter when a new alert arrives.
  useEffect(() => {
    const extra: Omit<SifAlert, 'id' | 'time'>[] = [
      { siteId: 'VSKP-02', site: 'Visakhapatnam Port Terminal', precursor: 'Snap-back zone crossed during mooring tension', rule: 'Barricade Line-of-Fire Exclusion Zones', ruleId: 'LSR-02', severity: 'Critical', confidence: 92 },
      { siteId: 'JAM-03', site: 'Jamnagar Refinery Block 7', precursor: 'Scaffold tag missing on tier-3 access bay', rule: 'Work at Height — 100% Tie-Off', ruleId: 'LSR-01', severity: 'High', confidence: 81 },
      { siteId: 'PNE-06', site: 'Pune Auto Components', precursor: 'Light curtain muted during robot teach mode', rule: 'Machine Guarding — Guards In Place Before Start', ruleId: 'LSR-09', severity: 'High', confidence: 86 },
    ]
    let i = 0
    let timer: ReturnType<typeof setInterval> | null = null

    const start = () => {
      if (timer) return
      timer = setInterval(() => {
        const base = extra[i % extra.length]
        i += 1
        setAlerts((prev) => {
          const next = [{ ...base, id: `AL-T${i}-${Date.now()}`, time: 'just now' }, ...prev]
            .slice(0, 12)
          saveAlerts(next)
          return next
        })
        setFlash((f) => f + 1)
      }, 14000)
    }

    const stop = () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    // Pause while the tab is hidden — prevents a burst of queued alerts on return.
    const onVis = () => {
      if (document.visibilityState === 'hidden') stop()
      else start()
    }
    document.addEventListener('visibilitychange', onVis)
    start()

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  // Flash animation re-trigger
  const [flashKey, setFlashKey] = useState(0)
  useEffect(() => {
    if (flash > 0) setFlashKey((k) => k + 1)
  }, [flash])

  // Close bell on outside click / Escape
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setBellOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  // Ctrl/Cmd+K focuses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    return SITES.filter((s) => `${s.name} ${s.id} ${s.city} ${s.region}`.toLowerCase().includes(q)).slice(0, 5)
  }, [query])

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-navy-100 bg-white/90 px-4 shadow-rest backdrop-blur-md md:px-6">
      <button
        className="rounded-[var(--radius-control)] p-2 text-navy-600 transition-colors hover:bg-navy-50 lg:hidden"
        onClick={onMenu}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Global search */}
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
          placeholder="Search sites, reports, precursors…"
          className="input pl-9 pr-14"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-label="Global search"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5" aria-hidden>
          <kbd className="kbd"><Command className="h-2.5 w-2.5" /></kbd>
          <kbd className="kbd">K</kbd>
        </span>
        {results.length > 0 && (
          <ul
            role="listbox"
            className="animate-pop-in absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-[var(--radius-card)] border border-navy-100 bg-white shadow-pop"
          >
            {results.map((s) => (
              <li key={s.id} role="option" aria-selected={false}>
                <button
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-navy-50"
                  onClick={() => {
                    navigate('/insights', { state: { siteId: s.id } })
                    setQuery('')
                  }}
                >
                  <span className="truncate text-sm text-navy-800">{s.name}</span>
                  <span className="shrink-0 font-mono text-[11px] text-navy-300">{s.id}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2 md:gap-4">
        {/* Live critical counter */}
        <div className="hidden items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 md:flex" aria-live="polite">
          <ShieldAlert className="h-4 w-4 text-red-600" />
          <span key={flashKey} className="tnum animate-fade-up text-[13px] font-bold text-red-700">
            {criticalCount}
          </span>
          <span className="text-[12px] font-medium text-red-600">active high-risk</span>
        </div>

        {/* Notifications */}
        <div className="relative" ref={bellRef}>
          <button
            className={cn(
              'relative rounded-[var(--radius-control)] p-2 text-navy-600 transition-all hover:bg-navy-50 hover:text-navy-900',
              bellOpen && 'bg-navy-50 text-navy-900'
            )}
            onClick={() => setBellOpen((v) => !v)}
            aria-label={`High-risk precursor alerts (${criticalCount})`}
            aria-expanded={bellOpen}
          >
            <Bell className="h-5 w-5" />
            {criticalCount > 0 && (
              <span
                key={flashKey}
                className="animate-pulse-ring absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-navy-950 tnum"
              >
                {criticalCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div
              className="animate-pop-in absolute right-0 top-full z-30 mt-2 w-[360px] overflow-hidden rounded-[var(--radius-card)] border border-navy-100 bg-white shadow-pop sm:w-[400px]"
              role="dialog"
              aria-label="High-risk precursor alerts"
            >
              <div className="flex items-center justify-between border-b border-navy-100 px-4 py-3">
                <div className="flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-wide text-navy-800">
                  <AlertTriangle className="h-4 w-4 text-gold-600" /> High-Risk Alerts
                </div>
                <button
                  className="link-quiet text-[11px] uppercase tracking-wide"
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
                    className="flex w-full gap-3 border-b border-navy-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-navy-50"
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
        <div
          className="group flex items-center gap-3 rounded-[var(--radius-control)] border-l border-navy-100 py-1 pl-2 pr-1 transition-colors hover:bg-navy-50 md:pl-4"
          aria-label="Account: Ar. Meera Iyer, HSE Analytics Lead"
          role="status"
        >
          <span className="hidden text-right leading-tight md:block">
            <span className="block text-[13px] font-semibold text-navy-900">Ar. Meera Iyer</span>
            <span className="block text-[11px] text-navy-400">HSE Analytics Lead</span>
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-[12px] font-bold text-gold-500 ring-2 ring-transparent transition-all group-hover:ring-gold-500/40">
            MI
          </span>
          <ChevronDown className="hidden h-4 w-4 text-navy-300 transition-transform duration-150 group-hover:translate-y-0.5 md:block" aria-hidden />
        </div>
      </div>
    </header>
  )
}
