'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStoreConfig } from '@/contexts/StoreConfigContext';
import { ChevronDown, MessageCircle } from 'lucide-react';

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
    a: "You'll receive an email with your QR code and activation instructions immediately after payment. You can also find it in My eSIMs once you're signed in.",
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
    <div className="min-h-screen" style={{ background: 'var(--night)' }}>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
        {/* Header */}
        <div className="mb-12">
          <span className="section-label mb-3 inline-block">FAQ</span>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
            Frequently Asked Questions
          </h1>
          <p className="mt-4" style={{ color: 'var(--text-muted)' }}>
            Quick answers to common questions about eSIMs and our service.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden transition-all"
              style={{
                background: openIndex === i ? 'var(--night-100)' : 'var(--night-50)',
                border: `1px solid ${openIndex === i ? 'var(--border-bright)' : 'var(--border)'}`,
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors"
                style={{ color: 'var(--text)' }}
              >
                <span className="font-medium pr-4">{item.question}</span>
                <ChevronDown
                  className="h-4 w-4 shrink-0 transition-transform duration-200"
                  style={{
                    color: 'var(--text-muted)',
                    transform: openIndex === i ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>
              {openIndex === i && (
                <div
                  className="px-5 pb-5 text-sm leading-relaxed"
                  style={{
                    color: 'var(--text-muted)',
                    borderTop: '1px solid var(--border)',
                    paddingTop: '1rem',
                  }}
                >
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA footer */}
        <div
          className="mt-12 rounded-xl p-6 flex items-start gap-4"
          style={{
            background: 'var(--night-50)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'rgba(79,126,255,0.12)', color: 'var(--electric)' }}
          >
            <MessageCircle className="h-5 w-5" />
          </div>
          <p style={{ color: 'var(--text-muted)' }}>
            Still have questions?{' '}
            <Link
              href="/contact"
              className="font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--electric)' }}
            >
              Contact us
            </Link>
            {' '}or visit our{' '}
            <Link
              href="/support"
              className="font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--electric)' }}
            >
              Support
            </Link>
            {' '}page.
          </p>
        </div>
      </div>
    </div>
  );
}
