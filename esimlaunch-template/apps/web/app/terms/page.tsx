import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of service for our eSIM platform.',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
      <p className="mt-4 text-sm text-slate-500">Last updated: March 2025</p>

      <section className="mt-12 space-y-6 text-slate-700">
        <h2 className="text-xl font-semibold text-slate-900">1. Acceptance</h2>
        <p>
          By using this website and purchasing eSIM plans, you agree to these Terms of Service.
          If you do not agree, please do not use our services.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">2. Service Description</h2>
        <p>
          We provide digital eSIM data plans for international travel. Plans are delivered
          electronically and require a compatible device. Service availability and network
          quality depend on local operators in your destination country.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">3. Account and Payments</h2>
        <p>
          You must provide accurate information when creating an account or placing an order.
          Payment is processed through secure third-party providers. You are responsible for
          maintaining the security of your account credentials.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">4. Use of Service</h2>
        <p>
          eSIM plans are for personal, non-commercial use unless otherwise stated. You may not
          resell, redistribute, or misuse the service. Data plans are valid for the purchased
          duration and region only.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">5. Refunds</h2>
        <p>
          Refund policy is set out in our{' '}
          <a href="/refund" className="text-violet-600 hover:underline">
            Refund Policy
          </a>
          .
        </p>

        <h2 className="text-xl font-semibold text-slate-900">6. Limitations</h2>
        <p>
          We are not liable for connectivity issues arising from device incompatibility, operator
          outages, or user error. Our liability is limited to the amount you paid for the
          affected plan.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">7. Changes</h2>
        <p>
          We may update these terms from time to time. Continued use after changes constitutes
          acceptance. We will notify users of material changes where appropriate.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">8. Contact</h2>
        <p>
          For questions about these terms, please{' '}
          <a href="/contact" className="text-violet-600 hover:underline">
            contact us
          </a>
          .
        </p>
      </section>
    </div>
  );
}
