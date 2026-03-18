'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import { SearchDropdown } from '@/components/SearchDropdown';
import { CurrencySelector } from '@/components/CurrencySelector';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useStoreConfig } from '@/contexts/StoreConfigContext';

function EsimCountBadge() {
  const { user } = useUser();
  const { authFetch } = useAuthFetch();
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;
    authFetch<{ id: string }[]>('/user/esims')
      .then((arr) => setCount(arr.length))
      .catch(() => {});
  }, [user?.primaryEmailAddress?.emailAddress, authFetch]);
  if (count === null || count === 0) return null;
  return <span className="ml-1 rounded-full bg-violet-100 px-1.5 py-0.5 text-xs font-medium text-violet-700">{count}</span>;
}

const DEFAULT_PRIMARY = '#6366f1';
const DEFAULT_SECONDARY = '#8b5cf6';

export function Navbar() {
  const { branding } = useStoreConfig();
  const businessName = branding.businessName ?? 'eSIM Store';
  const primaryColor = branding.primaryColor ?? DEFAULT_PRIMARY;
  const secondaryColor = branding.secondaryColor ?? DEFAULT_SECONDARY;
  const logoUrl = branding.logoUrl;

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-slate-900 no-underline transition hover:opacity-90"
          style={{ ['--tw-ring-color' as string]: primaryColor }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={businessName}
              className="h-9 w-auto max-w-[140px] object-contain"
            />
          ) : (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                boxShadow: `${primaryColor}40 0 8px 16px`,
              }}
            >
              📶
            </span>
          )}
          <span>{businessName}</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-6">
          <CurrencySelector />
          <SearchDropdown />
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Destinations
          </Link>
          <Link
            href="/faq"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            FAQ
          </Link>
          <Link
            href="/support"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Support
          </Link>

          <SignedIn>
            <Link
              href="/account"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Account
            </Link>
            <Link
              href="/my-esims"
              className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              My eSIMs
              <EsimCountBadge />
            </Link>
            <div className="ml-2">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'ring-2 ring-slate-200',
                  },
                }}
              />
            </div>
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                Login
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
                style={{
                  background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
                  boxShadow: `${primaryColor}40 0 8px 16px`,
                }}
              >
                Get Started
              </button>
            </SignUpButton>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
}
