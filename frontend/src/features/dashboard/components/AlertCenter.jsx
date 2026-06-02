import { motion } from "framer-motion";
import { AlertTriangle, ShieldAlert, Activity } from "lucide-react";
import { riskTier, styleForScore } from "../lib/risk.js";

const ICON = {
  critical: ShieldAlert,
  suspicious: AlertTriangle,
  watch: Activity,
};

function formatTime(offsetSec) {
  const d = new Date(Date.now() - offsetSec * 1000);
  return d.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AlertCenter({ results = [] }) {
  const alerts = results
    .filter((r) => r["Risk Score"] >= 20)
    .sort((a, b) => b["Risk Score"] - a["Risk Score"])
    .slice(0, 8);

  return (
    <section className="card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl tracking-tight text-content-hi">
            Alert Center
          </h2>
          <p className="text-sm text-content-md">
            Live stream of suspicious accounts
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-content-md">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse-slow" />
          Live
        </div>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto scroll-thin pr-1 space-y-2 max-h-[28rem]">
        {alerts.length === 0 && (
          <div className="text-center py-12 text-content-md text-sm">
            No active alerts. Upload a dataset to begin monitoring.
          </div>
        )}
        {alerts.map((a, i) => {
          const tier = riskTier(a["Risk Score"]);
          const s = styleForScore(a["Risk Score"]);
          const Icon = ICON[tier] || Activity;
          return (
            <motion.div
              key={`${a.Account}-${i}`}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.4,
                delay: i * 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`rounded-xl border ${s.border} ${s.bg} p-3 flex items-start gap-3 transition`}
            >
              <div
                className="h-9 w-9 rounded-lg grid place-items-center shrink-0 border bg-surface"
                style={{ borderColor: `${s.color}55` }}
              >
                <Icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-medium ${s.text}`}>
                    {a.Alert}
                  </span>
                  <span className="text-[11px] text-content-lo num shrink-0">
                    {formatTime(i * 7)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-content-md">
                  Account{" "}
                  <span className="num text-content-hi">
                    #{String(a.Account).padStart(5, "0")}
                  </span>
                  {" · "}Risk{" "}
                  <span className="num" style={{ color: s.color }}>
                    {a["Risk Score"].toFixed(1)}%
                  </span>
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
