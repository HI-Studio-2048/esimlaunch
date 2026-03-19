'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { apiFetch } from '@/lib/apiClient';
import type { Order } from '@/lib/types';
import { formatDisplayAmount } from '@/lib/types';

/**
 * Guest order view.
 * URL: /orders/:orderId?token=...&email=...
 *
 * Calls GET /api/orders/:orderId/guest?token=...&email=...
 * Shows order details and eSIM QR code without requiring auth.
 */
export default function GuestOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid or missing access link.');
      setLoading(false);
      return;
    }
    apiFetch<Order>(
      `/orders/${orderId}/guest?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`,
    )
      .then(setOrder)
      .catch(() => setError('Access denied or link expired.'))
      .finally(() => setLoading(false));
  }, [orderId, token, email]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-rule border-t-void" />
        <p className="mt-4 text-dim">Loading order…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="py-24 text-center">
        <div className="mx-auto max-w-md rounded-card border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      </div>
    );
  }
  if (!order) return null;

  const profile = order.esimProfile;
  const displayAmount = formatDisplayAmount(order.displayAmountCents ?? order.amountCents, order.displayCurrency ?? 'USD');

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <h1 className="mb-8 text-2xl font-bold text-void">Your Order</h1>

      <div className="card p-6">
        <p className="text-sm">
          <span className="font-medium text-dim">Order ID:</span>{' '}
          <span className="text-void">{order.id}</span>
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
          <span className="capitalize text-void">{order.status.replace('_', ' ')}</span>
        </p>
      </div>

      {profile && (
        <div className="mt-6 card p-6">
          <h2 className="mb-4 font-semibold text-void">eSIM Details</h2>
          {profile.iccid && (
            <p className="mb-3 text-sm text-dim">
              <span className="font-medium">ICCID:</span> {profile.iccid}
            </p>
          )}
          {profile.qrCodeUrl && (
            <div className="mt-4 rounded-card border border-rule bg-surface p-4 inline-block">
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
            <details className="mt-4 group">
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

      <div className="mt-8 card p-6 text-center">
        <p className="text-sm text-dim">
          Want to manage your eSIMs?{' '}
          <Link href="/sign-up" className="font-medium text-link hover:underline">
            Create a free account
          </Link>
        </p>
      </div>
    </div>
  );
}
