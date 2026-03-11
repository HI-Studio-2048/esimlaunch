'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { getSlugFromCode, getCountryName } from '@/lib/country-slugs';
import { cn } from '@/lib/utils';

/** Use full country name instead of 2-letter code when API returns code as name */
function resolveDisplayName(name: string, code: string): string {
  if (!name || name.length <= 3 || name.toUpperCase() === code.toUpperCase()) {
    return getCountryName(code);
  }
  return name;
}

interface CountryCardProps {
  country: {
    code: string;
    name: string;
    slug?: string;
    flagUrl?: string;
    locationLogo?: string;
  };
  lowestPriceUSD?: number;
  planCount?: number;
  loadingSummary?: boolean;
  className?: string;
}

export function CountryCard({
  country,
  lowestPriceUSD = 0,
  planCount = 0,
  loadingSummary = false,
  className,
}: CountryCardProps) {
  const slug =
    country.slug ?? getSlugFromCode(country.code) ?? country.code.toLowerCase();
  const flagUrl = country.flagUrl ?? country.locationLogo;
  const displayName = resolveDisplayName(country.name, country.code);

  return (
    <Link
      href={`/countries/${slug}`}
      className={cn(
        'group block h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-lg',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {flagUrl ? (
            <div className="relative h-10 w-11 flex-shrink-0 overflow-hidden rounded-md border-2 border-slate-200">
              <Image
                src={flagUrl}
                alt={displayName}
                fill
                className="object-cover"
                unoptimized
                sizes="44px"
              />
            </div>
          ) : (
            <div className="flex h-10 w-11 flex-shrink-0 items-center justify-center rounded-md border-2 border-slate-200 bg-slate-100 text-xs font-bold text-slate-500">
              {country.code.slice(0, 2)}
            </div>
          )}
          <span
            className="truncate font-medium text-lg text-slate-900 group-hover:text-violet-700"
            title={displayName}
          >
            {displayName}
          </span>
        </div>
        <div className="ml-2 flex-shrink-0 rounded-full bg-slate-100 p-2 transition group-hover:bg-violet-600">
          <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white" />
        </div>
      </div>

      {(loadingSummary || planCount > 0) && (
        <div className="mt-4 space-y-1.5 border-t border-slate-200/50 pt-4">
          {loadingSummary ? (
            <div className="space-y-1.5">
              <div className="h-4 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
            </div>
          ) : (
            planCount > 0 && (
              <div className="text-xs text-slate-500">
                {planCount} plan{planCount !== 1 ? 's' : ''} available
              </div>
            )
          )}
        </div>
      )}
    </Link>
  );
}
