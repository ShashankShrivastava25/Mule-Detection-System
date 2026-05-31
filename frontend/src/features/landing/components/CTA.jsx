import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import useGsapReveal from '../animations/useGsapReveal.js'

export default function CTA() {
  const ref = useRef(null)
  useGsapReveal(ref, { stagger: 0.08, y: 24 })

  return (
    <section id="cta" ref={ref} className="relative py-24 px-6 border-t border-edge">
      <div className="mx-auto max-w-[1240px]">
        <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-12 sm:p-16 shadow-glow">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" aria-hidden />
          <div className="absolute -left-16 -bottom-24 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl" aria-hidden />
          <div className="relative grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <h2 data-reveal className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight leading-[1.05] text-white">
                Ready to see your dataset <span className="italic">light up</span>?
              </h2>
              <p data-reveal className="mt-4 text-white/80 max-w-md">
                Launch the dashboard, drop your CSV, and watch the engine score every
                account in seconds.
              </p>
            </div>
            <div data-reveal className="lg:col-span-5 flex flex-wrap gap-3 lg:justify-end">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-brand-700 text-sm font-semibold hover:bg-white/90 transition shadow-card"
              >
                Open dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/40 text-white text-sm font-medium hover:bg-white/10 transition"
              >
                See the capabilities
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
