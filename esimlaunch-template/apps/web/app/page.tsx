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
import { Search } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

/**
 * Homepage — Browse locations.
 * Inspired by clean eSIM platform layouts: central hero search, uniform country cards, education section.
 */
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
  { question: 'What if I don\'t use all my data?', answer: 'Unused data does not roll over. Use your data before the plan expires. Some plans support top-ups if you need more.' },
  { question: 'What\'s your refund policy?', answer: 'Full refunds are available within 14 days if you haven\'t activated. After activation, refunds are generally not available.' },
];

export default function HomePage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const { templateSettings, isActive } = useStoreConfig();
  const ts = templateSettings as HeroSettings | undefined;
  const heroHeadline = ts?.heroHeadline || "Don't Get Stuck Offline Abroad!";
  const heroSubheadline = ts?.heroSubheadline || 'Connect instantly with eSIM in 190+ countries. No SIM card, no hassle.';
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
      asia: [],
      europe: [],
      'north-america': [],
      'south-america': [],
      africa: [],
      oceania: [],
      global: [],
    };
    for (const loc of filtered) {
      const region = getRegionForCountry(loc.code) ?? 'global';
      if (map[region]) {
        map[region].push(loc);
      } else {
        map.global.push(loc);
      }
    }
    const sortByName = (a: Location, b: Location) => {
      const nameA = a.name?.length > 3 ? a.name : getCountryName(a.code);
      const nameB = b.name?.length > 3 ? b.name : getCountryName(b.code);
      return nameA.localeCompare(nameB);
    };
    for (const region of REGION_ORDER) {
      map[region].sort(sortByName);
    }
    return map;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-white">
      {/* Store deactivated banner */}
      {!isActive && (
        <div className="bg-red-600 px-4 py-3 text-center text-sm font-medium text-white">
          This store is currently unavailable. Please check back later.
        </div>
      )}

      {/* Hero — central search, value badges */}
      <section className="relative overflow-hidden bg-[#4c1d95]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(168,85,247,0.3),transparent)]" />
        <div className="relative mx-auto max-w-4xl px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="text-center">
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              {heroHeadline}
            </h1>
            <p className="mt-4 text-lg text-purple-200 sm:text-xl">
              {heroSubheadline}
            </p>
          </div>

          {/* Central search with dropdown */}
          <div className="mt-10 flex w-full justify-center">
            <DestinationSearch countries={countries} />
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
          {/* Browse by Region (continent-based) */}
          <section className="border-b border-slate-200 bg-slate-50/50 py-12">
            <div className="mx-auto max-w-6xl px-4 lg:px-8">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Browse by Region</h2>
              <p className="mt-2 text-slate-600">Explore eSIM plans by continent</p>
              <div className="mt-8 flex flex-wrap gap-4">
                {REGION_ORDER.map((region) => (
                  <Link
                    key={region}
                    href={`/regions/${region}`}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-4 font-medium text-slate-800 shadow-sm transition hover:border-violet-200 hover:text-violet-700"
                  >
                    {REGION_NAMES[region]}
                  </Link>
                ))}
              </div>
            </div>
          </section>

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
              <EmptyState
                title="No countries found"
                description="No destinations are currently available."
                icon={Search}
              />
            ) : (
              <div className="space-y-10">
                {REGION_ORDER.map((region) => {
                  const locs = countriesByRegion[region];
                  if (!locs || locs.length === 0) return null;
                  return (
                    <div key={region}>
                      <h3 className="mb-4 text-lg font-semibold text-slate-900">
                        {REGION_NAMES[region]}
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {locs.map((loc) => (
                          <CountryCard
                            key={loc.code}
                            country={{
                              code: loc.code,
                              name: loc.name,
                              slug: loc.slug,
                              flagUrl: loc.flagUrl,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* FAQ — uses merchant-configured FAQs from templateSettings, with defaults */}
          <section className="border-b border-slate-200 bg-white py-16">
            <div className="mx-auto max-w-3xl px-4 lg:px-8">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-2 text-slate-600">
                Quick answers about eSIMs and our service.
              </p>
              <Accordion type="single" collapsible className="mt-8">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
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
