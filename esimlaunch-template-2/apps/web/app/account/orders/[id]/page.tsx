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
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-border border-t-teal-400" />
        <p className="mt-4 text-ink-muted">Loading…</p>
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
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-border border-t-teal-400" />
      </div>
    );
  }
  if (error || !order) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <p className="text-red-600">{error ?? 'Order not found'}</p>
        <Link href="/account/orders" className="mt-4 inline-block text-teal-400 hover:underline">
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
        <h1 className="text-2xl font-bold text-ink">Order Details</h1>
        <Link
          href="/account/orders"
          className="text-sm font-medium text-teal-400 hover:text-teal-500"
        >
          ← Order History
        </Link>
      </div>

      <div className="card p-6">
        <p className="text-sm">
          <span className="font-medium text-ink-secondary">Order ID:</span>{' '}
          <span className="font-mono text-ink">{order.id}</span>
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium text-ink-secondary">Plan:</span>{' '}
          <span className="text-ink">{order.planName ?? order.planId}</span>
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium text-ink-secondary">Amount:</span>{' '}
          <span className="font-semibold text-ink">
            {displayAmount}
          </span>
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium text-ink-secondary">Status:</span>{' '}
          <span className="capitalize text-ink">{order.status.replace(/_/g, ' ')}</span>
        </p>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <ReceiptDownloadButton orderId={order.id} authFetchBlob={authFetchBlob} />
        <ResendReceiptButton orderId={order.id} authFetch={authFetch} />
        {profile && (
          <Link href="/my-esims" className="btn-secondary text-sm">
            My eSIMs
          </Link>
        )}
      </div>

      {profile && (
        <div className="card mt-8 p-6">
          <h2 className="mb-4 font-semibold text-ink">eSIM Details</h2>
          {profile.iccid && (
            <p className="mb-3 text-sm text-ink-secondary">
              <span className="font-medium text-ink">ICCID:</span> {profile.iccid}
            </p>
          )}
          {profile.qrCodeUrl && (
            <div className="mt-4 inline-block rounded-card border border-surface-border bg-white p-4">
              <Image
                src={profile.qrCodeUrl}
                alt="eSIM QR Code"
                width={160}
                height={160}
                className="rounded-btn"
                unoptimized
              />
            </div>
          )}
          {profile.ac && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-ink-secondary hover:text-ink">
                Show activation code
              </summary>
              <p className="mt-2 break-all rounded-btn bg-surface-soft p-3 font-mono text-xs text-ink-secondary">
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
      className="btn-primary text-sm disabled:opacity-50"
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
      className="btn-secondary text-sm disabled:opacity-50"
    >
      {loading ? 'Sending…' : sent ? 'Email sent!' : 'Resend Receipt'}
    </button>
  );
}
