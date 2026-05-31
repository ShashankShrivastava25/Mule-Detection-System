import { motion } from 'framer-motion'

function Cell({ label, value, hint, tone, big }) {
  const tones = {
    safe: 'risk-safe-bg risk-safe-border risk-safe-text',
    warn: 'risk-watch-bg risk-watch-border risk-watch-text',
    bad:  'risk-critical-bg risk-critical-border risk-critical-text',
    ink:  'bg-surface-2 border-edge/[0.08] dark:border-edge/[0.12] text-content-hi',
  }
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`rounded-2xl border p-5 flex flex-col gap-1 ${tones[tone]}`}
    >
      <span className="text-[11px] uppercase tracking-wider text-content-md">{label}</span>
      <span className={`num font-display font-extrabold leading-none ${big ? 'text-4xl' : 'text-3xl'}`}>
        {value}
      </span>
      <span className="text-xs text-content-md">{hint}</span>
    </motion.div>
  )
}

function Metric({ label, value }) {
  const pct = (Number(value) || 0) * 100
  return (
    <div className="px-3 py-2 rounded-xl border border-edge/[0.08] dark:border-edge/[0.12] bg-surface-2">
      <div className="text-[10px] uppercase text-content-lo">{label}</div>
      <div className="num text-content-hi font-semibold">{pct.toFixed(1)}%</div>
    </div>
  )
}

export default function ConfusionMatrix({ confusion, metrics }) {
  const { tp = 0, fp = 0, tn = 0, fn = 0 } = confusion || {}

  return (
    <section className="card p-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-bold text-xl tracking-tight text-content-hi">Confusion Matrix</h2>
          <p className="text-sm text-content-md">Model performance on held-out test split</p>
        </div>
        {metrics && (
          <div className="flex gap-2 text-xs">
            <Metric label="Accuracy" value={metrics.accuracy} />
            <Metric label="Precision" value={metrics.precision} />
            <Metric label="Recall" value={metrics.recall} />
            <Metric label="F1" value={metrics.f1} />
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <Cell label="True Positives" value={tp} hint="Mules correctly flagged" tone="safe" big />
        <Cell label="False Positives" value={fp} hint="Legit accounts mislabeled" tone="warn" />
        <Cell label="False Negatives" value={fn} hint="Mules missed by model" tone="bad" />
        <Cell label="True Negatives" value={tn} hint="Legit accounts correctly cleared" tone="ink" />
      </div>
    </section>
  )
}
