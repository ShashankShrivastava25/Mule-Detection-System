import { Bell, Menu, UploadCloud } from 'lucide-react'
import ThemeToggle from '../../../shared/components/ThemeToggle.jsx'

export default function Navbar({ alertCount = 0, online = false, onMenu, onUpload }) {
  return (
    <header className="sticky top-0 z-30 bg-canvas/80 backdrop-blur-xl border-b border-edge/[0.07] dark:border-edge/[0.10]">
      <div className="h-[68px] px-4 sm:px-6 lg:px-8 flex items-center gap-3">
        {/* Mobile menu */}
        <button
          onClick={onMenu}
          className="lg:hidden h-9 w-9 grid place-items-center rounded-xl border border-edge/[0.12] dark:border-edge/[0.16] bg-surface hover:bg-surface-2 transition"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4 text-content-md" />
        </button>

        <div className="leading-tight">
          <h2 className="font-display font-bold text-base sm:text-lg tracking-tight text-content-hi">
            Dashboard
          </h2>
          <p className="hidden sm:block text-[11px] text-content-md">
            Predictive banking fraud intelligence
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-edge/[0.08] dark:border-edge/[0.12] text-[11px] text-content-md">
            <span
              className={`h-2 w-2 rounded-full animate-pulse-slow ${
                online ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
            {online ? 'Engine online' : 'Engine offline'}
          </div>

          <ThemeToggle />

          <button
            aria-label={`${alertCount} alerts`}
            className="relative h-9 w-9 grid place-items-center rounded-xl border border-edge/[0.12] dark:border-edge/[0.16] bg-surface hover:bg-surface-2 transition"
          >
            <Bell className="h-4 w-4 text-content-md" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-[10px] font-semibold text-white grid place-items-center">
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            )}
          </button>

          <button onClick={onUpload} className="hidden sm:inline-flex btn-brand !px-4 !py-2">
            <UploadCloud className="h-4 w-4" />
            Upload Dataset
          </button>

          <button
            aria-label="Risk admin profile"
            className="h-9 w-9 grid place-items-center rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-[0_4px_14px_rgb(99_102_241/0.4)]"
          >
            RA
          </button>
        </div>
      </div>
    </header>
  )
}
