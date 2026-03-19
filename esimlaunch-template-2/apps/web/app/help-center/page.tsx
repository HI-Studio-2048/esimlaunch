'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { HELP_ARTICLES } from '@/lib/helpArticles';

const CATEGORIES = ['Getting Started', 'Installation', 'Billing', 'Troubleshooting'] as const;

export default function HelpCenterPage() {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return HELP_ARTICLES;
    const q = search.toLowerCase();
    return HELP_ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.shortDesc.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q),
    );
  }, [search]);

  const byCategory = useMemo(() => {
    const map: Record<string, typeof HELP_ARTICLES> = {};
    for (const a of filtered) {
      if (!map[a.category]) map[a.category] = [];
      map[a.category].push(a);
    }
    return CATEGORIES.filter((c) => map[c]?.length).map((cat) => ({
      category: cat,
      articles: map[cat],
    }));
  }, [filtered]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-bold text-ink">Help Center</h1>
      <p className="mt-4 text-ink-secondary">
        Find answers and step-by-step guides. Can&apos;t find what you need?{' '}
        <Link href="/contact" className="font-medium text-teal-400 hover:text-teal-500">
          Contact us
        </Link>
        {' '}or{' '}
        <Link href="/support" className="font-medium text-teal-400 hover:text-teal-500">
          open a support ticket
        </Link>
        .
      </p>

      {/* Search */}
      <div className="mt-8">
        <input
          type="text"
          placeholder="Search help articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
        />
      </div>

      {/* Articles by category */}
      <div className="mt-12 space-y-10">
        {byCategory.length === 0 ? (
          <p className="text-ink-secondary">No articles match your search.</p>
        ) : (
          byCategory.map(({ category, articles }) => (
            <div key={category}>
              <h2 className="text-lg font-semibold text-ink">{category}</h2>
              <div className="mt-4 space-y-2">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    className="card"
                  >
                    <button
                      onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}
                      className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-surface-soft rounded-card"
                    >
                      <div>
                        <span className="font-medium text-ink">{article.title}</span>
                        <p className="mt-1 text-sm text-ink-secondary">{article.shortDesc}</p>
                      </div>
                      <span
                        className={`ml-4 shrink-0 text-xs text-ink-muted transition-transform duration-150 ${expandedId === article.id ? 'rotate-180' : ''}`}
                      >
                        ▼
                      </span>
                    </button>
                    {expandedId === article.id && (
                      <div className="border-t border-surface-border px-5 py-4 text-ink-secondary">
                        <p>
                          {article.slug === 'install-ios' && (
                            <>
                              On iPhone: Go to <strong>Settings → Cellular → Add Cellular Plan</strong>.
                              Scan your QR code or enter the activation code manually. Name your plan
                              and tap Add. Activate when you arrive at your destination.
                            </>
                          )}
                          {article.slug === 'install-android' && (
                            <>
                              On Android: Open <strong>Settings → Network & Internet → SIMs → Add eSIM</strong>.
                              Scan the QR code or enter the activation code. Your eSIM will be installed.
                              Enable it when you reach your destination.
                            </>
                          )}
                          {article.slug === 'device-compatibility' && (
                            <>
                              iPhone XS, XR, 11, 12, 13, 14, 15 and later. Google Pixel 3 and later.
                              Samsung Galaxy S20 and later. Check your device settings for
                              &quot;Add Cellular Plan&quot; or &quot;eSIM&quot;.
                            </>
                          )}
                          {!['install-ios', 'install-android', 'device-compatibility'].includes(
                            article.slug ?? '',
                          ) && (
                            <>
                              For detailed instructions, see our{' '}
                              <Link
                                href="/esim-setup-guide"
                                className="text-teal-400 hover:underline"
                              >
                                eSIM Setup Guide
                              </Link>
                              .
                            </>
                          )}
                        </p>
                        <Link
                          href="/esim-setup-guide"
                          className="mt-3 inline-block text-sm font-medium text-teal-400 hover:text-teal-500"
                        >
                          Full guide →
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
