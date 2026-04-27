export type AffiliateTierKey = 'bronze' | 'silver' | 'gold' | 'platinum';

export const AFFILIATE_TIERS: ReadonlyArray<{
  key: AffiliateTierKey;
  label: string;
  minActiveReferrals: number;
  perOrderRate: number;
}> = [
  { key: 'bronze',   label: 'Bronze',   minActiveReferrals: 0,  perOrderRate: 10 },
  { key: 'silver',   label: 'Silver',   minActiveReferrals: 5,  perOrderRate: 12 },
  { key: 'gold',     label: 'Gold',     minActiveReferrals: 15, perOrderRate: 15 },
  { key: 'platinum', label: 'Platinum', minActiveReferrals: 30, perOrderRate: 20 },
] as const;

export const SUBSCRIPTION_COMMISSION_RATE = 40; // flat for all tiers, lifetime

export const MILESTONE_BOUNTIES: ReadonlyArray<{
  key: string;
  threshold: number;
  amountCents: number;
}> = [
  { key: 'milestone_1',  threshold: 1,  amountCents: 1000 },
  { key: 'milestone_5',  threshold: 5,  amountCents: 5000 },
  { key: 'milestone_10', threshold: 10, amountCents: 12500 },
  { key: 'milestone_25', threshold: 25, amountCents: 30000 },
  { key: 'milestone_50', threshold: 50, amountCents: 75000 },
] as const;

export const WEEKLY_GOALS: ReadonlyArray<{
  key: 'bronze' | 'silver' | 'gold';
  target: number;
  amountCents: number;
}> = [
  { key: 'bronze', target: 1, amountCents: 1000 },
  { key: 'silver', target: 3, amountCents: 3000 },
  { key: 'gold',   target: 5, amountCents: 6000 },
] as const;

export const MONTHLY_CHALLENGE = {
  target: 3,
  amountCents: 5000,
} as const;

export const HANDLE_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export function tierForActiveReferrals(n: number): AffiliateTierKey {
  let current: AffiliateTierKey = 'bronze';
  for (const t of AFFILIATE_TIERS) {
    if (n >= t.minActiveReferrals) current = t.key;
  }
  return current;
}

export function perOrderRateForTier(tier: AffiliateTierKey): number {
  return AFFILIATE_TIERS.find(t => t.key === tier)?.perOrderRate ?? 10;
}

/** Return the ISO week string in UTC, e.g. "2026-W16". */
export function isoWeekUTC(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
