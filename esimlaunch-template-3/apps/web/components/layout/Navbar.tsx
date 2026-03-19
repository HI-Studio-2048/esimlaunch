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
import { Globe, Wifi, HelpCircle, User, Home } from 'lucide-react';

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
    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-electric-400 text-[9px] font-bold text-white">
      {count > 9 ? '9+' : count}
    </span>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { branding } = useStoreConfig();
  const businessName = branding.businessName ?? 'ROAM';
  const logoUrl = branding.logoUrl;
  const pathname = usePathname();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <>
      {/* ── Top bar (desktop + tablet) ────────────────────────── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-night/95 backdrop-blur-xl shadow-nav'
            : 'bg-transparent'
        }`}
      >
        <div className="page-container flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            {logoUrl ? (
              <img src={logoUrl} alt={businessName} className="h-8 w-auto object-contain" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-card">
                <div
                  className="h-full w-full rounded-card"
                  style={{ background: 'linear-gradient(135deg, #4f7eff, #00e5c0)' }}
                />
              </div>
            )}
            <span
              className="text-base font-bold tracking-tight"
              style={{ background: 'linear-gradient(135deg, #f0f2ff, #85abff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              {businessName}
            </span>
          </Link>

          {/* Center pill nav — desktop only */}
          <nav
            className="hidden items-center rounded-pill border px-1.5 py-1 lg:flex"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.09)' }}
          >
            {[
              { href: '/', label: 'Explore' },
              { href: '/regions', label: 'Regions' },
              { href: '/faq', label: 'How it works' },
              { href: '/support', label: 'Support' },
            ].map(({ href, label }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-pill px-4 py-1.5 text-sm font-medium transition-all duration-150 no-underline ${
                    active
                      ? 'bg-electric-400/20 text-electric-300'
                      : 'text-haze hover:text-void'
                  }`}
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
              <Link href="/my-esims" className="relative btn-ghost hidden sm:flex">
                My eSIMs
                <EsimCount />
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="btn-secondary hidden sm:inline-flex">Sign in</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn-primary">Get started</button>
              </SignUpButton>
            </SignedOut>
          </div>
        </div>
      </header>

      {/* Spacer */}
      <div className="h-16" />

      {/* ── Mobile bottom nav ─────────────────────────────────── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
        style={{
          background: 'rgba(13,18,36,0.95)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex h-16 items-center justify-around px-2">
          {[
            { href: '/', icon: Home, label: 'Explore' },
            { href: '/regions', icon: Globe, label: 'Regions' },
            { href: '/my-esims', icon: Wifi, label: 'My eSIMs', auth: true },
            { href: '/account', icon: User, label: 'Account', auth: true },
            { href: '/support', icon: HelpCircle, label: 'Help' },
          ].map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 rounded-card px-3 py-1.5 transition-all no-underline ${
                  active ? 'text-electric-300' : 'text-haze hover:text-void'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'drop-shadow-[0_0_6px_rgba(79,126,255,0.7)]' : ''}`} strokeWidth={active ? 2 : 1.5} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
