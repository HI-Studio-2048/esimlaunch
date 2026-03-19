'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { apiFetch } from '@/lib/apiClient';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import type { Order } from '@/lib/types';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Skeleton } from '@/components/ui/skeleton';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('orderId');
  const { user, isSignedIn } = useUser();
  const { authFetch } = useAuthFetch();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedAc, setCopiedAc] = useState(false);
  const [guestEmailSent, setGuestEmailSent] = useState(false);
  const [sendingAccess, setSendingAccess] = useState(false);

  useEffect(() => {
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

  const profile = order?.esimProfile;
  const isEsimCreated = order?.status === 'esim_created';

  const copyActivationCode = async () => {
    if (!profile?.ac) return;
    await navigator.clipboard.writeText(profile.ac);
    setCopiedAc(true);
    setTimeout(() => setCopiedAc(false), 2000);
  };

  const downloadQr = async () => {
    if (!profile?.qrCodeUrl) return;
    try {
      const res = await fetch(profile.qrCodeUrl, { mode: 'cors' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `esim-qr-${order?.planName ?? 'plan'}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(profile.qrCodeUrl, '_blank');
    }
  };

  const shareQr = async () => {
    if (!profile?.qrCodeUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `eSIM: ${order?.planName ?? 'Plan'}`,
          text: 'Scan this QR code to install your eSIM',
          url: profile.qrCodeUrl,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(profile.qrCodeUrl);
    }
  };

  const sendGuestAccessLink = async () => {
    if (!order) return;
    setSendingAccess(true);
    try {
      const email = localStorage.getItem('checkout_email') || '';
      await apiFetch(`/orders/${order.id}/request-guest-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setGuestEmailSent(true);
    } catch {
      // silently fail
    } finally {
      setSendingAccess(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:py-20">
        <div className="mb-8 flex flex-col items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="mb-6 h-48 w-full rounded-card" />
        <Skeleton className="mb-6 h-32 w-full rounded-card" />
        <Skeleton className="h-12 w-full rounded-btn" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="rounded-card border border-red-100 bg-red-50 p-8">
          <p className="text-red-700">{error}</p>
          <Link
            href="/my-esims"
            className="btn-primary mt-6 inline-flex items-center gap-2 no-underline"
          >
            View My eSIMs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:py-20">
      <Breadcrumbs items={[{ label: 'Checkout', href: '/' }, { label: 'Payment Successful' }]} />

      {/* Success header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-void">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-void sm:text-3xl">Payment Successful!</h1>
        <p className="mt-2 text-dim">
          {isEsimCreated
            ? 'Your eSIM is ready to install.'
            : "We're provisioning your eSIM now. You'll receive an email shortly."}
        </p>
      </div>

      {/* eSIM Profile Card — shown when ready */}
      {isEsimCreated && profile && (
        <div className="mb-6 bg-surface rounded-card shadow-card p-6">
          {/* QR Code */}
          {profile.qrCodeUrl && (
            <div className="mb-4 flex flex-col items-center">
              <div className="rounded-card border border-rule bg-white p-3 shadow-card">
                <Image
                  src={profile.qrCodeUrl}
                  alt="eSIM QR Code"
                  width={180}
                  height={180}
                  className="rounded-card"
                  unoptimized
                />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={downloadQr}
                  className="btn-secondary px-3 py-1.5 text-sm"
                >
                  Download QR
                </button>
                <button
                  onClick={shareQr}
                  className="btn-secondary px-3 py-1.5 text-sm"
                >
                  Share
                </button>
              </div>
            </div>
          )}

          {/* ICCID */}
          {profile.iccid && (
            <div className="mb-3 text-sm">
              <span className="font-medium text-dim">ICCID:</span>{' '}
              <span className="font-mono text-void">{profile.iccid}</span>
            </div>
          )}

          {/* Activation Code with copy */}
          {profile.ac && (
            <div className="mb-3">
              <span className="text-sm font-medium text-dim">Activation Code:</span>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 break-all rounded-card bg-canvas px-3 py-2 font-mono text-xs text-void">
                  {profile.ac}
                </code>
                <button
                  onClick={copyActivationCode}
                  className="btn-secondary shrink-0 px-3 py-2 text-xs"
                >
                  {copiedAc ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order summary — always shown */}
      {order && (
        <div className="mb-6 bg-surface rounded-card shadow-card p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-dim">Plan</span>
            <span className="font-medium text-void">{order.planName ?? order.planId}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-dim">Status</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isEsimCreated ? 'badge-green' : 'badge-amber'
            }`}>
              {isEsimCreated ? 'Ready' : 'Provisioning...'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-dim">Amount</span>
            <span className="font-medium text-void">
              ${((order.displayAmountCents ?? order.amountCents) / 100).toFixed(2)}
              {order.displayCurrency && order.displayCurrency !== 'USD' ? ` ${order.displayCurrency}` : ' USD'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-dim">Email sent</span>
            <span className="text-void">
              {order.status !== 'pending' ? 'Yes — check your inbox' : 'Pending...'}
            </span>
          </div>
        </div>
      )}

      {/* Next Steps */}
      {isEsimCreated && (
        <div className="mb-6 rounded-card border border-rule bg-canvas p-5">
          <h3 className="mb-3 text-sm font-semibold text-void">Next Steps</h3>
          <ol className="space-y-2 text-sm text-void">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-void text-xs font-bold text-white">1</span>
              <span>Open your phone&apos;s <strong>Settings &gt; Cellular &gt; Add eSIM</strong></span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-void text-xs font-bold text-white">2</span>
              <span>Scan the <strong>QR code</strong> above or enter the activation code manually</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-void text-xs font-bold text-white">3</span>
              <span>Enable <strong>Data Roaming</strong> and select the eSIM as your data line</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-void text-xs font-bold text-white">4</span>
              <span>You&apos;re connected! Track your usage in <strong>My eSIMs</strong></span>
            </li>
          </ol>
        </div>
      )}

      {/* CTAs — different for guest vs signed in */}
      <div className="flex flex-col gap-3">
        {isSignedIn ? (
          <Link
            href="/my-esims"
            className="btn-primary block text-center no-underline"
          >
            View My eSIMs
          </Link>
        ) : (
          <>
            <Link
              href="/sign-up"
              className="btn-primary block text-center no-underline"
            >
              Create Account to Manage Your eSIMs
            </Link>
            {!guestEmailSent ? (
              <button
                onClick={sendGuestAccessLink}
                disabled={sendingAccess}
                className="btn-secondary w-full text-center disabled:opacity-50"
              >
                {sendingAccess ? 'Sending...' : 'Send Access Link to My Email'}
              </button>
            ) : (
              <p className="rounded-card border border-emerald-200 bg-emerald-50 px-6 py-3 text-center text-sm text-emerald-700">
                Access link sent! Check your email.
              </p>
            )}
          </>
        )}
        <Link
          href="/"
          className="btn-secondary block text-center no-underline"
        >
          Browse more plans
        </Link>
      </div>
    </div>
  );
}
