'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUser, useClerk } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { useAuthFetch } from '@/hooks/useAuthFetch';

/**
 * Account settings.
 * - Shows user info.
 * - Delete account: calls POST /api/user/delete-account → signs out → redirects home.
 */
export default function AccountSettingsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { authFetch } = useAuthFetch();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-border border-t-teal-400" />
        <p className="mt-4 text-ink-muted">Loading…</p>
      </div>
    );
  }
  if (!isSignedIn) {
    redirect('/sign-in');
    return null;
  }

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setError(null);
    try {
      await authFetch('/user/delete-account', {
        method: 'POST',
        body: JSON.stringify({ clerkUserId: user.id }),
      });
      await signOut();
      window.location.href = '/';
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete account.');
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Account Settings</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/account" className="font-medium text-teal-600 hover:text-teal-500">
            Dashboard
          </Link>
          <Link href="/account/orders" className="font-medium text-teal-600 hover:text-teal-500">
            Orders
          </Link>
        </div>
      </div>

      <div className="card mb-8 p-6">
        <h2 className="mb-4 font-semibold text-ink">Profile</h2>
        <p className="text-sm text-ink-muted">
          <span className="font-medium text-ink-secondary">Name:</span>{' '}
          {user.fullName ?? '—'}
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          <span className="font-medium text-ink-secondary">Email:</span>{' '}
          {user.primaryEmailAddress?.emailAddress}
        </p>
      </div>

      {/* Danger zone */}
      <div className="rounded-card border border-red-200 bg-red-50/50 p-6">
        <h2 className="mb-2 font-semibold text-red-700">Danger Zone</h2>
        <p className="mb-4 text-sm text-ink-muted">
          Deleting your account is permanent. All your eSIM data, order history,
          and Store Credit balance will be removed.
        </p>

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="rounded-btn border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
          >
            Delete my account
          </button>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium text-red-700">
              Are you sure? This cannot be undone.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="rounded-btn bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Yes, delete my account'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-secondary px-5 py-2.5 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}
