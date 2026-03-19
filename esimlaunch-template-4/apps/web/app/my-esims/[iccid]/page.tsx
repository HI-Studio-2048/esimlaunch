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
  color: string;
} {
  if (!esimStatus) return { label: 'Pending', color: 'badge-gray' };
  const statusMap: Record<string, { label: string; color: string }> = {
    GOT_RESOURCE: { label: 'Ready', color: 'badge-green' },
    IN_USE: { label: 'Active', color: 'badge-blue' },
    EXPIRED: { label: 'Expired', color: 'badge-red' },
    SUSPENDED: { label: 'Suspended', color: 'badge-amber' },
  };
  return statusMap[esimStatus] ?? { label: esimStatus, color: 'badge-gray' };
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
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-rule border-t-void" />
        <p className="mt-4 text-dim">Loading eSIM details…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-void">eSIM not found</h1>
        <p className="mt-2 text-dim">
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
        className="btn-link mb-4 inline-flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My eSIMs
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-void">eSIM Details</h1>
        <button
          onClick={fetchData}
          className="btn-secondary flex h-9 w-9 items-center justify-center rounded-btn-sq p-0"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-surface rounded-card-lg shadow-card p-8">
          <div className="flex items-center gap-3">
            <span className={statusDisplay.color}>
              {statusDisplay.label}
            </span>
            <span className="badge-gray">
              eSIM
            </span>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-void">
            {profile.order?.planName ?? profile.iccid}
          </h2>
          <div className="mt-2 flex flex-wrap gap-4 text-dim">
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-faint" />
              {profile.order?.planId ?? 'Global'} Region
            </span>
            <span className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-faint" />
              4G/LTE Speed
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="bg-surface rounded-card border border-rule p-5 text-center shadow-card">
            <HardDrive className="mx-auto mb-2 h-5 w-5 text-dim" />
            <p className="text-sm text-dim">Data Balance</p>
            <p className="text-xl font-bold text-void">{sizeGB}</p>
          </div>
          <div className="bg-surface rounded-card border border-rule p-5 text-center shadow-card">
            <Calendar className="mx-auto mb-2 h-5 w-5 text-dim" />
            <p className="text-sm text-dim">Expires</p>
            <ExpiryCountdown
              expiry={profile.expiredTime}
              iccid={profile.iccid}
              onExpired={fetchData}
              className="text-xl font-bold text-void"
              getToken={getToken}
            />
          </div>
          <div className="bg-surface rounded-card border border-rule p-5 text-center shadow-card">
            <p className="text-sm text-dim">Status</p>
            <p className="text-xl font-bold text-void">{statusDisplay.label}</p>
          </div>
          <div className="bg-surface rounded-card border border-rule p-5 text-center shadow-card">
            <p className="text-sm text-dim">ICCID</p>
            <p className="truncate text-sm font-mono text-void">
              {profile.iccid}
            </p>
          </div>
        </div>

        {(profile.qrCodeUrl || profile.ac) && (
          <div className="bg-surface rounded-card-lg border border-rule p-8 shadow-card">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-void">
              <QrCode className="h-6 w-6 text-dim" />
              Install eSIM
            </h3>
            <p className="mb-6 text-dim">
              Scan the QR code with your device to install the eSIM profile
            </p>
            {profile.qrCodeUrl && (
              <div className="inline-block rounded-card border border-rule bg-white p-4 shadow-card">
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
                <summary className="cursor-pointer text-sm font-medium text-dim hover:text-void transition-colors">
                  Show activation code
                </summary>
                <p className="mt-2 break-all rounded-card bg-canvas p-3 font-mono text-xs text-void">
                  {profile.ac}
                </p>
              </details>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          {profile.orderId && (
            <button
              className="btn-secondary inline-flex items-center gap-2"
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
              <FileText className="h-4 w-4" />
              Download Receipt
            </button>
          )}
          {profile.esimStatus === 'IN_USE' && profile.iccid && (
            <Link href={`/my-esims/${profile.iccid}/topup`}>
              <button className="btn-primary">
                Top Up Now
              </button>
            </Link>
          )}
        </div>

        {totalBytes > 0 && (
          <div className="bg-surface rounded-card-lg border border-rule p-6 shadow-card">
            <h3 className="mb-4 text-lg font-bold text-void">
              Data Usage
            </h3>
            <div className="mb-2 flex justify-between text-sm text-dim">
              <span>{formatVolume(usedBytes / (1024 * 1024))} used</span>
              <span>{formatVolume(totalBytes / (1024 * 1024))} total</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-canvas">
              <div
                className="h-full rounded-full bg-void transition-all"
                style={{
                  width: `${Math.min(100, (usedBytes / totalBytes) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
