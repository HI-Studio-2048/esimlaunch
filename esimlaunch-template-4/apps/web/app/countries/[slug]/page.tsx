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
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-rule border-t-void" />
        <p className="mt-4 text-dim">Loading plans…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="rounded-card border border-red-100 bg-red-50 p-6 text-red-700">{error}</div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="py-24 text-center text-dim">Destination not found.</div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-dim">
        <Link href="/" className="hover:text-link transition-colors">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/#destinations" className="hover:text-link transition-colors">Destinations</Link>
        <span className="mx-2">/</span>
        <span className="text-void">
          {location.name?.length > 3 ? location.name : getCountryName(location.code)}
        </span>
      </nav>

      {/* Location header */}
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          {location.flagUrl && location.type === 1 ? (
            <Image
              src={location.flagUrl}
              alt={getCountryName(location.code)}
              width={64}
              height={48}
              className="rounded-card object-cover shadow-card ring-2 ring-white"
              unoptimized
            />
          ) : (
            <div className="flex h-14 w-16 items-center justify-center rounded-card bg-canvas text-base font-bold text-void border border-rule">
              {location.code.slice(0, 3)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-void sm:text-3xl">
              {location.name?.length > 3 ? location.name : getCountryName(location.code)} eSIM
            </h1>
            {location.type === 2 && location.subLocation && (
              <p className="mt-1 text-sm text-dim">
                Covers {location.subLocation.length} countries
              </p>
            )}
          </div>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-card border border-dashed border-rule bg-canvas py-16 text-center">
          <p className="text-dim">No plans available for this destination.</p>
        </div>
      ) : (
        <>
          {/* Plan tabs — All Plans + duration filters (only if plans exist for that duration) */}
          <div className="mb-6 flex flex-wrap gap-2 border-b border-rule pb-4">
            <button
              key="all"
              onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
              className={`rounded-btn px-4 py-2 text-sm font-medium transition ${
                activeTab === 'all'
                  ? 'bg-void text-white'
                  : 'bg-surface border border-rule text-dim hover:border-void/30'
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
                    ? 'bg-void text-white'
                    : 'bg-surface border border-rule text-dim hover:border-void/30'
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
                className="rounded-btn-sq border border-rule px-4 py-2 text-sm font-medium text-void disabled:opacity-50 hover:bg-canvas transition"
              >
                Previous
              </button>
              <span className="px-4 text-sm text-dim">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-btn-sq border border-rule px-4 py-2 text-sm font-medium text-void disabled:opacity-50 hover:bg-canvas transition"
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
    <div className="card-hover flex flex-col p-6">
      <div className="mb-4">
        <p className="text-xl font-bold text-void">{formatVolume(plan.volume)}</p>
        <p className="mt-1 text-sm text-dim">
          {plan.duration} {plan.durationUnit}
          {plan.duration > 1 ? 's' : ''}
        </p>
        <p className="mt-1 text-xs text-faint">{operators}</p>
      </div>
      {plan.supportTopUpType === 2 && (
        <span className="badge-green mb-4 w-fit">
          ✓ Top-up capable
        </span>
      )}
      <div className="mt-auto space-y-4">
        <p className="text-2xl font-bold text-void">
          {formatProviderPrice(plan.price)}
        </p>
        <Link
          href={planPath}
          className="btn-primary block w-full text-center"
        >
          Select Plan
        </Link>
      </div>
    </div>
  );
}
