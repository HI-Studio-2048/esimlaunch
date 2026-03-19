'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
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
        'group flex items-center gap-3.5 rounded-card border border-surface-border bg-white p-3.5 no-underline transition-all duration-200 hover:border-teal-400/50 hover:shadow-card-hover',
        className
      )}
    >
      {/* Flag */}
      <div className="relative h-9 w-10 flex-shrink-0 overflow-hidden rounded-md border border-surface-border">
        {flagUrl ? (
          <Image
            src={flagUrl}
            alt={displayName}
            fill
            className="object-cover"
            unoptimized
            sizes="40px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-muted text-[10px] font-bold text-ink-muted">
            {country.code.slice(0, 2)}
          </div>
        )}
      </div>

      {/* Name + price */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink group-hover:text-teal-600" title={displayName}>
          {displayName}
        </p>
        {loadingSummary ? (
          <div className="mt-1 h-3 w-16 animate-pulse rounded bg-surface-muted" />
        ) : planCount > 0 && lowestPriceUSD > 0 ? (
          <p className="mt-0.5 text-xs text-ink-muted">
            from <span className="font-semibold text-ink">${lowestPriceUSD.toFixed(2)}</span>
          </p>
        ) : planCount > 0 ? (
          <p className="mt-0.5 text-xs text-ink-muted">{planCount} plan{planCount !== 1 ? 's' : ''}</p>
        ) : null}
      </div>

      {/* Arrow */}
      <ArrowRight className="h-4 w-4 flex-shrink-0 text-ink-muted/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-teal-400" />
    </Link>
  );
}
