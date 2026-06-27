import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        saffron: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        wisdom: {
          50:  '#fafafa',
          100: '#d4d4d8',
          200: '#a1a1aa',
          300: '#71717a',
          400: '#52525b',
          500: '#3f3f46',
          600: '#27272a',
          700: '#1f1f23',
          800: '#18181b',
          900: '#0c0c0f',
          950: '#09090b',
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
          '0%, 100%': { boxShadow: '0 0 20px rgba(217,119,6,0.1)' },
          '50%':      { boxShadow: '0 0 40px rgba(217,119,6,0.25), 0 0 80px rgba(217,119,6,0.1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        borderGlow: {
          '0%, 100%': { borderColor: 'rgba(217,119,6,0.2)' },
          '50%':      { borderColor: 'rgba(217,119,6,0.5)' },
        },
      },
      boxShadow: {
        'glow':        '0 0 20px rgba(217,119,6,0.15), 0 0 60px rgba(217,119,6,0.05)',
        'glow-strong': '0 0 30px rgba(217,119,6,0.25), 0 0 80px rgba(217,119,6,0.1)',
      },
    },
  },
  plugins: [],
} satisfies Config
