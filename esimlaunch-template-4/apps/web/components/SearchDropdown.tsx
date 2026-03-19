'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/apiClient';
import { getCountryName } from '@/lib/country-slugs';
import type { Location } from '@/lib/types';

export function SearchDropdown() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<Location[]>('/esim/locations')
      .then((data) => setLocations(data.filter((l) => l.type === 1)))
      .catch(() => {});
  }, []);

  const filtered = locations.filter((l) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    const name = l.name?.toLowerCase() ?? '';
    const code = l.code?.toLowerCase() ?? '';
    const fullName = getCountryName(l.code).toLowerCase();
    return name.includes(q) || code.includes(q) || fullName.includes(q);
  }).slice(0, 8);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6e6e73] transition-colors hover:bg-[#f5f5f7]"
        aria-label="Search destinations"
      >
        🔍
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-[18px] border border-[#d2d2d7] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.18)]">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search countries..."
            className="w-full border-b border-[#d2d2d7] px-4 py-3 text-[#1d1d1f] placeholder:text-[#adadb8] focus:outline-none"
            autoFocus
          />
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-[#6e6e73]">No results</p>
            ) : (
              filtered.map((loc) => {
                const displayName = loc.name?.length > 3 ? loc.name : getCountryName(loc.code);
                return (
                  <Link
                    key={loc.code}
                    href={`/countries/${loc.slug}`}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 text-sm text-[#1d1d1f] transition-colors hover:bg-[#f5f5f7]"
                  >
                    {displayName}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
