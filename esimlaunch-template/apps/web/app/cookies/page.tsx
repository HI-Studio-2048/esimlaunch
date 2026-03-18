'use client';

import { useStoreConfig } from '@/contexts/StoreConfigContext';

export default function CookiesPage() {
  const { templateSettings } = useStoreConfig();
  const ts = templateSettings as { legalLastUpdated?: string } | undefined;
  const lastUpdated = ts?.legalLastUpdated || 'March 2025';

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-bold text-slate-900">Cookie Policy</h1>
      <p className="mt-4 text-sm text-slate-500">Last updated: {lastUpdated}</p>

      <section className="mt-12 space-y-6 text-slate-700">
        <h2 className="text-xl font-semibold text-slate-900">1. What Are Cookies?</h2>
        <p>
          Cookies are small text files stored on your device when you visit a website. They
          help websites remember your preferences and improve your experience.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">2. Cookies We Use</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Essential:</strong> Required for authentication, checkout, and security.
            These cannot be disabled.
          </li>
          <li>
            <strong>Preferences:</strong> Remember your settings (e.g., currency, language).
          </li>
          <li>
            <strong>Analytics:</strong> Help us understand how visitors use our site to
            improve it.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900">3. Third-Party Cookies</h2>
        <p>
          We use services that may set their own cookies: payment processors (Stripe),
          authentication (Clerk), and analytics. These providers have their own privacy
          policies.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">4. Managing Cookies</h2>
        <p>
          You can control cookies through your browser settings. Disabling essential cookies
          may affect your ability to sign in, complete checkout, or access your eSIMs.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">5. Contact</h2>
        <p>
          For questions about our use of cookies, please{' '}
          <a href="/contact" className="text-violet-600 hover:underline">
            contact us
          </a>
          .
        </p>
      </section>
    </div>
  );
}
