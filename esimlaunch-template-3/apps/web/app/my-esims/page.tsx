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
            <div
              key={i}
              className="rounded-card border p-6"
              style={{ background: 'var(--night-50)', borderColor: 'var(--border)' }}
            >
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
        <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>My eSIMs</h1>
        <Link
          href="/"
          className="btn-primary inline-flex w-fit items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold no-underline"
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
              className="input rounded-lg px-3 py-2 text-sm"
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
              className="input rounded-lg px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={selectedIds.size === filteredProfiles.length && filteredProfiles.length > 0}
                onChange={toggleSelectAll}
                className="rounded"
                style={{ accentColor: 'var(--electric)' }}
              />
              Select all
            </label>
          </div>

          {/* Bulk actions toolbar */}
          {selectedIds.size > 0 && (
            <div
              className="mb-4 flex items-center gap-3 rounded-lg border px-4 py-3"
              style={{ background: 'rgba(79,126,255,0.08)', borderColor: 'rgba(79,126,255,0.2)' }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--electric)' }}>{selectedIds.size} selected</span>
              <BulkDownloadQr
                profiles={profiles.filter((p) => selectedIds.has(p.id))}
              />
              <BulkShare profiles={profiles.filter((p) => selectedIds.has(p.id))} />
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-sm transition hover:opacity-80"
                style={{ color: 'var(--electric)' }}
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

  const statusBadgeClass: Record<string, string> = {
    IN_USE: 'badge-green',
    PENDING: 'badge-amber',
    EXPIRED: 'badge-red',
    REVOKED: 'badge-red',
    CANCELLED: 'badge-ghost',
  };
  const badgeClass = statusBadgeClass[profile.esimStatus] ?? 'badge-ghost';

  return (
    <div
      className="rounded-card border p-6"
      style={
        selected
          ? { background: 'var(--night-50)', borderColor: 'var(--electric)', boxShadow: '0 0 0 1px var(--electric)' }
          : { background: 'var(--night-50)', borderColor: 'var(--border)' }
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-1 min-w-0 items-start gap-3">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={!!selected}
              onChange={onToggleSelect}
              className="mt-1 h-4 w-4 shrink-0 rounded"
              style={{ accentColor: 'var(--electric)' }}
            />
          )}
          <div>
            <Link
              href={profile.iccid ? `/my-esims/${profile.iccid}` : '#'}
              className="font-semibold transition-colors hover:opacity-80 no-underline"
              style={{ color: 'var(--text)' }}
            >
              {profile.order?.planName ?? 'eSIM Plan'}
            </Link>
            {profile.iccid && (
              <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>ICCID: {profile.iccid}</p>
            )}
            <span className={`mt-2 inline-block ${badgeClass}`}>
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
          <div className="mb-1.5 flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>{formatVolume(usedMb)} used</span>
            <span>{formatVolume(totalMb)} total</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--night-100)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pctUsed}%`,
                background: 'linear-gradient(to right, var(--electric), var(--glow))',
              }}
            />
          </div>
        </div>
      )}

      {/* Expiry */}
      {profile.expiredTime && (
        <div className="mt-3 text-xs">
          <span style={{ color: 'var(--text-muted)' }}>Expires: </span>
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
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium no-underline transition hover:opacity-80"
            style={{ borderColor: 'rgba(0,229,192,0.3)', color: 'var(--glow)', background: 'rgba(0,229,192,0.08)' }}
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
      <p className="mb-1 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Activation Code</p>
      <div className="flex items-center gap-2">
        <code
          className="flex-1 break-all rounded-lg px-3 py-2 font-mono text-xs"
          style={{ background: 'var(--night)', color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          {ac}
        </code>
        <button
          onClick={handleCopy}
          className="btn-secondary shrink-0 rounded-lg px-3 py-2 text-xs font-medium"
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
        className="flex-shrink-0 rounded-xl border p-2 transition hover:opacity-80"
        style={{ background: '#fff', borderColor: 'var(--border)' }}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative rounded-2xl p-6 shadow-xl"
            style={{ background: 'var(--night-50)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-3 top-3 rounded-full p-1 transition hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <p className="mb-3 text-center text-sm font-medium" style={{ color: 'var(--text)' }}>{planName}</p>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '8px', display: 'inline-block' }}>
              <Image
                src={qrCodeUrl}
                alt="eSIM QR Code"
                width={280}
                height={280}
                className="rounded-xl"
                unoptimized
              />
            </div>
            <p className="mt-3 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
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
      className="btn-secondary rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50"
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
      className="btn-secondary rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50"
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
      className="btn-secondary rounded-lg px-3 py-1.5 text-sm font-medium"
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
      className="btn-primary rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50"
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
      className="btn-secondary rounded-lg px-3 py-1.5 text-sm font-medium"
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
      className="btn-secondary rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50"
    >
      {loading ? '…' : sent ? 'Sent!' : 'Resend'}
    </button>
  );
}
