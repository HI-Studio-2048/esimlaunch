import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Installation Guides',
  description: 'Visual step-by-step installation guides for iPhone and Android.',
};

export default function InstallGuidesPage() {
  return (
    <div className="page-container mx-auto max-w-2xl py-16 sm:py-24">
      <h1 className="text-3xl font-bold text-ink">Installation Guides</h1>
      <p className="mt-4 text-ink-secondary">
        Step-by-step visual guides for installing your eSIM on different devices.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <Link
          href="/esim-setup-guide#ios"
          className="card card-hover rounded-card border border-surface-border bg-white p-6 transition hover:border-teal-400/40"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-btn bg-surface-soft text-2xl">
            📱
          </div>
          <h2 className="mt-4 text-lg font-semibold text-ink">iPhone / iPad</h2>
          <p className="mt-2 text-sm text-ink-secondary">
            Settings → Cellular → Add Cellular Plan. Scan QR or enter code.
          </p>
        </Link>
        <Link
          href="/esim-setup-guide#android"
          className="card card-hover rounded-card border border-surface-border bg-white p-6 transition hover:border-teal-400/40"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-btn bg-surface-soft text-2xl">
            📲
          </div>
          <h2 className="mt-4 text-lg font-semibold text-ink">Android</h2>
          <p className="mt-2 text-sm text-ink-secondary">
            Settings → Network & Internet → SIMs → Add eSIM.
          </p>
        </Link>
      </div>

      <div className="mt-12 rounded-card border border-teal-400/20 bg-teal-400/5 p-6">
        <p className="text-ink-secondary">
          For the complete guide with all steps, see our{' '}
          <Link href="/esim-setup-guide" className="font-medium text-teal-400 hover:text-teal-300">
            eSIM Setup Guide
          </Link>
          .
        </p>
      </div>

      <div className="mt-8">
        <Link
          href="/help-center"
          className="text-sm font-medium text-teal-400 hover:text-teal-300"
        >
          ← Back to Help Center
        </Link>
      </div>
    </div>
  );
}
