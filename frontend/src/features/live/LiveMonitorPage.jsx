import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity, ArrowLeft, Pause, Play, Radio, AlertTriangle,
  TrendingUp, Gauge, Wifi, WifiOff,
} from 'lucide-react'
import { streamUrl, fetchStreamStats } from './lib/liveApi.js'

const TIER_CLS = {
  critical: 'risk-critical-text risk-critical-bg risk-critical-border',
  suspicious: 'risk-suspicious-text risk-suspicious-bg risk-suspicious-border',
  watch: 'risk-watch-text risk-watch-bg risk-watch-border',
  safe: 'risk-safe-text risk-safe-bg risk-safe-border',
}

const CHANNEL_CLS = {
  UPI: 'chip-brand',
  IMPS: 'chip-neutral',
  NEFT: 'chip-neutral',
  RTGS: 'chip-neutral',
}

const MAX_ROWS = 40
const MAX_ALERTS = 6

export default function LiveMonitorPage() {
  const [rows, setRows] = useState([])
  const [alerts, setAlerts] = useState([])
  const [connected, setConnected] = useState(false)
  const [synthetic, setSynthetic] = useState(false)
  const [paused, setPaused] = useState(false)
  const [speed, setSpeed] = useState(1.5)
  const [seen, setSeen] = useState(0)
  const [flagged, setFlagged] = useState(0)
  const [stats, setStats] = useState(null)

  const esRef = useRef(null)
  const navigate = useNavigate()

  const connect = useCallback(() => {
    if (esRef.current) esRef.current.close()
    const es = new EventSource(streamUrl({ interval: speed, loop: true }))
    esRef.current = es

    es.onopen = () => setConnected(true)
    es.onerror = () => setConnected(false)

    es.addEventListener('meta', (e) => {
      try {
        const m = JSON.parse(e.data)
        setSynthetic(Boolean(m.synthetic))
      } catch { /* ignore */ }
    })

    es.onmessage = (e) => {
      let ev
      try { ev = JSON.parse(e.data) } catch { return }
      const item = { ...ev, _id: `${ev.account}-${ev.ts}-${Math.random()}` }

      setRows((prev) => [item, ...prev].slice(0, MAX_ROWS))
      setSeen((n) => n + 1)
      if (Number(ev.risk_score) >= 50) setFlagged((n) => n + 1)
      if (Number(ev.risk_score) >= 80) {
        setAlerts((prev) => [item, ...prev].slice(0, MAX_ALERTS))
      }
    }
  }, [speed])

  useEffect(() => {
    if (paused) return
    connect()
    return () => { if (esRef.current) esRef.current.close() }
  }, [connect, paused])

  useEffect(() => {
    if (paused && esRef.current) {
      esRef.current.close()
      setConnected(false)
    }
  }, [paused])

  useEffect(() => {
    fetchStreamStats().then(setStats).catch(() => {})
  }, [])

  const rate = (60 / speed).toFixed(0)

  return (
    <div className="min-h-screen bg-canvas text-content-hi">
      <header className="sticky top-0 z-20 border-b border-edge bg-surface/80 backdrop-blur">
        <div className="mx-auto max-w-[1400px] px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-brand-gradient grid place-items-center">
              <Radio className="h-5 w-5 text-white" />
            </span>
            <div>
              <h1 className="font-display font-bold text-lg leading-none flex items-center gap-2">
                Live Monitor
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${connected ? 'risk-safe-text' : 'text-content-lo'}`}>
                  <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                  {connected ? 'Streaming' : 'Paused'}
                </span>
              </h1>
              <p className="text-xs text-content-md mt-0.5">
                Real-time transaction monitoring · replaying scored streams
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPaused((p) => !p)} className="btn-soft gap-2">
              {paused ? <><Play className="h-4 w-4" /> Resume</> : <><Pause className="h-4 w-4" /> Pause</>}
            </button>
            <Link to="/dashboard" className="btn-ghost gap-2">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-6">
        {synthetic && (
          <div className="card p-3 mb-5 chip-neutral text-xs flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Demo stream — run an analysis to monitor your real scored accounts here.
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Counter icon={Gauge} label="Processed (session)" value={seen} />
          <Counter icon={AlertTriangle} label="Flagged (session)" value={flagged} />
          <Counter icon={TrendingUp} label="Throughput" value={`${rate}/min`} />
          <Counter icon={connected ? Wifi : WifiOff} label="Monitored total" value={stats?.monitored ?? '—'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <section className="lg:col-span-2 panel p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" /> Transaction feed
              </h2>
              <div className="flex items-center gap-2 text-xs text-content-md">
                <span>Speed</span>
                {[0.6, 1.5, 3].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`chip text-[11px] ${speed === s ? 'chip-brand' : 'chip-neutral'}`}
                  >
                    {s === 0.6 ? 'Fast' : s === 1.5 ? 'Normal' : 'Slow'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto scroll-thin pr-1">
              {rows.length === 0 ? (
                <p className="text-sm text-content-md py-12 text-center">
                  {paused ? 'Stream paused.' : 'Waiting for transactions…'}
                </p>
              ) : (
                rows.map((r) => (
                  <FeedRow key={r._id} r={r} onJump={() => r.case_id && navigate('/cases')} />
                ))
              )}
            </div>
          </section>

          <section className="panel p-4">
            <h2 className="font-display font-bold text-sm flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 risk-critical-text" /> High-risk alerts
            </h2>
            <div className="space-y-2.5">
              {alerts.length === 0 ? (
                <p className="text-xs text-content-lo py-8 text-center">No high-risk activity yet.</p>
              ) : (
                alerts.map((a) => (
                  <div key={a._id} className="card p-3 risk-critical-border animate-[pulse_1.2s_ease-in-out_1]">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold">{a.account}</span>
                      <span className="num text-sm font-bold risk-critical-text">{Math.round(a.risk_score)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className={`chip text-[10px] ${CHANNEL_CLS[a.channel] || 'chip-neutral'}`}>{a.channel}</span>
                      {a.case_id && (
                        <button onClick={() => navigate('/cases')} className="text-[11px] text-brand-600 dark:text-brand-300 hover:underline">
                          View case →
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function Counter({ icon: Icon, label, value }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-content-md">
        <Icon className="h-4 w-4" />
        <p className="text-xs">{label}</p>
      </div>
      <p className="num text-2xl font-bold mt-1">{value}</p>
    </div>
  )
}

function FeedRow({ r, onJump }) {
  const high = Number(r.risk_score) >= 80
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-edge bg-surface px-3 py-2 animate-[fadeIn_0.4s_ease-out] ${high ? 'risk-critical-border' : ''}`}
    >
      <span className={`chip text-[10px] shrink-0 ${CHANNEL_CLS[r.channel] || 'chip-neutral'}`}>{r.channel}</span>
      <span className="font-mono text-sm shrink-0 w-28 truncate">{r.account}</span>
      <div className="flex-1 h-1.5 rounded-full bg-canvas overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-gradient"
          style={{ width: `${Math.min(100, Number(r.risk_score))}%` }}
        />
      </div>
      <span className={`chip text-[10px] shrink-0 ${TIER_CLS[r.tier] || ''}`}>{r.tier}</span>
      <span className="num text-sm font-bold shrink-0 w-8 text-right">{Math.round(r.risk_score)}</span>
      {r.case_id && (
        <button onClick={onJump} className="text-[11px] text-brand-600 dark:text-brand-300 hover:underline shrink-0">
          case
        </button>
      )}
    </div>
  )
}