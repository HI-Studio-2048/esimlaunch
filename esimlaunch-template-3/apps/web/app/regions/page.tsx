'use client';

import Link from 'next/link';
import { Globe, ArrowLeft, ArrowRight } from 'lucide-react';
import { REGION_ORDER, REGION_NAMES } from '@/lib/regions';

export default function RegionsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--night)' }}>
      <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
        {/* Back link */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm transition-colors hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Hero banner */}
        <div
          className="relative overflow-hidden rounded-2xl p-8 md:p-12 mb-10"
          style={{
            background: 'var(--night-50)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Glow accent */}
          <div
            className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl opacity-20"
            style={{ background: 'var(--electric)' }}
          />
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
              style={{
                background: 'rgba(79,126,255,0.12)',
                border: '2px solid rgba(79,126,255,0.3)',
              }}
            >
              <Globe className="h-10 w-10" style={{ color: 'var(--electric)' }} />
            </div>
            <div className="text-center md:text-left">
              <span className="section-label mb-2 inline-block">Destinations</span>
              <h1 className="text-3xl font-bold md:text-4xl" style={{ color: 'var(--text)' }}>
                Browse by Region
              </h1>
              <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
                Explore eSIM plans by continent. Select a region to see available countries.
              </p>
            </div>
          </div>
        </div>

        {/* Region grid */}
        <div>
          <h2 className="mb-6 text-xl font-semibold" style={{ color: 'var(--text)' }}>
            Select a Region
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {REGION_ORDER.map((region) => (
              <Link
                key={region}
                href={`/regions/${region}`}
                className="group flex items-center justify-between rounded-xl p-6 font-medium transition-all"
                style={{
                  background: 'var(--night-50)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-bright)';
                  (e.currentTarget as HTMLAnchorElement).style.background = 'var(--night-100)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLAnchorElement).style.background = 'var(--night-50)';
                }}
              >
                <span>{REGION_NAMES[region]}</span>
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  style={{ color: 'var(--text-muted)' }}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
