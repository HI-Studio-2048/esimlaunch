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
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: 'var(--border-bright)', borderTopColor: 'var(--electric)' }}
        />
        <p className="mt-4" style={{ color: 'var(--text-muted)' }}>Loading order…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="py-24 text-center">
        <div
          className="mx-auto max-w-md rounded-2xl p-6"
          style={{
            border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.1)',
            color: '#f87171',
          }}
        >
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
      <h1 className="mb-8 text-2xl font-bold" style={{ color: 'var(--text)' }}>Your Order</h1>

      <div
        className="rounded-card p-6"
        style={{
          border: '1px solid var(--border)',
          background: 'var(--night-50)',
        }}
      >
        <p className="text-sm">
          <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Order ID:</span>{' '}
          <span style={{ color: 'var(--text)' }}>{order.id}</span>
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Plan:</span>{' '}
          <span style={{ color: 'var(--text)' }}>{order.planName ?? order.planId}</span>
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Amount:</span>{' '}
          <span className="font-semibold" style={{ color: 'var(--text)' }}>
            {displayAmount}
          </span>
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Status:</span>{' '}
          <span className="capitalize" style={{ color: 'var(--text)' }}>{order.status.replace('_', ' ')}</span>
        </p>
      </div>

      {profile && (
        <div
          className="mt-6 rounded-card p-6"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--night-50)',
          }}
        >
          <h2 className="mb-4 font-semibold" style={{ color: 'var(--text)' }}>eSIM Details</h2>
          {profile.iccid && (
            <p className="mb-3 text-sm" style={{ color: 'var(--text)' }}>
              <span className="font-medium">ICCID:</span> {profile.iccid}
            </p>
          )}
          {profile.qrCodeUrl && (
            <div
              className="mt-4 rounded-xl p-4 inline-block"
              style={{
                border: '1px solid var(--border)',
                background: 'var(--night-100)',
              }}
            >
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
              <summary
                className="cursor-pointer text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
              >
                Show activation code
              </summary>
              <p
                className="mt-2 break-all rounded-lg p-3 font-mono text-xs"
                style={{
                  background: 'var(--night-100)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                }}
              >
                {profile.ac}
              </p>
            </details>
          )}
        </div>
      )}

      <div
        className="mt-8 rounded-card p-6 text-center"
        style={{
          border: '1px solid var(--border)',
          background: 'rgba(79, 126, 255, 0.06)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Want to manage your eSIMs?{' '}
          <Link
            href="/sign-up"
            className="font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--electric)' }}
          >
            Create a free account
          </Link>
        </p>
      </div>
    </div>
  );
}
