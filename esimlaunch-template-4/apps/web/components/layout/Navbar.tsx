'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser,
} from '@clerk/nextjs';
import { CurrencySelector } from '@/components/CurrencySelector';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useStoreConfig } from '@/contexts/StoreConfigContext';

function EsimCount() {
  const { user } = useUser();
  const { authFetch } = useAuthFetch();
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    authFetch<{ id: string }[]>('/user/esims')
      .then(arr => setCount(arr.length))
      .catch(() => {});
  }, [user?.primaryEmailAddress?.emailAddress, authFetch]);
  if (!count) return null;
  return (
    <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-void text-[9px] font-bold text-white">
      {count > 9 ? '9+' : count}
    </span>
  );
}

const NAV_LINKS = [
  { href: '/', label: 'Store' },
  { href: '/regions', label: 'Regions' },
  { href: '/faq', label: 'FAQ' },
  { href: '/support', label: 'Support' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { branding } = useStoreConfig();
  const businessName = branding.businessName ?? 'eSIM';
  const logoUrl = branding.logoUrl;
  const pathname = usePathname();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 1);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(245,245,247,0.85)' : 'rgba(245,245,247,0.72)',
          backdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: scrolled ? '1px solid rgba(0,0,0,0.08)' : '1px solid transparent',
        }}
      >
        <div className="page-container">
          <div className="flex h-12 items-center justify-between">

            {/* Logo */}
            <Link href="/" className="flex-shrink-0 no-underline">
              {logoUrl ? (
                <img src={logoUrl} alt={businessName} className="h-6 w-auto object-contain" />
              ) : (
                <span className="text-base font-semibold tracking-tight text-void">{businessName}</span>
              )}
            </Link>

            {/* Center nav — desktop */}
            <nav className="hidden items-center gap-0 md:flex">
              {NAV_LINKS.map(({ href, label }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className="px-3.5 py-1 text-sm transition-colors no-underline"
                    style={{ color: active ? '#1d1d1f' : '#6e6e73' }}
                    onMouseEnter={e => ((e.target as HTMLElement).style.color = '#1d1d1f')}
                    onMouseLeave={e => ((e.target as HTMLElement).style.color = active ? '#1d1d1f' : '#6e6e73')}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Right */}
            <div className="flex items-center gap-2">
              <CurrencySelector />
              <SignedIn>
                <Link
                  href="/my-esims"
                  className="hidden items-center text-sm no-underline transition-colors md:flex"
                  style={{ color: '#6e6e73' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#0066cc')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#6e6e73')}
                >
                  My eSIMs<EsimCount />
                </Link>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="hidden text-sm font-medium text-dim transition-colors hover:text-void md:block">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="btn-primary px-4 py-1.5 text-xs">
                    Get started
                  </button>
                </SignUpButton>
              </SignedOut>

              {/* Mobile menu button */}
              <button
                className="flex h-8 w-8 flex-col items-center justify-center gap-1 rounded md:hidden"
                onClick={() => setMobileOpen(o => !o)}
                aria-label="Menu"
              >
                <span
                  className="block h-px w-5 bg-void transition-all duration-200"
                  style={{ transform: mobileOpen ? 'translateY(4px) rotate(45deg)' : 'none' }}
                />
                <span
                  className="block h-px w-5 bg-void transition-all duration-200"
                  style={{ transform: mobileOpen ? 'translateY(-4px) rotate(-45deg)' : 'none', opacity: mobileOpen ? 1 : 1 }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="border-t border-rule bg-surface py-4 md:hidden">
            <div className="page-container flex flex-col gap-1">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-btn-sq px-3 py-2.5 text-sm font-medium text-void no-underline transition-colors hover:bg-canvas"
                >
                  {label}
                </Link>
              ))}
              <div className="mt-2 border-t border-rule pt-2">
                <SignedIn>
                  <Link href="/my-esims" className="block rounded-btn-sq px-3 py-2.5 text-sm font-medium text-void no-underline hover:bg-canvas">My eSIMs</Link>
                  <Link href="/account" className="block rounded-btn-sq px-3 py-2.5 text-sm font-medium text-void no-underline hover:bg-canvas">Account</Link>
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="block w-full rounded-btn-sq px-3 py-2.5 text-left text-sm font-medium text-void hover:bg-canvas">Sign in</button>
                  </SignInButton>
                </SignedOut>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Spacer */}
      <div className="h-12" />
    </>
  );
}
