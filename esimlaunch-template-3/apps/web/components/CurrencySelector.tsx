'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ALL_CURRENCIES, useCurrency } from '@/contexts/CurrencyContext';
import { useStoreConfig } from '@/contexts/StoreConfigContext';

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const { supportedCurrencies, branding } = useStoreConfig();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currencies = useMemo(
    () =>
      supportedCurrencies.length > 0
        ? ALL_CURRENCIES.filter((c) => supportedCurrencies.includes(c.code))
        : ALL_CURRENCIES,
    [supportedCurrencies],
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const current = currencies.find((c) => c.code === currency) ?? currencies[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition"
        style={{
          background: 'var(--night-50)',
          border: '1px solid var(--border-bright)',
          color: 'var(--text)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.22)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-bright)';
        }}
      >
        <span>{current.symbol}</span>
        <span>{current.code}</span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-muted)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-40 rounded-xl py-2"
          style={{
            background: 'var(--night-50)',
            border: '1px solid var(--border-bright)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {currencies.map((c) => {
            const isSelected = c.code === currency;
            const primaryColor = branding.primaryColor ?? '#4f7eff';
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  setCurrency(c.code);
                  setOpen(false);
                }}
                className="block w-full px-4 py-2 text-left text-sm transition"
                style={
                  isSelected
                    ? { backgroundColor: `${primaryColor}20`, color: primaryColor, fontWeight: 600 }
                    : { color: 'var(--text)' }
                }
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'var(--night-100)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                {c.symbol} {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
