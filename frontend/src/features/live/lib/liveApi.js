// Live Monitor data helpers. Separate module; touches nothing else.
const BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:5000'

export function streamUrl({ interval = 1.5, loop = true } = {}) {
  const params = new URLSearchParams({
    interval: String(interval),
    loop: loop ? '1' : '0',
  })
  return `${BASE}/stream/feed?${params.toString()}`
}

export async function fetchStreamStats() {
  const r = await fetch(`${BASE}/stream/stats`)
  if (!r.ok) throw new Error(`Stats failed (${r.status})`)
  return r.json()
}