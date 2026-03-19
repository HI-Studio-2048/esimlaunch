import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Installation Guides',
  description: 'Visual step-by-step installation guides for iPhone and Android.',
};

export default function InstallGuidesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-bold text-void">Installation Guides</h1>
      <p className="mt-4 text-dim">
        Step-by-step visual guides for installing your eSIM on different devices.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <Link
          href="/esim-setup-guide#ios"
          className="card card-hover block p-6 transition"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-btn-sq bg-canvas text-2xl">
            📱
          </div>
          <h2 className="mt-4 text-lg font-semibold text-void">iPhone / iPad</h2>
          <p className="mt-2 text-sm text-dim">
            Settings → Cellular → Add Cellular Plan. Scan QR or enter code.
          </p>
        </Link>
        <Link
          href="/esim-setup-guide#android"
          className="card card-hover block p-6 transition"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-btn-sq bg-canvas text-2xl">
            📲
          </div>
          <h2 className="mt-4 text-lg font-semibold text-void">Android</h2>
          <p className="mt-2 text-sm text-dim">
            Settings → Network & Internet → SIMs → Add eSIM.
          </p>
        </Link>
      </div>

      <div className="mt-12 rounded-card border border-rule bg-canvas p-6">
        <p className="text-void">
          For the complete guide with all steps, see our{' '}
          <Link href="/esim-setup-guide" className="font-medium text-link hover:underline">
            eSIM Setup Guide
          </Link>
          .
        </p>
      </div>

      <div className="mt-8">
        <Link
          href="/help-center"
          className="text-sm font-medium text-link hover:underline"
        >
          ← Back to Help Center
        </Link>
      </div>
    </div>
  );
}
