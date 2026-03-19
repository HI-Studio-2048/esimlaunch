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
        className="flex items-center gap-1.5 rounded-btn border border-surface-border bg-white px-3 py-2 text-sm font-medium text-ink transition hover:border-teal-400 hover:bg-surface-soft"
      >
        <span>{current.symbol}</span>
        <span>{current.code}</span>
        <svg className={`h-4 w-4 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-card border border-surface-border bg-white py-2 shadow-lg">
          {currencies.map((c) => {
            const isSelected = c.code === currency;
            const primaryColor = branding.primaryColor ?? '#2dd4bf';
            return (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                setCurrency(c.code);
                setOpen(false);
              }}
              className={`block w-full px-4 py-2 text-left text-sm transition ${
                isSelected ? 'font-medium' : 'text-ink hover:bg-surface-soft'
              }`}
              style={isSelected ? { backgroundColor: `${primaryColor}15`, color: primaryColor } : undefined}
            >
              {c.symbol} {c.label}
            </button>
          );})}
        </div>
      )}
    </div>
  );
}
