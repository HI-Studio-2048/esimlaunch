import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['4.5rem', { lineHeight: '1.0', letterSpacing: '-0.04em', fontWeight: '700' }],
        'display-lg': ['3.25rem', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-md': ['2.5rem', { lineHeight: '1.08', letterSpacing: '-0.025em', fontWeight: '700' }],
        'display-sm': ['1.875rem', { lineHeight: '1.12', letterSpacing: '-0.02em', fontWeight: '600' }],
      },
      colors: {
        night: {
          DEFAULT: '#080b18',
          50: '#0f1224',   // card surface
          100: '#161b30',  // elevated
          200: '#1e2440',  // border-ish
          300: '#2a3158',  // subtle border
          400: '#3a4470',  // muted
        },
        electric: {
          DEFAULT: '#4f7eff',
          50: '#f0f4ff',
          100: '#dce7ff',
          200: '#bad0ff',
          300: '#85abff',
          400: '#4f7eff',
          500: '#2563eb',
          600: '#1d4ed8',
        },
        glow: {
          DEFAULT: '#00e5c0',
          50: '#e0fdf8',
          100: '#b3f7ec',
          400: '#00e5c0',
          500: '#00c9a7',
        },
        void: '#f0f2ff',        // primary text on dark
        haze: '#6b7499',        // muted text on dark
        ghost: 'rgba(255,255,255,0.06)',  // subtle surface
        shimmer: 'rgba(255,255,255,0.1)', // hover surface
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-up': 'fade-up 0.5s ease-out',
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
      },
      borderRadius: {
        card: '1rem',
        'card-lg': '1.5rem',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(79,126,255,0.2)',
        glow: '0 0 24px rgba(79,126,255,0.35)',
        'glow-teal': '0 0 24px rgba(0,229,192,0.3)',
        nav: '0 1px 0 rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
