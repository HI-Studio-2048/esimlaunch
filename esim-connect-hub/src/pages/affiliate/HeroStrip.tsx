import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/lib/api';
import { TIER_META, TierKey } from './tierBadges';

export function HeroStrip() {
  const { data } = useQuery({
    queryKey: ['affiliate-gamification'],
    queryFn: () => apiClient.getAffiliateGamification(),
    refetchInterval: 60_000,
  });

  if (!data) return null;

  const tier: TierKey = data.tier.current;
  const meta = TIER_META[tier];
  const progressPct = data.tier.nextThreshold
    ? Math.min(100, (data.tier.activeReferrals / data.tier.nextThreshold) * 100)
    : 100;

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white">
        <div className="text-sm opacity-90">Affiliate Program</div>
        <div className="text-xl font-bold">Earn 40% of every referred merchant's subscription — for life.</div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <Badge className={`${meta.bg} ${meta.color}`}>{meta.label}</Badge>
              <div className="text-xs text-muted-foreground mt-1">
                {data.tier.next
                  ? `${data.tier.nextThreshold - data.tier.activeReferrals} more active referrals to ${TIER_META[data.tier.next as TierKey].label}`
                  : 'Top tier reached'}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {data.tier.activeReferrals} / {data.tier.nextThreshold ?? '∞'}
            </div>
          </div>
          <Progress value={progressPct} className="mt-3" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4">
          <div className="text-xs text-muted-foreground">Recurring (est. / 30 days)</div>
          <div className="text-2xl font-bold">${data.recurring.monthlyEstimate.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">{data.recurring.activeRecurring} active subs</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-xs text-muted-foreground">Active referrals</div>
          <div className="text-2xl font-bold">{data.tier.activeReferrals}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-xs text-muted-foreground">This month's challenge</div>
          <div className="text-2xl font-bold">{data.monthly.progress} / {data.monthly.target}</div>
          <div className="text-xs text-muted-foreground">${data.monthly.reward} reward</div>
        </CardContent></Card>
      </div>
    </div>
  );
}
