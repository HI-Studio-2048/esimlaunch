'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import type { Order } from '@/lib/types';
import { formatDisplayAmount } from '@/lib/types';

export default function AccountOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoaded, isSignedIn } = useUser();
  const { authFetch, authFetchBlob } = useAuthFetch();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.primaryEmailAddress?.emailAddress || !id) return;
    authFetch<Order>(`/orders/${id}`)
      .then(setOrder)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user?.primaryEmailAddress?.emailAddress, id, authFetch]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
      </div>
    );
  }
  if (error || !order) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <p className="text-red-600">{error ?? 'Order not found'}</p>
        <Link href="/account/orders" className="mt-4 inline-block text-violet-600 hover:underline">
          ← Back to Order History
        </Link>
      </div>
    );
  }

  const profile = order.esimProfile;
  const displayAmount = formatDisplayAmount(order.displayAmountCents ?? order.amountCents, order.displayCurrency ?? 'USD');

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Order Details</h1>
        <Link
          href="/account/orders"
          className="text-sm font-medium text-violet-600 hover:text-violet-700"
        >
          ← Order History
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm">
          <span className="font-medium text-slate-600">Order ID:</span>{' '}
          <span className="font-mono text-slate-900">{order.id}</span>
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium text-slate-600">Plan:</span>{' '}
          <span className="text-slate-900">{order.planName ?? order.planId}</span>
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium text-slate-600">Amount:</span>{' '}
          <span className="font-semibold text-slate-900">
            {displayAmount}
          </span>
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium text-slate-600">Status:</span>{' '}
          <span className="capitalize text-slate-900">{order.status.replace(/_/g, ' ')}</span>
        </p>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <ReceiptDownloadButton orderId={order.id} authFetchBlob={authFetchBlob} />
        <ResendReceiptButton orderId={order.id} authFetch={authFetch} />
        {profile && (
          <Link
            href="/my-esims"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            My eSIMs
          </Link>
        )}
      </div>

      {profile && (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">eSIM Details</h2>
          {profile.iccid && (
            <p className="mb-3 text-sm text-slate-700">
              <span className="font-medium">ICCID:</span> {profile.iccid}
            </p>
          )}
          {profile.qrCodeUrl && (
            <div className="mt-4 inline-block rounded-xl border border-slate-200 bg-white p-4">
              <Image
                src={profile.qrCodeUrl}
                alt="eSIM QR Code"
                width={160}
                height={160}
                className="rounded-lg"
                unoptimized
              />
            </div>
          )}
          {profile.ac && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-800">
                Show activation code
              </summary>
              <p className="mt-2 break-all rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700">
                {profile.ac}
              </p>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function ReceiptDownloadButton({ orderId, authFetchBlob }: { orderId: string; authFetchBlob: (path: string, options?: RequestInit) => Promise<Blob> }) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
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
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
    >
      {loading ? 'Downloading…' : 'Download Receipt'}
    </button>
  );
}

function ResendReceiptButton({ orderId, authFetch }: { orderId: string; authFetch: <T = unknown>(path: string, options?: RequestInit) => Promise<T> }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    setSent(false);
    try {
      await authFetch(`/orders/${orderId}/resend-receipt`, {
        method: 'POST',
      });
      setSent(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      {loading ? 'Sending…' : sent ? 'Email sent!' : 'Resend Receipt'}
    </button>
  );
}
