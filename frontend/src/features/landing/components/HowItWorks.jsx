import { useRef } from 'react'
import { Database, FlaskConical, Gauge, UploadCloud } from 'lucide-react'
import useGsapReveal from '../animations/useGsapReveal.js'

const STEPS = [
  { num: '01', icon: UploadCloud, title: 'Upload', body: 'Drop your transaction-features CSV. Up to 200 MB.' },
  { num: '02', icon: FlaskConical, title: 'Clean', body: 'DataCleaner drops junk columns, winsorises outliers, robust-scales.' },
  { num: '03', icon: Database, title: 'Score', body: 'Ensemble of XGBoost + LightGBM + IsolationForest scores each account.' },
  { num: '04', icon: Gauge, title: 'Surface', body: 'Dashboard lights up — KPIs, risk table, alerts, explainable drivers.' },
]

export default function HowItWorks() {
  const ref = useRef(null)
  useGsapReveal(ref, { stagger: 0.1, y: 28 })

  return (
    <section id="how" ref={ref} className="relative py-24 px-6 border-t border-edge/[0.06] dark:border-edge/[0.10]">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid lg:grid-cols-12 items-end gap-8 mb-12">
          <h2 data-reveal className="lg:col-span-8 font-display font-extrabold text-4xl sm:text-5xl tracking-tight leading-[1.05] text-content-hi">
            From raw CSV to flagged accounts in <span className="text-transparent bg-clip-text bg-brand-gradient">four steps</span>.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.num} data-reveal className="card card-hover p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-brand-600 dark:text-brand-300">{s.num}</span>
                  <div className="h-9 w-9 rounded-lg bg-brand/10 grid place-items-center">
                    <Icon className="h-4 w-4 text-brand-600 dark:text-brand-300" strokeWidth={1.7} />
                  </div>
                </div>
                <h3 className="mt-8 font-display font-bold text-xl tracking-tight text-content-hi">{s.title}</h3>
                <p className="mt-2 text-sm text-content-md leading-relaxed">{s.body}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
