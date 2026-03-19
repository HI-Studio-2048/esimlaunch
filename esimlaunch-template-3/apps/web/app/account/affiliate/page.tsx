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
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: 'var(--border-bright)', borderTopColor: 'var(--electric)' }}
        />
        <p className="mt-4" style={{ color: 'var(--text-muted)' }}>Loading…</p>
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
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: 'var(--border-bright)', borderTopColor: 'var(--electric)' }}
          />
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
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Affiliate Dashboard</h1>
        <Link
          href="/account"
          className="text-sm font-medium transition-colors"
          style={{ color: 'var(--electric)' }}
        >
          ← Back to Account
        </Link>
      </div>

      {/* Referral code + share link */}
      <div
        className="card mb-8 p-6"
        style={{ borderColor: 'var(--border)' }}
      >
        <h2 className="mb-2 font-semibold" style={{ color: 'var(--text)' }}>Your referral code</h2>
        <p className="mb-4 font-mono text-2xl font-bold" style={{ color: 'var(--electric)' }}>
          {affiliate.referralCode}
        </p>
        <p className="mb-2 text-sm" style={{ color: 'var(--text-muted)' }}>Shareable link:</p>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={shareLink}
            className="input flex-1 text-sm"
          />
          <button
            onClick={copyLink}
            className="btn-primary px-4 py-2 text-sm"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          Share this link with friends. When they sign up and make their first purchase,
          you earn 10% commission.
        </p>
      </div>

      {/* Commissions summary */}
      <div
        className="card mb-8 p-6"
        style={{ borderColor: 'var(--border)' }}
      >
        <h2 className="mb-4 font-semibold" style={{ color: 'var(--text)' }}>Commissions summary</h2>
        <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{totalFormatted}</p>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Total earned (includes pending)</p>
        {affiliate.isFrozen && (
          <p className="mt-3 text-sm" style={{ color: '#f59e0b' }}>Your account is frozen. Contact support.</p>
        )}
      </div>

      {/* Recent referrals */}
      <div
        className="card mb-8 p-6"
        style={{ borderColor: 'var(--border)' }}
      >
        <h2 className="mb-4 font-semibold" style={{ color: 'var(--text)' }}>Recent referrals</h2>
        {recentReferrals.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No referrals yet. Share your link to get started!</p>
        ) : (
          <ul className="space-y-2">
            {recentReferrals.map((r) => (
              <li key={r.id} className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>
                  Referral • {r.firstPurchaseDiscountUsed ? 'Converted' : 'Signed up'}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent commissions */}
      <div
        className="card p-6"
        style={{ borderColor: 'var(--border)' }}
      >
        <h2 className="mb-4 font-semibold" style={{ color: 'var(--text)' }}>Recent commissions</h2>
        {recentCommissions.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No commissions yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentCommissions.map((c) => (
              <li key={c.id} className="flex justify-between text-sm">
                <span style={{ color: 'var(--text)' }}>
                  ${(c.amountCents / 100).toFixed(2)} • {c.status}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          Payouts are managed by the merchant. Contact support for payout inquiries.
        </p>
      </div>
    </div>
  );
}
