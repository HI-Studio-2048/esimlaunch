'use client';

import Link from 'next/link';
import { useStoreConfig } from '@/contexts/StoreConfigContext';

export default function PrivacyPage() {
  const { templateSettings, branding } = useStoreConfig();
  const ts = templateSettings as { legalCompanyName?: string; legalLastUpdated?: string } | undefined;
  const companyName = ts?.legalCompanyName || branding?.businessName || 'We';
  const lastUpdated = ts?.legalLastUpdated || 'March 2025';

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-bold text-void">Privacy Policy</h1>
      <p className="mt-4 text-sm text-faint">Last updated: {lastUpdated}</p>

      <section className="mt-12 space-y-6 text-dim">
        <h2 className="text-xl font-semibold text-void">1. Information We Collect</h2>
        <p>
          We collect information you provide when creating an account, placing an order, or
          contacting support: email address, name, and payment information (processed securely
          by our payment provider). We also collect device and usage information to improve
          our service.
        </p>

        <h2 className="text-xl font-semibold text-void">2. How We Use It</h2>
        <p>
          We use your information to process orders, deliver eSIMs, send transactional emails,
          and provide support. We may use aggregated data for analytics and service improvement.
        </p>

        <h2 className="text-xl font-semibold text-void">3. Data Sharing</h2>
        <p>
          We share data only as necessary: with our eSIM provider for order fulfillment,
          with payment processors for transactions, and with analytics tools. We do not sell
          your personal information.
        </p>

        <h2 className="text-xl font-semibold text-void">4. Data Security</h2>
        <p>
          We use industry-standard encryption and secure practices to protect your data.
          Payment information is handled by PCI-compliant providers and is not stored on our
          servers.
        </p>

        <h2 className="text-xl font-semibold text-void">5. Cookies</h2>
        <p>
          We use cookies and similar technologies for essential functionality, authentication,
          and analytics. See our{' '}
          <Link href="/cookies" className="text-link hover:underline">
            Cookie Policy
          </Link>{' '}
          for details.
        </p>

        <h2 className="text-xl font-semibold text-void">6. Your Rights</h2>
        <p>
          Depending on your location, you may have rights to access, correct, delete, or port
          your data. You can delete your account at any time from account settings.
        </p>

        <h2 className="text-xl font-semibold text-void">7. Contact</h2>
        <p>
          For privacy inquiries, please{' '}
          <Link href="/contact" className="text-link hover:underline">
            contact us
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
