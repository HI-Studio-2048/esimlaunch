import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';
import { apiClient } from '@/lib/api';

export function BountiesGoalsTab() {
  const { data } = useQuery({
    queryKey: ['affiliate-gamification'],
    queryFn: () => apiClient.getAffiliateGamification(),
    refetchInterval: 60_000,
  });

  if (!data) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Weekly goals — {data.weekly.isoWeek}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {data.weekly.referralCount} referral{data.weekly.referralCount === 1 ? '' : 's'} this week. Resets {new Date(data.weekly.resetsAt).toLocaleString()}.
          </div>
          {data.weekly.tiers.map((t: any) => {
            const pct = Math.min(100, (data.weekly.referralCount / t.target) * 100);
            return (
              <div key={t.key}>
                <div className="flex justify-between text-sm">
                  <span>{t.key.toUpperCase()} · {t.target} referrals → ${t.reward}</span>
                  <span className={t.paid ? 'text-green-600 font-semibold' : 'text-muted-foreground'}>{t.paid ? 'Paid' : `${data.weekly.referralCount}/${t.target}`}</span>
                </div>
                <Progress value={pct} className="mt-1" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Monthly challenge — {data.monthly.month}</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm mb-2">
            Refer {data.monthly.target} merchants this month → <span className="font-bold">${data.monthly.reward}</span>
          </div>
          <Progress value={Math.min(100, (data.monthly.progress / data.monthly.target) * 100)} />
          <div className="text-xs text-muted-foreground mt-1">
            {data.monthly.progress} / {data.monthly.target}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Milestone bounties</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {data.milestones.map((m: any) => (
            <div key={m.key} className="flex items-center gap-3">
              {m.claimedAt ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
              <div className="flex-1">
                <div className="font-medium">{m.threshold} active referral{m.threshold > 1 ? 's' : ''}</div>
                <div className="text-xs text-muted-foreground">
                  {m.claimedAt ? `Claimed ${new Date(m.claimedAt).toLocaleDateString()}` : `${Math.max(0, m.threshold - m.progress)} to go`}
                </div>
              </div>
              <div className="font-bold">${m.reward}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
