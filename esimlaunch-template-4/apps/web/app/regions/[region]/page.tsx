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
        <h1 className="text-2xl font-bold text-[#1d1d1f]">Region not found</h1>
        <Link href="/" className="mt-4 inline-block text-[#0066cc] hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <Link href="/">
        <Button variant="ghost" className="mb-6 pl-0 text-[#6e6e73] hover:bg-transparent hover:text-[#1d1d1f]">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>
      </Link>

      <div className="relative overflow-hidden rounded-[18px] border border-[#d2d2d7] bg-[#f5f5f7] p-8 md:p-12">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-[#d2d2d7] bg-white">
            <Globe className="h-10 w-10 text-[#1d1d1f]" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-[#1d1d1f] md:text-4xl">
              {regionName} eSIM Plans
            </h1>
            <p className="mt-2 text-[#6e6e73]">
              {regionSlug === 'global'
                ? 'Choose from our global coverage plans'
                : `Browse eSIM plans for countries in ${regionName}`}
            </p>
          </div>
        </div>
      </div>

      {regionSlug === 'global' ? (
        <div className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold text-[#1d1d1f]">Global eSIM Plans</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <Link
              href="/countries/global-120-esim"
              className="group flex items-center justify-between rounded-[18px] border border-[#d2d2d7] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition hover:border-[#adadb8] hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border border-[#d2d2d7] bg-[#f5f5f7]">
                  <span className="text-xs font-bold text-[#6e6e73]">GL</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1d1d1f]">Global (120+ areas)</h3>
                  <p className="text-sm text-[#6e6e73]">120+ countries coverage</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-[#adadb8] transition-colors group-hover:text-[#0066cc]" />
            </Link>
            <Link
              href="/countries/global-139-esim"
              className="group flex items-center justify-between rounded-[18px] border border-[#d2d2d7] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition hover:border-[#adadb8] hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border border-[#d2d2d7] bg-[#f5f5f7]">
                  <span className="text-xs font-bold text-[#6e6e73]">GL</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1d1d1f]">Global (130+ areas)</h3>
                  <p className="text-sm text-[#6e6e73]">130+ countries coverage</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-[#adadb8] transition-colors group-hover:text-[#0066cc]" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold text-[#1d1d1f]">
            Countries in {regionName} ({countries.length})
          </h2>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <CountrySkeleton key={i} />
              ))}
            </div>
          ) : countries.length === 0 ? (
            <div className="rounded-[18px] border-2 border-dashed border-[#d2d2d7] bg-[#f5f5f7] py-20 text-center text-[#6e6e73]">
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
