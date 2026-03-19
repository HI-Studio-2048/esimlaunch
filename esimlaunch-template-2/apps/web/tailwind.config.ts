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
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-inter)', 'monospace'],
      },
      fontSize: {
        'display-xl': ['4rem', { lineHeight: '1.05', letterSpacing: '-0.04em', fontWeight: '800' }],
        'display-lg': ['3rem', { lineHeight: '1.08', letterSpacing: '-0.03em', fontWeight: '800' }],
        'display-md': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '700' }],
        'display-sm': ['1.75rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
      },
      colors: {
        ink: {
          DEFAULT: '#0a0e1a',
          secondary: '#3a3f52',
          muted: '#7c84a0',
          faint: '#b8bccd',
        },
        surface: {
          DEFAULT: '#ffffff',
          soft: '#f7f8fc',
          muted: '#eef0f6',
          border: '#e2e5ef',
        },
        teal: {
          DEFAULT: '#00c9a7',
          50: '#e6faf6',
          100: '#b3f0e3',
          200: '#66e0c6',
          300: '#33d3b4',
          400: '#00c9a7',
          500: '#00b594',
          600: '#009e81',
          700: '#00856b',
          800: '#006b56',
          900: '#004a3c',
        },
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-up': 'fade-up 0.4s ease-out',
      },
      borderRadius: {
        card: '0.75rem',
        'card-lg': '1rem',
        btn: '0.5rem',
      },
      boxShadow: {
        card: '0 1px 4px 0 rgba(10,14,26,0.06), 0 0 0 1px rgba(10,14,26,0.06)',
        'card-hover': '0 8px 24px -4px rgba(10,14,26,0.12), 0 0 0 1px rgba(10,14,26,0.08)',
        'input-focus': '0 0 0 3px rgba(0,201,167,0.18)',
        nav: '0 1px 0 0 #e2e5ef',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
