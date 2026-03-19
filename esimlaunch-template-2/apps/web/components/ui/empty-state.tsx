'use client';

import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        'border-slate-200 bg-white',
        className
      )}
    >
      <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
        {Icon && (
          <Icon className="mb-4 h-12 w-12 text-slate-400 opacity-50" />
        )}
        <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
        {description && (
          <p className="mb-6 max-w-md text-slate-600">{description}</p>
        )}
        {action && (
          <Button
            onClick={action.onClick}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
