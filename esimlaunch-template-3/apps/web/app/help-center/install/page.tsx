import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Installation Guides',
  description: 'Visual step-by-step installation guides for iPhone and Android.',
};

export default function InstallGuidesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>Installation Guides</h1>
      <p className="mt-4" style={{ color: 'var(--text-muted)' }}>
        Step-by-step visual guides for installing your eSIM on different devices.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <Link
          href="/esim-setup-guide#ios"
          className="rounded-card transition-all duration-200 hover:border-[rgba(79,126,255,0.5)]"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--night-50)',
            padding: '1.5rem',
            display: 'block',
          }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
            style={{ background: 'var(--night-100)' }}
          >
            📱
          </div>
          <h2 className="mt-4 text-lg font-semibold" style={{ color: 'var(--text)' }}>iPhone / iPad</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Settings → Cellular → Add Cellular Plan. Scan QR or enter code.
          </p>
        </Link>
        <Link
          href="/esim-setup-guide#android"
          className="rounded-card transition-all duration-200 hover:border-[rgba(79,126,255,0.5)]"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--night-50)',
            padding: '1.5rem',
            display: 'block',
          }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
            style={{ background: 'var(--night-100)' }}
          >
            📲
          </div>
          <h2 className="mt-4 text-lg font-semibold" style={{ color: 'var(--text)' }}>Android</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Settings → Network &amp; Internet → SIMs → Add eSIM.
          </p>
        </Link>
      </div>

      <div
        className="mt-12 rounded-card p-6"
        style={{
          border: '1px solid var(--border-bright)',
          background: 'rgba(79, 126, 255, 0.08)',
        }}
      >
        <p style={{ color: 'var(--text)' }}>
          For the complete guide with all steps, see our{' '}
          <Link
            href="/esim-setup-guide"
            className="font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--electric)' }}
          >
            eSIM Setup Guide
          </Link>
          .
        </p>
      </div>

      <div className="mt-8">
        <Link
          href="/help-center"
          className="text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--electric)' }}
        >
          ← Back to Help Center
        </Link>
      </div>
    </div>
  );
}
