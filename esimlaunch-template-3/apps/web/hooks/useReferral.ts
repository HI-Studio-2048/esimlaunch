'use client';
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'esim_referral_code';

export function useReferral() {
  const [referralCode, setReferralCodeState] = useState<string | null>(null);

  useEffect(() => {
    // Check URL params first
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('ref');
    if (urlCode) {
      localStorage.setItem(STORAGE_KEY, urlCode);
      setReferralCodeState(urlCode);
      return;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    setReferralCodeState(saved);
  }, []);

  const clearReferral = () => {
    localStorage.removeItem(STORAGE_KEY);
    setReferralCodeState(null);
  };

  return { referralCode, clearReferral };
}
