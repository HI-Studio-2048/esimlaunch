import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'eSIM Setup Guide',
  description: 'Step-by-step guide to installing and activating your eSIM.',
};

const STEPS = [
  {
    title: '1. Check compatibility',
    desc: 'Make sure your device supports eSIM. iPhone XS and later, Google Pixel 3+, Samsung Galaxy S20+ and many other modern devices are supported. Check your phone settings for "Add Cellular Plan" or "eSIM".',
  },
  {
    title: '2. Purchase your plan',
    desc: "Choose a data plan for your destination, complete checkout, and pay securely. You'll receive your eSIM within minutes.",
  },
  {
    title: '3. Receive your eSIM',
    desc: "Check your email for the QR code and activation details. You can also find it in My eSIMs once you're signed in. Save the email or take a screenshot for offline access.",
  },
  {
    title: '4. Scan QR or enter code',
    desc: 'On iPhone: Settings → Cellular → Add Cellular Plan. On Android: Settings → Network & Internet → SIMs → Add eSIM. Scan the QR code or enter the activation code manually.',
  },
  {
    title: '5. Activate at your destination',
    desc: "Install the eSIM before you travel, but don't turn on the data plan until you arrive. This ensures your data starts when you need it. Once you land, enable cellular data for your eSIM in Settings.",
  },
];

export default function EsimSetupGuidePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
        eSIM Setup Guide
      </h1>
      <p className="mt-4" style={{ color: 'var(--text-muted)' }}>
        Follow these steps to install and use your eSIM. Simple and straightforward.
      </p>

      <div className="mt-12 space-y-10">
        {STEPS.map((step, i) => (
          <div key={i} className="flex gap-6">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold"
              style={{
                background: 'rgba(79,126,255,0.15)',
                color: 'var(--electric)',
                border: '1px solid rgba(79,126,255,0.3)',
              }}
            >
              {i + 1}
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                {step.title}
              </h2>
              <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Things to know */}
      <div
        className="mt-16 rounded-card p-6"
        style={{
          background: 'var(--night-50)',
          border: '1px solid var(--border-bright)',
        }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Things to know about eSIM
        </h2>
        <ul className="mt-4 space-y-2" style={{ color: 'var(--text-muted)' }}>
          <li>• Install before you travel, activate when you arrive</li>
          <li>• Data-only plans — use WhatsApp, Skype, FaceTime for calls</li>
          <li>• Your WhatsApp number stays the same</li>
          <li>• Compatible with iPhone XS+, Pixel 3+, Samsung S20+</li>
          <li>• No physical SIM — digital activation only</li>
        </ul>
      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link href="/help-center" className="btn-primary">
          Back to Help Center
        </Link>
        <Link href="/support" className="btn-secondary">
          Need help? Contact Support
        </Link>
      </div>
    </div>
  );
}
