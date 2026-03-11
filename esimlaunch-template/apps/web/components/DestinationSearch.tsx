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
        className={cn(
          'flex w-full items-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-lg transition-shadow focus-within:shadow-violet-500/20 focus-within:ring-2 focus-within:ring-violet-500 focus-within:ring-offset-0 focus-within:border-transparent',
          className
        )}
      >
        <div className="relative flex-1 min-w-0 group">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => { setFocused(true); setOpen(true); }}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => handleKeyDown(e)}
            placeholder="Select your destination, connect instantly"
            className="w-full rounded-l-full border-0 border-r-0 bg-white pl-12 pr-4 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
          />
        </div>
        <div className="flex shrink-0 items-center rounded-r-full bg-white pr-2 py-2 pl-1">
          {query.trim() && filtered.length > 0 ? (
            <button
              type="button"
              onClick={() => handleSelect(filtered[0])}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition hover:bg-violet-500"
            >
              →
            </button>
          ) : (
            <Link
              href="#destinations"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition hover:bg-violet-500"
            >
              →
            </Link>
          )}
        </div>
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-12 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
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
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
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
                        <span className="flex h-6 w-8 items-center justify-center rounded bg-slate-100 text-xs font-medium text-slate-500">
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
