import { ShieldCheck } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-edge/[0.07] dark:border-edge/[0.10]">
      <div className="px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center gap-3 text-xs text-content-md">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-lg bg-brand-gradient grid place-items-center">
            <ShieldCheck className="h-3.5 w-3.5 text-white" />
          </span>
          <span className="font-display font-bold text-base text-content-hi">Muleguard</span>
        </div>
        <span className="hidden md:inline text-content-lo">·</span>
        <span>AI/ML-Based Fraud Intelligence System for Banking Security</span>
        <span className="md:ml-auto text-content-lo">© {new Date().getFullYear()}</span>
      </div>
    </footer>
  )
}
