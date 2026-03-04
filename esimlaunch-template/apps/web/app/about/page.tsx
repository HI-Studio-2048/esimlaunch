import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about our eSIM platform and mission to keep travelers connected.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-bold text-slate-900">About Us</h1>
      <p className="mt-4 text-slate-600">
        We&apos;re on a mission to make staying connected abroad simple and affordable.
      </p>

      <section className="mt-12 space-y-6 text-slate-700">
        <h2 className="text-xl font-semibold text-slate-900">Our Story</h2>
        <p>
          Traveling should mean freedom—not hunting for local SIM cards or paying steep roaming
          fees. We built this platform so you can activate data in 190+ countries with a few taps,
          before you even leave home.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">How It Works</h2>
        <p>
          Choose a data plan for your destination, pay securely, and receive your eSIM instantly
          via email. Scan the QR code on your phone, install the profile, and you&apos;re connected
          when you land.
        </p>

        <h2 className="text-xl font-semibold text-slate-900">What We Offer</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>Instant delivery — eSIMs ready within minutes</li>
          <li>No physical SIM cards — digital activation only</li>
          <li>Competitive pricing — plans for every budget</li>
          <li>24/7 support — we&apos;re here when you need us</li>
        </ul>
      </section>
    </div>
  );
}
