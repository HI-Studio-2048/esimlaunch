'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SignInButton, SignUpButton,
  SignedIn, SignedOut, UserButton, useUser,
} from '@clerk/nextjs';
import { CurrencySelector } from '@/components/CurrencySelector';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useStoreConfig } from '@/contexts/StoreConfigContext';

/* ── eSIM count badge in nav ─────────────────────────────── */
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
    <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-teal-400 text-[10px] font-bold text-white">
      {count > 9 ? '9+' : count}
    </span>
  );
}

/* ── Nav link ────────────────────────────────────────────── */
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/' && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors duration-150 ${
        active ? 'text-ink' : 'text-ink-muted hover:text-ink'
      }`}
    >
      {children}
    </Link>
  );
}

/* ── Main Navbar ─────────────────────────────────────────── */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { branding } = useStoreConfig();
  const businessName = branding.businessName ?? 'eSIM Hub';
  const logoUrl = branding.logoUrl;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <>
      {/* ── Desktop / top bar ─────────────────────────────── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${
          scrolled
            ? 'bg-white shadow-nav'
            : 'bg-white/90 backdrop-blur-md shadow-nav'
        }`}
      >
        <div className="page-container flex h-16 items-center justify-between gap-6">

          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5 no-underline">
            {logoUrl ? (
              <img src={logoUrl} alt={businessName} className="h-8 w-auto object-contain" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-400 text-base text-white font-bold">
                e
              </span>
            )}
            <span className="text-base font-bold tracking-tight text-ink">{businessName}</span>
          </Link>

          {/* Center nav — desktop only */}
          <nav className="hidden items-center gap-7 lg:flex">
            <NavLink href="/">Destinations</NavLink>
            <NavLink href="/faq">How It Works</NavLink>
            <NavLink href="/about">About</NavLink>
            <NavLink href="/support">Support</NavLink>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <CurrencySelector />

            <SignedIn>
              <NavLink href="/my-esims">
                <span className="flex items-center">My eSIMs<EsimCount /></span>
              </NavLink>
              <NavLink href="/account">Account</NavLink>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal">
                <button className="btn-ghost hidden sm:flex">Sign in</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn-primary">Get started</button>
              </SignUpButton>
            </SignedOut>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-btn transition-colors hover:bg-surface-muted lg:hidden"
              aria-label="Menu"
            >
              <span className={`h-0.5 w-5 rounded-full bg-ink-secondary transition-transform duration-200 ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`} />
              <span className={`h-0.5 w-5 rounded-full bg-ink-secondary transition-opacity duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`h-0.5 w-5 rounded-full bg-ink-secondary transition-transform duration-200 ${mobileOpen ? '-translate-y-2 -rotate-45' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16" />

      {/* ── Mobile drawer ─────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" />
          <nav
            className="absolute inset-y-0 right-0 w-72 bg-white px-6 py-8 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="text-ink-muted hover:text-ink">✕</button>
            </div>
            <div className="flex flex-col gap-1">
              {[
                { href: '/', label: 'Destinations' },
                { href: '/faq', label: 'How It Works' },
                { href: '/about', label: 'About' },
                { href: '/support', label: 'Support' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-btn px-3 py-2.5 text-sm font-medium text-ink-secondary hover:bg-surface-soft hover:text-ink no-underline"
                >
                  {label}
                </Link>
              ))}
              <div className="my-4 border-t border-surface-border" />
              <SignedIn>
                <Link href="/my-esims" onClick={() => setMobileOpen(false)} className="rounded-btn px-3 py-2.5 text-sm font-medium text-ink-secondary hover:bg-surface-soft no-underline">My eSIMs</Link>
                <Link href="/account" onClick={() => setMobileOpen(false)} className="rounded-btn px-3 py-2.5 text-sm font-medium text-ink-secondary hover:bg-surface-soft no-underline">Account</Link>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="btn-ghost w-full justify-start px-3" onClick={() => setMobileOpen(false)}>Sign in</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="btn-primary mt-2 w-full" onClick={() => setMobileOpen(false)}>Get started</button>
                </SignUpButton>
              </SignedOut>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
