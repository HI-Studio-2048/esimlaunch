'use client';

import Link from 'next/link';
import { useStoreConfig } from '@/contexts/StoreConfigContext';

const DEFAULT_CONTACT_EMAIL = 'support@esimstore.com';

export default function ContactPage() {
  const { templateSettings } = useStoreConfig();
  const ts = templateSettings as {
    contactEmail?: string;
    contactPhone?: string;
    contactAddress?: string;
    contactHours?: string;
  } | undefined;
  const displayEmail = ts?.contactEmail || DEFAULT_CONTACT_EMAIL;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>Contact Us</h1>
      <p className="mt-4" style={{ color: 'var(--text-muted)' }}>
        Have a question or need help? We&apos;re here to assist you.
      </p>

      <div className="mt-12 space-y-8">
        <div className="card p-6" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text)' }}>Email</h2>
          <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
            For general inquiries and support:{' '}
            <a
              href={`mailto:${displayEmail}`}
              className="font-medium transition-colors"
              style={{ color: 'var(--electric)' }}
            >
              {displayEmail}
            </a>
          </p>
        </div>

        {ts?.contactPhone && (
          <div className="card p-6" style={{ borderColor: 'var(--border)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text)' }}>Phone</h2>
            <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
              <a
                href={`tel:${ts.contactPhone.replace(/\D/g, '')}`}
                className="font-medium transition-colors"
                style={{ color: 'var(--electric)' }}
              >
                {ts.contactPhone}
              </a>
            </p>
          </div>
        )}

        {ts?.contactAddress && (
          <div className="card p-6" style={{ borderColor: 'var(--border)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text)' }}>Address</h2>
            <p className="mt-2 whitespace-pre-line" style={{ color: 'var(--text-muted)' }}>
              {ts.contactAddress}
            </p>
          </div>
        )}

        {ts?.contactHours && (
          <div className="card p-6" style={{ borderColor: 'var(--border)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text)' }}>Hours</h2>
            <p className="mt-2" style={{ color: 'var(--text-muted)' }}>{ts.contactHours}</p>
          </div>
        )}

        <div className="card p-6" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text)' }}>Support</h2>
          <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
            Need help? Open a support ticket and we&apos;ll get back to you as soon as possible.
          </p>
          <Link
            href="/support/tickets/new"
            className="btn-primary mt-4 inline-flex items-center gap-2 no-underline"
          >
            Create Support Ticket
            <span>→</span>
          </Link>
        </div>
      </div>

      <div
        className="mt-12 rounded-card border p-6"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--night-50)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Typically we respond within 24 hours. For urgent eSIM activation issues, please include your order ID in your message.
        </p>
      </div>
    </div>
  );
}
