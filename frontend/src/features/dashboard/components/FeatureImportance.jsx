import { motion } from 'framer-motion'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { humanizeFeature } from '../lib/interpretations.js'
import useChartTheme from '../../../shared/hooks/useChartTheme.js'

export default function FeatureImportance({ items = [] }) {
  const ct = useChartTheme()
  const top = items.slice(0, 10).map((it, i) => ({
    label: humanizeFeature(it.feature, i),
    importance: Number(it.importance) || 0,
    raw: it.feature,
  }))

  // Indigo → violet gradient by rank
  const palette = (i) => {
    const t = i / Math.max(1, top.length - 1)
    const lerp = (a, b) => Math.round(a + (b - a) * t)
    const from = [99, 102, 241]   // #6366f1
    const to = [167, 139, 250]    // #a78bfa
    return `rgb(${lerp(from[0], to[0])}, ${lerp(from[1], to[1])}, ${lerp(from[2], to[2])})`
  }

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display font-bold text-xl tracking-tight text-content-hi">Behavioral Drivers</h2>
          <p className="text-sm text-content-md">
            Top behavioral signals influencing mule-account predictions
          </p>
        </div>
        <span className="chip-brand">Explainable AI · ensemble gain</span>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="mt-4">
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={top} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              stroke={ct.axisLabel}
              fontSize={11}
              width={210}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: ct.cursor }}
              contentStyle={ct.tooltip}
              itemStyle={{ color: ct.tooltip.color }}
              formatter={(v) => [(v * 100).toFixed(2) + '%', 'Influence']}
            />
            <Bar dataKey="importance" radius={[0, 8, 8, 0]} isAnimationActive animationDuration={900}>
              {top.map((_, i) => <Cell key={i} fill={palette(i)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <p className="mt-2 text-[11px] text-content-lo">
        Feature names are abstracted to protect underlying schema.
      </p>
    </section>
  )
}
