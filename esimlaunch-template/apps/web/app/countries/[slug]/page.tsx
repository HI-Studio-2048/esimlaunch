'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { apiFetch } from '@/lib/apiClient';
import { useUser } from '@clerk/nextjs';
import { useCurrency } from '@/hooks/useCurrency';
import { useReferral } from '@/hooks/useReferral';
import { DeviceCompatibilityModal } from '@/components/DeviceCompatibilityModal';
import { getOperatorsDisplay } from '@/lib/operators';
import type { Location, Plan } from '@/lib/types';
import { formatVolume } from '@/lib/types';

const PLANS_PER_PAGE = 12;

/**
 * Country / region plan page.
 *
 * Flow:
 * 1. Resolve slug → locationCode via GET /api/esim/slug/:slug
 * 2. Fetch plans via GET /api/esim/packages/:locationCode
 * 3. On "Select", POST /api/orders to create a pending order, then navigate
 *    to /checkout/[orderId]
 *
 * type 1 = country, type 2 = region.
 * Plans are differentiated by supportTopUpType (2 = top-up capable).
 */
export default function CountryPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useUser();
  const { currency, formatProviderPrice } = useCurrency();
  const { referralCode } = useReferral();

  const [location, setLocation] = useState<Location | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | '7d' | '30d'>('all');
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

  const filteredPlans = useMemo(() => {
    if (activeTab === 'all') return plans;
    type PlanExt = Plan & { periodNum?: number; day?: number; periodUnit?: string };
    const getDays = (p: PlanExt) =>
      p.duration ?? p.periodNum ?? (p as PlanExt).day ?? 0;
    const isDayPlan = (p: PlanExt) => {
      const u = String(p.durationUnit ?? p.periodUnit ?? 'day').toLowerCase();
      return u.startsWith('day') || u === 'd';
    };
    const matchesDuration = (p: PlanExt, days: number) => {
      const d = Number(getDays(p));
      const u = (p.durationUnit ?? p.periodUnit ?? 'day').toLowerCase();
      const isMonth = u === 'month' || u === 'months';
      if (days === 7) {
        if (d === 7 && isDayPlan(p)) return true;
      } else if (days === 30) {
        if (d === 30 && isDayPlan(p)) return true;
        if (d === 1 && isMonth) return true; // 1 month ≈ 30 days
      }
      // Fallback: plan name contains "X day(s)" or "1 month"
      const name = (p.name ?? '').toLowerCase();
      if (days === 7) return /\b7\s*day/.test(name);
      if (days === 30) return /\b30\s*day/.test(name) || /\b1\s*month/.test(name);
      return false;
    };
    if (activeTab === '7d') return plans.filter((p) => matchesDuration(p as PlanExt, 7));
    if (activeTab === '30d') return plans.filter((p) => matchesDuration(p as PlanExt, 30));
    return plans;
  }, [plans, activeTab]);

  const paginatedPlans = useMemo(() => {
    const start = (currentPage - 1) * PLANS_PER_PAGE;
    return filteredPlans.slice(start, start + PLANS_PER_PAGE);
  }, [filteredPlans, currentPage]);

  const totalPages = Math.ceil(filteredPlans.length / PLANS_PER_PAGE);

  const doSelectPlan = async (plan: Plan) => {
    setSelecting(plan.packageCode);
    setError(null);
    try {
      const amountUsd = plan.price / 10000;
      const order = await apiFetch<{ id: string }>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          planCode: plan.packageCode,
          planName: plan.name,
          amountUsd,
          displayCurrency: currency,
          email: user?.primaryEmailAddress?.emailAddress,
          referralCode: referralCode ?? undefined,
        }),
      });
      router.push(`/checkout/${order.id}`);
    } catch (e: any) {
      setError(e.message ?? 'Failed to create order. Please try again.');
    } finally {
      setSelecting(null);
      setPendingPlan(null);
    }
  };

  const handleSelect = (plan: Plan) => {
    setPendingPlan(plan);
    setDeviceModalOpen(true);
  };

  const handleDeviceConfirm = () => {
    if (pendingPlan) doSelectPlan(pendingPlan);
    setDeviceModalOpen(false);
  };

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
      <DeviceCompatibilityModal
        isOpen={deviceModalOpen}
        onClose={() => { setDeviceModalOpen(false); setPendingPlan(null); }}
        onConfirm={handleDeviceConfirm}
      />
      {/* Location header */}
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          {location.flagUrl && location.type === 1 ? (
            <Image
              src={location.flagUrl}
              alt={location.name}
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
              {location.name} eSIM
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
          {/* Plan tabs */}
          <div className="mb-6 flex gap-2 border-b border-slate-200 pb-4">
            {(['all', '7d', '30d'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab
                    ? 'bg-violet-100 text-violet-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab === 'all' ? 'All Plans' : tab === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {paginatedPlans.map((plan) => (
              <PlanCard
                key={plan.packageCode}
                plan={plan}
                formatProviderPrice={formatProviderPrice}
                locationCode={location.code}
                isSelecting={selecting === plan.packageCode}
                onSelect={() => handleSelect(plan)}
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
  formatProviderPrice,
  locationCode,
  isSelecting,
  onSelect,
}: {
  plan: Plan;
  formatProviderPrice: (providerPrice: number) => string;
  locationCode: string;
  isSelecting: boolean;
  onSelect: () => void;
}) {
  const operators = getOperatorsDisplay(locationCode);
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
        <button
          onClick={onSelect}
          disabled={isSelecting}
          className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:from-violet-600 hover:to-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSelecting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Loading…
            </span>
          ) : (
            'Select Plan'
          )}
        </button>
      </div>
    </div>
  );
}
