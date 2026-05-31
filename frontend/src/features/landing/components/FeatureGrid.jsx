import { useRef } from 'react'
import {
  Activity,
  BrainCircuit,
  Eye,
  GitBranch,
  Layers,
  RadioTower,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import useGsapReveal from '../animations/useGsapReveal.js'

const FEATURES = [
  { icon: BrainCircuit, title: 'Ensemble ML core', body: 'XGBoost + LightGBM + IsolationForest blended through probability calibration.', tile: 'brand' },
  { icon: Sparkles, title: 'Explainable signals', body: 'Raw schema is abstracted to human labels like "Velocity Anomaly Marker".', tile: 'violet' },
  { icon: ShieldCheck, title: 'Risk-tiered alerts', body: 'Critical / Suspicious / Watch / Nominal — colour-coded and routed instantly.', tile: 'red' },
  { icon: Activity, title: 'Real-time pipeline', body: 'CSV → clean → score → dashboard in under 2 seconds for typical batches.', tile: 'emerald' },
  { icon: GitBranch, title: 'Auto data hygiene', body: '1,500+ junk features removed automatically before training.', tile: 'amber' },
  { icon: RadioTower, title: 'F2-tuned threshold', body: 'Decision threshold optimised for recall on the 0.89% positive class.', tile: 'brand' },
  { icon: Layers, title: 'Confusion-matrix audit', body: 'TP / FP / FN / TN at a glance, with precision / recall / F1 / F2.', tile: 'violet' },
  { icon: Eye, title: 'Explainable-AI views', body: 'Per-account drivers with hover-only raw IDs — schema stays private.', tile: 'emerald' },
]

const TILES = {
  brand:   'bg-brand/10 text-brand-600 dark:text-brand-300',
  violet:  'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  red:     'bg-red-500/10 text-red-600 dark:text-red-400',
  amber:   'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

export default function FeatureGrid() {
  const ref = useRef(null)
  useGsapReveal(ref, { stagger: 0.05, y: 28 })

  return (
    <section id="features" ref={ref} className="relative py-24 px-6 border-t border-edge/[0.06] dark:border-edge/[0.10]">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid lg:grid-cols-12 items-end gap-8 mb-12">
          <h2 data-reveal className="lg:col-span-7 font-display font-extrabold text-4xl sm:text-5xl tracking-tight leading-[1.05] text-content-hi">
            Muleguard in production across <span className="text-transparent bg-clip-text bg-brand-gradient">critical systems</span>
          </h2>
          <p data-reveal className="lg:col-span-5 text-content-md text-base sm:text-lg">
            Integrate signals, apply logic, and execute workflows across your most critical systems.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} data-reveal className="card card-hover p-6">
                <div className={`h-11 w-11 rounded-xl grid place-items-center ${TILES[f.tile]}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.7} />
                </div>
                <h3 className="mt-5 font-display font-bold text-lg tracking-tight leading-tight text-content-hi">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-content-md leading-relaxed">{f.body}</p>
                <a href="#cta" className="mt-4 inline-block text-xs font-medium text-brand-600 dark:text-brand-300 hover:underline underline-offset-4">
                  Learn more →
                </a>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
