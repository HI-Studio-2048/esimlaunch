'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { useAuthFetch } from '@/hooks/useAuthFetch';

interface Commission {
  id: string;
  amountCents: number;
  status: string;
  orderId: string | null;
  createdAt: string;
}

interface Referral {
  id: string;
  referredUserId: string;
  firstPurchaseDiscountUsed: boolean;
  createdAt: string;
}

interface AffiliateData {
  id: string;
  referralCode: string;
  totalCommission: number;
  isFrozen: boolean;
  referrals: Referral[];
  commissions: Commission[];
}

export default function AffiliateDashboardPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { authFetch } = useAuthFetch();
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    authFetch<AffiliateData>('/affiliate/me')
      .then(setAffiliate)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.primaryEmailAddress?.emailAddress, authFetch]);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
        <p className="mt-4 text-slate-500">Loading…</p>
      </div>
    );
  }
  if (!isSignedIn) {
    redirect('/sign-in');
    return null;
  }

  const shareLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?ref=${affiliate?.referralCode ?? ''}`
      : '';

  const copyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading || !affiliate) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
        </div>
      </div>
    );
  }

  const totalFormatted = `$${(affiliate.totalCommission / 100).toFixed(2)}`;
  const recentReferrals = affiliate.referrals.slice(0, 5);
  const recentCommissions = affiliate.commissions.slice(0, 5);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Affiliate Dashboard</h1>
        <Link
          href="/account"
          className="text-sm font-medium text-violet-600 hover:text-violet-700"
        >
          ← Back to Account
        </Link>
      </div>

      {/* Referral code + share link */}
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 font-semibold text-slate-900">Your referral code</h2>
        <p className="mb-4 font-mono text-2xl font-bold text-violet-600">{affiliate.referralCode}</p>
        <p className="mb-2 text-sm text-slate-600">Shareable link:</p>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={shareLink}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
          />
          <button
            onClick={copyLink}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Share this link with friends. When they sign up and make their first purchase,
          you earn 10% commission.
        </p>
      </div>

      {/* Commissions summary */}
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-900">Commissions summary</h2>
        <p className="text-2xl font-bold text-slate-900">{totalFormatted}</p>
        <p className="mt-1 text-sm text-slate-600">Total earned (includes pending)</p>
        {affiliate.isFrozen && (
          <p className="mt-3 text-sm text-amber-600">Your account is frozen. Contact support.</p>
        )}
      </div>

      {/* Recent referrals */}
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-900">Recent referrals</h2>
        {recentReferrals.length === 0 ? (
          <p className="text-sm text-slate-600">No referrals yet. Share your link to get started!</p>
        ) : (
          <ul className="space-y-2">
            {recentReferrals.map((r) => (
              <li key={r.id} className="flex justify-between text-sm">
                <span className="text-slate-600">
                  Referral • {r.firstPurchaseDiscountUsed ? 'Converted' : 'Signed up'}
                </span>
                <span className="text-slate-500">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent commissions */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-900">Recent commissions</h2>
        {recentCommissions.length === 0 ? (
          <p className="text-sm text-slate-600">No commissions yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentCommissions.map((c) => (
              <li key={c.id} className="flex justify-between text-sm">
                <span className="text-slate-700">
                  ${(c.amountCents / 100).toFixed(2)} • {c.status}
                </span>
                <span className="text-slate-500">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-slate-500">
          Payouts are managed by the merchant. Contact support for payout inquiries.
        </p>
      </div>
    </div>
  );
}
