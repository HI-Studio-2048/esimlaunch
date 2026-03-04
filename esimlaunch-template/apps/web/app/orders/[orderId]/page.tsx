'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { apiFetch } from '@/lib/apiClient';
import type { Order } from '@/lib/types';

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
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
        <p className="mt-4 text-slate-500">Loading order…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="py-24 text-center">
        <div className="mx-auto max-w-md rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      </div>
    );
  }
  if (!order) return null;

  const profile = order.esimProfile;
  const displayAmount = ((order.displayAmountCents ?? order.amountCents) / 100).toFixed(2);

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <h1 className="mb-8 text-2xl font-bold text-slate-900">Your Order</h1>

      <div className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
        <p className="text-sm">
          <span className="font-medium text-slate-600">Order ID:</span>{' '}
          <span className="text-slate-900">{order.id}</span>
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium text-slate-600">Plan:</span>{' '}
          <span className="text-slate-900">{order.planName ?? order.planId}</span>
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium text-slate-600">Amount:</span>{' '}
          <span className="font-semibold text-slate-900">
            {displayAmount} {order.displayCurrency ?? 'USD'}
          </span>
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium text-slate-600">Status:</span>{' '}
          <span className="capitalize text-slate-900">{order.status.replace('_', ' ')}</span>
        </p>
      </div>

      {profile && (
        <div className="mt-6 rounded-card border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="mb-4 font-semibold text-slate-800">eSIM Details</h2>
          {profile.iccid && (
            <p className="mb-3 text-sm text-slate-700">
              <span className="font-medium">ICCID:</span> {profile.iccid}
            </p>
          )}
          {profile.qrCodeUrl && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 inline-block">
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
            <details className="mt-4 group">
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

      <div className="mt-8 rounded-card border border-slate-200 bg-sky-50/50 p-6 text-center">
        <p className="text-sm text-slate-600">
          Want to manage your eSIMs?{' '}
          <Link href="/sign-up" className="font-medium text-violet-600 hover:text-violet-700">
            Create a free account
          </Link>
        </p>
      </div>
    </div>
  );
}
