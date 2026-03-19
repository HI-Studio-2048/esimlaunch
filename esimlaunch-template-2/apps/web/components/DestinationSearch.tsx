'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ArrowRight } from 'lucide-react';
import { getCountryName, getSlugFromCode } from '@/lib/country-slugs';
import type { Location } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DestinationSearchProps {
  countries: Location[];
  className?: string;
}

function matchesSearch(loc: Location, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const name = loc.name?.toLowerCase() ?? '';
  const code = loc.code?.toLowerCase() ?? '';
  const fullName = getCountryName(loc.code).toLowerCase();
  return name.includes(q) || code.includes(q) || fullName.includes(q);
}

export function DestinationSearch({ countries, className }: DestinationSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = countries.filter((l) => matchesSearch(l, query)).slice(0, 8);
  const showDropdown = open && query.trim().length > 0;

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

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Input row */}
      <div className="flex items-center overflow-hidden rounded-btn border border-surface-border bg-white shadow-card transition-all focus-within:border-teal-400 focus-within:shadow-input-focus">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filtered.length > 0) handleSelect(filtered[0]);
              if (e.key === 'Escape') setOpen(false);
            }}
            placeholder="Search destinations — Japan, France, USA…"
            className="w-full bg-transparent py-3.5 pl-11 pr-4 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
          />
        </div>
        {query.trim() && filtered.length > 0 ? (
          <button
            type="button"
            onClick={() => handleSelect(filtered[0])}
            className="mr-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-btn bg-teal-400 text-white transition hover:bg-teal-500"
            aria-label="Go"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <Link
            href="#destinations"
            className="mr-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-btn bg-teal-400 text-white transition hover:bg-teal-500"
            aria-label="Browse all"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-card border border-surface-border bg-white shadow-card-hover">
          {filtered.length === 0 ? (
            <p className="px-4 py-5 text-center text-sm text-ink-muted">
              No results for &quot;{query}&quot;
            </p>
          ) : (
            <ul className="max-h-60 overflow-y-auto py-1.5">
              {filtered.map((loc) => {
                const displayName = loc.name?.length > 3 ? loc.name : getCountryName(loc.code);
                return (
                  <li key={loc.code}>
                    <button
                      type="button"
                      onClick={() => handleSelect(loc)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink-secondary transition hover:bg-surface-soft hover:text-ink"
                    >
                      {loc.flagUrl ? (
                        <Image
                          src={loc.flagUrl}
                          alt=""
                          width={24}
                          height={16}
                          className="rounded object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="flex h-4 w-6 items-center justify-center rounded bg-surface-muted text-[10px] font-medium text-ink-muted">
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
