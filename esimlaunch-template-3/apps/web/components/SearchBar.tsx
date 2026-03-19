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
  const inputStyle: React.CSSProperties = {
    background: 'var(--night-50)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
  };

  const inputClasses =
    'pl-12 pr-4 py-4 w-full min-w-0 placeholder:text-[var(--text-muted)] focus:ring-2 focus:border-transparent outline-none transition-all';

  if (trailing) {
    return (
      <div
        className={cn(
          'flex w-full max-w-2xl items-center overflow-hidden rounded-full shadow-lg transition-shadow',
          className
        )}
        style={{
          border: '1px solid var(--border)',
          background: 'var(--night-50)',
        }}
      >
        <div className="relative flex-1 min-w-0 group">
          <Search
            className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(inputClasses, 'rounded-l-full border-0 border-r-0 shadow-none focus:ring-0')}
            style={{ ...inputStyle, border: 'none', background: 'transparent' }}
            placeholder={placeholder}
          />
        </div>
        <div
          className="flex shrink-0 items-center rounded-r-full pr-2 py-2 pl-1"
          style={{ background: 'transparent' }}
        >
          {trailing}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative w-full max-w-lg group', className)}>
      <Search
        className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors"
        style={{ color: 'var(--text-muted)' }}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClasses, 'rounded-full shadow-lg')}
        style={inputStyle}
        placeholder={placeholder}
      />
    </div>
  );
}
