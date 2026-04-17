export type TierKey = 'bronze' | 'silver' | 'gold' | 'platinum';

export const TIER_META: Record<TierKey, { label: string; color: string; bg: string }> = {
  bronze:   { label: 'Bronze',   color: 'text-amber-700',  bg: 'bg-amber-100' },
  silver:   { label: 'Silver',   color: 'text-slate-700',  bg: 'bg-slate-200' },
  gold:     { label: 'Gold',     color: 'text-yellow-800', bg: 'bg-yellow-100' },
  platinum: { label: 'Platinum', color: 'text-indigo-800', bg: 'bg-indigo-100' },
};

export function avatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed)}`;
}
