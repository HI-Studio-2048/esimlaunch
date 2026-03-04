'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/apiClient';
import type { Location } from '@/lib/types';

export function SearchDropdown() {
  const router = useRouter();
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

  const filtered = locations.filter(
    (l) =>
      query.trim() === '' ||
      l.name.toLowerCase().includes(query.toLowerCase()) ||
      l.code.toLowerCase().includes(query.toLowerCase()),
  ).slice(0, 8);

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
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
        aria-label="Search destinations"
      >
        🔍
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search countries..."
            className="w-full border-b border-slate-100 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none"
            autoFocus
          />
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">No results</p>
            ) : (
              filtered.map((loc) => (
                <Link
                  key={loc.code}
                  href={`/countries/${loc.slug}`}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700"
                >
                  {loc.name}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
