'use client';

import Link from 'next/link';

export function Troubleshooting() {
  return (
    <div className="space-y-6">
      <p style={{ color: 'var(--text-muted)' }}>
        Common issues and how to resolve them.
      </p>
      <div className="space-y-4">
        <div
          className="rounded-card"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--night-50)',
          }}
        >
          <div className="p-6 pb-2">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              QR code won&apos;t scan
            </h3>
          </div>
          <div className="p-6 pt-2" style={{ color: 'var(--text-muted)' }}>
            <p>
              Ensure your screen brightness is high and the QR code is clearly visible. You can
              also use the activation code (LPA format) to add the eSIM manually in your device
              settings.
            </p>
          </div>
        </div>
        <div
          className="rounded-card"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--night-50)',
          }}
        >
          <div className="p-6 pb-2">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              No network after activation
            </h3>
          </div>
          <div className="p-6 pt-2" style={{ color: 'var(--text-muted)' }}>
            <p>
              Make sure you&apos;ve arrived at your destination and have enabled the eSIM in
              Cellular/Mobile Data settings. Try toggling airplane mode or restarting your
              device. Check that data roaming is enabled for the eSIM line.
            </p>
          </div>
        </div>
        <div
          className="rounded-card"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--night-50)',
          }}
        >
          <div className="p-6 pb-2">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              Need more help?
            </h3>
          </div>
          <div className="p-6 pt-2" style={{ color: 'var(--text-muted)' }}>
            <p>
              <Link
                href="/support/tickets/new"
                className="font-medium transition-colors hover:opacity-80"
                style={{ color: 'var(--electric)' }}
              >
                Create a support ticket
              </Link>{' '}
              or{' '}
              <Link
                href="/contact"
                className="font-medium transition-colors hover:opacity-80"
                style={{ color: 'var(--electric)' }}
              >
                contact us
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
