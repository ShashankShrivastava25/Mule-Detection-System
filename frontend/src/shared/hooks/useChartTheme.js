import { useTheme } from '../theme/ThemeProvider.jsx'

/**
 * Returns theme-aware colors for Recharts (axes, grid, tooltip).
 * Risk/series colors stay vivid in both themes.
 */
export default function useChartTheme() {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  return {
    dark,
    axis: dark ? '#6b7392' : '#9aa0b4',
    axisLabel: dark ? '#9aa3c4' : '#5b6178',
    grid: dark ? 'rgba(148,163,220,0.10)' : 'rgba(15,18,34,0.06)',
    cursor: dark ? 'rgba(148,163,220,0.08)' : 'rgba(15,18,34,0.04)',
    stroke: dark ? '#0b0f1e' : '#ffffff', // pie slice separators
    line: dark ? '#818cf8' : '#6366f1',
    tooltip: {
      background: dark ? '#10142a' : '#ffffff',
      border: dark ? '1px solid rgba(148,163,220,0.16)' : '1px solid rgba(15,18,34,0.10)',
      borderRadius: 12,
      color: dark ? '#eef1fb' : '#0f1222',
      fontSize: 12,
      padding: '8px 10px',
      boxShadow: dark
        ? '0 10px 30px rgba(0,0,0,0.45)'
        : '0 10px 30px rgba(15,23,60,0.10)',
    },
  }
}
