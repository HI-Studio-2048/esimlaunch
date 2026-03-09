/**
 * Store and retrieve price history for eSIM plans.
 * Builds real history over time as the page is loaded with (potentially updated) CSV data.
 */

const STORAGE_KEY = "esim_price_history";
const MAX_POINTS_PER_PLAN = 90; // ~3 months of daily data

export interface PricePoint {
  date: string; // YYYY-MM-DD
  price: number;
}

function getStoredHistory(): Record<string, PricePoint[]> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore parse errors
  }
  return {};
}

export function getPriceHistory(planId: string): number[] | null {
  const all = getStoredHistory();
  const points = all[planId];
  if (!points || points.length < 2) return null;
  return points
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => p.price);
}

export function recordPriceSnapshot(
  plans: { planId: string; price: number }[]
): void {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().slice(0, 10);
  const all = getStoredHistory();

  for (const { planId, price } of plans) {
    const points = all[planId] || [];
    const lastIndex = points.findIndex((p) => p.date >= today);
    const existing = points.find((p) => p.date === today);

    if (existing) {
      existing.price = price;
    } else {
      // When no history exists, bootstrap with yesterday + today (same price) so sparkline renders
      const yesterdayStr = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      const toAdd = points.length === 0
        ? [{ date: yesterdayStr, price }, { date: today, price }]
        : [{ date: today, price }];
      const newPoints = [...points, ...toAdd]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-MAX_POINTS_PER_PLAN);
      all[planId] = newPoints;
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // storage full, ignore
  }
}
