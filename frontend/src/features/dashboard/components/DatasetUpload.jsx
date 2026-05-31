import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, FileSpreadsheet, Loader2, UploadCloud, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

export default function DatasetUpload({ onUpload, status, progress, lastFileName, registerOpen }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState(null)

  // Expose the file-dialog opener so the hero / topbar buttons can trigger it.
  useEffect(() => {
    registerOpen?.(() => inputRef.current?.click())
  }, [registerOpen])

  const handleFiles = useCallback(
    (f) => {
      if (!f) return
      if (!/\.csv$/i.test(f.name) && f.type !== 'text/csv') {
        alert('Please upload a .csv file')
        return
      }
      setFile(f)
      onUpload?.(f)
    },
    [onUpload],
  )

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files?.[0])
  }

  return (
    <section className="card p-6">
      <div className="flex flex-col md:flex-row gap-6 items-stretch">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-xl tracking-tight text-content-hi">Dataset Upload</h2>
            <span className="chip-brand">CSV</span>
          </div>
          <p className="text-sm text-content-md mt-1 max-w-lg">
            Upload your transaction-features CSV. The ensemble engine cleans, scores,
            and surfaces mule-like behavior in real time.
          </p>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`mt-5 w-full rounded-2xl border-2 border-dashed transition-all duration-300 px-6 py-8 text-left flex items-center gap-4 ${
              dragOver
                ? 'border-brand-500 bg-brand/[0.06]'
                : 'border-edge/[0.14] dark:border-edge/[0.18] bg-surface-2 hover:border-brand-400/60 hover:bg-brand/[0.04]'
            }`}
          >
            <div className="h-12 w-12 rounded-xl bg-brand-gradient grid place-items-center shadow-[0_6px_18px_rgb(99_102_241/0.35)]">
              <UploadCloud className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-content-hi font-medium">Drop CSV here or click to browse</p>
              <p className="text-xs text-content-md mt-1">
                Supports .csv up to 200MB · Last analyzed: {lastFileName || '—'}
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files?.[0])}
            />
          </button>

          <AnimatePresence>
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-3 flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-2 border border-edge/[0.08] dark:border-edge/[0.12]"
              >
                <FileSpreadsheet className="h-4 w-4 text-brand-600 dark:text-brand-300" />
                <span className="text-sm text-content-hi flex-1 truncate">{file.name}</span>
                <span className="text-xs num text-content-md">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
                <button
                  onClick={() => setFile(null)}
                  className="h-6 w-6 grid place-items-center rounded hover:bg-surface-3"
                  aria-label="Remove file"
                >
                  <X className="h-3.5 w-3.5 text-content-md" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-full md:w-72 flex flex-col">
          <StatusBlock status={status} progress={progress} />
        </div>
      </div>
    </section>
  )
}

function StatusBlock({ status, progress }) {
  const states = {
    idle:      { color: '#9aa0b4', label: 'Idle — awaiting upload', icon: null },
    uploading: { color: '#6366f1', label: 'Uploading dataset...', icon: Loader2 },
    analyzing: { color: '#f59e0b', label: 'Engine analyzing...', icon: Loader2 },
    success:   { color: '#22c55e', label: 'Analysis complete', icon: CheckCircle2 },
    error:     { color: '#ef4444', label: 'Upload failed', icon: X },
  }
  const s = states[status] || states.idle
  const Icon = s.icon
  const spinning = status === 'uploading' || status === 'analyzing'

  return (
    <div className="rounded-2xl border border-edge/[0.08] dark:border-edge/[0.12] bg-surface-2 p-4 flex-1 min-h-[12rem] flex flex-col">
      <div className="text-[11px] uppercase tracking-wider text-content-md">Pipeline Status</div>
      <div className="mt-3 flex items-center gap-2">
        {Icon && (
          <Icon className={`h-4 w-4 ${spinning ? 'animate-spin' : ''}`} style={{ color: s.color }} />
        )}
        <span className="text-sm font-medium" style={{ color: s.color }}>{s.label}</span>
      </div>

      <div className="mt-4">
        <div className="h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-brand-gradient"
            initial={{ width: 0 }}
            animate={{ width: `${progress ?? 0}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="mt-1 text-[11px] text-content-lo num">{progress ?? 0}%</div>
      </div>

      <ul className="mt-auto pt-4 text-[11px] text-content-md space-y-1.5">
        <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-content-lo" /> Parse CSV → impute missing</li>
        <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-content-lo" /> Score with ensemble</li>
        <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-content-lo" /> Render fraud intelligence</li>
      </ul>
    </div>
  )
}
