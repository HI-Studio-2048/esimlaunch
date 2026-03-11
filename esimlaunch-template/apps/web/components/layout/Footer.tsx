'use client';

import Link from 'next/link';
import { useStoreConfig } from '@/contexts/StoreConfigContext';

const POPULAR_SLUGS: { name: string; slug: string }[] = [
  { name: 'Japan', slug: 'japan-esim' },
  { name: 'France', slug: 'france-esim' },
  { name: 'Thailand', slug: 'thailand-esim' },
  { name: 'United Kingdom', slug: 'united-kingdom-esim' },
  { name: 'Spain', slug: 'spain-esim' },
  { name: 'United States', slug: 'united-states-esim' },
  { name: 'Australia', slug: 'australia-esim' },
  { name: 'Italy', slug: 'italy-esim' },
  { name: 'Germany', slug: 'germany-esim' },
  { name: 'Singapore', slug: 'singapore-esim' },
  { name: 'South Korea', slug: 'south-korea-esim' },
  { name: 'Mexico', slug: 'mexico-esim' },
];

const DEFAULT_PRIMARY = '#6366f1';
const DEFAULT_SECONDARY = '#8b5cf6';

export function Footer() {
  const { branding, templateSettings } = useStoreConfig();
  const businessName = branding.businessName ?? 'eSIM Store';
  const contactEmail = (templateSettings as { contactEmail?: string } | undefined)?.contactEmail;
  const primaryColor = branding.primaryColor ?? DEFAULT_PRIMARY;
  const secondaryColor = branding.secondaryColor ?? DEFAULT_SECONDARY;
  const logoUrl = branding.logoUrl;

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
        {/* Top: logo + tagline + utility links */}
        <div className="flex flex-col gap-8 border-b border-slate-200 pb-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={businessName}
                  className="h-10 w-auto max-w-[160px] object-contain"
                />
              ) : (
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  📶
                </span>
              )}
              <span className="text-xl font-bold text-slate-900">{businessName}</span>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Stay connected on your adventures without hefty roaming fees. eSIMs for 190+ countries worldwide.
            </p>
            {contactEmail && (
              <p className="mt-2 text-sm text-slate-600">
                <a href={`mailto:${contactEmail}`} className="text-violet-600 hover:text-violet-700">{contactEmail}</a>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/contact" className="text-slate-600 hover:text-slate-900">Contact</Link>
            <Link href="/faq" className="text-slate-600 hover:text-slate-900">FAQ</Link>
            <Link href="/support" className="text-slate-600 hover:text-slate-900">Support</Link>
            <Link href="/help-center" className="text-slate-600 hover:text-slate-900">Help Center</Link>
            <Link href="/terms" className="text-slate-600 hover:text-slate-900">Terms of Service</Link>
            <Link href="/privacy" className="text-slate-600 hover:text-slate-900">Privacy Policy</Link>
            <Link href="/refund" className="text-slate-600 hover:text-slate-900">Refund Policy</Link>
            <Link href="/cookies" className="text-slate-600 hover:text-slate-900">Cookie Policy</Link>
            <Link href="/about" className="text-slate-600 hover:text-slate-900">About</Link>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="text-slate-400">🌐</span> English
            </span>
          </div>
        </div>

        {/* Middle: Popular Destinations + Learn More */}
        <div className="grid gap-8 border-b border-slate-200 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="font-semibold text-slate-900">Popular Destinations</h3>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600">
              {POPULAR_SLUGS.map(({ name, slug }) => (
                <Link
                  key={slug}
                  href={`/countries/${slug}`}
                  className="hover:text-slate-900"
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Learn More</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">Destinations</Link>
              <Link href="/my-esims" className="hover:text-slate-900">My eSIMs</Link>
              <Link href="/faq" className="hover:text-slate-900">FAQ</Link>
              <Link href="/support" className="hover:text-slate-900">Support</Link>
              <Link href="/contact" className="hover:text-slate-900">Contact</Link>
            </div>
          </div>
        </div>

        {/* Security badges */}
        <div className="flex flex-wrap justify-center gap-6 py-8 text-sm text-slate-500">
          <span className="flex items-center gap-2">
            <span className="text-emerald-500">🔒</span> PCI DSS Compliant
          </span>
          <span className="flex items-center gap-2">
            <span className="text-emerald-500">🛡️</span> Data Protection
          </span>
          <span className="flex items-center gap-2">
            <span className="text-emerald-500">💳</span> Secure Payments
          </span>
        </div>

        {/* Social links (env-configurable placeholders) */}
        <div className="flex justify-center gap-4 pb-6">
          <a href={process.env.NEXT_PUBLIC_SOCIAL_TWITTER || '#'} className="text-slate-400 hover:text-slate-600" aria-label="Twitter">
            𝕏
          </a>
          <a href={process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || '#'} className="text-slate-400 hover:text-slate-600" aria-label="Facebook">
            f
          </a>
          <a href={process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || '#'} className="text-slate-400 hover:text-slate-600" aria-label="Instagram">
            📷
          </a>
          <a href={process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || '#'} className="text-slate-400 hover:text-slate-600" aria-label="LinkedIn">
            in
          </a>
        </div>

        {/* Bottom: copyright + payment icons */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 sm:flex-row">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} {businessName}. All rights reserved. Powered by esimlaunch
          </p>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="text-xs font-medium">We accept</span>
            <div className="flex gap-2">
              <span className="flex h-8 w-12 items-center justify-center rounded border border-slate-200 bg-white text-xs font-bold text-slate-500">VISA</span>
              <span className="flex h-8 w-12 items-center justify-center rounded border border-slate-200 bg-white text-xs font-bold text-slate-500">MC</span>
              <span className="flex h-8 w-12 items-center justify-center rounded border border-slate-200 bg-white text-xs font-bold text-slate-500">AMEX</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
