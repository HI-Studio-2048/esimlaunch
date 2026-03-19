'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { apiFetch } from '@/lib/apiClient';
import { useUser } from '@clerk/nextjs';
import { useCurrency } from '@/hooks/useCurrency';
import { useReferral } from '@/hooks/useReferral';
import { DeviceCompatibilityModal } from '@/components/DeviceCompatibilityModal';
import { getOperatorsDisplay } from '@/lib/operators';
import { getCountryName } from '@/lib/country-slugs';
import type { Location, Plan } from '@/lib/types';
import { formatVolume } from '@/lib/types';

/**
 * Plan preview page — shows full plan details before checkout.
 * Flow: Countries list → Select Plan → this page → Continue to Checkout → Checkout
 */
export default function PlanPreviewPage() {
  const { slug, packageCode } = useParams<{ slug: string; packageCode: string }>();
  const router = useRouter();
  const { user } = useUser();
  const { currency, formatProviderPrice } = useCurrency();
  const { referralCode } = useReferral();

  const [location, setLocation] = useState<Location | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (!slug || !packageCode) return;
    setLoading(true);
    apiFetch<Location>(`/esim/slug/${slug}`)
      .then((loc) => {
        if (!loc?.code) {
          setError('Destination not found.');
          setLoading(false);
          return;
        }
        setLocation(loc);
        return apiFetch<Plan[]>(`/esim/packages/${loc.code}`).then((plans) => {
          const match = plans.find(
            (p) =>
              p.packageCode === packageCode ||
              p.packageCode === decodeURIComponent(packageCode) ||
              p.slug === packageCode
          );
          if (!match) setError('Plan not found.');
          else setPlan(match);
        });
      })
      .catch(() => setError('Failed to load plan.'))
      .finally(() => setLoading(false));
  }, [slug, packageCode]);

  const handleContinueToCheckout = async () => {
    if (!plan || !location) return;
    setDeviceModalOpen(true);
  };

  const handleDeviceConfirm = async () => {
    if (!plan || !location) return;
    setCheckingOut(true);
    setDeviceModalOpen(false);
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
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-rule border-t-void" />
        <p className="mt-4 text-dim">Loading plan…</p>
      </div>
    );
  }

  if (error || !plan || !location) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="rounded-card border border-red-100 bg-red-50 p-6 text-red-700">
          {error ?? 'Plan not found.'}
        </div>
        <Link
          href={`/countries/${slug}`}
          className="btn-link mt-6 inline-block"
        >
          ← Back to {location?.name ?? 'plans'}
        </Link>
      </div>
    );
  }

  const operators = getOperatorsDisplay(location.code);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-12">
      <DeviceCompatibilityModal
        isOpen={deviceModalOpen}
        onClose={() => setDeviceModalOpen(false)}
        onConfirm={handleDeviceConfirm}
      />

      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-dim">
        <Link href="/" className="hover:text-link transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/#destinations" className="hover:text-link transition-colors">
          Destinations
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/countries/${slug}`} className="hover:text-link transition-colors">
          {location.name?.length > 3 ? location.name : getCountryName(location.code)} eSIM
        </Link>
        <span className="mx-2">/</span>
        <span className="text-void">{plan.name}</span>
      </nav>

      {/* Plan preview card */}
      <div className="bg-surface rounded-card-lg shadow-card p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-void">{plan.name}</h1>
            <p className="mt-1 text-dim">
              {location.name?.length > 3 ? location.name : getCountryName(location.code)} · {operators}
            </p>
          </div>
          {location.flagUrl && location.type === 1 && (
            <Image
              src={location.flagUrl}
              alt={getCountryName(location.code)}
              width={56}
              height={42}
              className="rounded-card object-cover"
              unoptimized
            />
          )}
        </div>

        <dl className="space-y-4 border-y border-rule py-6">
          <div className="flex justify-between">
            <dt className="text-dim">Data</dt>
            <dd className="font-medium text-void">{formatVolume(plan.volume)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-dim">Validity</dt>
            <dd className="font-medium text-void">
              {plan.duration} {plan.durationUnit}
              {plan.duration > 1 ? 's' : ''}
            </dd>
          </div>
          {plan.supportTopUpType === 2 && (
            <div className="flex justify-between">
              <dt className="text-dim">Top-up</dt>
              <dd className="font-medium text-emerald-600">✓ Top-up capable</dd>
            </div>
          )}
        </dl>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-dim">Price</p>
            <p className="text-3xl font-bold text-void">
              {formatProviderPrice(plan.price)}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/countries/${slug}`}
              className="btn-secondary"
            >
              Back to plans
            </Link>
            <button
              onClick={handleContinueToCheckout}
              disabled={checkingOut}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checkingOut ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Loading…
                </span>
              ) : (
                'Continue to Checkout'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
