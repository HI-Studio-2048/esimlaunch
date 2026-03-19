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
      className={cn('group block h-full', className)}
      style={{
        background: 'var(--night-50)',
        border: '1px solid var(--border)',
        borderRadius: '1rem',
        padding: '1.25rem',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = 'rgba(0,229,192,0.3)';
        el.style.boxShadow = '0 0 0 1px rgba(0,229,192,0.15), 0 4px 24px rgba(0,229,192,0.08)';
        el.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = 'var(--border)';
        el.style.boxShadow = 'none';
        el.style.transform = 'translateY(0)';
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {flagUrl ? (
            <div
              className="relative h-10 w-11 flex-shrink-0 overflow-hidden rounded-md"
              style={{ border: '1px solid var(--border-bright)' }}
            >
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
            <div
              className="flex h-10 w-11 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold"
              style={{
                border: '1px solid var(--border-bright)',
                background: 'var(--night-100)',
                color: 'var(--text-muted)',
              }}
            >
              {country.code.slice(0, 2)}
            </div>
          )}
          <span
            className="truncate font-medium text-lg"
            style={{ color: 'var(--text)' }}
            title={displayName}
          >
            {displayName}
          </span>
        </div>
        <div
          className="ml-2 flex-shrink-0 rounded-full p-2 transition"
          style={{ background: 'var(--night-200)' }}
        >
          <ChevronRight className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      {(loadingSummary || planCount > 0) && (
        <div
          className="mt-4 space-y-1.5 pt-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {loadingSummary ? (
            <div className="space-y-1.5">
              <div
                className="h-4 animate-pulse rounded"
                style={{ background: 'var(--night-200)' }}
              />
              <div
                className="h-3 w-2/3 animate-pulse rounded"
                style={{ background: 'var(--night-200)' }}
              />
            </div>
          ) : (
            planCount > 0 && (
              <>
                {lowestPriceUSD > 0 && (
                  <div className="text-sm font-semibold" style={{ color: '#00e5c0' }}>
                    From ${lowestPriceUSD.toFixed(2)}
                  </div>
                )}
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {planCount} plan{planCount !== 1 ? 's' : ''} available
                </div>
              </>
            )
          )}
        </div>
      )}
    </Link>
  );
}
