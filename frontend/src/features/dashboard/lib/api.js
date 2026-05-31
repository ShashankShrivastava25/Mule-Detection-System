const BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:5000'

export async function checkHealth() {
  const r = await fetch(`${BASE}/health`)
  if (!r.ok) throw new Error(`Health check failed (${r.status})`)
  return r.json()
}

export async function fetchMetrics() {
  const r = await fetch(`${BASE}/metrics`)
  if (!r.ok) throw new Error(`Metrics fetch failed (${r.status})`)
  return r.json()
}

export async function uploadCsvForPrediction(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${BASE}/predict`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText || '{}')
        if (xhr.status >= 200 && xhr.status < 300) resolve(body)
        else reject(new Error(body.error || `Server returned ${xhr.status}`))
      } catch (err) {
        reject(new Error('Could not parse server response.'))
      }
    }
    xhr.onerror = () => reject(new Error('Network error. Is the backend running?'))
    const form = new FormData()
    form.append('file', file)
    xhr.send(form)
  })
}
