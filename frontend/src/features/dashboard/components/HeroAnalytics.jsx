import { motion } from 'framer-motion'
import { Activity, AlertTriangle, ArrowUpRight, Gauge, ShieldAlert, Users } from 'lucide-react'
import CountUp from '../../../shared/components/CountUp.jsx'

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 18 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
}

const TILES = {
  brand:   'bg-brand/10 text-brand-600 dark:text-brand-300',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  red:     'bg-red-500/10 text-red-600 dark:text-red-400',
  amber:   'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  violet:  'bg-violet-500/10 text-violet-600 dark:text-violet-400',
}

function MetricCard({ index, label, value, suffix = '', decimals = 0, icon: Icon, tile = 'brand', sub, subTone = 'up' }) {
  return (
    <motion.div
      custom={index}
      variants={CARD_VARIANTS}
      initial="hidden"
      animate="show"
      className="card card-hover p-5"
    >
      <div className="flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl grid place-items-center shrink-0 ${TILES[tile]}`}>
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-content-md truncate">
            {label}
          </p>
          <div className="mt-1 font-display font-extrabold text-2xl sm:text-[27px] leading-none tracking-tight text-content-hi">
            <CountUp value={value} suffix={suffix} decimals={decimals} />
          </div>
        </div>
      </div>
      {sub && (
        <p className="mt-3 flex items-center gap-1 text-[11px] text-content-md">
          <ArrowUpRight
            className={`h-3.5 w-3.5 ${subTone === 'up' ? 'text-emerald-500' : 'text-content-lo'}`}
          />
          {sub}
        </p>
      )}
    </motion.div>
  )
}

export default function HeroAnalytics({ stats }) {
  const { totalAccounts = 0, suspicious = 0, critical = 0, avgRisk = 0, accuracy = 0 } = stats || {}

  return (
    <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <MetricCard index={0} label="Total Accounts" value={totalAccounts} icon={Users} tile="brand" sub="From uploaded dataset" subTone="flat" />
      <MetricCard index={1} label="Suspicious" value={suspicious} icon={ShieldAlert} tile="violet" sub="Flagged by ensemble" />
      <MetricCard index={2} label="High-Risk Alerts" value={critical} icon={AlertTriangle} tile="red" sub="Risk score ≥ 80" />
      <MetricCard index={3} label="Avg Risk Score" value={avgRisk} suffix="%" decimals={1} icon={Gauge} tile="amber" sub="Across all accounts" subTone="flat" />
      <MetricCard index={4} label="Detection Accuracy" value={accuracy * 100} suffix="%" decimals={1} icon={Activity} tile="emerald" sub="On held-out split" />
    </section>
  )
}
