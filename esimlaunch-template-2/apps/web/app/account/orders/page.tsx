'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { formatDisplayAmount } from '@/lib/types';

interface OrderItem {
  id: string;
  planId: string;
  planName: string | null;
  amountCents: number;
  displayCurrency: string | null;
  displayAmountCents: number | null;
  status: string;
  createdAt: string;
  hasEsim: boolean;
}

export default function OrderHistoryPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { authFetch, authFetchBlob } = useAuthFetch();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    authFetch<OrderItem[]>('/user/orders')
      .then(setOrders)
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

  const formatAmount = (o: OrderItem) =>
    formatDisplayAmount(o.displayAmountCents ?? o.amountCents, o.displayCurrency ?? 'USD');

  const formatDate = (d: string) => new Date(d).toLocaleDateString();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Order History</h1>
        <Link
          href="/account"
          className="text-sm font-medium text-teal-600 hover:text-teal-500"
        >
          ← Back to Account
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-border border-t-teal-400" />
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-ink-muted">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/"
            className="mt-4 inline-block font-medium text-teal-600 hover:text-teal-500"
          >
            Browse plans →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-surface-border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-surface-border">
            <thead>
              <tr>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-ink-muted">
                  Order
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-ink-muted">
                  Plan
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-ink-muted">
                  Amount
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-ink-muted">
                  Status
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-ink-muted">
                  Date
                </th>
                <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-ink-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-surface-soft">
                  <td className="px-5 py-4 text-sm font-mono text-ink-muted">{order.id.slice(0, 8)}</td>
                  <td className="px-5 py-4 text-sm text-ink">
                    {order.planName ?? order.planId}
                  </td>
                  <td className="px-5 py-4 text-sm text-ink">{formatAmount(order)}</td>
                  <td className="px-5 py-4">
                    <span className="badge-gray">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-ink-muted">{formatDate(order.createdAt)}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="text-sm font-medium text-teal-600 hover:text-teal-500"
                      >
                        View
                      </Link>
                      <span className="text-surface-border">|</span>
                      <ReceiptButton orderId={order.id} authFetchBlob={authFetchBlob} />
                      {order.hasEsim && (
                        <>
                          <span className="text-surface-border">|</span>
                          <Link
                            href="/my-esims"
                            className="text-sm font-medium text-teal-600 hover:text-teal-500"
                          >
                            My eSIMs
                          </Link>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ReceiptButton({ orderId, authFetchBlob }: { orderId: string; authFetchBlob: (path: string, options?: RequestInit) => Promise<Blob> }) {
  const [loading, setLoading] = useState(false);
  const handleDownload = async () => {
    setLoading(true);
    try {
      const blob = await authFetchBlob(`/orders/${orderId}/receipt`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${orderId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="text-sm font-medium text-teal-600 hover:text-teal-500 disabled:opacity-50"
    >
      {loading ? '…' : 'Receipt'}
    </button>
  );
}
