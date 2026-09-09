import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { BarChart3, Crosshair, FileUp, LayoutDashboard, Scale, ShieldCheck, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { LSR_ROWS } from '../data/mockData'

const NAV_MAIN = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/upload', label: 'Upload Reports', icon: FileUp },
]

const NAV_ANALYTICS = [
  { to: '/lsr-mapping', label: 'LSR Mapping', icon: Scale },
  { to: '/risk', label: 'Risk Prioritization', icon: Crosshair },
  { to: '/insights', label: 'Site Insights', icon: BarChart3 },
]

function NavItem({
  to,
  label,
  icon: Icon,
  end,
  badge,
  onClose,
}: {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  badge?: number
  onClose: () => void
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClose}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium transition-all duration-150 hover:translate-x-0.5',
          isActive ? 'bg-navy-800 text-white shadow-rest' : 'text-navy-200 hover:bg-white/5 hover:text-white'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="animate-fade-up absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-gold-500" aria-hidden />
          )}
          <Icon
            className={cn(
              'h-[18px] w-[18px] shrink-0 transition-transform duration-150 group-hover:scale-110',
              isActive ? 'text-gold-500' : 'text-navy-300 group-hover:text-white'
            )}
          />
          <span className="flex-1">{label}</span>
          {typeof badge === 'number' && badge > 0 && (
            <span
              className="tnum rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-bold text-gold-400 ring-1 ring-inset ring-gold-500/25"
              aria-label={`${badge} items need manual review`}
            >
              {badge}
            </span>
          )}
          {isActive && <span className="sr-only">(current page)</span>}
        </>
      )}
    </NavLink>
  )
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Escape closes the mobile drawer
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const reviewCount = LSR_ROWS.filter((r) => r.status === 'Manual Review').length

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-30 bg-navy-950/60 backdrop-blur-sm transition-opacity duration-200 lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden
      />
      <aside
        aria-label="Primary navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy-950 text-white transition-transform duration-200 ease-out lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-[17px]">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] bg-gold-500 text-navy-950 shadow-rest transition-transform duration-200 hover:rotate-3 hover:scale-105">
              <ShieldCheck className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <div>
              <div className="text-[15px] font-bold leading-none tracking-tight">SIFGuard</div>
              <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-navy-300">
                AI Safety Analytics
              </div>
            </div>
          </div>
          <button
            className="rounded-[var(--radius-control)] p-1.5 text-navy-300 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          <div>
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-navy-400/80">
              Monitor
            </div>
            <div className="space-y-1">
              {NAV_MAIN.map((n) => (
                <NavItem key={n.to} {...n} onClose={onClose} />
              ))}
            </div>
          </div>
          <div>
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-navy-400/80">
              Analyze
            </div>
            <div className="space-y-1">
              {NAV_ANALYTICS.map((n) => (
                <NavItem
                  key={n.to}
                  {...n}
                  badge={n.to === '/lsr-mapping' ? reviewCount : undefined}
                  onClose={onClose}
                />
              ))}
            </div>
          </div>
        </nav>

        {/* Footer status card */}
        <div className="border-t border-white/10 p-4">
          <div className="rounded-[var(--radius-card)] bg-navy-900 p-3.5 ring-1 ring-white/5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Pipeline healthy
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-navy-200">
              NLP model trained <span className="font-semibold text-white">14 Aug 2026</span> · 9 Life-Saving Rules in
              catalog
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
