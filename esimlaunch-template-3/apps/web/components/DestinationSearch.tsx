'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { getCountryName, getSlugFromCode } from '@/lib/country-slugs';
import type { Location } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DestinationSearchProps {
  countries: Location[];
  className?: string;
}

/** Match against name, code, and full country name for SEO-friendly search */
function matchesSearch(loc: Location, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const name = loc.name?.toLowerCase() ?? '';
  const code = loc.code?.toLowerCase() ?? '';
  const fullName = getCountryName(loc.code).toLowerCase();
  return (
    name.includes(q) ||
    code.includes(q) ||
    fullName.includes(q)
  );
}

export function DestinationSearch({ countries, className }: DestinationSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = countries
    .filter((l) => matchesSearch(l, query))
    .slice(0, 8);

  const showDropdown = (focused || open) && query.trim().length > 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (loc: Location) => {
    setQuery('');
    setOpen(false);
    const slug = loc.slug || getSlugFromCode(loc.code) || `${loc.code.toLowerCase()}-esim`;
    router.push(`/countries/${slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent, loc?: Location) => {
    if (e.key === 'Enter' && filtered.length > 0 && !loc) {
      e.preventDefault();
      handleSelect(filtered[0]);
    }
  };

  return (
    <div ref={containerRef} className="relative flex w-full max-w-2xl flex-col">
      <div
        className={cn('flex w-full items-center overflow-hidden rounded-pill', className)}
        style={{
          background: 'var(--night-50)',
          border: `1px solid ${focused ? 'var(--electric)' : 'var(--border-bright)'}`,
          boxShadow: focused
            ? '0 0 0 3px rgba(79,126,255,0.18), 0 4px 24px rgba(79,126,255,0.10)'
            : '0 4px 24px rgba(0,0,0,0.3)',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        <div className="relative flex-1 min-w-0 group">
          <Search
            className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 pointer-events-none transition-colors"
            style={{ color: focused ? 'var(--electric)' : 'var(--text-muted)' }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => { setFocused(true); setOpen(true); }}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => handleKeyDown(e)}
            placeholder="Select your destination, connect instantly"
            className="w-full rounded-l-pill border-0 pl-12 pr-4 py-4 focus:outline-none focus:ring-0"
            style={{
              background: 'transparent',
              color: 'var(--text)',
            }}
          />
        </div>
        <div
          className="flex shrink-0 items-center rounded-r-pill pr-2 py-2 pl-1"
          style={{ background: 'transparent' }}
        >
          {query.trim() && filtered.length > 0 ? (
            <button
              type="button"
              onClick={() => handleSelect(filtered[0])}
              className="btn-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition"
            >
              →
            </button>
          ) : (
            <Link
              href="#destinations"
              className="btn-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition"
            >
              →
            </Link>
          )}
        </div>
      </div>

      {showDropdown && (
        <div
          className="absolute left-0 right-12 top-full z-50 mt-2 overflow-hidden rounded-xl"
          style={{
            background: 'var(--night-50)',
            border: '1px solid var(--border-bright)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              No destinations match &quot;{query}&quot;
            </p>
          ) : (
            <ul className="max-h-64 overflow-y-auto py-2">
              {filtered.map((loc) => {
                const displayName = loc.name?.length > 3 ? loc.name : getCountryName(loc.code);
                return (
                  <li key={loc.code}>
                    <button
                      type="button"
                      onClick={() => handleSelect(loc)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSelect(loc)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition"
                      style={{ color: 'var(--text)' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--night-100)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }}
                    >
                      {loc.flagUrl ? (
                        <Image
                          src={loc.flagUrl}
                          alt=""
                          width={24}
                          height={18}
                          className="rounded object-cover"
                          unoptimized
                        />
                      ) : (
                        <span
                          className="flex h-6 w-8 items-center justify-center rounded text-xs font-medium"
                          style={{
                            background: 'var(--night-200)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {loc.code.slice(0, 2)}
                        </span>
                      )}
                      <span className="font-medium">{displayName}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
