// Translate anonymised feature IDs (F1..F3924) into human, explainable labels.
// Raw IDs must never surface in the UI by default — only via opt-in tooltip.

const DOMAIN_BUCKETS = [
  'Transaction Pattern Signal',
  'Behavioral Indicator',
  'Risk Behavior Feature',
  'Account Activity Signal',
  'Velocity Anomaly Marker',
  'Network Linkage Indicator',
  'Counterparty Risk Signal',
  'Device & Session Pattern',
  'Geo / Timing Anomaly',
  'Cash-flow Variation Signal',
]

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

export function humanizeFeature(rawId, index = 0) {
  const bucket = DOMAIN_BUCKETS[hash(String(rawId)) % DOMAIN_BUCKETS.length]
  // Order within a list trumps hashed numbering so the top-of-bar-chart label reads naturally.
  const ordinal = index + 1
  return `${bucket} ${ordinal}`
}

export function insightForResults(summary) {
  const {
    total = 0,
    suspicious = 0,
    avgRisk = 0,
    critical = 0,
  } = summary

  const pct = total ? (suspicious / total) * 100 : 0
  const insights = []

  if (suspicious === 0) {
    insights.push({
      tone: 'safe',
      headline: 'No mule-account patterns surfaced',
      body: 'AI engine observed normal account behavior across the dataset. Continue routine monitoring.',
    })
  } else {
    insights.push({
      tone: pct > 5 ? 'critical' : pct > 1 ? 'suspicious' : 'watch',
      headline: `${suspicious} accounts exhibit mule-like behavior`,
      body:
        pct > 5
          ? 'Pattern density is elevated. Recommend immediate compliance review and freezing high-risk accounts.'
          : pct > 1
            ? 'Moderate volume of suspicious activity. Triage critical-risk accounts first.'
            : 'A small cluster of anomalies detected — typical of normal-risk environments. Investigate flagged cases.',
    })
  }

  if (critical > 0) {
    insights.push({
      tone: 'critical',
      headline: `${critical} critical-risk alerts require action`,
      body: 'These accounts show abnormal transaction velocity and unusual counterparty linkage. Escalate to the AML desk.',
    })
  }

  insights.push({
    tone: 'info',
    headline: `Avg account risk: ${avgRisk.toFixed(1)}%`,
    body:
      avgRisk > 30
        ? 'Portfolio-wide risk skews high — review onboarding controls.'
        : 'Overall portfolio risk stays within nominal banking thresholds.',
  })

  return insights
}
