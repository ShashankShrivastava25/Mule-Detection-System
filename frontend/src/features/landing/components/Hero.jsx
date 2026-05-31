import { motion } from 'framer-motion'
import { ArrowRight, Star } from 'lucide-react'
import { Suspense, lazy, useRef } from 'react'
import { Link } from 'react-router-dom'
import useGsapReveal from '../animations/useGsapReveal.js'

const Hero3D = lazy(() => import('../three/Hero3D.jsx'))

export default function Hero() {
  const ref = useRef(null)
  useGsapReveal(ref, { stagger: 0.1, y: 24 })

  return (
    <section ref={ref} className="relative overflow-hidden">
      {/* ambient glows */}
      <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute top-40 -left-10 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" aria-hidden />

      <div className="mx-auto max-w-[1240px] px-6 pt-16 pb-12 grid lg:grid-cols-2 gap-12 items-center">
        <div className="max-w-xl">
          <motion.div
            data-reveal
            className="flex items-center gap-2 text-xs text-content-md"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
              ))}
            </span>
            <span>4.9 · trusted by AML &amp; fraud teams</span>
          </motion.div>

          <h1
            data-reveal
            className="mt-5 font-display font-extrabold text-5xl sm:text-6xl lg:text-[64px] leading-[1.0] tracking-tight text-content-hi"
          >
            Real-time<br />
            detection and<br />
            <span className="text-transparent bg-clip-text bg-brand-gradient">incident response</span>
          </h1>

          <p data-reveal className="mt-6 text-base sm:text-lg text-content-md leading-relaxed max-w-md">
            Automate operations from insight to action with Muleguard — powering fraud,
            AML, moderation, and IT teams with an explainable ML ensemble.
          </p>

          <div data-reveal className="mt-7 flex flex-wrap items-center gap-3">
            <Link to="/dashboard" className="btn-brand group">
              Request demo
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
            </Link>
            <a href="#how" className="btn-ghost">How it works</a>
          </div>
        </div>

        {/* Visual */}
        <div data-reveal className="relative h-[440px] sm:h-[520px]">
          <Suspense fallback={<div className="absolute inset-0" />}>
            <Hero3D />
          </Suspense>

          <div className="absolute right-2 top-6 left-2 sm:left-12 sm:right-0 card p-5 animate-float">
            <div className="flex items-center justify-between text-xs text-content-md">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Alert Resolution Flow
              </div>
              <span className="num">02:35</span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              <FlowCol label="Ingest" tone="bg-surface-3" />
              <FlowCol label="Score" tone="bg-amber-400/40" pill="High" pillTone="bg-red-500 text-white" />
              <FlowCol label="Review" tone="bg-brand/15" pill="Medium" pillTone="bg-brand/25 text-brand-600 dark:text-brand-300" />
              <FlowCol label="Confirm" tone="bg-emerald-500/15" pill="OK" pillTone="bg-emerald-500 text-white" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] text-content-md">
              <Stat label="Account Takeovers" value="60%" />
              <Stat label="Insider Threats" value="50%" />
              <Stat label="App Anomalies" value="43%" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FlowCol({ label, tone, pill, pillTone }) {
  return (
    <div className={`rounded-lg ${tone} p-2.5 min-h-[68px] flex flex-col justify-between`}>
      <span className="text-[10px] uppercase tracking-wider text-content-md">{label}</span>
      {pill && (
        <span className={`self-start text-[9px] font-medium px-1.5 py-0.5 rounded-md ${pillTone}`}>
          {pill}
        </span>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-surface-2 rounded-md p-2">
      <div className="text-[9px] uppercase">{label}</div>
      <div className="text-xs font-semibold text-content-hi num">{value}</div>
    </div>
  )
}
