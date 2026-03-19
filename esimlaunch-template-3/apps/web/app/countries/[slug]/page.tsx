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
      <div
        className="flex flex-col items-center justify-center py-24"
        style={{ background: 'var(--night)', minHeight: '60vh' }}
      >
        <div
          className="h-10 w-10 animate-spin rounded-full border-2"
          style={{
            borderColor: 'var(--night-200)',
            borderTopColor: 'var(--electric)',
          }}
        />
        <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          Loading plans…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="mx-auto max-w-md px-4 py-24 text-center"
        style={{ background: 'var(--night)', minHeight: '60vh' }}
      >
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171',
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div
        className="py-24 text-center"
        style={{ background: 'var(--night)', minHeight: '60vh', color: 'var(--text-muted)' }}
      >
        Destination not found.
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--night)', minHeight: '100vh' }}>
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
                className="rounded-2xl object-cover"
                style={{
                  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                  border: '2px solid var(--border-bright)',
                }}
                unoptimized
              />
            ) : (
              <div
                className="flex h-14 w-16 items-center justify-center rounded-2xl text-base font-bold"
                style={{
                  background: 'var(--night-100)',
                  border: '1px solid var(--border-bright)',
                  color: 'var(--electric)',
                }}
              >
                {location.code.slice(0, 3)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
                {location.name?.length > 3 ? location.name : getCountryName(location.code)} eSIM
              </h1>
              {location.type === 2 && location.subLocation && (
                <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Covers {location.subLocation.length} countries
                </p>
              )}
            </div>
          </div>
        </div>

        {plans.length === 0 ? (
          <div
            className="rounded-2xl py-16 text-center"
            style={{
              border: '1px dashed var(--border-bright)',
              background: 'var(--night-50)',
            }}
          >
            <p style={{ color: 'var(--text-muted)' }}>No plans available for this destination.</p>
          </div>
        ) : (
          <>
            {/* Plan tabs */}
            <div
              className="mb-6 flex flex-wrap gap-2 pb-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <button
                key="all"
                onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
                className="rounded-pill px-4 py-2 text-sm font-medium transition"
                style={
                  activeTab === 'all'
                    ? {
                        background: 'var(--electric)',
                        color: '#fff',
                        boxShadow: '0 0 12px rgba(79,126,255,0.35)',
                      }
                    : {
                        background: 'var(--night-100)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }
                }
              >
                All Plans
              </button>
              {availableDurations.map((days) => (
                <button
                  key={days}
                  onClick={() => { setActiveTab(days); setCurrentPage(1); }}
                  className="rounded-pill px-4 py-2 text-sm font-medium transition"
                  style={
                    activeTab === days
                      ? {
                          background: 'var(--electric)',
                          color: '#fff',
                          boxShadow: '0 0 12px rgba(79,126,255,0.35)',
                        }
                      : {
                          background: 'var(--night-100)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border)',
                        }
                  }
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
                  className="rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-40"
                  style={{
                    background: 'var(--night-100)',
                    border: '1px solid var(--border-bright)',
                    color: 'var(--text)',
                  }}
                >
                  Previous
                </button>
                <span className="px-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-40"
                  style={{
                    background: 'var(--night-100)',
                    border: '1px solid var(--border-bright)',
                    color: 'var(--text)',
                  }}
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
  formatProviderPrice: (providerPrice: number) => string;
  locationCode: string;
}) {
  const operators = getOperatorsDisplay(locationCode);
  const planPath = `/countries/${slug}/plan/${encodeURIComponent(plan.packageCode)}`;
  return (
    <div className="card-hover flex flex-col p-6 transition-all duration-200">
      <div className="mb-4">
        <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>
          {formatVolume(plan.volume)}
        </p>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          {plan.duration} {plan.durationUnit}
          {plan.duration > 1 ? 's' : ''}
        </p>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
          {operators}
        </p>
      </div>
      {plan.supportTopUpType === 2 && (
        <span className="badge-green mb-4 inline-flex w-fit items-center">
          ✓ Top-up capable
        </span>
      )}
      <div className="mt-auto space-y-4">
        <p className="text-2xl font-bold" style={{ color: '#00e5c0' }}>
          {formatProviderPrice(plan.price)}
        </p>
        <Link href={planPath} className="btn-primary block w-full py-3 text-center text-sm font-semibold">
          Select Plan
        </Link>
      </div>
    </div>
  );
}
