'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Optional trailing element (e.g. submit button) - renders as one pill-shaped unit */
  trailing?: React.ReactNode;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search countries...',
  className,
  trailing,
}: SearchBarProps) {
  const inputClasses =
    'bg-white border border-slate-200 pl-12 pr-4 py-4 w-full min-w-0 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all';

  if (trailing) {
    return (
      <div
        className={cn(
          'flex w-full max-w-2xl items-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-lg transition-shadow focus-within:shadow-violet-500/20 focus-within:ring-2 focus-within:ring-violet-500 focus-within:ring-offset-0 focus-within:border-transparent',
          className
        )}
      >
        <div className="relative flex-1 min-w-0 group">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors pointer-events-none" />
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(inputClasses, 'rounded-l-full border-0 border-r-0 shadow-none focus:ring-0')}
            placeholder={placeholder}
          />
        </div>
        <div className="flex shrink-0 items-center rounded-r-full bg-white pr-2 py-2 pl-1">{trailing}</div>
      </div>
    );
  }

  return (
    <div className={cn('relative w-full max-w-lg group', className)}>
      <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClasses, 'rounded-full shadow-lg focus:shadow-violet-500/20')}
        placeholder={placeholder}
      />
    </div>
  );
}
