import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Inbox, ArrowLeft, RefreshCw, Send, ShieldAlert, ShieldCheck,
  Eye, AlertTriangle, FileWarning,
} from 'lucide-react'
import { ingestAlert, listAlerts, fetchAlertStats } from './lib/alertsApi.js'

const SOURCES = ['NCRP', 'I4C', 'CFCFRMS', 'TMS', 'FraudMonitoring', 'Manual']

export default function AlertsPage() {
  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    account: '', complaint_id: '', source: 'NCRP', amount: '', description: '',
  })

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [a, s] = await Promise.all([listAlerts(), fetchAlertStats().catch(() => null)])
      setAlerts(a); setStats(s)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    if (!form.account.trim()) { setError('Account is required'); return }
    setBusy(true); setError(null); setResult(null)
    try {
      const payload = {
        account: form.account.trim(),
        complaint_id: form.complaint_id.trim(),
        source: form.source,
        amount: form.amount === '' ? null : Number(form.amount),
        description: form.description.trim(),
      }
      const res = await ingestAlert(payload)
      setResult(res)
      setForm((f) => ({ ...f, account: '', complaint_id: '', amount: '', description: '' }))
      load()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-canvas text-content-hi">
      <header className="sticky top-0 z-20 border-b border-edge bg-surface/80 backdrop-blur">
        <div className="mx-auto max-w-[1400px] px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-brand-gradient grid place-items-center">
              <Inbox className="h-5 w-5 text-white" />
            </span>
            <div>
              <h1 className="font-display font-bold text-lg leading-none">Alert Ingestion</h1>
              <p className="text-xs text-content-md mt-0.5">Fuse external fraud alerts with ML detection</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="btn-ghost gap-2"><RefreshCw className="h-4 w-4" /> Refresh</button>
            <Link to="/dashboard" className="btn-soft gap-2"><ArrowLeft className="h-4 w-4" /> Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-6">
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatTile label="Alerts ingested" value={stats.total} />
            <StatTile label="Matched to mule" value={stats.matched} />
            <StatTile label="On watchlist" value={stats.watchlist} />
            <StatTile label="Feed sources" value={Object.keys(stats.by_source || {}).length} />
          </div>
        )}

        {error && (
          <div className="card p-4 mb-6 risk-critical-text risk-critical-bg risk-critical-border flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="panel p-5">
            <h2 className="font-display font-bold text-sm flex items-center gap-2 mb-1">
              <FileWarning className="h-4 w-4" /> Ingest external fraud alert
            </h2>
            <p className="text-[11px] text-content-lo mb-4">
              Simulated intake — designed to connect to live NCRP / I4C / CFCFRMS / TMS feeds in production.
            </p>

            <div className="space-y-3">
              <Field label="Reported account *">
                <input value={form.account} onChange={set('account')} placeholder="e.g. 4821"
                  className="w-full rounded-lg bg-canvas border border-edge px-3 py-2 text-sm outline-none focus:border-brand-600" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Complaint / ticket ID">
                  <input value={form.complaint_id} onChange={set('complaint_id')} placeholder="NCRP-2026-00123"
                    className="w-full rounded-lg bg-canvas border border-edge px-3 py-2 text-sm outline-none focus:border-brand-600" />
                </Field>
                <Field label="Source">
                  <select value={form.source} onChange={set('source')}
                    className="w-full rounded-lg bg-canvas border border-edge px-3 py-2 text-sm outline-none focus:border-brand-600">
                    {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Reported amount (optional)">
                <input value={form.amount} onChange={set('amount')} type="number" placeholder="e.g. 250000"
                  className="w-full rounded-lg bg-canvas border border-edge px-3 py-2 text-sm outline-none focus:border-brand-600" />
              </Field>
              <Field label="Description (optional)">
                <textarea value={form.description} onChange={set('description')} rows={2} placeholder="Victim complaint details…"
                  className="w-full rounded-lg bg-canvas border border-edge px-3 py-2 text-sm outline-none focus:border-brand-600 resize-none" />
              </Field>
              <button onClick={submit} disabled={busy} className="btn-brand w-full justify-center gap-2">
                <Send className="h-4 w-4" /> {busy ? 'Cross-matching…' : 'Ingest & cross-match'}
              </button>
            </div>

            {result && <MatchResult result={result} />}
          </section>

          <section className="panel p-5">
            <h2 className="font-display font-bold text-sm flex items-center gap-2 mb-3">
              <Inbox className="h-4 w-4" /> Recent ingested alerts
            </h2>
            {loading ? (
              <p className="text-sm text-content-md py-12 text-center">Loading…</p>
            ) : alerts.length === 0 ? (
              <p className="text-xs text-content-lo py-12 text-center">
                No alerts ingested yet. Submit one on the left to see the cross-match.
              </p>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto scroll-thin pr-1">
                {alerts.map((a) => <AlertRow key={a.id} a={a} />)}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-content-md">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function StatTile({ label, value }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-content-md">{label}</p>
      <p className="num text-2xl font-bold mt-1">{value}</p>
    </div>
  )
}

function MatchResult({ result }) {
  if (result.matched) {
    return (
      <div className="mt-4 card p-4 risk-critical-border">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 risk-critical-text" />
          <span className="font-display font-bold text-sm risk-critical-text">Match — already flagged</span>
        </div>
        <p className="text-sm mt-2">
          Account <span className="font-mono font-semibold">{result.account}</span> is already a detected mule
          {result.matched_risk != null && <> at risk <span className="num font-bold">{Math.round(result.matched_risk)}</span></>}
          {result.matched_case_id && <> (case #{result.matched_case_id})</>}.
        </p>
        <p className="text-[11px] text-content-lo mt-1.5">
          External alert attached to the case audit trail. Open Case Management to action it.
        </p>
        <Link to="/cases" className="btn-soft mt-3 inline-flex gap-2 text-sm">
          <ShieldCheck className="h-4 w-4" /> Go to case
        </Link>
      </div>
    )
  }
  return (
    <div className="mt-4 card p-4 risk-watch-border">
      <div className="flex items-center gap-2">
        <Eye className="h-5 w-5 risk-watch-text" />
        <span className="font-display font-bold text-sm risk-watch-text">No prior detection — watchlisted</span>
      </div>
      <p className="text-sm mt-2">
        Account <span className="font-mono font-semibold">{result.account}</span> was not flagged by the model.
        It has been added to the watchlist for monitoring.
      </p>
    </div>
  )
}

function AlertRow({ a }) {
  const matched = a.status === 'matched'
  return (
    <div className={`card p-3 ${matched ? 'risk-critical-border' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-semibold">{a.account}</span>
        <span className={`chip text-[10px] ${matched
          ? 'risk-critical-text risk-critical-bg risk-critical-border'
          : 'risk-watch-text risk-watch-bg risk-watch-border'}`}>
          {matched ? 'matched' : 'watchlist'}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[11px] text-content-lo">
        <span className="chip chip-neutral text-[10px]">{a.source}</span>
        {a.complaint_id && <span>{a.complaint_id}</span>}
        {a.amount != null && <span>· ₹{Number(a.amount).toLocaleString('en-IN')}</span>}
      </div>
    </div>
  )
}