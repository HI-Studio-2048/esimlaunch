'use client';

import { useState, useEffect, useRef } from 'react';
import {
  getTimeRemaining,
  formatRemainingShort,
  getUrgencyLevel,
  formatFullExpiryDate,
  type TimeRemaining,
  type UrgencyLevel,
} from '@/lib/format-expiry';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { safeFetch } from '@/lib/safe-fetch';
import { toast } from '@/components/ui/use-toast';

interface ExpiryCountdownProps {
  expiry: string | Date | null | undefined;
  className?: string;
  iccid?: string;
  onExpired?: () => void;
  getToken?: () => Promise<string | null>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api';

export function ExpiryCountdown({
  expiry,
  className,
  iccid,
  onExpired,
  getToken,
}: ExpiryCountdownProps) {
  const [now, setNow] = useState(Date.now());
  const [time, setTime] = useState<TimeRemaining | null>(null);
  const [urgency, setUrgency] = useState<UrgencyLevel>('safe');
  const [hasNotifiedExpiry, setHasNotifiedExpiry] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const prevExpiredRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const remaining = getTimeRemaining(expiry);
    setTime(remaining);
    setUrgency(getUrgencyLevel(remaining));

    const isExpired = remaining === null || remaining.totalMs <= 0;
    const wasExpired = prevExpiredRef.current;

    if (isExpired && !wasExpired && !hasNotifiedExpiry) {
      setHasNotifiedExpiry(true);

      if (onExpired) {
        onExpired();
      }

      toast({
        title: 'Your eSIM has expired',
        description: 'Buy a new plan to continue using data',
        variant: 'destructive',
      });

      if (iccid) {
        handleSync();
      }
    }

    prevExpiredRef.current = isExpired;
  }, [now, expiry, iccid, hasNotifiedExpiry, onExpired]);

  const handleSync = async () => {
    if (!iccid || isSyncing) return;

    if (!getToken) {
      return;
    }

    setIsSyncing(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await safeFetch(`${API_BASE}/esim/${iccid}/sync`, {
        method: 'POST',
        headers,
        showToast: false,
      });

      if (onExpired) {
        onExpired();
      }
    } catch {
      // Sync endpoint may not exist in template backend - ignore
    } finally {
      setIsSyncing(false);
    }
  };

  if (!expiry) {
    return (
      <span className={cn('font-medium', className)} style={{ color: 'var(--text-muted)' }}>
        Expiry unknown
      </span>
    );
  }

  if (!time) {
    return (
      <span className={cn('font-medium', className)} style={{ color: 'var(--text-muted)' }}>
        Invalid date
      </span>
    );
  }

  const isExpired = time.totalMs <= 0;
  const displayText = isExpired ? 'Expired' : formatRemainingShort(time);
  const fullDate = formatFullExpiryDate(expiry);

  const urgencyColors: Record<UrgencyLevel, string> = {
    safe: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    expired: '#ef4444',
  };

  const countdownElement = (
    <span
      className={cn('font-medium transition-colors', className)}
      style={{ color: urgencyColors[urgency] }}
    >
      {displayText}
    </span>
  );

  if (isExpired) {
    return countdownElement;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {countdownElement}
        </TooltipTrigger>
        <TooltipContent
          style={{
            backgroundColor: 'var(--night-100)',
            color: 'var(--text)',
            borderColor: 'var(--border-bright)',
          }}
        >
          <div className="space-y-1">
            <p className="font-semibold">Expires: {fullDate}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {time.days > 0 && `${time.days} day${time.days !== 1 ? 's' : ''}, `}
              {time.hours > 0 &&
                `${time.hours} hour${time.hours !== 1 ? 's' : ''}, `}
              {time.minutes > 0 &&
                `${time.minutes} minute${time.minutes !== 1 ? 's' : ''}, `}
              {time.seconds} second{time.seconds !== 1 ? 's' : ''} remaining
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
