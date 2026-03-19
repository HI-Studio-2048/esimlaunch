'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/apiClient';
import { useStoreConfig } from '@/contexts/StoreConfigContext';
import type { Location } from '@/lib/types';
import { getRegionForCountry } from '@/lib/regions';
import { getCountryName } from '@/lib/country-slugs';
import { REGION_NAMES, REGION_ORDER, type Region } from '@/lib/regions';
import { DestinationSearch } from '@/components/DestinationSearch';
import { CountryCard } from '@/components/CountryCard';
import { CountrySkeleton } from '@/components/skeletons/CountrySkeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useCountryPriceSummaries } from '@/hooks/useCountryPriceSummaries';
import { Search, Zap, Globe, ShieldCheck, Clock } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface HeroSettings {
  heroHeadline?: string;
  heroSubheadline?: string;
  faqs?: { question: string; answer: string }[];
}

const DEFAULT_FAQS = [
  { question: 'What is an eSIM?', answer: 'An eSIM is a digital SIM that lets you connect to a cellular network without a physical SIM card. You install it by scanning a QR code or entering an activation code.' },
  { question: 'Is my phone compatible with eSIM?', answer: 'Most newer iPhones (iPhone XS and later) and many Android phones (Google Pixel, Samsung Galaxy S20+) support eSIM.' },
  { question: 'When do I get my eSIM?', answer: 'You receive your QR code and activation instructions by email immediately after payment. You can also find it in My eSIMs once signed in.' },
  { question: 'Can I keep my regular SIM?', answer: 'Yes. eSIM works alongside your physical SIM. Your WhatsApp number stays the same. Use apps like WhatsApp or FaceTime for calls and messages.' },
  { question: "What if I don't use all my data?", answer: "Unused data does not roll over. Use your data before the plan expires. Some plans support top-ups if you need more." },
  { question: "What's your refund policy?", answer: "Full refunds are available within 14 days if you haven't activated. After activation, refunds are generally not available." },
];

const STATS = [
  { icon: Globe, value: '190+', label: 'Countries' },
  { icon: Zap, value: 'Instant', label: 'Activation' },
  { icon: ShieldCheck, value: 'Secure', label: 'Payments' },
  { icon: Clock, value: '24/7', label: 'Support' },
];

