'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Globe, ArrowRight } from 'lucide-react';
import { CountryCard } from '@/components/CountryCard';
import { CountrySkeleton } from '@/components/skeletons/CountrySkeleton';
import { apiFetch } from '@/lib/apiClient';
import { getCountriesForRegion, REGION_NAMES } from '@/lib/regions';
import type { Location } from '@/lib/types';
import type { Region } from '@/lib/regions';
import { getCountryName } from '@/lib/country-slugs';

const VALID_REGIONS: Region[] = [
  'asia',
  'europe',
  'north-america',
  'south-america',
  'africa',
  'oceania',
  'global',
];

export default function RegionPage({
  params,
}: {
  params: { region: string };
}) {
  const regionSlug = params.region as Region;
  const regionName = REGION_NAMES[regionSlug] ?? regionSlug;
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (regionSlug === 'global') {
      setLoading(false);
      return;
    }
    if (!VALID_REGIONS.includes(regionSlug)) {
      setLoading(false);
      return;
    }

    apiFetch<Location[]>('/esim/locations')
      .then((data) => setLocations(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [regionSlug]);

  const countries = useMemo(() => {
    if (regionSlug === 'global') return [];
    const regionCodes = getCountriesForRegion(regionSlug);
    const list = locations.filter(
      (l) => l.type === 1 && regionCodes.includes(l.code.toUpperCase())
    );
    return list.sort((a, b) => {
      const nameA = a.name?.length > 3 ? a.name : getCountryName(a.code);
      const nameB = b.name?.length > 3 ? b.name : getCountryName(b.code);
      return nameA.localeCompare(nameB);
    });
  }, [locations, regionSlug]);

  if (!VALID_REGIONS.includes(regionSlug)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-center px-4"
        style={{ background: 'var(--night)' }}
      >
        <div>
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text)' }}>
            Region not found
          </h1>
          <Link
            href="/"
            className="text-sm transition-colors hover:opacity-80"
            style={{ color: 'var(--electric)' }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

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
              <span className="section-label mb-2 inline-block">Region</span>
              <h1 className="text-3xl font-bold md:text-4xl" style={{ color: 'var(--text)' }}>
                {regionName} eSIM Plans
              </h1>
              <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
                {regionSlug === 'global'
                  ? 'Choose from our global coverage plans'
                  : `Browse eSIM plans for countries in ${regionName}`}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {regionSlug === 'global' ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
              Global eSIM Plans
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { href: '/countries/global-120-esim', label: 'Global (120+ areas)', sub: '120+ countries coverage' },
                { href: '/countries/global-139-esim', label: 'Global (130+ areas)', sub: '130+ countries coverage' },
              ].map(({ href, label, sub }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center justify-between rounded-xl p-6 transition-all"
                  style={{
                    background: 'var(--night-50)',
                    border: '1px solid var(--border)',
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
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: 'rgba(79,126,255,0.12)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span className="text-xs font-bold" style={{ color: 'var(--electric)' }}>
                        GL
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                        {label}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {sub}
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    className="h-5 w-5 transition-transform group-hover:translate-x-1"
                    style={{ color: 'var(--text-muted)' }}
                  />
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
              Countries in {regionName}{' '}
              {!loading && (
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                  ({countries.length})
                </span>
              )}
            </h2>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <CountrySkeleton key={i} />
                ))}
              </div>
            ) : countries.length === 0 ? (
              <div
                className="rounded-2xl py-20 text-center text-sm"
                style={{
                  background: 'var(--night-50)',
                  border: '2px dashed var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                No countries found for this region
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {countries.map((loc) => (
                  <CountryCard
                    key={loc.code}
                    country={{
                      code: loc.code,
                      name: loc.name,
                      slug: loc.slug,
                      flagUrl: loc.flagUrl,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
