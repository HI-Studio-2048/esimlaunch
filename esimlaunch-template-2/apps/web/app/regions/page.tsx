'use client';

import Link from 'next/link';
import { Globe } from 'lucide-react';
import { REGION_ORDER, REGION_NAMES } from '@/lib/regions';

export default function RegionsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center pl-0 text-ink-muted hover:text-ink transition-colors"
      >
        ← Back to Home
      </Link>

      <div className="relative overflow-hidden rounded-card-lg border border-surface-border bg-surface-soft p-8 md:p-12">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-teal-400/40 bg-white">
            <Globe className="h-10 w-10 text-teal-400" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-ink md:text-4xl">
              Browse by Region
            </h1>
            <p className="mt-2 text-ink-muted">
              Explore eSIM plans by continent. Select a region to see available countries.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-6 text-2xl font-bold text-ink">Select a Region</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {REGION_ORDER.map((region) => (
            <Link
              key={region}
              href={`/regions/${region}`}
              className="block rounded-card border border-surface-border bg-white p-6 font-medium text-ink-secondary shadow-sm transition hover:border-teal-400/40 hover:shadow-md hover:text-teal-400"
            >
              {REGION_NAMES[region]}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
