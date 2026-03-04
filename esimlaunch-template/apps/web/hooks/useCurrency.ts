'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/apiClient';

const STORAGE_KEY = 'esim_currency';

export function useCurrency() {
  const [currency, setCurrencyState] = useState<string>('USD');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      setCurrencyState(saved);
      return;
    }
    // Detect from backend
    apiFetch<{ currency: string }>('/currency/detect')
      .then((d) => {
        setCurrencyState(d.currency ?? 'USD');
      })
      .catch(() => {});
  }, []);

  const setCurrency = (c: string) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
  };

  return { currency, setCurrency };
}
