import { motion } from 'framer-motion'
import { Brain, Sparkles, ShieldAlert, AlertCircle } from 'lucide-react'
import { insightForResults } from '../lib/interpretations.js'

const TONE = {
  safe:       { color: '#22c55e', icon: Sparkles,    bg: 'risk-safe-bg',       border: 'risk-safe-border' },
  watch:      { color: '#f59e0b', icon: AlertCircle, bg: 'risk-watch-bg',      border: 'risk-watch-border' },
  suspicious: { color: '#f97316', icon: ShieldAlert, bg: 'risk-suspicious-bg', border: 'risk-suspicious-border' },
  critical:   { color: '#ef4444', icon: ShieldAlert, bg: 'risk-critical-bg',   border: 'risk-critical-border' },
  info:       { color: '#6366f1', icon: Brain,       bg: 'bg-brand/10',        border: 'border-brand/25' },
}

export default function AIInsights({ summary }) {
  const insights = insightForResults(summary || {})

  return (
    <section className="card p-6 h-full flex flex-col">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-gradient grid place-items-center shadow-[0_6px_18px_rgb(99_102_241/0.35)]">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="font-display font-bold text-xl tracking-tight text-content-hi">Behavioral Insights</h2>
          <p className="text-sm text-content-md">Explainable summary from the fraud engine</p>
        </div>
      </div>

      <div className="mt-4 space-y-3 flex-1">
        {insights.map((ins, i) => {
          const t = TONE[ins.tone] || TONE.info
          const Icon = t.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={`rounded-xl border ${t.border} ${t.bg} p-4 flex gap-3 transition`}
            >
              <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: t.color }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: t.color }}>
                  {ins.headline}
                </p>
                <p className="text-xs text-content-md mt-1 leading-relaxed">{ins.body}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
