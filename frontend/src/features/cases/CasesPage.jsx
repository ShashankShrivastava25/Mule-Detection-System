import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Snowflake,
  PauseCircle,
  Send,
  CheckCircle2,
  Clock,
  FileText,
  X,
  AlertTriangle,
  Download,
} from "lucide-react";
import {
  listCases,
  getCase,
  changeStatus,
  takeAction,
  addNote,
  fetchStats,
  reportUrl,
} from "./lib/casesApi.js";

const COLUMNS = [
  { key: "new", label: "New", hint: "Awaiting triage" },
  { key: "reviewing", label: "Under Review", hint: "Being investigated" },
  { key: "action_taken", label: "Action Taken", hint: "Intervention applied" },
  { key: "closed", label: "Closed", hint: "Resolved" },
];

const TIER_CLS = {
  critical: "risk-critical-text risk-critical-bg risk-critical-border",
  suspicious: "risk-suspicious-text risk-suspicious-bg risk-suspicious-border",
  watch: "risk-watch-text risk-watch-bg risk-watch-border",
  safe: "risk-safe-text risk-safe-bg risk-safe-border",
};

const ACTIONS = [
  { key: "FREEZE", label: "Freeze", icon: Snowflake },
  { key: "HOLD", label: "Hold", icon: PauseCircle },
  { key: "REPORT_FIU", label: "Report to FIU", icon: Send },
  { key: "CLEAR", label: "Clear", icon: CheckCircle2 },
];

