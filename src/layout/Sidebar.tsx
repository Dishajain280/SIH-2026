import { NavLink } from 'react-router-dom'
import { BarChart3, Crosshair, FileUp, LayoutDashboard, Scale, ShieldCheck, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { LSR_ROWS } from '../data/mockData'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/upload', label: 'Upload Reports', icon: FileUp },
  { to: '/lsr-mapping', label: 'LSR Mapping', icon: Scale },
  { to: '/risk', label: 'Risk Prioritization', icon: Crosshair },
  { to: '/insights', label: 'Site Insights', icon: BarChart3 },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-navy-950/50 transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy-950 text-white transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-[18px]">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-gold-500 text-navy-950">
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
            className="rounded-sm p-1 text-navy-300 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-400">
            Command Center
          </div>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-navy-800 text-white'
                    : 'text-navy-200 hover:bg-white/5 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'absolute inset-y-1 left-0 w-[3px] rounded-full bg-gold-500 transition-opacity',
                      isActive ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <Icon className={cn('h-[18px] w-[18px]', isActive ? 'text-gold-500' : 'text-navy-300 group-hover:text-white')} />
                  {label}
                  {label === 'LSR Mapping' && LSR_ROWS.some((r) => r.status === 'Manual Review') && (
                    <span className="ml-auto rounded-sm bg-gold-500/15 px-1.5 py-0.5 text-[10px] font-bold text-gold-400 tnum">
                      {LSR_ROWS.filter((r) => r.status === 'Manual Review').length}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer card */}
        <div className="border-t border-white/10 p-4">
          <div className="rounded-sm bg-navy-900 p-3.5 ring-1 ring-white/5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-500">
              <Crosshair className="h-3.5 w-3.5" /> SIH 2026 · Build 0.9.2
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-navy-200">
              NLP pipeline last trained on <span className="font-semibold text-white">14 Aug 2026</span>. 9 Life-Saving
              Rules in catalog.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
