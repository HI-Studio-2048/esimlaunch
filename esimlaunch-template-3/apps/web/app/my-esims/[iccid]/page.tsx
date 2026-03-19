'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import type { EsimProfile } from '@/lib/types';
import { formatVolume } from '@/lib/types';
import { ExpiryCountdown } from '@/components/esim/expiry-countdown';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  RefreshCw,
  FileText,
  Wifi,
  Globe,
  HardDrive,
  Calendar,
  QrCode,
} from 'lucide-react';

function formatBytes(bytes: string | number | null | undefined): string {
  if (bytes === null || bytes === undefined) return 'N/A';
  try {
    const num =
      typeof bytes === 'string'
        ? bytes === '0' || bytes === '' ? 0 : Number(bytes)
        : bytes;
    if (isNaN(num) || num < 0) return 'N/A';
    if (num === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    let sizeIndex = 0;
    let size = num;
    while (size >= k && sizeIndex < sizes.length - 1) {
      size /= k;
      sizeIndex++;
    }
    return `${size.toFixed(2)} ${sizes[sizeIndex]}`;
  } catch {
    return 'N/A';
  }
}

function getStatusDisplay(esimStatus: string | undefined): {
  label: string;
  badgeClass: string;
} {
  if (!esimStatus) return { label: 'Pending', badgeClass: 'badge-ghost' };
  const statusMap: Record<string, { label: string; badgeClass: string }> = {
    GOT_RESOURCE: { label: 'Ready', badgeClass: 'badge-green' },
    IN_USE: { label: 'Active', badgeClass: 'badge-electric' },
    EXPIRED: { label: 'Expired', badgeClass: 'badge-red' },
    SUSPENDED: { label: 'Suspended', badgeClass: 'badge-amber' },
  };
  return statusMap[esimStatus] ?? { label: esimStatus, badgeClass: 'badge-ghost' };
}

export default function EsimDetailPage({
  params,
}: {
  params: { iccid: string };
}) {
  const { iccid } = params;
  const { user, isLoaded, isSignedIn } = useUser();
  const { authFetch, authFetchBlob, getToken } = useAuthFetch();
  const [profile, setProfile] = useState<EsimProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      redirect('/sign-in');
      return;
    }
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;

    authFetch<EsimProfile[]>('/user/esims')
      .then((profiles) => {
        const match = profiles.find(
          (p) => p.iccid?.toLowerCase() === iccid?.toLowerCase()
        );
        setProfile(match ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [iccid, isLoaded, isSignedIn, user, authFetch]);

  const fetchData = () => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;
    setLoading(true);
    authFetch<EsimProfile[]>('/user/esims')
      .then((profiles) => {
        const match = profiles.find(
          (p) => p.iccid?.toLowerCase() === iccid?.toLowerCase()
        );
        setProfile(match ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: 'var(--border-bright)', borderTopColor: 'var(--electric)' }}
        />
        <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>Loading eSIM details…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>eSIM not found</h1>
        <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
          We couldn&apos;t find an eSIM with that ICCID in your account.
        </p>
        <Link href="/my-esims">
          <Button variant="outline" className="mt-6">
            Back to My eSIMs
          </Button>
        </Link>
      </div>
    );
  }

  const usedBytes = profile.orderUsage ? parseInt(profile.orderUsage, 10) : 0;
  const totalBytes = profile.totalVolume ? parseInt(profile.totalVolume, 10) : 0;
  const sizeGB = formatBytes(profile.totalVolume);
  const statusDisplay = getStatusDisplay(profile.esimStatus);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/my-esims"
        className="mb-4 inline-flex items-center gap-2 text-sm transition-colors no-underline hover:opacity-80"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My eSIMs
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>eSIM Details</h1>
        <Button variant="outline" size="icon" onClick={fetchData}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Header card */}
        <div className="card p-8">
          <div className="flex items-center gap-3">
            <span className={statusDisplay.badgeClass}>{statusDisplay.label}</span>
            <span className="badge-electric">eSIM</span>
          </div>
          <h2 className="mt-4 text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {profile.order?.planName ?? profile.iccid}
          </h2>
          <div className="mt-2 flex flex-wrap gap-4" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4" style={{ color: 'var(--electric)' }} />
              {profile.order?.planId ?? 'Global'} Region
            </span>
            <span className="flex items-center gap-2">
              <Wifi className="h-4 w-4" style={{ color: 'var(--electric)' }} />
              4G/LTE Speed
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div
            className="rounded-xl border p-5 text-center"
            style={{ background: 'var(--night-50)', borderColor: 'var(--border)' }}
          >
            <HardDrive className="mx-auto mb-2 h-5 w-5" style={{ color: 'var(--electric)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Data Balance</p>
            <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{sizeGB}</p>
          </div>
          <div
            className="rounded-xl border p-5 text-center"
            style={{ background: 'var(--night-50)', borderColor: 'var(--border)' }}
          >
            <Calendar className="mx-auto mb-2 h-5 w-5" style={{ color: 'var(--electric)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Expires</p>
            <ExpiryCountdown
              expiry={profile.expiredTime}
              iccid={profile.iccid}
              onExpired={fetchData}
              className="text-xl font-bold"
              getToken={getToken}
            />
          </div>
          <div
            className="rounded-xl border p-5 text-center"
            style={{ background: 'var(--night-50)', borderColor: 'var(--border)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Status</p>
            <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{statusDisplay.label}</p>
          </div>
          <div
            className="rounded-xl border p-5 text-center"
            style={{ background: 'var(--night-50)', borderColor: 'var(--border)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>ICCID</p>
            <p className="truncate text-sm font-mono" style={{ color: 'var(--text)' }}>
              {profile.iccid}
            </p>
          </div>
        </div>

        {/* Install eSIM card */}
        {(profile.qrCodeUrl || profile.ac) && (
          <div className="card p-8">
            <h3
              className="mb-4 flex items-center gap-2 text-xl font-bold"
              style={{ color: 'var(--text)' }}
            >
              <QrCode className="h-6 w-6" style={{ color: 'var(--electric)' }} />
              Install eSIM
            </h3>
            <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
              Scan the QR code with your device to install the eSIM profile
            </p>
            {profile.qrCodeUrl && (
              <div
                className="inline-block rounded-xl p-4"
                style={{ background: '#fff', border: '1px solid var(--border)' }}
              >
                <Image
                  src={profile.qrCodeUrl}
                  alt="eSIM QR Code"
                  width={200}
                  height={200}
                  unoptimized
                />
              </div>
            )}
            {profile.ac && (
              <details className="mt-4">
                <summary
                  className="cursor-pointer text-sm font-medium transition hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Show activation code
                </summary>
                <p
                  className="mt-2 break-all rounded-lg p-3 font-mono text-xs"
                  style={{ background: 'var(--night)', color: 'var(--text)', border: '1px solid var(--border)' }}
                >
                  {profile.ac}
                </p>
              </details>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-4">
          {profile.orderId && (
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const blob = await authFetchBlob(
                    `/orders/${profile.orderId}/receipt`
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `receipt-${profile.orderId}.pdf`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch (err) {
                  console.error('Failed to download receipt:', err);
                }
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Download Receipt
            </Button>
          )}
          {profile.esimStatus === 'IN_USE' && profile.iccid && (
            <Link href={`/my-esims/${profile.iccid}/topup`}>
              <button className="btn-primary rounded-lg px-4 py-2 font-medium">
                Top Up Now
              </button>
            </Link>
          )}
        </div>

        {/* Data usage */}
        {totalBytes > 0 && (
          <div className="card p-6">
            <h3 className="mb-4 text-lg font-bold" style={{ color: 'var(--text)' }}>
              Data Usage
            </h3>
            <div className="mb-2 flex justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
              <span>{formatVolume(usedBytes / (1024 * 1024))} used</span>
              <span>{formatVolume(totalBytes / (1024 * 1024))} total</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--night-100)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (usedBytes / totalBytes) * 100)}%`,
                  background: 'linear-gradient(to right, var(--electric), var(--glow))',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
