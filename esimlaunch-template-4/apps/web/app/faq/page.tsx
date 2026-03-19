'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStoreConfig } from '@/contexts/StoreConfigContext';

const DEFAULT_FAQ_ITEMS = [
  {
    q: 'What is an eSIM?',
    a: 'An eSIM is a digital SIM that lets you connect to a cellular network without a physical SIM card. You can install it on your phone by scanning a QR code or entering an activation code.',
  },
  {
    q: 'Is my phone compatible with eSIM?',
    a: 'Most newer iPhones (iPhone XS and later) and many Android phones (Google Pixel, Samsung Galaxy S20 and later) support eSIM. Check your device settings for "Add Cellular Plan" or "eSIM" to confirm.',
  },
  {
    q: 'When should I install my eSIM?',
    a: 'Install your eSIM before you travel, but do not activate the data plan until you arrive at your destination. This ensures your data starts when you need it.',
  },
  {
    q: 'Can I make phone calls with an eSIM?',
    a: 'Our eSIMs provide data only. You can use apps like WhatsApp, Skype, or FaceTime for calls and messages. Your WhatsApp number stays the same.',
  },
  {
    q: 'Can I top up my eSIM if I run out of data?',
    a: 'Yes! Plans marked "Top-up capable" allow you to add more data before expiry. Go to My eSIMs and select the Top Up option on your active plan.',
  },
  {
    q: 'How do I get my eSIM after purchasing?',
    a: 'You\'ll receive an email with your QR code and activation instructions immediately after payment. You can also find it in My eSIMs once you\'re signed in.',
  },
  {
    q: 'What countries are covered?',
    a: 'We offer eSIMs for 190+ countries and regions. Browse our destinations to find plans for your trip.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept major credit cards (Visa, Mastercard, American Express) through our secure Stripe checkout.',
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { templateSettings } = useStoreConfig();
  const ts = templateSettings as { faqs?: { question: string; answer: string }[] } | undefined;
  const items = (ts?.faqs?.length ? ts.faqs : DEFAULT_FAQ_ITEMS).map((f) =>
    'question' in f ? f : { question: (f as { q: string }).q, answer: (f as { a: string }).a }
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-bold text-void">Frequently Asked Questions</h1>
      <p className="mt-4 text-dim">
        Quick answers to common questions about eSIMs and our service.
      </p>

      <div className="mt-12 space-y-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-card border border-rule bg-surface shadow-card"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between px-5 py-4 text-left font-medium text-void hover:bg-canvas transition-colors"
            >
              {item.question}
              <span className={`ml-4 shrink-0 text-xs text-faint transition-transform ${openIndex === i ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            {openIndex === i && (
              <div className="border-t border-rule px-5 py-4 text-dim">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-card border border-rule bg-surface p-6">
        <p className="text-void">
          Still have questions?{' '}
          <Link href="/contact" className="font-medium text-link hover:underline">
            Contact us
          </Link>
          {' '}or visit our{' '}
          <Link href="/support" className="font-medium text-link hover:underline">
            Support
          </Link>
          {' '}page.
        </p>
      </div>
    </div>
  );
}
