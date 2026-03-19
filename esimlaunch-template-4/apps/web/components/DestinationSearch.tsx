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

function matchesSearch(loc: Location, q: string): boolean {
  const query = q.toLowerCase().trim();
  if (!query) return true;
  return (
    (loc.name?.toLowerCase() ?? '').includes(query) ||
    loc.code.toLowerCase().includes(query) ||
    getCountryName(loc.code).toLowerCase().includes(query)
  );
}

export function DestinationSearch({ countries, className }: DestinationSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = countries.filter(l => matchesSearch(l, query)).slice(0, 8);
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
      {/* Search input — Apple's rounded search bar */}
      <div className="flex items-center overflow-hidden rounded-btn border border-rule bg-surface shadow-card transition-all duration-150 focus-within:border-void focus-within:ring-2 focus-within:ring-void/10">
        <Search className="pointer-events-none ml-4 h-4 w-4 flex-shrink-0 text-faint" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'Enter' && filtered.length > 0) handleSelect(filtered[0]);
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder="Search destinations"
          className="flex-1 bg-transparent py-3 pl-3 pr-4 text-sm text-void placeholder-faint outline-none"
        />
        {query.trim() && filtered.length > 0 ? (
          <button
            type="button"
            onClick={() => handleSelect(filtered[0])}
            className="mr-2 rounded-btn bg-void px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#3a3a3c]"
          >
            Go
          </button>
        ) : (
          <Link
            href="#destinations"
            className="mr-2 rounded-btn bg-void px-4 py-1.5 text-xs font-semibold text-white transition-colors no-underline hover:bg-[#3a3a3c]"
          >
            Browse
          </Link>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-card border border-rule bg-surface shadow-card-hover">
          {filtered.length === 0 ? (
            <p className="px-4 py-5 text-center text-sm text-dim">No results for &quot;{query}&quot;</p>
          ) : (
            <ul className="max-h-60 overflow-y-auto py-1.5">
              {filtered.map(loc => {
                const displayName = loc.name?.length > 3 ? loc.name : getCountryName(loc.code);
                return (
                  <li key={loc.code}>
                    <button
                      type="button"
                      onClick={() => handleSelect(loc)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-canvas"
                    >
                      {loc.flagUrl ? (
                        <Image src={loc.flagUrl} alt="" width={24} height={16} className="rounded object-cover" unoptimized />
                      ) : (
                        <span className="flex h-4 w-6 items-center justify-center rounded bg-canvas text-[10px] font-bold text-faint">
                          {loc.code.slice(0, 2)}
                        </span>
                      )}
                      <span className="text-sm font-medium text-void">{displayName}</span>
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
