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
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-rule border-t-void" />
        <p className="mt-4 text-dim">Loading…</p>
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
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-rule border-t-void" />
      </div>
    );
  }
  if (error || !order) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <p className="text-red-600">{error ?? 'Order not found'}</p>
        <Link href="/account/orders" className="mt-4 inline-block text-link hover:underline">
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
        <h1 className="text-2xl font-bold text-void">Order Details</h1>
        <Link
          href="/account/orders"
          className="text-sm font-medium text-link hover:underline"
        >
          ← Order History
        </Link>
      </div>

      <div className="card p-6">
        <p className="text-sm">
          <span className="font-medium text-dim">Order ID:</span>{' '}
          <span className="font-mono text-void">{order.id}</span>
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium text-dim">Plan:</span>{' '}
          <span className="text-void">{order.planName ?? order.planId}</span>
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium text-dim">Amount:</span>{' '}
          <span className="font-semibold text-void">
            {displayAmount}
          </span>
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium text-dim">Status:</span>{' '}
          <span className="capitalize text-void">{order.status.replace(/_/g, ' ')}</span>
        </p>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <ReceiptDownloadButton orderId={order.id} authFetchBlob={authFetchBlob} />
        <ResendReceiptButton orderId={order.id} authFetch={authFetch} />
        {profile && (
          <Link
            href="/my-esims"
            className="btn-secondary text-sm"
          >
            My eSIMs
          </Link>
        )}
      </div>

      {profile && (
        <div className="mt-8 card p-6">
          <h2 className="mb-4 font-semibold text-void">eSIM Details</h2>
          {profile.iccid && (
            <p className="mb-3 text-sm text-dim">
              <span className="font-medium">ICCID:</span> {profile.iccid}
            </p>
          )}
          {profile.qrCodeUrl && (
            <div className="mt-4 inline-block rounded-card border border-rule bg-surface p-4">
              <Image
                src={profile.qrCodeUrl}
                alt="eSIM QR Code"
                width={160}
                height={160}
                className="rounded-btn-sq"
                unoptimized
              />
            </div>
          )}
          {profile.ac && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-dim hover:text-void">
                Show activation code
              </summary>
              <p className="mt-2 break-all rounded-btn-sq bg-canvas p-3 font-mono text-xs text-dim">
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
