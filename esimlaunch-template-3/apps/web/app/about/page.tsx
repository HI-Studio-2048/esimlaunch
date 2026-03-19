'use client';

import { useStoreConfig } from '@/contexts/StoreConfigContext';
import { Zap, Wifi, DollarSign, HeadphonesIcon } from 'lucide-react';

const DEFAULT_TAGLINE = "We're on a mission to make staying connected abroad simple and affordable.";
const DEFAULT_MISSION = `Traveling should mean freedom—not hunting for local SIM cards or paying steep roaming fees. We built this platform so you can activate data in 190+ countries with a few taps, before you even leave home.`;

const OFFERINGS = [
  {
    icon: Zap,
    label: 'Instant delivery — eSIMs ready within minutes',
  },
  {
    icon: Wifi,
    label: 'No physical SIM cards — digital activation only',
  },
  {
    icon: DollarSign,
    label: 'Competitive pricing — plans for every budget',
  },
  {
    icon: HeadphonesIcon,
    label: "24/7 support — we're here when you need us",
  },
];

export default function AboutPage() {
  const { templateSettings } = useStoreConfig();
  const ts = templateSettings as { aboutTagline?: string; aboutMission?: string } | undefined;
  const tagline = ts?.aboutTagline || DEFAULT_TAGLINE;
  const mission = ts?.aboutMission || DEFAULT_MISSION;

  return (
    <div className="min-h-screen" style={{ background: 'var(--night)' }}>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
        {/* Header */}
        <div className="mb-12">
          <span className="section-label mb-3 inline-block">Company</span>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
            About Us
          </h1>
          <p className="mt-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {tagline}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {/* Our Story */}
          <div
            className="rounded-xl p-6"
            style={{
              background: 'var(--night-50)',
              border: '1px solid var(--border)',
            }}
          >
            <h2 className="mb-3 text-lg font-semibold" style={{ color: 'var(--text)' }}>
              Our Story
            </h2>
            <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {mission}
            </p>
          </div>

          {/* How It Works */}
          <div
            className="rounded-xl p-6"
            style={{
              background: 'var(--night-50)',
              border: '1px solid var(--border)',
            }}
          >
            <h2 className="mb-3 text-lg font-semibold" style={{ color: 'var(--text)' }}>
              How It Works
            </h2>
            <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Choose a data plan for your destination, pay securely, and receive your eSIM instantly
              via email. Scan the QR code on your phone, install the profile, and you&apos;re connected
              when you land.
            </p>
          </div>

          {/* What We Offer */}
          <div
            className="rounded-xl p-6"
            style={{
              background: 'var(--night-50)',
              border: '1px solid var(--border)',
            }}
          >
            <h2 className="mb-5 text-lg font-semibold" style={{ color: 'var(--text)' }}>
              What We Offer
            </h2>
            <ul className="space-y-4">
              {OFFERINGS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: 'rgba(79,126,255,0.12)', color: 'var(--electric)' }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
