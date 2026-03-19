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
      <h1 className="text-3xl font-bold text-void">Contact Us</h1>
      <p className="mt-4 text-dim">
        Have a question or need help? We&apos;re here to assist you.
      </p>

      <div className="mt-12 space-y-8">
        <div className="card p-6">
          <h2 className="font-semibold text-void">Email</h2>
          <p className="mt-2 text-dim">
            For general inquiries and support:{' '}
            <a href={`mailto:${displayEmail}`} className="font-medium text-link hover:underline">
              {displayEmail}
            </a>
          </p>
        </div>

        {ts?.contactPhone && (
          <div className="card p-6">
            <h2 className="font-semibold text-void">Phone</h2>
            <p className="mt-2 text-dim">
              <a href={`tel:${ts.contactPhone.replace(/\D/g, '')}`} className="font-medium text-link hover:underline">
                {ts.contactPhone}
              </a>
            </p>
          </div>
        )}

        {ts?.contactAddress && (
          <div className="card p-6">
            <h2 className="font-semibold text-void">Address</h2>
            <p className="mt-2 text-dim whitespace-pre-line">{ts.contactAddress}</p>
          </div>
        )}

        {ts?.contactHours && (
          <div className="card p-6">
            <h2 className="font-semibold text-void">Hours</h2>
            <p className="mt-2 text-dim">{ts.contactHours}</p>
          </div>
        )}

        <div className="card p-6">
          <h2 className="font-semibold text-void">Support</h2>
          <p className="mt-2 text-dim">
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

      <div className="mt-12 rounded-card border border-rule bg-canvas p-6">
        <p className="text-sm text-dim">
          Typically we respond within 24 hours. For urgent eSIM activation issues, please include your order ID in your message.
        </p>
      </div>
    </div>
  );
}
