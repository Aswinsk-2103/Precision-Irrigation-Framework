/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: '#22c55e', dark: '#16a34a', light: '#4ade80' },
        accent:   { DEFAULT: '#38bdf8', dark: '#0ea5e9' },
        surface:  { DEFAULT: '#0f2318', card: '#152b1e', border: '#1f3d2b' },
        bg:       { DEFAULT: '#0a1628', secondary: '#0d1f12' },
        warning:  '#f59e0b',
        danger:   '#ef4444',
        text:     { primary: '#f0fdf4', secondary: '#a3c4a8', muted: '#6b9e78' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        'gradient-accent':  'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
        'gradient-surface': 'linear-gradient(135deg, #152b1e 0%, #0f2318 100%)',
        'gradient-dark':    'linear-gradient(135deg, #0a1628 0%, #0d1f12 100%)',
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(34,197,94,0.25)',
        'glow-blue':  '0 0 20px rgba(56,189,248,0.25)',
        'card':       '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
