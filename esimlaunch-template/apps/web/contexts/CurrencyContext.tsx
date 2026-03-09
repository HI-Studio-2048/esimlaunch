'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { apiFetch } from '@/lib/apiClient';

const STORAGE_KEY = 'esim_currency';

export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD' },
  { code: 'EUR', symbol: '€', label: 'EUR' },
  { code: 'GBP', symbol: '£', label: 'GBP' },
  { code: 'AUD', symbol: 'A$', label: 'AUD' },
  { code: 'CAD', symbol: 'C$', label: 'CAD' },
  { code: 'CHF', symbol: 'CHF', label: 'CHF' },
  { code: 'JPY', symbol: '¥', label: 'JPY' },
];

interface CurrencyContextValue {
  currency: string;
  setCurrency: (c: string) => void;
  formatUsdCents: (usdCents: number) => string;
  formatProviderPrice: (providerPrice: number) => string;
  ratesReady: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<string>('USD');
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });
  const [ratesReady, setRatesReady] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved && CURRENCIES.some((c) => c.code === saved)) {
      setCurrencyState(saved);
    } else {
      apiFetch<{ currency: string }>('/currency/detect')
        .then((d) => {
          if (d.currency && CURRENCIES.some((c) => c.code === d.currency)) {
            setCurrencyState(d.currency);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    apiFetch<Record<string, number>>('/currency/rates')
      .then((data) => {
        if (data && Object.keys(data).length > 0) {
          setRates(data);
        }
        setRatesReady(true);
      })
      .catch(() => {
        // Fallback when API fails (e.g. backend down, CORS) – approximate rates
        setRates({
          USD: 1,
          EUR: 0.92,
          GBP: 0.79,
          AUD: 1.53,
          CAD: 1.36,
          CHF: 0.88,
          JPY: 150,
        });
        setRatesReady(true);
      });
  }, []);

  const setCurrency = useCallback((c: string) => {
    if (CURRENCIES.some((x) => x.code === c)) {
      setCurrencyState(c);
      if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, c);
    }
  }, []);

  const formatUsdCents = useCallback(
    (usdCents: number): string => {
      const rate = rates[currency] ?? 1;
      const localCents = currency === 'USD' ? usdCents : Math.round(usdCents * rate);
      const value = currency === 'JPY' ? localCents : localCents / 100;
      return new Intl.NumberFormat(currency === 'JPY' ? 'ja-JP' : 'en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: currency === 'JPY' ? 0 : 2,
        maximumFractionDigits: currency === 'JPY' ? 0 : 2,
      }).format(value);
    },
    [currency, rates],
  );

  const formatProviderPrice = useCallback(
    (providerPrice: number): string => {
      const safe = typeof providerPrice === 'number' && !Number.isNaN(providerPrice) ? providerPrice : 0;
      const usdCents = Math.round((safe / 10000) * 100);
      return formatUsdCents(usdCents);
    },
    [formatUsdCents],
  );

  const value: CurrencyContextValue = {
    currency,
    setCurrency,
    formatUsdCents,
    formatProviderPrice,
    ratesReady,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return ctx;
}
