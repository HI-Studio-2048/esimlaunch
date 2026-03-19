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
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['56px', { lineHeight: '1.0', letterSpacing: '-0.045em', fontWeight: '700' }],
        'display-lg': ['48px', { lineHeight: '1.04', letterSpacing: '-0.04em', fontWeight: '700' }],
        'display-md': ['36px', { lineHeight: '1.08', letterSpacing: '-0.03em', fontWeight: '600' }],
        'display-sm': ['28px', { lineHeight: '1.12', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline': ['22px', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '600' }],
      },
      colors: {
        canvas: '#f5f5f7',       // Apple's signature warm gray — body bg
        void: '#1d1d1f',         // Apple near-black — text, CTAs
        dim: '#6e6e73',          // Apple secondary text
        faint: '#adadb8',        // Apple tertiary
        rule: '#d2d2d7',         // Apple border
        surface: '#ffffff',      // card / section bg
        link: '#0066cc',         // Apple's blue — links/interactive only
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16,1,0.3,1)',
      },
      borderRadius: {
        card: '18px',
        'card-lg': '24px',
        btn: '980px',           // Apple's pill-style CTA button
        'btn-sq': '12px',       // Apple's square button variant
      },
      boxShadow: {
        card: '0 2px 10px rgba(0,0,0,0.04)',
        'card-hover': '0 16px 48px rgba(0,0,0,0.10)',
        nav: '0 1px 0 rgba(0,0,0,0.08)',
        sticky: '0 4px 20px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
