'use client';

import Link from 'next/link';
import { useStoreConfig } from '@/contexts/StoreConfigContext';

const POPULAR_SLUGS = [
  { name: 'Japan', slug: 'japan-esim' },
  { name: 'France', slug: 'france-esim' },
  { name: 'Thailand', slug: 'thailand-esim' },
  { name: 'United Kingdom', slug: 'united-kingdom-esim' },
  { name: 'United States', slug: 'united-states-esim' },
  { name: 'Australia', slug: 'australia-esim' },
  { name: 'South Korea', slug: 'south-korea-esim' },
  { name: 'Singapore', slug: 'singapore-esim' },
];

const LINKS = [
  { label: 'Explore', href: '/' },
  { label: 'Regions', href: '/regions' },
  { label: 'My eSIMs', href: '/my-esims' },
  { label: 'How it works', href: '/faq' },
  { label: 'Support', href: '/support' },
  { label: 'About', href: '/about' },
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Refund', href: '/refund' },
  { label: 'Cookies', href: '/cookies' },
];

export function Footer() {
  const { branding, templateSettings } = useStoreConfig();
  const businessName = branding.businessName ?? 'ROAM';
  const logoUrl = branding.logoUrl;
  const contactEmail = (templateSettings as { contactEmail?: string } | undefined)?.contactEmail;

  return (
    <footer style={{ background: 'var(--night-50)', borderTop: '1px solid var(--border)' }}>
      <div className="page-container py-14">
        {/* Top row */}
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="mb-4 flex items-center gap-2.5">
              {logoUrl ? (
                <img src={logoUrl} alt={businessName} className="h-8 w-auto object-contain" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-card" style={{ background: 'linear-gradient(135deg, #4f7eff, #00e5c0)' }} />
              )}
              <span className="gradient-text text-base font-bold">{businessName}</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Premium eSIM connectivity for 190+ countries. No roaming fees, no plastic, no waiting.
            </p>
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="mt-3 inline-block text-sm" style={{ color: 'var(--electric)' }}>
                {contactEmail}
              </a>
            )}

            {/* Stats chips */}
            <div className="mt-5 flex flex-wrap gap-2">
              {['190+ Countries', 'Instant Delivery', 'SSL Secure'].map(t => (
                <span
                  key={t}
                  className="rounded-pill px-3 py-1 text-xs font-medium"
                  style={{ background: 'rgba(79,126,255,0.1)', color: '#85abff', border: '1px solid rgba(79,126,255,0.2)' }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-sm transition-colors hover:text-void no-underline"
                style={{ color: 'var(--text-muted)' }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Destinations */}
        <div className="mt-10 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Popular Destinations</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SLUGS.map(({ name, slug }) => (
              <Link
                key={slug}
                href={`/countries/${slug}`}
                className="rounded-pill px-3 py-1.5 text-xs font-medium transition-all no-underline hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}
                onMouseEnter={e => {
                  (e.target as HTMLElement).style.borderColor = 'rgba(0,229,192,0.4)';
                  (e.target as HTMLElement).style.color = 'var(--text)';
                }}
                onMouseLeave={e => {
                  (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                  (e.target as HTMLElement).style.color = 'var(--text-muted)';
                }}
              >
                {name}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 pt-6 sm:flex-row" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} {businessName}. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Secured by Stripe</span>
            <div className="flex gap-1.5">
              {['VISA', 'MC', 'AMEX'].map(b => (
                <span
                  key={b}
                  className="flex h-6 w-9 items-center justify-center rounded text-[10px] font-bold"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
