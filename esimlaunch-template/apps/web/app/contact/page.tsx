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
      <h1 className="text-3xl font-bold text-slate-900">Contact Us</h1>
      <p className="mt-4 text-slate-600">
        Have a question or need help? We&apos;re here to assist you.
      </p>

      <div className="mt-12 space-y-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Email</h2>
          <p className="mt-2 text-slate-600">
            For general inquiries and support:{' '}
            <a href={`mailto:${displayEmail}`} className="font-medium text-violet-600 hover:text-violet-700">
              {displayEmail}
            </a>
          </p>
        </div>

        {ts?.contactPhone && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Phone</h2>
            <p className="mt-2 text-slate-600">
              <a href={`tel:${ts.contactPhone.replace(/\D/g, '')}`} className="font-medium text-violet-600 hover:text-violet-700">
                {ts.contactPhone}
              </a>
            </p>
          </div>
        )}

        {ts?.contactAddress && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Address</h2>
            <p className="mt-2 text-slate-600 whitespace-pre-line">{ts.contactAddress}</p>
          </div>
        )}

        {ts?.contactHours && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Hours</h2>
            <p className="mt-2 text-slate-600">{ts.contactHours}</p>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Support</h2>
          <p className="mt-2 text-slate-600">
            Need help? Open a support ticket and we&apos;ll get back to you as soon as possible.
          </p>
          <Link
            href="/support/tickets/new"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 font-medium text-white no-underline transition hover:bg-violet-500"
          >
            Create Support Ticket
            <span>→</span>
          </Link>
        </div>
      </div>

      <div className="mt-12 rounded-xl border border-slate-100 bg-slate-50 p-6">
        <p className="text-sm text-slate-600">
          Typically we respond within 24 hours. For urgent eSIM activation issues, please include your order ID in your message.
        </p>
      </div>
    </div>
  );
}
