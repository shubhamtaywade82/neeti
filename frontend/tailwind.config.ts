import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        saffron: {
          50:  '#fffcf5',
          100: '#fef0d6',
          200: '#fddab0',
          300: '#fbc07b',
          400: '#fa9d46',
          500: '#f57c1b',
          600: '#e05e11',
          700: '#ba430f',
          800: '#96330f',
          900: '#7b2711',
        },
        wisdom: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Noto Serif Devanagari', 'Georgia', 'serif'],
        body:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in':       'fadeIn 400ms cubic-bezier(0.16,1,0.3,1) both',
        'fade-in-up':    'fadeInUp 400ms cubic-bezier(0.16,1,0.3,1) both',
        'slide-up':      'slideUp 600ms cubic-bezier(0.16,1,0.3,1) both',
        'slide-in-left': 'slideInLeft 400ms cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':      'scaleIn 400ms cubic-bezier(0.16,1,0.3,1) both',
        'pulse-glow':    'pulseGlow 3s ease-in-out infinite',
        'float':         'float 3s ease-in-out infinite',
        'border-glow':   'borderGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:     { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeInUp:   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideUp:    { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInLeft: { from: { opacity: '0', transform: 'translateX(-16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:    { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(245,158,11,0.1)' },
          '50%':      { boxShadow: '0 0 40px rgba(245,158,11,0.25), 0 0 80px rgba(245,158,11,0.1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        borderGlow: {
          '0%, 100%': { borderColor: 'rgba(245,158,11,0.2)' },
          '50%':      { borderColor: 'rgba(245,158,11,0.5)' },
        },
      },
      boxShadow: {
        'glow':        '0 0 20px rgba(245,158,11,0.15), 0 0 60px rgba(245,158,11,0.05)',
        'glow-strong': '0 0 30px rgba(245,158,11,0.25), 0 0 80px rgba(245,158,11,0.1)',
      },
    },
  },
  plugins: [],
} satisfies Config
