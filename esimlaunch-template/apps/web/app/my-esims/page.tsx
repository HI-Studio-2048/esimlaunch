'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { apiFetch, apiFetchBlob } from '@/lib/apiClient';
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const filteredProfiles = useMemo(() => {
    let list = profiles;
    if (statusFilter !== 'all') {
      list = list.filter((p) => p.esimStatus === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          (p.order?.planName ?? '').toLowerCase().includes(q) ||
          (p.iccid ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [profiles, statusFilter, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProfiles.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredProfiles.map((p) => p.id)));
  };

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
        <>
          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            >
              <option value="all">All statuses</option>
              <option value="IN_USE">In Use</option>
              <option value="PENDING">Pending</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <input
              type="text"
              placeholder="Search by plan or ICCID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredProfiles.length && filteredProfiles.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-slate-300"
              />
              Select all
            </label>
          </div>

          {/* Bulk actions toolbar */}
          {selectedIds.size > 0 && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3">
              <span className="text-sm font-medium text-violet-800">{selectedIds.size} selected</span>
              <BulkDownloadQr
                profiles={profiles.filter((p) => selectedIds.has(p.id))}
              />
              <BulkShare profiles={profiles.filter((p) => selectedIds.has(p.id))} />
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-violet-600 hover:underline"
              >
                Clear
              </button>
            </div>
          )}

          <div className="flex flex-col gap-6">
            {filteredProfiles.map((profile) => (
              <EsimCard
                key={profile.id}
                profile={profile}
                userEmail={user!.primaryEmailAddress!.emailAddress}
                selected={selectedIds.has(profile.id)}
                onToggleSelect={() => toggleSelect(profile.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EsimCard({
  profile,
  userEmail,
  selected,
  onToggleSelect,
}: {
  profile: EsimProfile;
  userEmail: string;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
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
    <div className={`rounded-card border p-6 shadow-card ${selected ? 'border-violet-300 ring-2 ring-violet-200' : 'border-slate-200 bg-white'}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-1 min-w-0 items-start gap-3">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={!!selected}
              onChange={onToggleSelect}
              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
            />
          )}
          <div>
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

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {profile.qrCodeUrl && (
          <>
            <QrDownloadButton qrCodeUrl={profile.qrCodeUrl} planName={profile.order?.planName ?? 'eSIM'} />
            <ShareQrButton qrCodeUrl={profile.qrCodeUrl} planName={profile.order?.planName ?? 'eSIM'} />
          </>
        )}
        {profile.esimStatus === 'IN_USE' && (
          <Link
            href={`/topup/${profile.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-medium text-sky-700 no-underline transition hover:bg-sky-100"
          >
            + Top Up Plan
          </Link>
        )}
        {profile.orderId && (
          <>
            <ReceiptDownloadButton orderId={profile.orderId} userEmail={userEmail} />
            <ResendReceiptButton orderId={profile.orderId} userEmail={userEmail} />
          </>
        )}
      </div>

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

function ReceiptDownloadButton({ orderId, userEmail }: { orderId: string; userEmail: string }) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    try {
      const blob = await apiFetchBlob(`/orders/${orderId}/receipt`, { userEmail });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${orderId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      {loading ? '…' : 'Receipt'}
    </button>
  );
}

function QrDownloadButton({ qrCodeUrl, planName }: { qrCodeUrl: string; planName: string }) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch(qrCodeUrl, { mode: 'cors' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `esim-qr-${planName.replace(/\s+/g, '-')}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement('a');
      a.href = qrCodeUrl;
      a.download = `esim-qr-${planName.replace(/\s+/g, '-')}.png`;
      a.target = '_blank';
      a.click();
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      {loading ? '…' : 'Download QR'}
    </button>
  );
}

function ShareQrButton({ qrCodeUrl, planName }: { qrCodeUrl: string; planName: string }) {
  const handleClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `eSIM: ${planName}`,
          text: `My eSIM plan: ${planName}. Scan the QR code to install.`,
          url: qrCodeUrl,
        });
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(qrCodeUrl);
        }
      }
    } else {
      await navigator.clipboard.writeText(qrCodeUrl);
    }
  };
  return (
    <button
      onClick={handleClick}
      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      Share
    </button>
  );
}

function BulkDownloadQr({ profiles }: { profiles: EsimProfile[] }) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    for (const p of profiles) {
      if (!p.qrCodeUrl) continue;
      try {
        const res = await fetch(p.qrCodeUrl, { mode: 'cors' });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `esim-qr-${(p.order?.planName ?? p.id).replace(/\s+/g, '-')}.png`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        const a = document.createElement('a');
        a.href = p.qrCodeUrl!;
        a.download = `esim-qr-${(p.order?.planName ?? p.id).replace(/\s+/g, '-')}.png`;
        a.target = '_blank';
        a.click();
      }
    }
    setLoading(false);
  };
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
    >
      {loading ? '…' : 'Download QR'}
    </button>
  );
}

function BulkShare({ profiles }: { profiles: EsimProfile[] }) {
  const handleClick = async () => {
    const text = profiles
      .map((p) => `${p.order?.planName ?? 'eSIM'}: ${p.qrCodeUrl ?? ''}`)
      .join('\n');
    await navigator.clipboard.writeText(text);
  };
  return (
    <button
      onClick={handleClick}
      className="rounded-lg border border-violet-300 px-3 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-100"
    >
      Copy links
    </button>
  );
}

function ResendReceiptButton({ orderId, userEmail }: { orderId: string; userEmail: string }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    setSent(false);
    try {
      await apiFetch(`/orders/${orderId}/resend-receipt`, { method: 'POST', userEmail });
      setSent(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      {loading ? '…' : sent ? 'Sent!' : 'Resend'}
    </button>
  );
}
