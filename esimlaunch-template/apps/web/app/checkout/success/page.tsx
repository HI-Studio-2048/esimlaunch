'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { apiFetch } from '@/lib/apiClient';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { CheckoutProgress } from '@/components/checkout/CheckoutProgress';
import type { Order } from '@/lib/types';

/**
 * Success page — shown after Stripe redirects back.
 *
 * Reads session_id from URL, calls GET /api/orders/by-session/:sessionId,
 * and shows order status + CTA.
 *
 * Uses authFetch when signed in (attaches Clerk JWT) and bare apiFetch for guests.
 * The by-session endpoint is accessible without auth (session ID acts as secret).
 * The by-id endpoint allows pending orders without auth; paid orders need auth or guest token.
 */
export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('orderId');
  const { user } = useUser();
  const { authFetch } = useAuthFetch();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Prefer by-session lookup (no auth needed, session ID is secret).
    // Fall back to by-id with authFetch for signed-in users, bare apiFetch for guests.
    if (sessionId) {
      apiFetch<Order>(`/orders/by-session/${sessionId}`)
        .then(setOrder)
        .catch(() => setError('Could not load your order. Please check My eSIMs.'))
        .finally(() => setLoading(false));
      return;
    }
    if (orderId) {
      const fetchOrder = user
        ? authFetch<Order>(`/orders/${orderId}`)
        : apiFetch<Order>(`/orders/${orderId}`);
      fetchOrder
        .then(setOrder)
        .catch(() => setError('Could not load your order. Please check My eSIMs.'))
        .finally(() => setLoading(false));
      return;
    }
    setError('No session ID found.');
    setLoading(false);
  }, [sessionId, orderId, user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
        <p className="mt-4 text-slate-500">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-8">
          <p className="text-red-700">{error}</p>
          <Link
            href="/my-esims"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 font-medium text-white no-underline transition hover:bg-violet-500"
          >
            View My eSIMs
            <span>→</span>
          </Link>
        </div>
      </div>
    );
  }

  const isEsimCreated = order?.status === 'esim_created';

  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:py-24 text-center">
      <div className="mb-6 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">
          ✓
        </div>
      </div>
      <h1 className="mb-3 text-3xl font-bold text-slate-900">Payment Successful!</h1>
      <p className="mb-8 text-slate-600">
        {isEsimCreated
          ? 'Your eSIM is ready. Check your email for the QR code and installation instructions.'
          : "We're provisioning your eSIM now. You'll receive an email shortly."}
      </p>

      {order && (
        <div className="mb-8 rounded-card border border-slate-200 bg-white p-6 text-left shadow-card">
          <p className="text-sm">
            <span className="font-medium text-slate-700">Order:</span>{' '}
            <span className="text-slate-900">{order.id}</span>
          </p>
          <p className="mt-2 text-sm">
            <span className="font-medium text-slate-700">Plan:</span>{' '}
            <span className="text-slate-900">{order.planName ?? order.planId}</span>
          </p>
          <p className="mt-2 text-sm">
            <span className="font-medium text-slate-700">Status:</span>{' '}
            <span className="capitalize text-slate-900">{order.status.replace('_', ' ')}</span>
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Link
          href="/my-esims"
          className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-3.5 font-semibold text-white no-underline shadow-lg shadow-sky-500/25 transition hover:from-violet-600 hover:to-purple-600"
        >
          View My eSIMs
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-slate-200 px-6 py-3 font-medium text-slate-600 no-underline transition hover:bg-slate-50"
        >
          Browse more plans
        </Link>
      </div>
    </div>
  );
}
