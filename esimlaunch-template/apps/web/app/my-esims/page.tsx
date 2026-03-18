'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { redirect, useSearchParams } from 'next/navigation';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import type { EsimProfile } from '@/lib/types';
import { formatVolume } from '@/lib/types';
import { EmptyState } from '@/components/ui/empty-state';
import { ExpiryCountdown } from '@/components/esim/expiry-countdown';
import { useToast } from '@/components/ui/use-toast';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Skeleton } from '@/components/ui/skeleton';
import { Wifi } from 'lucide-react';

/**
 * My eSIMs — authenticated users only.
 *
 * Calls GET /api/user/esims with Authorization Bearer token.
 * Shows each eSIM profile with QR, ICCID, status, usage, and top-up link.
 */
export default function MyEsimsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { authFetch, authFetchBlob, getToken } = useAuthFetch();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [profiles, setProfiles] = useState<EsimProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Show success toast when redirected back from topup Stripe checkout
  useEffect(() => {
    if (searchParams.get('topup_success') === '1') {
      toast({ title: 'Top-up successful!', description: 'Your additional data is now available.' });
      // Clean URL without reload
      window.history.replaceState({}, '', '/my-esims');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      redirect('/sign-in');
      return;
    }
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;

    authFetch<EsimProfile[]>('/user/esims')
      .then(setProfiles)
      .catch(() => toast({ title: 'Failed to load eSIMs', description: 'Please try again.', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn, user, authFetch]);

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
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
        <Skeleton className="mb-8 h-8 w-40" />
        <div className="flex flex-col gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-[88px] w-[88px] rounded-xl" />
              </div>
              <Skeleton className="mt-5 h-2 w-full rounded-full" />
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-12">
      <Breadcrumbs items={[{ label: 'My eSIMs' }]} />
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
        <EmptyState
          title="No eSIMs yet"
          description="Browse plans and get your first eSIM in minutes."
          icon={Wifi}
          action={{
            label: 'Browse Plans',
            onClick: () => (window.location.href = '/'),
          }}
        />
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
                getToken={getToken}
                authFetch={authFetch}
                authFetchBlob={authFetchBlob}
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
  getToken,
  authFetch,
  authFetchBlob,
  selected,
  onToggleSelect,
}: {
  profile: EsimProfile;
  getToken: () => Promise<string | null>;
  authFetch: <T = unknown>(path: string, options?: RequestInit) => Promise<T>;
  authFetchBlob: (path: string, options?: RequestInit) => Promise<Blob>;
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
          <Link
            href={profile.iccid ? `/my-esims/${profile.iccid}` : '#'}
            className="font-semibold text-slate-900 hover:text-violet-700 hover:underline"
          >
            {profile.order?.planName ?? 'eSIM Plan'}
          </Link>
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

        {/* QR Code — click to enlarge */}
        {profile.qrCodeUrl && (
          <QrThumbnail qrCodeUrl={profile.qrCodeUrl} planName={profile.order?.planName ?? 'eSIM'} />
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
        <div className="mt-3 text-xs">
          <span className="text-slate-500">Expires: </span>
          <ExpiryCountdown
            expiry={profile.expiredTime}
            iccid={profile.iccid}
            getToken={getToken}
            className="font-medium"
          />
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {profile.qrCodeUrl && (
          <>
            <QrDownloadButton qrCodeUrl={profile.qrCodeUrl} planName={profile.order?.planName ?? 'eSIM'} />
            <ShareQrButton qrCodeUrl={profile.qrCodeUrl} planName={profile.order?.planName ?? 'eSIM'} />
          </>
        )}
        {profile.esimStatus === 'IN_USE' && profile.iccid && (
          <Link
            href={`/my-esims/${profile.iccid}/topup`}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-medium text-sky-700 no-underline transition hover:bg-sky-100"
          >
            + Top Up Plan
          </Link>
        )}
        {profile.orderId && (
          <>
            <ReceiptDownloadButton orderId={profile.orderId} authFetchBlob={authFetchBlob} />
            <ResendReceiptButton orderId={profile.orderId} authFetch={authFetch} />
          </>
        )}
      </div>

      {/* Activation code with copy */}
      {profile.ac && (
        <CopyActivationCode ac={profile.ac} />
      )}
    </div>
  );
}

function CopyActivationCode({ ac }: { ac: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(ac);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="mt-4">
      <p className="mb-1 text-xs font-medium text-slate-500">Activation Code</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
          {ac}
        </code>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

function QrThumbnail({ qrCodeUrl, planName }: { qrCodeUrl: string; planName: string }) {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex-shrink-0 rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition hover:shadow-md"
        title="Click to enlarge"
      >
        <Image
          src={qrCodeUrl}
          alt="eSIM QR Code"
          width={88}
          height={88}
          className="rounded-lg"
          unoptimized
        />
      </button>
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-3 top-3 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <p className="mb-3 text-center text-sm font-medium text-slate-700">{planName}</p>
            <Image
              src={qrCodeUrl}
              alt="eSIM QR Code"
              width={280}
              height={280}
              className="rounded-xl"
              unoptimized
            />
            <p className="mt-3 text-center text-xs text-slate-500">
              Scan with your phone&apos;s camera to install
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function ReceiptDownloadButton({ orderId, authFetchBlob }: { orderId: string; authFetchBlob: (path: string, options?: RequestInit) => Promise<Blob> }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const handleClick = async () => {
    setLoading(true);
    try {
      const blob = await authFetchBlob(`/orders/${orderId}/receipt`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${orderId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Download failed', description: 'Could not download receipt.', variant: 'destructive' });
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

function ResendReceiptButton({ orderId, authFetch }: { orderId: string; authFetch: <T = unknown>(path: string, options?: RequestInit) => Promise<T> }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const handleClick = async () => {
    setLoading(true);
    setSent(false);
    try {
      await authFetch(`/orders/${orderId}/resend-receipt`, { method: 'POST' });
      setSent(true);
      toast({ title: 'Receipt sent', description: 'Check your email.' });
    } catch {
      toast({ title: 'Failed to resend', description: 'Please try again.', variant: 'destructive' });
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
