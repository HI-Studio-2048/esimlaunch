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

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'paid') return 'badge-green';
  if (s === 'pending') return 'badge-amber';
  if (s === 'failed' || s === 'cancelled') return 'badge-red';
  return 'badge-ghost';
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

  const formatAmount = (o: OrderItem) =>
    formatDisplayAmount(o.displayAmountCents ?? o.amountCents, o.displayCurrency ?? 'USD');

  const formatDate = (d: string) => new Date(d).toLocaleDateString();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Order History</h1>
        <Link
          href="/account"
          className="text-sm font-medium hover:underline"
          style={{ color: 'var(--electric)' }}
        >
          ← Back to Account
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: 'var(--border-bright)', borderTopColor: 'var(--electric)' }}
          />
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <p style={{ color: 'var(--text-muted)' }}>You haven&apos;t placed any orders yet.</p>
          <Link
            href="/"
            className="mt-4 inline-block font-medium hover:underline"
            style={{ color: 'var(--electric)' }}
          >
            Browse plans →
          </Link>
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded-card border"
          style={{ borderColor: 'var(--border)', background: 'var(--night-50)' }}
        >
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
            <thead>
              <tr>
                {['Order', 'Plan', 'Amount', 'Status', 'Date', ''].map((h) => (
                  <th
                    key={h}
                    className={`px-5 py-4 text-xs font-medium uppercase tracking-wide ${h === '' ? 'text-right' : 'text-left'}`}
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="transition"
                  style={{ background: 'transparent' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-5 py-4 font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                    {order.id.slice(0, 8)}
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--text)' }}>
                    {order.planName ?? order.planId}
                  </td>
                  <td className="px-5 py-4 text-sm font-medium" style={{ color: 'var(--text)' }}>
                    {formatAmount(order)}
                  </td>
                  <td className="px-5 py-4">
                    <span className={statusBadgeClass(order.status)}>{order.status}</span>
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="text-sm font-medium hover:underline"
                        style={{ color: 'var(--electric)' }}
                      >
                        View
                      </Link>
                      <span style={{ color: 'var(--border-bright)' }}>|</span>
                      <ReceiptButton orderId={order.id} authFetchBlob={authFetchBlob} />
                      {order.hasEsim && (
                        <>
                          <span style={{ color: 'var(--border-bright)' }}>|</span>
                          <Link
                            href="/my-esims"
                            className="text-sm font-medium hover:underline"
                            style={{ color: 'var(--electric)' }}
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

function ReceiptButton({
  orderId,
  authFetchBlob,
}: {
  orderId: string;
  authFetchBlob: (path: string, options?: RequestInit) => Promise<Blob>;
}) {
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
      className="text-sm font-medium hover:underline disabled:opacity-50"
      style={{ color: 'var(--electric)' }}
    >
      {loading ? '…' : 'Receipt'}
    </button>
  );
}
