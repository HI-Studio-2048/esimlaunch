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
        <Skeleton className="mb-6 h-48 w-full rounded-2xl" />
        <Skeleton className="mb-6 h-32 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
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
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-medium text-white no-underline transition hover:bg-violet-500"
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
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Payment Successful!</h1>
        <p className="mt-2 text-slate-600">
          {isEsimCreated
            ? 'Your eSIM is ready to install.'
            : "We're provisioning your eSIM now. You'll receive an email shortly."}
        </p>
      </div>

      {/* eSIM Profile Card — shown when ready */}
      {isEsimCreated && profile && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* QR Code */}
          {profile.qrCodeUrl && (
            <div className="mb-4 flex flex-col items-center">
              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <Image
                  src={profile.qrCodeUrl}
                  alt="eSIM QR Code"
                  width={180}
                  height={180}
                  className="rounded-lg"
                  unoptimized
                />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={downloadQr}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Download QR
                </button>
                <button
                  onClick={shareQr}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Share
                </button>
              </div>
            </div>
          )}

          {/* ICCID */}
          {profile.iccid && (
            <div className="mb-3 text-sm">
              <span className="font-medium text-slate-500">ICCID:</span>{' '}
              <span className="font-mono text-slate-800">{profile.iccid}</span>
            </div>
          )}

          {/* Activation Code with copy */}
          {profile.ac && (
            <div className="mb-3">
              <span className="text-sm font-medium text-slate-500">Activation Code:</span>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800">
                  {profile.ac}
                </code>
                <button
                  onClick={copyActivationCode}
                  className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
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
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Plan</span>
            <span className="font-medium text-slate-900">{order.planName ?? order.planId}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-slate-500">Status</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isEsimCreated ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {isEsimCreated ? 'Ready' : 'Provisioning...'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-slate-500">Amount</span>
            <span className="font-medium text-slate-900">
              ${((order.displayAmountCents ?? order.amountCents) / 100).toFixed(2)}
              {order.displayCurrency && order.displayCurrency !== 'USD' ? ` ${order.displayCurrency}` : ' USD'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-slate-500">Email sent</span>
            <span className="text-slate-700">
              {order.status !== 'pending' ? 'Yes — check your inbox' : 'Pending...'}
            </span>
          </div>
        </div>
      )}

      {/* Next Steps */}
      {isEsimCreated && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Next Steps</h3>
          <ol className="space-y-2 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">1</span>
              <span>Open your phone&apos;s <strong>Settings &gt; Cellular &gt; Add eSIM</strong></span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">2</span>
              <span>Scan the <strong>QR code</strong> above or enter the activation code manually</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">3</span>
              <span>Enable <strong>Data Roaming</strong> and select the eSIM as your data line</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">4</span>
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
            className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-3.5 text-center font-semibold text-white no-underline shadow-lg shadow-violet-500/25 transition hover:from-violet-600 hover:to-purple-700"
          >
            View My eSIMs
          </Link>
        ) : (
          <>
            <Link
              href="/sign-up"
              className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-3.5 text-center font-semibold text-white no-underline shadow-lg shadow-violet-500/25 transition hover:from-violet-600 hover:to-purple-700"
            >
              Create Account to Manage Your eSIMs
            </Link>
            {!guestEmailSent ? (
              <button
                onClick={sendGuestAccessLink}
                disabled={sendingAccess}
                className="rounded-xl border border-slate-200 px-6 py-3 text-center font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {sendingAccess ? 'Sending...' : 'Send Access Link to My Email'}
              </button>
            ) : (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-3 text-center text-sm text-emerald-700">
                Access link sent! Check your email.
              </p>
            )}
          </>
        )}
        <Link
          href="/"
          className="rounded-xl border border-slate-200 px-6 py-3 text-center font-medium text-slate-600 no-underline transition hover:bg-slate-50"
        >
          Browse more plans
        </Link>
      </div>
    </div>
  );
}
