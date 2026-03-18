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
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
        <p className="mt-4 text-slate-500">Loading…</p>
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
        <h1 className="text-2xl font-bold text-slate-900">Order History</h1>
        <Link
          href="/account"
          className="text-sm font-medium text-violet-600 hover:text-violet-700"
        >
          ← Back to Account
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-600">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/"
            className="mt-4 inline-block font-medium text-violet-600 hover:text-violet-700"
          >
            Browse plans →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase text-slate-500">
                  Order
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase text-slate-500">
                  Plan
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase text-slate-500">
                  Amount
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase text-slate-500">
                  Status
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase text-slate-500">
                  Date
                </th>
                <th className="px-5 py-4 text-right text-xs font-medium uppercase text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 text-sm font-mono text-slate-600">{order.id.slice(0, 8)}</td>
                  <td className="px-5 py-4 text-sm text-slate-900">
                    {order.planName ?? order.planId}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-900">{formatAmount(order)}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{formatDate(order.createdAt)}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="text-sm font-medium text-violet-600 hover:text-violet-700"
                      >
                        View
                      </Link>
                      <span className="text-slate-300">|</span>
                      <ReceiptButton orderId={order.id} authFetchBlob={authFetchBlob} />
                      {order.hasEsim && (
                        <>
                          <span className="text-slate-300">|</span>
                          <Link
                            href="/my-esims"
                            className="text-sm font-medium text-violet-600 hover:text-violet-700"
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
      className="text-sm font-medium text-violet-600 hover:text-violet-700 disabled:opacity-50"
    >
      {loading ? '…' : 'Receipt'}
    </button>
  );
}
