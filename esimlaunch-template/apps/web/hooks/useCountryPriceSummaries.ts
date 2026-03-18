'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';

interface PlanSummary {
  lowestPriceUSD: number;
  planCount: number;
}

/**
 * Fetches plan summaries (lowest price + count) per location code.
 * Loads lazily for given location codes.
 * Uses /api/esim/packages/:code which is already cached server-side.
 */
export function useCountryPriceSummaries(
  locationCodes: string[],
): { summaries: Record<string, PlanSummary>; loading: boolean } {
  const [summaries, setSummaries] = useState<Record<string, PlanSummary>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (locationCodes.length === 0) return;

    // Only fetch codes we don't already have
    const missing = locationCodes.filter((c) => !summaries[c]);
    if (missing.length === 0) return;

    setLoading(true);
    let cancelled = false;

    // Fetch in batches of 10 to avoid overwhelming the server
    const batchSize = 10;
    const batches: string[][] = [];
    for (let i = 0; i < missing.length; i += batchSize) {
      batches.push(missing.slice(i, i + batchSize));
    }

    (async () => {
      const newSummaries: Record<string, PlanSummary> = {};

      for (const batch of batches) {
        if (cancelled) break;
        const results = await Promise.allSettled(
          batch.map(async (code) => {
            const plans = await apiFetch<{ packageCode: string; price: number }[]>(
              `/esim/packages/${code}`,
            );
            const prices = plans
              .map((p) => p.price / 10000) // provider units → USD
              .filter((p) => p > 0);
            return {
              code,
              lowestPriceUSD: prices.length > 0 ? Math.min(...prices) : 0,
              planCount: plans.length,
            };
          }),
        );
        for (const r of results) {
          if (r.status === 'fulfilled') {
            newSummaries[r.value.code] = {
              lowestPriceUSD: r.value.lowestPriceUSD,
              planCount: r.value.planCount,
            };
          }
        }
      }

      if (!cancelled) {
        setSummaries((prev) => ({ ...prev, ...newSummaries }));
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [locationCodes.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return { summaries, loading };
}
