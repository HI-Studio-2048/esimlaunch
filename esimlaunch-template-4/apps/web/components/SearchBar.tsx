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
    'bg-white border border-[#d2d2d7] pl-12 pr-4 py-4 w-full min-w-0 text-[#1d1d1f] placeholder:text-[#adadb8] focus:ring-2 focus:ring-[#0066cc] focus:border-transparent outline-none transition-all';

  if (trailing) {
    return (
      <div
        className={cn(
          'flex w-full max-w-2xl items-center overflow-hidden rounded-full border border-[#d2d2d7] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-shadow focus-within:shadow-[0_2px_16px_rgba(0,102,204,0.15)] focus-within:ring-2 focus-within:ring-[#0066cc] focus-within:ring-offset-0 focus-within:border-transparent',
          className
        )}
      >
        <div className="relative flex-1 min-w-0 group">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#adadb8] group-focus-within:text-[#0066cc] transition-colors pointer-events-none" />
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
      <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#adadb8] group-focus-within:text-[#0066cc] transition-colors" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClasses, 'rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.08)] focus:shadow-[0_2px_16px_rgba(0,102,204,0.15)]')}
        placeholder={placeholder}
      />
    </div>
  );
}
