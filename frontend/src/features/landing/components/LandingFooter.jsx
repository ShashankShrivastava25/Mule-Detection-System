import { ShieldCheck } from 'lucide-react'

export default function LandingFooter() {
  return (
    <footer className="border-t border-edge">
      <div className="mx-auto max-w-[1240px] px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-content-md">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-lg bg-brand-gradient grid place-items-center">
            <ShieldCheck className="h-3.5 w-3.5 text-white" />
          </span>
          <span className="font-display text-base text-content-hi">Muleguard</span>
        </div>
        <div className="flex items-center gap-5">
          <span>XGBoost · LightGBM · IsolationForest</span>
          <span className="hidden sm:inline text-content-lo">·</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  )
}
