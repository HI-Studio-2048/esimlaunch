'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Globe, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CountryCard } from '@/components/CountryCard';
import { CountrySkeleton } from '@/components/skeletons/CountrySkeleton';
import { apiFetch } from '@/lib/apiClient';
import { getCountriesForRegion, getRegionForCountry, REGION_NAMES } from '@/lib/regions';
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
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Region not found</h1>
        <Link href="/" className="mt-4 inline-block text-violet-600 hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <Link href="/">
        <Button variant="ghost" className="mb-6 pl-0 text-slate-600 hover:bg-transparent hover:text-slate-900">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>
      </Link>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-violet-500/10 to-purple-500/10 p-8 md:p-12">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-violet-300 bg-white">
            <Globe className="h-10 w-10 text-violet-600" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
              {regionName} eSIM Plans
            </h1>
            <p className="mt-2 text-slate-600">
              {regionSlug === 'global'
                ? 'Choose from our global coverage plans'
                : `Browse eSIM plans for countries in ${regionName}`}
            </p>
          </div>
        </div>
      </div>

      {regionSlug === 'global' ? (
        <div className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Global eSIM Plans</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <Link
              href="/countries/global-120-esim"
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-violet-200 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-xs font-bold text-slate-500">GL</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Global (120+ areas)</h3>
                  <p className="text-sm text-slate-600">120+ countries coverage</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 transition-colors group-hover:text-violet-600" />
            </Link>
            <Link
              href="/countries/global-139-esim"
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-violet-200 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-xs font-bold text-slate-500">GL</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Global (130+ areas)</h3>
                  <p className="text-sm text-slate-600">130+ countries coverage</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 transition-colors group-hover:text-violet-600" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">
            Countries in {regionName} ({countries.length})
          </h2>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <CountrySkeleton key={i} />
              ))}
            </div>
          ) : countries.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-20 text-center text-slate-600">
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
  );
}
