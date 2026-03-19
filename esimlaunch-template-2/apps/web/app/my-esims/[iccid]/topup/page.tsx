'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import type { Plan, EsimProfile } from '@/lib/types';
import { formatVolume } from '@/lib/types';
import { useCurrency } from '@/hooks/useCurrency';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Signal, Globe } from 'lucide-react';
import { getPlanFlagLabels } from '@/lib/plan-flags';

export default function TopUpByIccidPage() {
  const { iccid } = useParams<{ iccid: string }>();
  const { user, isLoaded, isSignedIn } = useUser();
  const { authFetch } = useAuthFetch();
  const { currency, formatProviderPrice } = useCurrency();
  const [profile, setProfile] = useState<EsimProfile | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      redirect('/sign-in');
      return;
    }
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email || !iccid) return;

    authFetch<EsimProfile[]>('/user/esims')
      .then((profiles) => {
        const match = profiles.find(
          (p) => p.iccid?.toLowerCase() === iccid?.toLowerCase()
        );
        if (!match) {
          setError('eSIM not found.');
          return;
        }
        setProfile(match);
        return authFetch<Plan[]>(
          `/topup/plans?iccid=${match.iccid ?? ''}&locationCode=${match.order?.planId ?? ''}`
        );
      })
      .then((plansData) => {
        if (plansData) setPlans(plansData);
      })
      .catch(() => setError('Failed to load top-up plans.'))
      .finally(() => setLoading(false));
  }, [iccid, isLoaded, isSignedIn, user]);

  const handleSelect = async (plan: Plan) => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email || !profile) return;
    setSelecting(plan.packageCode);
    try {
      const res = await authFetch<{ url: string }>('/topup/checkout', {
        method: 'POST',
        body: JSON.stringify({
          profileId: profile.id,
          planCode: plan.packageCode,
          amountUsd: plan.price / 10000,
          displayCurrency: currency,
        }),
      });
      if (res.url) window.location.href = res.url;
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : 'Failed to create top-up session.'
      );
    } finally {
      setSelecting(null);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-border border-t-teal-400" />
        <p className="mt-4 text-ink-muted">Loading top-up plans…</p>
      </div>
    );
  }

  return (
    <div className="page-container py-10">
      <Link
        href={`/my-esims/${iccid}`}
        className="mb-4 inline-flex items-center gap-2 text-ink-muted transition-colors hover:text-teal-500"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to eSIM Details
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">
          Top Up {profile?.order?.planName ?? 'eSIM'}
        </h1>
        {iccid && (
          <p className="mt-1 font-mono text-sm text-ink-muted">{iccid}</p>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-card border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {!error && plans.length === 0 ? (
        <EmptyState
          title="No top-up plans available"
          description="No compatible top-up plans were found for this eSIM. Please contact support if you need assistance."
          icon={Package}
          action={{
            label: 'Back to eSIM Details',
            onClick: () =>
              (window.location.href = `/my-esims/${iccid}`),
          }}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {plans.map((plan) => {
            const flagInfo = getPlanFlagLabels(plan);
            const displayName = flagInfo.cleanedName || plan.name;
            const sizeGB = (plan.volume / 1024 / 1024 / 1024).toFixed(1);

            return (
              <div
                key={plan.packageCode}
                className="card-hover flex flex-col p-6"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <span className="badge-teal">
                      {plan.duration} {plan.durationUnit}
                      {plan.duration > 1 ? 's' : ''}
                    </span>
                    <h3 className="mt-2 text-xl font-bold text-ink">
                      {sizeGB} GB
                    </h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-500">
                    <Signal className="h-5 w-5" />
                  </div>
                </div>
                <p className="min-h-[2.5rem] text-sm text-ink-muted line-clamp-2">
                  {displayName}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-ink-faint">
                  <Globe className="h-3 w-3" />
                  {plan.location} Region
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-surface-border pt-4">
                  <div>
                    <p className="section-label">Price</p>
                    <p className="text-xl font-bold text-ink">
                      {formatProviderPrice(plan.price)}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleSelect(plan)}
                    disabled={selecting === plan.packageCode}
                    className="btn-primary"
                  >
                    {selecting === plan.packageCode ? 'Loading…' : 'Top Up'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
