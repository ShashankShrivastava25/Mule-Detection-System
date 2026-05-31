import { styleForScore } from '../lib/risk.js'

export default function RiskBadge({ score }) {
  const s = styleForScore(score)
  return (
    <span className={`chip ${s.bg} ${s.text} ${s.border}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
      <span className="num">{Number(score).toFixed(1)}%</span>
      <span className="text-[10px] uppercase tracking-wider opacity-80">{s.label}</span>
    </span>
  )
}
