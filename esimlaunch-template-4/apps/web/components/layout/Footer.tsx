'use client';

import Link from 'next/link';
import { useStoreConfig } from '@/contexts/StoreConfigContext';

const COLS = [
  {
    heading: 'Shop',
    links: [
      { label: 'All Destinations', href: '/' },
      { label: 'Asia', href: '/regions/asia' },
      { label: 'Europe', href: '/regions/europe' },
      { label: 'Americas', href: '/regions/north-america' },
      { label: 'Global Plans', href: '/regions/global' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Help Center', href: '/help-center' },
      { label: 'Setup Guide', href: '/esim-setup-guide' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'My eSIMs', href: '/my-esims' },
      { label: 'Orders', href: '/account/orders' },
      { label: 'Settings', href: '/account/settings' },
      { label: 'Referrals', href: '/account/affiliate' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Refund Policy', href: '/refund' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  },
];

export function Footer() {
  const { branding, templateSettings } = useStoreConfig();
  const businessName = branding.businessName ?? 'eSIM';
  const logoUrl = branding.logoUrl;
  const contactEmail = (templateSettings as { contactEmail?: string } | undefined)?.contactEmail;

  return (
    <footer className="bg-canvas">
      {/* Main grid */}
      <div className="page-container-wide border-t border-rule py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand col */}
          <div className="lg:col-span-1">
            {logoUrl ? (
              <img src={logoUrl} alt={businessName} className="mb-4 h-6 w-auto object-contain" />
            ) : (
              <p className="mb-4 text-base font-semibold text-void">{businessName}</p>
            )}
            <p className="text-sm leading-relaxed text-dim">
              Premium eSIM connectivity for global travelers. Instant activation, no plastic.
            </p>
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="mt-3 block text-sm text-link hover:underline">
                {contactEmail}
              </a>
            )}
          </div>

          {/* Link cols */}
          {COLS.map(col => (
            <div key={col.heading}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-dim">{col.heading}</p>
              <ul className="space-y-2.5">
                {col.links.map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-dim no-underline transition-colors hover:text-void">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar — Apple's gray bottom strip */}
      <div className="border-t border-rule" style={{ background: '#e8e8ed' }}>
        <div className="page-container-wide flex flex-col items-start justify-between gap-3 py-4 sm:flex-row sm:items-center">
          <p className="text-xs text-dim">
            Copyright © {new Date().getFullYear()} {businessName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-dim">Payments via Stripe</span>
            <div className="flex gap-1.5">
              {['VISA', 'MC', 'AMEX'].map(b => (
                <span
                  key={b}
                  className="flex h-5 w-9 items-center justify-center rounded border border-rule bg-surface text-[10px] font-bold text-dim"
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
