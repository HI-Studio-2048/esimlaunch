'use client';

import { useStoreConfig } from '@/contexts/StoreConfigContext';

const DEFAULT_TAGLINE = "We're on a mission to make staying connected abroad simple and affordable.";
const DEFAULT_MISSION = `Traveling should mean freedom—not hunting for local SIM cards or paying steep roaming fees. We built this platform so you can activate data in 190+ countries with a few taps, before you even leave home.`;

export default function AboutPage() {
  const { templateSettings } = useStoreConfig();
  const ts = templateSettings as { aboutTagline?: string; aboutMission?: string } | undefined;
  const tagline = ts?.aboutTagline || DEFAULT_TAGLINE;
  const mission = ts?.aboutMission || DEFAULT_MISSION;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-bold text-ink">About Us</h1>
      <p className="mt-4 text-ink-muted">{tagline}</p>

      <section className="mt-12 space-y-6 text-ink-secondary">
        <h2 className="text-xl font-semibold text-ink">Our Story</h2>
        <p>{mission}</p>

        <h2 className="text-xl font-semibold text-ink">How It Works</h2>
        <p>
          Choose a data plan for your destination, pay securely, and receive your eSIM instantly
          via email. Scan the QR code on your phone, install the profile, and you&apos;re connected
          when you land.
        </p>

        <h2 className="text-xl font-semibold text-ink">What We Offer</h2>
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
