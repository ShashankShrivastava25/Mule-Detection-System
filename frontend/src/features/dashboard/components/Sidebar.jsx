import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  Brain,
  FileBarChart,
  Gauge,
  LayoutDashboard,
  ListTree,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react'

const GROUPS = [
  {
    title: null,
    items: [{ id: 'overview', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Analysis',
    items: [
      { id: 'upload', label: 'Upload Dataset', icon: UploadCloud },
      { id: 'risk-table', label: 'Risk Table', icon: ListTree },
      { id: 'alerts', label: 'Alert Center', icon: ShieldAlert },
      { id: 'analytics', label: 'Anomaly Analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'AI Insights',
    items: [
      { id: 'insights', label: 'Behavioral Insights', icon: Brain },
      { id: 'system', label: 'System Status', icon: Activity },
    ],
  },
  {
    title: 'Reports',
    items: [
      { id: 'metrics', label: 'Model Metrics', icon: Gauge },
      { id: 'drivers', label: 'Behavioral Drivers', icon: FileBarChart },
    ],
  },
]

const ALL_IDS = GROUPS.flatMap((g) => g.items.map((i) => i.id))

function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  const y = el.getBoundingClientRect().top + window.scrollY - 84
  window.scrollTo({ top: id === 'overview' ? 0 : y, behavior: 'smooth' })
}

export default function Sidebar({ online = false, mobileOpen = false, onClose }) {
  const [active, setActive] = useState('overview')

  // Scroll-spy: highlight the section currently in view.
  useEffect(() => {
    const sections = ALL_IDS.map((id) => document.getElementById(id)).filter(Boolean)
    if (!sections.length) return
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 1] },
    )
    sections.forEach((s) => obs.observe(s))
    return () => obs.disconnect()
  }, [])

  const handleNav = (id) => {
    setActive(id)
    scrollToId(id)
    onClose?.()
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-sidebar border-r border-edge/[0.08] dark:border-edge/[0.10]
          flex flex-col transition-transform duration-300 lg:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 h-[68px] shrink-0 border-b border-edge/[0.06] dark:border-edge/[0.08]">
          <span className="relative h-10 w-10 rounded-xl bg-brand-gradient grid place-items-center shadow-[0_6px_18px_rgb(99_102_241/0.4)]">
            <ShieldCheck className="h-5 w-5 text-white" />
          </span>
          <div className="leading-tight">
            <h1 className="font-display font-extrabold text-[17px] tracking-tight text-content-hi">
              Muleguard
            </h1>
            <p className="text-[11px] text-content-md">
              Fraud Analysis &amp; Risk Scoring
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto lg:hidden h-8 w-8 grid place-items-center rounded-lg hover:bg-sidebar-hover"
            aria-label="Close menu"
          >
            <X className="h-4 w-4 text-content-md" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scroll-thin px-3 py-4 space-y-5">
          {GROUPS.map((group, gi) => (
            <div key={gi}>
              {group.title && (
                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-content-lo">
                  {group.title}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = active === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`nav-item w-full text-left ${isActive ? "nav-item-active" : ""}`}
                    >
                      <Icon
                        className="h-[18px] w-[18px] shrink-0"
                        strokeWidth={1.8}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* System status pill */}
        <div className="px-4 pb-3">
          <div className="rounded-2xl border border-edge/[0.08] dark:border-edge/[0.10] bg-surface-2 p-3.5">
            <p className="text-[11px] font-semibold text-content-hi">
              System Status
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full animate-pulse-slow ${
                  online ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              <span
                className={`text-xs ${online ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}
              >
                {online ? "All systems operational" : "Engine offline"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer link */}
        <div className="px-4 pb-5">
          <Link
            to="/alerts"
            className="flex items-center gap-2 text-xs font-medium text-brand-600 dark:text-brand-300 hover:opacity-80 transition px-2"
          >
            → Alert Ingestion
          </Link>
          <Link
            to="/live"
            className="flex items-center gap-2 text-xs font-medium text-brand-600 dark:text-brand-300 hover:opacity-80 transition px-2"
          >
            → Live Monitor
          </Link>
          <Link
            to="/cases"
            className="flex items-center gap-2 text-xs font-medium text-brand-600 dark:text-brand-300 hover:opacity-80 transition px-2"
          >
            → Case Management
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-[11px] text-content-md hover:text-content-hi transition px-2"
          >
            ← Back to landing
          </Link>
        </div>
      </aside>
    </>
  );
}
