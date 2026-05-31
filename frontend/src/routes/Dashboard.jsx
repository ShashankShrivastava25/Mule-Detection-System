import { useEffect, useMemo, useRef, useState } from 'react'
import AIInsights from '../features/dashboard/components/AIInsights.jsx'
import AlertCenter from '../features/dashboard/components/AlertCenter.jsx'
import AnomalyCharts from '../features/dashboard/components/AnomalyCharts.jsx'
import ConfusionMatrix from '../features/dashboard/components/ConfusionMatrix.jsx'
import DashboardHero from '../features/dashboard/components/DashboardHero.jsx'
import DatasetUpload from '../features/dashboard/components/DatasetUpload.jsx'
import FeatureImportance from '../features/dashboard/components/FeatureImportance.jsx'
import Footer from '../features/dashboard/components/Footer.jsx'
import FraudRiskTable from '../features/dashboard/components/FraudRiskTable.jsx'
import HeroAnalytics from '../features/dashboard/components/HeroAnalytics.jsx'
import Navbar from '../features/dashboard/components/Navbar.jsx'
import Sidebar from '../features/dashboard/components/Sidebar.jsx'
import SystemStatus from '../features/dashboard/components/SystemStatus.jsx'
import { checkHealth, fetchMetrics, uploadCsvForPrediction } from '../features/dashboard/lib/api.js'
import { riskTier } from '../features/dashboard/lib/risk.js'

function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  const y = el.getBoundingClientRect().top + window.scrollY - 84
  window.scrollTo({ top: y, behavior: 'smooth' })
}

export default function DashboardRoute() {
  const [analysis, setAnalysis] = useState(null)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [lastFileName, setLastFileName] = useState(null)
  const [health, setHealth] = useState({ status: 'unknown', model_loaded: false })
  const [mobileOpen, setMobileOpen] = useState(false)
  const openUploadRef = useRef(null)

  useEffect(() => {
    let mounted = true
    const ping = async () => {
      try {
        const h = await checkHealth()
        if (mounted) setHealth(h)
        if (mounted && !analysis) {
          try {
            const m = await fetchMetrics()
            setAnalysis((prev) =>
              prev || {
                total_accounts_analyzed: 0,
                suspicious_accounts_detected: 0,
                results: [],
                model_metrics: m.model_metrics,
                confusion_matrix: m.confusion_matrix,
                feature_importance: m.feature_importance,
                processing_ms: 0,
              },
            )
          } catch {
            /* metrics warming up */
          }
        }
      } catch {
        if (mounted) setHealth({ status: 'error', model_loaded: false })
      }
    }
    ping()
    const id = setInterval(ping, 30000)
    return () => {
      mounted = false
      clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUpload = async (file) => {
    setError(null)
    setStatus('uploading')
    setProgress(0)
    setLastFileName(file.name)
    try {
      const data = await uploadCsvForPrediction(file, (pct) => {
        setProgress(pct)
        if (pct >= 100) setStatus('analyzing')
      })
      setAnalysis(data)
      setStatus('success')
      setProgress(100)
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  const results = analysis?.results || []
  const stats = useMemo(() => {
    const total = analysis?.total_accounts_analyzed ?? 0
    const suspicious = analysis?.suspicious_accounts_detected ?? 0
    const critical = analysis?.high_risk_alerts ?? results.filter((r) => r['Risk Score'] >= 80).length
    const avgRisk =
      analysis?.average_risk_score ??
      (results.length ? results.reduce((s, r) => s + r['Risk Score'], 0) / results.length : 0)
    const accuracy = analysis?.model_metrics?.accuracy ?? 0
    return { totalAccounts: total, suspicious, critical, avgRisk, accuracy }
  }, [analysis, results])

  const alertCount = results.filter((r) => riskTier(r['Risk Score']) === 'critical').length
  const apiOnline = health.status === 'ok'
  const modelLoaded = !!health.model_loaded
  const datasetLoaded = results.length > 0

  const triggerUpload = () => {
    scrollToId('upload')
    setTimeout(() => openUploadRef.current?.(), 350)
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar online={apiOnline && modelLoaded} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="lg:pl-[260px] min-h-screen flex flex-col">
        <Navbar
          alertCount={alertCount}
          online={apiOnline && modelLoaded}
          onMenu={() => setMobileOpen(true)}
          onUpload={triggerUpload}
        />

        <main className="flex-1 w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <DashboardHero onUpload={triggerUpload} onSample={() => scrollToId('analytics')} />

          <HeroAnalytics stats={stats} />

          <div id="upload">
            <DatasetUpload
              onUpload={handleUpload}
              status={status}
              progress={progress}
              lastFileName={lastFileName}
              registerOpen={(fn) => (openUploadRef.current = fn)}
            />
          </div>

          {error && (
            <div className="card p-4 risk-critical-border risk-critical-bg">
              <span className="text-sm risk-critical-text">⚠ {error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div id="risk-table" className="lg:col-span-2 scroll-mt-24">
              <FraudRiskTable results={results} />
            </div>
            <div id="alerts" className="scroll-mt-24">
              <AlertCenter results={results} />
            </div>
          </div>

          <div id="analytics" className="scroll-mt-24">
            <AnomalyCharts results={results} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div id="insights" className="lg:col-span-2 scroll-mt-24">
              <AIInsights
                summary={{
                  total: stats.totalAccounts,
                  suspicious: stats.suspicious,
                  avgRisk: stats.avgRisk,
                  critical: stats.critical,
                }}
              />
            </div>
            <div id="system" className="scroll-mt-24">
              <SystemStatus
                apiOnline={apiOnline}
                modelLoaded={modelLoaded}
                datasetLoaded={datasetLoaded}
                processingMs={analysis?.processing_ms}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div id="metrics" className="scroll-mt-24">
              <ConfusionMatrix
                confusion={analysis?.confusion_matrix}
                metrics={analysis?.model_metrics}
              />
            </div>
            <div id="drivers" className="scroll-mt-24">
              <FeatureImportance items={analysis?.feature_importance || []} />
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
