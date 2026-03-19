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
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: 'var(--border-bright)', borderTopColor: 'var(--electric)' }}
        />
        <p className="mt-4" style={{ color: 'var(--text-muted)' }}>Loading top-up plans…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
      <Breadcrumbs items={[{ label: 'My eSIMs', href: '/my-esims' }, { label: 'Top Up' }]} />
      <h1 className="mb-8 text-2xl font-bold" style={{ color: 'var(--text)' }}>
        Top Up Your eSIM
      </h1>

      {error && (
        <div
          className="mb-6 rounded-card border p-4"
          style={{
            borderColor: 'rgba(239,68,68,0.3)',
            backgroundColor: 'rgba(239,68,68,0.08)',
            color: '#f87171',
          }}
        >
          {error}
        </div>
      )}

      {plans.length === 0 && !error ? (
        <div
          className="rounded-card border border-dashed py-16 text-center"
          style={{
            borderColor: 'var(--border-bright)',
            backgroundColor: 'var(--night-50)',
          }}
        >
          <p style={{ color: 'var(--text-muted)' }}>No top-up plans available for this eSIM.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.packageCode}
              className="card-hover p-6"
              style={{ borderColor: 'var(--border)' }}
            >
              <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                {formatVolume(plan.volume)}
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                {plan.duration} {plan.durationUnit}
                {plan.duration > 1 ? 's' : ''}
              </p>
              <p className="mt-4 text-2xl font-bold" style={{ color: 'var(--glow)' }}>
                {formatProviderPrice(plan.price)}
              </p>
              <button
                onClick={() => handleSelect(plan)}
                disabled={selecting === plan.packageCode}
                className="btn-primary mt-4 w-full py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {selecting === plan.packageCode ? (
                  <span className="flex items-center justify-center gap-2">
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                      style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
                    />
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
