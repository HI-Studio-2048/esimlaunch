import Link from 'next/link';

export const metadata = {
  title: 'Support',
  description: 'Get help with your eSIM. 24/7 support available.',
};

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-bold text-slate-900">Support</h1>
      <p className="mt-4 text-slate-600">
        We&apos;re here to help you stay connected. Choose an option below.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <Link
          href="/faq"
          className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 no-underline shadow-sm transition hover:border-violet-200 hover:shadow-md"
        >
          <span className="text-3xl">❓</span>
          <h2 className="mt-4 font-semibold text-slate-900">FAQ</h2>
          <p className="mt-2 text-sm text-slate-600">
            Find quick answers to common questions.
          </p>
          <span className="mt-4 text-sm font-medium text-violet-600">View FAQ →</span>
        </Link>

        <Link
          href="/support/tickets/new"
          className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 no-underline shadow-sm transition hover:border-violet-200 hover:shadow-md"
        >
          <span className="text-3xl">🎫</span>
          <h2 className="mt-4 font-semibold text-slate-900">Create a Ticket</h2>
          <p className="mt-2 text-sm text-slate-600">
            Open a support ticket for personalized help.
          </p>
          <span className="mt-4 text-sm font-medium text-violet-600">Create ticket →</span>
        </Link>

        <Link
          href="/support/tickets"
          className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 no-underline shadow-sm transition hover:border-violet-200 hover:shadow-md"
        >
          <span className="text-3xl">📋</span>
          <h2 className="mt-4 font-semibold text-slate-900">My Tickets</h2>
          <p className="mt-2 text-sm text-slate-600">
            View and manage your support tickets.
          </p>
          <span className="mt-4 text-sm font-medium text-violet-600">View tickets →</span>
        </Link>

        <Link
          href="/contact"
          className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 no-underline shadow-sm transition hover:border-violet-200 hover:shadow-md"
        >
          <span className="text-3xl">✉️</span>
          <h2 className="mt-4 font-semibold text-slate-900">Contact Us</h2>
          <p className="mt-2 text-sm text-slate-600">
            Email us or use live chat for assistance.
          </p>
          <span className="mt-4 text-sm font-medium text-violet-600">Contact →</span>
        </Link>

        <Link
          href="/my-esims"
          className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 no-underline shadow-sm transition hover:border-violet-200 hover:shadow-md"
        >
          <span className="text-3xl">📶</span>
          <h2 className="mt-4 font-semibold text-slate-900">My eSIMs</h2>
          <p className="mt-2 text-sm text-slate-600">
            View your active eSIMs, QR codes, data usage, and top-up options.
          </p>
          <span className="mt-4 text-sm font-medium text-violet-600">Go to My eSIMs →</span>
        </Link>
      </div>

      <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">24/7 Support</h2>
        <p className="mt-2 text-slate-600">
          Our support team is available around the clock. Reach us via email at{' '}
          <a href="mailto:support@esimstore.com" className="font-medium text-violet-600 hover:text-violet-700">
            support@esimstore.com
          </a>
          . We typically respond within 24 hours.
        </p>
      </div>
    </div>
  );
}
