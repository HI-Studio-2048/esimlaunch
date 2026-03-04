import Link from 'next/link';

export const metadata = {
  title: 'Contact Us',
  description: 'Get in touch with eSIM Store support.',
};

export default function ContactPage() {
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
            <a href="mailto:support@esimstore.com" className="font-medium text-violet-600 hover:text-violet-700">
              support@esimstore.com
            </a>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">24/7 Live Support</h2>
          <p className="mt-2 text-slate-600">
            Need immediate help? Our live chat support is available 24 hours a day, 7 days a week.
          </p>
          <Link
            href="/support"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 font-medium text-white no-underline transition hover:bg-violet-500"
          >
            Go to Support
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
