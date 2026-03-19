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
import { Search, Zap, Wifi, ShieldCheck, ArrowRight } from 'lucide-react';
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
  { question: 'Is my phone compatible?', answer: 'Most newer iPhones (XS and later) and many Android flagships (Pixel, Samsung Galaxy S20+) support eSIM. Check Settings → General → About on iPhone.' },
  { question: 'When do I get my eSIM?', answer: 'Instantly. Your QR code arrives by email the moment payment goes through. Find it any time in My eSIMs.' },
  { question: 'Can I keep my regular SIM?', answer: 'Yes. eSIM runs alongside your physical SIM. Your number stays active for calls and WhatsApp.' },
  { question: "What if I don't use all my data?", answer: "Unused data doesn't roll over. Activate the plan only when you arrive to make the most of it." },
  { question: "What's your refund policy?", answer: "Full refund within 14 days if not activated. Once activated, the plan is considered used." },
];

const REGION_ICONS: Record<string, string> = {
  asia: '🌏',
  europe: '🌍',
  'north-america': '🌎',
  'south-america': '🌎',
  africa: '🌍',
  oceania: '🌏',
  global: '🌐',
};

export default function HomePage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const { templateSettings, isActive } = useStoreConfig();
  const ts = templateSettings as HeroSettings | undefined;
  const heroHeadline = ts?.heroHeadline || 'Your World,\nAlways Connected';
  const heroSubheadline = ts?.heroSubheadline || 'Instant eSIM data in 190+ countries. No SIM swap, no roaming shock.';
  const faqs = ts?.faqs?.length ? ts.faqs : DEFAULT_FAQS;

  useEffect(() => {
    apiFetch<Location[]>('/esim/locations')
      .then(setLocations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const countries = useMemo(() => locations.filter((l) => l.type === 1), [locations]);

  const filtered = useMemo(() => {
    return [...countries].sort((a, b) => {
      const nameA = a.name?.length > 3 ? a.name : getCountryName(a.code);
      const nameB = b.name?.length > 3 ? b.name : getCountryName(b.code);
      return nameA.localeCompare(nameB);
    });
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
    for (const region of REGION_ORDER) {
      map[region].sort((a, b) => {
        const nameA = a.name?.length > 3 ? a.name : getCountryName(a.code);
        const nameB = b.name?.length > 3 ? b.name : getCountryName(b.code);
        return nameA.localeCompare(nameB);
      });
    }
    return map;
  }, [filtered]);

  const allCodes = useMemo(() => filtered.map((l) => l.code), [filtered]);
  const { summaries: priceSummaries, loading: summariesLoading } = useCountryPriceSummaries(
    loading ? [] : allCodes,
  );

  return (
    <div className="min-h-screen">
      {!isActive && (
        <div className="bg-red-500/20 px-4 py-3 text-center text-sm font-medium text-red-400" style={{ borderBottom: '1px solid rgba(248,113,113,0.2)' }}>
          This store is currently unavailable. Please check back later.
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-24 pt-12 sm:pt-20">
        {/* Glow orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl animate-glow-pulse"
            style={{ background: 'radial-gradient(circle, #4f7eff 0%, transparent 70%)' }}
          />
          <div
            className="absolute right-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 translate-x-1/2 rounded-full opacity-15 blur-3xl"
            style={{ background: 'radial-gradient(circle, #00e5c0 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative page-container">
          <div className="mx-auto max-w-3xl text-center">
            {/* Label */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-pill px-4 py-1.5 text-xs font-semibold" style={{ background: 'rgba(79,126,255,0.12)', border: '1px solid rgba(79,126,255,0.25)', color: '#85abff' }}>
              <Wifi className="h-3.5 w-3.5" />
              190+ Countries · Instant Activation
            </div>

            {/* Headline */}
            <h1 className="text-display-lg sm:text-display-xl" style={{ color: '#f0f2ff' }}>
              {heroHeadline.split('\n').map((line, i) => (
                <span key={i} className={i === 1 ? 'gradient-text' : undefined}>
                  {i === 1 ? <><br />{line}</> : line}
                </span>
              ))}
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {heroSubheadline}
            </p>
          </div>

          {/* Search */}
          <div className="mx-auto mt-10 max-w-2xl">
            <DestinationSearch countries={countries} />
          </div>

          {/* Stats */}
          <div className="mx-auto mt-10 flex flex-wrap justify-center gap-6">
            {[
              { icon: Zap, stat: 'Instant', label: 'delivery' },
              { icon: ShieldCheck, stat: 'Secure', label: 'payments' },
              { icon: Wifi, stat: '190+', label: 'countries' },
            ].map(({ icon: Icon, stat, label }) => (
              <div key={label} className="flex items-center gap-2.5" style={{ color: 'var(--text-muted)' }}>
                <Icon className="h-4 w-4" style={{ color: '#00e5c0' }} strokeWidth={1.5} />
                <span>
                  <span className="font-semibold" style={{ color: '#f0f2ff' }}>{stat}</span>
                  {' '}{label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Regions horizontal scroll ─────────────────────────────── */}
      <section className="py-8" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="page-container">
          <div className="mb-5 flex items-center justify-between">
            <p className="section-label">Browse by Region</p>
            <Link href="/regions" className="flex items-center gap-1 text-xs font-medium hover:text-void transition-colors no-underline" style={{ color: 'var(--text-muted)' }}>
              All regions <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {REGION_ORDER.map((region) => (
              <Link
                key={region}
                href={`/regions/${region}`}
                className="flex-shrink-0 rounded-pill px-5 py-2.5 text-sm font-medium transition-all no-underline hover:scale-105"
                style={{ background: 'var(--night-50)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'rgba(79,126,255,0.4)';
                  el.style.color = '#85abff';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'var(--border)';
                  el.style.color = 'var(--text-muted)';
                }}
              >
                {REGION_ICONS[region]} {REGION_NAMES[region]}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Countries ─────────────────────────────────────────────── */}
      {loading && (
        <div className="page-container py-10">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => <CountrySkeleton key={i} />)}
          </div>
        </div>
      )}

      {!loading && (
        <>
          <section id="destinations" className="page-container py-10">
            {filtered.length === 0 ? (
              <EmptyState title="No countries found" description="No destinations available." icon={Search} />
            ) : (
              <div className="space-y-10">
                {REGION_ORDER.map((region) => {
                  const locs = countriesByRegion[region];
                  if (!locs || locs.length === 0) return null;
                  return (
                    <div key={region}>
                      <div className="mb-5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{REGION_ICONS[region]}</span>
                          <h3 className="font-semibold" style={{ color: '#f0f2ff' }}>{REGION_NAMES[region]}</h3>
                          <span className="badge-ghost">{locs.length}</span>
                        </div>
                        <Link
                          href={`/regions/${region}`}
                          className="text-xs transition-colors no-underline hover:text-void"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          View all →
                        </Link>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {locs.map((loc) => {
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
          </section>

          {/* ── How it works ─────────────────────────────────────── */}
          <section className="py-16" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="page-container">
              <div className="mb-12 text-center">
                <p className="section-label-glow mb-3">How it works</p>
                <h2 className="text-display-md" style={{ color: '#f0f2ff' }}>Three steps to global data</h2>
              </div>
              <div className="mx-auto grid max-w-4xl gap-1 sm:grid-cols-3">
                {[
                  { n: '01', title: 'Pick your plan', desc: 'Choose a country or region. Select data size and duration.' },
                  { n: '02', title: 'Scan & install', desc: 'QR code hits your inbox instantly. Scan it on your phone.' },
                  { n: '03', title: 'Land & connect', desc: 'Activate when you arrive. Data starts immediately.' },
                ].map((s, i) => (
                  <div key={s.n} className="relative flex flex-col items-center p-8 text-center">
                    {/* Connector line */}
                    {i < 2 && (
                      <div
                        className="absolute right-0 top-12 hidden h-px w-1/2 sm:block"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(79,126,255,0.3))' }}
                      />
                    )}
                    <div
                      className="mb-5 flex h-14 w-14 items-center justify-center rounded-card-lg text-lg font-bold"
                      style={{ background: 'rgba(79,126,255,0.12)', border: '1px solid rgba(79,126,255,0.25)', color: '#85abff' }}
                    >
                      {s.n}
                    </div>
                    <h3 className="mb-2 font-semibold" style={{ color: '#f0f2ff' }}>{s.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Tips bento ───────────────────────────────────────── */}
          <section className="py-16" style={{ borderTop: '1px solid var(--border)', background: 'var(--night-50)' }}>
            <div className="page-container">
              <p className="section-label mb-3">Before you go</p>
              <h2 className="mb-8 text-display-sm" style={{ color: '#f0f2ff' }}>Good to know</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { emoji: '📵', title: 'Data only — no phone number', desc: 'Use WhatsApp, FaceTime, or Signal. Your home SIM still handles calls.' },
                  { emoji: '📱', title: 'Check compatibility first', desc: 'iPhone XS or later, unlocked Android flagship. Check Settings → About.' },
                  { emoji: '✈️', title: 'Install at home, activate abroad', desc: 'Set it up on Wi-Fi before you fly. Tap activate when you land.' },
                  { emoji: '💬', title: 'Your WhatsApp number stays', desc: 'Dual-SIM means your contacts reach you normally.' },
                  { emoji: '📶', title: 'Create a hotspot', desc: 'Share your eSIM data with a laptop or tablet. Works great for groups.' },
                  { emoji: '🎧', title: '24/7 support', desc: "We're here anytime via email or live chat. No bots, no hold music." },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="card-hover p-5"
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <h3 className="mt-3 text-sm font-semibold" style={{ color: '#f0f2ff' }}>{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FAQ ─────────────────────────────────────────────── */}
          <section className="py-16" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="page-container">
              <div className="mx-auto max-w-2xl">
                <p className="section-label mb-3">FAQ</p>
                <h2 className="mb-8 text-display-sm" style={{ color: '#f0f2ff' }}>Common questions</h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {faqs.map((faq, i) => (
                    <AccordionItem
                      key={i}
                      value={`faq-${i}`}
                      className="overflow-hidden rounded-card px-5"
                      style={{ background: 'var(--night-50)', border: '1px solid var(--border)' }}
                    >
                      <AccordionTrigger className="py-4 text-left text-sm font-medium hover:no-underline" style={{ color: '#f0f2ff' }}>
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
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
