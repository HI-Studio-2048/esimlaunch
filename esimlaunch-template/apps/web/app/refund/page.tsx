import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'Our refund and cancellation policy for eSIM plans.',
};

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-bold text-slate-900">Refund Policy</h1>
      <p className="mt-4 text-sm text-slate-500">Last updated: March 2025</p>

      <section className="mt-12 space-y-6 text-slate-700">
        <h2 className="text-xl font-semibold text-slate-900">1. Before Activation</h2>
        <p>
          If you have not yet installed or activated your eSIM, you may request a full refund
          within 14 days of purchase. Contact our support team with your order ID to process
          the refund.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">2. After Activation</h2>
        <p>
          Once your eSIM has been activated (data has been used or the plan has started),
          refunds are generally not available. Digital products are consumed upon activation.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">3. Technical Issues</h2>
        <p>
          If you experience technical issues that prevent you from using your eSIM (e.g.,
          activation failures, network incompatibility in your destination), contact support.
          We will work with you to resolve the issue or offer a replacement or refund where
          appropriate.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">4. Device Incompatibility</h2>
        <p>
          Please check your device compatibility before purchasing. Refunds for
          incompatibility may be considered on a case-by-case basis before activation.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">5. Processing Time</h2>
        <p>
          Approved refunds are processed within 5–10 business days. The funds will appear on
          your original payment method depending on your bank&apos;s processing time.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">6. Contact</h2>
        <p>
          To request a refund, please{' '}
          <Link href="/contact" className="text-violet-600 hover:underline">
            contact us
          </Link>{' '}
          or open a{' '}
          <Link href="/support" className="text-violet-600 hover:underline">
            support ticket
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
