'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function CountrySkeleton() {
  return (
    <div
      className="flex h-[88px] items-center justify-between rounded-xl border p-5"
      style={{
        backgroundColor: 'var(--night-50)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-center gap-4">
        <Skeleton
          className="h-10 w-11 rounded-md"
          style={{ backgroundColor: 'var(--night-100)' }}
        />
        <Skeleton
          className="h-5 w-32"
          style={{ backgroundColor: 'var(--night-100)' }}
        />
      </div>
    </div>
  );
}
