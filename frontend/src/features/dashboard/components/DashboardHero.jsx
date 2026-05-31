import { motion } from 'framer-motion'
import { FileText, UploadCloud, Activity, Network, Gauge, Layers, ShieldCheck } from 'lucide-react'

const TAGS = [
  { icon: Activity, label: 'Behavioral Signals', pos: 'top-6 left-2 sm:left-6' },
  { icon: Gauge, label: 'Velocity Anomaly', pos: 'top-1/2 -translate-y-1/2 left-0' },
  { icon: Network, label: 'Network Linkage', pos: 'bottom-8 left-4 sm:left-10' },
  { icon: Layers, label: 'Ensemble ML', pos: 'top-10 right-4 sm:right-10' },
]

export default function DashboardHero({ onUpload, onSample }) {
  return (
    <section
      id="overview"
      className="relative overflow-hidden rounded-3xl bg-hero-gradient text-white p-6 sm:p-9 lg:p-11"
    >
      {/* Decorative glows + grid */}
      <div className="absolute inset-0 grid-dots opacity-[0.15]" aria-hidden />
      <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" aria-hidden />
      <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" aria-hidden />

      <div className="relative grid lg:grid-cols-2 gap-8 items-center">
        {/* Copy */}
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-medium backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
            ML-Powered Mule-Account Detection
          </span>

          <h1 className="mt-5 font-display font-extrabold text-3xl sm:text-4xl lg:text-[44px] leading-[1.05] tracking-tight">
            Detect Mule Accounts
            <br />
            with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-violet-300">Ensemble AI</span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-white/70 max-w-md leading-relaxed">
            Upload transaction-feature data and let the engine clean, score, and surface
            mule-like behavior with explainable, risk-tiered alerts in real time.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={onUpload}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-[#1e1b4b] text-sm font-semibold hover:bg-white/90 transition shadow-lg"
            >
              <UploadCloud className="h-4 w-4" />
              Upload Dataset
            </button>
            <button
              onClick={onSample}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition backdrop-blur"
            >
              <FileText className="h-4 w-4" />
              View Pipeline
            </button>
          </div>
        </div>

        {/* Visual */}
        <div className="relative h-[260px] sm:h-[300px] hidden md:block">
          {/* Central glowing shield */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 grid place-items-center"
          >
            <div className="relative">
              <div className="absolute inset-0 -m-10 rounded-full bg-brand-500/30 blur-3xl animate-pulse-slow" />
              <div className="relative h-40 w-40 rounded-[2rem] bg-gradient-to-br from-brand-500/40 to-violet-500/30 border border-white/20 backdrop-blur grid place-items-center animate-float">
                <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-brand-400 to-violet-500 grid place-items-center shadow-[0_0_40px_rgb(129_140_248/0.6)]">
                  <ShieldCheck className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating feature tags */}
          {TAGS.map((t, i) => {
            const Icon = t.icon
            return (
              <motion.div
                key={t.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 + i * 0.1 }}
                className={`absolute ${t.pos} inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur text-[11px] font-medium`}
              >
                <Icon className="h-3.5 w-3.5 text-indigo-300" />
                {t.label}
              </motion.div>
            )
          })}

          {/* Risk score badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="absolute bottom-6 right-2 sm:right-6 px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-400/30 backdrop-blur"
          >
            <p className="text-[10px] uppercase tracking-wider text-white/60">Risk Score</p>
            <p className="num text-lg font-bold text-red-300">9.8/10</p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