export default function HomePage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const { templateSettings, isActive } = useStoreConfig();
  const ts = templateSettings as HeroSettings | undefined;
  const heroHeadline = ts?.heroHeadline || 'Stay Connected, Wherever You Go';
  const heroSubheadline = ts?.heroSubheadline || 'Instant eSIM for 190+ countries. Buy, install, connect — in minutes.';
  const faqs = ts?.faqs?.length ? ts.faqs : DEFAULT_FAQS;

  useEffect(() => {
    apiFetch<Location[]>('/esim/locations')
      .then(setLocations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const countries = useMemo(
    () => locations.filter((l) => l.type === 1),
    [locations],
  );

  const filtered = useMemo(() => {
    const sortByName = (a: Location, b: Location) => {
      const nameA = a.name?.length > 3 ? a.name : getCountryName(a.code);
      const nameB = b.name?.length > 3 ? b.name : getCountryName(b.code);
      return nameA.localeCompare(nameB);
    };
    return [...countries].sort(sortByName);
  }, [countries]);

  const countriesByRegion = useMemo(() => {
    const map: Record<Region, Location[]> = {
      asia: [], europe: [], 'north-america': [], 'south-america': [], africa: [], oceania: [], global: [],
    };
    for (const loc of filtered) {
      const region = getRegionForCountry(loc.code) ?? 'global';
      if (map[region]) map[region].push(loc);
      else map.global.push(loc);
    }
    const sortByName = (a: Location, b: Location) => {
      const nameA = a.name?.length > 3 ? a.name : getCountryName(a.code);
      const nameB = b.name?.length > 3 ? b.name : getCountryName(b.code);
      return nameA.localeCompare(nameB);
    };
    for (const region of REGION_ORDER) map[region].sort(sortByName);
    return map;
  }, [filtered]);

  const allCodes = useMemo(() => filtered.map((l) => l.code), [filtered]);
  const { summaries: priceSummaries, loading: summariesLoading } = useCountryPriceSummaries(
    loading ? [] : allCodes,
  );

  return (
    <div className="min-h-screen">
      {!isActive && (
        <div className="bg-red-600 px-4 py-3 text-center text-sm font-medium text-white">
          This store is currently unavailable. Please check back later.
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="page-container pb-16 pt-14 sm:pb-20 sm:pt-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-label mb-4">Global eSIM Network</p>
            <h1 className="text-display-lg text-ink sm:text-display-xl">
              {heroHeadline}
            </h1>
            <p className="mt-5 text-lg text-ink-muted leading-relaxed">
              {heroSubheadline}
            </p>
          </div>

          {/* Search */}
          <div className="mx-auto mt-10 max-w-2xl">
            <DestinationSearch countries={countries} />
          </div>

          {/* Stats */}
          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 rounded-card border border-surface-border bg-surface-soft px-4 py-4">
                <Icon className="h-5 w-5 text-teal-400" strokeWidth={1.5} />
                <span className="text-base font-bold text-ink">{value}</span>
                <span className="text-xs text-ink-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Browse by region ─────────────────────────────────── */}
      <section className="border-y border-surface-border bg-surface-soft py-10">
        <div className="page-container">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="text-display-sm text-ink">Browse by Region</h2>
            <Link href="/regions" className="text-sm font-medium text-teal-500 hover:text-teal-600">
              View all →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {REGION_ORDER.map((region) => (
              <Link
                key={region}
                href={`/regions/${region}`}
                className="rounded-btn border border-surface-border bg-white px-5 py-2.5 text-sm font-medium text-ink-secondary transition hover:border-teal-400/60 hover:text-ink no-underline"
              >
                {REGION_NAMES[region]}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Loading state ─────────────────────────────────────── */}
      {loading && (
        <div className="page-container py-20">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <CountrySkeleton key={i} />
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* ── Countries grid ───────────────────────────────── */}
          <section id="destinations" className="page-container py-14">
            {filtered.length === 0 ? (
              <EmptyState
                title="No countries found"
                description="No destinations are currently available."
                icon={Search}
              />
            ) : (
              <div className="space-y-12">
                {REGION_ORDER.map((region) => {
                  const locs = countriesByRegion[region];
                  if (!locs || locs.length === 0) return null;
                  return (
                    <div key={region}>
                      <div className="mb-5 flex items-center gap-3">
                        <h3 className="text-base font-semibold text-ink">{REGION_NAMES[region]}</h3>
                        <span className="text-xs text-ink-muted">{locs.length} destinations</span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {locs.map((loc) => {
                          const summary = priceSummaries[loc.code];
                          return (
                            <CountryCard
                              key={loc.code}
                              country={{
                                code: loc.code,
                                name: loc.name,
                                slug: loc.slug,
                                flagUrl: loc.flagUrl,
                              }}
                              lowestPriceUSD={summary?.lowestPriceUSD}
                              planCount={summary?.planCount}
                              loadingSummary={summariesLoading && !summary}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── How it works ─────────────────────────────────── */}
          <section className="border-t border-surface-border bg-surface-soft py-16">
            <div className="page-container">
              <div className="mb-10 text-center">
                <p className="section-label mb-3">Simple Process</p>
                <h2 className="text-display-md text-ink">Up and running in minutes</h2>
              </div>
              <div className="mx-auto grid max-w-3xl gap-8 sm:grid-cols-3">
                {[
                  { step: '01', title: 'Choose your plan', desc: 'Pick a country or region and select the data plan that fits your trip.' },
                  { step: '02', title: 'Install instantly', desc: 'Receive your QR code by email. Scan it to install — no SIM swap needed.' },
                  { step: '03', title: 'Connect & go', desc: 'Activate when you land. Your data is ready the moment you arrive.' },
                ].map((item) => (
                  <div key={item.step} className="relative">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-teal-400/30 bg-teal-50">
                      <span className="text-xs font-bold text-teal-600">{item.step}</span>
                    </div>
                    <h3 className="mb-2 font-semibold text-ink">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-ink-muted">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Tips ──────────────────────────────────────────── */}
          <section className="border-t border-surface-border bg-white py-16">
            <div className="page-container">
              <div className="mb-10">
                <p className="section-label mb-3">Good to know</p>
                <h2 className="text-display-sm text-ink">Before you travel</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { emoji: '📵', title: 'Data only — no phone number', desc: 'Use WhatsApp or FaceTime for calls. Your home number stays active on your physical SIM.' },
                  { emoji: '📱', title: 'Check device compatibility', desc: 'Your phone must be unlocked and eSIM-capable. Most iPhones from XS and many Android flagships qualify.' },
                  { emoji: '✈️', title: 'Install before your flight', desc: 'Set up the eSIM at home while on Wi-Fi. Activate it the moment you land.' },
                  { emoji: '💬', title: 'Keep your WhatsApp number', desc: 'Dual-SIM means your contacts can still reach you on your regular number.' },
                  { emoji: '📶', title: 'Share your connection', desc: 'Turn on hotspot and connect your laptop or tablet to the same eSIM plan.' },
                  { emoji: '🎧', title: '24/7 customer support', desc: 'Something not working? Reach us via email or live chat — any time, any day.' },
                ].map((item) => (
                  <div key={item.title} className="card p-5">
                    <span className="text-xl">{item.emoji}</span>
                    <h3 className="mt-3 text-sm font-semibold text-ink">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FAQ ──────────────────────────────────────────── */}
          <section className="border-t border-surface-border bg-surface-soft py-16">
            <div className="page-container">
              <div className="mx-auto max-w-2xl">
                <p className="section-label mb-3">FAQ</p>
                <h2 className="mb-8 text-display-sm text-ink">Common questions</h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {faqs.map((faq, i) => (
                    <AccordionItem
                      key={i}
                      value={`faq-${i}`}
                      className="card overflow-hidden border-0 px-5"
                    >
                      <AccordionTrigger className="py-4 text-left text-sm font-medium text-ink hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 text-sm leading-relaxed text-ink-muted">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
