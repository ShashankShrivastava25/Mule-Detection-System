/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ---- Semantic, theme-aware tokens (backed by CSS vars) ----
        canvas:  'rgb(var(--canvas) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          2: 'rgb(var(--surface-2) / <alpha-value>)',
          3: 'rgb(var(--surface-3) / <alpha-value>)',
        },
        sidebar: {
          DEFAULT: 'rgb(var(--sidebar) / <alpha-value>)',
          hover: 'rgb(var(--sidebar-hover) / <alpha-value>)',
        },
        content: {
          hi: 'rgb(var(--content-hi) / <alpha-value>)',
          md: 'rgb(var(--content-md) / <alpha-value>)',
          lo: 'rgb(var(--content-lo) / <alpha-value>)',
        },
        edge: {
          DEFAULT: 'rgb(var(--edge) / <alpha-value>)',
        },
        // ---- Brand (indigo / violet) — constant across themes ----
        brand: {
          DEFAULT: '#6366f1',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        violet: {
          DEFAULT: '#8b5cf6',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        // ---- Risk states ----
        risk: {
          safe: '#22c55e',
          watch: '#f59e0b',
          suspicious: '#f97316',
          critical: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(var(--shadow) / 0.06), 0 1px 3px rgb(var(--shadow) / 0.05)',
        'card-hover': '0 10px 30px rgb(var(--shadow) / 0.10), 0 4px 8px rgb(var(--shadow) / 0.06)',
        soft: '0 4px 24px rgb(var(--shadow) / 0.08)',
        glow: '0 0 0 1px rgb(99 102 241 / 0.25), 0 12px 40px rgb(99 102 241 / 0.25)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'hero-gradient': 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4c1d95 100%)',
      },
      keyframes: {
        'pulse-slow': { '0%,100%': { opacity: '0.55' }, '50%': { opacity: '1' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-7px)' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'pulse-slow': 'pulse-slow 2.4s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
}
