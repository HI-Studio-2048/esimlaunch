'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function CountrySkeleton() {
  return (
    <div className="flex h-[88px] items-center justify-between rounded-[18px] border border-[#d2d2d7] bg-white p-5 shadow-card">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-11 rounded-md bg-[#f5f5f7] animate-pulse" />
        <Skeleton className="h-5 w-32 bg-[#f5f5f7] animate-pulse rounded" />
      </div>
    </div>
  );
}
