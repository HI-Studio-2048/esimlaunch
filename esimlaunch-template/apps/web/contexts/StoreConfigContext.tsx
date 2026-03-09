'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { apiFetch } from '@/lib/apiClient';

export interface StoreBranding {
  businessName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string | null;
}

export interface StoreConfigState {
  branding: StoreBranding;
  currency: string;
  supportedCurrencies: string[];
  templateSettings?: Record<string, unknown>;
  isLoading: boolean;
}

const DEFAULT_BRANDING: StoreBranding = { businessName: 'eSIM Store' };
const DEFAULT_CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'CHF', 'JPY'];

const StoreConfigContext = createContext<StoreConfigState | null>(null);

export function StoreConfigProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreConfigState>({
    branding: DEFAULT_BRANDING,
    currency: 'USD',
    supportedCurrencies: DEFAULT_CURRENCIES,
    templateSettings: undefined,
    isLoading: true,
  });

  useEffect(() => {
    apiFetch<{
      branding?: StoreBranding;
      currency?: string;
      supportedCurrencies?: string[];
      templateSettings?: Record<string, unknown>;
    }>('/esim/store-config')
      .then((data) => {
        setState({
          branding: data.branding ?? DEFAULT_BRANDING,
          currency: data.currency ?? 'USD',
          supportedCurrencies:
            Array.isArray(data.supportedCurrencies) && data.supportedCurrencies.length > 0
              ? data.supportedCurrencies
              : DEFAULT_CURRENCIES,
          templateSettings: data.templateSettings,
          isLoading: false,
        });
      })
      .catch(() => {
        setState((prev) => ({ ...prev, isLoading: false }));
      });
  }, []);

  return (
    <StoreConfigContext.Provider value={state}>
      {children}
    </StoreConfigContext.Provider>
  );
}

export function useStoreConfig(): StoreConfigState {
  const ctx = useContext(StoreConfigContext);
  return ctx ?? {
    branding: DEFAULT_BRANDING,
    currency: 'USD',
    supportedCurrencies: DEFAULT_CURRENCIES,
    templateSettings: undefined,
    isLoading: false,
  };
}
