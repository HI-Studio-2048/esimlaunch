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
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: 'var(--border-bright)', borderTopColor: 'var(--electric)' }}
        />
        <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
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
      <h1 className="mb-8 text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>Account Dashboard</h1>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: 'var(--border-bright)', borderTopColor: 'var(--electric)' }}
          />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="mb-12 grid gap-4 sm:grid-cols-3">
            <div
              className="rounded-xl border p-6"
              style={{ background: 'var(--night-50)', borderColor: 'var(--border)' }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Total Orders</p>
              <p className="mt-2 text-2xl font-bold" style={{ color: 'var(--text)' }}>{totalOrders}</p>
              <Link
                href="/account/orders"
                className="mt-3 inline-block text-sm font-medium no-underline transition hover:opacity-80"
                style={{ color: 'var(--electric)' }}
              >
                View order history →
              </Link>
            </div>
            <div
              className="rounded-xl border p-6"
              style={{ background: 'var(--night-50)', borderColor: 'var(--border)' }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Active eSIMs</p>
              <p className="mt-2 text-2xl font-bold" style={{ color: 'var(--text)' }}>{esimCount}</p>
              <Link
                href="/my-esims"
                className="mt-3 inline-block text-sm font-medium no-underline transition hover:opacity-80"
                style={{ color: 'var(--electric)' }}
              >
                Manage eSIMs →
              </Link>
            </div>
            <div
              className="rounded-xl border p-6"
              style={{ background: 'var(--night-50)', borderColor: 'var(--border)' }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Store Credit</p>
              <p className="mt-2 text-2xl font-bold" style={{ color: 'var(--glow)' }}>{balanceFormatted}</p>
              <Link
                href="/"
                className="mt-3 inline-block text-sm font-medium no-underline transition hover:opacity-80"
                style={{ color: 'var(--electric)' }}
              >
                Use on next order →
              </Link>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            {[
              { href: '/account/orders', label: 'Order History' },
              { href: '/my-esims', label: 'My eSIMs' },
              { href: '/account/settings', label: 'Settings' },
              { href: '/account/affiliate', label: 'Affiliate Program' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between rounded-xl border px-5 py-4 no-underline transition hover:border-[var(--border-bright)] hover:bg-[var(--night-100)]"
                style={{ background: 'var(--night-50)', borderColor: 'var(--border)' }}
              >
                <span className="font-medium" style={{ color: 'var(--text)' }}>{label}</span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
