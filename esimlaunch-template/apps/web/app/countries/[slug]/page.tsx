'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { apiFetch } from '@/lib/apiClient';
import { useUser } from '@clerk/nextjs';
import { useCurrency } from '@/hooks/useCurrency';
import { useReferral } from '@/hooks/useReferral';
import type { Location, Plan } from '@/lib/types';
import { formatPrice, formatVolume } from '@/lib/types';

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
  const { currency } = useCurrency();
  const { referralCode } = useReferral();

  const [location, setLocation] = useState<Location | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleSelect = async (plan: Plan) => {
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
    }
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
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.packageCode}
              plan={plan}
              currency={currency}
              isSelecting={selecting === plan.packageCode}
              onSelect={() => handleSelect(plan)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PlanCard({
  plan,
  currency,
  isSelecting,
  onSelect,
}: {
  plan: Plan;
  currency: string;
  isSelecting: boolean;
  onSelect: () => void;
}) {
  return (
    <div className="group flex flex-col rounded-card border border-slate-200 bg-white p-6 shadow-card transition-all duration-200 hover:border-violet-200 hover:shadow-card-hover">
      <div className="mb-4">
        <p className="text-xl font-bold text-slate-900">{formatVolume(plan.volume)}</p>
        <p className="mt-1 text-sm text-slate-500">
          {plan.duration} {plan.durationUnit}
          {plan.duration > 1 ? 's' : ''}
        </p>
      </div>
      {plan.supportTopUpType === 2 && (
        <span className="mb-4 inline-flex w-fit items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          ✓ Top-up capable
        </span>
      )}
      <div className="mt-auto space-y-4">
        <p className="text-2xl font-bold text-violet-600">
          {formatPrice(plan.price, currency)}
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
