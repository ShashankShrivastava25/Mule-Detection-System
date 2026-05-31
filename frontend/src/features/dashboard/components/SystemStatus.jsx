import { Cpu, Database, Network, Zap } from 'lucide-react'

export default function SystemStatus({ apiOnline, modelLoaded, datasetLoaded, processingMs }) {
  const items = [
    { icon: Network,  label: 'API Status',     value: apiOnline ? 'Active' : 'Offline',  ok: apiOnline },
    { icon: Cpu,      label: 'Model Status',   value: modelLoaded ? 'Loaded' : 'Idle',   ok: modelLoaded },
    { icon: Zap,      label: 'Fraud Engine',   value: modelLoaded ? 'Running' : 'Standby', ok: modelLoaded },
    { icon: Database, label: 'Dataset Status', value: datasetLoaded ? 'Processed' : 'Awaiting', ok: datasetLoaded },
  ]

  return (
    <section className="card p-6 h-full flex flex-col">
      <h2 className="font-display font-bold text-xl tracking-tight text-content-hi">System Status</h2>
      <p className="text-sm text-content-md">Real-time pipeline health</p>

      <div className="mt-4 grid gap-2 flex-1">
        {items.map((it, i) => {
          const Icon = it.icon
          const color = it.ok ? '#22c55e' : '#9aa0b4'
          return (
            <div
              key={i}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition ${
                it.ok
                  ? 'risk-safe-border risk-safe-bg'
                  : 'border-edge/[0.08] dark:border-edge/[0.12] bg-surface-2'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" style={{ color }} strokeWidth={1.6} />
                <span className="text-sm text-content-hi">{it.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full animate-pulse-slow" style={{ background: color }} />
                <span className="text-xs num font-medium" style={{ color }}>{it.value}</span>
              </div>
            </div>
          )
        })}
      </div>

      {typeof processingMs === 'number' && processingMs > 0 && (
        <div className="mt-3 text-xs text-content-md">
          Last analysis · <span className="num text-content-hi">{processingMs.toLocaleString()} ms</span>
        </div>
      )}
    </section>
  )
}
