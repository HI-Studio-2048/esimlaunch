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
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      borderRadius: {
        card: '1rem',
        'card-lg': '1.25rem',
      },
      boxShadow: {
        card: '0 4px 6px -1 rgb(0 0 0 / 0.07), 0 2px 4px -2 rgb(0 0 0 / 0.05)',
        'card-hover': '0 20px 25px -5 rgb(0 0 0 / 0.08), 0 8px 10px -6 rgb(0 0 0 / 0.05)',
        glow: '0 0 40px -10px rgb(14 165 233 / 0.35)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
