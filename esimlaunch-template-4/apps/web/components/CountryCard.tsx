'use client';

import Link from 'next/link';
import Image from 'next/image';
import { getSlugFromCode, getCountryName } from '@/lib/country-slugs';
import { cn } from '@/lib/utils';

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
  const slug = country.slug ?? getSlugFromCode(country.code) ?? country.code.toLowerCase();
  const flagUrl = country.flagUrl ?? country.locationLogo;
  const displayName = resolveDisplayName(country.name, country.code);

  return (
    <Link
      href={`/countries/${slug}`}
      className={cn(
        'group flex items-center gap-4 rounded-card bg-surface p-4 shadow-card transition-all duration-200 no-underline hover:shadow-card-hover hover:-translate-y-0.5',
        className
      )}
    >
      {/* Flag */}
      <div className="relative h-9 w-10 flex-shrink-0 overflow-hidden rounded-md border border-rule">
        {flagUrl ? (
          <Image src={flagUrl} alt={displayName} fill className="object-cover" unoptimized sizes="40px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-canvas text-[10px] font-bold text-faint">
            {country.code.slice(0, 2)}
          </div>
        )}
      </div>

      {/* Name + price */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-void" title={displayName}>
          {displayName}
        </p>
        {loadingSummary ? (
          <div className="mt-1 h-3 w-14 animate-pulse rounded bg-canvas" />
        ) : planCount > 0 && lowestPriceUSD > 0 ? (
          <p className="mt-0.5 text-xs text-dim">
            From <span className="font-semibold text-void">${lowestPriceUSD.toFixed(2)}</span>
          </p>
        ) : planCount > 0 ? (
          <p className="mt-0.5 text-xs text-dim">{planCount} plan{planCount !== 1 ? 's' : ''}</p>
        ) : null}
      </div>

      {/* Chevron */}
      <svg className="h-4 w-4 flex-shrink-0 text-faint transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-link" viewBox="0 0 20 20" fill="none">
        <path d="M7.5 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
