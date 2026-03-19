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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: 'var(--border-bright)', borderTopColor: 'var(--electric)' }}
        />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <p style={{ color: '#f87171' }}>{error ?? 'Order not found'}</p>
        <Link
          href="/account/orders"
          className="mt-4 inline-block font-medium hover:underline"
          style={{ color: 'var(--electric)' }}
        >
          ← Back to Order History
        </Link>
      </div>
    );
  }

  const profile = order.esimProfile;
  const displayAmount = formatDisplayAmount(
    order.displayAmountCents ?? order.amountCents,
    order.displayCurrency ?? 'USD',
  );

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Order Details</h1>
        <Link
          href="/account/orders"
          className="text-sm font-medium hover:underline"
          style={{ color: 'var(--electric)' }}
        >
          ← Order History
        </Link>
      </div>

      {/* Order summary */}
      <div className="card p-6">
        <p className="text-sm">
          <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Order ID:</span>{' '}
          <span className="font-mono" style={{ color: 'var(--text)' }}>{order.id}</span>
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Plan:</span>{' '}
          <span style={{ color: 'var(--text)' }}>{order.planName ?? order.planId}</span>
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Amount:</span>{' '}
          <span className="font-semibold" style={{ color: 'var(--text)' }}>{displayAmount}</span>
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Status:</span>{' '}
          <span className="capitalize" style={{ color: 'var(--text)' }}>
            {order.status.replace(/_/g, ' ')}
          </span>
        </p>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <ReceiptDownloadButton orderId={order.id} authFetchBlob={authFetchBlob} />
        <ResendReceiptButton orderId={order.id} authFetch={authFetch} />
        {profile && (
          <Link href="/my-esims" className="btn-secondary">
            My eSIMs
          </Link>
        )}
      </div>

      {/* eSIM details */}
      {profile && (
        <div className="card mt-8 p-6">
          <h2 className="mb-4 font-semibold" style={{ color: 'var(--text)' }}>eSIM Details</h2>
          {profile.iccid && (
            <p className="mb-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="font-medium" style={{ color: 'var(--text)' }}>ICCID:</span>{' '}
              {profile.iccid}
            </p>
          )}
          {profile.qrCodeUrl && (
            <div
              className="mt-4 inline-block rounded-card border p-4"
              style={{ borderColor: 'var(--border)', background: 'var(--night)' }}
            >
              <Image
                src={profile.qrCodeUrl}
                alt="eSIM QR Code"
                width={160}
                height={160}
                className="rounded-card"
                unoptimized
              />
            </div>
          )}
          {profile.ac && (
            <details className="mt-4">
              <summary
                className="cursor-pointer text-sm font-medium hover:underline"
                style={{ color: 'var(--text-muted)' }}
              >
                Show activation code
              </summary>
              <p
                className="mt-2 break-all rounded-card p-3 font-mono text-xs"
                style={{ background: 'var(--night)', color: 'var(--text-muted)' }}
              >
                {profile.ac}
              </p>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function ReceiptDownloadButton({
  orderId,
  authFetchBlob,
}: {
  orderId: string;
  authFetchBlob: (path: string, options?: RequestInit) => Promise<Blob>;
}) {
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
      className="btn-primary disabled:opacity-50"
    >
      {loading ? 'Downloading…' : 'Download Receipt'}
    </button>
  );
}

function ResendReceiptButton({
  orderId,
  authFetch,
}: {
  orderId: string;
  authFetch: <T = unknown>(path: string, options?: RequestInit) => Promise<T>;
}) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    setSent(false);
    try {
      await authFetch(`/orders/${orderId}/resend-receipt`, { method: 'POST' });
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
      className="btn-secondary disabled:opacity-50"
    >
      {loading ? 'Sending…' : sent ? 'Email sent!' : 'Resend Receipt'}
    </button>
  );
}
