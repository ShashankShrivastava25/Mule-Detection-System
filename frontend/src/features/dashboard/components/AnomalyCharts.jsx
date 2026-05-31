import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { riskTier, styleForTier } from '../lib/risk.js'
import useChartTheme from '../../../shared/hooks/useChartTheme.js'

const TIERS = ['safe', 'watch', 'suspicious', 'critical']

function tierCounts(results) {
  const counts = { safe: 0, watch: 0, suspicious: 0, critical: 0 }
  for (const r of results) counts[riskTier(r['Risk Score'])]++
  return TIERS.map((t) => ({
    name: styleForTier(t).label,
    value: counts[t],
    color: styleForTier(t).color,
  }))
}

function distributionBuckets(results) {
  const buckets = Array.from({ length: 10 }, (_, i) => ({ name: `${i * 10}`, value: 0, color: '#6366f1' }))
  for (const r of results) {
    const idx = Math.min(9, Math.floor(r['Risk Score'] / 10))
    buckets[idx].value++
  }
  const ramp = ['#22c55e', '#22c55e', '#f59e0b', '#f59e0b', '#f59e0b', '#f97316', '#f97316', '#ef4444', '#ef4444', '#ef4444']
  buckets.forEach((b, i) => (b.color = ramp[i]))
  return buckets
}

function rollingSeries(results) {
  const sorted = [...results].sort((a, b) => a.Account - b.Account)
  const out = []
  const window = Math.max(20, Math.round(results.length / 30))
  for (let i = 0; i < sorted.length; i += window) {
    const slice = sorted.slice(i, i + window)
    const avg = slice.reduce((s, r) => s + r['Risk Score'], 0) / slice.length
    out.push({ x: i + slice.length, avg: +avg.toFixed(1) })
  }
  return out
}

export default function AnomalyCharts({ results = [] }) {
  const ct = useChartTheme()
  const pie = tierCounts(results)
  const bars = distributionBuckets(results)
  const line = rollingSeries(results)
  const total = pie.reduce((s, p) => s + p.value, 0)

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <ChartCard title="Risk Tier Composition" subtitle="Donut — share by category">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={pie} dataKey="value" innerRadius={58} outerRadius={86} paddingAngle={3} stroke={ct.stroke} strokeWidth={2}>
              {pie.map((p, i) => <Cell key={i} fill={p.color} />)}
            </Pie>
            <Tooltip contentStyle={ct.tooltip} itemStyle={{ color: ct.tooltip.color }} />
            <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11, color: ct.axisLabel, paddingTop: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        {total > 0 && (
          <p className="text-center -mt-[150px] mb-[130px] pointer-events-none">
            <span className="block num font-display font-extrabold text-2xl text-content-hi">{total.toLocaleString()}</span>
            <span className="block text-[11px] text-content-md">Total</span>
          </p>
        )}
      </ChartCard>

      <ChartCard title="Risk Score Distribution" subtitle="Bar — accounts per 10% bucket">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={bars} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
            <CartesianGrid stroke={ct.grid} vertical={false} />
            <XAxis dataKey="name" stroke={ct.axis} fontSize={10} tickLine={false} />
            <YAxis stroke={ct.axis} fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: ct.cursor }} contentStyle={ct.tooltip} itemStyle={{ color: ct.tooltip.color }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {bars.map((b, i) => <Cell key={i} fill={b.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Anomaly Trend" subtitle="Rolling avg risk score across accounts">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={line} margin={{ top: 8, right: 16, left: -16, bottom: 8 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ct.line} stopOpacity={0.35} />
                <stop offset="100%" stopColor={ct.line} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={ct.grid} vertical={false} />
            <XAxis dataKey="x" stroke={ct.axis} fontSize={10} tickLine={false} />
            <YAxis stroke={ct.axis} fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={ct.tooltip} itemStyle={{ color: ct.tooltip.color }} />
            <Area type="monotone" dataKey="avg" stroke={ct.line} strokeWidth={2.6} fill="url(#trendFill)" dot={false} isAnimationActive animationDuration={900} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  )
}

function ChartCard({ title, subtitle, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="card card-hover p-5"
    >
      <h3 className="font-display font-bold text-base tracking-tight text-content-hi">{title}</h3>
      <p className="text-xs text-content-md">{subtitle}</p>
      <div className="mt-3">{children}</div>
    </motion.div>
  )
}
