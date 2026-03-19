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
import { Search } from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';

interface HeroSettings {
  heroHeadline?: string;
  heroSubheadline?: string;
  faqs?: { question: string; answer: string }[];
}

const DEFAULT_FAQS = [
  { question: 'What is an eSIM?', answer: 'An eSIM is a digital SIM that lets you connect to a cellular network without a physical SIM card. You install it by scanning a QR code or entering an activation code.' },
  { question: 'Is my phone compatible?', answer: 'Most iPhones from XS onwards and many Android flagships support eSIM. Check Settings → General → About on iPhone to confirm.' },
  { question: 'When do I receive my eSIM?', answer: 'Instantly. Your QR code is delivered by email the moment payment clears. It also appears in My eSIMs.' },
  { question: 'Can I keep my regular SIM?', answer: 'Yes. eSIM runs alongside your physical SIM — your number remains active.' },
  { question: "What if I don't use all my data?", answer: "Unused data doesn't carry over. Activate the plan when you land to get the full duration." },
  { question: "What's the refund policy?", answer: "Full refund within 14 days if not yet activated. Once activated, the plan is considered used." },
];

export default function HomePage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const { templateSettings, isActive } = useStoreConfig();
  const ts = templateSettings as HeroSettings | undefined;
  const heroHeadline = ts?.heroHeadline || 'The world\nin your pocket.';
  const heroSubheadline = ts?.heroSubheadline || 'Instant eSIM data for 190+ countries. No SIM card. No roaming fees.';
  const faqs = ts?.faqs?.length ? ts.faqs : DEFAULT_FAQS;

  useEffect(() => {
    apiFetch<Location[]>('/esim/locations')
      .then(setLocations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const countries = useMemo(() => locations.filter(l => l.type === 1), [locations]);

  const filtered = useMemo(() =>
    [...countries].sort((a, b) => {
      const nA = a.name?.length > 3 ? a.name : getCountryName(a.code);
      const nB = b.name?.length > 3 ? b.name : getCountryName(b.code);
      return nA.localeCompare(nB);
    }),
  [countries]);

  const countriesByRegion = useMemo(() => {
    const map: Record<Region, Location[]> = {
      asia: [], europe: [], 'north-america': [], 'south-america': [], africa: [], oceania: [], global: [],
    };
    for (const loc of filtered) {
      const r = getRegionForCountry(loc.code) ?? 'global';
      (map[r] ?? map.global).push(loc);
    }
    for (const r of REGION_ORDER) {
      map[r].sort((a, b) => {
        const nA = a.name?.length > 3 ? a.name : getCountryName(a.code);
        const nB = b.name?.length > 3 ? b.name : getCountryName(b.code);
        return nA.localeCompare(nB);
      });
    }
    return map;
  }, [filtered]);

  const allCodes = useMemo(() => filtered.map(l => l.code), [filtered]);
  const { summaries: priceSummaries, loading: summariesLoading } = useCountryPriceSummaries(
    loading ? [] : allCodes,
  );

  return (
    <div className="min-h-screen">
      {!isActive && (
        <div className="bg-red-600 px-4 py-3 text-center text-xs font-medium text-white">
          This store is currently unavailable.
        </div>
      )}

      {/* ── Hero ── Apple-style: centered, enormous type, canvas bg ── */}
      <section className="bg-canvas pb-16 pt-12 text-center sm:pb-24 sm:pt-20">
        <div className="page-container">
          <p className="eyebrow mb-4">eSIM · Global Connectivity</p>
          <h1
            className="text-display-lg sm:text-display-xl"
            style={{ color: '#1d1d1f', whiteSpace: 'pre-line' }}
          >
            {heroHeadline}
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-xl font-light text-dim sm:text-2xl">
            {heroSubheadline}
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#destinations" className="btn-primary">
              Shop now
            </a>
            <Link href="/faq" className="btn-ghost">
              Learn more ›
            </Link>
          </div>

          {/* Search */}
          <div className="mx-auto mt-10 max-w-xl">
            <DestinationSearch countries={countries} />
          </div>
        </div>
      </section>

      {/* ── Feature strip — white band ── */}
      <section className="bg-surface py-16">
        <div className="page-container">
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: '⚡',
                title: 'Instant delivery',
                desc: 'Your QR code arrives by email the moment payment clears.',
              },
              {
                icon: '🌍',
                title: '190+ countries',
                desc: 'One platform. Coverage on every continent.',
              },
              {
                icon: '🔒',
                title: 'Secure checkout',
                desc: 'Payments processed by Stripe. PCI DSS compliant.',
              },
            ].map(item => (
              <div key={item.title} className="text-center">
                <span className="text-3xl">{item.icon}</span>
                <h3 className="mt-3 text-base font-semibold text-void">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-dim">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Browse regions ── */}
      <section className="bg-canvas py-12">
        <div className="page-container">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="text-headline text-void">Shop by region</h2>
            <Link href="/regions" className="btn-link">All regions ›</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {REGION_ORDER.map(region => (
              <Link
                key={region}
                href={`/regions/${region}`}
                className="group flex flex-col items-center gap-2 rounded-card bg-surface p-4 text-center shadow-card transition-all duration-200 no-underline hover:shadow-card-hover"
              >
                <span className="text-2xl">
                  {region === 'asia' ? '🌏' : region === 'europe' ? '🌍' : region.includes('america') ? '🌎' : region === 'africa' ? '🌍' : region === 'oceania' ? '🌏' : '🌐'}
                </span>
                <span className="text-xs font-medium text-void">{REGION_NAMES[region]}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Country catalog ── */}
      {loading ? (
        <section className="bg-canvas py-10">
          <div className="page-container grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => <CountrySkeleton key={i} />)}
          </div>
        </section>
      ) : (
        <section id="destinations" className="bg-canvas py-10">
          <div className="page-container">
            {filtered.length === 0 ? (
              <EmptyState title="No destinations available" description="" icon={Search} />
            ) : (
              <div className="space-y-14">
                {REGION_ORDER.map(region => {
                  const locs = countriesByRegion[region];
                  if (!locs?.length) return null;
                  return (
                    <div key={region}>
                      <div className="mb-5 flex items-baseline justify-between border-b border-rule pb-3">
                        <h2 className="text-headline text-void">{REGION_NAMES[region]}</h2>
                        <span className="text-xs text-dim">{locs.length} destinations</span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {locs.map(loc => {
                          const summary = priceSummaries[loc.code];
                          return (
                            <CountryCard
                              key={loc.code}
                              country={{ code: loc.code, name: loc.name, slug: loc.slug, flagUrl: loc.flagUrl }}
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
          </div>
        </section>
      )}

      {/* ── How it works — Apple product page strip ── */}
      <section className="bg-surface py-20">
        <div className="page-container text-center">
          <p className="eyebrow mb-3">Simple by design</p>
          <h2 className="text-display-sm text-void">Ready before you land.</h2>
          <p className="mx-auto mt-4 max-w-md text-base text-dim">
            Three steps from purchase to connected. No shops, no queues, no physical SIM.
          </p>
          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            {[
              { n: '1', title: 'Choose your plan', desc: 'Pick a country or region. Select the right data size for your trip.' },
              { n: '2', title: 'Scan the QR code', desc: 'Your code arrives instantly by email. Scan it in Settings on any eSIM phone.' },
              { n: '3', title: 'Arrive and connect', desc: 'Activate on landing. Your data is live the moment you need it.' },
            ].map(s => (
              <div key={s.n} className="flex flex-col items-center">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-void text-lg font-semibold text-white">
                  {s.n}
                </div>
                <h3 className="mb-2 text-base font-semibold text-void">{s.title}</h3>
                <p className="text-sm leading-relaxed text-dim">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Info tiles — Apple's "important info" grid ── */}
      <section className="bg-canvas py-16">
        <div className="page-container">
          <h2 className="mb-8 text-headline text-void">Before you travel</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Data only — no voice number', desc: 'Use WhatsApp, FaceTime, or Signal for calls. Your home SIM stays active.' },
              { title: 'Check device compatibility', desc: 'iPhone XS or later, plus many Android flagships. Device must be carrier-unlocked.' },
              { title: 'Install at home, activate abroad', desc: 'Set up on Wi-Fi before your trip. Tap activate only when you arrive.' },
              { title: 'Your number stays the same', desc: 'Dual SIM — incoming calls and messages on your usual number still work.' },
              { title: 'Share your connection', desc: 'Enable hotspot to connect a laptop or other device to your eSIM plan.' },
              { title: 'Support, whenever you need it', desc: 'Email or live chat, 24/7. Real answers, not automated replies.' },
            ].map(item => (
              <div key={item.title} className="rounded-card bg-surface p-6 shadow-card">
                <h3 className="mb-1.5 text-sm font-semibold text-void">{item.title}</h3>
                <p className="text-sm leading-relaxed text-dim">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-surface py-16">
        <div className="page-container">
          <div className="mx-auto max-w-2xl">
            <p className="section-label mb-2">FAQ</p>
            <h2 className="mb-8 text-display-sm text-void">Questions and answers.</h2>
            <Accordion type="single" collapsible className="divide-y divide-rule">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-0">
                  <AccordionTrigger className="py-4 text-left text-sm font-semibold text-void hover:no-underline [&>svg]:text-dim">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-sm leading-relaxed text-dim">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </div>
  );
}
