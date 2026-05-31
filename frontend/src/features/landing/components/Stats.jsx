import { useRef } from 'react'
import CountUp from '../../../shared/components/CountUp.jsx'
import useGsapReveal from '../animations/useGsapReveal.js'

const STATS = [
  { value: 9082, label: 'Accounts profiled', suffix: '' },
  { value: 81, label: 'Mule accounts flagged', suffix: '' },
  { value: 98.4, label: 'Detection accuracy', suffix: '%', decimals: 1 },
  { value: 1500, label: 'Junk features removed', suffix: '+' },
]

export default function Stats() {
  const ref = useRef(null)
  useGsapReveal(ref, { stagger: 0.08, y: 22 })

  return (
    <section id="stats" ref={ref} className="relative py-20 px-6 border-t border-edge/[0.06] dark:border-edge/[0.10]">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid lg:grid-cols-12 items-end gap-8 mb-12">
          <h2 data-reveal className="lg:col-span-7 font-display font-extrabold text-4xl sm:text-5xl tracking-tight leading-[1.05] text-content-hi">
            Continuously running.
          </h2>
          <p data-reveal className="lg:col-span-5 text-content-md text-base sm:text-lg max-w-md">
            Muleguard continuously processes operational data in near real-time —
            so every account, every transfer, every behavioral signal gets scored.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              data-reveal
              className={`card card-hover p-6 ${i === 1 ? 'bg-brand-gradient border-transparent text-white' : ''}`}
            >
              <div className={`font-display font-extrabold text-4xl sm:text-5xl tracking-tight ${i === 1 ? 'text-white' : 'text-content-hi'}`}>
                <CountUp value={s.value} suffix={s.suffix} decimals={s.decimals || 0} duration={1.6} />
              </div>
              <div className={`mt-3 text-xs uppercase tracking-wider ${i === 1 ? 'text-white/80' : 'text-content-md'}`}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
