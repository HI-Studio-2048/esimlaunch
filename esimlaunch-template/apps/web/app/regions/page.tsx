'use client';

import Link from 'next/link';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { REGION_ORDER, REGION_NAMES } from '@/lib/regions';

export default function RegionsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <Link href="/">
        <Button variant="ghost" className="mb-6 pl-0 text-slate-600 hover:bg-transparent hover:text-slate-900">
          ← Back to Home
        </Button>
      </Link>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-violet-500/10 to-purple-500/10 p-8 md:p-12">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-violet-300 bg-white">
            <Globe className="h-10 w-10 text-violet-600" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Browse by Region
            </h1>
            <p className="mt-2 text-slate-600">
              Explore eSIM plans by continent. Select a region to see available countries.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Select a Region</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {REGION_ORDER.map((region) => (
            <Link
              key={region}
              href={`/regions/${region}`}
              className="block rounded-xl border border-slate-200 bg-white p-6 font-medium text-slate-800 shadow-sm transition hover:border-violet-200 hover:shadow-md hover:text-violet-700"
            >
              {REGION_NAMES[region]}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
