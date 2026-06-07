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

export function ingestAlert(payload) {
  return json('/alerts/ingest', { method: 'POST', body: JSON.stringify(payload) })
}
export function listAlerts(status) {
  const q = status ? `?status=${encodeURIComponent(status)}` : ''
  return json(`/alerts${q}`)
}
export function fetchAlertStats() {
  return json('/alerts/stats')
}