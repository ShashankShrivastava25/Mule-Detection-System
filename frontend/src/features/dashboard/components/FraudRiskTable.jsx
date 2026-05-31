import { motion } from 'framer-motion'
import { ArrowUpDown, Search, ShieldAlert, ShieldCheck, AlertTriangle, Activity } from 'lucide-react'
import { useMemo, useState } from 'react'
import { riskTier, styleForScore } from '../lib/risk.js'

const PAGE_SIZE = 12

const FILTERS = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'critical', label: 'Critical', match: (r) => riskTier(r['Risk Score']) === 'critical' },
  { id: 'suspicious', label: 'Suspicious', match: (r) => riskTier(r['Risk Score']) === 'suspicious' },
  { id: 'watch', label: 'Watch', match: (r) => riskTier(r['Risk Score']) === 'watch' },
  { id: 'safe', label: 'Nominal', match: (r) => riskTier(r['Risk Score']) === 'safe' },
]

const TIER_ICON = {
  critical: ShieldAlert,
  suspicious: AlertTriangle,
  watch: Activity,
  safe: ShieldCheck,
}

export default function FraudRiskTable({ results = [] }) {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState({ key: 'Risk Score', dir: 'desc' })

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter) || FILTERS[0]
    return results.filter((r) => {
      if (!f.match(r)) return false
      if (!search.trim()) return true
      const s = search.trim().toLowerCase()
      return (
        String(r.Account).includes(s) ||
        String(r.Alert || '').toLowerCase().includes(s)
      )
    })
  }, [results, search, filter])

  const sorted = useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      const av = a[sort.key]
      const bv = b[sort.key]
      if (av === bv) return 0
      return (av < bv ? -1 : 1) * (sort.dir === 'asc' ? 1 : -1)
    })
    return copy
  }, [filtered, sort])

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const slice = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  const setSortKey = (key) => {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' },
    )
    setPage(0)
  }

  return (
    <section className="card p-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div>
          <h2 className="font-display font-bold text-xl tracking-tight text-content-hi">Fraud Risk Table</h2>
          <p className="text-sm text-content-md">Per-account scoring with explainable risk tiers</p>
        </div>

        <div className="md:ml-auto flex items-center gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => { setFilter(f.id); setPage(0) }}
              className={`chip transition ${
                filter === f.id
                  ? 'bg-brand-gradient border-transparent text-white shadow-[0_4px_12px_rgb(99_102_241/0.35)]'
                  : 'bg-surface border-edge/[0.10] dark:border-edge/[0.14] text-content-md hover:text-content-hi hover:border-brand-400/50'
              }`}
            >
              {f.label}
            </button>
          ))}

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-content-lo" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              placeholder="Search account or alert…"
              className="pl-8 pr-3 py-1.5 text-xs rounded-full bg-surface border border-edge/[0.10] dark:border-edge/[0.14] focus:border-brand-500 outline-none w-56 text-content-hi placeholder:text-content-lo"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto scroll-thin rounded-2xl border border-edge/[0.08] dark:border-edge/[0.12]">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-content-md">
            <tr className="text-left">
              <Th onClick={() => setSortKey('Account')} active={sort.key === 'Account'} dir={sort.dir}>Account ID</Th>
              <Th onClick={() => setSortKey('Risk Score')} active={sort.key === 'Risk Score'} dir={sort.dir}>Risk Score</Th>
              <Th onClick={() => setSortKey('Prediction')} active={sort.key === 'Prediction'} dir={sort.dir}>Prediction</Th>
              <th className="px-4 py-3 font-medium">Anomaly</th>
              <th className="px-4 py-3 font-medium">AI Alert</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-content-md">
                  No accounts match your filters.
                </td>
              </tr>
            )}
            {slice.map((r, i) => {
              const tier = riskTier(r['Risk Score'])
              const s = styleForScore(r['Risk Score'])
              const Icon = TIER_ICON[tier]
              return (
                <motion.tr
                  key={`${r.Account}-${i}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.015 }}
                  className="border-t border-edge/[0.06] dark:border-edge/[0.10] hover:bg-surface-2 transition"
                >
                  <td className="px-4 py-3 num text-content-hi">#{String(r.Account).padStart(5, '0')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-28 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, r['Risk Score'])}%`, background: s.color }} />
                      </div>
                      <span className={`num text-sm ${s.text}`}>{r['Risk Score'].toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`chip ${r.Prediction === 1 ? 'risk-critical-bg risk-critical-border risk-critical-text' : 'risk-safe-bg risk-safe-border risk-safe-text'}`}>
                      {r.Prediction === 1 ? 'Mule' : 'Legit'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`chip ${s.bg} ${s.border} ${s.text}`}>
                      <Icon className="h-3.5 w-3.5" /> {styleForScore(r['Risk Score']).label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-content-md">{r.Alert}</td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-content-md">
        <span className="num">
          Showing {slice.length} of {sorted.length} · Page {safePage + 1} / {pageCount}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="px-3 py-1 rounded-full border border-edge/[0.10] dark:border-edge/[0.14] hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={safePage >= pageCount - 1}
            className="px-3 py-1 rounded-full border border-edge/[0.10] dark:border-edge/[0.14] hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  )
}

function Th({ children, onClick, active, dir }) {
  return (
    <th className="px-4 py-3 font-medium select-none">
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 ${active ? 'text-content-hi' : 'text-content-md hover:text-content-hi'}`}
      >
        {children}
        <ArrowUpDown className={`h-3 w-3 ${active ? 'opacity-100' : 'opacity-40'}`} />
        {active && <span className="text-[10px]">{dir}</span>}
      </button>
    </th>
  )
}
