'use client';

import { useState, useRef, useEffect } from 'react';
import { CURRENCIES, useCurrency } from '@/contexts/CurrencyContext';

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const current = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
      >
        <span>{current.symbol}</span>
        <span>{current.code}</span>
        <svg className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                setCurrency(c.code);
                setOpen(false);
              }}
              className={`block w-full px-4 py-2 text-left text-sm transition ${
                c.code === currency
                  ? 'bg-violet-50 font-medium text-violet-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {c.symbol} {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
