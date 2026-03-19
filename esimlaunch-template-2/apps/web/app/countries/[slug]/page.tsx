'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { apiFetch } from '@/lib/apiClient';
import { useCurrency } from '@/hooks/useCurrency';
import { getOperatorsDisplay } from '@/lib/operators';
import { getCountryName } from '@/lib/country-slugs';
import type { Location, Plan } from '@/lib/types';
import { formatVolume } from '@/lib/types';
import { ArrowLeft, Zap } from 'lucide-react';

const PLANS_PER_PAGE = 12;

type PlanExt = Plan & { periodNum?: number; day?: number; periodUnit?: string };

function getEffectiveDays(p: PlanExt): number {
  const d = Number(p.duration ?? p.periodNum ?? p.day ?? 0);
  const u = String(p.durationUnit ?? p.periodUnit ?? 'day').toLowerCase();
  if (u === 'month' || u === 'months') return d * 30;
  return d;
}

function getAvailableDurationTabs(plans: Plan[]): number[] {
  const daysSet = new Set<number>();
  for (const p of plans as PlanExt[]) {
    const days = getEffectiveDays(p);
    if (days > 0) daysSet.add(days);
  }
  return [...daysSet].sort((a, b) => a - b);
}

export default function CountryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { formatProviderPrice } = useCurrency();

  const [location, setLocation] = useState<Location | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | number>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    apiFetch<Location>(`/esim/slug/${slug}`)
      .then((loc) => {
        if (!loc?.code) { setError('Destination not found.'); setLoading(false); return; }
        setLocation(loc);
        return apiFetch<Plan[]>(`/esim/packages/${loc.code}`).then(setPlans);
      })
      .catch(() => setError('Failed to load plans.'))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (location) {
      const name = location.name?.length > 3 ? location.name : getCountryName(location.code);
      document.title = `${name} eSIM Plans`;
    }
  }, [location]);

  const availableDurations = useMemo(() => getAvailableDurationTabs(plans), [plans]);

  const filteredPlans = useMemo(() => {
    let list = plans;
    if (typeof activeTab === 'number') {
      list = plans.filter((p) => getEffectiveDays(p as PlanExt) === activeTab);
    }
    return [...list].sort((a, b) => a.price - b.price);
  }, [plans, activeTab]);

  const paginatedPlans = useMemo(() => {
    const start = (currentPage - 1) * PLANS_PER_PAGE;
    return filteredPlans.slice(start, start + PLANS_PER_PAGE);
  }, [filteredPlans, currentPage]);

  const totalPages = Math.ceil(filteredPlans.length / PLANS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-border border-t-teal-400" />
        <p className="mt-4 text-sm text-ink-muted">Loading plans…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container py-24 text-center">
        <div className="mx-auto max-w-sm rounded-card border border-red-100 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="page-container py-24 text-center">
        <p className="text-ink-muted">Destination not found.</p>
      </div>
    );
  }

  const locationName = location.name?.length > 3 ? location.name : getCountryName(location.code);

  return (
    <div className="min-h-screen bg-surface-soft">
      {/* Page header */}
      <div className="border-b border-surface-border bg-white">
        <div className="page-container py-8">
          <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink no-underline">
            <ArrowLeft className="h-3.5 w-3.5" />
            All destinations
          </Link>
          <div className="flex items-center gap-4">
            {location.flagUrl && location.type === 1 ? (
              <div className="relative h-14 w-16 overflow-hidden rounded-card border border-surface-border shadow-card">
                <Image
                  src={location.flagUrl}
                  alt={locationName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-14 w-16 items-center justify-center rounded-card bg-teal-50 text-sm font-bold text-teal-600">
                {location.code.slice(0, 3)}
              </div>
            )}
            <div>
              <h1 className="text-display-sm text-ink">{locationName} eSIM</h1>
              {location.type === 2 && location.subLocation && (
                <p className="mt-1 text-sm text-ink-muted">{location.subLocation.length} countries covered</p>
              )}
              {plans.length > 0 && (
                <p className="mt-1 text-sm text-ink-muted">{plans.length} plan{plans.length !== 1 ? 's' : ''} available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="page-container py-10">
        {plans.length === 0 ? (
          <div className="rounded-card border border-dashed border-surface-border bg-white py-20 text-center">
            <p className="text-sm text-ink-muted">No plans available for this destination yet.</p>
          </div>
        ) : (
          <>
            {/* Duration tabs */}
            <div className="mb-6 flex flex-wrap gap-2">
              <button
                onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
                className={`rounded-btn px-4 py-2 text-sm font-medium transition ${
                  activeTab === 'all'
                    ? 'bg-teal-400 text-white'
                    : 'border border-surface-border bg-white text-ink-secondary hover:border-teal-400/60 hover:text-ink'
                }`}
              >
                All Plans
              </button>
              {availableDurations.map((days) => (
                <button
                  key={days}
                  onClick={() => { setActiveTab(days); setCurrentPage(1); }}
                  className={`rounded-btn px-4 py-2 text-sm font-medium transition ${
                    activeTab === days
                      ? 'bg-teal-400 text-white'
                      : 'border border-surface-border bg-white text-ink-secondary hover:border-teal-400/60 hover:text-ink'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>

            {/* Plan cards */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {paginatedPlans.map((plan) => (
                <PlanCard
                  key={plan.packageCode}
                  plan={plan}
                  slug={slug!}
                  formatProviderPrice={formatProviderPrice}
                  locationCode={location.code}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-btn border border-surface-border bg-white px-4 py-2 text-sm font-medium text-ink-secondary disabled:opacity-40 hover:border-teal-400/60"
                >
                  Previous
                </button>
                <span className="px-3 text-sm text-ink-muted">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-btn border border-surface-border bg-white px-4 py-2 text-sm font-medium text-ink-secondary disabled:opacity-40 hover:border-teal-400/60"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  slug,
  formatProviderPrice,
  locationCode,
}: {
  plan: Plan;
  slug: string;
  formatProviderPrice: (p: number) => string;
  locationCode: string;
}) {
  const operators = getOperatorsDisplay(locationCode);
  const planPath = `/countries/${slug}/plan/${encodeURIComponent(plan.packageCode)}`;

  return (
    <div className="card flex flex-col p-5 transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5">
      {/* Data / duration */}
      <div className="mb-4 flex-1">
        <p className="text-xl font-bold text-ink">{formatVolume(plan.volume)}</p>
        <p className="mt-0.5 text-sm text-ink-muted">
          {plan.duration} {plan.durationUnit}{plan.duration > 1 ? 's' : ''}
        </p>
        {operators && <p className="mt-1 text-xs text-ink-muted/70">{operators}</p>}
        {plan.supportTopUpType === 2 && (
          <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
            <Zap className="h-3 w-3" />
            Top-up capable
          </span>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-2xl font-bold text-ink">
          {formatProviderPrice(plan.price)}
        </p>
        <Link
          href={planPath}
          className="btn-primary block w-full text-center no-underline"
        >
          Select Plan
        </Link>
      </div>
    </div>
  );
}
