import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Installation Guides',
  description: 'Visual step-by-step installation guides for iPhone and Android.',
};

export default function InstallGuidesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-bold text-slate-900">Installation Guides</h1>
      <p className="mt-4 text-slate-600">
        Step-by-step visual guides for installing your eSIM on different devices.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <Link
          href="/esim-setup-guide#ios"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-violet-200 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-2xl">
            📱
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">iPhone / iPad</h2>
          <p className="mt-2 text-sm text-slate-600">
            Settings → Cellular → Add Cellular Plan. Scan QR or enter code.
          </p>
        </Link>
        <Link
          href="/esim-setup-guide#android"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-violet-200 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-2xl">
            📲
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">Android</h2>
          <p className="mt-2 text-sm text-slate-600">
            Settings → Network & Internet → SIMs → Add eSIM.
          </p>
        </Link>
      </div>

      <div className="mt-12 rounded-xl border border-violet-100 bg-violet-50 p-6">
        <p className="text-slate-700">
          For the complete guide with all steps, see our{' '}
          <Link href="/esim-setup-guide" className="font-medium text-violet-600 hover:text-violet-700">
            eSIM Setup Guide
          </Link>
          .
        </p>
      </div>

      <div className="mt-8">
        <Link
          href="/help-center"
          className="text-sm font-medium text-violet-600 hover:text-violet-700"
        >
          ← Back to Help Center
        </Link>
      </div>
    </div>
  );
}
