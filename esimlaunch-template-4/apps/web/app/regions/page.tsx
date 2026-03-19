'use client';

import Link from 'next/link';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { REGION_ORDER, REGION_NAMES } from '@/lib/regions';

export default function RegionsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <Link href="/">
        <Button variant="ghost" className="mb-6 pl-0 text-[#6e6e73] hover:bg-transparent hover:text-[#1d1d1f]">
          ← Back to Home
        </Button>
      </Link>

      <div className="relative overflow-hidden rounded-[18px] border border-[#d2d2d7] bg-[#f5f5f7] p-8 md:p-12">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-[#d2d2d7] bg-white">
            <Globe className="h-10 w-10 text-[#1d1d1f]" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-[#1d1d1f] md:text-4xl">
              Browse by Region
            </h1>
            <p className="mt-2 text-[#6e6e73]">
              Explore eSIM plans by continent. Select a region to see available countries.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-6 text-2xl font-bold text-[#1d1d1f]">Select a Region</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {REGION_ORDER.map((region) => (
            <Link
              key={region}
              href={`/regions/${region}`}
              className="block rounded-[18px] border border-[#d2d2d7] bg-white p-6 font-medium text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition hover:border-[#adadb8] hover:text-[#0066cc] hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)]"
            >
              {REGION_NAMES[region]}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
