'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiFetch } from '@/lib/apiClient';
import { useCurrency } from '@/hooks/useCurrency';
import type { Location } from '@/lib/types';

interface CountrySummary {
  code: string;
  name: string;
  slug: string;
  minPriceUsd: number;
}

/**
 * Homepage — Browse locations.
 * Inspired by clean eSIM platform layouts: central hero search, uniform country cards, education section.
 */
export default function HomePage() {
  const { formatUsdCents } = useCurrency();
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<CountrySummary[]>([]);
  const [allSummaries, setAllSummaries] = useState<Record<string, number>>({});

  useEffect(() => {
    apiFetch<Location[]>('/esim/locations')
      .then(setLocations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    apiFetch<CountrySummary[]>('/esim/summary?codes=US,UK,FR,JP,AU')
      .then((data) => {
        setSummaries(data);
        const map: Record<string, number> = {};
        data.forEach((s) => { map[s.slug] = s.minPriceUsd; });
        setAllSummaries(map);
      })
      .catch(() => {});
  }, []);

  const countries = useMemo(
    () => locations.filter((l) => l.type === 1),
    [locations],
  );

  const regions = useMemo(() => locations.filter((l) => l.type === 2), [locations]);

  const filtered = useMemo(() => {
    let list = countries;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = countries.filter(
        (l) => l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q),
      );
    }
    // Put Israel near the bottom (last)
    const isIsrael = (l: Location) =>
      l.name.toLowerCase() === 'israel' || l.code.toUpperCase() === 'IL';
    return [...list.filter((l) => !isIsrael(l)), ...list.filter(isIsrael)];
  }, [countries, search]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero — central search, value badges */}
      <section className="relative overflow-hidden bg-[#4c1d95]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(168,85,247,0.3),transparent)]" />
        <div className="relative mx-auto max-w-4xl px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="text-center">
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Don&apos;t Get Stuck Offline Abroad!
            </h1>
            <p className="mt-4 text-lg text-purple-200 sm:text-xl">
              Connect instantly with eSIM in 190+ countries. No SIM card, no hassle.
            </p>
          </div>

          {/* Central search */}
          <div className="mt-10">
            <div className="relative flex items-center rounded-2xl bg-white shadow-xl">
              <span className="absolute left-5 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="Select your destination, connect instantly"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl py-4 pl-12 pr-24 text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <Link
                href={
                  filtered.length > 0
                    ? `/countries/${filtered[0].slug}`
                    : '#destinations'
                }
                className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white transition hover:bg-violet-500"
              >
                →
              </Link>
            </div>
          </div>

          {/* Trust / value badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {['SSL Secured', 'Money-back guarantee', '24/7 Support', '190+ Countries', 'Instant Activation'].map((badge) => (
              <span
                key={badge}
                className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur"
              >
                <span className="text-green-400">✓</span>
                {badge}
              </span>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-purple-200">
            Instant delivery • Satisfaction guaranteed • No hidden fees
          </p>
        </div>
      </section>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
          <p className="mt-4 text-slate-500">Loading destinations…</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Popular Plans */}
          {summaries.length > 0 && (
            <section className="border-b border-slate-200 bg-white py-12">
              <div className="mx-auto max-w-6xl px-4 lg:px-8">
                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Popular Plans</h2>
                <p className="mt-2 text-slate-600">Great rates for top destinations</p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                  {summaries.map((s) => (
                    <Link
                      key={s.code}
                      href={`/countries/${s.slug}`}
                      className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-violet-200 hover:shadow-md"
                    >
                      <span className="text-3xl">
                        {s.slug.startsWith('united-states') ? '🇺🇸' : s.slug.startsWith('united-kingdom') ? '🇬🇧' : s.slug.startsWith('france') ? '🇫🇷' : s.slug.startsWith('japan') ? '🇯🇵' : s.slug.startsWith('australia') ? '🇦🇺' : '🌍'}
                      </span>
                      <p className="mt-2 font-semibold text-slate-900 group-hover:text-violet-700">{s.name}</p>
                      <p className="mt-1 text-lg font-bold text-violet-600">
                        From {formatUsdCents(Math.round(s.minPriceUsd * 100))}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Browse by Region */}
          {regions.length > 0 && (
            <section className="border-b border-slate-200 bg-slate-50/50 py-12">
              <div className="mx-auto max-w-6xl px-4 lg:px-8">
                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Browse by Region</h2>
                <p className="mt-2 text-slate-600">Multi-country plans for broader coverage</p>
                <div className="mt-8 flex flex-wrap gap-4">
                  {regions.map((loc) => (
                      <Link
                        key={loc.code}
                        href={`/countries/${loc.slug}`}
                        className="rounded-xl border border-slate-200 bg-white px-6 py-4 font-medium text-slate-800 shadow-sm transition hover:border-violet-200 hover:text-violet-700"
                      >
                        {loc.name}
                      </Link>
                    ))}
                </div>
              </div>
            </section>
          )}

          {/* Countries — uniform card grid */}
          <section id="destinations" className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Where are you traveling next?
              </h2>
              <p className="mt-2 text-slate-600">
                Pick your destination, then choose a data plan that fits your needs.
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-20 text-center">
                <p className="text-slate-500">No countries found for &quot;{search}&quot;.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filtered.map((loc) => (
                  <CountryCard
                    key={loc.code}
                    loc={loc}
                    minPriceUsd={allSummaries[loc.slug]}
                    formatUsdCents={formatUsdCents}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Things to know about eSIM */}
          <section className="bg-slate-50 py-16">
            <div className="mx-auto max-w-6xl px-4 lg:px-8">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Things to know about eSIM
              </h2>
              <p className="mt-2 text-slate-600">
                Quick tips so you&apos;re prepared before you travel.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    icon: '📵',
                    title: 'Data only, no phone number',
                    desc: 'This eSIM provides data access. Use WhatsApp or Skype for calls and messages.',
                    color: 'bg-emerald-50 border-emerald-100',
                  },
                  {
                    icon: '📱',
                    title: 'Your phone must support eSIM',
                    desc: 'Ensure your device is unlocked and eSIM compatible.',
                    color: 'bg-slate-900 border-slate-800',
                    textInverse: true,
                  },
                  {
                    icon: '✈️',
                    title: 'Install before you travel',
                    desc: 'Install your eSIM before the trip, but activate the plan when you arrive.',
                    color: 'bg-violet-50 border-violet-100',
                  },
                  {
                    icon: '💬',
                    title: 'Keep your WhatsApp number',
                    desc: 'Call and message contacts on WhatsApp as if you were back home.',
                    color: 'bg-green-50 border-green-100',
                  },
                  {
                    icon: '📶',
                    title: 'Share data with others',
                    desc: 'Create a hotspot and connect multiple devices. Great for travel groups.',
                    color: 'bg-amber-50 border-amber-100',
                  },
                  {
                    icon: '🎧',
                    title: '24/7 customer support',
                    desc: 'Questions? Reach us via email or live chat. We&apos;re here to help.',
                    color: 'bg-violet-50 border-violet-100',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className={`rounded-2xl border p-6 ${item.color} ${item.textInverse ? 'text-white' : 'text-slate-800'}`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <h3 className="mt-3 font-semibold">{item.title}</h3>
                    <p className={`mt-2 text-sm ${item.textInverse ? 'text-slate-300' : 'text-slate-600'}`}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-12 text-center">
                <Link
                  href="#destinations"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-8 py-4 font-semibold text-white no-underline transition hover:bg-[#162d47]"
                >
                  View All Destinations
                  <span>→</span>
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function CountryCard({
  loc,
  minPriceUsd,
  formatUsdCents,
}: {
  loc: Location;
  minPriceUsd?: number;
  formatUsdCents: (usdCents: number) => string;
}) {
  return (
    <Link
      href={`/countries/${loc.slug}`}
      className="group relative block overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200/60 transition hover:shadow-lg hover:shadow-violet-500/20 hover:ring-violet-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
        {loc.flagUrl && loc.type === 1 ? (
          <Image
            src={loc.flagUrl}
            alt={loc.name}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-slate-400">
            {loc.code.slice(0, 2)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {/* Flag overlay top-left */}
        {loc.flagUrl && loc.type === 1 && (
          <div className="absolute left-3 top-3 overflow-hidden rounded-full border-2 border-white shadow">
            <Image
              src={loc.flagUrl}
              alt=""
              width={32}
              height={24}
              className="object-cover"
              unoptimized
            />
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="font-semibold text-slate-900 group-hover:text-violet-700">{loc.name}</p>
        <p className="mt-1 text-sm text-slate-500">
          {minPriceUsd != null ? `From ${formatUsdCents(Math.round(minPriceUsd * 100))}` : 'View eSIM plans'}
        </p>
      </div>
    </Link>
  );
}
