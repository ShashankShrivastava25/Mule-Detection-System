export function riskTier(score) {
  if (score >= 80) return 'critical'
  if (score >= 50) return 'suspicious'
  if (score >= 20) return 'watch'
  return 'safe'
}

// Theme-aware class tokens (defined in index.css). `color` is a vivid hex for
// inline SVG / chart usage and reads well on both light and dark surfaces.
const TIER_STYLES = {
  critical:   { label: 'Critical',   color: '#ef4444', text: 'risk-critical-text',   bg: 'risk-critical-bg',   border: 'risk-critical-border' },
  suspicious: { label: 'Suspicious', color: '#f97316', text: 'risk-suspicious-text', bg: 'risk-suspicious-bg', border: 'risk-suspicious-border' },
  watch:      { label: 'Watch',      color: '#f59e0b', text: 'risk-watch-text',      bg: 'risk-watch-bg',      border: 'risk-watch-border' },
  safe:       { label: 'Nominal',    color: '#22c55e', text: 'risk-safe-text',       bg: 'risk-safe-bg',       border: 'risk-safe-border' },
}

export function styleForTier(tier) {
  return TIER_STYLES[tier] || TIER_STYLES.safe
}

export function styleForScore(score) {
  return styleForTier(riskTier(score))
}
