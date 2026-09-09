import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '../lib/utils'

/** Tiny inline SVG sparkline with optional end dot. */
export function Sparkline({
  data,
  stroke = '#0a1526',
  fill = 'rgba(10,21,38,0.07)',
  w = 120,
  h = 36,
  className,
}: {
  data: number[]
  stroke?: string
  fill?: string
  w?: number
  h?: number
  className?: string
}) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 3
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - pad * 2) + pad
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${(w - pad).toFixed(1)},${h} L${pad},${h} Z`
  const [ex, ey] = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn('h-9 w-[120px]', className)} preserveAspectRatio="none" aria-hidden>
      <path d={area} fill={fill} />
      <path d={line} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={ex} cy={ey} r={2.6} fill={stroke} />
    </svg>
  )
}

/** Signed delta chip with up/down arrow, green for good, amber/red for bad. */
export function TrendChip({ delta, invertGood = false }: { delta: number; invertGood?: boolean }) {
  const up = delta >= 0
  const good = invertGood ? !up : up
  return (
    <span
      className={cn(
        'badge tnum',
        good ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'
      )}
      title={good ? 'Trending in the right direction' : 'Trending in the wrong direction'}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? '+' : ''}
      {delta}%
    </span>
  )
}
