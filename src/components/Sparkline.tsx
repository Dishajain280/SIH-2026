import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '../lib/utils'

/** Tiny inline SVG sparkline with draw-in line and end dot. */
export function Sparkline({
  data,
  stroke = '#0a1526',
  fill = 'rgba(10,21,38,0.06)',
  w = 120,
  h = 36,
  label,
  className,
}: {
  data: number[]
  stroke?: string
  fill?: string
  w?: number
  h?: number
  label?: string
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
  const desc =
    label ?? `Trend sparkline from ${data[0]} to ${data[data.length - 1]}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn('h-9 w-[120px] shrink-0', className)} preserveAspectRatio="none" role="img" aria-label={desc}>
      <path d={area} fill={fill} />
      <path className="spark-draw" d={line} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={ex} cy={ey} r={2.6} fill={stroke} />
    </svg>
  )
}

/** Signed delta chip with up/down arrow; green when the direction is good. */
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
      <span className="sr-only">{good ? ' (improving)' : ' (worsening)'}</span>
    </span>
  )
}
