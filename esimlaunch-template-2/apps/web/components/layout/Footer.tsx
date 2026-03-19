'use client';

import Link from 'next/link';
import { useStoreConfig } from '@/contexts/StoreConfigContext';

const DESTINATIONS = [
  { name: 'Japan', slug: 'japan-esim' },
  { name: 'France', slug: 'france-esim' },
  { name: 'Thailand', slug: 'thailand-esim' },
  { name: 'United Kingdom', slug: 'united-kingdom-esim' },
  { name: 'United States', slug: 'united-states-esim' },
  { name: 'Australia', slug: 'australia-esim' },
  { name: 'South Korea', slug: 'south-korea-esim' },
  { name: 'Singapore', slug: 'singapore-esim' },
];

const COLUMNS = [
  {
    heading: 'Product',
    links: [
      { label: 'Browse Destinations', href: '/' },
      { label: 'Regional Plans', href: '/regions' },
      { label: 'My eSIMs', href: '/my-esims' },
      { label: 'How It Works', href: '/faq' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Help Center', href: '/help-center' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Submit a Ticket', href: '/support/tickets/new' },
      { label: 'Device Check', href: '/support/device-check' },
      { label: 'eSIM Setup Guide', href: '/esim-setup-guide' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Refund Policy', href: '/refund' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Affiliate Program', href: '/account/affiliate' },
    ],
  },
];

export function Footer() {
  const { branding, templateSettings } = useStoreConfig();
  const businessName = branding.businessName ?? 'eSIM Hub';
  const logoUrl = branding.logoUrl;
  const contactEmail = (templateSettings as { contactEmail?: string } | undefined)?.contactEmail;

  return (
    <footer className="bg-ink text-white">
      {/* ── Top band ────────────────────────────────────────── */}
      <div className="page-container py-14">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr]">

          {/* Brand column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              {logoUrl ? (
                <img src={logoUrl} alt={businessName} className="h-8 w-auto object-contain" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-400 text-base font-bold text-white">e</span>
              )}
              <span className="text-base font-bold">{businessName}</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-white/60">
              Instant eSIM activation in 190+ countries. No roaming fees, no contracts, no plastic waste.
            </p>
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="text-sm text-teal-400 hover:text-teal-300 no-underline">
                {contactEmail}
              </a>
            )}
            {/* Trust markers */}
            <div className="flex flex-wrap gap-3 pt-2">
              {['SSL Secured', '190+ Countries', 'Instant Delivery'].map(t => (
                <span key={t} className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />{t}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map(col => (
            <div key={col.heading}>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/30">
                {col.heading}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/60 no-underline transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Popular destinations row */}
        <div className="mt-12 border-t border-white/10 pt-10">
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/30">
            Popular Destinations
          </h4>
          <div className="flex flex-wrap gap-2">
            {DESTINATIONS.map(d => (
              <Link
                key={d.slug}
                href={`/countries/${d.slug}`}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50 no-underline transition-colors hover:border-teal-400/40 hover:text-white/80"
              >
                {d.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ──────────────────────────────────────── */}
      <div className="border-t border-white/10">
        <div className="page-container flex flex-col items-center justify-between gap-3 py-5 sm:flex-row">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} {businessName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/30">Payments secured by Stripe</span>
            <div className="flex gap-1.5">
              {['VISA', 'MC', 'AMEX'].map(brand => (
                <span key={brand} className="flex h-6 w-9 items-center justify-center rounded border border-white/10 text-[10px] font-bold text-white/40">
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
