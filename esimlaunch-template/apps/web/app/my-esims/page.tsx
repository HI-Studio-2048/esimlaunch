'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/apiClient';
import type { EsimProfile } from '@/lib/types';
import { formatVolume } from '@/lib/types';

/**
 * My eSIMs — authenticated users only.
 *
 * Calls GET /api/user/esims with x-user-email header.
 * Shows each eSIM profile with QR, ICCID, status, usage, and top-up link.
 */
export default function MyEsimsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [profiles, setProfiles] = useState<EsimProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      redirect('/sign-in');
      return;
    }
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;

    apiFetch<EsimProfile[]>('/user/esims', { userEmail: email })
      .then(setProfiles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
        <p className="mt-4 text-slate-500">Loading your eSIMs…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">My eSIMs</h1>
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white no-underline shadow-lg shadow-violet-500/30 transition hover:from-violet-600 hover:to-purple-600"
        >
          <span>+</span> New eSIM
        </Link>
      </div>

      {profiles.length === 0 ? (
        <div className="rounded-card border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
          <div className="mb-4 text-4xl">📶</div>
          <p className="mb-2 text-slate-600">No eSIMs yet.</p>
          <p className="mb-6 text-sm text-slate-500">
            Browse plans and get your first eSIM in minutes.
          </p>
          <Link
            href="/"
            className="inline-flex rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-3 font-semibold text-white no-underline transition hover:from-violet-600 hover:to-purple-600"
          >
            Browse Plans
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {profiles.map((profile) => (
            <EsimCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
}

function EsimCard({ profile }: { profile: EsimProfile }) {
  const usedBytes = profile.orderUsage ? parseInt(profile.orderUsage, 10) : 0;
  const totalBytes = profile.totalVolume ? parseInt(profile.totalVolume, 10) : 0;
  const usedMb = usedBytes / (1024 * 1024);
  const totalMb = totalBytes / (1024 * 1024);
  const pctUsed = totalBytes > 0 ? Math.min(100, (usedBytes / totalBytes) * 100) : 0;

  const statusColors: Record<string, string> = {
    IN_USE: 'bg-emerald-50 text-emerald-700',
    PENDING: 'bg-amber-50 text-amber-700',
    EXPIRED: 'bg-red-50 text-red-700',
    REVOKED: 'bg-red-50 text-red-700',
    CANCELLED: 'bg-slate-100 text-slate-600',
  };
  const statusClass = statusColors[profile.esimStatus] ?? 'bg-slate-100 text-slate-600';

  return (
    <div className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900">{profile.order?.planName ?? 'eSIM Plan'}</p>
          {profile.iccid && (
            <p className="mt-1 text-xs text-slate-500">ICCID: {profile.iccid}</p>
          )}
          <span
            className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${statusClass}`}
          >
            {profile.esimStatus}
          </span>
        </div>

        {/* QR Code */}
        {profile.qrCodeUrl && (
          <div className="flex-shrink-0 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            <Image
              src={profile.qrCodeUrl}
              alt="eSIM QR Code"
              width={88}
              height={88}
              className="rounded-lg"
              unoptimized
            />
          </div>
        )}
      </div>

      {/* Data usage */}
      {totalMb > 0 && (
        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-xs text-slate-600">
            <span>{formatVolume(usedMb)} used</span>
            <span>{formatVolume(totalMb)} total</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all duration-500"
              style={{ width: `${pctUsed}%` }}
            />
          </div>
        </div>
      )}

      {/* Expiry */}
      {profile.expiredTime && (
        <p className="mt-3 text-xs text-slate-500">
          Expires: {new Date(profile.expiredTime).toLocaleDateString()}
        </p>
      )}

      {/* Top-up */}
      {profile.esimStatus === 'IN_USE' && (
        <Link
          href={`/topup/${profile.id}`}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-medium text-sky-700 no-underline transition hover:bg-violet-100"
        >
          + Top Up
        </Link>
      )}

      {/* Activation code */}
      {profile.ac && (
        <details className="mt-4 group">
          <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700">
            Show activation code
          </summary>
          <p className="mt-2 break-all rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700">
            {profile.ac}
          </p>
        </details>
      )}
    </div>
  );
}
