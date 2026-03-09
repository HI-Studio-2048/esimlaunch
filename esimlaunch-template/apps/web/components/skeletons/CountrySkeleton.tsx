'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function CountrySkeleton() {
  return (
    <div className="flex h-[88px] items-center justify-between rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-11 rounded-md" />
        <Skeleton className="h-5 w-32" />
      </div>
    </div>
  );
}
