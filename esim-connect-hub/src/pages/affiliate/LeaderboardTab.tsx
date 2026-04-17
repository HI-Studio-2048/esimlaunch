import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { TIER_META, TierKey, avatarUrl } from './tierBadges';

export function LeaderboardTab() {
  const [range, setRange] = useState<'all' | 'month' | 'week'>('all');

  const { data } = useQuery({
    queryKey: ['affiliate-leaderboard', range],
    queryFn: () => apiClient.getAffiliateLeaderboard(range),
    refetchInterval: 60_000,
  });

  const rows = data?.top ?? [];

  return (
    <Tabs value={range} onValueChange={(v) => setRange(v as any)}>
      <TabsList>
        <TabsTrigger value="all">All-Time</TabsTrigger>
        <TabsTrigger value="month">This Month</TabsTrigger>
        <TabsTrigger value="week">This Week</TabsTrigger>
      </TabsList>
      <TabsContent value={range}>
        <Card>
          <CardContent className="pt-4 space-y-2">
            {rows.map((r: any) => (
              <Row key={`${r.rank}-${r.handle}`} row={r} />
            ))}
            {data?.me && !rows.find((r: any) => r.isMe) && (
              <>
                <div className="border-t my-2" />
                <Row row={data.me} />
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function Row({ row }: { row: any }) {
  const meta = TIER_META[row.tier as TierKey] ?? TIER_META.bronze;
  return (
    <div className={`flex items-center gap-3 p-2 rounded ${row.isMe ? 'bg-indigo-50' : ''}`}>
      <div className="w-8 text-right font-semibold text-muted-foreground">#{row.rank}</div>
      <img src={avatarUrl(row.avatarSeed)} alt="" className="w-8 h-8 rounded-full" />
      <div className="flex-1">
        <div className="font-medium">{row.handle}{row.isMe && <span className="text-xs text-indigo-600 ml-2">(you)</span>}</div>
        <Badge className={`${meta.bg} ${meta.color} text-[10px]`}>{meta.label}</Badge>
      </div>
      <div className="font-bold">${row.earnings.toFixed(2)}</div>
    </div>
  );
}
