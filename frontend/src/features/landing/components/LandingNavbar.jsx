import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import ThemeToggle from '../../../shared/components/ThemeToggle.jsx'

const NAV = [
  { label: 'Solution', href: '#features' },
  { label: 'How it works', href: '#how' },
  { label: 'Approach', href: '#stats' },
  { label: 'Get started', href: '#cta' },
]

export default function LandingNavbar() {
  return (
    <header className="sticky top-0 z-40 bg-canvas/80 backdrop-blur-xl border-b border-edge/[0.06] dark:border-edge/[0.10]">
      <div className="mx-auto max-w-[1240px] px-6 py-4 flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="h-9 w-9 rounded-xl bg-brand-gradient grid place-items-center shadow-[0_6px_16px_rgb(99_102_241/0.4)]">
            <ShieldCheck className="h-4 w-4 text-white" />
          </span>
          <span className="font-display font-extrabold text-lg tracking-tight text-content-hi">Muleguard</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm text-content-md">
          {NAV.map((n) => (
            <a key={n.label} href={n.href} className="hover:text-content-hi transition">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <ThemeToggle />
          <Link to="/dashboard" className="btn-brand !px-4 !py-2 group">
            Open dashboard
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>
      </div>
    </header>
  )
}
