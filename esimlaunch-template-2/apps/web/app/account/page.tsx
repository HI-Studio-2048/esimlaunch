'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

interface OrderSummary {
  id: string;
  planName: string | null;
  amountCents: number;
  status: string;
  hasEsim: boolean;
}

export default function AccountDashboardPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { authFetch } = useAuthFetch();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [esimCount, setEsimCount] = useState(0);
  const [balanceCents, setBalanceCents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    Promise.all([
      authFetch<OrderSummary[]>('/user/orders'),
      authFetch<{ id: string }[]>('/user/esims'),
      authFetch<{ balanceCents: number }>('/vcash/balance'),
    ])
      .then(([ords, esims, bal]) => {
        setOrders(ords);
        setEsimCount(esims.length);
        setBalanceCents(bal.balanceCents);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.primaryEmailAddress?.emailAddress, authFetch]);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-border border-t-teal-400" />
        <p className="mt-4 text-ink-muted">Loading…</p>
      </div>
    );
  }
  if (!isSignedIn) {
    redirect('/sign-in');
    return null;
  }

  const totalOrders = orders.length;
  const balanceFormatted = `$${(balanceCents / 100).toFixed(2)}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <Breadcrumbs items={[{ label: 'Account' }]} />
      <h1 className="mb-8 text-2xl font-bold text-ink">Account Dashboard</h1>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-border border-t-teal-400" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="mb-12 grid gap-4 sm:grid-cols-3">
            <div className="card p-6">
              <p className="text-sm font-medium text-ink-muted">Total Orders</p>
              <p className="mt-2 text-2xl font-bold text-ink">{totalOrders}</p>
              <Link
                href="/account/orders"
                className="mt-3 inline-block text-sm font-medium text-teal-600 hover:text-teal-700"
              >
                View order history →
              </Link>
            </div>
            <div className="card p-6">
              <p className="text-sm font-medium text-ink-muted">Active eSIMs</p>
              <p className="mt-2 text-2xl font-bold text-ink">{esimCount}</p>
              <Link
                href="/my-esims"
                className="mt-3 inline-block text-sm font-medium text-teal-600 hover:text-teal-700"
              >
                Manage eSIMs →
              </Link>
            </div>
            <div className="card p-6">
              <p className="text-sm font-medium text-ink-muted">Store Credit</p>
              <p className="mt-2 text-2xl font-bold text-ink">{balanceFormatted}</p>
              <Link
                href="/"
                className="mt-3 inline-block text-sm font-medium text-teal-600 hover:text-teal-700"
              >
                Use on next order →
              </Link>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <Link
              href="/account/orders"
              className="card-hover flex items-center justify-between px-5 py-4 no-underline"
            >
              <span className="font-medium text-ink">Order History</span>
              <span className="text-ink-faint">→</span>
            </Link>
            <Link
              href="/my-esims"
              className="card-hover flex items-center justify-between px-5 py-4 no-underline"
            >
              <span className="font-medium text-ink">My eSIMs</span>
              <span className="text-ink-faint">→</span>
            </Link>
            <Link
              href="/account/settings"
              className="card-hover flex items-center justify-between px-5 py-4 no-underline"
            >
              <span className="font-medium text-ink">Settings</span>
              <span className="text-ink-faint">→</span>
            </Link>
            <Link
              href="/account/affiliate"
              className="card-hover flex items-center justify-between px-5 py-4 no-underline"
            >
              <span className="font-medium text-ink">Affiliate Program</span>
              <span className="text-ink-faint">→</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
