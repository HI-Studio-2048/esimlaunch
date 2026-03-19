'use client';

import Link from 'next/link';
import { useStoreConfig } from '@/contexts/StoreConfigContext';

export default function RefundPage() {
  const { templateSettings } = useStoreConfig();
  const ts = templateSettings as { legalLastUpdated?: string } | undefined;
  const lastUpdated = ts?.legalLastUpdated || 'March 2025';

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>Refund Policy</h1>
      <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>Last updated: {lastUpdated}</p>

      <section className="mt-12 space-y-6" style={{ color: 'var(--text-muted)' }}>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>1. Before Activation</h2>
        <p>
          If you have not yet installed or activated your eSIM, you may request a full refund
          within 14 days of purchase. Contact our support team with your order ID to process
          the refund.
        </p>

        <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>2. After Activation</h2>
        <p>
          Once your eSIM has been activated (data has been used or the plan has started),
          refunds are generally not available. Digital products are consumed upon activation.
        </p>

        <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>3. Technical Issues</h2>
        <p>
          If you experience technical issues that prevent you from using your eSIM (e.g.,
          activation failures, network incompatibility in your destination), contact support.
          We will work with you to resolve the issue or offer a replacement or refund where
          appropriate.
        </p>

        <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>4. Device Incompatibility</h2>
        <p>
          Please check your device compatibility before purchasing. Refunds for
          incompatibility may be considered on a case-by-case basis before activation.
        </p>

        <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>5. Processing Time</h2>
        <p>
          Approved refunds are processed within 5–10 business days. The funds will appear on
          your original payment method depending on your bank&apos;s processing time.
        </p>

        <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>6. Contact</h2>
        <p>
          To request a refund, please{' '}
          <Link href="/contact" style={{ color: 'var(--electric)' }} className="hover:underline">
            contact us
          </Link>{' '}
          or open a{' '}
          <Link href="/support" style={{ color: 'var(--electric)' }} className="hover:underline">
            support ticket
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
