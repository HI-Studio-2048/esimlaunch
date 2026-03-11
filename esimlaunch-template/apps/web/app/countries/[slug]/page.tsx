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

const PLANS_PER_PAGE = 12;

type PlanExt = Plan & { periodNum?: number; day?: number; periodUnit?: string };

function getEffectiveDays(p: PlanExt): number {
  const d = Number(p.duration ?? p.periodNum ?? (p as PlanExt).day ?? 0);
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

/**
 * Country / region plan page.
 *
 * Flow:
 * 1. Resolve slug → locationCode via GET /api/esim/slug/:slug
 * 2. Fetch plans via GET /api/esim/packages/:locationCode
 * 3. On "Select Plan", navigate to /countries/[slug]/plan/[packageCode] (plan preview)
 * 4. On plan preview "Continue to Checkout", create order and go to checkout
 *
 * type 1 = country, type 2 = region.
 * Plans are differentiated by supportTopUpType (2 = top-up capable).
 */
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
        if (!loc?.code) {
          setError('Destination not found.');
          setLoading(false);
          return;
        }
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

  const availableDurations = useMemo(
    () => getAvailableDurationTabs(plans),
    [plans]
  );

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
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
        <p className="mt-4 text-slate-500">Loading plans…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">{error}</div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="py-24 text-center text-slate-500">Destination not found.</div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
      {/* Location header */}
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          {location.flagUrl && location.type === 1 ? (
            <Image
              src={location.flagUrl}
              alt={getCountryName(location.code)}
              width={64}
              height={48}
              className="rounded-2xl object-cover shadow-lg ring-2 ring-white"
              unoptimized
            />
          ) : (
            <div className="flex h-14 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-50 text-base font-bold text-violet-600">
              {location.code.slice(0, 3)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {location.name?.length > 3 ? location.name : getCountryName(location.code)} eSIM
            </h1>
            {location.type === 2 && location.subLocation && (
              <p className="mt-1 text-sm text-slate-500">
                Covers {location.subLocation.length} countries
              </p>
            )}
          </div>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
          <p className="text-slate-500">No plans available for this destination.</p>
        </div>
      ) : (
        <>
          {/* Plan tabs — All Plans + duration filters (only if plans exist for that duration) */}
          <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
            <button
              key="all"
              onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === 'all'
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Plans
            </button>
            {availableDurations.map((days) => (
              <button
                key={days}
                onClick={() => { setActiveTab(days); setCurrentPage(1); }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === days
                    ? 'bg-violet-100 text-violet-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
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
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 text-sm text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
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
  formatProviderPrice: (providerPrice: number) => string;
  locationCode: string;
}) {
  const operators = getOperatorsDisplay(locationCode);
  const planPath = `/countries/${slug}/plan/${encodeURIComponent(plan.packageCode)}`;
  return (
    <div className="group flex flex-col rounded-card border border-slate-200 bg-white p-6 shadow-card transition-all duration-200 hover:border-violet-200 hover:shadow-card-hover">
      <div className="mb-4">
        <p className="text-xl font-bold text-slate-900">{formatVolume(plan.volume)}</p>
        <p className="mt-1 text-sm text-slate-500">
          {plan.duration} {plan.durationUnit}
          {plan.duration > 1 ? 's' : ''}
        </p>
        <p className="mt-1 text-xs text-slate-400">{operators}</p>
      </div>
      {plan.supportTopUpType === 2 && (
        <span className="mb-4 inline-flex w-fit items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          ✓ Top-up capable
        </span>
      )}
      <div className="mt-auto space-y-4">
        <p className="text-2xl font-bold text-violet-600">
          {formatProviderPrice(plan.price)}
        </p>
        <Link
          href={planPath}
          className="block w-full rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:from-violet-600 hover:to-purple-600"
        >
          Select Plan
        </Link>
      </div>
    </div>
  );
}