export default function CasesPage() {
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, s] = await Promise.all([
        listCases(),
        fetchStats().catch(() => null),
      ]);
      setCases(c);
      setStats(s);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCase = async (id) => {
    try {
      setSelected(await getCase(id));
    } catch (e) {
      setError(e.message);
    }
  };
  const refreshSelected = (updated) => {
    setSelected(updated);
    setCases((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
    );
  };

  return (
    <div className="min-h-screen bg-canvas text-content-hi">
      <header className="sticky top-0 z-20 border-b border-edge bg-surface/80 backdrop-blur">
        <div className="mx-auto max-w-[1400px] px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-brand-gradient grid place-items-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </span>
            <div>
              <h1 className="font-display font-bold text-lg leading-none">
                Case Management
              </h1>
              <p className="text-xs text-content-md mt-0.5">
                Investigate, act, and audit flagged accounts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="btn-ghost gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <Link to="/dashboard" className="btn-soft gap-2">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-6">
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <StatTile label="Total cases" value={stats.total_cases} />
            <StatTile label="New" value={stats.by_status?.new ?? 0} />
            <StatTile
              label="Reviewing"
              value={stats.by_status?.reviewing ?? 0}
            />
            <StatTile
              label="Action taken"
              value={stats.by_status?.action_taken ?? 0}
            />
            <StatTile label="Analyses run" value={stats.total_runs ?? 0} />
          </div>
        )}

        {error && (
          <div className="card p-4 mb-6 risk-critical-text risk-critical-bg risk-critical-border flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> {error}
          </div>
        )}

        {loading ? (
          <div className="text-content-md text-sm py-20 text-center">
            Loading cases…
          </div>
        ) : cases.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {COLUMNS.map((col) => {
              const items = cases.filter((c) => c.status === col.key);
              return (
                <div key={col.key} className="panel p-3">
                  <div className="flex items-center justify-between px-1 mb-3">
                    <div>
                      <h2 className="font-display font-bold text-sm">
                        {col.label}
                      </h2>
                      <p className="text-[11px] text-content-lo">{col.hint}</p>
                    </div>
                    <span className="chip chip-neutral text-xs">
                      {items.length}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {items.map((c) => (
                      <CaseCard
                        key={c.id}
                        c={c}
                        onClick={() => openCase(c.id)}
                      />
                    ))}
                    {items.length === 0 && (
                      <p className="text-[11px] text-content-lo px-1 py-6 text-center">
                        No cases
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selected && (
        <CaseDrawer
          c={selected}
          onClose={() => setSelected(null)}
          onUpdate={refreshSelected}
          afterChange={load}
        />
      )}
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-content-md">{label}</p>
      <p className="num text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function CaseCard({ c, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card card-hover w-full text-left p-3.5"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-semibold">{c.account}</span>
        <span className={`chip text-[11px] ${TIER_CLS[c.tier] || ""}`}>
          {c.tier}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-content-md">Risk</span>
        <span className="num text-sm font-bold">
          {Math.round(c.risk_score)}
        </span>
      </div>
      {c.recommended_action && (
        <p className="mt-2 text-[11px] text-content-lo">
          Recommended:{" "}
          <span className="text-brand-600 dark:text-brand-300 font-medium">
            {c.recommended_action}
          </span>
        </p>
      )}
      {c.flag_count > 1 && (
        <p className="mt-1 text-[11px] text-content-lo">
          Flagged {c.flag_count}×
        </p>
      )}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="card p-12 text-center">
      <div className="mx-auto h-12 w-12 rounded-xl bg-brand/10 grid place-items-center mb-4">
        <ShieldCheck className="h-6 w-6 text-brand-600 dark:text-brand-300" />
      </div>
      <h3 className="font-display font-bold text-lg">No cases yet</h3>
      <p className="text-sm text-content-md mt-1 max-w-md mx-auto">
        Run an analysis on the dashboard — flagged accounts will appear here as
        cases ready to investigate, action, and audit.
      </p>
      <Link to="/dashboard" className="btn-brand mt-5 inline-flex">
        Go to dashboard
      </Link>
    </div>
  );
}

function CaseDrawer({ c, onClose, onUpdate, afterChange }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const wrap = async (fn) => {
    setBusy(true);
    try {
      const updated = await fn();
      onUpdate(updated);
      afterChange();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-md h-full bg-surface border-l border-edge overflow-y-auto scroll-thin">
        <div className="sticky top-0 bg-surface/90 backdrop-blur border-b border-edge px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold">{c.account}</span>
            <span className={`chip text-[11px] ${TIER_CLS[c.tier] || ""}`}>
              {c.tier}
            </span>
          </div>
          <button onClick={onClose} className="btn-ghost p-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Risk" value={Math.round(c.risk_score)} />
            <MiniStat
              label="Prediction"
              value={c.prediction === 1 ? "Mule" : "Legit"}
            />
            <MiniStat label="Flags" value={c.flag_count} />
          </div>

          <div>
            <p className="text-xs font-semibold text-content-md mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {["new", "reviewing", "action_taken", "closed"].map((s) => (
                <button
                  key={s}
                  disabled={busy || c.status === s}
                  onClick={() => wrap(() => changeStatus(c.id, s))}
                  className={`chip text-xs ${c.status === s ? "chip-brand" : "chip-neutral"}`}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-content-md mb-2">
              Prevention action
              {c.recommended_action && (
                <span className="text-content-lo font-normal">
                  {" "}
                  · recommended: {c.recommended_action}
                </span>
              )}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ACTIONS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  disabled={busy}
                  onClick={() => wrap(() => takeAction(c.id, key, note))}
                  className="btn-soft justify-start gap-2 text-sm"
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
            {c.last_action && (
              <p className="text-[11px] text-content-lo mt-2">
                Last action: {c.last_action}
              </p>
            )}
          </div>
          {/* Compliance report */}
          <div>
            <p className="text-xs font-semibold text-content-md mb-2">
              Compliance
            </p>
            <a
              href={reportUrl(c.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-brand w-full justify-center gap-2 text-sm"
            >
              <Download className="h-4 w-4" /> Generate SAR (PDF)
            </a>
            <p className="text-[11px] text-content-lo mt-1.5">
              Suspicious Activity Report with full audit trail · times in IST
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-content-md mb-2">
              Add note
            </p>
            <div className="flex gap-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Investigation note…"
                className="flex-1 rounded-lg bg-canvas border border-edge px-3 py-2 text-sm outline-none focus:border-brand-600"
              />
              <button
                disabled={busy || !note.trim()}
                onClick={() =>
                  wrap(async () => {
                    const u = await addNote(c.id, note);
                    setNote("");
                    return u;
                  })
                }
                className="btn-brand px-3"
              >
                <FileText className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-content-md mb-3 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Audit trail{" "}
              <span className="text-content-lo font-normal">· append-only</span>
            </p>
            <ol className="relative border-l border-edge pl-4 space-y-4">
              {(c.audit || []).map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-gradient" />
                  <p className="text-sm">{a.detail}</p>
                  <p className="text-[11px] text-content-lo mt-0.5">
                    {a.event_type} · {a.actor} · {fmt(a.created_at)}
                  </p>
                </li>
              ))}
              {(!c.audit || c.audit.length === 0) && (
                <li className="text-[11px] text-content-lo">No events yet.</li>
              )}
            </ol>
          </div>
        </div>
      </aside>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="card p-3 text-center">
      <p className="text-[11px] text-content-lo">{label}</p>
      <p className="num text-lg font-bold mt-0.5">{value}</p>
    </div>
  );
}

function fmt(iso) {
  if (!iso) return "";
  try {
    return (
      new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) +
      " IST"
    );
  } catch {
    return iso;
  }
}
