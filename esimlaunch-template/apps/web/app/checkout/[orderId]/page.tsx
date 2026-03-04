'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { apiFetch } from '@/lib/apiClient';
import { CheckoutProgress } from '@/components/checkout/CheckoutProgress';
import type { Order } from '@/lib/types';
import { formatDisplayAmount } from '@/lib/types';

/**
 * Checkout page.
 *
 * Flow:
 * 1. Load order via GET /api/orders/:orderId
 * 2. Guest user can update email via POST /api/orders/:orderId/update-email
 * 3. Optional promo via POST /api/orders/:orderId/validate-promo
 * 4. Optional referral check via GET /api/orders/:orderId/referral-discount
 * 5. "Pay with card" → POST /api/orders/:orderId/checkout → redirect to Stripe
 *
 * Currency: amounts are stored as cents; divide by 100 for display.
 */
export default function CheckoutPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useUser();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [originalAmountCents, setOriginalAmountCents] = useState<number | null>(null);
  const [originalDisplayAmountCents, setOriginalDisplayAmountCents] = useState<number | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [balanceCents, setBalanceCents] = useState<number | null>(null);

  useEffect(() => {
    const userEmail = user?.primaryEmailAddress?.emailAddress ?? '';
    setEmail(userEmail);
    apiFetch<Order>(`/orders/${orderId}`)
      .then(setOrder)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderId, user]);

  const displayCurrency = order?.displayCurrency ?? 'USD';
  const displayAmountCents = order?.displayAmountCents ?? order?.amountCents ?? 0;
  const displayAmount = formatDisplayAmount(displayAmountCents, displayCurrency);

  const handleUpdateEmail = async () => {
    if (!email) return;
    try {
      const updated = await apiFetch<Order>(`/orders/${orderId}/update-email`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setOrder(updated);
      setMessage('Email updated.');
    } catch (e: any) {
      setMessage(e.message);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    try {
      if (!originalAmountCents && order) {
        setOriginalAmountCents(order.amountCents);
        setOriginalDisplayAmountCents(order.displayAmountCents ?? order.amountCents);
      }
      const res = await apiFetch<{ newAmountCents: number; newDisplayAmountCents: number; discount: number }>(
        `/orders/${orderId}/validate-promo`,
        { method: 'POST', body: JSON.stringify({ promoCode }) },
      );
      setOrder((prev) =>
        prev
          ? { ...prev, amountCents: res.newAmountCents, displayAmountCents: res.newDisplayAmountCents }
          : prev,
      );
      setPromoApplied(true);
      setMessage(`Promo applied: ${res.discount}% off`);
    } catch (e: any) {
      setMessage(e.message);
    }
  };

  const handleRemovePromo = async () => {
    if (!originalAmountCents) return;
    try {
      await apiFetch(`/orders/${orderId}/remove-promo`, {
        method: 'POST',
        body: JSON.stringify({
          originalAmountCents,
          originalDisplayAmountCents: originalDisplayAmountCents ?? originalAmountCents,
        }),
      });
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              amountCents: originalAmountCents,
              displayAmountCents: originalDisplayAmountCents ?? originalAmountCents,
            }
          : prev,
      );
      setPromoApplied(false);
      setPromoCode('');
      setMessage('Promo removed.');
    } catch (e: any) {
      setMessage(e.message);
    }
  };

  const handlePayWithStoreCredit = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    setPaying(true);
    setMessage(null);
    try {
      await apiFetch(`/orders/${orderId}/pay-vcash`, {
        method: 'POST',
        userEmail: user.primaryEmailAddress.emailAddress,
      });
      window.location.href = `/checkout/success?orderId=${orderId}`;
    } catch (e: any) {
      setMessage(e.message ?? 'Payment failed. Please try again.');
      setPaying(false);
    }
  };

  const handlePay = async () => {
    setPaying(true);
    setMessage(null);
    try {
      const res = await apiFetch<{ url: string }>(`/orders/${orderId}/checkout`, {
        method: 'POST',
        body: JSON.stringify({ referralCode: referralCode || undefined }),
      });
      if (res.url) window.location.href = res.url;
    } catch (e: any) {
      setMessage(e.message ?? 'Payment failed. Please try again.');
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
        <p className="mt-4 text-slate-500">Loading order…</p>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="py-24 text-center">
        <div className="mx-auto max-w-md rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
          Order not found.
        </div>
      </div>
    );
  }
  if (order.status !== 'pending') {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
          <p className="text-slate-700">
            This order has already been {order.status}. Check{' '}
            <a href="/my-esims" className="font-medium text-violet-600 hover:text-violet-700">
              My eSIMs
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  const canPayStoreCredit =
    user?.primaryEmailAddress?.emailAddress &&
    balanceCents != null &&
    balanceCents >= displayAmountCents;

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <h1 className="mb-8 text-2xl font-bold text-slate-900 sm:text-3xl">Checkout</h1>

      {/* Order summary */}
      <div className="mb-6 rounded-card border border-slate-200 bg-white p-6 shadow-card">
        <p className="font-semibold text-slate-800">{order.planName ?? order.planId}</p>
        <p className="mt-2 text-2xl font-bold text-violet-600">
          {displayAmount} {displayCurrency}
        </p>
      </div>

      {/* Email */}
      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Email address
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
          <button
            onClick={handleUpdateEmail}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Update
          </button>
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          Your eSIM and receipt will be sent here.
        </p>
      </div>

      {/* Promo code */}
      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-slate-700">Promo code</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="PROMO"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm uppercase text-slate-900 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50"
            disabled={promoApplied}
          />
          {promoApplied ? (
            <button
              onClick={handleRemovePromo}
              className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              Remove
            </button>
          ) : (
            <button
              onClick={handleApplyPromo}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium transition hover:bg-slate-50"
            >
              Apply
            </button>
          )}
        </div>
      </div>

      {/* Referral code */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Referral code (optional)
        </label>
        <input
          type="text"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          placeholder="FRIEND123"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm uppercase text-slate-900 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        />
        <p className="mt-1.5 text-xs text-slate-500">
          First purchase? Get 10% off with a valid referral code.
        </p>
      </div>

      {message && (
        <p className="mb-4 rounded-xl bg-violet-50 px-4 py-3 text-sm text-sky-700">
          {message}
        </p>
      )}

      {/* Store Credit */}
      {canPayStoreCredit && (
        <button
          onClick={handlePayWithStoreCredit}
          disabled={paying}
          className="mb-4 w-full rounded-xl border-2 border-violet-200 bg-violet-50 py-3.5 font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {paying ? 'Processing…' : `Pay with Store Credit (${formatDisplayAmount(balanceCents!, 'USD')} available)`}
        </button>
      )}

      {/* Pay button */}
      <button
        onClick={handlePay}
        disabled={paying}
        className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 py-3.5 font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:from-violet-600 hover:to-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {paying ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Redirecting to payment…
          </span>
        ) : (
          `Pay ${displayAmount}`
        )}
      </button>

      <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
        <span>🔒</span>
        Secured by Stripe · No contracts · Instant activation
      </p>
    </div>
  );
}
