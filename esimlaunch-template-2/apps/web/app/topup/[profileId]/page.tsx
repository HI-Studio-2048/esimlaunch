'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import type { Plan, EsimProfile } from '@/lib/types';
import { formatVolume } from '@/lib/types';
import { useCurrency } from '@/hooks/useCurrency';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

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
  const { authFetch } = useAuthFetch();
  const { currency, formatProviderPrice } = useCurrency();
  const router = useRouter();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;

    authFetch<EsimProfile[]>('/user/esims')
      .then((profiles) => {
        const profile = profiles.find((p) => p.id === profileId);
        if (!profile) {
          setError('eSIM not found.');
          return;
        }
        return authFetch<Plan[]>(
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
      const res = await authFetch<{ url: string }>('/topup/checkout', {
        method: 'POST',
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
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-border border-t-teal-400" />
        <p className="mt-4 text-ink-muted">Loading top-up plans…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
      <Breadcrumbs items={[{ label: 'My eSIMs', href: '/my-esims' }, { label: 'Top Up' }]} />
      <h1 className="mb-8 text-2xl font-bold text-ink">Top Up Your eSIM</h1>

      {error && (
        <div className="mb-6 rounded-card border border-red-100 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {plans.length === 0 && !error ? (
        <div className="rounded-card border border-dashed border-surface-border bg-surface-soft py-16 text-center">
          <p className="text-ink-muted">No top-up plans available for this eSIM.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.packageCode}
              className="card card-hover p-6"
            >
              <p className="text-xl font-bold text-ink">{formatVolume(plan.volume)}</p>
              <p className="mt-1 text-sm text-ink-muted">
                {plan.duration} {plan.durationUnit}
                {plan.duration > 1 ? 's' : ''}
              </p>
              <p className="mt-4 text-2xl font-bold text-teal-400">
                {formatProviderPrice(plan.price)}
              </p>
              <button
                onClick={() => handleSelect(plan)}
                disabled={selecting === plan.packageCode}
                className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50"
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
