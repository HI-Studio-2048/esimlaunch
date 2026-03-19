'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { apiFetch } from '@/lib/apiClient';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { CheckoutProgress } from '@/components/checkout/CheckoutProgress';
import type { Order } from '@/lib/types';
import { formatDisplayAmount } from '@/lib/types';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

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
  const { authFetch } = useAuthFetch();

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

  // Restore persisted values from localStorage on mount
  useEffect(() => {
    const savedPromo = localStorage.getItem('checkout_promo');
    const savedReferral = localStorage.getItem('checkout_referral');
    const savedEmail = localStorage.getItem('checkout_email');
    if (savedPromo) setPromoCode(savedPromo);
    if (savedReferral) setReferralCode(savedReferral);

    const userEmail = user?.primaryEmailAddress?.emailAddress ?? savedEmail ?? '';
    setEmail(userEmail);

    const fetchOrder = user ? authFetch<Order>(`/orders/${orderId}`) : apiFetch<Order>(`/orders/${orderId}`);
    fetchOrder
      .then(setOrder)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderId, user]);

  // Persist email to localStorage for guest access flow on success page
  useEffect(() => {
    if (email && !email.startsWith('guest-')) {
      localStorage.setItem('checkout_email', email);
    }
  }, [email]);

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
      localStorage.setItem('checkout_promo', promoCode);
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
      localStorage.removeItem('checkout_promo');
    } catch (e: any) {
      setMessage(e.message);
    }
  };

  const handlePayWithStoreCredit = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    setPaying(true);
    setMessage(null);
    try {
      await authFetch(`/orders/${orderId}/pay-vcash`, {
        method: 'POST',
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
      if (res.url) {
        localStorage.removeItem('checkout_promo');
        localStorage.removeItem('checkout_referral');
        window.location.href = res.url;
      }
    } catch (e: any) {
      setMessage(e.message ?? 'Payment failed. Please try again.');
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-rule border-t-void" />
        <p className="mt-4 text-dim">Loading order…</p>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="py-24 text-center">
        <div className="mx-auto max-w-md rounded-card border border-red-100 bg-red-50 p-6 text-red-700">
          Order not found.
        </div>
      </div>
    );
  }
  if (order.status !== 'pending') {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="bg-surface rounded-card shadow-card p-8">
          <p className="text-void">
            This order has already been {order.status}. Check{' '}
            <a href="/my-esims" className="font-medium text-link hover:underline">
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
      <Breadcrumbs items={[{ label: 'Checkout' }]} />
      <h1 className="mb-8 text-2xl font-bold text-void sm:text-3xl">Checkout</h1>

      {/* Order summary */}
      <div className="mb-6 bg-surface rounded-card shadow-card p-6">
        <p className="font-semibold text-void">{order.planName ?? order.planId}</p>
        <p className="mt-2 text-2xl font-bold text-void">
          {displayAmount} {displayCurrency}
        </p>
      </div>

      {/* Email */}
      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-void">
          Email address
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input flex-1"
          />
          <button
            onClick={handleUpdateEmail}
            className="btn-secondary px-4 py-2.5 text-sm"
          >
            Update
          </button>
        </div>
        <p className="mt-1.5 text-xs text-dim">
          Your eSIM and receipt will be sent here.
        </p>
      </div>

      {/* Promo code */}
      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-void">Promo code</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="PROMO"
            className="input flex-1 uppercase disabled:bg-canvas"
            disabled={promoApplied}
          />
          {promoApplied ? (
            <button
              onClick={handleRemovePromo}
              className="rounded-btn-sq border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              Remove
            </button>
          ) : (
            <button
              onClick={handleApplyPromo}
              className="btn-secondary px-4 py-2.5 text-sm"
            >
              Apply
            </button>
          )}
        </div>
      </div>

      {/* Referral code */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-void">
          Referral code (optional)
        </label>
        <input
          type="text"
          value={referralCode}
          onChange={(e) => {
            const val = e.target.value.toUpperCase();
            setReferralCode(val);
            if (val) localStorage.setItem('checkout_referral', val);
            else localStorage.removeItem('checkout_referral');
          }}
          placeholder="FRIEND123"
          className="input w-full uppercase"
        />
        <p className="mt-1.5 text-xs text-dim">
          First purchase? Get 10% off with a valid referral code.
        </p>
      </div>

      {message && (
        <p className="mb-4 rounded-card bg-blue-50 px-4 py-3 text-sm text-link">
          {message}
        </p>
      )}

      {/* Store Credit */}
      {canPayStoreCredit && (
        <button
          onClick={handlePayWithStoreCredit}
          disabled={paying}
          className="mb-4 w-full rounded-btn-sq border-2 border-rule bg-canvas py-3.5 font-semibold text-void transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          {paying ? 'Processing…' : `Pay with Store Credit (${formatDisplayAmount(balanceCents!, 'USD')} available)`}
        </button>
      )}

      {/* Pay button */}
      <button
        onClick={handlePay}
        disabled={paying}
        className="btn-primary w-full py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {paying ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Redirecting to payment…
          </span>
        ) : (
          `Pay ${displayAmount}`
        )}
      </button>

      <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-dim">
        <span>🔒</span>
        Secured by Stripe · No contracts · Instant activation
      </p>
    </div>
  );
}
