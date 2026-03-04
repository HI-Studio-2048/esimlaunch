'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { apiFetch } from '@/lib/apiClient';
import type { Plan, EsimProfile } from '@/lib/types';
import { formatVolume } from '@/lib/types';
import { useCurrency } from '@/hooks/useCurrency';

/**
 * Top-up page for a specific eSIM profile.
 *
 * 1. Load profile from GET /api/user/esims (finds by profileId)
 * 2. Load top-up plans from GET /api/topup/plans?iccid=...&locationCode=...
 * 3. On "Select" → POST /api/topup/checkout → redirect to Stripe
 */
export default function TopUpPage() {
  const { profileId } = useParams<{ profileId: string }>();
  const { user } = useUser();
  const { currency, formatProviderPrice } = useCurrency();
  const router = useRouter();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;

    apiFetch<EsimProfile[]>('/user/esims', { userEmail: email })
      .then((profiles) => {
        const profile = profiles.find((p) => p.id === profileId);
        if (!profile) {
          setError('eSIM not found.');
          return;
        }
        return apiFetch<Plan[]>(
          `/topup/plans?iccid=${profile.iccid ?? ''}&locationCode=${profile.order?.planId ?? ''}`,
        ).then(setPlans);
      })
      .catch(() => setError('Failed to load top-up plans.'))
      .finally(() => setLoading(false));
  }, [profileId, user]);

  const handleSelect = async (plan: Plan) => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;
    setSelecting(plan.packageCode);
    try {
      const res = await apiFetch<{ url: string }>('/topup/checkout', {
        method: 'POST',
        userEmail: email,
        body: JSON.stringify({
          profileId,
          planCode: plan.packageCode,
          amountUsd: plan.price / 10000,
          displayCurrency: currency,
        }),
      });
      if (res.url) window.location.href = res.url;
    } catch (e: any) {
      setError(e.message ?? 'Failed to create top-up session.');
    } finally {
      setSelecting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
        <p className="mt-4 text-slate-500">Loading top-up plans…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
      <h1 className="mb-8 text-2xl font-bold text-slate-900">Top Up Your eSIM</h1>

      {error && (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {plans.length === 0 && !error ? (
        <div className="rounded-card border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
          <p className="text-slate-500">No top-up plans available for this eSIM.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.packageCode}
              className="rounded-card border border-slate-200 bg-white p-6 shadow-card transition-all duration-200 hover:border-violet-200 hover:shadow-card-hover"
            >
              <p className="text-xl font-bold text-slate-900">{formatVolume(plan.volume)}</p>
              <p className="mt-1 text-sm text-slate-500">
                {plan.duration} {plan.durationUnit}
                {plan.duration > 1 ? 's' : ''}
              </p>
              <p className="mt-4 text-2xl font-bold text-sky-600">
                {formatProviderPrice(plan.price)}
              </p>
              <button
                onClick={() => handleSelect(plan)}
                disabled={selecting === plan.packageCode}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:from-violet-600 hover:to-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {selecting === plan.packageCode ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Loading…
                  </span>
                ) : (
                  'Top Up'
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
