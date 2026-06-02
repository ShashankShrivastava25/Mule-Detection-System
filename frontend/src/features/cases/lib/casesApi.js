const BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:5000'

async function json(path, opts) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!r.ok) {
    let msg = `Request failed (${r.status})`
    try { const b = await r.json(); if (b.error) msg = b.error } catch {}
    throw new Error(msg)
  }
  return r.json()
}

export function ingestCases(summary, flagged) {
  return json('/cases/ingest', { method: 'POST', body: JSON.stringify({ summary, flagged }) })
}
export function listCases(status) {
  const q = status ? `?status=${encodeURIComponent(status)}` : ''
  return json(`/cases${q}`)
}
export function getCase(id) { return json(`/cases/${id}`) }
export function changeStatus(id, status, actor = 'analyst') {
  return json(`/cases/${id}/status`, { method: 'POST', body: JSON.stringify({ status, actor }) })
}
export function takeAction(id, action, note = '', actor = 'analyst') {
  return json(`/cases/${id}/action`, { method: 'POST', body: JSON.stringify({ action, note, actor }) })
}
export function addNote(id, note, actor = 'analyst') {
  return json(`/cases/${id}/note`, { method: 'POST', body: JSON.stringify({ note, actor }) })
}
export function fetchHistory() { return json('/cases/history') }
export function fetchStats() { return json('/cases/stats') }

export function buildIngestPayload(analysis, filename) {
  const results = analysis?.results ?? []
  const flagged = results
    .filter((r) => Number(r.Prediction) === 1 || Number(r['Risk Score']) >= 50)
    .map((r) => ({
      account: String(r.Account),
      risk_score: Number(r['Risk Score']) || 0,
      tier: tierFor(Number(r['Risk Score']) || 0),
      prediction: Number(r.Prediction) || 0,
    }))
  const summary = {
    filename: filename || null,
    total_accounts: analysis?.total_accounts_analyzed ?? results.length,
    suspicious_count: analysis?.suspicious_accounts_detected ?? 0,
    high_risk_count: analysis?.high_risk_alerts ?? 0,
    avg_risk: analysis?.average_risk_score ?? 0,
  }
  return { summary, flagged }
}

function tierFor(score) {
  if (score >= 80) return 'critical'
  if (score >= 50) return 'suspicious'
  if (score >= 20) return 'watch'
  return 'safe'
}